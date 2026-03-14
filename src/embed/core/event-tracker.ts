/**
 * Lightweight widget event tracking.
 * Sends analytics events to the /events endpoint via sendBeacon (fire-and-forget).
 */

import type { PublicWidgetConfig, WidgetInstance } from "../types";
import { sendEvent } from "./api-client";
import { canSendEvent } from "./session-rate-limiter";
import { emitHookEvent } from "./hooks";

/** Maps analytics event types to JS hook events. */
const HOOK_EVENT_MAP: Record<string, "review-clicked" | "cta-clicked"> = {
  click_review: "review-clicked",
  click_cta: "cta-clicked",
};

let sessionId: string | null = null;

type WidgetEventSource =
  | string
  | Pick<PublicWidgetConfig, "widget_id" | "entity_type" | "entity_id" | "override_applied">
  | Pick<WidgetInstance, "widgetId" | "entityOverride" | "config">;

export function getSessionId(): string {
  if (!sessionId) {
    sessionId =
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 10);
  }
  return sessionId;
}

function resolveWidgetId(source: WidgetEventSource): string {
  if (typeof source === "string") return source;
  if ("widget_id" in source) return source.widget_id;
  return source.widgetId;
}

function buildEntityMetadata(
  source: WidgetEventSource,
  metadata: Record<string, unknown> = {},
): Record<string, unknown> {
  if (typeof source === "string") {
    return metadata;
  }

  if ("widget_id" in source) {
    return {
      ...metadata,
      entity_type: source.entity_type,
      entity_id: source.entity_id,
      override_applied: Boolean(source.override_applied),
    };
  }

  return {
    ...metadata,
    entity_type: source.config?.entity_type ?? source.entityOverride?.entityType,
    entity_id: source.config?.entity_id ?? source.entityOverride?.entityId ?? null,
    override_applied:
      source.config?.override_applied ?? Boolean(source.entityOverride),
  };
}

export function trackImpression(apiBase: string, source: WidgetEventSource): void {
  const widgetId = resolveWidgetId(source);
  if (!canSendEvent(widgetId)) return;
  sendEvent(
    apiBase,
    widgetId,
    "impression",
    buildEntityMetadata(source, { session_id: getSessionId() }),
  );
}

export function trackClick(
  apiBase: string,
  source: WidgetEventSource,
  eventType: string,
  metadata?: Record<string, unknown>
): void {
  const widgetId = resolveWidgetId(source);
  if (!canSendEvent(widgetId)) return;
  sendEvent(apiBase, widgetId, eventType, {
    session_id: getSessionId(),
    ...buildEntityMetadata(source, metadata),
  });
  const hookEvent = HOOK_EVENT_MAP[eventType];
  if (hookEvent) {
    emitHookEvent(widgetId, hookEvent, metadata ?? {});
  }
}
