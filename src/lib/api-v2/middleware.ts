import { createHash } from "node:crypto";
import { after, NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BRAND_DOMAIN } from "@/lib/brand";
import {
  extractApiKey,
  withApiAuth,
  type ApiAuthContext,
} from "@/lib/api-keys/validate";
import type { ApiKeyScope } from "@/lib/api-keys/types";
import type { Json } from "@/types/database.types";
import {
  apiV2Error,
  apiV2RateLimitError,
  setApiV2Headers,
} from "./response";

export const OPEN_TIER_RATE_LIMIT = 60;
export const KEYED_TIER_RATE_LIMIT = 300;

export type ApiV2Tier = "open" | "keyed";

export interface ApiV2Context {
  tier: ApiV2Tier;
  apiKeyId: string | null;
  clientIp: string | null;
  rateLimit: {
    isAllowed: boolean;
    currentCount: number;
    limit: number;
    remaining: number;
    resetAt: number;
    retryAfterSeconds: number;
  };
}

export interface ApiV2KeyedContext extends ApiAuthContext {
  v2: ApiV2Context;
}

type ApiV2Handler<TContext> = (
  request: NextRequest,
  context: TContext
) => Promise<NextResponse>;

type MinuteRateLimitResult = {
  isAllowed: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

export function getClientIp(request: NextRequest): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    null
  );
}

export function hashRateLimitKey(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function checkMinuteRateLimit(params: {
  bucket: "v2-open" | "v2-keyed";
  windowKey: string;
  limit: number;
}): Promise<MinuteRateLimitResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("check_minute_rate_limit", {
    p_bucket: params.bucket,
    p_window_key: params.windowKey,
    p_limit: params.limit,
  });

  if (error) {
    console.error(
      "[api-v2] Minute rate limit check failed; failing closed:",
      error
    );
    return {
      isAllowed: false,
      currentCount: params.limit,
      limit: params.limit,
      remaining: 0,
      resetAt: Math.floor((Date.now() + 60000) / 1000),
      retryAfterSeconds: 60,
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    console.error("[api-v2] Minute rate limit RPC returned no row; failing closed");
    return {
      isAllowed: false,
      currentCount: params.limit,
      limit: params.limit,
      remaining: 0,
      resetAt: Math.floor((Date.now() + 60000) / 1000),
      retryAfterSeconds: 60,
    };
  }

  const retryAfterSeconds = Math.max(1, Number(row.retry_after_seconds ?? 60));
  const currentCount = Number(row.current_count ?? 0);

  return {
    isAllowed: Boolean(row.is_allowed),
    currentCount,
    limit: params.limit,
    remaining: Math.max(0, params.limit - currentCount),
    resetAt: Math.floor((Date.now() + retryAfterSeconds * 1000) / 1000),
    retryAfterSeconds,
  };
}

function setRateLimitHeaders(
  response: NextResponse,
  rateLimit: MinuteRateLimitResult
): void {
  response.headers.set("X-RateLimit-Limit", String(rateLimit.limit));
  response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
  response.headers.set("X-RateLimit-Reset", String(rateLimit.resetAt));
}

function queryParamsToJson(request: NextRequest): Json {
  const params: Record<string, string | string[]> = {};
  const url = new URL(request.url);
  for (const key of url.searchParams.keys()) {
    const values = url.searchParams.getAll(key);
    params[key] = values.length > 1 ? values : values[0] ?? "";
  }
  return params;
}

async function insertUsageLog(params: {
  request: NextRequest;
  tier: ApiV2Tier;
  apiKeyId: string | null;
  responseStatus: number;
  responseTimeMs: number;
}): Promise<void> {
  const url = new URL(params.request.url);
  const clientIp = getClientIp(params.request);
  const supabase = createAdminClient();
  const { error } = await supabase.from("api_usage_logs").insert({
    api_key_id: params.apiKeyId,
    endpoint: url.pathname,
    method: params.request.method,
    query_params: queryParamsToJson(params.request),
    user_agent: params.request.headers.get("user-agent"),
    ip_address: clientIp,
    response_status: params.responseStatus,
    response_time_ms: params.responseTimeMs,
    tier: params.tier,
  });

  if (error) {
    console.error("[api-v2] Failed to write api_usage_logs entry:", error);
  }
}

function scheduleUsageLog(params: {
  request: NextRequest;
  tier: ApiV2Tier;
  apiKeyId: string | null;
  responseStatus: number;
  startedAt: number;
}): void {
  const responseTimeMs = Date.now() - params.startedAt;

  try {
    after(async () => {
      try {
        await insertUsageLog({ ...params, responseTimeMs });
      } catch (error) {
        console.error("[api-v2] Usage logging failed:", error);
      }
    });
  } catch {
    void insertUsageLog({ ...params, responseTimeMs }).catch((error) => {
      console.error("[api-v2] Usage logging failed:", error);
    });
  }
}

async function runTier<TContext>(
  request: NextRequest,
  config: {
    tier: ApiV2Tier;
    apiKeyId: string | null;
    bucket: "v2-open" | "v2-keyed";
    windowKey: string;
    limit: number;
    startedAt: number;
  },
  handler: ApiV2Handler<TContext>,
  contextFactory: (rateLimit: MinuteRateLimitResult) => TContext
): Promise<NextResponse> {
  const rateLimit = await checkMinuteRateLimit({
    bucket: config.bucket,
    windowKey: config.windowKey,
    limit: config.limit,
  });

  if (!rateLimit.isAllowed) {
    const response = apiV2RateLimitError(rateLimit.retryAfterSeconds);
    setRateLimitHeaders(response, rateLimit);
    scheduleUsageLog({
      request,
      tier: config.tier,
      apiKeyId: config.apiKeyId,
      responseStatus: response.status,
      startedAt: config.startedAt,
    });
    return response;
  }

  try {
    const response = await handler(request, contextFactory(rateLimit));
    setApiV2Headers(response);
    setRateLimitHeaders(response, rateLimit);
    scheduleUsageLog({
      request,
      tier: config.tier,
      apiKeyId: config.apiKeyId,
      responseStatus: response.status,
      startedAt: config.startedAt,
    });
    return response;
  } catch (error) {
    console.error("[api-v2] Route handler failed:", error);
    const response = apiV2Error(
      "internal_error",
      "An internal error occurred",
      500
    );
    scheduleUsageLog({
      request,
      tier: config.tier,
      apiKeyId: config.apiKeyId,
      responseStatus: response.status,
      startedAt: config.startedAt,
    });
    return response;
  }
}

export function withOpenTier(
  handler: ApiV2Handler<ApiV2Context>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const startedAt = Date.now();
    const clientIp = getClientIp(request);
    const windowKey = hashRateLimitKey(clientIp ?? "unknown");

    return runTier(
      request,
      {
        tier: "open",
        apiKeyId: null,
        bucket: "v2-open",
        windowKey,
        limit: OPEN_TIER_RATE_LIMIT,
        startedAt,
      },
      handler,
      (rateLimit): ApiV2Context => ({
        tier: "open",
        apiKeyId: null,
        clientIp,
        rateLimit,
      })
    );
  };
}

function apiKeyRequiredResponse(): NextResponse {
  return apiV2Error(
    "api_key_required",
    `This endpoint requires an API key. Register at ${BRAND_DOMAIN}/developers`,
    401
  );
}

export function withKeyedTier(
  handler: ApiV2Handler<ApiV2KeyedContext>,
  requiredScopes: ApiKeyScope[]
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const startedAt = Date.now();
    const clientIp = getClientIp(request);
    const rawKey = extractApiKey(request);

    if (!rawKey) {
      const response = apiKeyRequiredResponse();
      scheduleUsageLog({
        request,
        tier: "keyed",
        apiKeyId: null,
        responseStatus: response.status,
        startedAt,
      });
      return response;
    }

    let handledByV2 = false;
    const authenticated = withApiAuth(async (req, authContext) => {
      handledByV2 = true;
      return runTier(
        req,
        {
          tier: "keyed",
          apiKeyId: authContext.apiKeyId,
          bucket: "v2-keyed",
          windowKey: authContext.apiKeyId,
          limit: KEYED_TIER_RATE_LIMIT,
          startedAt,
        },
        handler,
        (rateLimit) => ({
          ...authContext,
          v2: {
            tier: "keyed" as const,
            apiKeyId: authContext.apiKeyId,
            clientIp,
            rateLimit,
          },
        })
      );
    }, requiredScopes);

    const response = await authenticated(request);
    if (handledByV2) {
      return response;
    }

    let normalizedResponse = response;
    if (response.status === 401) {
      normalizedResponse = apiKeyRequiredResponse();
    } else if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? 60);
      normalizedResponse = apiV2RateLimitError(
        Number.isFinite(retryAfter) ? retryAfter : 60
      );
    } else {
      setApiV2Headers(normalizedResponse);
    }

    scheduleUsageLog({
      request,
      tier: "keyed",
      apiKeyId: null,
      responseStatus: normalizedResponse.status,
      startedAt,
    });

    return normalizedResponse;
  };
}
