/**
 * Domain validation utilities for widget allowlist enforcement.
 *
 * Pure functions with no framework dependencies. Used by the server-side
 * CORS layer (cors.ts) and client-side embed.js domain check.
 */

const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

const HOSTNAME_REGEX =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

const WILDCARD_REGEX =
  /^\*\.(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

/**
 * Check whether a hostname matches a single allowlist entry.
 * Supports exact match and wildcard subdomains (*.example.com).
 *
 * Uses simple string comparison (endsWith), not regex, for security.
 */
export function domainMatches(
  originHost: string,
  allowlistEntry: string
): boolean {
  const host = originHost.toLowerCase();
  const normalized = allowlistEntry
    .toLowerCase()
    .replace(/^https?:\/\//, "");
  const clean = normalized.split("/")[0].split(":")[0];

  if (clean.startsWith("*.")) {
    const base = clean.slice(2);
    return host === base || host.endsWith(`.${base}`);
  }

  return host === clean;
}

/**
 * Check whether an origin hostname is authorized for a widget.
 *
 * - Empty allowlist -> always allowed (unrestricted)
 * - Draft widgets allow localhost/127.0.0.1 regardless of allowlist
 * - Wildcard entries (*.example.com) match any subdomain
 */
export function isDomainAllowed(
  originHostname: string,
  allowedDomains: string[] | null,
  widgetStatus?: string
): boolean {
  if (!allowedDomains || allowedDomains.length === 0) {
    return true;
  }

  const host = originHostname.toLowerCase();

  if (widgetStatus === "draft" && LOCALHOST_HOSTS.has(host)) {
    return true;
  }

  return allowedDomains.some((domain) => domainMatches(host, domain));
}

/**
 * Validate that a string is a valid hostname or wildcard hostname.
 */
export function isValidHostname(value: string): boolean {
  return HOSTNAME_REGEX.test(value) || WILDCARD_REGEX.test(value);
}
