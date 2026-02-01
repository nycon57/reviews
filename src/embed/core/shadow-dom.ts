/**
 * Shadow DOM creation and style injection for widget encapsulation.
 * Uses open mode so the host page can access the shadow root if needed
 * (e.g. for custom styling hooks), while preventing CSS leakage.
 */

import { BASE_STYLES } from "../styles/base";
import { loadFontInShadow } from "../styles/fonts";

// Re-export for backward compatibility with existing consumers
export { loadFontInShadow as loadGoogleFontInShadow };

export function attachShadow(host: HTMLElement): ShadowRoot {
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = BASE_STYLES;
  shadow.appendChild(style);

  return shadow;
}
