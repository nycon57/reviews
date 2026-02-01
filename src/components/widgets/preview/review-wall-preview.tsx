"use client";

import { useState } from "react";
import { Star, Home } from "lucide-react";
import { Slider } from "@/components/ui/slider";

/**
 * Dashboard preview component for the Review Wall Widget.
 * Mirrors the embed.js masonry renderer using React for WYSIWYG editing.
 * Includes column count slider for live configuration.
 */

// ── Types ────────────────────────────────────────────────────────────

interface WidgetThemeColors {
  primary?: string;
  background?: string;
  text?: string;
  accent?: string;
  border?: string;
  starFilled?: string;
  starEmpty?: string;
}

interface WidgetContent {
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
  showDisclaimer?: boolean;
  disclaimerText?: string;
  dateFormat?: "relative" | "absolute";
  cardStyle?: "bordered" | "shadow" | "flat";
  reviewsPerPage?: number;
}

interface WidgetWall {
  columns?: number;
  columnsTablet?: number;
  columnsMobile?: number;
  loadMore?: "button" | "scroll" | "none";
  truncateReviews?: boolean;
  truncateLength?: number;
  gap?: number;
}

interface PreviewReview {
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

interface ReviewWallPreviewProps {
  reviews: PreviewReview[];
  content?: WidgetContent;
  colors?: WidgetThemeColors;
  wall?: WidgetWall;
  maxWidth?: string;
  borderRadius?: string;
  onColumnsChange?: (columns: number) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0]?.toUpperCase() ?? "?";
}

function truncateText(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max).trimEnd() + "\u2026";
}

function formatRelativeDate(dateStr: string): string {
  try {
    const diffDays = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / 86_400_000,
    );
    if (diffDays < 1) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365)
      return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch {
    return dateStr;
  }
}

function formatAbsoluteDate(dateStr: string): string {
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

function formatDate(
  dateStr: string,
  format: "relative" | "absolute",
): string {
  return format === "relative"
    ? formatRelativeDate(dateStr)
    : formatAbsoluteDate(dateStr);
}

const LOAN_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  purchase: { bg: "#dbeafe", text: "#1d4ed8" },
  refinance: { bg: "#fef3c7", text: "#92400e" },
  va: { bg: "#d1fae5", text: "#065f46" },
  fha: { bg: "#e0e7ff", text: "#3730a3" },
  jumbo: { bg: "#fce7f3", text: "#9d174d" },
  usda: { bg: "#fef9c3", text: "#854d0e" },
  conventional: { bg: "#f0f9ff", text: "#075985" },
};

function getLoanTypeColor(
  loanType: string,
): { bg: string; text: string } {
  return (
    LOAN_TYPE_COLORS[loanType.toLowerCase().trim()] ?? {
      bg: "#f3f4f6",
      text: "#6b7280",
    }
  );
}

const SOURCE_LABELS: Record<string, string> = {
  google: "Google",
  zillow: "Zillow",
  internal: "RepWell",
};

// ── Stars ────────────────────────────────────────────────────────────

function StarRating({
  rating,
  filledColor,
  emptyColor,
  size = 14,
}: {
  rating: number;
  filledColor: string;
  emptyColor: string;
  size?: number;
}) {
  return (
    <div
      className="flex gap-0.5"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < Math.round(rating) ? filledColor : "none"}
          stroke={i < Math.round(rating) ? filledColor : emptyColor}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

// ── Review Card ──────────────────────────────────────────────────────

function WallReviewCard({
  review,
  content,
  starFilled,
  starEmpty,
  featured,
}: {
  review: PreviewReview;
  content: WidgetContent;
  starFilled: string;
  starEmpty: string;
  featured?: boolean;
}) {
  const cardStyle = content.cardStyle ?? "bordered";
  const dateFormat = content.dateFormat ?? "relative";

  const cardClasses = [
    "p-4 rounded-lg transition-shadow break-inside-avoid",
    cardStyle === "bordered" && "border border-gray-200 bg-white",
    cardStyle === "shadow" && "bg-white shadow-sm hover:shadow-md",
    cardStyle === "flat" && "bg-gray-50",
    featured && "border-l-[3px] border-l-[#52796f]",
  ]
    .filter(Boolean)
    .join(" ");

  const featuredBg = featured
    ? { background: "linear-gradient(135deg, rgba(82,121,111,0.03) 0%, rgba(132,169,140,0.05) 100%)" }
    : undefined;

  return (
    <article className={cardClasses} style={featuredBg}>
      <div className="flex items-center gap-2.5 mb-2">
        {content.showAvatar !== false && (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-500 flex-shrink-0">
            {getInitials(review.reviewer_name)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {review.reviewer_name && (
            <span className="block text-sm font-semibold truncate">
              {review.reviewer_name}
            </span>
          )}
          {content.showDate !== false && review.review_date && (
            <span className="block text-xs text-gray-400">
              {formatDate(review.review_date, dateFormat)}
            </span>
          )}
        </div>
      </div>

      <div className="mb-2">
        <StarRating
          rating={review.rating}
          filledColor={starFilled}
          emptyColor={starEmpty}
        />
      </div>

      {review.text && (
        <p className="text-sm leading-relaxed text-gray-700">
          {content.truncateLength && content.truncateLength > 0
            ? truncateText(review.text, content.truncateLength)
            : review.text}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mt-2">
        {content.showSource !== false && review.source && (
          <span className="text-[11px] text-gray-400 capitalize">
            via {SOURCE_LABELS[review.source] ?? review.source}
          </span>
        )}
        {review.loan_type && (
          <span
            className="inline-block px-2 py-0.5 text-[11px] font-medium rounded"
            style={{
              background: getLoanTypeColor(review.loan_type).bg,
              color: getLoanTypeColor(review.loan_type).text,
            }}
          >
            {review.loan_type}
          </span>
        )}
        {review.first_time_homebuyer && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-green-800 bg-green-100 rounded">
            <Home size={10} />
            First-Time Buyer
          </span>
        )}
      </div>
    </article>
  );
}

// ── Main Preview Component ──────────────────────────────────────────

export function ReviewWallPreview({
  reviews,
  content = {},
  colors = {},
  wall = {},
  maxWidth,
  borderRadius,
  onColumnsChange,
}: ReviewWallPreviewProps) {
  const starFilled = colors.starFilled ?? "#f59e0b";
  const starEmpty = colors.starEmpty ?? "#d1d5db";

  const columns = Math.min(Math.max(wall.columns ?? 3, 2), 5);
  const gap = wall.gap ?? 16;
  const perPage = content.reviewsPerPage ?? 12;
  const loadMoreMode = wall.loadMore ?? "button";

  const [visibleCount, setVisibleCount] = useState(
    Math.min(perPage, reviews.length),
  );
  const [previewColumns, setPreviewColumns] = useState(columns);

  const handleColumnsChange = (value: number[]) => {
    const newCols = value[0];
    setPreviewColumns(newCols);
    onColumnsChange?.(newCols);
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: maxWidth ?? "100%",
    borderRadius: borderRadius ?? "8px",
    padding: "16px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
    background: colors.background ?? "#ffffff",
    color: colors.text ?? "#1a1a2e",
  };

  const visibleReviews = reviews.slice(0, visibleCount);

  return (
    <div className="text-sm leading-normal antialiased" style={containerStyle}>
      {/* Header + Column Slider */}
      <div className="flex items-center justify-between mb-4">
        {content.showHeader !== false && content.headerText && (
          <h3
            className="text-lg font-bold"
            style={{ color: colors.text ?? "#1a1a2e" }}
          >
            {content.headerText}
          </h3>
        )}
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {previewColumns} columns
          </span>
          <Slider
            min={2}
            max={5}
            step={1}
            value={[previewColumns]}
            onValueChange={handleColumnsChange}
            className="w-24"
          />
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">
          No reviews yet.
        </div>
      ) : (
        <>
          {/* Masonry Grid */}
          <div
            style={{
              columnCount: previewColumns,
              columnGap: `${gap}px`,
              columnFill: "balance",
            }}
          >
            {visibleReviews.map((review) => {
              const isFeatured = review.rating === 5 && !!review.text && review.text.length > 100;
              return (
                <div
                  key={review.id}
                  style={{
                    breakInside: "avoid",
                    marginBottom: `${gap}px`,
                    display: "inline-block",
                    width: "100%",
                  }}
                >
                  <WallReviewCard
                    review={review}
                    content={content}
                    starFilled={starFilled}
                    starEmpty={starEmpty}
                    featured={isFeatured}
                  />
                </div>
              );
            })}
          </div>

          {/* Load More */}
          {loadMoreMode === "button" &&
            visibleCount < reviews.length && (
              <button
                type="button"
                onClick={() =>
                  setVisibleCount((prev) =>
                    Math.min(prev + perPage, reviews.length),
                  )
                }
                className="w-full mt-4 py-2.5 px-6 text-sm font-medium rounded-md border transition-colors hover:text-white"
                style={{
                  color: colors.primary ?? "#52796f",
                  borderColor: colors.primary ?? "#52796f",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    colors.primary ?? "#52796f";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color =
                    colors.primary ?? "#52796f";
                }}
              >
                Load More Reviews
              </button>
            )}
        </>
      )}

      {/* CTA */}
      {content.showCTA && content.ctaText && content.ctaUrl && (
        <div className="flex justify-center mt-4">
          <a
            href={content.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-5 py-2.5 text-sm font-medium text-white rounded-md no-underline transition-opacity hover:opacity-90"
            style={{ background: colors.primary ?? "#52796f" }}
          >
            {content.ctaText}
          </a>
        </div>
      )}

      {/* Disclaimer */}
      {content.showDisclaimer && (
        <div className="mt-3 p-2.5 bg-gray-50 rounded border border-gray-100">
          <div className="flex items-center gap-1.5 mb-1">
            <Home size={16} className="flex-shrink-0 text-gray-500" />
            <span className="text-[11px] font-semibold text-gray-600">
              Equal Housing Lender
            </span>
          </div>
          <p className="text-[10px] leading-snug text-gray-500 mb-1">
            {content.disclaimerText ||
              "This is not a commitment to lend. Programs, rates, terms, and conditions are subject to change without notice."}
          </p>
          <a
            href="https://www.nmlsconsumeraccess.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] no-underline hover:underline"
            style={{ color: colors.primary ?? "#52796f" }}
          >
            NMLS Consumer Access
          </a>
        </div>
      )}

      {/* Branding */}
      {content.showBranding !== false && (
        <div className="mt-3 pt-2 border-t border-gray-100 text-[11px] text-gray-400 text-center">
          Powered by{" "}
          <a
            href="https://repwell.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 no-underline hover:underline"
          >
            RepWell
          </a>
        </div>
      )}
    </div>
  );
}
