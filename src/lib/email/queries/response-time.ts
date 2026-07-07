/**
 * Review response-time metric for weekly summaries.
 *
 * "How long does it take to respond to a review" = the mean, over responded
 * reviews in the window, of (response_at − (published_at ?? review_date)).
 * Responses are stored inline on the reviews table (response_at / response_text),
 * so this is computed in JS from the responded rows rather than in SQL (the house
 * pattern for these summary queries). Returns null when nothing is computable, so
 * the caller can omit the metric instead of showing a fabricated value.
 */

export interface ReviewResponseTiming {
  response_at: string | null;
  published_at: string | null;
  review_date: string | null;
}

/**
 * Mean time-to-respond in milliseconds, or null when no responded review has a
 * usable (non-negative) timing pair.
 */
export function computeAverageResponseMs(
  rows: ReviewResponseTiming[]
): number | null {
  const durations: number[] = [];
  for (const row of rows) {
    if (!row.response_at) continue;
    const responded = Date.parse(row.response_at);
    // published_at is the moment the review went live; fall back to review_date
    // for reviews imported/created without a distinct publish timestamp.
    const baseIso = row.published_at ?? row.review_date;
    if (!baseIso) continue;
    const base = Date.parse(baseIso);
    if (Number.isNaN(responded) || Number.isNaN(base)) continue;
    const delta = responded - base;
    // Guard against clock skew / out-of-order timestamps.
    if (delta < 0) continue;
    durations.push(delta);
  }
  if (durations.length === 0) return null;
  return durations.reduce((sum, d) => sum + d, 0) / durations.length;
}

/**
 * Human-readable duration for the email, e.g. "45 minutes", "6 hours", "2.5 days".
 * Returns null for null/invalid input so the caller can omit the row.
 */
export function formatResponseDuration(ms: number | null): string | null {
  if (ms === null || !Number.isFinite(ms) || ms < 0) return null;

  const minutes = ms / 60000;
  if (minutes < 60) {
    const m = Math.max(1, Math.round(minutes));
    return `${m} minute${m !== 1 ? "s" : ""}`;
  }

  const hours = minutes / 60;
  if (hours < 48) {
    const h = Math.round(hours);
    return `${h} hour${h !== 1 ? "s" : ""}`;
  }

  const days = Math.round((hours / 24) * 10) / 10;
  return `${days} day${days !== 1 ? "s" : ""}`;
}

/** Convenience: compute + format straight from the rows. Null when uncomputable. */
export function averageResponseTimeLabel(
  rows: ReviewResponseTiming[]
): string | null {
  return formatResponseDuration(computeAverageResponseMs(rows));
}
