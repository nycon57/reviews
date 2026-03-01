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
  cardStyle?: "bordered" | "shadow" | "flat";
  showFilters?: boolean;
  showRatingDistribution?: boolean;
  showSourceBreakdown?: boolean;
  reviewsPerPage?: number;
  showTeam?: boolean;
}

export interface PreviewReview {
  id: string;
  reviewer_name: string | null;
  rating: number;
  text: string | null;
  review_date: string;
  source: string;
  avatar_url: string | null;
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

export const SOURCE_ICONS: Record<string, { bg: string; letter: string }> = {
  google: { bg: "#4285f4", letter: "G" },
  zillow: { bg: "#006aff", letter: "Z" },
  internal: { bg: "#52796f", letter: "R" },
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

export function formatRelativeDate(dateStr: string): string {
  try {
    const diffDays = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / 86_400_000,
    );
    if (diffDays < 1) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? "month" : "months"} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? "year" : "years"} ago`;
  } catch {
    return dateStr;
  }
}

export function formatAbsoluteDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
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
): string {
  return format === "relative"
    ? formatRelativeDate(dateStr)
    : formatAbsoluteDate(dateStr);
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
