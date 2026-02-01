/**
 * Lightweight widget event tracking.
 * Sends analytics events to the /events endpoint via sendBeacon (fire-and-forget).
 */

import { sendEvent } from "./api-client";

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

export function trackImpression(apiBase: string, widgetId: string): void {
  sendEvent(apiBase, widgetId, "impression", { session_id: getSessionId() });
}

export function trackClick(
  apiBase: string,
  widgetId: string,
  eventType: string,
  metadata?: Record<string, unknown>
): void {
  sendEvent(apiBase, widgetId, eventType, {
    ...metadata,
    session_id: getSessionId(),
  });
}
