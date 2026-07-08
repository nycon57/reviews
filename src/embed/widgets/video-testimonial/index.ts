/**
 * Video review widget — registers the `video_testimonial` widget type.
 * Self-registers on import via side effect.
 */

import type { PublicWidgetConfig, PublicReview } from "../../types";
import { registerWidget } from "../registry";
import { applyTheme } from "../../core/dom-helpers";
import { VIDEO_TESTIMONIAL_STYLES } from "./styles";
import { buildVideoTestimonialDOM } from "./template";

/**
 * Renders the video review widget inside a Shadow DOM root.
 */
function renderVideoTestimonialWidget(
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
  style.textContent = VIDEO_TESTIMONIAL_STYLES;
  root.appendChild(style);

  root.appendChild(buildVideoTestimonialDOM(config, reviews, apiBase));
}

registerWidget("video_testimonial", renderVideoTestimonialWidget);

export { renderVideoTestimonialWidget };
