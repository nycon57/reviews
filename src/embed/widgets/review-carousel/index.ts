/**
 * Review Carousel Widget — registers the `review_carousel` widget type.
 * Self-registers on import via side effect.
 */

import type { PublicWidgetConfig, PublicReview } from "../../types";
import { registerWidget } from "../registry";
import { applyTheme } from "../../core/dom-helpers";
import { REVIEW_CAROUSEL_STYLES } from "./styles";
import { COMPANY_REVIEW_STYLES } from "../company-review/styles";
import { buildReviewCarouselDOM } from "./template";

/**
 * Renders the Review Carousel Widget inside a Shadow DOM root.
 * Injects both company-review styles (for shared rw-co- card classes)
 * and carousel-specific styles.
 */
function renderReviewCarouselWidget(
  root: ShadowRoot,
  config: PublicWidgetConfig,
  reviews: PublicReview[],
  apiBase: string,
): void {
  applyTheme(root, config.config?.theme?.colors, config.config?.theme?.layout, config.config?.theme?.typography);

  const style = document.createElement("style");
  style.textContent = COMPANY_REVIEW_STYLES + REVIEW_CAROUSEL_STYLES;
  root.appendChild(style);

  root.appendChild(buildReviewCarouselDOM(config, reviews, apiBase));
}

registerWidget("review_carousel", renderReviewCarouselWidget);

export { renderReviewCarouselWidget };
