"use client";

import { Star, Home, ExternalLink } from "lucide-react";
import {
  type WidgetThemeColors,
  type WidgetContent,
  type PreviewReview,
  getInitials,
  truncateText,
  formatDate,
  getPreviewBodyStyle,
  getPreviewBodyTextStyle,
  getPreviewHeadingStyle,
  getPreviewMetaStyle,
  previewT,
  DEFAULT_STAR_FILLED,
  DEFAULT_STAR_EMPTY,
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
 * Dashboard preview component for the Pro Review Widget.
 * Mirrors the embed.js renderer output using React for WYSIWYG editing.
 */

// ── Component-specific types ─────────────────────────────────────────

interface EntityProfile {
  full_name: string | null;
  avatar_url: string | null;
  photo_url: string | null;
  nmls_id: string | null;
  title: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  licensing_states: string[] | null;
}

interface ProReviewPreviewProps {
  profile: EntityProfile | null;
  reviews: PreviewReview[];
  content?: WidgetContent;
  colors?: WidgetThemeColors;
  layout?: WidgetThemeLayout;
}

// ── Stars Component ──────────────────────────────────────────────────

function StarRating({
  rating,
  filledColor,
  emptyColor,
  lang,
}: {
  rating: number;
  filledColor: string;
  emptyColor: string;
  lang?: string;
}) {
  return (
    <div
      className="flex gap-0.5"
      role="img"
      aria-label={previewT(lang, "starsAriaLabel", { rating })}
    >
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

// ── Profile Header ──────────────────────────────────────────────────

function ProfileHeader({
  profile,
  content,
  starFilled,
  starEmpty,
}: {
  profile: EntityProfile;
  content: WidgetContent;
  starFilled: string;
  starEmpty: string;
}) {
  const lang = content.language;
  return (
    <div
      className="flex items-center gap-4 pb-4 mb-4"
      style={{ borderBottom: "1px solid var(--rw-border, #e5e7eb)" }}
    >
      {/* Photo or initials */}
      {profile.photo_url || profile.avatar_url ? (
        <img
          src={profile.photo_url ?? profile.avatar_url!}
          alt={profile.full_name ?? "Professional"}
          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
          style={{ background: "var(--rw-surface-strong, #e5e7eb)" }}
        />
      ) : (
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-xl flex-shrink-0"
          style={{ background: "var(--rw-primary, #52796f)" }}
        >
          {getInitials(profile.full_name)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        {profile.full_name && (
          <div
            className="text-lg font-bold"
            style={getPreviewHeadingStyle()}
          >
            {profile.full_name}
          </div>
        )}

        {profile.title && (
          <div className="text-[13px] text-gray-500 mb-1" style={getPreviewMetaStyle()}>
            {profile.title}
          </div>
        )}

        {/* NMLS is mandatory for Pro widgets per SAFE Act */}
        {profile.nmls_id && (
          <a
            href={`https://www.nmlsconsumeraccess.org/EntityDetails.aspx/INDIVIDUAL/${encodeURIComponent(profile.nmls_id)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[var(--rw-primary,#52796f)] transition-colors no-underline hover:underline"
            style={getPreviewMetaStyle()}
          >
            NMLS# {profile.nmls_id}
            <ExternalLink size={10} />
          </a>
        )}

        {profile.licensing_states && profile.licensing_states.length > 0 && (
          <div className="text-xs text-gray-500 mt-1" style={getPreviewMetaStyle()}>
            {previewT(lang, "licensedIn")} {profile.licensing_states.join(", ")}
          </div>
        )}

        {profile.average_rating != null && profile.total_reviews != null && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <span
              className="text-base font-bold"
              style={getPreviewBodyStyle("var(--rw-text, #1a1a2e)")}
            >
              {profile.average_rating.toFixed(1)}
            </span>
            <StarRating
              rating={Math.round(profile.average_rating)}
              filledColor={starFilled}
              emptyColor={starEmpty}
              lang={lang}
            />
            <span className="text-xs text-gray-400" style={getPreviewMetaStyle("#9ca3af")}>
              ({profile.total_reviews}{" "}
              {previewT(lang, profile.total_reviews === 1 ? "review" : "reviews")})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Review Card ──────────────────────────────────────────────────────

function ReviewCard({
  review,
  content,
  cardStyle,
  starFilled,
  starEmpty,
  accentColor,
  layout,
}: {
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
      {/* Top: avatar + name + date */}
      <div className="flex items-center gap-2.5 mb-2">
        {content.showAvatar !== false && (
          <>
            {review.avatar_url ? (
              <img
                src={review.avatar_url}
                alt={review.reviewer_name ?? "Reviewer"}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0 bg-gray-200"
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
            )}
          </>
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

      {/* Stars */}
      <div className="mb-2">
        <StarRating
          rating={review.rating}
          filledColor={starFilled}
          emptyColor={starEmpty}
          lang={lang}
        />
      </div>

      {/* Text */}
      {review.text && (
        <p className="text-sm leading-relaxed text-gray-700" style={getPreviewBodyTextStyle()}>
          {truncLen > 0 ? truncateText(review.text, truncLen) : review.text}
        </p>
      )}

      {/* Tags: source, loan type, FTHB */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {content.showSource !== false && review.source && (
          <SourceBadge source={review.source} lang={lang} />
        )}

      </div>
    </article>
  );
}

// ── Main Preview Component ──────────────────────────────────────────

export function ProReviewPreview({
  profile,
  reviews,
  content = {},
  colors = {},
  layout,
}: ProReviewPreviewProps) {
  const lang = content.language;
  const starFilled = colors.starFilled ?? DEFAULT_STAR_FILLED;
  const starEmpty = colors.starEmpty ?? DEFAULT_STAR_EMPTY;
  const accentColor = colors.accent ?? colors.primary ?? DEFAULT_STAR_FILLED;
  const columns = content.columns ?? 1;
  const cardStyle = resolvePreviewCardStyle(layout?.cardStyle, content.cardStyle);
  const containerStyle = getPreviewContainerStyle(colors, layout);

  return (
    <div
      className="text-sm leading-normal antialiased"
      style={containerStyle}
      role="region"
      aria-label={
        content.headerText ??
        previewT(lang, "reviewsFor", { name: profile?.full_name ?? "Professional" })
      }
    >
      {/* Pro Profile */}
      {profile && (
        <ProfileHeader
          profile={profile}
          content={content}
          starFilled={starFilled}
          starEmpty={starEmpty}
        />
      )}

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div
          className="py-8 text-center text-sm"
          style={{ color: "var(--rw-text-subtle, #9ca3af)" }}
        >
          {previewT(lang, "noReviewsYet")}
        </div>
      ) : (
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns:
              columns > 1 ? `repeat(${columns}, 1fr)` : "1fr",
          }}
        >
          {reviews.map((review) => (
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

      {/* Actions row */}
      {(content.showCTA || content.showWriteReview) && (
        <div className="flex flex-wrap gap-2 mt-4">
          {content.showCTA && content.ctaText && content.ctaUrl && (
            <a
              href={content.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-5 py-2.5 text-sm font-medium text-white rounded-md no-underline transition-opacity hover:opacity-90"
              style={{
                background: colors.primary ?? "#52796f",
              }}
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
              style={{
                color: colors.primary ?? "#52796f",
                borderColor: colors.primary ?? "#52796f",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.background = colors.primary ?? "#52796f";
                el.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.background = "transparent";
                el.style.color = colors.primary ?? "#52796f";
              }}
            >
              {previewT(lang, "writeReview")}
            </a>
          )}
        </div>
      )}

      {/* Equal Housing Lender disclaimer */}
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
            {content.disclaimerText ||
              previewT(lang, "defaultDisclaimer")}
          </p>
          <a
            href="https://www.nmlsconsumeraccess.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] no-underline hover:underline"
            style={{ color: "var(--rw-primary, #52796f)" }}
          >
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
