import type { CSSProperties } from "react";
import en from "@/embed/i18n/en.json";
import es from "@/embed/i18n/es.json";

/**
 * Shared types, helpers, and constants used across preview components.
 * Eliminates duplication between lo-review, branch-review, company-review,
 * social-proof-banner, review-carousel, and review-wall previews.
 */

// ── Types ─────────────────────────────────────────────────────────────

export interface WidgetThemeColors {
  primary?: string;
  background?: string;
  text?: string;
  accent?: string;
  border?: string;
  starFilled?: string;
  starEmpty?: string;
}

export interface WidgetContent {
  showHeader?: boolean;
  headerText?: string;
  showCTA?: boolean;
  ctaText?: string;
  ctaUrl?: string;
  showSource?: boolean;
  showDate?: boolean;
  showAvatar?: boolean;
  showBranding?: boolean;
  truncateLength?: number;
  showNMLS?: boolean;
  showDisclaimer?: boolean;
  disclaimerText?: string;
  showWriteReview?: boolean;
  writeReviewUrl?: string;
  columns?: number;
  dateFormat?: "relative" | "absolute";
  cardStyle?: "bordered" | "shadow" | "flat" | "glass";
  showFilters?: boolean;
  showRatingDistribution?: boolean;
  showSourceBreakdown?: boolean;
  reviewsPerPage?: number;
  showTeam?: boolean;
  language?: string;
}

export interface PreviewReview {
  id: string;
  reviewer_name: string | null;
  rating: number;
  text: string | null;
  review_date: string;
  source: string;
  avatar_url: string | null;
  featured: boolean | null;
  loan_type: string | null;
  first_time_homebuyer: boolean | null;
}

export interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface SourceBreakdown {
  source: string;
  count: number;
  average: number;
}

// ── Constants ─────────────────────────────────────────────────────────

export const DEFAULT_STAR_FILLED = "#f59e0b";
export const DEFAULT_STAR_EMPTY = "#d1d5db";

export const SOURCE_LABELS: Record<string, string> = {
  google: "Google",
  zillow: "Zillow",
  internal: "RepWell",
};

export const SOURCE_ICONS: Record<string, { bg: string; letter: string; icon?: string }> = {
  google: { bg: "#4285f4", letter: "G", icon: "/icons/google.svg" },
  zillow: { bg: "#006aff", letter: "Z", icon: "/icons/zillow.svg" },
  internal: { bg: "#52796f", letter: "R", icon: "/branding/RepWell-Icon-Full-Color.png" },
};

export const LOAN_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  purchase: { bg: "#dbeafe", text: "#1d4ed8" },
  refinance: { bg: "#fef3c7", text: "#92400e" },
  va: { bg: "#d1fae5", text: "#065f46" },
  fha: { bg: "#e0e7ff", text: "#3730a3" },
  jumbo: { bg: "#fce7f3", text: "#9d174d" },
  usda: { bg: "#fef9c3", text: "#854d0e" },
  conventional: { bg: "#f0f9ff", text: "#075985" },
};

const PREVIEW_HEADING_SIZE = "var(--rw-heading-size, 18px)";
const PREVIEW_BODY_SIZE = "var(--rw-body-size, 14px)";

export function getPreviewHeadingStyle(
  color = "var(--rw-text, #1a1a2e)",
  scale = 1,
): CSSProperties {
  return {
    color,
    fontSize:
      scale === 1
        ? PREVIEW_HEADING_SIZE
        : `calc(${PREVIEW_HEADING_SIZE} * ${scale})`,
    lineHeight: 1.3,
  };
}

export function getPreviewBodyStyle(
  color = "var(--rw-text, #1a1a2e)",
): CSSProperties {
  return {
    color,
    fontSize: PREVIEW_BODY_SIZE,
  };
}

export function getPreviewBodyTextStyle(
  color = "var(--rw-text, #1a1a2e)",
): CSSProperties {
  return {
    ...getPreviewBodyStyle(color),
    lineHeight: 1.6,
  };
}

export function getPreviewMetaStyle(
  color = "var(--rw-text-muted, #6b7280)",
  scale = 0.86,
): CSSProperties {
  return {
    color,
    fontSize: `calc(${PREVIEW_BODY_SIZE} * ${scale})`,
  };
}

// ── i18n for Preview Components ───────────────────────────────────────

const TRANSLATIONS: Record<string, Record<string, string>> = { en, es };

/**
 * Translate a key for preview components using the selected widget language.
 * Falls back to English if the locale or key is missing.
 */
export function previewT(
  locale: string | undefined,
  key: string,
  params?: Record<string, string | number>,
): string {
  const lang = locale ?? "en";
  const map = TRANSLATIONS[lang] ?? TRANSLATIONS.en;
  let value = map[key] ?? TRANSLATIONS.en[key] ?? key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(`{${k}}`, String(v));
    }
  }

  return value;
}

/**
 * Plural-aware translation for preview components.
 * Looks up `key` for count === 1, `keyPlural` for count !== 1.
 */
export function previewTp(
  locale: string | undefined,
  key: string,
  count: number,
  params?: Record<string, string | number>,
): string {
  const lang = locale ?? "en";
  const map = TRANSLATIONS[lang] ?? TRANSLATIONS.en;
  const enMap = TRANSLATIONS.en;
  const pluralKey = `${key}Plural`;
  const resolvedKey = count === 1 ? key : (pluralKey in map || pluralKey in enMap ? pluralKey : key);
  return previewT(locale, resolvedKey, params);
}

// ── Helpers ───────────────────────────────────────────────────────────

export function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0]?.toUpperCase() ?? "?";
}

export function truncateText(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max).trimEnd() + "\u2026";
}

export function formatRelativeDate(dateStr: string, locale?: string): string {
  const t = (key: string, params?: Record<string, string | number>) =>
    previewT(locale, key, params);
  try {
    const diffDays = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / 86_400_000,
    );
    if (diffDays < 1) return t("today");
    if (diffDays === 1) return t("yesterday");
    if (diffDays < 7) return t("daysAgo", { count: diffDays });
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return t("weeksAgo", { count: weeks });
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return t("monthsAgo", { count: months });
    }
    const years = Math.floor(diffDays / 365);
    return t("yearsAgo", { count: years });
  } catch {
    return dateStr;
  }
}

export function formatAbsoluteDate(dateStr: string, locale?: string): string {
  try {
    const loc = locale === "es" ? "es" : undefined;
    return new Date(dateStr).toLocaleDateString(loc, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatDate(
  dateStr: string,
  format: "relative" | "absolute",
  locale?: string,
): string {
  return format === "relative"
    ? formatRelativeDate(dateStr, locale)
    : formatAbsoluteDate(dateStr, locale);
}

export function getLoanTypeColor(
  loanType: string,
): { bg: string; text: string } {
  return (
    LOAN_TYPE_COLORS[loanType.toLowerCase().trim()] ?? {
      bg: "#f3f4f6",
      text: "#6b7280",
    }
  );
}
