"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Star, Home } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  type WidgetThemeColors,
  type WidgetContent,
  type PreviewReview,
  DEFAULT_STAR_FILLED,
  DEFAULT_STAR_EMPTY,
  SOURCE_LABELS,
  getInitials,
  truncateText,
  formatDate,
  getLoanTypeColor,
} from "./shared";

/**
 * Dashboard preview component for the Review Wall Widget.
 * Mirrors the embed.js masonry renderer using React for WYSIWYG editing.
 * Includes column count slider for live configuration.
 */

// ── Types ────────────────────────────────────────────────────────────

interface WidgetWall {
  columns?: number;
  columnsTablet?: number;
  columnsMobile?: number;
  loadMore?: "button" | "scroll" | "none";
  truncateReviews?: boolean;
  truncateLength?: number;
  gap?: number;
}

interface WidgetFilters {
  featuredOnly?: boolean;
}

interface ReviewWallPreviewProps {
  reviews: PreviewReview[];
  content?: WidgetContent;
  colors?: WidgetThemeColors;
  wall?: WidgetWall;
  filters?: WidgetFilters;
  maxWidth?: string;
  borderRadius?: string;
  onColumnsChange?: (columns: number) => void;
}

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
  accentColor,
}: {
  review: PreviewReview;
  content: WidgetContent;
  starFilled: string;
  starEmpty: string;
  featured?: boolean;
  accentColor: string;
}) {
  const cardStyle = content.cardStyle ?? "bordered";
  const dateFormat = content.dateFormat ?? "relative";

  const cardClasses = [
    "p-4 rounded-lg transition-shadow break-inside-avoid",
    cardStyle === "bordered" && "border border-gray-200 bg-white",
    cardStyle === "shadow" && "bg-white shadow-sm hover:shadow-md",
    cardStyle === "flat" && "bg-gray-50",
    featured && "border-l-[3px]",
  ]
    .filter(Boolean)
    .join(" ");

  const inlineStyle: React.CSSProperties = {};
  if (featured) {
    inlineStyle.borderLeftColor = accentColor;
    inlineStyle.background = `linear-gradient(135deg, ${accentColor}08 0%, ${accentColor}0d 100%)`;
  }

  return (
    <article className={cardClasses} style={inlineStyle}>
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

// ── Infinite Scroll Sentinel ─────────────────────────────────────────

function LoadMoreButton({
  onClick,
  primaryColor,
}: {
  onClick: () => void;
  primaryColor: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full mt-4 py-2.5 px-6 text-sm font-medium rounded-md border transition-colors"
      style={{
        color: hovered ? "#fff" : primaryColor,
        borderColor: primaryColor,
        background: hovered ? primaryColor : "transparent",
      }}
    >
      Load More Reviews
    </button>
  );
}

function InfiniteScrollSentinel({
  onVisible,
}: {
  onVisible: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onVisible();
          }
        }
      },
      { rootMargin: "200px", threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onVisible]);

  return <div ref={ref} className="h-px w-full" />;
}

// ── Main Preview Component ──────────────────────────────────────────

export function ReviewWallPreview({
  reviews,
  content = {},
  colors = {},
  wall = {},
  filters = {},
  maxWidth,
  borderRadius,
  onColumnsChange,
}: ReviewWallPreviewProps) {
  const starFilled = colors.starFilled ?? DEFAULT_STAR_FILLED;
  const starEmpty = colors.starEmpty ?? DEFAULT_STAR_EMPTY;
  const accentColor = colors.accent ?? colors.primary ?? "#52796f";

  const columns = Math.min(Math.max(wall.columns ?? 3, 2), 5);
  const gap = wall.gap ?? 16;
  const perPage = content.reviewsPerPage ?? 12;
  const loadMoreMode = wall.loadMore ?? "button";
  const featuredOnly = filters.featuredOnly ?? false;

  // Resolve truncation: mirror embed logic where wall.truncateReviews gates it
  const shouldTruncate = wall.truncateReviews === true;
  const effectiveContent: WidgetContent = shouldTruncate
    ? { ...content, truncateLength: wall.truncateLength || content.truncateLength || 200 }
    : { ...content, truncateLength: 0 };

  const [visibleCount, setVisibleCount] = useState(
    Math.min(perPage, reviews.length),
  );
  const [previewColumns, setPreviewColumns] = useState(columns);

  // Sync state when props change
  useEffect(() => {
    setVisibleCount(Math.min(perPage, reviews.length));
  }, [reviews.length, perPage]);

  useEffect(() => {
    setPreviewColumns(columns);
  }, [columns]);

  const handleColumnsChange = useCallback(
    (value: number[]) => {
      const newCols = value[0];
      setPreviewColumns(newCols);
      onColumnsChange?.(newCols);
    },
    [onColumnsChange],
  );

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) =>
      Math.min(prev + perPage, reviews.length),
    );
  }, [perPage, reviews.length]);

  const containerStyle: React.CSSProperties = {
    borderRadius: borderRadius ?? "8px",
    padding: "16px",
    background: colors.background ?? "#ffffff",
    color: colors.text ?? "#1a1a2e",
  };

  const visibleReviews = reviews.slice(0, visibleCount);
  const primaryColor = colors.primary ?? "#52796f";

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
              const isFeatured =
                featuredOnly ||
                (review.rating === 5 &&
                  !!review.text &&
                  review.text.length > 100);
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
                    content={effectiveContent}
                    starFilled={starFilled}
                    starEmpty={starEmpty}
                    featured={isFeatured}
                    accentColor={accentColor}
                  />
                </div>
              );
            })}
          </div>

          {/* Load More Button */}
          {loadMoreMode === "button" &&
            visibleCount < reviews.length && (
              <LoadMoreButton
                onClick={handleLoadMore}
                primaryColor={primaryColor}
              />
            )}

          {/* Infinite Scroll */}
          {loadMoreMode === "scroll" &&
            visibleCount < reviews.length && (
              <InfiniteScrollSentinel onVisible={handleLoadMore} />
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
            style={{ background: primaryColor }}
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
            style={{ color: primaryColor }}
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
