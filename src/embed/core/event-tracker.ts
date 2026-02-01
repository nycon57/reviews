/**
 * Lightweight widget event tracking.
 * Sends analytics events to the /events endpoint via sendBeacon (fire-and-forget).
 */

import { sendEvent } from "./api-client";
import { canSendEvent } from "./session-rate-limiter";

let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    // Simple random session ID (no crypto dependency for size)
    sessionId =
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 10);
  }
  return sessionId;
}

export { getSessionId };

export function trackImpression(apiBase: string, widgetId: string): void {
  if (!canSendEvent(widgetId)) return;
  sendEvent(apiBase, widgetId, "impression", { session_id: getSessionId() });
}

export function trackClick(
  apiBase: string,
  widgetId: string,
  eventType: string,
  metadata?: Record<string, unknown>
): void {
  if (!canSendEvent(widgetId)) return;
  sendEvent(apiBase, widgetId, eventType, {
    ...metadata,
    session_id: getSessionId(),
  });
}
