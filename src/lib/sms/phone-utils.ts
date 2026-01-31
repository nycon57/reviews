import { US_PHONE_REGEX, US_COUNTRY_CODE } from "./constants";

/**
 * Normalize any US phone number input to E.164 format (+1XXXXXXXXXX).
 * Strips whitespace, punctuation, and optional country prefix.
 * Returns null if the input cannot be parsed as a valid US number.
 */
export function toE164(input: string): string | null {
  if (!input || typeof input !== "string") return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  const match = trimmed.match(US_PHONE_REGEX);
  if (!match) return null;

  const [, areaCode, exchange, subscriber] = match;
  return `${US_COUNTRY_CODE}${areaCode}${exchange}${subscriber}`;
}

/**
 * Validate that a string is a valid E.164 US phone number.
 */
export function isValidE164(phone: string): boolean {
  return /^\+1\d{10}$/.test(phone);
}

/**
 * Format an E.164 phone number for display: (XXX) XXX-XXXX.
 * Returns the input unchanged if it is not a valid E.164 US number.
 */
export function formatForDisplay(e164: string): string {
  const match = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (!match) return e164;
  return `(${match[1]}) ${match[2]}-${match[3]}`;
}

/**
 * Mask a phone number for logging or display: (XXX) XXX-XX**.
 */
export function maskPhone(e164: string): string {
  const match = e164.match(/^\+1(\d{3})(\d{3})(\d{2})\d{2}$/);
  if (!match) return "***-***-****";
  return `(${match[1]}) ${match[2]}-${match[3]}**`;
}

/**
 * Extract the area code from an E.164 US phone number.
 */
export function getAreaCode(e164: string): string | null {
  const match = e164.match(/^\+1(\d{3})/);
  return match ? match[1] : null;
}
