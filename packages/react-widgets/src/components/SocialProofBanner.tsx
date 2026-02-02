import React, { useState, useEffect, useCallback } from "react";
import type { BaseWidgetProps, PublicReview } from "../types";
import { useWidgetConfig } from "../hooks/useWidgetConfig";
import { useWidgetEvents } from "../hooks/useWidgetEvents";
import { WidgetShell } from "../utils/WidgetShell";
import { Stars } from "../utils/Stars";
import { formatRelativeDate, pluralize } from "../utils/helpers";

const DEFAULT_API_BASE = "https://app.repwell.com";

function NotificationPopup({
  review,
  visible,
  onDismiss,
  ctaText,
  ctaUrl,
  onCta,
}: {
  review: PublicReview;
  visible: boolean;
  onDismiss?: () => void;
  ctaText?: string;
  ctaUrl?: string;
  onCta?: () => void;
}) {
  if (!visible) return null;

  return (
    <div className="rw-spb__notification" role="status">
      <div className="rw-spb__notification-content">
        <Stars rating={review.rating} />
        {review.text && (
          <p className="rw-spb__notification-text">
            {review.text.length > 100 ? review.text.slice(0, 100) + "\u2026" : review.text}
          </p>
        )}
        <span className="rw-spb__notification-author">
          {review.reviewer_name ?? "A customer"} &mdash; {formatRelativeDate(review.review_date)}
        </span>
      </div>
      {ctaText && ctaUrl && (
        <a
          className="rw-spb__cta"
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onCta}
        >
          {ctaText}
        </a>
      )}
      {onDismiss && (
        <button type="button" className="rw-spb__dismiss" onClick={onDismiss} aria-label="Dismiss">
          &times;
        </button>
      )}
    </div>
  );
}

function CounterBar({
  totalReviews,
  averageRating,
  ctaText,
  ctaUrl,
  onCta,
  onDismiss,
}: {
  totalReviews: number;
  averageRating: number;
  ctaText?: string;
  ctaUrl?: string;
  onCta?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div className="rw-spb__counter-bar" role="status">
      <span className="rw-spb__counter-text">
        <Stars rating={Math.round(averageRating)} /> {averageRating.toFixed(1)} from{" "}
        {totalReviews} {pluralize(totalReviews, "review")}
      </span>
      {ctaText && ctaUrl && (
        <a
          className="rw-spb__cta"
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onCta}
        >
          {ctaText}
        </a>
      )}
      {onDismiss && (
        <button type="button" className="rw-spb__dismiss" onClick={onDismiss} aria-label="Dismiss">
          &times;
        </button>
      )}
    </div>
  );
}

/**
 * Social Proof Banner Widget.
 * Displays recent review notifications, counter bars, or floating badges to build trust.
 */
export function SocialProofBanner({
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
  const spb = cfg?.socialProofBanner;
  const profile = config?.entity_profile;
  const displayMode = spb?.displayMode ?? "notification";
  const placement = spb?.placement ?? "bottom-right";
  const dismissable = spb?.dismissable !== false;
  const rotationInterval = spb?.interval ?? 5000;

  const [dismissed, setDismissed] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    emit("click", { action: "dismiss" });
  }, [emit]);

  // Rotate through reviews for notification mode
  useEffect(() => {
    if (displayMode !== "notification" || reviews.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
    }, rotationInterval);
    return () => clearInterval(timer);
  }, [displayMode, reviews.length, rotationInterval]);

  if (dismissed) return null;

  const placementStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: spb?.zIndex ?? 9999,
    ...(placement.includes("bottom") ? { bottom: 20 } : { top: 20 }),
    ...(placement.includes("right") ? { right: 20 } : {}),
    ...(placement.includes("left") ? { left: 20 } : {}),
    ...(placement.includes("bar") ? { left: 0, right: 0, ...(placement === "top-bar" ? { top: 0 } : { bottom: 0 }) } : {}),
  };

  return (
    <WidgetShell
      className={className}
      style={{ ...placementStyle, ...style }}
      ariaLabel="Social proof"
      loading={loading}
      error={error}
      fallback={fallback}
    >
      {config && reviews.length > 0 && (
        <>
          {displayMode === "notification" && (
            <NotificationPopup
              review={reviews[currentReviewIndex]}
              visible={!dismissed}
              onDismiss={dismissable ? handleDismiss : undefined}
              ctaText={spb?.ctaText}
              ctaUrl={spb?.ctaUrl}
              onCta={() => emit("click_cta")}
            />
          )}

          {displayMode === "counter_bar" && profile && (
            <CounterBar
              totalReviews={profile.total_reviews ?? 0}
              averageRating={profile.average_rating ?? 0}
              ctaText={spb?.ctaText}
              ctaUrl={spb?.ctaUrl}
              onCta={() => emit("click_cta")}
              onDismiss={dismissable ? handleDismiss : undefined}
            />
          )}

          {displayMode === "floating_badge" && profile && (
            <div className="rw-spb__floating-badge" role="status">
              <Stars rating={Math.round(profile.average_rating ?? 0)} />
              <span>{(profile.average_rating ?? 0).toFixed(1)}</span>
              {dismissable && (
                <button type="button" className="rw-spb__dismiss" onClick={handleDismiss} aria-label="Dismiss">
                  &times;
                </button>
              )}
            </div>
          )}
        </>
      )}
    </WidgetShell>
  );
}
