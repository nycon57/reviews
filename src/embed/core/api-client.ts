import type {
  ActiveFilters,
  PublicWidgetConfig,
  ReviewsResponse,
  WidgetEntityOverride,
} from "../types";

const REQUEST_TIMEOUT_MS = 10_000;

export class WidgetApiError extends Error {
  status: number;
  code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = "WidgetApiError";
    this.status = status;
    this.code = code;
  }
}

function buildUrl(
  apiBase: string,
  widgetId: string,
  path: string,
  entityOverride?: WidgetEntityOverride | null,
): string {
  const url = new URL(
    `${apiBase}/api/v1/widgets/${encodeURIComponent(widgetId)}/${path}`,
    location.origin,
  );

  if (entityOverride?.entityType) {
    url.searchParams.set("entityType", entityOverride.entityType);
    if (entityOverride.entityId) {
      url.searchParams.set("entityId", entityOverride.entityId);
    }
  }

  return url.toString();
}

async function request<T>(url: string, signal: AbortSignal): Promise<T> {
  const controller = new AbortController();

  // Abort our controller when the external signal fires
  const onExternalAbort = () => controller.abort();
  signal.addEventListener("abort", onExternalAbort, { once: true });

  // Timeout: abort if request takes too long
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      let code: string | null = null;

      try {
        const data = (await res.json()) as { error?: string; code?: string };
        if (typeof data.error === "string" && data.error.length > 0) {
          message = data.error;
        }
        if (typeof data.code === "string" && data.code.length > 0) {
          code = data.code;
        }
      } catch {
        // Ignore non-JSON error bodies and fall back to HTTP status.
      }

      throw new WidgetApiError(message, res.status, code);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeoutId);
    signal.removeEventListener("abort", onExternalAbort);
  }
}

export function fetchConfig(
  apiBase: string,
  widgetId: string,
  signal: AbortSignal,
  entityOverride?: WidgetEntityOverride | null,
): Promise<PublicWidgetConfig> {
  return request<PublicWidgetConfig>(
    buildUrl(apiBase, widgetId, "config", entityOverride),
    signal,
  );
}

export function fetchReviews(
  apiBase: string,
  widgetId: string,
  signal: AbortSignal,
  limit = 10,
  cursor?: string,
  filters?: Partial<ActiveFilters>,
  entityOverride?: WidgetEntityOverride | null,
): Promise<ReviewsResponse> {
  const url = new URL(buildUrl(apiBase, widgetId, "reviews", entityOverride));
  url.searchParams.set("limit", String(limit));
  if (cursor) url.searchParams.set("cursor", cursor);
  if (filters) {
    if (filters.minRating) url.searchParams.set("minRating", String(filters.minRating));
    if (filters.sortOrder) url.searchParams.set("sortOrder", filters.sortOrder);
    if (filters.sources && filters.sources.length > 0) {
      url.searchParams.set("sources", filters.sources.join(","));
    }
    if (filters.loanTypes && filters.loanTypes.length > 0) {
      url.searchParams.set("loanTypes", filters.loanTypes.join(","));
    }
    if (filters.keywords && filters.keywords.length > 0) {
      url.searchParams.set("keywords", filters.keywords.join(","));
    }
    if (filters.dateRange) {
      url.searchParams.set("dateRange", filters.dateRange);
    }
  }
  return request<ReviewsResponse>(url.toString(), signal);
}

export function sendEvent(
  apiBase: string,
  widgetId: string,
  eventType: string,
  metadata?: Record<string, unknown>
): void {
  const url = buildUrl(apiBase, widgetId, "events");
  const body = JSON.stringify({
    event_type: eventType,
    page_url: location.href,
    referrer: document.referrer || null,
    metadata: metadata ?? null,
  });

  // Fire-and-forget: use sendBeacon if available, else fetch
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
  } else {
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      /* intentionally swallowed */
    });
  }
}
