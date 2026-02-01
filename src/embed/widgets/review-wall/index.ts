/**
 * Review Wall Widget — registers the `review_wall` widget type.
 * Self-registers on import via side effect.
 */

import type { PublicWidgetConfig, PublicReview } from "../../types";
import { registerWidget } from "../registry";
import { applyTheme } from "../../core/dom-helpers";
import { REVIEW_WALL_STYLES } from "./styles";
import { COMPANY_REVIEW_STYLES } from "../company-review/styles";
import { buildReviewWallDOM } from "./template";

/**
 * Renders the Review Wall Widget inside a Shadow DOM root.
 * Injects company-review styles (for shared rw-co- card classes)
 * and wall-specific styles.
 */
function renderReviewWallWidget(
  root: ShadowRoot,
  config: PublicWidgetConfig,
  reviews: PublicReview[],
  apiBase: string,
): void {
  applyTheme(
    root,
    config.config?.theme?.colors,
    config.config?.theme?.layout,
    config.config?.theme?.typography,
  );

  const style = document.createElement("style");
  style.textContent = COMPANY_REVIEW_STYLES + REVIEW_WALL_STYLES;
  root.appendChild(style);

  root.appendChild(buildReviewWallDOM(config, reviews, apiBase));
}

registerWidget("review_wall", renderReviewWallWidget);

export { renderReviewWallWidget };
