/**
 * Format an E.164 phone number (+1XXXXXXXXXX) to US display format (XXX) XXX-XXXX.
 * Returns the original string unchanged for non-US or invalid numbers.
 */
export function formatPhoneNumber(e164: string): string {
  const digits = e164.replace(/^\+1/, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return e164;
}
