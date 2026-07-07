/**
 * Shared theme configuration.
 *
 * Both the client-side ThemeProvider and the inline pre-paint FOUC script in
 * the root layout depend on these values. Keeping them here prevents the two
 * from drifting apart (a mismatch causes a theme flash on first paint).
 */

export const THEME_STORAGE_KEY = "theme";

/** Only routes under this prefix honour the user's theme; everything else is forced light. */
export const THEME_DASHBOARD_PREFIX = "/dashboard";

export const VALID_THEMES = ["light", "dark", "system"] as const;

export type Theme = (typeof VALID_THEMES)[number];

export const DEFAULT_THEME: Theme = "system";
