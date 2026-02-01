import { NextResponse } from "next/server";

const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Check whether a hostname matches a single allowlist entry.
 * Supports exact match and wildcard subdomains (*.example.com).
 */
export function domainMatches(originHost: string, domain: string): boolean {
  const normalized = domain.toLowerCase().replace(/^https?:\/\//, "");
  const clean = normalized.split("/")[0].split(":")[0];

  if (clean.startsWith("*.")) {
    // Wildcard: *.example.com matches sub.example.com and deep.sub.example.com
    const base = clean.slice(2); // "example.com"
    return originHost === base || originHost.endsWith(`.${base}`);
  }

  return originHost === clean;
}

/**
 * Resolve the CORS origin value for a widget request.
 *
 * - Empty allowlist → unrestricted ("*")
 * - Draft widgets allow localhost/127.0.0.1 regardless of allowlist
 * - Wildcard domains (*.example.com) match any subdomain
 * - Returns the request origin if allowed, null if blocked
 */
export function resolveAllowedOrigin(
  requestOrigin: string | null,
  allowedDomains: string[] | null,
  widgetStatus?: string
): string | null {
  if (!allowedDomains || allowedDomains.length === 0) {
    return "*";
  }
  if (!requestOrigin) {
    return null;
  }
  try {
    const originHost = new URL(requestOrigin).hostname.toLowerCase();

    // Draft widgets always allow localhost for development/testing
    if (widgetStatus === "draft" && LOCALHOST_HOSTS.has(originHost)) {
      return requestOrigin;
    }

    const matched = allowedDomains.some((domain) =>
      domainMatches(originHost, domain)
    );
    return matched ? requestOrigin : null;
  } catch {
    return null;
  }
}

export function buildCorsHeaders(
  allowedOrigin: string,
  methods: string = "GET, POST, OPTIONS"
): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export function withCorsAndCache(
  response: NextResponse,
  allowedOrigin: string,
  cacheControl: string
): NextResponse {
  const cors = buildCorsHeaders(allowedOrigin);
  for (const [key, value] of Object.entries(cors)) {
    response.headers.set(key, value);
  }
  if (allowedOrigin !== "*") {
    response.headers.set("Vary", "Origin");
  }
  response.headers.set("Cache-Control", cacheControl);
  return response;
}

export function widgetError(
  error: string,
  code: string,
  status: number,
  allowedOrigin: string = "*"
): NextResponse {
  const res = NextResponse.json({ error, code }, { status });
  const cors = buildCorsHeaders(allowedOrigin);
  for (const [key, value] of Object.entries(cors)) {
    res.headers.set(key, value);
  }
  res.headers.set("Cache-Control", "no-store");
  return res;
}

// ── 403 Rate Limiting ────────────────────────────────────────────────
// Progressive delay after repeated 403 responses to prevent domain enumeration.

const forbiddenCountMap = new Map<string, { count: number; resetAt: number }>();
const FORBIDDEN_WINDOW_MS = 60_000;
const FORBIDDEN_THRESHOLD = 10;

/**
 * Check whether an IP has exceeded the 403 rate limit threshold.
 * Returns the delay in ms the caller should wait (0 = no delay).
 * After 10 failures per IP within 60s, progressive delays are applied.
 */
export function checkForbiddenRateLimit(ip: string): number {
  const now = Date.now();
  const entry = forbiddenCountMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    forbiddenCountMap.set(ip, { count: 1, resetAt: now + FORBIDDEN_WINDOW_MS });
    return 0;
  }

  entry.count++;

  if (entry.count <= FORBIDDEN_THRESHOLD) {
    return 0;
  }

  // Progressive delay: 1s, 2s, 4s, 8s… capped at 30s
  const overCount = entry.count - FORBIDDEN_THRESHOLD;
  return Math.min(1000 * Math.pow(2, overCount - 1), 30_000);
}

// Periodic cleanup of stale entries
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of forbiddenCountMap) {
      if (now >= entry.resetAt) {
        forbiddenCountMap.delete(key);
      }
    }
  }, 5 * 60_000);
}
