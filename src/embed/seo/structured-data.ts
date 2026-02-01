/**
 * JSON-LD structured data injection and cleanup for the embed script.
 *
 * Injects a <script type="application/ld+json"> into the host page <head>
 * (outside Shadow DOM) so search engines can discover it. Tracks injected
 * elements per widget ID to prevent duplicates and enable cleanup on destroy.
 */

import type { PublicWidgetConfig, PublicReview, EntityProfile } from "../types";
import { buildJsonLdFromWidget } from "./schemas";

// Track injected script elements per widget ID to prevent duplicates and enable cleanup
const injectedScripts = new Map<string, HTMLScriptElement>();

/**
 * Inject JSON-LD structured data into the host page <head>.
 *
 * Only injects if `config.enable_structured_data` is true.
 * Prevents duplicate injection for the same widget ID.
 */
export function injectStructuredData(
  config: PublicWidgetConfig,
  reviews: PublicReview[],
  profile?: EntityProfile | null
): void {
  if (!config.enable_structured_data) return;

  // Prevent duplicate injection for the same widget
  if (injectedScripts.has(config.widget_id)) return;

  const jsonLd = buildJsonLdFromWidget(config, reviews, profile);
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute("data-repwell-widget-id", config.widget_id);
  script.textContent = JSON.stringify(jsonLd);

  document.head.appendChild(script);
  injectedScripts.set(config.widget_id, script);
}

/**
 * Remove the JSON-LD script element for a specific widget.
 * Called during RepWell.destroy(widgetId).
 */
export function removeStructuredData(widgetId: string): void {
  const script = injectedScripts.get(widgetId);
  if (script) {
    script.remove();
    injectedScripts.delete(widgetId);
  }
}

/**
 * Remove all injected JSON-LD script elements.
 * Useful for full cleanup.
 */
export function removeAllStructuredData(): void {
  for (const [id, script] of injectedScripts) {
    script.remove();
    injectedScripts.delete(id);
  }
}
