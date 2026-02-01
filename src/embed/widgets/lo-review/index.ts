/**
 * LO Review Widget — registers the `lo_review` widget type.
 * Self-registers on import via side effect.
 */

import type { PublicWidgetConfig, PublicReview } from "../../types";
import { registerWidget } from "../registry";
import { applyTheme } from "../../core/dom-helpers";
import { LO_REVIEW_STYLES } from "./styles";
import { buildLoReviewDOM } from "./template";

/**
 * Renders the LO Review Widget inside a Shadow DOM root.
 */
function renderLoReviewWidget(
  root: ShadowRoot,
  config: PublicWidgetConfig,
  reviews: PublicReview[],
  apiBase: string
): void {
  applyTheme(root, config.config?.theme?.colors, config.config?.theme?.layout);

  const style = document.createElement("style");
  style.textContent = LO_REVIEW_STYLES;
  root.appendChild(style);

  root.appendChild(buildLoReviewDOM(config, reviews, apiBase));
}

registerWidget("lo_review", renderLoReviewWidget);

export { renderLoReviewWidget };
