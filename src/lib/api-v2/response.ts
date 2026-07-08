import { NextResponse } from "next/server";

export const API_V2_SOURCE = "repwell-public-api-v2";
export const OPEN_TIER_CACHE_CONTROL = "public, max-age=300";
export const NO_STORE_CACHE_CONTROL = "no-store";

type ApiV2ResponseInit = {
  status?: number;
  headers?: Record<string, string>;
  cacheControl?: string;
};

export function setApiV2Headers(response: NextResponse): NextResponse {
  response.headers.set("X-RepWell-Source", API_V2_SOURCE);
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, X-API-Key"
  );
  if (!response.headers.has("Cache-Control")) {
    response.headers.set("Cache-Control", NO_STORE_CACHE_CONTROL);
  }
  return response;
}

export function apiV2Json(
  body: unknown,
  init?: ApiV2ResponseInit
): NextResponse {
  const response = NextResponse.json(body, {
    status: init?.status,
    headers: init?.headers,
  });
  if (init?.cacheControl) {
    response.headers.set("Cache-Control", init.cacheControl);
  }
  return setApiV2Headers(response);
}

export function apiV2Error(
  error: string,
  message: string,
  status: number,
  headers?: Record<string, string>
): NextResponse {
  return apiV2Json(
    { error, message },
    {
      status,
      headers,
      cacheControl: NO_STORE_CACHE_CONTROL,
    }
  );
}

export function apiV2RateLimitError(retryAfter: number): NextResponse {
  return apiV2Json(
    {
      error: "rate_limit_exceeded",
      retry_after: retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
      },
      cacheControl: NO_STORE_CACHE_CONTROL,
    }
  );
}

export function apiV2Paginated<T>(
  data: T[],
  pagination: {
    total: number;
    page: number;
    perPage: number;
  },
  init?: ApiV2ResponseInit
): NextResponse {
  const totalPages =
    pagination.total === 0
      ? 0
      : Math.ceil(pagination.total / pagination.perPage);

  return apiV2Json(
    {
      data,
      total: pagination.total,
      page: pagination.page,
      per_page: pagination.perPage,
      total_pages: totalPages,
    },
    init
  );
}

export function handleApiV2Options(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, X-API-Key",
      "Cache-Control": NO_STORE_CACHE_CONTROL,
    },
  });
}
