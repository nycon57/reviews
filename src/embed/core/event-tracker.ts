/**
 * Lightweight widget event tracking.
 * Sends analytics events to the /events endpoint via sendBeacon (fire-and-forget).
 */

import { sendEvent } from "./api-client";
import { canSendEvent } from "./session-rate-limiter";
import type { HookEvent } from "../types";
import { emitHookEvent } from "./hooks";

/** Maps analytics event types to JS hook events. */
const HOOK_EVENT_MAP: Record<string, HookEvent> = {
  click_review: "review-clicked",
  click_cta: "cta-clicked",
};

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

  // Emit corresponding JS hook event if mapped
  const hookEvent = HOOK_EVENT_MAP[eventType];
  if (hookEvent) {
    emitHookEvent(widgetId, hookEvent, metadata ?? {});
  }
}
