import React from "react";
import type { BaseWidgetProps } from "../types";
import { useWidgetConfig } from "../hooks/useWidgetConfig";
import { useWidgetEvents } from "../hooks/useWidgetEvents";
import { WidgetShell } from "../utils/WidgetShell";
import { Stars } from "../utils/Stars";
import { pluralize, sanitizeUrl } from "../utils/helpers";

const DEFAULT_API_BASE = "https://app.repwell.com";

/**
 * Star Rating Badge Widget.
 * Displays a compact star rating badge with optional entity name, supporting inline and floating modes.
 */
export function StarRatingBadge({
  widgetId,
  config: inlineConfig,
  reviews: inlineReviews,
  apiBaseUrl = DEFAULT_API_BASE,
  className,
  style,
  onEvent,
  fallback,
}: BaseWidgetProps) {
  const { config, loading, error } = useWidgetConfig({
    widgetId,
    config: inlineConfig,
    reviews: inlineReviews,
    apiBaseUrl,
  });

  const resolvedId = widgetId ?? config?.widget_id ?? "unknown";
  const { emit } = useWidgetEvents({ widgetId: resolvedId, onEvent });

  const cfg = config?.config;
  const colors = cfg?.theme?.colors;
  const badge = cfg?.badge;
  const profile = config?.entity_profile;
  const starFilled = colors?.starFilled ?? "#f59e0b";
  const starEmpty = colors?.starEmpty ?? "#d1d5db";
  const averageRating = profile?.average_rating ?? 0;
  const totalReviews = profile?.total_reviews ?? 0;
  const entityName = profile?.organization_name ?? profile?.full_name ?? null;
  const showName = badge?.showName !== false;
  const safeUrl = badge?.clickUrl ? sanitizeUrl(badge.clickUrl) : null;
  const isFloating = badge?.placement === "floating";

  const floatingStyle: React.CSSProperties = isFloating
    ? {
        position: "fixed",
        zIndex: badge?.floatZIndex ?? 9999,
        ...(badge?.floatPosition?.includes("bottom")
          ? { bottom: badge.floatOffsetY ?? 20 }
          : { top: badge.floatOffsetY ?? 20 }),
        ...(badge?.floatPosition?.includes("right")
          ? { right: badge.floatOffsetX ?? 20 }
          : { left: badge.floatOffsetX ?? 20 }),
      }
    : {};

  const ariaLabel = `Rated ${averageRating.toFixed(1)} out of 5 based on ${totalReviews} ${pluralize(totalReviews, "review")}`;

  const badgeContent = (
    <>
      <span className="rw-srb__rating">{averageRating.toFixed(1)}</span>
      <Stars
        rating={averageRating}
        filledColor={starFilled}
        emptyColor={starEmpty}
        partial
      />
      {(totalReviews > 0 || (showName && entityName)) && (
        <div className="rw-srb__info">
          {showName && entityName && <span className="rw-srb__name">{entityName}</span>}
          {totalReviews > 0 && (
            <span className="rw-srb__count">
              {totalReviews} {pluralize(totalReviews, "review")}
            </span>
          )}
        </div>
      )}
    </>
  );

  return (
    <WidgetShell
      className={className}
      style={{ ...floatingStyle, ...style }}
      ariaLabel={ariaLabel}
      loading={loading}
      error={error}
      fallback={fallback}
    >
      {config && (
        safeUrl ? (
          <a
            className="rw-srb"
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => emit("click_cta")}
            role="img"
            aria-label={ariaLabel}
            style={{
              ...(badge?.width ? { width: badge.width } : {}),
              ...(badge?.height ? { height: badge.height } : {}),
            }}
          >
            {badgeContent}
          </a>
        ) : (
          <div
            className="rw-srb"
            role="img"
            aria-label={ariaLabel}
            style={{
              ...(badge?.width ? { width: badge.width } : {}),
              ...(badge?.height ? { height: badge.height } : {}),
            }}
          >
            {badgeContent}
          </div>
        )
      )}
    </WidgetShell>
  );
}
