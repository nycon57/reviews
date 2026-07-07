/**
 * Contact identity primitives (ADR 0004).
 *
 * A Contact is identified within an organization by its normalized email. These
 * pure functions are the single source of truth for that normalization and for
 * the tombstone/dedup hash, so every write path and the send-time suppression
 * check agree on what "the same person" means. No I/O — safe to unit test and
 * to run in any runtime.
 */
import { createHash } from "node:crypto";

/**
 * Normalize an email to its canonical identity form: trimmed and lowercased.
 *
 * Returns null for anything that cannot be a real address (empty, no `@`, or an
 * `@` at either edge). Intentionally light validation — we normalize, we do not
 * fully RFC-validate — but strict enough that garbage never becomes a Contact
 * identity or a suppression key.
 */
export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  const at = normalized.indexOf("@");
  // Require a local part and a domain part, and exactly one `@`.
  if (at <= 0 || at === normalized.length - 1) return null;
  if (normalized.indexOf("@", at + 1) !== -1) return null;
  if (/\s/.test(normalized)) return null;
  return normalized;
}

/**
 * Normalize a phone number to E.164 (e.g. "+14155550123"), tolerant of the
 * usual human formatting (spaces, parens, dashes, dots, leading "+" or "00").
 * Returns null on anything that cannot be a phone number.
 *
 * Country assumption: RepWell's acquisition audience is US/Canada, so a bare
 * 10-digit number is treated as +1. A number that already carries a country
 * code (leading "+", "00", or 11+ digits) is kept as-is. This is a pragmatic
 * default, not a full libphonenumber parse; when SMS returns (ADR 0005) a
 * stricter validator can replace this without touching callers.
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let raw = phone.trim();
  if (raw === "") return null;

  // Reject anything with letters — a tolerant parse still shouldn't invent
  // digits from "call me" style junk.
  if (/[a-z]/i.test(raw)) return null;

  const hasPlus = raw.startsWith("+");
  // "00" is the international dialing prefix in much of the world.
  const hasInternationalPrefix = !hasPlus && raw.startsWith("00");
  if (hasInternationalPrefix) raw = raw.slice(2);

  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return null;

  let e164: string;
  if (hasPlus || hasInternationalPrefix) {
    // Already carries a country code.
    e164 = `+${digits}`;
  } else if (digits.length === 10) {
    // Bare North American number.
    e164 = `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith("1")) {
    // North American number with the country code but no "+".
    e164 = `+${digits}`;
  } else {
    // Ambiguous but plausibly international (has enough digits to be one).
    e164 = `+${digits}`;
  }

  // E.164 allows 8–15 digits after the "+". Anything outside that is garbage.
  const e164Digits = e164.slice(1);
  if (e164Digits.length < 8 || e164Digits.length > 15) return null;

  return e164;
}

/**
 * SHA-256 (hex) of the normalized email — the tombstone/dedup key.
 *
 * Always hashes the normalized form so the send-time suppression check and the
 * stored value agree. Returns null when the email cannot be normalized (callers
 * treat null as "no identity to match", i.e. not suppressed / cannot dedup).
 */
export function sha256Email(email: string | null | undefined): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return createHash("sha256").update(normalized).digest("hex");
}
