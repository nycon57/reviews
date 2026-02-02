/**
 * JS Hooks event bus for RepWell widgets.
 *
 * Provides RepWell.on(widgetId, event, callback) and RepWell.off()
 * for external host pages to subscribe to widget lifecycle events.
 */

import type { HookEvent, HookCallback, HookEventData } from "../types";

// Keyed by `${widgetId}:${event}`
const listeners = new Map<string, Set<HookCallback>>();

function key(widgetId: string, event: HookEvent): string {
  return `${widgetId}:${event}`;
}

export function addHookListener(
  widgetId: string,
  event: HookEvent,
  callback: HookCallback,
): void {
  const k = key(widgetId, event);
  let set = listeners.get(k);
  if (!set) {
    set = new Set();
    listeners.set(k, set);
  }
  set.add(callback);
}

export function removeHookListener(
  widgetId: string,
  event: HookEvent,
  callback: HookCallback,
): void {
  const k = key(widgetId, event);
  const set = listeners.get(k);
  if (set) {
    set.delete(callback);
    if (set.size === 0) listeners.delete(k);
  }
}

export function emitHookEvent(
  widgetId: string,
  event: HookEvent,
  data: Omit<HookEventData, "widgetId" | "event">,
): void {
  const k = key(widgetId, event);
  const set = listeners.get(k);
  if (!set || set.size === 0) return;

  const eventData: HookEventData = {
    widgetId,
    event,
    ...data,
  };

  for (const cb of set) {
    try {
      cb(eventData);
    } catch (err) {
      console.warn(`[RepWell] Hook callback error for "${event}" on "${widgetId}":`, err);
    }
  }
}

export function clearHookListeners(widgetId: string): void {
  for (const k of listeners.keys()) {
    if (k.startsWith(`${widgetId}:`)) {
      listeners.delete(k);
    }
  }
}
