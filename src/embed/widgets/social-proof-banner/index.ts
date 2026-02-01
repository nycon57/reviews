/**
 * Social Proof Banner Widget — registers the `social_proof_banner` widget type.
 * Self-registers on import via side effect.
 *
 * Unlike other widgets, the banner renders in its own Shadow DOM host appended to
 * document.body for proper fixed positioning, rather than inside the page-embedded
 * widget container.
 */

import type { PublicWidgetConfig, PublicReview } from "../../types";
import { registerWidget } from "../registry";
import { applyTheme } from "../../core/dom-helpers";
import { SOCIAL_PROOF_BANNER_STYLES } from "./styles";
import { buildSocialProofBannerDOM } from "./template";

function renderSocialProofBannerWidget(
  root: ShadowRoot,
  config: PublicWidgetConfig,
  reviews: PublicReview[],
  apiBase: string
): void {
  // Banner is fixed-position overlay — reset the default minHeight
  const host = root.host as HTMLElement;
  host.style.minHeight = "";
  // Hide the original container since banner renders as a fixed overlay
  host.style.display = "none";

  // Create a separate host element on document.body for fixed positioning
  const bannerHost = document.createElement("div");
  bannerHost.setAttribute("data-repwell-banner", config.widget_id);
  document.body.appendChild(bannerHost);

  const bannerRoot = bannerHost.attachShadow({ mode: "open" });

  // Apply theme
  applyTheme(
    bannerRoot,
    config.config?.theme?.colors,
    config.config?.theme?.layout,
    config.config?.theme?.typography
  );

  // Inject styles
  const style = document.createElement("style");
  style.textContent = SOCIAL_PROOF_BANNER_STYLES;
  bannerRoot.appendChild(style);

  // Build and mount banner DOM
  const { cleanup } = buildSocialProofBannerDOM(
    config,
    reviews,
    apiBase,
    bannerRoot
  );

  // Store cleanup reference for destroy
  (host as HTMLElement & { _rwBannerCleanup?: () => void })._rwBannerCleanup =
    () => {
      cleanup();
      bannerHost.remove();
    };
}

registerWidget("social_proof_banner", renderSocialProofBannerWidget);

export { renderSocialProofBannerWidget };
