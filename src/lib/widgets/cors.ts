import { NextResponse } from "next/server";

export function resolveAllowedOrigin(
  requestOrigin: string | null,
  allowedDomains: string[] | null
): string | null {
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
      const clean = normalized.split("/")[0].split(":")[0];
      return originHost === clean || originHost.endsWith(`.${clean}`);
    });
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
