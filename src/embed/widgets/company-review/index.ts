/**
 * Company Review Widget — registers the `company_review` widget type.
 * Self-registers on import via side effect.
 */

import type { PublicWidgetConfig, PublicReview } from "../../types";
import { registerWidget } from "../registry";
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
  apiBase: string
): void {
  applyTheme(root, config.config?.theme?.colors, config.config?.theme?.layout);

  const style = document.createElement("style");
  style.textContent = COMPANY_REVIEW_STYLES;
  root.appendChild(style);

  root.appendChild(buildCompanyReviewDOM(config, reviews, apiBase));
}

registerWidget("company_review", renderCompanyReviewWidget);

export { renderCompanyReviewWidget };
