"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, X } from "lucide-react";
import {
  type WidgetThemeColors,
  type WidgetContent,
  getInitials,
  truncateText,
  previewT,
  DEFAULT_STAR_FILLED,
  DEFAULT_STAR_EMPTY,
} from "./shared";
import type { WidgetThemeLayout } from "./layout";
import { SHADOW_VALUES } from "@/lib/widgets/theme-utils";

/**
 * Dashboard preview for the Social Proof Banner Widget.
 * Shows all three modes (notification, counter bar, floating badge)
 * with trigger simulation inside a simulated viewport container.
 */

// ── Component-specific types ─────────────────────────────────────────

interface SocialProofBannerConfig {
  displayMode?: "notification" | "counter_bar" | "floating_badge";
  placement?: string;
  trigger?: "immediate" | "scroll" | "time" | "exit_intent";
  triggerValue?: number;
  frequency?: string;
  dismissable?: boolean;
  animation?: "slide" | "fade" | "bounce";
  interval?: number;
  zIndex?: number;
  ctaText?: string;
  ctaUrl?: string;
}

interface PreviewReview {
  reviewer_name: string;
  rating: number;
  text: string;
  professional_name?: string;
  review_date: string;
}

interface PreviewProfile {
  average_rating: number | null;
  total_reviews: number | null;
  organization_name?: string | null;
}

interface SocialProofBannerPreviewProps {
  profile?: PreviewProfile | null;
  socialProofBanner?: SocialProofBannerConfig;
  content?: WidgetContent;
  colors?: WidgetThemeColors;
  layout?: WidgetThemeLayout;
}

// ── Sample Data ───────────────────────────────────────────────────────

const SAMPLE_REVIEWS: PreviewReview[] = [
  {
    reviewer_name: "Sarah M.",
    rating: 5,
    text: "Amazing experience from start to finish. The team was incredibly responsive and made the whole process seamless.",
    professional_name: "John Davis",
    review_date: "2026-01-28",
  },
  {
    reviewer_name: "Michael T.",
    rating: 5,
    text: "The team made the entire process easy to understand and easy to trust. I would recommend them without hesitation.",
    professional_name: "Lisa Chen",
    review_date: "2026-01-25",
  },
  {
    reviewer_name: "Emily R.",
    rating: 4,
    text: "Great communication throughout the process. Very professional team.",
    review_date: "2026-01-22",
  },
];

const SAMPLE_PROFILE: PreviewProfile = {
  average_rating: 4.8,
  total_reviews: 1234,
  organization_name: "Sample Company",
};

// ── Helpers ───────────────────────────────────────────────────────────

function StarsRow({
  rating,
  size = 14,
  filledColor,
  emptyColor,
}: {
  rating: number;
  size?: number;
  filledColor: string;
  emptyColor: string;
}) {
  return (
    <div className="flex items-center gap-px">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < rating ? filledColor : "none"}
          stroke={i < rating ? filledColor : emptyColor}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

// ── Notification Preview ──────────────────────────────────────────────

function NotificationPreview({
  reviews,
  colors,
  dismissable,
  interval,
  truncateLength,
  layout,
  lang,
}: {
  reviews: PreviewReview[];
  colors: WidgetThemeColors;
  dismissable: boolean;
  interval: number;
  truncateLength: number;
  layout?: WidgetThemeLayout;
  lang?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  const rotate = useCallback(() => {
    setAnimating(true);
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
      setAnimating(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [reviews.length]);

  useEffect(() => {
    if (reviews.length <= 1) return;
    const id = setInterval(rotate, interval);
    return () => clearInterval(id);
  }, [reviews.length, interval, rotate]);

  const review = reviews[currentIndex];
  const filledColor = colors.starFilled ?? DEFAULT_STAR_FILLED;
  const emptyColor = colors.starEmpty ?? DEFAULT_STAR_EMPTY;
  const shadow = layout?.shadow
    ? (SHADOW_VALUES[layout.shadow] ?? "none")
    : "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)";

  return (
    <div
      className="relative"
      style={{
        background: "var(--rw-surface, var(--rw-bg, #fff))",
        border: "1px solid var(--rw-border, #e5e7eb)",
        borderRadius: layout?.borderRadius ?? 12,
        boxShadow: shadow,
        padding: layout?.padding ?? "14px 16px",
        width: 340,
        maxWidth: "100%",
        display: "flex",
        boxSizing: "border-box" as const,
        gap: 12,
        opacity: animating ? 0.5 : 1,
        transition: "opacity 0.25s ease",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "var(--rw-accent, var(--rw-primary, #4f46e5))",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {getInitials(review.reviewer_name)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className="text-[13px] font-semibold truncate"
            style={{ color: "var(--rw-text, #1a1a2e)" }}
          >
            {review.reviewer_name}
          </span>
          {review.professional_name && (
            <span
              className="text-[11px] truncate"
              style={{ color: "var(--rw-text-muted, #6b7280)" }}
            >
              {previewT(lang, "for")} {review.professional_name}
            </span>
          )}
        </div>

        <div className="mb-1">
          <StarsRow
            rating={review.rating}
            filledColor={filledColor}
            emptyColor={emptyColor}
          />
        </div>

        {review.text && (
          <p
            className="text-[12px] line-clamp-2"
            style={{ color: "var(--rw-text-muted, #6b7280)" }}
          >
            &ldquo;{truncateText(review.text, truncateLength)}&rdquo;
          </p>
        )}
      </div>

      {dismissable && (
        <button
          className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={previewT(lang, "dismissBanner")}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// ── Counter Bar Preview ───────────────────────────────────────────────

function CounterBarPreview({
  profile,
  colors,
  dismissable,
  ctaText,
  layout,
  lang,
}: {
  profile: PreviewProfile;
  colors: WidgetThemeColors;
  dismissable: boolean;
  ctaText: string;
  layout?: WidgetThemeLayout;
  lang?: string;
}) {
  const filledColor = colors.starFilled ?? DEFAULT_STAR_FILLED;
  const shadow = layout?.shadow
    ? (SHADOW_VALUES[layout.shadow] ?? "none")
    : "0 2px 12px rgba(0,0,0,0.08)";

  return (
    <div
      style={{
        background: "var(--rw-surface, var(--rw-bg, #fff))",
        borderTop: "1px solid var(--rw-border, #e5e7eb)",
        borderBottom: "1px solid var(--rw-border, #e5e7eb)",
        borderRadius: layout?.borderRadius ?? 0,
        boxShadow: shadow,
        padding: layout?.padding ?? "10px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        fontSize: 14,
        minHeight: 48,
      }}
    >
      <div className="flex items-center gap-1.5 font-semibold">
        <Star size={18} fill={filledColor} stroke={filledColor} />
        <span style={{ color: "var(--rw-text, #1a1a2e)" }}>
          {(profile.average_rating ?? 4.8).toFixed(1)}
        </span>
      </div>

      <span
        className="text-[13px]"
        style={{ color: "var(--rw-text-muted, #6b7280)" }}
      >
        {previewT(lang, "averageFrom", { count: (profile.total_reviews ?? 0).toLocaleString() })}
      </span>

      <span
        className="inline-flex items-center px-4 py-1.5 rounded-md text-[13px] font-medium text-white"
        style={{ background: "var(--rw-accent, var(--rw-primary, #4f46e5))" }}
      >
        {ctaText}
      </span>

      {dismissable && (
        <button
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label={previewT(lang, "dismissBanner")}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// ── Floating Badge Preview ────────────────────────────────────────────

function FloatingBadgePreview({
  review,
  colors,
  dismissable,
  truncateLength,
  layout,
  lang,
}: {
  review: PreviewReview;
  colors: WidgetThemeColors;
  dismissable: boolean;
  truncateLength: number;
  layout?: WidgetThemeLayout;
  lang?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const filledColor = colors.starFilled ?? DEFAULT_STAR_FILLED;
  const emptyColor = colors.starEmpty ?? DEFAULT_STAR_EMPTY;
  const shadow = layout?.shadow
    ? (SHADOW_VALUES[layout.shadow] ?? "none")
    : hovered
      ? "0 8px 24px rgba(0,0,0,0.14)"
      : "0 4px 16px rgba(0,0,0,0.1)";

  return (
    <div
      className="relative cursor-pointer transition-all duration-200"
      style={{
        background: "var(--rw-surface, var(--rw-bg, #fff))",
        border: "1px solid var(--rw-border, #e5e7eb)",
        borderRadius: layout?.borderRadius ?? 12,
        boxShadow: shadow,
        padding: layout?.padding ?? "10px 14px",
        width: hovered ? 280 : 220,
        maxWidth: "100%",
        transition: "width 0.25s ease, box-shadow 0.2s ease",
        overflow: "hidden",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-2">
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--rw-accent, var(--rw-primary, #4f46e5))",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {getInitials(review.reviewer_name)}
        </div>
        <div className="min-w-0">
          <div
            className="text-[12px] font-semibold truncate"
            style={{ color: "var(--rw-text, #1a1a2e)" }}
          >
            {review.reviewer_name}
          </div>
          <StarsRow
            rating={review.rating}
            size={12}
            filledColor={filledColor}
            emptyColor={emptyColor}
          />
        </div>
      </div>

      <div
        className="transition-all duration-200 overflow-hidden"
        style={{
          maxHeight: hovered ? 120 : 0,
          opacity: hovered ? 1 : 0,
          marginTop: hovered ? 8 : 0,
        }}
      >
        {review.text && (
          <p
            className="text-[12px] line-clamp-3"
            style={{ color: "var(--rw-text-muted, #6b7280)" }}
          >
            &ldquo;{truncateText(review.text, truncateLength)}&rdquo;
          </p>
        )}
      </div>

      {dismissable && (
        <button
          className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={previewT(lang, "dismissBanner")}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

// ── Trigger Simulation Label ──────────────────────────────────────────

function TriggerLabel({ trigger, value }: { trigger: string; value?: number }) {
  const labels: Record<string, string> = {
    immediate: "Shows immediately",
    scroll: `Shows after scrolling ${value ?? 25}%`,
    time: `Shows after ${((value ?? 3000) / 1000).toFixed(0)}s delay`,
    exit_intent: "Shows on exit intent",
  };
  return (
    <span
      className="text-[11px] italic"
      style={{ color: "var(--rw-text-subtle, #9ca3af)" }}
    >
      Trigger: {labels[trigger] ?? trigger}
    </span>
  );
}

// ── Main Preview ──────────────────────────────────────────────────────

export function SocialProofBannerPreview({
  profile,
  socialProofBanner = {},
  content,
  colors = {},
  layout,
}: SocialProofBannerPreviewProps) {
  const mode = socialProofBanner.displayMode ?? "notification";
  const placement = socialProofBanner.placement ?? "bottom-right";
  const dismissable = socialProofBanner.dismissable !== false;
  const interval = socialProofBanner.interval ?? 5000;
  const lang = content?.language;
  const ctaText = socialProofBanner.ctaText ?? previewT(lang, "readReviews");
  const effectiveProfile = profile ?? SAMPLE_PROFILE;
  const truncateLength = content?.truncateLength ?? 120;

  // Position styles for the simulated viewport
  const positionStyle: React.CSSProperties = { position: "absolute" };
  if (placement.includes("top")) positionStyle.top = 12;
  if (placement.includes("bottom")) positionStyle.bottom = 12;
  if (placement.includes("left")) positionStyle.left = 12;
  if (placement.includes("right")) positionStyle.right = 12;
  if (placement === "top-bar") {
    positionStyle.top = 0;
    positionStyle.left = 0;
    positionStyle.right = 0;
  }
  if (placement === "bottom-bar") {
    positionStyle.bottom = 0;
    positionStyle.left = 0;
    positionStyle.right = 0;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <TriggerLabel
          trigger={socialProofBanner.trigger ?? "immediate"}
          value={socialProofBanner.triggerValue}
        />
      </div>

      <div
        className="relative w-full bg-gray-50 border border-dashed border-gray-300 rounded-lg overflow-hidden"
        style={{ minHeight: mode === "counter_bar" ? 100 : 200 }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-300 select-none pointer-events-none">
          Host page content
        </div>

        <div style={positionStyle}>
          {mode === "notification" && (
            <NotificationPreview
              reviews={SAMPLE_REVIEWS}
              colors={colors}
              dismissable={dismissable}
              interval={interval}
              truncateLength={truncateLength}
              layout={layout}
              lang={lang}
            />
          )}
          {mode === "counter_bar" && (
            <CounterBarPreview
              profile={effectiveProfile}
              colors={colors}
              dismissable={dismissable}
              ctaText={ctaText}
              layout={layout}
              lang={lang}
            />
          )}
          {mode === "floating_badge" && (
            <FloatingBadgePreview
              review={SAMPLE_REVIEWS[0]}
              colors={colors}
              dismissable={dismissable}
              truncateLength={truncateLength}
              layout={layout}
              lang={lang}
            />
          )}
        </div>
      </div>
    </div>
  );
}
