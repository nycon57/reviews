"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Star, ChevronLeft, ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  applyFeaturedStyle,
  getPreviewCardClasses,
  getPreviewCardStyle,
  getPreviewContainerStyle,
  resolvePreviewCardStyle,
  type PreviewCardStyle,
  type WidgetThemeLayout,
} from "./layout";

/**
 * Dashboard preview component for the Review Carousel Widget.
 * Mirrors the embed.js renderer output using React for WYSIWYG editing.
 * Autoplay pauses on hover; arrow controls sit outside the carousel viewport.
 */

// ── Types ────────────────────────────────────────────────────────────

interface WidgetCarousel {
  autoplay?: boolean;
  interval?: number;
  showArrows?: boolean;
  showDots?: boolean;
  transition?: "slide" | "fade" | "flip";
  visibleCards?: number;
  slidesPerView?: number;
}

interface ReviewCarouselPreviewProps {
  reviews: PreviewReview[];
  content?: WidgetContent;
  colors?: WidgetThemeColors;
  carousel?: WidgetCarousel;
  layout?: WidgetThemeLayout;
}

// ── Stars ────────────────────────────────────────────────────────────

function StarRating({ rating, filledColor, emptyColor, size = 16, lang }: {
  rating: number;
  filledColor: string;
  emptyColor: string;
  size?: number;
  lang?: string;
}) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={previewT(lang, "starsAriaLabel", { rating })}>
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

function CarouselReviewCard({ review, content, cardStyle, starFilled, starEmpty, accentColor, layout }: {
  review: PreviewReview;
  content: WidgetContent;
  cardStyle: PreviewCardStyle;
  starFilled: string;
  starEmpty: string;
  accentColor: string;
  layout?: WidgetThemeLayout;
}) {
  const lang = content.language;
  const dateFormat = content.dateFormat ?? "relative";
  const truncLen = content.truncateLength ?? 200;
  const featured = !!review.featured;

  const cardClasses = getPreviewCardClasses(
    cardStyle,
    "p-4 transition-shadow h-full",
  );

  let inlineStyle = getPreviewCardStyle(cardStyle, layout);
  if (featured) {
    inlineStyle = applyFeaturedStyle(inlineStyle, accentColor);
  }

  return (
    <article className={cardClasses} style={inlineStyle}>
      <div className="flex items-center gap-2.5 mb-2">
        {content.showAvatar !== false && (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
            style={{
              background: "var(--rw-surface-strong, #e5e7eb)",
              color: "var(--rw-text-muted, #6b7280)",
            }}
          >
            {getInitials(review.reviewer_name)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {review.reviewer_name && (
              <span
                className="text-sm font-semibold truncate"
                style={getPreviewBodyStyle("var(--rw-text, #1a1a2e)")}
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
        <StarRating rating={review.rating} filledColor={starFilled} emptyColor={starEmpty} lang={lang} />
      </div>

      {review.text && (
        <p className="text-sm leading-relaxed text-gray-700" style={getPreviewBodyTextStyle()}>
          {truncLen > 0 ? truncateText(review.text, truncLen) : review.text}
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

// ── Main Preview Component ──────────────────────────────────────────

export function ReviewCarouselPreview({
  reviews,
  content = {},
  colors = {},
  carousel = {},
  layout,
}: ReviewCarouselPreviewProps) {
  const lang = content.language;
  const starFilled = colors.starFilled ?? DEFAULT_STAR_FILLED;
  const starEmpty = colors.starEmpty ?? DEFAULT_STAR_EMPTY;
  const accentColor = colors.accent ?? colors.primary ?? DEFAULT_STAR_FILLED;

  const transition = carousel.transition ?? "slide";
  const visibleCards = carousel.visibleCards ?? carousel.slidesPerView ?? 3;
  const interval = carousel.interval ?? 5000;
  const autoplay = carousel.autoplay !== false;
  const showArrows = carousel.showArrows !== false;
  const showDots = carousel.showDots !== false;

  const hasOverflow = reviews.length > visibleCards;
  const maxIndex = Math.max(0, reviews.length - visibleCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, maxIndex)));
  }, [maxIndex]);

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  // Auto-play — pauses on hover
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoplay && !isHovered && hasOverflow) {
      timerRef.current = setInterval(next, interval);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoplay, isHovered, interval, next, hasOverflow]);

  const dotCount = maxIndex + 1;

  const cardStyle = resolvePreviewCardStyle(layout?.cardStyle, content.cardStyle);
  const containerStyle = getPreviewContainerStyle(colors, layout);

  // Compute slide transform
  const getSlideTransform = (): React.CSSProperties => {
    if (transition === "slide") {
      return {
        transform: `translateX(-${currentIndex * (100 / visibleCards)}%)`,
        transition: "transform 300ms cubic-bezier(0.25, 0.1, 0.25, 1)",
      };
    }
    return {};
  };

  // Card visibility for fade/flip
  const getCardStyle = (index: number): React.CSSProperties => {
    const inView = index >= currentIndex && index < currentIndex + visibleCards;

    if (transition === "fade") {
      return {
        opacity: inView ? 1 : 0,
        position: inView ? "relative" : "absolute",
        pointerEvents: inView ? "auto" : "none",
        transition: "opacity 300ms ease",
        gridArea: "1 / 1",
      };
    }

    if (transition === "flip") {
      return {
        transform: inView ? "perspective(800px) rotateY(0deg)" : "perspective(800px) rotateY(90deg)",
        opacity: inView ? 1 : 0,
        position: inView ? "relative" : "absolute",
        pointerEvents: inView ? "auto" : "none",
        transition: "transform 400ms ease, opacity 400ms ease",
        backfaceVisibility: "hidden",
        gridArea: "1 / 1",
      };
    }

    return {};
  };

  const isGridLayout = transition === "fade" || transition === "flip";

  return (
    <div
      className="text-sm leading-normal antialiased"
      style={containerStyle}
      role="region"
      aria-label={content.headerText ?? previewT(lang, "customerReviews")}
      aria-roledescription="carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      {content.showHeader !== false && content.headerText && (
        <h3 className="text-lg font-bold mb-4" style={getPreviewHeadingStyle()}>
          {content.headerText}
        </h3>
      )}

      {reviews.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">{previewT(lang, "noReviewsYet")}</div>
      ) : (
        <div className="flex items-center gap-2">
          {/* Prev arrow — outside viewport */}
          {showArrows && hasOverflow && (
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              className="h-8 w-8 shrink-0 rounded-full"
              style={{ color: "var(--rw-text, #1a1a2e)" }}
              aria-label={previewT(lang, "previousReviews")}
            >
              <ChevronLeft size={16} />
            </Button>
          )}

          {/* Viewport */}
          <div className="overflow-hidden flex-1 min-w-0">
            <div
              className={isGridLayout ? "grid" : "flex"}
              style={{
                ...(isGridLayout
                  ? { gridTemplateColumns: `repeat(${visibleCards}, 1fr)` }
                  : getSlideTransform()),
                position: "relative",
              }}
            >
              {reviews.map((review, i) => (
                <div
                  key={review.id}
                  className="flex-shrink-0 px-1.5"
                  style={{
                    width: !isGridLayout ? `${100 / visibleCards}%` : undefined,
                    ...getCardStyle(i),
                  }}
                  aria-roledescription="slide"
                  aria-hidden={!(i >= currentIndex && i < currentIndex + visibleCards)}
                >
                  <CarouselReviewCard
                    review={review}
                    content={content}
                    cardStyle={cardStyle}
                    starFilled={starFilled}
                    starEmpty={starEmpty}
                    accentColor={accentColor}
                    layout={layout}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Next arrow — outside viewport */}
          {showArrows && hasOverflow && (
            <Button
              variant="outline"
              size="icon"
              onClick={next}
              className="h-8 w-8 shrink-0 rounded-full"
              style={{ color: "var(--rw-text, #1a1a2e)" }}
              aria-label={previewT(lang, "nextReviews")}
            >
              <ChevronRight size={16} />
            </Button>
          )}
        </div>
      )}

      {/* Dots */}
      {showDots && dotCount > 1 && (
        <div className="flex justify-center gap-1.5 pt-4" role="tablist" aria-label={previewT(lang, "reviewSlides")}>
          {Array.from({ length: dotCount }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`h-1.5 rounded-full border-none transition-all duration-200 ${
                i === currentIndex ? "w-5" : "w-1.5 bg-gray-300 hover:bg-gray-400"
              }`}
              style={i === currentIndex ? { background: "var(--rw-primary, #52796f)" } : undefined}
              role="tab"
              aria-label={previewT(lang, "goToSlide", { n: i + 1 })}
              aria-selected={i === currentIndex}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
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
            <span className="text-[11px] font-semibold text-gray-600">{previewT(lang, "equalHousingLender")}</span>
          </div>
          <p className="text-[10px] leading-snug text-gray-500 mb-1">
            {content.disclaimerText || previewT(lang, "defaultDisclaimer")}
          </p>
          <a href="https://www.nmlsconsumeraccess.org" target="_blank" rel="noopener noreferrer" className="text-[10px] no-underline hover:underline" style={{ color: "var(--rw-primary, #52796f)" }}>
            {previewT(lang, "nmlsConsumerAccess")}
          </a>
        </div>
      )}

      {/* Branding */}
      {content.showBranding !== false && (
        <div className="mt-3 pt-2 border-t border-gray-100 text-[11px] text-gray-400 text-center">
          {previewT(lang, "poweredBy")}{" "}
          <a href="https://repwell.ai" target="_blank" rel="noopener noreferrer" className="text-gray-500 no-underline hover:underline">
            RepWell
          </a>
        </div>
      )}
    </div>
  );
}
