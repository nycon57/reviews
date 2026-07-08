"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Star, Home } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  type WidgetThemeColors,
  type WidgetContent,
  type PreviewReview,
  DEFAULT_STAR_FILLED,
  DEFAULT_STAR_EMPTY,
  getInitials,
  getPreviewBodyStyle,
  getPreviewBodyTextStyle,
  getPreviewHeadingStyle,
  getPreviewMetaStyle,
  truncateText,
  formatDate,
  previewT,
} from "./shared";
import { SourceBadge } from "./shared-components";
import {
  getPreviewCardClasses,
  applyFeaturedStyle,
  getPreviewCardStyle,
  getPreviewContainerStyle,
  resolvePreviewCardStyle,
  type PreviewCardStyle,
  type WidgetThemeLayout,
} from "./layout";

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
  sortOrder?: string;
}

interface ReviewWallPreviewProps {
  reviews: PreviewReview[];
  content?: WidgetContent;
  colors?: WidgetThemeColors;
  wall?: WidgetWall;
  filters?: WidgetFilters;
  layout?: WidgetThemeLayout;
  onColumnsChange?: (columns: number) => void;
}

// ── Stars ────────────────────────────────────────────────────────────

function StarRating({
  rating,
  filledColor,
  emptyColor,
  size = 14,
  lang,
}: {
  rating: number;
  filledColor: string;
  emptyColor: string;
  size?: number;
  lang?: string;
}) {
  return (
    <div
      className="flex gap-0.5"
      role="img"
      aria-label={previewT(lang, "starsAriaLabel", { rating })}
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
  cardStyle,
  starFilled,
  starEmpty,
  featured,
  accentColor,
  layout,
}: {
  review: PreviewReview;
  content: WidgetContent;
  cardStyle: PreviewCardStyle;
  starFilled: string;
  starEmpty: string;
  featured?: boolean;
  accentColor: string;
  layout?: WidgetThemeLayout;
}) {
  const lang = content.language;
  const dateFormat = content.dateFormat ?? "relative";

  const cardClasses = getPreviewCardClasses(
    cardStyle,
    "p-4 transition-shadow break-inside-avoid",
  );

  let inlineStyle: React.CSSProperties = getPreviewCardStyle(cardStyle, layout);
  if (featured) {
    inlineStyle = applyFeaturedStyle(inlineStyle, accentColor);
  }

  return (
    <article className={cardClasses} style={inlineStyle}>
      <div className="flex items-center gap-2.5 mb-2">
      {content.showAvatar !== false && (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
            style={{
              background: "var(--rw-surface-strong, #e5e7eb)",
              color: "var(--rw-text-muted, #6b7280)",
              ...getPreviewMetaStyle("var(--rw-text-muted, #6b7280)"),
            }}
          >
            {getInitials(review.reviewer_name)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {review.reviewer_name && (
              <span
                className="font-semibold truncate"
                style={getPreviewHeadingStyle("var(--rw-text, #1a1a2e)", 0.8)}
              >
                {review.reviewer_name}
              </span>
            )}
            {featured && (
              <span
                className="inline-flex items-center gap-0.5 shrink-0 px-1.5 py-px text-[10px] font-semibold rounded"
                style={{
                  background: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
                  color: accentColor,
                }}
              >
                <Star size={9} fill="currentColor" />
                {previewT(lang, "featured")}
              </span>
            )}
          </div>
          {content.showDate !== false && review.review_date && (
            <span className="block text-xs text-gray-400" style={getPreviewMetaStyle("#9ca3af")}>
              {formatDate(review.review_date, dateFormat, lang)}
            </span>
          )}
        </div>
      </div>

      <div className="mb-2">
        <StarRating
          rating={review.rating}
          filledColor={starFilled}
          emptyColor={starEmpty}
          lang={lang}
        />
      </div>

      {review.text && (
        <p className="text-sm leading-relaxed text-gray-700" style={getPreviewBodyTextStyle()}>
          {content.truncateLength && content.truncateLength > 0
            ? truncateText(review.text, content.truncateLength)
            : review.text}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mt-2">
        {content.showSource !== false && review.source && (
          <SourceBadge source={review.source} lang={lang} />
        )}
      </div>
    </article>
  );
}

// ── Infinite Scroll Sentinel ─────────────────────────────────────────

function LoadMoreButton({
  onClick,
  primaryColor,
  lang,
}: {
  onClick: () => void;
  primaryColor: string;
  lang?: string;
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
      {previewT(lang, "loadMore")}
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

type SortOption = "featured" | "newest" | "oldest" | "highest" | "lowest";

// ── Main Preview Component ──────────────────────────────────────────

export function ReviewWallPreview({
  reviews,
  content = {},
  colors = {},
  wall = {},
  filters = {},
  layout,
  onColumnsChange,
}: ReviewWallPreviewProps) {
  const lang = content.language;
  const starFilled = colors.starFilled ?? DEFAULT_STAR_FILLED;
  const starEmpty = colors.starEmpty ?? DEFAULT_STAR_EMPTY;
  const accentColor = colors.accent ?? colors.primary ?? "#52796f";

  const columns = Math.min(Math.max(wall.columns ?? 3, 2), 5);
  const gap = wall.gap ?? 16;
  const perPage = content.reviewsPerPage ?? 12;
  const loadMoreMode = wall.loadMore ?? "button";
  // Resolve truncation: wall.truncateReviews or content.truncateLength > 0 both enable it
  const truncateLen = wall.truncateReviews === true
    ? (wall.truncateLength || content.truncateLength || 300)
    : (content.truncateLength ?? 0);
  const effectiveContent: WidgetContent = { ...content, truncateLength: truncateLen };

  const [visibleCountState, setVisibleCountState] = useState(() => ({
    perPage,
    reviewsLength: reviews.length,
    value: Math.min(perPage, reviews.length),
  }));
  const [previewColumnsState, setPreviewColumnsState] = useState(() => ({
    sourceColumns: columns,
    value: columns,
  }));
  const visibleCount =
    visibleCountState.perPage === perPage &&
    visibleCountState.reviewsLength === reviews.length
      ? visibleCountState.value
      : Math.min(perPage, reviews.length);
  const previewColumns =
    previewColumnsState.sourceColumns === columns
      ? previewColumnsState.value
      : columns;

  const handleColumnsChange = useCallback(
    (value: number[]) => {
      const newCols = value[0];
      setPreviewColumnsState({ sourceColumns: columns, value: newCols });
      onColumnsChange?.(newCols);
    },
    [columns, onColumnsChange],
  );

  const handleLoadMore = useCallback(() => {
    setVisibleCountState({
      perPage,
      reviewsLength: reviews.length,
      value: Math.min(visibleCount + perPage, reviews.length),
    });
  }, [perPage, reviews.length, visibleCount]);

  const SORT_OPTIONS: SortOption[] = ["featured", "newest", "oldest", "highest", "lowest"];
  const activeSort: SortOption = SORT_OPTIONS.includes(filters.sortOrder as SortOption)
    ? (filters.sortOrder as SortOption)
    : "newest";

  const sortedReviews = useMemo(() => {
    const sorted = [...reviews];
    switch (activeSort) {
      case "featured":
        sorted.sort((a, b) => {
          const aFeat = a.featured ? 1 : 0;
          const bFeat = b.featured ? 1 : 0;
          if (bFeat !== aFeat) return bFeat - aFeat;
          return new Date(b.review_date).getTime() - new Date(a.review_date).getTime();
        });
        break;
      case "newest":
        sorted.sort((a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime());
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.review_date).getTime() - new Date(b.review_date).getTime());
        break;
      case "highest":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "lowest":
        sorted.sort((a, b) => a.rating - b.rating);
        break;
    }
    return sorted;
  }, [reviews, activeSort]);

  const cardStyle = resolvePreviewCardStyle(layout?.cardStyle, content.cardStyle);
  const containerStyle = getPreviewContainerStyle(colors, layout);

  const visibleReviews = sortedReviews.slice(0, visibleCount);
  const primaryColor = colors.primary ?? "#52796f";

  return (
    <div
      className="leading-normal antialiased"
      style={{
        ...containerStyle,
        ...getPreviewBodyStyle(),
      }}
    >
      {/* Header + Column Slider */}
      <div className="flex items-center justify-between mb-4">
        {content.showHeader !== false && content.headerText && (
          <h3
            className="text-lg font-bold"
            style={getPreviewHeadingStyle(colors.text ?? "#1a1a2e")}
          >
            {content.headerText}
          </h3>
        )}
        <div className="flex items-center gap-3 ml-auto">
          <span
            className="text-xs text-gray-500 whitespace-nowrap"
            style={getPreviewMetaStyle()}
          >
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
        <div
          className="py-8 text-center text-sm"
          style={getPreviewMetaStyle("var(--rw-text-subtle, #9ca3af)", 1)}
        >
          {previewT(lang, "noReviewsYet")}
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${previewColumns}, 1fr)`,
              gap: `${gap}px`,
              alignItems: "start",
            }}
          >
            {visibleReviews.map((review) => (
              <WallReviewCard
                key={review.id}
                review={review}
                content={effectiveContent}
                cardStyle={cardStyle}
                starFilled={starFilled}
                starEmpty={starEmpty}
                featured={!!review.featured}
                accentColor={accentColor}
                layout={layout}
              />
            ))}
          </div>

          {/* Load More Button */}
          {loadMoreMode === "button" &&
            visibleCount < reviews.length && (
              <LoadMoreButton
                onClick={handleLoadMore}
                primaryColor={primaryColor}
                lang={lang}
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
        <div
          className="mt-3 p-2.5 rounded border"
          style={{
            background: "var(--rw-surface-muted, #f9fafb)",
            borderColor: "var(--rw-border-soft, var(--rw-border, #e5e7eb))",
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Home
              size={16}
              className="flex-shrink-0"
              style={{ color: "var(--rw-text-muted, #6b7280)" }}
            />
            <span
              className="text-[11px] font-semibold"
              style={{ color: "var(--rw-text-muted, #6b7280)" }}
            >
              {previewT(lang, "equalHousingLender")}
            </span>
          </div>
          <p
            className="text-[10px] leading-snug mb-1"
            style={{ color: "var(--rw-text-muted, #6b7280)" }}
          >
            {content.disclaimerText || previewT(lang, "defaultDisclaimer")}
          </p>
          <a
            href="https://www.nmlsconsumeraccess.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] no-underline hover:underline"
            style={{ color: primaryColor }}
          >
            {previewT(lang, "nmlsConsumerAccess")}
          </a>
        </div>
      )}

      {/* Branding */}
      {content.showBranding !== false && (
        <div
          className="mt-3 pt-2 border-t text-[11px] text-center"
          style={{
            borderColor: "var(--rw-border-soft, var(--rw-border, #e5e7eb))",
            color: "var(--rw-text-subtle, #9ca3af)",
          }}
        >
          <a
            href="https://repwell.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 no-underline hover:opacity-80 transition-opacity"
          >
            <span style={{ color: "var(--rw-text-subtle, #9ca3af)" }}>
              {previewT(lang, "poweredBy")}
            </span>
            <img
              src="/branding/RepWell-Logo-Full-Color.png"
              alt="RepWell"
              width={56}
              height={14}
              className="inline-block"
            />
          </a>
        </div>
      )}
    </div>
  );
}
