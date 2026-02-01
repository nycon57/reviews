/**
 * LO Review Widget — registers the `lo_review` widget type.
 * Self-registers on import via side effect.
 */

import type { PublicWidgetConfig, PublicReview } from "../../types";
import { registerWidget, getInstanceForRoot } from "../registry";
import { applyTheme } from "../../core/dom-helpers";
import { LO_REVIEW_STYLES } from "./styles";
import { buildLoReviewDOM } from "./template";
import { buildFilterControls } from "../shared/filter-controls";

/**
 * Renders the LO Review Widget inside a Shadow DOM root.
 */
function renderLoReviewWidget(
  root: ShadowRoot,
  config: PublicWidgetConfig,
  reviews: PublicReview[],
  apiBase: string
): void {
  applyTheme(root, config.config?.theme?.colors, config.config?.theme?.layout, config.config?.theme?.typography);

  const style = document.createElement("style");
  style.textContent = LO_REVIEW_STYLES;
  root.appendChild(style);

  const instance = getInstanceForRoot(root);
  const widgetDOM = buildLoReviewDOM(config, reviews, apiBase, instance ?? undefined);
  root.appendChild(widgetDOM);

  if (config.config?.content?.showFilters && instance) {
    const reviewsContainer = (widgetDOM.querySelector(".rw-lo-reviews") as HTMLElement) ?? widgetDOM;
    const filterControls = buildFilterControls({
      instance,
      config,
      apiBase,
      reviewsContainer,
      renderReviews: (filteredReviews) => {
        while (root.lastChild && root.lastChild !== style) {
          root.lastChild.remove();
        }
        const newDOM = buildLoReviewDOM(config, filteredReviews, apiBase, instance ?? undefined);
        root.appendChild(newDOM);
        const target = newDOM.querySelector(".rw-lo-reviews");
        if (target) newDOM.insertBefore(filterControls, target);
      },
    });
    const target = widgetDOM.querySelector(".rw-lo-reviews");
    if (target) widgetDOM.insertBefore(filterControls, target);
  }
}

registerWidget("lo_review", renderLoReviewWidget);

export { renderLoReviewWidget };
