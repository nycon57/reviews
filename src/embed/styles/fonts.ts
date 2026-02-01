/**
 * Google Fonts loading for widget Shadow DOM.
 *
 * Loads fonts non-blocking (font-display: swap) and caches across widgets
 * so the same font is only fetched once per page.
 */

/** Known Google Font family names keyed by CSS font-family value */
const GOOGLE_FONT_NAMES: Record<string, string> = {
  "'Inter', sans-serif": "Inter",
  "'Roboto', sans-serif": "Roboto",
  "'Open Sans', sans-serif": "Open+Sans",
  "'Lato', sans-serif": "Lato",
  "'Poppins', sans-serif": "Poppins",
  "'Montserrat', sans-serif": "Montserrat",
  "'Source Sans 3', sans-serif": "Source+Sans+3",
  "'Raleway', sans-serif": "Raleway",
  "'Nunito', sans-serif": "Nunito",
  "'Work Sans', sans-serif": "Work+Sans",
  "'Merriweather', serif": "Merriweather",
  "'Playfair Display', serif": "Playfair+Display",
  "'Lora', serif": "Lora",
  "'PT Serif', serif": "PT+Serif",
  "'Libre Baskerville', serif": "Libre+Baskerville",
  "'DM Sans', sans-serif": "DM+Sans",
  "'Outfit', sans-serif": "Outfit",
  "'Plus Jakarta Sans', sans-serif": "Plus+Jakarta+Sans",
  "'Manrope', sans-serif": "Manrope",
  "'Space Grotesk', sans-serif": "Space+Grotesk",
};

/**
 * Cache of fetched font CSS text, keyed by the encoded font name.
 * Once a font is fetched once, its CSS is reused across Shadow DOM instances
 * without additional network requests.
 */
const fontCache = new Map<string, string>();

/** In-flight fetch promises to avoid duplicate requests */
const pendingFetches = new Map<string, Promise<string | null>>();

/** Build a Google Fonts URL for a given encoded name */
function buildFontUrl(encodedName: string): string {
  return `https://fonts.googleapis.com/css2?family=${encodedName}:wght@300;400;500;600;700&display=swap`;
}

/**
 * Resolve the encoded Google Font name from a CSS font-family value.
 * Returns null for system/web-safe fonts.
 */
export function resolveGoogleFontName(fontFamily: string): string | null {
  return GOOGLE_FONT_NAMES[fontFamily] ?? null;
}

/**
 * Load a Google Font inside a Shadow DOM root.
 *
 * - Non-blocking: uses font-display: swap via the Google Fonts URL
 * - Cached: fetches the CSS once, then injects via <style> in subsequent shadows
 * - No-ops for system fonts
 */
export function loadFontInShadow(
  shadow: ShadowRoot,
  fontFamily: string | undefined,
): void {
  if (!fontFamily) return;

  const encoded = resolveGoogleFontName(fontFamily);
  if (!encoded) return;

  // If we already have the CSS cached, inject it as a <style> element
  const cached = fontCache.get(encoded);
  if (cached) {
    injectFontStyle(shadow, cached, encoded);
    return;
  }

  // If there's already a fetch in progress, wait for it
  const pending = pendingFetches.get(encoded);
  if (pending) {
    pending.then((css) => {
      if (css) injectFontStyle(shadow, css, encoded);
    });
    return;
  }

  // First time: fetch CSS and cache
  const url = buildFontUrl(encoded);
  const fetchPromise = fetch(url)
    .then((res) => (res.ok ? res.text() : null))
    .then((css) => {
      pendingFetches.delete(encoded);
      if (css) {
        fontCache.set(encoded, css);
        injectFontStyle(shadow, css, encoded);
      }
      return css;
    })
    .catch(() => {
      pendingFetches.delete(encoded);
      // Fallback: inject a <link> element as a last resort
      injectFontLink(shadow, url, encoded);
      return null;
    });

  pendingFetches.set(encoded, fetchPromise);
}

/** Inject font CSS as a <style> element inside Shadow DOM */
function injectFontStyle(
  shadow: ShadowRoot,
  css: string,
  encodedName: string,
): void {
  // Avoid duplicate injection
  if (shadow.querySelector(`style[data-rw-font="${encodedName}"]`)) return;

  const style = document.createElement("style");
  style.setAttribute("data-rw-font", encodedName);
  style.textContent = css;
  shadow.insertBefore(style, shadow.firstChild);
}

/** Fallback: inject a <link> element for the font */
function injectFontLink(
  shadow: ShadowRoot,
  url: string,
  encodedName: string,
): void {
  if (shadow.querySelector(`link[data-rw-font="${encodedName}"]`)) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  link.setAttribute("data-rw-font", encodedName);
  shadow.insertBefore(link, shadow.firstChild);
}
