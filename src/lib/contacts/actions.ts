/**
 * Contact service layer (ADR 0004) — the single entry points send paths and UI
 * call to resolve, suppress, reassign, and erase Contacts.
 *
 * These functions use the service-role admin client (bypasses RLS) and are
 * imported only from server code (send paths, server actions, the backfill).
 * Authorization is the caller's responsibility EXCEPT for {@link eraseContact},
 * which is compliance-critical and gates on the acting user itself.
 *
 * The contacts tables are new and not yet in the generated Supabase types, so
 * this module uses the untyped admin client (the house pattern for new tables —
 * see src/lib/supabase/admin.ts). Regenerate types with `npm run db:types`
 * after this migration ships and the `as ...` result casts can tighten.
 */
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { normalizeEmail, normalizePhone, sha256Email } from "@/lib/contacts/identity";
import { emitWebhookEvent } from "@/lib/webhooks/outbound";

export type SuppressionChannel = "email" | "sms";
export type SuppressionReason =
  | "unsubscribed"
  | "do_not_contact"
  | "bounced"
  | "complained";
export type ContactSource =
  | "survey"
  | "video_testimonial"
  | "salesforce"
  | "referral"
  | "direct_review"
  | "import"
  | "manual";

export interface ContactRow {
  id: string;
  organization_id: string;
  owner_user_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  email_sha256: string | null;
  erased_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FindOrCreateContactResult {
  contact: ContactRow;
  createdNew: boolean;
}

interface ContactIdentityInput {
  email: string;
  name?: string | null;
  phone?: string | null;
}

/** Placeholders written over Send-Time Snapshot PII on erasure. */
const ERASED_NAME = "Erased Contact";
const ERASED_EMAIL = "erased@contacts.invalid";

type AdminClient = ReturnType<typeof createUntypedAdminClient>;

/**
 * Resolve the Contact for an acquisition request, creating it if new.
 *
 * - Normalizes email (required by the app today) and phone.
 * - If a live Contact exists for (org, email), refreshes name/phone and — when
 *   a non-null owner is supplied — reassigns the Owner to the current sender
 *   (owner tracks the most recent request; ADR 0004).
 * - If the only match is an ERASED tombstone (same email hash, erased_at set),
 *   creates a fresh Contact and preserves the erased Contact's suppressions by
 *   re-creating them against the new row, so an unsubscribe survives an
 *   erase→re-import cycle.
 * - Absorbs any waiting tombstone suppressions (contact_id NULL) for this email
 *   so a prior unsubscribe of a never-before-seen email takes effect the moment
 *   the Contact appears.
 */
export async function findOrCreateContact(
  organizationId: string,
  identity: ContactIdentityInput,
  ownerUserId: string | null,
  source: ContactSource
): Promise<FindOrCreateContactResult> {
  const email = normalizeEmail(identity.email);
  if (!email) {
    throw new Error("findOrCreateContact: a valid email is required");
  }
  const emailSha256 = sha256Email(email);
  const phone = normalizePhone(identity.phone);
  const name = identity.name?.trim() || null;
  const supabase = createUntypedAdminClient();

  // 1. Existing live Contact for this (org, email)?
  const { data: existing, error: findError } = await supabase
    .from("contacts")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("email", email)
    .is("erased_at", null)
    .maybeSingle();
  if (findError) {
    throw new Error(`findOrCreateContact: lookup failed: ${findError.message}`);
  }

  if (existing) {
    const patch: Record<string, unknown> = {};
    if (name) patch.name = name;
    if (phone) patch.phone = phone;
    if (ownerUserId) patch.owner_user_id = ownerUserId;
    if (Object.keys(patch).length === 0) {
      return { contact: existing as ContactRow, createdNew: false };
    }

    const { data: updated, error: updateError } = await supabase
      .from("contacts")
      .update(patch)
      .eq("id", (existing as ContactRow).id)
      .select("*")
      .single();
    if (updateError) {
      throw new Error(
        `findOrCreateContact: freshness update failed: ${updateError.message}`
      );
    }
    return { contact: updated as ContactRow, createdNew: false };
  }

  // 2. No live Contact. Was this email erased before? (tombstone via hash)
  let erasedContactId: string | null = null;
  if (emailSha256) {
    const { data: erased, error: erasedError } = await supabase
      .from("contacts")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("email_sha256", emailSha256)
      .not("erased_at", "is", null)
      .limit(1)
      .maybeSingle();
    if (erasedError) {
      throw new Error(
        `findOrCreateContact: tombstone lookup failed: ${erasedError.message}`
      );
    }
    erasedContactId = (erased as { id: string } | null)?.id ?? null;
  }

  // 3. Create the fresh Contact. Handle the concurrent-insert race by falling
  //    back to a re-select on a unique-violation.
  const { data: created, error: insertError } = await supabase
    .from("contacts")
    .insert({
      organization_id: organizationId,
      owner_user_id: ownerUserId,
      name,
      email,
      phone,
      source,
      email_sha256: emailSha256,
    })
    .select("*")
    .single();

  let contact: ContactRow;
  let createdNew = false;
  if (insertError) {
    if (insertError.code === "23505") {
      // Lost a race — the Contact now exists. Re-select and return it.
      const { data: raced, error: raceError } = await supabase
        .from("contacts")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("email", email)
        .is("erased_at", null)
        .single();
      if (raceError || !raced) {
        throw new Error(
          `findOrCreateContact: insert raced but re-select failed: ${
            raceError?.message ?? "not found"
          }`
        );
      }
      contact = raced as ContactRow;
    } else {
      throw new Error(`findOrCreateContact: insert failed: ${insertError.message}`);
    }
  } else {
    contact = created as ContactRow;
    createdNew = true;
  }

  // 4. Preserve suppressions across erase→re-import and absorb waiting
  //    tombstones for this email.
  await preserveSuppressionsForNewContact(
    supabase,
    organizationId,
    emailSha256,
    contact.id,
    erasedContactId
  );

  if (createdNew) {
    await emitWebhookEvent({
      organizationId,
      type: "contact.created",
      data: {
        contact_id: contact.id,
        full_name: contact.name,
        email: contact.email,
        phone: contact.phone,
        source: contact.source,
      },
    }).catch((error) => {
      console.error("Failed to enqueue contact.created webhook:", error);
    });
  }

  return { contact, createdNew };
}

/**
 * The single send-time suppression check (ADR 0004). True if the org has ANY
 * suppression for this email on this channel — whether it is linked to a live
 * Contact, retained on an erased Contact, or a standalone tombstone from an
 * unsubscribe that predates any Contact. Matches by email hash, so it needs no
 * join to contacts.
 */
export async function isSuppressed(
  organizationId: string,
  email: string,
  channel: SuppressionChannel
): Promise<boolean> {
  const emailSha256 = sha256Email(email);
  if (!emailSha256) return false;

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("contact_suppressions")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("email_sha256", emailSha256)
    .eq("channel", channel)
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(`isSuppressed: check failed: ${error.message}`);
  }
  return data != null;
}

/**
 * Suppress a Contact on a channel with a reason. Idempotent: re-suppressing an
 * already-suppressed channel updates the reason/source in place.
 */
export async function suppressContact(
  contactId: string,
  channel: SuppressionChannel,
  reason: SuppressionReason,
  sourceNote?: string
): Promise<void> {
  const supabase = createUntypedAdminClient();
  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("id, organization_id, email_sha256")
    .eq("id", contactId)
    .single();
  if (contactError || !contact) {
    throw new Error(
      `suppressContact: contact ${contactId} not found: ${
        contactError?.message ?? "no row"
      }`
    );
  }
  const { organization_id, email_sha256 } = contact as {
    organization_id: string;
    email_sha256: string | null;
  };

  await upsertContactSuppression(supabase, {
    contactId,
    organizationId: organization_id,
    emailSha256: email_sha256,
    channel,
    reason,
    source: sourceNote ?? null,
  });
}

/**
 * Self-serve resubscribe: lift a Contact's suppression on a channel, and clear
 * any standalone tombstone for the same email so the send-time check no longer
 * blocks it.
 */
export async function reinstateContact(
  contactId: string,
  channel: SuppressionChannel
): Promise<void> {
  const supabase = createUntypedAdminClient();
  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("id, organization_id, email_sha256")
    .eq("id", contactId)
    .single();
  if (contactError || !contact) {
    throw new Error(
      `reinstateContact: contact ${contactId} not found: ${
        contactError?.message ?? "no row"
      }`
    );
  }
  const { organization_id, email_sha256 } = contact as {
    organization_id: string;
    email_sha256: string | null;
  };

  const { error: unlinkError } = await supabase
    .from("contact_suppressions")
    .delete()
    .eq("contact_id", contactId)
    .eq("channel", channel);
  if (unlinkError) {
    throw new Error(`reinstateContact: unsuppress failed: ${unlinkError.message}`);
  }

  if (email_sha256) {
    const { error: tombstoneError } = await supabase
      .from("contact_suppressions")
      .delete()
      .is("contact_id", null)
      .eq("organization_id", organization_id)
      .eq("email_sha256", email_sha256)
      .eq("channel", channel);
    if (tombstoneError) {
      throw new Error(
        `reinstateContact: tombstone clear failed: ${tombstoneError.message}`
      );
    }
  }
}

/** Reassign the Contact Owner (pass null to unassign, e.g. Held state). */
export async function reassignContactOwner(
  contactId: string,
  newOwnerUserId: string | null
): Promise<void> {
  const supabase = createUntypedAdminClient();
  const { error } = await supabase
    .from("contacts")
    .update({ owner_user_id: newOwnerUserId })
    .eq("id", contactId);
  if (error) {
    throw new Error(`reassignContactOwner: update failed: ${error.message}`);
  }
}

/**
 * Right-to-erasure (Grill #11 item 7). Admin- or Owner-gated on `actingUserId`.
 *
 * Anonymizes PII while preserving audit and aggregate integrity:
 * - The Contact row is kept but name/email/phone are nulled; `email_sha256` and
 *   `erased_at` are retained so suppressions keep working and a later re-import
 *   is detectable by hash. Suppressions are deliberately NOT deleted — an
 *   erased person stays suppressed.
 * - Send-Time Snapshots on linked surveys / video requests / referrals: the
 *   snapshot's PII (name/email/phone) is overwritten with placeholders, but the
 *   row and its lifecycle timestamps stay — the immutable audit fact "a request
 *   was sent to someone at time T by professional P" survives; only the PII
 *   inside it yields to erasure.
 * - Linked direct reviews: text/rating/publish state are preserved (aggregate
 *   integrity — a published review does not vanish); only the reviewer's
 *   display identity is anonymized.
 *
 * NOT handled here: video_testimonial_responses media/transcripts, which carry
 * likeness beyond a PII column and need a media-deletion path. Flagged as a
 * follow-up for the video team (see report).
 */
export async function eraseContact(
  contactId: string,
  actingUserId: string
): Promise<void> {
  const supabase = createUntypedAdminClient();

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("id, organization_id, owner_user_id")
    .eq("id", contactId)
    .single();
  if (contactError || !contact) {
    throw new Error(
      `eraseContact: contact ${contactId} not found: ${
        contactError?.message ?? "no row"
      }`
    );
  }
  const {
    organization_id: contactOrgId,
    owner_user_id: ownerUserId,
  } = contact as { organization_id: string; owner_user_id: string | null };

  // Authorization: the Contact's Owner, or an admin of the Contact's org.
  await assertCanErase(supabase, actingUserId, contactOrgId, ownerUserId);

  const now = new Date().toISOString();

  const { error: eraseError } = await supabase
    .from("contacts")
    .update({ name: null, email: null, phone: null, erased_at: now })
    .eq("id", contactId);
  if (eraseError) {
    throw new Error(`eraseContact: contact anonymize failed: ${eraseError.message}`);
  }

  // Send-Time Snapshots — customer_name/customer_email are NOT NULL on surveys
  // and video requests, so they take placeholders rather than null.
  const snapshotErrors: string[] = [];
  const surveys = await supabase
    .from("surveys")
    .update({
      customer_name: ERASED_NAME,
      customer_email: ERASED_EMAIL,
      customer_phone: null,
    })
    .eq("contact_id", contactId);
  if (surveys.error) snapshotErrors.push(`surveys: ${surveys.error.message}`);

  const videos = await supabase
    .from("video_testimonial_requests")
    .update({
      customer_name: ERASED_NAME,
      customer_email: ERASED_EMAIL,
      customer_phone: null,
    })
    .eq("contact_id", contactId);
  if (videos.error) snapshotErrors.push(`video_requests: ${videos.error.message}`);

  const referrals = await supabase
    .from("profile_referrals")
    .update({
      referred_name: ERASED_NAME,
      referred_email: null,
      referred_phone: null,
    })
    .eq("contact_id", contactId);
  if (referrals.error) snapshotErrors.push(`referrals: ${referrals.error.message}`);

  // Direct reviews: keep the review, anonymize the reviewer's display identity.
  const reviews = await supabase
    .from("reviews")
    .update({ customer_name: "Anonymous", customer_email: null })
    .eq("contact_id", contactId);
  if (reviews.error) snapshotErrors.push(`reviews: ${reviews.error.message}`);

  if (snapshotErrors.length > 0) {
    throw new Error(`eraseContact: snapshot anonymize failed: ${snapshotErrors.join("; ")}`);
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Owner-or-admin gate for erasure. Managers are intentionally excluded. */
async function assertCanErase(
  supabase: AdminClient,
  actingUserId: string,
  contactOrgId: string,
  ownerUserId: string | null
): Promise<void> {
  if (ownerUserId && actingUserId === ownerUserId) return;

  const { data: actor, error } = await supabase
    .from("users")
    .select("id, role, organization_id")
    .eq("id", actingUserId)
    .single();
  if (error || !actor) {
    throw new Error(`eraseContact: acting user ${actingUserId} not found`);
  }
  const { role, organization_id } = actor as {
    role: string;
    organization_id: string | null;
  };
  if (role === "admin" && organization_id === contactOrgId) return;

  throw new Error("eraseContact: not authorized (requires Contact owner or org admin)");
}

/**
 * Ensure the new Contact carries every suppression that applied to this email:
 * copy from the erased predecessor (if any) and re-link standalone tombstones.
 * Read-then-write rather than ON CONFLICT because the uniqueness lives in
 * partial indexes, which Postgres cannot use for conflict inference.
 */
async function preserveSuppressionsForNewContact(
  supabase: AdminClient,
  organizationId: string,
  emailSha256: string | null,
  newContactId: string,
  erasedContactId: string | null
): Promise<void> {
  const candidates: Array<{
    channel: SuppressionChannel;
    reason: SuppressionReason;
    source: string | null;
  }> = [];

  if (erasedContactId) {
    const { data, error } = await supabase
      .from("contact_suppressions")
      .select("channel, reason, source")
      .eq("contact_id", erasedContactId);
    if (error) {
      throw new Error(`preserveSuppressions: erased lookup failed: ${error.message}`);
    }
    for (const row of (data ?? []) as Array<{
      channel: SuppressionChannel;
      reason: SuppressionReason;
      source: string | null;
    }>) {
      candidates.push(row);
    }
  }

  if (emailSha256) {
    const { data, error } = await supabase
      .from("contact_suppressions")
      .select("channel, reason, source")
      .is("contact_id", null)
      .eq("organization_id", organizationId)
      .eq("email_sha256", emailSha256);
    if (error) {
      throw new Error(`preserveSuppressions: tombstone lookup failed: ${error.message}`);
    }
    for (const row of (data ?? []) as Array<{
      channel: SuppressionChannel;
      reason: SuppressionReason;
      source: string | null;
    }>) {
      candidates.push(row);
    }
  }

  for (const candidate of candidates) {
    await upsertContactSuppression(supabase, {
      contactId: newContactId,
      organizationId,
      emailSha256,
      channel: candidate.channel,
      reason: candidate.reason,
      source: candidate.source,
    });
  }

  // The tombstones have been absorbed into contact-linked rows; drop them so a
  // single email doesn't accumulate duplicate suppression rows.
  if (emailSha256) {
    const { error } = await supabase
      .from("contact_suppressions")
      .delete()
      .is("contact_id", null)
      .eq("organization_id", organizationId)
      .eq("email_sha256", emailSha256);
    if (error) {
      throw new Error(`preserveSuppressions: tombstone cleanup failed: ${error.message}`);
    }
  }
}

/** Insert-or-update a contact-linked suppression keyed on (contact_id, channel). */
async function upsertContactSuppression(
  supabase: AdminClient,
  input: {
    contactId: string;
    organizationId: string;
    emailSha256: string | null;
    channel: SuppressionChannel;
    reason: SuppressionReason;
    source: string | null;
  }
): Promise<void> {
  const { data: existing, error: findError } = await supabase
    .from("contact_suppressions")
    .select("id")
    .eq("contact_id", input.contactId)
    .eq("channel", input.channel)
    .maybeSingle();
  if (findError) {
    throw new Error(`suppress: lookup failed: ${findError.message}`);
  }

  if (existing) {
    const { error } = await supabase
      .from("contact_suppressions")
      .update({ reason: input.reason, source: input.source })
      .eq("id", (existing as { id: string }).id);
    if (error) throw new Error(`suppress: update failed: ${error.message}`);
    return;
  }

  const { error } = await supabase.from("contact_suppressions").insert({
    contact_id: input.contactId,
    organization_id: input.organizationId,
    email_sha256: input.emailSha256,
    channel: input.channel,
    reason: input.reason,
    source: input.source,
  });
  if (error) throw new Error(`suppress: insert failed: ${error.message}`);
}
