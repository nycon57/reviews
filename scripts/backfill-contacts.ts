/**
 * One-time backfill: build the Contacts graph from the six legacy PII sources
 * (ADR 0004). Creates a Contact per (organization, normalized email), links the
 * request/review rows back to it, and folds legacy email unsubscribes into
 * Suppression.
 *
 * Sources and how each is used:
 *   - surveys                     → Contact + link surveys.contact_id
 *   - video_testimonial_requests  → Contact + link video_testimonial_requests.contact_id
 *   - profile_referrals           → Contact (the REFERRED person) + link contact_id
 *   - reviews WHERE source='direct' → Contact + link reviews.contact_id
 *   - salesforce_contact_mappings → Contact only (no link column; deduped by upsert)
 *   - email_unsubscribes          → Suppression only (no Contact fabricated)
 *
 * Owner = the professional (user_id) on the MOST RECENT sighting for that
 * Contact. First-seen `source` = the earliest sighting. Name/phone = freshest
 * non-empty sighting.
 *
 * Unsubscribe handling (deliberate, per ADR 0004 + Grill #2):
 *   - An unsubscribe for an email we already have a Contact for → contact-linked
 *     Suppression.
 *   - An unsubscribe for an email with NO Contact → a tombstone Suppression
 *     (contact_id NULL, keyed on org + email hash). We do NOT fabricate a
 *     Contact for an unsubscribe-only email; the tombstone makes the send-time
 *     check block that email the moment it ever becomes a Contact.
 *   - An unsubscribe with NO organization_id is skipped: those are platform-user
 *     unsubscribes handled by the token preference center (Grill #2 decision 6),
 *     not acquisition Suppression. Contacts and Suppression are org-scoped and
 *     an unattributable org would be a guess.
 *
 * Idempotent: contacts upsert by (org, email); links only touch rows where
 * contact_id IS NULL; suppressions are existence-checked before insert. Safe to
 * re-run.
 *
 * Run (LOCAL / dev DB only — do NOT point at a remote/prod DB):
 *   npx tsx --env-file=.env scripts/backfill-contacts.ts
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  normalizeEmail,
  normalizePhone,
  sha256Email,
} from "../src/lib/contacts/identity";

type ContactSource =
  | "survey"
  | "video_testimonial"
  | "salesforce"
  | "referral"
  | "direct_review";

/** One appearance of a person in a source table. */
interface Sighting {
  organizationId: string;
  email: string; // normalized
  name: string | null;
  phone: string | null;
  ownerUserId: string | null;
  time: number; // epoch ms, for most-recent/earliest resolution
  source: ContactSource;
  table: LinkableTable | "salesforce_contact_mappings";
  rowId: string;
  hadContactId: boolean; // already linked (skip during link step)
}

type LinkableTable =
  | "surveys"
  | "video_testimonial_requests"
  | "profile_referrals"
  | "reviews";

function keyOf(organizationId: string, email: string): string {
  return `${organizationId}|${email}`;
}

function toTime(...candidates: Array<string | null | undefined>): number {
  for (const c of candidates) {
    if (c) {
      const t = Date.parse(c);
      if (!Number.isNaN(t)) return t;
    }
  }
  return 0;
}

/** Page through a table so the backfill isn't capped at the 1000-row default. */
async function fetchAll(
  supabase: SupabaseClient,
  table: string,
  columns: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped query builder for new/dynamic tables
  filter?: (q: any) => any
): Promise<Record<string, unknown>[]> {
  const pageSize = 1000;
  let from = 0;
  const rows: Record<string, unknown>[] = [];
  for (;;) {
    let query = supabase.from(table).select(columns).range(from, from + pageSize - 1);
    if (filter) query = filter(query);
    const { data, error } = await query;
    if (error) throw new Error(`fetchAll(${table}) failed: ${error.message}`);
    const batch = (data ?? []) as unknown as Record<string, unknown>[];
    rows.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

function pushSighting(sightings: Sighting[], s: Sighting | null): void {
  if (s) sightings.push(s);
}

async function collectSightings(supabase: SupabaseClient): Promise<{
  sightings: Sighting[];
  skippedNoEmail: number;
}> {
  const sightings: Sighting[] = [];
  let skippedNoEmail = 0;

  const note = (email: string | null): boolean => {
    if (!email) skippedNoEmail++;
    return email != null;
  };

  // surveys
  for (const r of await fetchAll(
    supabase,
    "surveys",
    "id, organization_id, user_id, customer_name, customer_email, customer_phone, created_at, sent_at, contact_id"
  )) {
    const email = normalizeEmail(r.customer_email as string | null);
    if (!note(email)) continue;
    pushSighting(sightings, {
      organizationId: r.organization_id as string,
      email: email as string,
      name: (r.customer_name as string | null) ?? null,
      phone: normalizePhone(r.customer_phone as string | null),
      ownerUserId: (r.user_id as string | null) ?? null,
      time: toTime(r.sent_at as string | null, r.created_at as string | null),
      source: "survey",
      table: "surveys",
      rowId: r.id as string,
      hadContactId: r.contact_id != null,
    });
  }

  // video_testimonial_requests
  for (const r of await fetchAll(
    supabase,
    "video_testimonial_requests",
    "id, organization_id, user_id, customer_name, customer_email, customer_phone, created_at, sent_at, contact_id"
  )) {
    const email = normalizeEmail(r.customer_email as string | null);
    if (!note(email)) continue;
    pushSighting(sightings, {
      organizationId: r.organization_id as string,
      email: email as string,
      name: (r.customer_name as string | null) ?? null,
      phone: normalizePhone(r.customer_phone as string | null),
      ownerUserId: (r.user_id as string | null) ?? null,
      time: toTime(r.sent_at as string | null, r.created_at as string | null),
      source: "video_testimonial",
      table: "video_testimonial_requests",
      rowId: r.id as string,
      hadContactId: r.contact_id != null,
    });
  }

  // profile_referrals — the Contact is the REFERRED person.
  for (const r of await fetchAll(
    supabase,
    "profile_referrals",
    "id, organization_id, user_id, referred_name, referred_email, referred_phone, created_at, contact_id"
  )) {
    const email = normalizeEmail(r.referred_email as string | null);
    if (!note(email)) continue;
    pushSighting(sightings, {
      organizationId: r.organization_id as string,
      email: email as string,
      name: (r.referred_name as string | null) ?? null,
      phone: normalizePhone(r.referred_phone as string | null),
      ownerUserId: (r.user_id as string | null) ?? null,
      time: toTime(r.created_at as string | null),
      source: "referral",
      table: "profile_referrals",
      rowId: r.id as string,
      hadContactId: r.contact_id != null,
    });
  }

  // reviews WHERE source='direct' — reviewer identity (no phone column).
  for (const r of await fetchAll(
    supabase,
    "reviews",
    "id, organization_id, user_id, customer_name, customer_email, created_at, review_date, contact_id",
    (q) => q.eq("source", "direct")
  )) {
    const email = normalizeEmail(r.customer_email as string | null);
    if (!note(email)) continue;
    pushSighting(sightings, {
      organizationId: r.organization_id as string,
      email: email as string,
      name: (r.customer_name as string | null) ?? null,
      phone: null,
      ownerUserId: (r.user_id as string | null) ?? null,
      time: toTime(r.review_date as string | null, r.created_at as string | null),
      source: "direct_review",
      table: "reviews",
      rowId: r.id as string,
      hadContactId: r.contact_id != null,
    });
  }

  // salesforce_contact_mappings — Contact only, no link column.
  for (const r of await fetchAll(
    supabase,
    "salesforce_contact_mappings",
    "id, organization_id, user_id, customer_name, customer_email, customer_phone, created_at, last_synced_at"
  )) {
    const email = normalizeEmail(r.customer_email as string | null);
    if (!note(email)) continue;
    pushSighting(sightings, {
      organizationId: r.organization_id as string,
      email: email as string,
      name: (r.customer_name as string | null) ?? null,
      phone: normalizePhone(r.customer_phone as string | null),
      ownerUserId: (r.user_id as string | null) ?? null,
      time: toTime(r.last_synced_at as string | null, r.created_at as string | null),
      source: "salesforce",
      table: "salesforce_contact_mappings",
      rowId: r.id as string,
      hadContactId: false,
    });
  }

  return { sightings, skippedNoEmail };
}

interface ResolvedContact {
  organizationId: string;
  email: string;
  name: string | null;
  phone: string | null;
  ownerUserId: string | null;
  source: ContactSource;
  earliest: number;
}

/** Collapse sightings into one resolved Contact per (org, email). */
function resolveContacts(sightings: Sighting[]): Map<string, ResolvedContact> {
  const byKey = new Map<string, Sighting[]>();
  for (const s of sightings) {
    const k = keyOf(s.organizationId, s.email);
    const list = byKey.get(k);
    if (list) list.push(s);
    else byKey.set(k, [s]);
  }

  const resolved = new Map<string, ResolvedContact>();
  for (const [k, list] of byKey) {
    const byTimeDesc = [...list].sort((a, b) => b.time - a.time);
    const byTimeAsc = [...list].sort((a, b) => a.time - b.time);
    const owner = byTimeDesc.find((s) => s.ownerUserId)?.ownerUserId ?? null;
    const name = byTimeDesc.find((s) => s.name && s.name.trim())?.name?.trim() ?? null;
    const phone = byTimeDesc.find((s) => s.phone)?.phone ?? null;
    resolved.set(k, {
      organizationId: list[0].organizationId,
      email: list[0].email,
      name,
      phone,
      ownerUserId: owner,
      source: byTimeAsc[0].source,
      earliest: byTimeAsc[0].time,
    });
  }
  return resolved;
}

async function upsertContacts(
  supabase: SupabaseClient,
  resolved: Map<string, ResolvedContact>
): Promise<{ contactIds: Map<string, string>; created: number; updated: number }> {
  const contactIds = new Map<string, string>();
  let created = 0;
  let updated = 0;

  for (const [k, c] of resolved) {
    const emailSha256 = sha256Email(c.email);

    const { data: existing, error: findError } = await supabase
      .from("contacts")
      .select("id")
      .eq("organization_id", c.organizationId)
      .eq("email", c.email)
      .is("erased_at", null)
      .maybeSingle();
    if (findError) throw new Error(`contacts lookup failed: ${findError.message}`);

    if (existing) {
      const id = (existing as { id: string }).id;
      const patch: Record<string, unknown> = {};
      if (c.ownerUserId) patch.owner_user_id = c.ownerUserId;
      if (c.name) patch.name = c.name;
      if (c.phone) patch.phone = c.phone;
      if (Object.keys(patch).length > 0) {
        const { error } = await supabase.from("contacts").update(patch).eq("id", id);
        if (error) throw new Error(`contacts update failed: ${error.message}`);
        updated++;
      }
      contactIds.set(k, id);
      continue;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("contacts")
      .insert({
        organization_id: c.organizationId,
        owner_user_id: c.ownerUserId,
        name: c.name,
        email: c.email,
        phone: c.phone,
        source: c.source,
        email_sha256: emailSha256,
        created_at: c.earliest > 0 ? new Date(c.earliest).toISOString() : undefined,
      })
      .select("id")
      .single();
    if (insertError) throw new Error(`contacts insert failed: ${insertError.message}`);
    contactIds.set(k, (inserted as { id: string }).id);
    created++;
  }

  return { contactIds, created, updated };
}

async function linkSources(
  supabase: SupabaseClient,
  sightings: Sighting[],
  contactIds: Map<string, string>
): Promise<Record<LinkableTable, number>> {
  // Group unlinked row ids by (table, contactId) for batched updates.
  const groups = new Map<string, { table: LinkableTable; contactId: string; ids: string[] }>();
  for (const s of sightings) {
    if (s.hadContactId) continue;
    if (s.table === "salesforce_contact_mappings") continue; // no link column
    const contactId = contactIds.get(keyOf(s.organizationId, s.email));
    if (!contactId) continue;
    const gk = `${s.table}|${contactId}`;
    const g = groups.get(gk);
    if (g) g.ids.push(s.rowId);
    else groups.set(gk, { table: s.table, contactId, ids: [s.rowId] });
  }

  const linked: Record<LinkableTable, number> = {
    surveys: 0,
    video_testimonial_requests: 0,
    profile_referrals: 0,
    reviews: 0,
  };

  for (const { table, contactId, ids } of groups.values()) {
    // Chunk the IN list so the URL doesn't blow up on huge orgs.
    for (let i = 0; i < ids.length; i += 200) {
      const chunk = ids.slice(i, i + 200);
      const { error } = await supabase
        .from(table)
        .update({ contact_id: contactId })
        .in("id", chunk)
        .is("contact_id", null);
      if (error) throw new Error(`link ${table} failed: ${error.message}`);
      linked[table] += chunk.length;
    }
  }

  return linked;
}

async function foldUnsubscribes(
  supabase: SupabaseClient,
  contactIds: Map<string, string>
): Promise<{ linkedSuppressions: number; tombstones: number; skippedNoOrg: number }> {
  let linkedSuppressions = 0;
  let tombstones = 0;
  let skippedNoOrg = 0;

  const rows = await fetchAll(
    supabase,
    "email_unsubscribes",
    "id, email, organization_id, reason, unsubscribed_at"
  );

  for (const r of rows) {
    const organizationId = r.organization_id as string | null;
    if (!organizationId) {
      skippedNoOrg++;
      continue;
    }
    const email = normalizeEmail(r.email as string | null);
    const emailSha256 = sha256Email(r.email as string | null);
    if (!email || !emailSha256) continue;

    const contactId = contactIds.get(keyOf(organizationId, email));

    if (contactId) {
      const { data: existing, error: findError } = await supabase
        .from("contact_suppressions")
        .select("id")
        .eq("contact_id", contactId)
        .eq("channel", "email")
        .maybeSingle();
      if (findError) throw new Error(`suppression lookup failed: ${findError.message}`);
      if (!existing) {
        const { error } = await supabase.from("contact_suppressions").insert({
          contact_id: contactId,
          organization_id: organizationId,
          email_sha256: emailSha256,
          channel: "email",
          reason: "unsubscribed",
          source: "legacy_email_unsubscribes",
        });
        if (error) throw new Error(`suppression insert failed: ${error.message}`);
        linkedSuppressions++;
      }
      continue;
    }

    // No Contact — tombstone suppression keyed on (org, hash, channel).
    const { data: existingTombstone, error: tombError } = await supabase
      .from("contact_suppressions")
      .select("id")
      .is("contact_id", null)
      .eq("organization_id", organizationId)
      .eq("email_sha256", emailSha256)
      .eq("channel", "email")
      .maybeSingle();
    if (tombError) throw new Error(`tombstone lookup failed: ${tombError.message}`);
    if (!existingTombstone) {
      const { error } = await supabase.from("contact_suppressions").insert({
        contact_id: null,
        organization_id: organizationId,
        email_sha256: emailSha256,
        channel: "email",
        reason: "unsubscribed",
        source: "legacy_email_unsubscribes",
      });
      if (error) throw new Error(`tombstone insert failed: ${error.message}`);
      tombstones++;
    }
  }

  return { linkedSuppressions, tombstones, skippedNoOrg };
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Collecting sightings from the six PII sources…");
  const { sightings, skippedNoEmail } = await collectSightings(supabase);
  const resolved = resolveContacts(sightings);
  console.log(`  ${sightings.length} sightings → ${resolved.size} distinct (org, email) Contacts`);

  console.log("Upserting Contacts…");
  const { contactIds, created, updated } = await upsertContacts(supabase, resolved);

  console.log("Linking source rows…");
  const linked = await linkSources(supabase, sightings, contactIds);

  console.log("Folding email_unsubscribes into Suppression…");
  const { linkedSuppressions, tombstones, skippedNoOrg } = await foldUnsubscribes(
    supabase,
    contactIds
  );

  const rows: Array<[string, number]> = [
    ["Contacts created", created],
    ["Contacts updated", updated],
    ["Sightings skipped (no email)", skippedNoEmail],
    ["surveys linked", linked.surveys],
    ["video_testimonial_requests linked", linked.video_testimonial_requests],
    ["profile_referrals linked", linked.profile_referrals],
    ["reviews linked", linked.reviews],
    ["Suppressions (contact-linked)", linkedSuppressions],
    ["Suppressions (tombstone)", tombstones],
    ["Unsubscribes skipped (no org)", skippedNoOrg],
  ];
  const width = Math.max(...rows.map(([label]) => label.length));
  console.log("\nBackfill summary");
  console.log("-".repeat(width + 8));
  for (const [label, value] of rows) {
    console.log(`${label.padEnd(width)}  ${String(value).padStart(6)}`);
  }
  console.log("-".repeat(width + 8));
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
