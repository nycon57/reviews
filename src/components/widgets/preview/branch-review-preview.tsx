"use client";

import { useState, useCallback } from "react";
import { Star, Home, MapPin, Phone } from "lucide-react";
import {
  type WidgetThemeColors,
  type WidgetContent,
  type PreviewReview,
  type RatingDistribution,
  type SourceBreakdown,
  DEFAULT_STAR_FILLED,
  DEFAULT_STAR_EMPTY,
  SOURCE_LABELS,
  SOURCE_ICONS,
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
 * Dashboard preview component for the Branch Review Widget.
 * Mirrors the embed.js renderer output using React for WYSIWYG editing.
 */

// ── Types ────────────────────────────────────────────────────────────

interface TeamMember {
  id: string;
  full_name: string | null;
  photo_url: string | null;
  title: string | null;
  nmls_id: string | null;
  average_rating: number | null;
  total_reviews: number | null;
}

interface BranchProfile {
  organization_name: string | null;
  logo_url: string | null;
  photo_url?: string | null;
  nmls_id?: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  rating_distribution: RatingDistribution | null;
  source_breakdown: SourceBreakdown[] | null;
  address?: {
    street?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
  } | null;
  telephone?: string | null;
  team_members?: TeamMember[] | null;
}

interface BranchReviewPreviewProps {
  profile: BranchProfile | null;
  reviews: PreviewReview[];
  content?: WidgetContent;
  colors?: WidgetThemeColors;
  initialSort?: SortOption;
  layout?: WidgetThemeLayout;
}

// ── Helpers ──────────────────────────────────────────────────────────

function formatAddress(addr: BranchProfile["address"]): string | null {
  if (!addr) return null;
  const parts: string[] = [];
  if (addr.street) parts.push(addr.street);
  const cityState: string[] = [];
  if (addr.city) cityState.push(addr.city);
  if (addr.state) cityState.push(addr.state);
  if (cityState.length > 0) {
    let line = cityState.join(", ");
    if (addr.zip) line += ` ${addr.zip}`;
    parts.push(line);
  } else if (addr.zip) {
    parts.push(addr.zip);
  }
  return parts.length > 0 ? parts.join(", ") : null;
}

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits[0] === "1") return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return phone;
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

// ── Branch Header ────────────────────────────────────────────────────

function BranchHeader({ profile, starFilled, starEmpty, lang }: {
  profile: BranchProfile;
  starFilled: string;
  starEmpty: string;
  lang?: string;
}) {
  const addressStr = formatAddress(profile.address);

  return (
    <div className="flex items-start gap-4 pb-4 mb-4" style={{ borderBottom: "1px solid var(--rw-border, #e5e7eb)" }}>
      {(profile.logo_url ?? profile.photo_url) ? (
        <img
          src={(profile.logo_url ?? profile.photo_url)!}
          alt={profile.organization_name ?? "Branch"}
          className="w-14 h-14 rounded-lg object-contain flex-shrink-0"
          style={{ background: "var(--rw-surface-muted, #f9fafb)" }}
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
          <div className="text-lg font-bold" style={getPreviewHeadingStyle()}>
            {profile.organization_name}
          </div>
        )}
        {addressStr && (
          <div
            className="flex items-center gap-1.5 text-[13px] text-gray-500 mt-0.5"
            style={getPreviewMetaStyle()}
          >
            <MapPin size={12} className="flex-shrink-0" />
            {addressStr}
          </div>
        )}
        {profile.telephone && (
          <div className="flex items-center gap-1.5 text-[13px] mt-0.5" style={getPreviewMetaStyle()}>
            <Phone size={12} className="flex-shrink-0 text-gray-400" />
            <a href={`tel:${profile.telephone}`} className="no-underline hover:underline" style={{ color: "var(--rw-primary, #52796f)" }}>
              {formatPhoneDisplay(profile.telephone)}
            </a>
          </div>
        )}
        {profile.nmls_id && (
          <div className="text-xs text-gray-500 mt-0.5" style={getPreviewMetaStyle()}>
            NMLS#{" "}
            <a
              href={`https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/${encodeURIComponent(profile.nmls_id)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline hover:underline"
              style={{ color: "var(--rw-primary, #52796f)" }}
            >
              {profile.nmls_id}
            </a>
          </div>
        )}
        {profile.average_rating != null && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold" style={{ color: "var(--rw-text, #1a1a2e)" }}>
              {profile.average_rating.toFixed(1)}
            </span>
            <StarRating rating={profile.average_rating} filledColor={starFilled} emptyColor={starEmpty} lang={lang} />
            {profile.total_reviews != null && (
              <span className="text-[13px] text-gray-500" style={getPreviewMetaStyle()}>
                {profile.total_reviews} {previewT(lang, profile.total_reviews === 1 ? "review" : "reviews")}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Rating Distribution ──────────────────────────────────────────────

function RatingDistributionChart({ distribution, totalReviews, starFilled, lang }: {
  distribution: RatingDistribution;
  totalReviews: number;
  starFilled: string;
  lang?: string;
}) {
  return (
    <div
      className="mb-4 p-4 rounded-lg"
      style={{
        background: "var(--rw-surface-muted, #f9fafb)",
        border: "1px solid var(--rw-border, #e5e7eb)",
      }}
      role="figure"
      aria-label={previewT(lang, "ratingDistribution")}
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
            <div
              className="flex-1 h-2 rounded overflow-hidden"
              style={{ background: "var(--rw-surface-strong, #e5e7eb)" }}
            >
              <div className="h-full rounded transition-all" style={{ width: `${pct}%`, background: "var(--rw-primary, #52796f)" }} />
            </div>
            <span
              className="text-xs text-gray-500 min-w-[24px] text-right"
              style={getPreviewMetaStyle()}
            >
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Source Breakdown ─────────────────────────────────────────────────

function SourceBreakdownSection({ sources, starFilled, starEmpty, lang }: {
  sources: SourceBreakdown[];
  starFilled: string;
  starEmpty: string;
  lang?: string;
}) {
  return (
    <div className="mb-4 p-4 rounded-lg" style={{ border: "1px solid var(--rw-border, #e5e7eb)" }}>
      <h4 className="text-sm font-semibold mb-3" style={getPreviewHeadingStyle()}>{previewT(lang, "reviewsBySource")}</h4>
      <div className="flex flex-col gap-2.5">
        {sources.map((src) => {
          const iconData = SOURCE_ICONS[src.source] ?? { bg: "#6b7280", letter: src.source[0]?.toUpperCase() ?? "?" };
          return (
            <div key={src.source} className="flex items-center gap-2.5">
              {iconData.icon ? (
                <img
                  src={iconData.icon}
                  alt={SOURCE_LABELS[src.source] ?? src.source}
                  className="w-8 h-8 rounded-md object-contain flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: iconData.bg }}>
                  {iconData.letter}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span
                  className="block text-[13px] font-semibold"
                  style={getPreviewBodyStyle("var(--rw-text, #1a1a2e)")}
                >
                  {SOURCE_LABELS[src.source] ?? src.source}
                </span>
                <span className="text-[11px] text-gray-400" style={getPreviewMetaStyle("#9ca3af", 0.79)}>
                  {src.count} {previewT(lang, "reviews")} &middot; {src.average.toFixed(1)} {previewT(lang, "avgSuffix")}
                </span>
              </div>
              <StarRating rating={src.average} filledColor={starFilled} emptyColor={starEmpty} size={12} lang={lang} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Team Member Grid ─────────────────────────────────────────────────

function TeamMemberGrid({ members, starFilled, starEmpty, lang }: {
  members: TeamMember[];
  starFilled: string;
  starEmpty: string;
  lang?: string;
}) {
  return (
    <div className="mb-4 p-4 rounded-lg" style={{ border: "1px solid var(--rw-border, #e5e7eb)" }}>
      <h4 className="text-sm font-semibold mb-3" style={getPreviewHeadingStyle()}>{previewT(lang, "ourTeam")}</h4>
      <div className="grid grid-cols-3 gap-3 max-[768px]:grid-cols-2 max-[480px]:grid-cols-1">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex flex-col items-center text-center p-3 rounded-lg transition-shadow hover:shadow-sm"
            style={{ background: "var(--rw-surface-muted, #f9fafb)" }}
          >
            {member.photo_url ? (
              <img
                src={member.photo_url}
                alt={member.full_name ?? "Team member"}
                className="w-12 h-12 rounded-full object-cover mb-2"
                style={{ background: "var(--rw-surface-strong, #e5e7eb)" }}
              />
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold mb-2" style={{ background: "var(--rw-primary, #52796f)", fontSize: "16px" }}>
                {getInitials(member.full_name)}
              </div>
            )}
            {member.full_name && (
              <div
                className="text-[13px] font-semibold truncate w-full"
                style={getPreviewBodyStyle("var(--rw-text, #1a1a2e)")}
              >
                {member.full_name}
              </div>
            )}
            {member.title && (
              <div className="text-[11px] text-gray-400 truncate w-full" style={getPreviewMetaStyle("#9ca3af", 0.79)}>
                {member.title}
              </div>
            )}
            {member.average_rating != null && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs font-semibold" style={{ color: "var(--rw-text, #1a1a2e)" }}>
                  {member.average_rating.toFixed(1)}
                </span>
                <StarRating rating={member.average_rating} filledColor={starFilled} emptyColor={starEmpty} size={10} lang={lang} />
                {member.total_reviews != null && (
                  <span className="text-[11px] text-gray-400">({member.total_reviews})</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Review Card ──────────────────────────────────────────────────────

function ReviewCard({ review, content, cardStyle, starFilled, starEmpty, accentColor, layout }: {
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
  const truncLen = content.truncateLength ?? 300;
  const featured = !!review.featured;

  const cardClasses = getPreviewCardClasses(
    cardStyle,
    "p-4 transition-shadow",
  );

  let inlineStyle = getPreviewCardStyle(cardStyle, layout);
  if (featured) {
    inlineStyle = applyFeaturedStyle(inlineStyle, accentColor);
  }

  return (
    <article
      className={cardClasses}
      style={inlineStyle}
      tabIndex={0}
    >
      <div className="flex items-center gap-2.5 mb-2">
        {content.showAvatar !== false && (
          review.avatar_url ? (
            <img
              src={review.avatar_url}
              alt={review.reviewer_name ?? "Reviewer"}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              style={{ background: "var(--rw-surface-strong, #e5e7eb)" }}
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
              style={{
                background: "var(--rw-surface-strong, #e5e7eb)",
                color: "var(--rw-text-muted, #6b7280)",
              }}
            >
              {getInitials(review.reviewer_name)}
            </div>
          )
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

// ── Sort Controls ────────────────────────────────────────────────────

type SortOption = "featured" | "newest" | "oldest" | "highest" | "lowest";

function SortControls({ activeSort, onSort, lang }: {
  activeSort: SortOption;
  onSort: (sort: SortOption) => void;
  lang?: string;
}) {
  const options: { value: SortOption; label: string }[] = [
    { value: "newest", label: previewT(lang, "mostRecent") },
    { value: "oldest", label: previewT(lang, "oldest") },
    { value: "highest", label: previewT(lang, "highestRated") },
    { value: "lowest", label: previewT(lang, "lowestRated") },
  ];

  return (
    <div className="flex gap-1.5 mb-3 flex-wrap" role="toolbar" aria-label={previewT(lang, "sortReviews")}>
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

export function BranchReviewPreview({
  profile,
  reviews,
  content = {},
  colors = {},
  initialSort = "newest",
  layout,
}: BranchReviewPreviewProps) {
  const lang = content.language;
  const starFilled = colors.starFilled ?? DEFAULT_STAR_FILLED;
  const starEmpty = colors.starEmpty ?? DEFAULT_STAR_EMPTY;
  const accentColor = colors.accent ?? colors.primary ?? DEFAULT_STAR_FILLED;
  const columns = content.columns ?? 1;
  const perPage = content.reviewsPerPage ?? 10;

  const [activeSort, setActiveSort] = useState<SortOption>(initialSort);
  const [visibleCount, setVisibleCount] = useState(perPage);

  const sortedReviews = useCallback(() => {
    const sorted = [...reviews];
    switch (activeSort) {
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

  const handleSort = (sort: SortOption) => {
    setActiveSort(sort);
    setVisibleCount(perPage);
  };

  const displayReviews = sortedReviews().slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;

  const cardStyle = resolvePreviewCardStyle(layout?.cardStyle, content.cardStyle);
  const containerStyle = getPreviewContainerStyle(colors, layout);

  return (
    <div
      className="text-sm leading-normal antialiased"
      style={containerStyle}
      role="region"
      aria-label={content.headerText ?? previewT(lang, "reviewsFor", { name: profile?.organization_name ?? "Branch" })}
    >
      {/* Branch Header */}
      {profile && content.showHeader !== false && (
        <BranchHeader profile={profile} starFilled={starFilled} starEmpty={starEmpty} lang={lang} />
      )}

      {/* Rating Distribution */}
      {content.showRatingDistribution !== false && profile?.rating_distribution && profile.total_reviews ? (
        <RatingDistributionChart distribution={profile.rating_distribution} totalReviews={profile.total_reviews} starFilled={starFilled} lang={lang} />
      ) : null}

      {/* Source Breakdown */}
      {content.showSourceBreakdown !== false && profile?.source_breakdown && profile.source_breakdown.length > 0 && (
        <SourceBreakdownSection sources={profile.source_breakdown} starFilled={starFilled} starEmpty={starEmpty} lang={lang} />
      )}

      {/* Team Members */}
      {content.showTeam !== false && profile?.team_members && profile.team_members.length > 0 && (
        <TeamMemberGrid members={profile.team_members} starFilled={starFilled} starEmpty={starEmpty} lang={lang} />
      )}

      {/* Sort Controls */}
      {content.showFilters && reviews.length > 0 && (
        <SortControls activeSort={activeSort} onSort={handleSort} lang={lang} />
      )}

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div className="py-8 text-center">
          <div
            className="text-sm mb-3"
            style={{ color: "var(--rw-text-subtle, #9ca3af)" }}
          >
            {previewT(lang, "noReviewsBranch")}
          </div>
          {content.showWriteReview && content.writeReviewUrl && (
            <a
              href={content.writeReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-5 py-2 text-sm font-medium text-white rounded-md no-underline transition-opacity hover:opacity-90"
              style={{ background: colors.primary ?? "#52796f" }}
            >
              {previewT(lang, "beFirstReview")}
            </a>
          )}
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: columns > 1 ? `repeat(${columns}, 1fr)` : "1fr" }}>
          {displayReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              content={content}
              cardStyle={cardStyle}
              starFilled={starFilled}
              starEmpty={starEmpty}
              accentColor={accentColor}
              layout={layout}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <button
          type="button"
          className="w-full mt-4 px-6 py-2.5 text-sm font-medium rounded-md border transition-colors"
          style={{ color: "var(--rw-primary, #52796f)", borderColor: "var(--rw-primary, #52796f)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = colors.primary ?? "#52796f"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = colors.primary ?? "#52796f"; }}
          onClick={() => setVisibleCount((c) => Math.min(c + perPage, reviews.length))}
        >
          {previewT(lang, "loadMore")}
        </button>
      )}

      {/* Actions */}
      {(content.showCTA || content.showWriteReview) && reviews.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {content.showCTA && content.ctaText && content.ctaUrl && (
            <a href={content.ctaUrl} target="_blank" rel="noopener noreferrer" className="inline-block px-5 py-2.5 text-sm font-medium text-white rounded-md no-underline transition-opacity hover:opacity-90" style={{ background: colors.primary ?? "#52796f" }}>
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
              onMouseEnter={(e) => { e.currentTarget.style.background = colors.primary ?? "#52796f"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = colors.primary ?? "#52796f"; }}
            >
              {previewT(lang, "writeReview")}
            </a>
          )}
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
              style={{ color: "var(--rw-text, #1a1a2e)" }}
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
          <a href="https://www.nmlsconsumeraccess.org" target="_blank" rel="noopener noreferrer" className="text-[10px] no-underline hover:underline" style={{ color: "var(--rw-primary, #52796f)" }}>
            {previewT(lang, "nmlsConsumerAccess")}
          </a>
        </div>
      )}

      {/* Branding */}
      {content.showBranding !== false && (
        <div
          className="mt-4 pt-3 border-t text-[11px] text-center"
          style={{
            borderColor: "var(--rw-border-soft, var(--rw-border, #e5e7eb))",
            color: "var(--rw-text-subtle, #9ca3af)",
          }}
        >
          {previewT(lang, "poweredBy")}{" "}
          <a
            href="https://repwell.com"
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline hover:underline"
            style={{ color: "var(--rw-text-muted, #6b7280)" }}
          >
            RepWell
          </a>
        </div>
      )}
    </div>
  );
}
