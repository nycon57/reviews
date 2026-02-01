/**
 * Star Rating Badge Widget — registers the `star_rating_badge` widget type.
 * Self-registers on import via side effect.
 */

import type { PublicWidgetConfig, PublicReview } from "../../types";
import { registerWidget } from "../registry";
import { applyTheme } from "../../core/dom-helpers";
import { STAR_RATING_BADGE_STYLES } from "./styles";
import { buildStarRatingBadgeDOM } from "./template";

/**
 * Renders the Star Rating Badge Widget inside a Shadow DOM root.
 */
function renderStarRatingBadgeWidget(
  root: ShadowRoot,
  config: PublicWidgetConfig,
  _reviews: PublicReview[],
  apiBase: string
): void {
  applyTheme(root, config.config?.theme?.colors, config.config?.theme?.layout);

  const style = document.createElement("style");
  style.textContent = STAR_RATING_BADGE_STYLES;
  root.appendChild(style);

  root.appendChild(buildStarRatingBadgeDOM(config, apiBase, root));
}

registerWidget("star_rating_badge", renderStarRatingBadgeWidget);

export { renderStarRatingBadgeWidget };
