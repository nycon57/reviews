/**
 * Display helpers for public contact info (pro profiles, smart links).
 */

export interface ContactAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

/** Returns a safe http/https URL or null if the scheme is unsafe. */
export function getSafeUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  try {
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`).href;
  } catch {
    return null;
  }
}

/** Hostname (plus any path) without the www prefix, for link labels. */
export function getDisplayHostname(url: string): string {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.replace(/^www\./, "") +
      (parsed.pathname !== "/" ? parsed.pathname : "")
    );
  } catch {
    return url;
  }
}

/** Street on one line, "City, ST ZIP" on the next; empty parts dropped. */
export function formatAddressLines(address: ContactAddress): string[] {
  const lines: string[] = [];
  if (address.street) lines.push(address.street);
  const cityStateZip = [
    address.city,
    address.state ? `${address.state}${address.zip ? ` ${address.zip}` : ""}` : address.zip,
  ]
    .filter(Boolean)
    .join(", ");
  if (cityStateZip) lines.push(cityStateZip);
  return lines;
}
