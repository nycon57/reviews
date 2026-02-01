import type { ActiveFilters, PublicWidgetConfig, ReviewsResponse } from "../types";

const REQUEST_TIMEOUT_MS = 10_000;

function buildUrl(apiBase: string, widgetId: string, path: string): string {
  return `${apiBase}/api/v1/widgets/${encodeURIComponent(widgetId)}/${path}`;
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
      throw new Error(`HTTP ${res.status}`);
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
  signal: AbortSignal
): Promise<PublicWidgetConfig> {
  return request<PublicWidgetConfig>(buildUrl(apiBase, widgetId, "config"), signal);
}

export function fetchReviews(
  apiBase: string,
  widgetId: string,
  signal: AbortSignal,
  limit = 10,
  cursor?: string,
  filters?: Partial<ActiveFilters>
): Promise<ReviewsResponse> {
  let url = buildUrl(apiBase, widgetId, "reviews") + `?limit=${limit}`;
  if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
  if (filters) {
    if (filters.minRating) url += `&minRating=${filters.minRating}`;
    if (filters.sortOrder) url += `&sortOrder=${encodeURIComponent(filters.sortOrder)}`;
    if (filters.sources && filters.sources.length > 0)
      url += `&sources=${encodeURIComponent(filters.sources.join(","))}`;
    if (filters.loanTypes && filters.loanTypes.length > 0)
      url += `&loanTypes=${encodeURIComponent(filters.loanTypes.join(","))}`;
    if (filters.keywords && filters.keywords.length > 0)
      url += `&keywords=${encodeURIComponent(filters.keywords.join(","))}`;
    if (filters.dateRange)
      url += `&dateRange=${encodeURIComponent(filters.dateRange)}`;
  }
  return request<ReviewsResponse>(url, signal);
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
