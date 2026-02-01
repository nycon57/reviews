/**
 * Company Review Widget — registers the `company_review` widget type.
 * Self-registers on import via side effect.
 */

import type { PublicWidgetConfig, PublicReview } from "../../types";
import { registerWidget, getInstanceForRoot } from "../registry";
import { applyTheme } from "../../core/dom-helpers";
import { COMPANY_REVIEW_STYLES } from "./styles";
import { buildCompanyReviewDOM } from "./template";

/**
 * Renders the Company Review Widget inside a Shadow DOM root.
 */
function renderCompanyReviewWidget(
  root: ShadowRoot,
  config: PublicWidgetConfig,
  reviews: PublicReview[],
  apiBase: string,
): void {
  applyTheme(root, config.config?.theme?.colors, config.config?.theme?.layout, config.config?.theme?.typography);

  const style = document.createElement("style");
  style.textContent = COMPANY_REVIEW_STYLES;
  root.appendChild(style);

  const instance = getInstanceForRoot(root);
  root.appendChild(buildCompanyReviewDOM(config, reviews, apiBase, instance ?? undefined));
}

registerWidget("company_review", renderCompanyReviewWidget);

export { renderCompanyReviewWidget };
