/**
 * Branch Review Widget — registers the `branch_review` widget type.
 * Self-registers on import via side effect.
 */

import type { PublicWidgetConfig, PublicReview } from "../../types";
import { registerWidget, getInstanceForRoot } from "../registry";
import { applyTheme } from "../../core/dom-helpers";
import { BRANCH_REVIEW_STYLES } from "./styles";
import { COMPANY_REVIEW_STYLES } from "../company-review/styles";
import { buildBranchReviewDOM } from "./template";
import { buildFilterControls } from "../shared/filter-controls";

/**
 * Renders the Branch Review Widget inside a Shadow DOM root.
 * Injects both company-review styles (for shared sections like distribution,
 * sources, filters, review cards) and branch-specific styles.
 */
function renderBranchReviewWidget(
  root: ShadowRoot,
  config: PublicWidgetConfig,
  reviews: PublicReview[],
  apiBase: string
): void {
  applyTheme(root, config.config?.theme?.colors, config.config?.theme?.layout, config.config?.theme?.typography);

  const style = document.createElement("style");
  style.textContent = COMPANY_REVIEW_STYLES + BRANCH_REVIEW_STYLES;
  root.appendChild(style);

  const instance = getInstanceForRoot(root);
  const widgetDOM = buildBranchReviewDOM(config, reviews, apiBase);
  root.appendChild(widgetDOM);

  if (config.config?.content?.showFilters && instance) {
    const reviewsContainer = (widgetDOM.querySelector(".rw-co-reviews") as HTMLElement) ?? widgetDOM;
    const filterControls = buildFilterControls({
      instance,
      config,
      apiBase,
      reviewsContainer,
      renderReviews: (filteredReviews) => {
        while (root.lastChild && root.lastChild !== style) {
          root.lastChild.remove();
        }
        const newDOM = buildBranchReviewDOM(config, filteredReviews, apiBase);
        root.appendChild(newDOM);
        const target = newDOM.querySelector(".rw-co-reviews");
        if (target) newDOM.insertBefore(filterControls, target);
      },
    });
    const target = widgetDOM.querySelector(".rw-co-reviews");
    if (target) widgetDOM.insertBefore(filterControls, target);
  }
}

registerWidget("branch_review", renderBranchReviewWidget);

export { renderBranchReviewWidget };
