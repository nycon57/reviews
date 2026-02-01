/**
 * Review Wall Widget — registers the `review_wall` widget type.
 * Self-registers on import via side effect.
 */

import type { PublicWidgetConfig, PublicReview } from "../../types";
import { registerWidget, getInstanceForRoot } from "../registry";
import { applyTheme } from "../../core/dom-helpers";
import { REVIEW_WALL_STYLES } from "./styles";
import { COMPANY_REVIEW_STYLES } from "../company-review/styles";
import { buildReviewWallDOM } from "./template";
import { buildFilterControls } from "../shared/filter-controls";

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

  const widgetDOM = buildReviewWallDOM(config, reviews, apiBase);
  root.appendChild(widgetDOM);

  const instance = getInstanceForRoot(root);
  if (config.config?.content?.showFilters && instance) {
    const grid = widgetDOM.querySelector(".rw-wall__grid") as HTMLElement;
    const reviewsContainer = grid ?? widgetDOM;
    const filterControls = buildFilterControls({
      instance,
      config,
      apiBase,
      reviewsContainer,
      renderReviews: (filteredReviews) => {
        // Re-render the wall with filtered reviews
        while (root.lastChild && root.lastChild !== style) {
          root.lastChild.remove();
        }
        const newDOM = buildReviewWallDOM(config, filteredReviews, apiBase);
        root.appendChild(newDOM);
        const newGrid = newDOM.querySelector(".rw-wall__grid");
        if (newGrid) newDOM.insertBefore(filterControls, newGrid.parentElement ?? newGrid);
      },
    });
    // Insert filter controls before the grid wrapper
    const gridWrapper = widgetDOM.querySelector(".rw-wall__grid-wrapper");
    if (gridWrapper) {
      widgetDOM.insertBefore(filterControls, gridWrapper);
    } else {
      widgetDOM.insertBefore(filterControls, widgetDOM.firstChild);
    }
  }
}

registerWidget("review_wall", renderReviewWallWidget);

export { renderReviewWallWidget };
