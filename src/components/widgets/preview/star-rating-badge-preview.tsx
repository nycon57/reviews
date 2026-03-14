"use client";

import { Star } from "lucide-react";
import Image from "next/image";
import { type WidgetThemeLayout } from "./layout";
import {
  getPreviewBodyStyle,
  getPreviewHeadingStyle,
  getPreviewMetaStyle,
  previewT,
  previewTp,
} from "./shared";

/**
 * Dashboard preview component for the Star Rating Badge Widget.
 * Mirrors the embed.js renderer output using React for WYSIWYG editing.
 * Renders both inline and floating mode previews.
 */

// ── Types (mirrors embed types without importing from embed package) ──

interface WidgetThemeColors {
  primary?: string;
  background?: string;
  text?: string;
  border?: string;
  starFilled?: string;
  starEmpty?: string;
}

interface BadgeConfig {
  placement?: "inline" | "floating";
  floatPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  floatAnimation?: "fade" | "slide" | "none";
  width?: string;
  height?: string;
  clickUrl?: string;
  showName?: boolean;
  refreshInterval?: "never" | "1hr" | "6hr" | "24hr";
}

interface BadgeProfile {
  organization_name?: string | null;
  full_name?: string | null;
  average_rating: number | null;
  total_reviews: number | null;
}

interface StarRatingBadgePreviewProps {
  profile: BadgeProfile | null;
  badge?: BadgeConfig;
  colors?: WidgetThemeColors;
  borderRadius?: string;
  layout?: WidgetThemeLayout;
  language?: string;
  profileUrl?: string;
}

// ── Partial Star Component ──────────────────────────────────────────

function PartialStar({
  fraction,
  filledColor,
  emptyColor,
}: {
  fraction: number;
  filledColor: string;
  emptyColor: string;
}) {
  return (
    <span className="relative inline-block" style={{ width: 16, height: 16 }}>
      <Star
        size={16}
        fill="none"
        stroke={emptyColor}
        strokeWidth={1.5}
        className="absolute inset-0"
      />
      <span
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${fraction * 100}%` }}
      >
        <Star
          size={16}
          fill={filledColor}
          stroke={filledColor}
          strokeWidth={1.5}
        />
      </span>
    </span>
  );
}

// ── Stars Row with Partial Fill ──────────────────────────────────────

function StarsRow({
  rating,
  filledColor,
  emptyColor,
}: {
  rating: number;
  filledColor: string;
  emptyColor: string;
}) {
  const fullCount = Math.floor(rating);
  const fraction = rating - fullCount;

  return (
    <div
      className="flex items-center gap-px"
      aria-hidden="true"
    >
      {Array.from({ length: 5 }, (_, i) => {
        if (i < fullCount) {
          return (
            <Star
              key={i}
              size={16}
              fill={filledColor}
              stroke={filledColor}
              strokeWidth={1.5}
            />
          );
        }
        if (i === fullCount && fraction > 0.05) {
          return (
            <PartialStar
              key={i}
              fraction={fraction}
              filledColor={filledColor}
              emptyColor={emptyColor}
            />
          );
        }
        return (
          <Star
            key={i}
            size={16}
            fill="none"
            stroke={emptyColor}
            strokeWidth={1.5}
          />
        );
      })}
    </div>
  );
}

// ── Badge Component ──────────────────────────────────────────────────

function Badge({
  profile,
  badge,
  colors,
  borderRadius,
  layout,
  lang,
  profileUrl,
}: {
  profile: BadgeProfile;
  badge: BadgeConfig;
  colors: WidgetThemeColors;
  borderRadius?: string;
  layout?: WidgetThemeLayout;
  lang?: string;
  profileUrl?: string;
}) {
  const starFilled = colors.starFilled ?? "#f59e0b";
  const starEmpty = colors.starEmpty ?? "#d1d5db";
  const rating = profile.average_rating ?? 0;
  const totalReviews = profile.total_reviews ?? 0;
  const entityName =
    profile.organization_name ?? profile.full_name ?? null;
  const showName = badge.showName !== false;

  const isFloating = badge.placement === "floating";
  const isClickable = !!profileUrl || !!badge.clickUrl;

  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    flexDirection: "column",
    gap: 0,
    padding: layout?.padding ?? "12px 16px",
    background: "var(--rw-surface, var(--rw-bg, #fff))",
    border: "1px solid var(--rw-border, #e5e7eb)",
    borderRadius: borderRadius ?? "10px",
    cursor: isClickable ? "pointer" : "default",
    textDecoration: "none",
    color: "inherit",
    lineHeight: 1,
    boxShadow: isFloating
      ? "0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)"
      : "0 1px 3px rgba(0,0,0,0.06)",
    minWidth: badge.width ?? "200px",
    maxWidth: "100%",
    boxSizing: "border-box",
    transition: "box-shadow 0.2s ease, transform 0.15s ease",
  };

  const ariaLabel = previewTp(lang, "ratedAriaLabel", totalReviews, { rating: rating.toFixed(1), count: totalReviews });

  const Wrapper = isClickable ? "a" : "div";
  const wrapperProps = isClickable
    ? {
        href: profileUrl ?? badge.clickUrl ?? "#",
        target: "_blank" as const,
        rel: "noopener noreferrer",
      }
    : {};

  return (
    <Wrapper
      style={badgeStyle}
      {...(isClickable ? { "aria-label": ariaLabel } : { role: "img", "aria-label": ariaLabel })}
      {...wrapperProps}
    >
      {/* Top section: rating + stars + info */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontWeight: 700,
            lineHeight: 1,
            flexShrink: 0,
            ...getPreviewHeadingStyle(colors.text ?? "#1a1a2e"),
          }}
        >
          {rating.toFixed(1)}
        </span>

        <StarsRow
          rating={rating}
          filledColor={starFilled}
          emptyColor={starEmpty}
        />

        {(totalReviews > 0 || (showName && entityName)) && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              minWidth: 0,
            }}
          >
            {showName && entityName && (
              <span
                style={{
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1.2,
                  ...getPreviewBodyStyle(colors.text ?? "#1a1a2e"),
                }}
              >
                {entityName}
              </span>
            )}
            {totalReviews > 0 && (
              <span
                style={{
                  whiteSpace: "nowrap",
                  lineHeight: 1.2,
                  ...getPreviewMetaStyle(),
                }}
              >
                {totalReviews} {previewT(lang, totalReviews === 1 ? "review" : "reviews")}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: "var(--rw-border, #e5e7eb)",
          margin: "8px 0 6px",
          opacity: 0.5,
        }}
      />

      {/* Verified by RepWell branding */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <Image
          src="/branding/RepWell-Icon-Full-Color.png"
          alt=""
          width={14}
          height={14}
          style={{ flexShrink: 0, borderRadius: 2 }}
          unoptimized
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: "#6b7280",
            letterSpacing: "0.01em",
            lineHeight: 1,
          }}
        >
          {previewT(lang, "verifiedBy") || "Verified by"}{" "}
          <span style={{ fontWeight: 600, color: "#52796f" }}>RepWell</span>
        </span>
      </div>
    </Wrapper>
  );
}

// ── Main Preview Component ──────────────────────────────────────────

export function StarRatingBadgePreview({
  profile,
  badge = {},
  colors = {},
  borderRadius,
  layout,
  language,
  profileUrl,
}: StarRatingBadgePreviewProps) {
  const effectiveProfile: BadgeProfile = profile ?? {
    average_rating: 4.8,
    total_reviews: 234,
    organization_name: "Sample Company",
  };

  const isFloating = badge.placement === "floating";
  const floatPos = badge.floatPosition ?? "bottom-right";

  if (isFloating) {
    // Render floating preview inside a simulated viewport container
    const positionStyle: React.CSSProperties = {
      position: "absolute",
    };

    if (floatPos.includes("top")) positionStyle.top = 16;
    if (floatPos.includes("bottom")) positionStyle.bottom = 16;
    if (floatPos.includes("left")) positionStyle.left = 16;
    if (floatPos.includes("right")) positionStyle.right = 16;

    return (
      <div
        className="relative w-full bg-gray-50 border border-dashed border-gray-300 rounded-lg overflow-hidden"
        style={{ minHeight: 120 }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center text-xs text-gray-300 select-none"
        >
          Host page content
        </div>
        <div style={positionStyle}>
          <Badge
            profile={effectiveProfile}
            badge={badge}
            colors={colors}
            borderRadius={borderRadius}
            layout={layout}
            lang={language}
            profileUrl={profileUrl}
          />
        </div>
      </div>
    );
  }

  // Inline mode
  return (
    <Badge
      profile={effectiveProfile}
      badge={badge}
      colors={colors}
      borderRadius={borderRadius}
      layout={layout}
      lang={language}
      profileUrl={profileUrl}
    />
  );
}
