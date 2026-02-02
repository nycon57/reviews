/**
 * Lightweight widget event tracking.
 * Sends analytics events to the /events endpoint via sendBeacon (fire-and-forget).
 */

import { sendEvent } from "./api-client";
import { canSendEvent } from "./session-rate-limiter";
import { emitHookEvent } from "./hooks";

/** Maps analytics event types to JS hook events. */
const HOOK_EVENT_MAP: Record<string, "review-clicked" | "cta-clicked"> = {
  click_review: "review-clicked",
  click_cta: "cta-clicked",
};

let sessionId: string | null = null;

export function getSessionId(): string {
  if (!sessionId) {
    sessionId =
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 10);
  }
  return sessionId;
}

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
  const hookEvent = HOOK_EVENT_MAP[eventType];
  if (hookEvent) {
    emitHookEvent(widgetId, hookEvent, metadata ?? {});
  }
}
