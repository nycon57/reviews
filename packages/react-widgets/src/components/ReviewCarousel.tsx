import { useState, useCallback, useEffect, useRef } from "react";
import type { BaseWidgetProps } from "../types";
import { useWidgetConfig } from "../hooks/useWidgetConfig";
import { useWidgetEvents } from "../hooks/useWidgetEvents";
import { WidgetShell } from "../utils/WidgetShell";
import { ReviewCard } from "../utils/ReviewCard";

const DEFAULT_API_BASE = "https://app.repwell.com";

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d={direction === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

/**
 * Review Carousel Widget.
 * Displays reviews in a rotating carousel with autoplay, arrows, and dots.
 */
export function ReviewCarousel({
  widgetId,
  config: inlineConfig,
  reviews: inlineReviews,
  apiBaseUrl = DEFAULT_API_BASE,
  className,
  style,
  onEvent,
  fallback,
}: BaseWidgetProps) {
  const { config, reviews, loading, error } = useWidgetConfig({
    widgetId,
    config: inlineConfig,
    reviews: inlineReviews,
    apiBaseUrl,
  });

  const resolvedId = widgetId ?? config?.widget_id ?? "unknown";
  const { emit } = useWidgetEvents({ widgetId: resolvedId, onEvent });

  const cfg = config?.config;
  const content = cfg?.content;
  const colors = cfg?.theme?.colors;
  const carousel = cfg?.carousel;
  const starFilled = colors?.starFilled ?? "#f59e0b";
  const starEmpty = colors?.starEmpty ?? "#d1d5db";

  const visibleCards = carousel?.visibleCards ?? carousel?.slidesPerView ?? 1;
  const autoplay = carousel?.autoplay !== false;
  const interval = carousel?.interval ?? 5000;
  const showArrows = carousel?.showArrows !== false;
  const showDots = carousel?.showDots !== false;
  const cardStyle = content?.cardStyle ?? "bordered";

  const [currentIndex, setCurrentIndex] = useState(0);
  const maxIndex = Math.max(0, reviews.length - visibleCards);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, maxIndex));
      setCurrentIndex(clamped);
    },
    [maxIndex],
  );

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    emit("carousel_navigate", { direction: "next" });
  }, [maxIndex, emit]);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
    emit("carousel_navigate", { direction: "prev" });
  }, [maxIndex, emit]);

  // Autoplay
  useEffect(() => {
    if (!autoplay || reviews.length <= visibleCards) return;

    const start = () => {
      autoplayRef.current = setInterval(() => {
        if (!pausedRef.current) {
          setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
        }
      }, interval);
    };

    start();
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [autoplay, interval, maxIndex, reviews.length, visibleCards]);

  const dotCount = maxIndex + 1;
  const dots = Array.from({ length: dotCount }, (_, i) => ({
    id: `slide-${i + 1}`,
    index: i,
  }));
  const offset = -(currentIndex * (100 / visibleCards));

  return (
    <WidgetShell
      className={className}
      style={style}
      ariaLabel={content?.headerText ?? "Customer Reviews"}
      loading={loading}
      error={error}
      fallback={fallback}
    >
      {config && (
        <>
          {content?.showHeader !== false && content?.headerText && (
            <h3 className="rw-carousel__title">{content.headerText}</h3>
          )}

          {reviews.length === 0 ? (
            <div className="rw-empty">No reviews yet.</div>
          ) : (
            <div
              className="rw-carousel"
              role="region"
              aria-roledescription="carousel"
              onMouseEnter={() => { pausedRef.current = true; }}
              onMouseLeave={() => { pausedRef.current = false; }}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
                else if (e.key === "ArrowRight") { e.preventDefault(); next(); }
              }}
              tabIndex={0}
            >
              <div className="rw-carousel__viewport" style={{ overflow: "hidden" }}>
                <div
                  className="rw-carousel__track"
                  style={{
                    display: "flex",
                    transform: `translateX(${offset}%)`,
                    transition: "transform 0.4s ease",
                  }}
                >
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rw-carousel__card"
                      style={{ flex: `0 0 ${100 / visibleCards}%`, padding: "0 0.5rem" }}
                      aria-roledescription="slide"
                    >
                      <ReviewCard
                        review={review}
                        content={content}
                        starFilled={starFilled}
                        starEmpty={starEmpty}
                        cardStyle={cardStyle}
                        onClickReview={(id) => emit("click_review", { review_id: id })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {showArrows && reviews.length > visibleCards && (
                <>
                  <button
                    type="button"
                    className="rw-carousel__arrow rw-carousel__arrow--prev"
                    onClick={prev}
                    aria-label="Previous reviews"
                  >
                    <ArrowIcon direction="left" />
                  </button>
                  <button
                    type="button"
                    className="rw-carousel__arrow rw-carousel__arrow--next"
                    onClick={next}
                    aria-label="Next reviews"
                  >
                    <ArrowIcon direction="right" />
                  </button>
                </>
              )}
            </div>
          )}

          {showDots && dotCount > 1 && (
            <div className="rw-carousel__dots" role="tablist" aria-label="Review slides">
              {dots.map(({ id, index }) => (
                <button
                  key={id}
                  type="button"
                  className={`rw-carousel__dot ${index === currentIndex ? "rw-carousel__dot--active" : ""}`}
                  role="tab"
                  aria-label={`Go to slide ${index + 1}`}
                  aria-selected={index === currentIndex}
                  onClick={() => goTo(index)}
                />
              ))}
            </div>
          )}

          {content?.showBranding !== false && (
            <div className="rw-branding">
              Powered by{" "}
              <a href="https://repwell.com" target="_blank" rel="noopener noreferrer">
                RepWell
              </a>
            </div>
          )}
        </>
      )}
    </WidgetShell>
  );
}
