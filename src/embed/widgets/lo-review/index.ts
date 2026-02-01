/**
 * LO Review Widget — registers the `lo_review` widget type.
 * Self-registers on import via side effect.
 */

import type { PublicWidgetConfig, PublicReview } from "../../types";
import { registerWidget } from "../registry";
import { LO_REVIEW_STYLES } from "./styles";
import { buildLoReviewDOM } from "./template";

/**
 * Applies theme CSS custom properties to the shadow host.
 */
function applyTheme(root: ShadowRoot, config: PublicWidgetConfig): void {
  const host = root.host as HTMLElement;
  const colors = config.config?.theme?.colors;
  const layout = config.config?.theme?.layout;

  if (colors?.background)
    host.style.setProperty("--rw-bg", colors.background);
  if (colors?.text) host.style.setProperty("--rw-text", colors.text);
  if (colors?.primary)
    host.style.setProperty("--rw-primary", colors.primary);
  if (colors?.border)
    host.style.setProperty("--rw-border", colors.border);
  if (layout?.maxWidth) host.style.maxWidth = layout.maxWidth;
  if (layout?.borderRadius)
    host.style.setProperty("--rw-radius", layout.borderRadius);
}

/**
 * Renders the LO Review Widget inside a Shadow DOM root.
 */
function renderLoReviewWidget(
  root: ShadowRoot,
  config: PublicWidgetConfig,
  reviews: PublicReview[],
  apiBase: string
): void {
  applyTheme(root, config);

  const style = document.createElement("style");
  style.textContent = LO_REVIEW_STYLES;
  root.appendChild(style);

  root.appendChild(buildLoReviewDOM(config, reviews, apiBase));
}

registerWidget("lo_review", renderLoReviewWidget);

export { renderLoReviewWidget };
