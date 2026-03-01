"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Star, ChevronLeft, ChevronRight, Play, Pause, Home } from "lucide-react";
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
 * Dashboard preview component for the Review Carousel Widget.
 * Mirrors the embed.js renderer output using React for WYSIWYG editing.
 * Includes play/pause control and transition preview.
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
  maxWidth?: string;
  borderRadius?: string;
}

// ── Stars ────────────────────────────────────────────────────────────

function StarRating({ rating, filledColor, emptyColor, size = 16 }: {
  rating: number;
  filledColor: string;
  emptyColor: string;
  size?: number;
}) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
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

function CarouselReviewCard({ review, content, starFilled, starEmpty }: {
  review: PreviewReview;
  content: WidgetContent;
  starFilled: string;
  starEmpty: string;
}) {
  const cardStyle = content.cardStyle ?? "bordered";
  const dateFormat = content.dateFormat ?? "relative";
  const truncLen = content.truncateLength ?? 200;

  const cardClasses = [
    "p-4 rounded-lg transition-shadow h-full",
    cardStyle === "bordered" && "border border-gray-200 bg-white",
    cardStyle === "shadow" && "bg-white shadow-sm hover:shadow-md",
    cardStyle === "flat" && "bg-gray-50",
  ].filter(Boolean).join(" ");

  return (
    <article className={cardClasses}>
      <div className="flex items-center gap-2.5 mb-2">
        {content.showAvatar !== false && (
          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-500 flex-shrink-0">
            {getInitials(review.reviewer_name)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {review.reviewer_name && <span className="block text-sm font-semibold truncate">{review.reviewer_name}</span>}
          {content.showDate !== false && review.review_date && (
            <span className="block text-xs text-gray-400">{formatDate(review.review_date, dateFormat)}</span>
          )}
        </div>
      </div>

      <div className="mb-2">
        <StarRating rating={review.rating} filledColor={starFilled} emptyColor={starEmpty} />
      </div>

      {review.text && (
        <p className="text-sm leading-relaxed text-gray-700">
          {truncLen > 0 ? truncateText(review.text, truncLen) : review.text}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mt-2">
        {content.showSource !== false && review.source && (
          <span className="text-[11px] text-gray-400 capitalize">via {SOURCE_LABELS[review.source] ?? review.source}</span>
        )}
        {review.loan_type && (
          <span
            className="inline-block px-2 py-0.5 text-[11px] font-medium rounded"
            style={{ background: getLoanTypeColor(review.loan_type).bg, color: getLoanTypeColor(review.loan_type).text }}
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

export function ReviewCarouselPreview({
  reviews,
  content = {},
  colors = {},
  carousel = {},
  maxWidth,
  borderRadius,
}: ReviewCarouselPreviewProps) {
  const starFilled = colors.starFilled ?? DEFAULT_STAR_FILLED;
  const starEmpty = colors.starEmpty ?? DEFAULT_STAR_EMPTY;

  const transition = carousel.transition ?? "slide";
  const visibleCards = carousel.visibleCards ?? carousel.slidesPerView ?? 1;
  const interval = carousel.interval ?? 5000;
  const autoplay = carousel.autoplay !== false;
  const showArrows = carousel.showArrows !== false;
  const showDots = carousel.showDots !== false;

  const maxIndex = Math.max(0, reviews.length - visibleCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
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

  // Auto-play
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isPlaying && reviews.length > visibleCards) {
      timerRef.current = setInterval(next, interval);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, interval, next, reviews.length, visibleCards]);

  const dotCount = maxIndex + 1;

  const containerStyle: React.CSSProperties = {
    "--rw-primary": colors.primary ?? "#52796f",
    "--rw-bg": colors.background ?? "#ffffff",
    "--rw-text": colors.text ?? "#1a1a2e",
    "--rw-border": colors.border ?? "#e5e7eb",
    borderRadius: borderRadius ?? "8px",
    padding: "16px",
    background: colors.background ?? "#ffffff",
    color: colors.text ?? "#1a1a2e",
  } as React.CSSProperties;

  // Compute slide transform
  const getSlideTransform = (): React.CSSProperties => {
    if (transition === "slide") {
      return {
        transform: `translateX(-${currentIndex * (100 / visibleCards)}%)`,
        transition: "transform 300ms ease",
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
      aria-label={content.headerText ?? "Customer Reviews"}
      aria-roledescription="carousel"
    >
      {/* Header with play/pause */}
      <div className="flex items-center justify-between mb-3">
        {content.showHeader !== false && content.headerText && (
          <h3 className="text-lg font-bold" style={{ color: "var(--rw-text, #1a1a2e)" }}>
            {content.headerText}
          </h3>
        )}
        {reviews.length > visibleCards && (
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors"
            style={{
              color: "var(--rw-primary, #52796f)",
              borderColor: "var(--rw-border, #e5e7eb)",
            }}
            aria-label={isPlaying ? "Pause carousel" : "Play carousel"}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            {isPlaying ? "Pause" : "Play"}
          </button>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">No reviews yet.</div>
      ) : (
        <div className="relative">
          {/* Viewport */}
          <div className="overflow-hidden">
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
                    starFilled={starFilled}
                    starEmpty={starEmpty}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Arrows */}
          {showArrows && reviews.length > visibleCards && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 border border-gray-200 flex items-center justify-center z-10 transition-shadow hover:shadow-md"
                style={{ color: "var(--rw-text, #1a1a2e)" }}
                aria-label="Previous reviews"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 border border-gray-200 flex items-center justify-center z-10 transition-shadow hover:shadow-md"
                style={{ color: "var(--rw-text, #1a1a2e)" }}
                aria-label="Next reviews"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
      )}

      {/* Dots */}
      {showDots && dotCount > 1 && (
        <div className="flex justify-center gap-1.5 pt-3" role="tablist" aria-label="Review slides">
          {Array.from({ length: dotCount }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`w-2 h-2 rounded-full border-none transition-all ${
                i === currentIndex ? "scale-125" : "bg-gray-300 hover:bg-gray-400"
              }`}
              style={i === currentIndex ? { background: "var(--rw-primary, #52796f)" } : undefined}
              role="tab"
              aria-label={`Go to slide ${i + 1}`}
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
            <span className="text-[11px] font-semibold text-gray-600">Equal Housing Lender</span>
          </div>
          <p className="text-[10px] leading-snug text-gray-500 mb-1">
            {content.disclaimerText || "This is not a commitment to lend. Programs, rates, terms, and conditions are subject to change without notice."}
          </p>
          <a href="https://www.nmlsconsumeraccess.org" target="_blank" rel="noopener noreferrer" className="text-[10px] no-underline hover:underline" style={{ color: "var(--rw-primary, #52796f)" }}>
            NMLS Consumer Access
          </a>
        </div>
      )}

      {/* Branding */}
      {content.showBranding !== false && (
        <div className="mt-3 pt-2 border-t border-gray-100 text-[11px] text-gray-400 text-center">
          Powered by{" "}
          <a href="https://repwell.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 no-underline hover:underline">
            RepWell
          </a>
        </div>
      )}
    </div>
  );
}
