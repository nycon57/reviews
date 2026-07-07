/**
 * Contact unsubscribe tokens (ADR 0004; Grill #2 decision 6).
 *
 * The acquisition unsubscribe flow is Contact-scoped: an acquisition email
 * carries a footer link to a public page at `/u/c/[token]` that writes a
 * Suppression for the Contact. The token is a per-Contact, non-guessable handle
 * stored on the row (see the 20260707110000 migration) — the same random-hex
 * house pattern as surveys.token / video_testimonial_requests.token. Because the
 * column has a DB-level default, every Contact already has a token; the async
 * resolver below only ever *reads* it, with a lazy backfill as a defensive
 * fallback for rows that predate the column on a partially-applied environment.
 *
 * The contacts table is not yet in the generated Supabase types, so this module
 * uses the untyped admin client (the house pattern for new tables — mirrors
 * src/lib/contacts/actions.ts).
 */
import { createUntypedAdminClient } from "@/lib/supabase/admin";

/**
 * Base URL for public links. Matches the video-request href convention
 * (getRequestUrl in src/lib/video-testimonials/actions.ts) so acquisition links
 * resolve to the same origin: NEXT_PUBLIC_APP_URL in every real environment,
 * with the production host as the fallback.
 */
function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://app.repwell.com").replace(/\/$/, "");
}

/** The public path prefix for the Contact unsubscribe page (B3 owns the page). */
export const CONTACT_UNSUBSCRIBE_PATH = "/u/c";

/** Build the public unsubscribe URL from a raw token. */
export function buildContactUnsubscribeUrl(token: string): string {
  return `${getBaseUrl()}${CONTACT_UNSUBSCRIBE_PATH}/${token}`;
}

/**
 * Build the unsubscribe URL for a Contact that already carries its token (e.g.
 * the row returned from findOrCreateContact, which selects `*`). Synchronous —
 * no I/O. Returns null only if the token is somehow absent, so callers can
 * decide whether to fall back to {@link resolveContactUnsubscribeUrl}.
 */
export function getContactUnsubscribeUrl(contact: {
  unsubscribe_token?: string | null;
}): string | null {
  const token = contact.unsubscribe_token;
  if (!token) return null;
  return buildContactUnsubscribeUrl(token);
}

/**
 * Resolve the unsubscribe URL for a Contact by id, reading (and, defensively,
 * lazily generating) the token. Used by send paths that hold only a contact_id
 * from the request row. Returns null when the Contact does not exist.
 */
export async function resolveContactUnsubscribeUrl(
  contactId: string
): Promise<string | null> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("contacts")
    .select("id, unsubscribe_token")
    .eq("id", contactId)
    .maybeSingle();
  if (error) {
    throw new Error(`resolveContactUnsubscribeUrl: lookup failed: ${error.message}`);
  }
  if (!data) return null;

  const row = data as { id: string; unsubscribe_token: string | null };
  if (row.unsubscribe_token) {
    return buildContactUnsubscribeUrl(row.unsubscribe_token);
  }

  // Defensive lazy backfill: a row without a token can only exist if the column
  // default was not applied. Generate, persist, and return.
  const token = generateUnsubscribeToken();
  const { error: updateError } = await supabase
    .from("contacts")
    .update({ unsubscribe_token: token })
    .eq("id", contactId)
    .is("unsubscribe_token", null);
  if (updateError) {
    throw new Error(
      `resolveContactUnsubscribeUrl: token backfill failed: ${updateError.message}`
    );
  }
  return buildContactUnsubscribeUrl(token);
}

/** 16 random bytes as hex — mirrors the DB default `encode(gen_random_bytes(16),'hex')`. */
function generateUnsubscribeToken(): string {
  // Node's webcrypto is always available in the server runtimes this module runs in.
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
