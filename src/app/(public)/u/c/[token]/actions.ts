"use server";

/**
 * Contact-scoped unsubscribe (ADR 0004, Grill #2 decision 6).
 *
 * This is the CONTACT unsubscribe flow — separate from the authenticated user
 * preference center at /email-preferences/[token] and the legacy
 * /unsubscribe/[token]. It is reached from acquisition emails via a per-Contact
 * `unsubscribe_token` and lets an external recipient opt out (and change their
 * mind) with a single click, no login.
 *
 * The token is `contacts.unsubscribe_token` — a random 32-char hex handle every
 * Contact carries (migration 20260707110000). It isn't in the generated Supabase
 * types yet, so the lookup uses the untyped admin client. A failed lookup or a
 * miss returns one generic invalid-link result so the page never reveals whether
 * a token exists (and never 500s on a public route).
 *
 * Writes go through B1's canonical suppress/reinstate actions so the send-time
 * suppression check and tombstone semantics stay authoritative — this module
 * only resolves the token to a Contact and never mutates suppression state
 * directly.
 */
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { suppressContact, reinstateContact } from "@/lib/contacts/actions";

export interface ContactUnsubscribeOrg {
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
}

export interface ContactUnsubscribeView {
  contactId: string;
  /** Null when the Contact has been erased (PII nulled) but the link still resolves. */
  email: string | null;
  /** True when the email channel is currently suppressed for this Contact. */
  suppressed: boolean;
  organization: ContactUnsubscribeOrg;
}

export type ContactUnsubscribeResult =
  | { success: true; data: ContactUnsubscribeView }
  | { success: false; error: string };

const GENERIC_INVALID =
  "This unsubscribe link is invalid or has expired. Please contact the sender if you continue to receive emails you didn't ask for.";

/** Accept only plausibly-real opaque tokens; reject obvious garbage cheaply. */
function isPlausibleToken(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{16,256}$/.test(token);
}

/** hex color / same-origin-safe url guards, inlined to avoid cross-module coupling. */
function safeHexColor(color: unknown): string | null {
  return typeof color === "string" && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)
    ? color
    : null;
}
function safeLogoUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

interface OrgEmbed {
  name: string | null;
  logo_url: string | null;
  primary_color: string | null;
}

interface ContactTokenRow {
  id: string;
  email: string | null;
  organization_id: string;
  // PostgREST types a to-one embed as an array; runtime is an object. Handle both.
  organizations: OrgEmbed | OrgEmbed[] | null;
}

function firstOrg(embed: OrgEmbed | OrgEmbed[] | null): OrgEmbed | null {
  if (!embed) return null;
  return Array.isArray(embed) ? embed[0] ?? null : embed;
}

/**
 * Resolve the Contact behind an unsubscribe token, with its org branding and
 * current email-suppression status. Returns a generic invalid-link error for
 * anything that doesn't resolve (including a not-yet-migrated column) so we never
 * leak whether a token exists.
 */
export async function getContactByUnsubscribeToken(
  token: string
): Promise<ContactUnsubscribeResult> {
  if (!isPlausibleToken(token)) {
    return { success: false, error: GENERIC_INVALID };
  }

  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("contacts")
    .select(
      "id, email, organization_id, organizations(name, logo_url, primary_color)"
    )
    .eq("unsubscribe_token", token)
    .maybeSingle();

  // Any read failure or a miss → the same generic result (never leak existence).
  if (error || !data) {
    return { success: false, error: GENERIC_INVALID };
  }

  const row = data as unknown as ContactTokenRow;
  const org = firstOrg(row.organizations);
  const suppressed = await isEmailSuppressed(supabase, row.id);

  return {
    success: true,
    data: {
      contactId: row.id,
      email: row.email,
      suppressed,
      organization: {
        name: org?.name?.trim() || "RepWell",
        logoUrl: safeLogoUrl(org?.logo_url),
        primaryColor: safeHexColor(org?.primary_color),
      },
    },
  };
}

/**
 * One-click unsubscribe. Re-resolves the Contact from the token server-side
 * (never trusts a client-supplied id) and suppresses the email channel.
 */
export async function unsubscribeContactByToken(
  token: string
): Promise<{ success: boolean; suppressed: boolean; error?: string }> {
  const resolved = await getContactByUnsubscribeToken(token);
  if (!resolved.success) {
    return { success: false, suppressed: false, error: resolved.error };
  }
  try {
    await suppressContact(
      resolved.data.contactId,
      "email",
      "unsubscribed",
      "self_serve_unsubscribe"
    );
    return { success: true, suppressed: true };
  } catch {
    return {
      success: false,
      suppressed: resolved.data.suppressed,
      error: "We couldn't process that just now. Please try again.",
    };
  }
}

/** Inline resubscribe — lift the email suppression for a Contact that changed its mind. */
export async function resubscribeContactByToken(
  token: string
): Promise<{ success: boolean; suppressed: boolean; error?: string }> {
  const resolved = await getContactByUnsubscribeToken(token);
  if (!resolved.success) {
    return { success: false, suppressed: true, error: resolved.error };
  }
  try {
    await reinstateContact(resolved.data.contactId, "email");
    return { success: true, suppressed: false };
  } catch {
    return {
      success: false,
      suppressed: resolved.data.suppressed,
      error: "We couldn't process that just now. Please try again.",
    };
  }
}

/** Is the email channel currently suppressed for this Contact? */
async function isEmailSuppressed(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  contactId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("contact_suppressions")
    .select("id")
    .eq("contact_id", contactId)
    .eq("channel", "email")
    .limit(1)
    .maybeSingle();
  if (error) return false;
  return data != null;
}
