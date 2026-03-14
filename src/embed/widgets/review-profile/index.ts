/**
 * Review Profile Widget — registers the `review_profile` widget type.
 * Dispatches to the appropriate renderer based on entity_type.
 * Self-registers on import via side effect.
 */

import type { PublicWidgetConfig, PublicReview } from "../../types";
import { registerWidget, getInstanceForRoot } from "../registry";
import { applyTheme } from "../../core/dom-helpers";

import { LO_REVIEW_STYLES } from "../lo-review/styles";
import { buildLoReviewDOM } from "../lo-review/template";

import { COMPANY_REVIEW_STYLES } from "../company-review/styles";
import { buildCompanyReviewDOM } from "../company-review/template";

import { BRANCH_REVIEW_STYLES } from "../branch-review/styles";
import { buildBranchReviewDOM } from "../branch-review/template";

function renderReviewProfileWidget(
  root: ShadowRoot,
  config: PublicWidgetConfig,
  reviews: PublicReview[],
  apiBase: string,
): void {
  applyTheme(root, config.config?.theme?.colors, config.config?.theme?.layout, config.config?.theme?.typography);

  const instance = getInstanceForRoot(root);
  const entityType = config.entity_type;

  if (entityType === "user") {
    const style = document.createElement("style");
    style.textContent = LO_REVIEW_STYLES;
    root.appendChild(style);
    root.appendChild(buildLoReviewDOM(config, reviews, apiBase, instance ?? undefined));
  } else if (entityType === "branch") {
    const style = document.createElement("style");
    style.textContent = COMPANY_REVIEW_STYLES + BRANCH_REVIEW_STYLES;
    root.appendChild(style);
    root.appendChild(buildBranchReviewDOM(config, reviews, apiBase, instance ?? undefined));
  } else {
    // Default: organization
    const style = document.createElement("style");
    style.textContent = COMPANY_REVIEW_STYLES;
    root.appendChild(style);
    root.appendChild(buildCompanyReviewDOM(config, reviews, apiBase, instance ?? undefined));
  }
}

registerWidget("review_profile", renderReviewProfileWidget);
