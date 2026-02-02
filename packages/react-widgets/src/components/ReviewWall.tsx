import { useState, useCallback } from "react";
import type { BaseWidgetProps } from "../types";
import { useWidgetConfig } from "../hooks/useWidgetConfig";
import { useWidgetEvents } from "../hooks/useWidgetEvents";
import { WidgetShell } from "../utils/WidgetShell";
import { ReviewCard } from "../utils/ReviewCard";

const DEFAULT_API_BASE = "https://app.repwell.com";

/**
 * Review Wall Widget.
 * Displays reviews in a masonry-style grid with configurable columns and load-more.
 */
export function ReviewWall({
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
  const wallCfg = cfg?.wall;
  const starFilled = colors?.starFilled ?? "#f59e0b";
  const starEmpty = colors?.starEmpty ?? "#d1d5db";
  const cardStyle = content?.cardStyle ?? "bordered";

  const columns = wallCfg?.columns ?? 3;
  const gap = wallCfg?.gap ?? 16;
  const loadMoreMode = wallCfg?.loadMore ?? "button";
  const perPage = content?.reviewsPerPage ?? 12;

  const [visibleCount, setVisibleCount] = useState(perPage);

  const visibleReviews = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + perPage, reviews.length));
    emit("click", { action: "load_more" });
  }, [perPage, reviews.length, emit]);

  return (
    <WidgetShell
      className={className}
      style={style}
      ariaLabel={content?.headerText ?? "Review Wall"}
      loading={loading}
      error={error}
      fallback={fallback}
    >
      {config && (
        <>
          {content?.showHeader !== false && content?.headerText && (
            <h3 className="rw-wall__header">{content.headerText}</h3>
          )}

          {reviews.length === 0 ? (
            <div className="rw-empty">No reviews yet.</div>
          ) : (
            <>
              <div
                className="rw-wall__grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  gap: `${gap}px`,
                }}
              >
                {visibleReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    content={content}
                    starFilled={starFilled}
                    starEmpty={starEmpty}
                    cardStyle={cardStyle}
                    onClickReview={(id) => emit("click_review", { review_id: id })}
                  />
                ))}
              </div>

              {hasMore && loadMoreMode === "button" && (
                <div className="rw-wall__load-more">
                  <button
                    type="button"
                    className="rw-wall__load-more-btn"
                    onClick={loadMore}
                  >
                    Load More Reviews
                  </button>
                </div>
              )}
            </>
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
