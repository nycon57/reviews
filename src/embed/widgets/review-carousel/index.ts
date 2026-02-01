/**
 * Review Carousel Widget — registers the `review_carousel` widget type.
 * Self-registers on import via side effect.
 */

import type { PublicWidgetConfig, PublicReview } from "../../types";
import { registerWidget, getInstanceForRoot } from "../registry";
import { applyTheme } from "../../core/dom-helpers";
import { REVIEW_CAROUSEL_STYLES } from "./styles";
import { COMPANY_REVIEW_STYLES } from "../company-review/styles";
import { buildReviewCarouselDOM } from "./template";
import { buildFilterControls } from "../shared/filter-controls";

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

  const widgetDOM = buildReviewCarouselDOM(config, reviews, apiBase);
  root.appendChild(widgetDOM);

  const instance = getInstanceForRoot(root);
  if (config.config?.content?.showFilters && instance) {
    const reviewsContainer = (widgetDOM.querySelector(".rw-carousel") as HTMLElement) ?? widgetDOM;
    const filterControls = buildFilterControls({
      instance,
      config,
      apiBase,
      reviewsContainer,
      renderReviews: (filteredReviews) => {
        while (root.lastChild && root.lastChild !== style) {
          root.lastChild.remove();
        }
        const newDOM = buildReviewCarouselDOM(config, filteredReviews, apiBase);
        root.appendChild(newDOM);
        newDOM.insertBefore(filterControls, newDOM.firstChild);
      },
    });
    widgetDOM.insertBefore(filterControls, widgetDOM.firstChild);
  }
}

registerWidget("review_carousel", renderReviewCarouselWidget);

export { renderReviewCarouselWidget };
