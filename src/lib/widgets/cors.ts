import { NextResponse } from "next/server";

/**
 * Validate the request origin against a widget's allowed_domains list.
 * Returns the origin if allowed, or null if blocked.
 *
 * Rules:
 * - If allowed_domains is empty/null, any origin is allowed (returns '*')
 * - If allowed_domains is set, the Origin header must match one entry
 * - Matching is case-insensitive and compares the hostname
 */
export function resolveAllowedOrigin(
  requestOrigin: string | null,
  allowedDomains: string[] | null
): string | null {
  // No domain restriction: allow all
  if (!allowedDomains || allowedDomains.length === 0) {
    return "*";
  }

  if (!requestOrigin) {
    return null;
  }

  try {
    const originHost = new URL(requestOrigin).hostname.toLowerCase();
    const matched = allowedDomains.some((domain) => {
      const normalized = domain.toLowerCase().replace(/^https?:\/\//, "");
      // Strip trailing slash and port
      const clean = normalized.split("/")[0].split(":")[0];
      return originHost === clean || originHost.endsWith(`.${clean}`);
    });
    return matched ? requestOrigin : null;
  } catch {
    return null;
  }
}

/**
 * Build standard CORS headers for public widget endpoints.
 */
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

/**
 * Create a preflight (OPTIONS) response with CORS headers.
 */
export function handleWidgetOptions(
  request: Request,
  allowedDomains: string[] | null
): NextResponse {
  const origin = request.headers.get("origin");
  const allowed = resolveAllowedOrigin(origin, allowedDomains);
  const corsOrigin = allowed ?? "*";

  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(corsOrigin),
  });
}

/**
 * Attach CORS + cache headers to a NextResponse.
 */
export function withCorsAndCache(
  response: NextResponse,
  allowedOrigin: string,
  cacheControl: string
): NextResponse {
  const cors = buildCorsHeaders(allowedOrigin);
  for (const [key, value] of Object.entries(cors)) {
    response.headers.set(key, value);
  }
  response.headers.set("Cache-Control", cacheControl);
  return response;
}

/**
 * Standard error JSON shape for all public widget endpoints.
 */
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
