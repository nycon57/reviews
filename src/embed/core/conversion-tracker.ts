/**
 * Conversion Attribution Tracker.
 * When a visitor interacts with a widget and then navigates to a URL
 * matching the configured conversionUrl pattern, a conversion event is recorded
 * via a tracking pixel.
 */

import { getSessionId } from "./event-tracker";

/**
 * Converts a glob-style pattern (with * wildcards) to a RegExp.
 * Example: "https://example.com/thank-you*" matches "https://example.com/thank-you?ref=123"
 */
function globToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const withWildcards = escaped.replace(/\*/g, ".*");
  return new RegExp(`^${withWildcards}$`);
}

/**
 * Sets up conversion tracking by listening for navigation events.
 * When the visitor navigates to a URL matching the conversionUrl pattern,
 * a 1x1 tracking pixel is loaded to record the conversion event.
 *
 * @returns Cleanup function to remove the listener.
 */
export function setupConversionTracking(
  apiBase: string,
  widgetId: string,
  conversionUrlPattern: string,
): () => void {
  const regex = globToRegex(conversionUrlPattern);
  let fired = false;

  function checkConversion(): void {
    if (fired) return;
    if (regex.test(location.href)) {
      fired = true;
      // Fire tracking pixel
      const sessionId = getSessionId();
      const pixelUrl = `${apiBase}/api/v1/widgets/${encodeURIComponent(widgetId)}/pixel?event=conversion&session=${encodeURIComponent(sessionId)}`;
      const img = new window.Image(1, 1);
      img.src = pixelUrl;
    }
  }

  // Check immediately (visitor might already be on the conversion page)
  checkConversion();

  // Listen for SPA navigation (pushState/replaceState/popstate)
  const handleNavigation = (): void => {
    // Delay to allow URL to update
    setTimeout(checkConversion, 0);
  };

  window.addEventListener("popstate", handleNavigation);

  // Patch pushState/replaceState to detect SPA navigation
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    handleNavigation();
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    handleNavigation();
  };

  return () => {
    window.removeEventListener("popstate", handleNavigation);
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  };
}
