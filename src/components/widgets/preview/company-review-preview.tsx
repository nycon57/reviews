"use client";

import { useState, useCallback } from "react";
import { Star, Home } from "lucide-react";

/**
 * Dashboard preview component for the Company Review Widget.
 * Mirrors the embed.js renderer output using React for WYSIWYG editing.
 */

// ── Types (mirrors embed types without importing from embed package) ──

interface WidgetThemeColors {
  primary?: string;
  background?: string;
  text?: string;
  accent?: string;
  border?: string;
  starFilled?: string;
  starEmpty?: string;
}

interface WidgetContent {
  showHeader?: boolean;
  headerText?: string;
  showCTA?: boolean;
  ctaText?: string;
  ctaUrl?: string;
  showSource?: boolean;
  showDate?: boolean;
  showAvatar?: boolean;
  showBranding?: boolean;
  truncateLength?: number;
  showDisclaimer?: boolean;
  disclaimerText?: string;
  showWriteReview?: boolean;
  writeReviewUrl?: string;
  columns?: number;
  dateFormat?: "relative" | "absolute";
  cardStyle?: "bordered" | "shadow" | "flat";
  showFilters?: boolean;
  showRatingDistribution?: boolean;
  showSourceBreakdown?: boolean;
  reviewsPerPage?: number;
}

interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

interface SourceBreakdown {
  source: string;
  count: number;
  average: number;
}

interface OrgProfile {
  organization_name: string | null;
  logo_url: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  rating_distribution: RatingDistribution | null;
  source_breakdown: SourceBreakdown[] | null;
}

interface PreviewReview {
  id: string;
  reviewer_name: string | null;
  rating: number;
  text: string | null;
  review_date: string;
  source: string;
  avatar_url: string | null;
  loan_type: string | null;
  first_time_homebuyer: boolean | null;
}

interface CompanyReviewPreviewProps {
  profile: OrgProfile | null;
  reviews: PreviewReview[];
  content?: WidgetContent;
  colors?: WidgetThemeColors;
  maxWidth?: string;
  borderRadius?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0]?.toUpperCase() ?? "?";
}

function truncateText(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max).trimEnd() + "\u2026";
}

function formatRelativeDate(dateStr: string): string {
  try {
    const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
    if (diffDays < 1) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch {
    return dateStr;
  }
}

function formatAbsoluteDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDate(dateStr: string, format: "relative" | "absolute"): string {
  return format === "relative" ? formatRelativeDate(dateStr) : formatAbsoluteDate(dateStr);
}

const LOAN_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  purchase: { bg: "#dbeafe", text: "#1d4ed8" },
  refinance: { bg: "#fef3c7", text: "#92400e" },
  va: { bg: "#d1fae5", text: "#065f46" },
  fha: { bg: "#e0e7ff", text: "#3730a3" },
  jumbo: { bg: "#fce7f3", text: "#9d174d" },
};

function getLoanTypeColor(loanType: string): { bg: string; text: string } {
  return LOAN_TYPE_COLORS[loanType.toLowerCase().trim()] ?? { bg: "#f3f4f6", text: "#6b7280" };
}

const SOURCE_LABELS: Record<string, string> = {
  google: "Google",
  zillow: "Zillow",
  internal: "RepWell",
};

const SOURCE_ICONS: Record<string, { bg: string; letter: string }> = {
  google: { bg: "#4285f4", letter: "G" },
  zillow: { bg: "#006aff", letter: "Z" },
  internal: { bg: "#52796f", letter: "R" },
};

// ── Stars Component ──────────────────────────────────────────────────

function StarRating({ rating, filledColor, emptyColor }: {
  rating: number;
  filledColor: string;
  emptyColor: string;
}) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={16}
          fill={i < rating ? filledColor : "none"}
          stroke={i < rating ? filledColor : emptyColor}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function SmallStarRating({ rating, filledColor, emptyColor }: {
  rating: number;
  filledColor: string;
  emptyColor: string;
}) {
  return (
    <div className="flex gap-px" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={12}
          fill={i < Math.round(rating) ? filledColor : "none"}
          stroke={i < Math.round(rating) ? filledColor : emptyColor}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

// ── Organization Header ──────────────────────────────────────────────

function OrgHeader({ profile, starFilled, starEmpty }: {
  profile: OrgProfile;
  starFilled: string;
  starEmpty: string;
}) {
  return (
    <div className="flex items-center gap-4 pb-4 mb-4" style={{ borderBottom: "1px solid var(--rw-border, #e5e7eb)" }}>
      {profile.logo_url ? (
        <img
          src={profile.logo_url}
          alt={profile.organization_name ?? "Organization"}
          className="w-14 h-14 rounded-lg object-contain flex-shrink-0"
          style={{ background: "#f9fafb" }}
        />
      ) : (
        <div
          className="w-14 h-14 rounded-lg flex items-center justify-center text-white font-semibold text-lg flex-shrink-0"
          style={{ background: "var(--rw-primary, #52796f)" }}
        >
          {getInitials(profile.organization_name)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        {profile.organization_name && (
          <div className="text-lg font-bold" style={{ color: "var(--rw-text, #1a1a2e)" }}>
            {profile.organization_name}
          </div>
        )}
        {profile.average_rating != null && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold" style={{ color: "var(--rw-text, #1a1a2e)" }}>
              {profile.average_rating.toFixed(1)}
            </span>
            <StarRating
              rating={Math.round(profile.average_rating)}
              filledColor={starFilled}
              emptyColor={starEmpty}
            />
            {profile.total_reviews != null && (
              <span className="text-[13px] text-gray-500">
                {profile.total_reviews} review{profile.total_reviews === 1 ? "" : "s"}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Rating Distribution ──────────────────────────────────────────────

function RatingDistributionChart({ distribution, totalReviews, starFilled, starEmpty }: {
  distribution: RatingDistribution;
  totalReviews: number;
  starFilled: string;
  starEmpty: string;
}) {
  return (
    <div
      className="mb-4 p-4 rounded-lg"
      style={{ background: "#f9fafb", border: "1px solid var(--rw-border, #e5e7eb)" }}
      role="figure"
      aria-label="Rating distribution"
    >
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[star as keyof RatingDistribution] ?? 0;
        const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        return (
          <div key={star} className="flex items-center gap-2 mb-1.5 last:mb-0">
            <div className="flex items-center gap-0.5 min-w-[28px] justify-end text-[13px] font-medium" style={{ color: "var(--rw-text, #1a1a2e)" }}>
              {star}
              <Star size={12} fill={starFilled} stroke={starFilled} />
            </div>
            <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
              <div
                className="h-full rounded transition-all"
                style={{ width: `${pct}%`, background: "var(--rw-primary, #52796f)" }}
              />
            </div>
            <span className="text-xs text-gray-500 min-w-[24px] text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Source Breakdown ─────────────────────────────────────────────────

function SourceBreakdownSection({ sources, starFilled, starEmpty }: {
  sources: SourceBreakdown[];
  starFilled: string;
  starEmpty: string;
}) {
  return (
    <div className="mb-4 p-4 rounded-lg" style={{ border: "1px solid var(--rw-border, #e5e7eb)" }}>
      <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--rw-text, #1a1a2e)" }}>
        Reviews by Source
      </h4>
      <div className="flex flex-col gap-2.5">
        {sources.map((src) => {
          const iconData = SOURCE_ICONS[src.source] ?? { bg: "#6b7280", letter: src.source[0]?.toUpperCase() ?? "?" };
          return (
            <div key={src.source} className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: iconData.bg }}
              >
                {iconData.letter}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-[13px] font-semibold" style={{ color: "var(--rw-text, #1a1a2e)" }}>
                  {SOURCE_LABELS[src.source] ?? src.source}
                </span>
                <span className="text-[11px] text-gray-400">
                  {src.count} reviews &middot; {src.average.toFixed(1)} avg
                </span>
              </div>
              <SmallStarRating rating={src.average} filledColor={starFilled} emptyColor={starEmpty} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Review Card ──────────────────────────────────────────────────────

function ReviewCard({ review, content, starFilled, starEmpty }: {
  review: PreviewReview;
  content: WidgetContent;
  starFilled: string;
  starEmpty: string;
}) {
  const cardStyle = content.cardStyle ?? "bordered";
  const dateFormat = content.dateFormat ?? "relative";
  const truncLen = content.truncateLength ?? 300;

  const cardClasses = [
    "p-4 rounded-lg transition-shadow",
    cardStyle === "bordered" && "border border-gray-200 bg-white",
    cardStyle === "shadow" && "bg-white shadow-sm hover:shadow-md",
    cardStyle === "flat" && "bg-gray-50",
  ].filter(Boolean).join(" ");

  return (
    <article className={cardClasses} tabIndex={0}>
      <div className="flex items-center gap-2.5 mb-2">
        {content.showAvatar !== false && (
          review.avatar_url ? (
            <img
              src={review.avatar_url}
              alt={review.reviewer_name ?? "Reviewer"}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0 bg-gray-200"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-500 flex-shrink-0">
              {getInitials(review.reviewer_name)}
            </div>
          )
        )}
        <div className="flex-1 min-w-0">
          {review.reviewer_name && (
            <span className="block text-sm font-semibold truncate">{review.reviewer_name}</span>
          )}
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
          <span className="text-[11px] text-gray-400 capitalize">
            via {SOURCE_LABELS[review.source] ?? review.source}
          </span>
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

// ── Sort Controls ────────────────────────────────────────────────────

type SortOption = "newest" | "highest" | "lowest";

function SortControls({ activeSort, onSort }: {
  activeSort: SortOption;
  onSort: (sort: SortOption) => void;
}) {
  const options: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Most Recent" },
    { value: "highest", label: "Highest Rated" },
    { value: "lowest", label: "Lowest Rated" },
  ];

  return (
    <div className="flex gap-1.5 mb-3 flex-wrap" role="toolbar" aria-label="Sort reviews">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`px-3.5 py-1.5 text-[13px] font-medium rounded-full border transition-all ${
            opt.value === activeSort
              ? "text-white border-transparent"
              : "text-gray-500 bg-gray-100 border-gray-200 hover:border-[var(--rw-primary,#52796f)] hover:text-[var(--rw-primary,#52796f)]"
          }`}
          style={opt.value === activeSort ? { background: "var(--rw-primary, #52796f)", borderColor: "var(--rw-primary, #52796f)" } : undefined}
          aria-pressed={opt.value === activeSort}
          onClick={() => onSort(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Main Preview Component ──────────────────────────────────────────

export function CompanyReviewPreview({
  profile,
  reviews,
  content = {},
  colors = {},
  maxWidth,
  borderRadius,
}: CompanyReviewPreviewProps) {
  const starFilled = colors.starFilled ?? "#f59e0b";
  const starEmpty = colors.starEmpty ?? "#d1d5db";
  const columns = content.columns ?? 1;
  const perPage = content.reviewsPerPage ?? 10;

  const [activeSort, setActiveSort] = useState<SortOption>("newest");
  const [visibleCount, setVisibleCount] = useState(perPage);

  const sortedReviews = useCallback(() => {
    const sorted = [...reviews];
    switch (activeSort) {
      case "newest":
        sorted.sort((a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime());
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

  const handleSort = (sort: SortOption) => {
    setActiveSort(sort);
    setVisibleCount(perPage);
  };

  const displayReviews = sortedReviews().slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;

  const containerStyle: React.CSSProperties = {
    "--rw-primary": colors.primary ?? "#52796f",
    "--rw-bg": colors.background ?? "#ffffff",
    "--rw-text": colors.text ?? "#1a1a2e",
    "--rw-border": colors.border ?? "#e5e7eb",
    maxWidth: maxWidth ?? "100%",
    borderRadius: borderRadius ?? "8px",
    padding: "16px",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
    background: colors.background ?? "#ffffff",
    color: colors.text ?? "#1a1a2e",
  } as React.CSSProperties;

  return (
    <div
      className="text-sm leading-normal antialiased"
      style={containerStyle}
      role="region"
      aria-label={content.headerText ?? `Reviews for ${profile?.organization_name ?? "Organization"}`}
    >
      {/* Organization Header */}
      {profile && content.showHeader !== false && (
        <OrgHeader profile={profile} starFilled={starFilled} starEmpty={starEmpty} />
      )}

      {/* Rating Distribution */}
      {content.showRatingDistribution !== false && profile?.rating_distribution && profile.total_reviews ? (
        <RatingDistributionChart
          distribution={profile.rating_distribution}
          totalReviews={profile.total_reviews}
          starFilled={starFilled}
          starEmpty={starEmpty}
        />
      ) : null}

      {/* Source Breakdown */}
      {content.showSourceBreakdown !== false && profile?.source_breakdown && profile.source_breakdown.length > 0 && (
        <SourceBreakdownSection
          sources={profile.source_breakdown}
          starFilled={starFilled}
          starEmpty={starEmpty}
        />
      )}

      {/* Sort Controls */}
      {content.showFilters && reviews.length > 0 && (
        <SortControls activeSort={activeSort} onSort={handleSort} />
      )}

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">No reviews yet.</div>
      ) : (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: columns > 1 ? `repeat(${columns}, 1fr)` : "1fr" }}
        >
          {displayReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              content={content}
              starFilled={starFilled}
              starEmpty={starEmpty}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <button
          type="button"
          className="w-full mt-4 px-6 py-2.5 text-sm font-medium rounded-md border transition-colors"
          style={{
            color: "var(--rw-primary, #52796f)",
            borderColor: "var(--rw-primary, #52796f)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.primary ?? "#52796f";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = colors.primary ?? "#52796f";
          }}
          onClick={() => setVisibleCount((c) => Math.min(c + perPage, reviews.length))}
        >
          Load More Reviews
        </button>
      )}

      {/* Actions */}
      {(content.showCTA || content.showWriteReview) && (
        <div className="flex flex-wrap gap-2 mt-4">
          {content.showCTA && content.ctaText && content.ctaUrl && (
            <a
              href={content.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-5 py-2.5 text-sm font-medium text-white rounded-md no-underline transition-opacity hover:opacity-90"
              style={{ background: colors.primary ?? "#52796f" }}
            >
              {content.ctaText}
            </a>
          )}
          {content.showWriteReview && content.writeReviewUrl && (
            <a
              href={content.writeReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 text-[13px] font-medium rounded-md no-underline transition-colors border hover:text-white"
              style={{ color: colors.primary ?? "#52796f", borderColor: colors.primary ?? "#52796f" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.primary ?? "#52796f";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = colors.primary ?? "#52796f";
              }}
            >
              Write a Review
            </a>
          )}
        </div>
      )}

      {/* Disclaimer */}
      {content.showDisclaimer && (
        <div className="flex items-center gap-2 mt-3 p-2 text-[10px] leading-snug text-gray-500 bg-gray-50 rounded">
          <Home size={18} className="flex-shrink-0 text-gray-400" />
          <span>
            {content.disclaimerText ?? "Equal Housing Lender. NMLS Consumer Access: www.nmlsconsumeraccess.org"}
          </span>
        </div>
      )}

      {/* Branding */}
      {content.showBranding !== false && (
        <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-400 text-center">
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
