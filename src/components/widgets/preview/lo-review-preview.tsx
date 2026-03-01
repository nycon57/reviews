"use client";

import { Star, Home, ExternalLink } from "lucide-react";
import {
  type WidgetThemeColors,
  type WidgetContent,
  type PreviewReview,
  getInitials,
  truncateText,
  formatDate,
  getLoanTypeColor,
  SOURCE_LABELS,
  DEFAULT_STAR_FILLED,
  DEFAULT_STAR_EMPTY,
} from "./shared";

/**
 * Dashboard preview component for the LO Review Widget.
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

interface LOReviewPreviewProps {
  profile: EntityProfile | null;
  reviews: PreviewReview[];
  content?: WidgetContent;
  colors?: WidgetThemeColors;
  maxWidth?: string;
  borderRadius?: string;
}

// ── Stars Component ──────────────────────────────────────────────────

function StarRating({
  rating,
  filledColor,
  emptyColor,
}: {
  rating: number;
  filledColor: string;
  emptyColor: string;
}) {
  return (
    <div
      className="flex gap-0.5"
      role="img"
      aria-label={`${rating} out of 5 stars`}
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
          style={{ background: "#e5e7eb" }}
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
            style={{ color: "var(--rw-text, #1a1a2e)" }}
          >
            {profile.full_name}
          </div>
        )}

        {profile.title && (
          <div className="text-[13px] text-gray-500 mb-1">{profile.title}</div>
        )}

        {/* NMLS is mandatory for LO widgets per SAFE Act */}
        {profile.nmls_id && (
          <a
            href={`https://www.nmlsconsumeraccess.org/EntityDetails.aspx/INDIVIDUAL/${encodeURIComponent(profile.nmls_id)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[var(--rw-primary,#52796f)] transition-colors no-underline hover:underline"
          >
            NMLS# {profile.nmls_id}
            <ExternalLink size={10} />
          </a>
        )}

        {profile.licensing_states && profile.licensing_states.length > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            Licensed in {profile.licensing_states.join(", ")}
          </div>
        )}

        {profile.average_rating != null && profile.total_reviews != null && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <span
              className="text-base font-bold"
              style={{ color: "var(--rw-text, #1a1a2e)" }}
            >
              {profile.average_rating.toFixed(1)}
            </span>
            <StarRating
              rating={Math.round(profile.average_rating)}
              filledColor={starFilled}
              emptyColor={starEmpty}
            />
            <span className="text-xs text-gray-400">
              ({profile.total_reviews}{" "}
              {profile.total_reviews === 1 ? "review" : "reviews"})
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
  starFilled,
  starEmpty,
}: {
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
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={cardClasses} tabIndex={0}>
      {/* Top: avatar + name + date */}
      <div className="flex items-center gap-2.5 mb-2">
        {content.showAvatar !== false && (
          <>
            {review.avatar_url ? (
              <img
                src={review.avatar_url}
                alt={review.reviewer_name ?? "Reviewer"}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0 bg-gray-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-500 flex-shrink-0">
                {getInitials(review.reviewer_name)}
              </div>
            )}
          </>
        )}

        <div className="flex-1 min-w-0">
          {review.reviewer_name && (
            <span className="block text-sm font-semibold truncate">
              {review.reviewer_name}
            </span>
          )}
          {content.showDate !== false && review.review_date && (
            <span className="block text-xs text-gray-400">
              {formatDate(review.review_date, dateFormat)}
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
        />
      </div>

      {/* Text */}
      {review.text && (
        <p className="text-sm leading-relaxed text-gray-700">
          {truncLen > 0 ? truncateText(review.text, truncLen) : review.text}
        </p>
      )}

      {/* Tags: source, loan type, FTHB */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {content.showSource !== false && review.source && (
          <span className="text-[11px] text-gray-400 capitalize">
            via {SOURCE_LABELS[review.source] ?? review.source}
          </span>
        )}

        {review.loan_type && (
          <span
            className="inline-block px-2 py-0.5 text-[11px] font-medium rounded"
            style={{
              background: getLoanTypeColor(review.loan_type).bg,
              color: getLoanTypeColor(review.loan_type).text,
            }}
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

export function LOReviewPreview({
  profile,
  reviews,
  content = {},
  colors = {},
  maxWidth,
  borderRadius,
}: LOReviewPreviewProps) {
  const starFilled = colors.starFilled ?? DEFAULT_STAR_FILLED;
  const starEmpty = colors.starEmpty ?? DEFAULT_STAR_EMPTY;
  const columns = content.columns ?? 1;

  const containerStyle: React.CSSProperties = {
    "--rw-primary": colors.primary ?? "#52796f",
    "--rw-bg": colors.background ?? "#ffffff",
    "--rw-text": colors.text ?? "#1a1a2e",
    "--rw-border": colors.border ?? "#e5e7eb",
    maxWidth: maxWidth ?? "100%",
    borderRadius: borderRadius ?? "8px",
    padding: "16px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
    background: colors.background ?? "#ffffff",
    color: colors.text ?? "#1a1a2e",
  } as React.CSSProperties;

  return (
    <div
      className="text-sm leading-normal antialiased"
      style={containerStyle}
      role="region"
      aria-label={
        content.headerText ??
        `Reviews for ${profile?.full_name ?? "Professional"}`
      }
    >
      {/* LO Profile */}
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
        <div className="py-8 text-center text-gray-400 text-sm">
          No reviews yet.
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
              starFilled={starFilled}
              starEmpty={starEmpty}
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
              Write a Review
            </a>
          )}
        </div>
      )}

      {/* Equal Housing Lender disclaimer */}
      {content.showDisclaimer && (
        <div className="mt-3 p-2.5 bg-gray-50 rounded border border-gray-100">
          <div className="flex items-center gap-1.5 mb-1">
            <Home size={16} className="flex-shrink-0 text-gray-500" />
            <span className="text-[11px] font-semibold text-gray-600">Equal Housing Lender</span>
          </div>
          <p className="text-[10px] leading-snug text-gray-500 mb-1">
            {content.disclaimerText ||
              "This is not a commitment to lend. Programs, rates, terms, and conditions are subject to change without notice."}
          </p>
          <a
            href="https://www.nmlsconsumeraccess.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] no-underline hover:underline"
            style={{ color: "var(--rw-primary, #52796f)" }}
          >
            NMLS Consumer Access
          </a>
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
