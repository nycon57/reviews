import { NextResponse, type NextRequest } from "next/server";
import { getClientIp, hashRateLimitKey } from "@/lib/api-v2";
import { createAdminClient } from "@/lib/supabase/admin";

export const WEBMCP_ORIGIN_RATE_LIMIT = 60;
export const WEBMCP_RATE_LIMIT_BUCKET = "webmcp-origin";

type MinuteRateLimitResult = {
  isAllowed: boolean;
  currentCount: number;
  retryAfterSeconds: number;
};

export type WebMcpHandler = () => Promise<NextResponse>;

type WebMcpResponseInit = {
  status?: number;
  headers?: Record<string, string>;
};

function getInternalApiKey(): string | null {
  // Server-only read-only key. Rotate by replacing WEBMCP_INTERNAL_API_KEY in
  // Vercel, then redeploying so all serverless instances read the new value.
  return process.env.WEBMCP_INTERNAL_API_KEY?.trim() || null;
}

function setWebMcpHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin")?.trim();

  response.headers.set("Access-Control-Allow-Origin", origin || "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Accept");
  response.headers.set("Access-Control-Max-Age", "600");
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Vary", "Origin");
  response.headers.set("X-RepWell-Source", "repwell-webmcp");

  return response;
}

export function webMcpJson(
  request: NextRequest,
  body: unknown,
  init?: WebMcpResponseInit
): NextResponse {
  return setWebMcpHeaders(request, NextResponse.json(body, init));
}

export function webMcpError(
  request: NextRequest,
  error: string,
  message: string,
  status: number,
  headers?: Record<string, string>
): NextResponse {
  return webMcpJson(
    request,
    { error, message },
    {
      status,
      headers,
    }
  );
}

export function webMcpPaginated<T>(
  request: NextRequest,
  data: T[],
  pagination: {
    total: number;
    page: number;
    perPage: number;
  }
): NextResponse {
  const totalPages =
    pagination.total === 0 ? 0 : Math.ceil(pagination.total / pagination.perPage);

  return webMcpJson(request, {
    data,
    total: pagination.total,
    page: pagination.page,
    per_page: pagination.perPage,
    total_pages: totalPages,
  });
}

export function webMcpOptions(request: NextRequest): NextResponse {
  return setWebMcpHeaders(request, new NextResponse(null, { status: 204 }));
}

export function webMcpOriginWindowKey(request: NextRequest): string {
  // Rate identity = client IP, nothing else. Origin is caller-supplied — a
  // scripted caller can mint a fresh bucket per request by varying it (and
  // the real WebMCP client's same-origin simple GETs send no Origin header
  // at all), so letting it into the key in ANY position reopens the bypass.
  return hashRateLimitKey(getClientIp(request) ?? "unknown");
}

export async function checkWebMcpOriginRateLimit(
  request: NextRequest
): Promise<MinuteRateLimitResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("check_minute_rate_limit", {
    p_bucket: WEBMCP_RATE_LIMIT_BUCKET,
    p_window_key: webMcpOriginWindowKey(request),
    p_limit: WEBMCP_ORIGIN_RATE_LIMIT,
  });

  if (error) {
    console.error("[webmcp] Minute rate limit check failed; failing closed:", error);
    return {
      isAllowed: false,
      currentCount: WEBMCP_ORIGIN_RATE_LIMIT,
      retryAfterSeconds: 60,
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    console.error("[webmcp] Minute rate limit RPC returned no row; failing closed");
    return {
      isAllowed: false,
      currentCount: WEBMCP_ORIGIN_RATE_LIMIT,
      retryAfterSeconds: 60,
    };
  }

  return {
    isAllowed: Boolean(row.is_allowed),
    currentCount: Number(row.current_count ?? 0),
    retryAfterSeconds: Math.max(1, Number(row.retry_after_seconds ?? 60)),
  };
}

export async function withWebMcpProxy(
  request: NextRequest,
  handler: WebMcpHandler
): Promise<NextResponse> {
  if (!getInternalApiKey()) {
    return webMcpError(
      request,
      "webmcp_unconfigured",
      "WebMCP internal API key is not configured",
      503
    );
  }

  const rateLimit = await checkWebMcpOriginRateLimit(request);
  if (!rateLimit.isAllowed) {
    return webMcpError(
      request,
      "rate_limit_exceeded",
      "WebMCP proxy rate limit exceeded",
      429,
      {
        "Retry-After": String(rateLimit.retryAfterSeconds),
      }
    );
  }

  try {
    return setWebMcpHeaders(request, await handler());
  } catch (error) {
    console.error("[webmcp] Proxy handler failed:", error);
    return webMcpError(
      request,
      "internal_error",
      "An internal error occurred",
      500
    );
  }
}
