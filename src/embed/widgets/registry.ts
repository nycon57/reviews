/**
 * Widget type registry — dispatches rendering to type-specific renderers.
 * Falls back to the generic renderer for unregistered types.
 */

import type { PublicWidgetConfig, PublicReview } from "../types";

export type WidgetRenderer = (
  root: ShadowRoot,
  config: PublicWidgetConfig,
  reviews: PublicReview[],
  apiBase: string
) => void;

const registry = new Map<string, WidgetRenderer>();

export function registerWidget(type: string, renderer: WidgetRenderer): void {
  registry.set(type, renderer);
}

export function getWidgetRenderer(type: string): WidgetRenderer | null {
  return registry.get(type) ?? null;
}
