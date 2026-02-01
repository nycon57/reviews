/**
 * Branch Review Widget — registers the `branch_review` widget type.
 * Self-registers on import via side effect.
 */

import type { PublicWidgetConfig, PublicReview } from "../../types";
import { registerWidget } from "../registry";
import { applyTheme } from "../../core/dom-helpers";
import { BRANCH_REVIEW_STYLES } from "./styles";
import { COMPANY_REVIEW_STYLES } from "../company-review/styles";
import { buildBranchReviewDOM } from "./template";

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

  root.appendChild(buildBranchReviewDOM(config, reviews, apiBase));
}

registerWidget("branch_review", renderBranchReviewWidget);

export { renderBranchReviewWidget };
