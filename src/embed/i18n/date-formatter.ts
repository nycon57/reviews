/**
 * Locale-aware date formatting for embed widgets.
 * Uses native Intl APIs (no external libraries) for minimal bundle impact.
 */

import { getLocale, t } from "./index";

/**
 * Format an absolute date string using the active locale.
 * e.g. "Jan 15, 2026" (en) or "15 ene 2026" (es)
 */
export function formatAbsoluteDate(dateStr: string): string {
  try {
    const locale = getLocale();
    return new Date(dateStr).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format a relative date string using the active locale.
 * e.g. "3 days ago" (en) or "hace 3 días" (es)
 *
 * Uses Intl.RelativeTimeFormat when available for proper locale grammar,
 * with translation key fallback for older browsers.
 */
export function formatRelativeDate(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffDays === 0) return t("today");
    if (diffDays === 1) return t("yesterday");

    // Try Intl.RelativeTimeFormat for natural locale grammar
    if (typeof Intl !== "undefined" && Intl.RelativeTimeFormat) {
      const locale = getLocale();
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

      if (diffDays < 7) return rtf.format(-diffDays, "day");
      if (diffDays < 30) return rtf.format(-Math.floor(diffDays / 7), "week");
      if (diffDays < 365) return rtf.format(-Math.floor(diffDays / 30), "month");
      return rtf.format(-Math.floor(diffDays / 365), "year");
    }

    // Fallback to translation keys
    if (diffDays < 7) return t("daysAgo", { count: diffDays });
    if (diffDays < 30) return t("weeksAgo", { count: Math.floor(diffDays / 7) });
    if (diffDays < 365) return t("monthsAgo", { count: Math.floor(diffDays / 30) });
    return t("yearsAgo", { count: Math.floor(diffDays / 365) });
  } catch {
    return dateStr;
  }
}
