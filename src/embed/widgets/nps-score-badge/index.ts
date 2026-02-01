/**
 * NPS Score Badge Widget — registers the `nps_score_badge` widget type.
 * Self-registers on import via side effect.
 */

import type { PublicWidgetConfig, PublicReview } from "../../types";
import { registerWidget } from "../registry";
import { applyTheme } from "../../core/dom-helpers";
import { NPS_SCORE_BADGE_STYLES } from "./styles";
import { buildNpsScoreBadgeDOM } from "./template";

function renderNpsScoreBadgeWidget(
  root: ShadowRoot,
  config: PublicWidgetConfig,
  _reviews: PublicReview[],
  apiBase: string,
): void {
  // NPS badge is compact — reset the default 280px minHeight set during skeleton
  const host = root.host as HTMLElement;
  host.style.minHeight = "";

  applyTheme(
    root,
    config.config?.theme?.colors,
    config.config?.theme?.layout,
    config.config?.theme?.typography,
  );

  const style = document.createElement("style");
  style.textContent = NPS_SCORE_BADGE_STYLES;
  root.appendChild(style);

  root.appendChild(buildNpsScoreBadgeDOM(config, apiBase));
}

registerWidget("nps_score_badge", renderNpsScoreBadgeWidget);

export { renderNpsScoreBadgeWidget };
