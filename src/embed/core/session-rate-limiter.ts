/**
 * Client-side session rate limiter.
 * Limits to MAX_EVENTS_PER_SESSION events per widget per visitor session.
 * Prevents noisy/abusive clients from flooding the event endpoint.
 */

const MAX_EVENTS_PER_SESSION = 50;

const counters = new Map<string, number>();

/**
 * Check if an event can be sent for the given widget.
 * Returns true if under the limit, false if rate-limited.
 */
export function canSendEvent(widgetId: string): boolean {
  const count = counters.get(widgetId) ?? 0;
  if (count >= MAX_EVENTS_PER_SESSION) {
    return false;
  }
  counters.set(widgetId, count + 1);
  return true;
}
