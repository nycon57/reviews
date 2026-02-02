/**
 * Lightweight i18n module for RepWell embed widgets.
 *
 * - English and Spanish are bundled inline (no network requests).
 * - Future languages can be loaded dynamically via API without rebuilding embed.js.
 * - Simple key-value lookup with basic {placeholder} interpolation.
 */

import en from "./en.json";
import es from "./es.json";

export type SupportedLocale = "en" | "es";
export type TranslationKey = keyof typeof en;
type TranslationMap = Record<string, string>;

const BUNDLED_LOCALES: Record<SupportedLocale, TranslationMap> = { en, es };

/** Cache for dynamically loaded locale data. */
const dynamicLocales = new Map<string, TranslationMap>();

/** Active locale for the current widget render. Defaults to "en". */
let activeLocale: string = "en";

/**
 * Set the active locale. If the locale is not bundled or cached,
 * falls back to "en".
 */
export function setLocale(locale: string): void {
  activeLocale = locale;
}

/** Get the active locale string. */
export function getLocale(): string {
  return activeLocale;
}

/** Check if a locale is bundled (en/es). */
export function isBundledLocale(locale: string): locale is SupportedLocale {
  return locale in BUNDLED_LOCALES;
}

/**
 * Register a dynamically-loaded locale (for future language support).
 * Called after fetching locale data from the API.
 */
export function registerLocale(locale: string, translations: TranslationMap): void {
  dynamicLocales.set(locale, translations);
}

/**
 * Resolve a translation map for a given locale.
 * Falls back to English if the locale is unknown.
 */
function resolveMap(locale: string): TranslationMap {
  if (locale in BUNDLED_LOCALES) {
    return BUNDLED_LOCALES[locale as SupportedLocale];
  }
  return dynamicLocales.get(locale) ?? BUNDLED_LOCALES.en;
}

/**
 * Translate a key, with optional interpolation of `{placeholder}` tokens.
 *
 * @example
 *   t("starsAriaLabel", { rating: "4.5" })  // "4.5 out of 5 stars"
 *   t("daysAgo", { count: "3" })            // "3 days ago"
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const map = resolveMap(activeLocale);
  let value = map[key] ?? BUNDLED_LOCALES.en[key] ?? key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(`{${k}}`, String(v));
    }
  }

  return value;
}

/**
 * Plural-aware translation helper.
 * Looks up `key` for count === 1 and `keyPlural` for count !== 1.
 *
 * @example
 *   tp("basedOnResponses", 1, { count: "1" })  // "Based on 1 response"
 *   tp("basedOnResponses", 5, { count: "5" })  // "Based on 5 responses"
 */
export function tp(
  key: string,
  count: number,
  params?: Record<string, string | number>,
): string {
  const resolvedKey = count === 1 ? key : `${key}Plural`;
  const map = resolveMap(activeLocale);
  // If plural key doesn't exist, fall back to singular
  const actualKey = (resolvedKey in map) ? resolvedKey : key;
  return t(actualKey, params);
}
