"use server";

/**
 * Contact read-side queries (ADR 0004). The list, timeline, and lookup the
 * Contacts tab renders. Strictly read-only — every write (suppress, reassign,
 * erase, import) lives in B1's actions.ts / B3's import.ts.
 *
 * Org-scoping and owner visibility are enforced here on every call from the
 * session's access context, mirroring the RLS policy in the contacts migration:
 * admins/managers see the whole org; a regular professional sees only the
 * Contacts they own. The service-role client bypasses RLS, so these checks are
 * the real gate — never trust an org/user id from the client.
 *
 * Contacts tables aren't in the generated Supabase types yet, so this uses the
 * untyped admin client (house pattern; see actions.ts).
 */
import { getAccessContext } from "@/lib/access";
import { createUntypedAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContactListItem {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  ownerUserId: string | null;
  ownerName: string | null;
  source: string | null;
  /** True when the email channel is suppressed (do-not-contact / unsubscribed). */
  suppressed: boolean;
  /** Most recent linked request/review activity; falls back to createdAt. */
  lastActivityAt: string | null;
  createdAt: string;
}

export interface ContactListFilters {
  search?: string;
  /** A user id, or the sentinel "unassigned" for owner-less Contacts. */
  ownerUserId?: string;
  /** When true, show only Contacts with an email suppression. */
  suppressedOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ContactSuppressionView {
  channel: string;
  reason: string;
  createdAt: string;
}

export interface ContactDetail {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  ownerUserId: string | null;
  ownerName: string | null;
  source: string | null;
  erasedAt: string | null;
  createdAt: string;
  suppressions: ContactSuppressionView[];
}

export type ContactTimelineKind = "survey" | "video" | "review";

export interface ContactTimelineEntry {
  kind: ContactTimelineKind;
  id: string;
  status: string | null;
  occurredAt: string;
  /** Reviews only. */
  rating?: number | null;
  /** Reviews only — whether the linked review is live. */
  isPublished?: boolean;
}

export interface ContactTimelineResult {
  contact: ContactDetail;
  timeline: ContactTimelineEntry[];
}

const DEFAULT_PAGE_SIZE = 25;

// ---------------------------------------------------------------------------
// Access
// ---------------------------------------------------------------------------

interface Scope {
  organizationId: string;
  userId: string;
  isManager: boolean;
}

async function requireScope(): Promise<Scope> {
  const ctx = await getAccessContext();
  if (!ctx) throw new Error("contacts/queries: not authenticated");
  return {
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    isManager: ctx.role === "admin" || ctx.role === "manager",
  };
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

/**
 * Org-scoped Contact list. Managers see the whole org; a professional sees only
 * the Contacts they own. Supports name/email search, owner filter, and a
 * suppressed-only filter, with pagination. Each row is enriched with its owner's
 * name, its email-suppression status, and a best-effort last-activity time.
 */
export async function getContacts(
  filters: ContactListFilters = {}
): Promise<{ contacts: ContactListItem[]; total: number }> {
  const scope = await requireScope();
  const supabase = createUntypedAdminClient();

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE));

  // Suppressed-only: resolve the org's suppressed Contact ids first so the list
  // query can constrain to them. Empty result short-circuits.
  let suppressedIdFilter: string[] | null = null;
  if (filters.suppressedOnly) {
    suppressedIdFilter = await getSuppressedContactIds(supabase, scope.organizationId);
    if (suppressedIdFilter.length === 0) return { contacts: [], total: 0 };
  }

  let query = supabase
    .from("contacts")
    .select("id, name, email, phone, owner_user_id, source, created_at, updated_at", {
      count: "exact",
    })
    .eq("organization_id", scope.organizationId)
    .is("erased_at", null);

  // Owner visibility: professionals are pinned to their own Contacts.
  if (!scope.isManager) {
    query = query.eq("owner_user_id", scope.userId);
  } else if (filters.ownerUserId === "unassigned") {
    query = query.is("owner_user_id", null);
  } else if (filters.ownerUserId) {
    query = query.eq("owner_user_id", filters.ownerUserId);
  }

  const search = filters.search?.trim();
  if (search) {
    const escaped = search.replace(/[%,]/g, "");
    query = query.or(`name.ilike.%${escaped}%,email.ilike.%${escaped}%`);
  }

  if (suppressedIdFilter) {
    query = query.in("id", suppressedIdFilter);
  }

  const from = (page - 1) * pageSize;
  query = query.order("updated_at", { ascending: false }).range(from, from + pageSize - 1);

  const { data, error, count } = await query;
  if (error) {
    throw new Error(`getContacts: list query failed: ${error.message}`);
  }

  const rows = (data ?? []) as Array<{
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    owner_user_id: string | null;
    source: string | null;
    created_at: string;
    updated_at: string;
  }>;

  if (rows.length === 0) return { contacts: [], total: count ?? 0 };

  const ids = rows.map((r) => r.id);
  const ownerIds = Array.from(
    new Set(rows.map((r) => r.owner_user_id).filter((v): v is string => !!v))
  );

  const [ownerNames, suppressedIds, lastActivity] = await Promise.all([
    getOwnerNames(supabase, ownerIds),
    getSuppressedContactIds(supabase, scope.organizationId, ids),
    getLastActivity(supabase, ids),
  ]);
  const suppressedSet = new Set(suppressedIds);

  const contacts: ContactListItem[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    ownerUserId: r.owner_user_id,
    ownerName: r.owner_user_id ? ownerNames.get(r.owner_user_id) ?? null : null,
    source: r.source,
    suppressed: suppressedSet.has(r.id),
    lastActivityAt: lastActivity.get(r.id) ?? r.updated_at ?? r.created_at,
    createdAt: r.created_at,
  }));

  return { contacts, total: count ?? contacts.length };
}

// ---------------------------------------------------------------------------
// Detail + timeline
// ---------------------------------------------------------------------------

/**
 * A single Contact with its full acquisition timeline (linked surveys, video
 * requests, and reviews) and current suppressions. Enforces the same org/owner
 * visibility as the list; returns null when the Contact is out of scope or gone.
 */
export async function getContactTimeline(
  contactId: string
): Promise<ContactTimelineResult | null> {
  const scope = await requireScope();
  const supabase = createUntypedAdminClient();

  const { data: contactRow, error } = await supabase
    .from("contacts")
    .select(
      "id, name, email, phone, owner_user_id, source, erased_at, organization_id, created_at"
    )
    .eq("id", contactId)
    .maybeSingle();
  if (error) throw new Error(`getContactTimeline: lookup failed: ${error.message}`);
  if (!contactRow) return null;

  const contact = contactRow as {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    owner_user_id: string | null;
    source: string | null;
    erased_at: string | null;
    organization_id: string;
    created_at: string;
  };

  // Org scope + owner visibility.
  if (contact.organization_id !== scope.organizationId) return null;
  if (!scope.isManager && contact.owner_user_id !== scope.userId) return null;

  const [surveys, videos, reviews, suppressions, ownerNames] = await Promise.all([
    supabase
      .from("surveys")
      .select("id, status, created_at")
      .eq("contact_id", contactId),
    supabase
      .from("video_testimonial_requests")
      .select("id, status, created_at")
      .eq("contact_id", contactId),
    supabase
      .from("reviews")
      .select("id, status, rating, is_published, created_at")
      .eq("contact_id", contactId),
    supabase
      .from("contact_suppressions")
      .select("channel, reason, created_at")
      .eq("contact_id", contactId),
    contact.owner_user_id
      ? getOwnerNames(supabase, [contact.owner_user_id])
      : Promise.resolve(new Map<string, string>()),
  ]);

  const timeline: ContactTimelineEntry[] = [];
  for (const s of (surveys.data ?? []) as Array<Record<string, unknown>>) {
    timeline.push({
      kind: "survey",
      id: s.id as string,
      status: (s.status as string) ?? null,
      occurredAt: s.created_at as string,
    });
  }
  for (const v of (videos.data ?? []) as Array<Record<string, unknown>>) {
    timeline.push({
      kind: "video",
      id: v.id as string,
      status: (v.status as string) ?? null,
      occurredAt: v.created_at as string,
    });
  }
  for (const r of (reviews.data ?? []) as Array<Record<string, unknown>>) {
    timeline.push({
      kind: "review",
      id: r.id as string,
      status: (r.status as string) ?? null,
      rating: (r.rating as number | null) ?? null,
      isPublished: (r.is_published as boolean) ?? false,
      occurredAt: r.created_at as string,
    });
  }
  timeline.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );

  const detail: ContactDetail = {
    id: contact.id,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    ownerUserId: contact.owner_user_id,
    ownerName: contact.owner_user_id
      ? ownerNames.get(contact.owner_user_id) ?? null
      : null,
    source: contact.source,
    erasedAt: contact.erased_at,
    createdAt: contact.created_at,
    suppressions: ((suppressions.data ?? []) as Array<Record<string, unknown>>).map(
      (s) => ({
        channel: s.channel as string,
        reason: s.reason as string,
        createdAt: s.created_at as string,
      })
    ),
  };

  return { contact: detail, timeline };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type Client = ReturnType<typeof createUntypedAdminClient>;

/** Map of user id → full name for owner display. */
async function getOwnerNames(
  supabase: Client,
  userIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (userIds.length === 0) return map;
  const { data } = await supabase
    .from("users")
    .select("id, full_name")
    .in("id", userIds);
  for (const u of (data ?? []) as Array<{ id: string; full_name: string | null }>) {
    if (u.full_name) map.set(u.id, u.full_name);
  }
  return map;
}

/**
 * Contact ids with an email suppression. Scoped to `ids` when provided (page
 * enrichment); otherwise returns every suppressed Contact in the org (used to
 * drive the suppressed-only filter).
 */
async function getSuppressedContactIds(
  supabase: Client,
  organizationId: string,
  ids?: string[]
): Promise<string[]> {
  let query = supabase
    .from("contact_suppressions")
    .select("contact_id")
    .eq("organization_id", organizationId)
    .eq("channel", "email")
    .not("contact_id", "is", null);
  if (ids && ids.length > 0) query = query.in("contact_id", ids);

  const { data } = await query;
  const out = new Set<string>();
  for (const r of (data ?? []) as Array<{ contact_id: string | null }>) {
    if (r.contact_id) out.add(r.contact_id);
  }
  return Array.from(out);
}

/**
 * Best-effort last-activity time per Contact: the newest linked survey, video
 * request, or review. Three narrow reads keyed on contact_id, reduced to a max
 * per id. Absent linked records leave a Contact without a computed time and the
 * caller falls back to updated_at/created_at.
 */
async function getLastActivity(
  supabase: Client,
  contactIds: string[]
): Promise<Map<string, string>> {
  const latest = new Map<string, string>();
  if (contactIds.length === 0) return latest;

  const consider = (contactId: string | null, at: string | null) => {
    if (!contactId || !at) return;
    const current = latest.get(contactId);
    if (!current || new Date(at).getTime() > new Date(current).getTime()) {
      latest.set(contactId, at);
    }
  };

  const [surveys, videos, reviews] = await Promise.all([
    supabase.from("surveys").select("contact_id, created_at").in("contact_id", contactIds),
    supabase
      .from("video_testimonial_requests")
      .select("contact_id, created_at")
      .in("contact_id", contactIds),
    supabase.from("reviews").select("contact_id, created_at").in("contact_id", contactIds),
  ]);

  for (const src of [surveys.data, videos.data, reviews.data]) {
    for (const row of (src ?? []) as Array<{
      contact_id: string | null;
      created_at: string | null;
    }>) {
      consider(row.contact_id, row.created_at);
    }
  }
  return latest;
}
