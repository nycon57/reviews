"use client";

import { Star, Home, ExternalLink } from "lucide-react";

/**
 * Dashboard preview component for the LO Review Widget.
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
  showNMLS?: boolean;
  showDisclaimer?: boolean;
  disclaimerText?: string;
  showWriteReview?: boolean;
  writeReviewUrl?: string;
  columns?: number;
  dateFormat?: "relative" | "absolute";
  cardStyle?: "bordered" | "shadow" | "flat";
}

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

interface LOReviewPreviewProps {
  profile: EntityProfile | null;
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
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0]?.toUpperCase() ?? "?";
}

function truncateText(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max).trimEnd() + "\u2026";
}

function formatRelativeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffDays < 1) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? "month" : "months"} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? "year" : "years"} ago`;
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

function formatDate(
  dateStr: string,
  format: "relative" | "absolute"
): string {
  return format === "relative"
    ? formatRelativeDate(dateStr)
    : formatAbsoluteDate(dateStr);
}

const LOAN_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  purchase: { bg: "#dbeafe", text: "#1d4ed8" },
  refinance: { bg: "#fef3c7", text: "#92400e" },
  va: { bg: "#d1fae5", text: "#065f46" },
  fha: { bg: "#e0e7ff", text: "#3730a3" },
  jumbo: { bg: "#fce7f3", text: "#9d174d" },
};

function getLoanTypeColor(loanType: string): { bg: string; text: string } {
  return (
    LOAN_TYPE_COLORS[loanType.toLowerCase().trim()] ?? {
      bg: "#f3f4f6",
      text: "#6b7280",
    }
  );
}

const SOURCE_LABELS: Record<string, string> = {
  google: "Google",
  zillow: "Zillow",
  internal: "RepWell",
};

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
          alt={profile.full_name ?? "Loan Officer"}
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

        {content.showNMLS !== false && profile.nmls_id && (
          <a
            href={`https://www.nmlsconsumeraccess.org/EntityDetails.aspx/INDIVIDUAL/${encodeURIComponent(profile.nmls_id)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[var(--rw-primary,#52796f)] transition-colors no-underline hover:underline"
          >
            NMLS #{profile.nmls_id}
            <ExternalLink size={10} />
          </a>
        )}

        {profile.licensing_states && profile.licensing_states.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {profile.licensing_states.map((state) => (
              <span
                key={state}
                className="inline-block px-1.5 py-px text-[10px] font-medium text-gray-500 bg-gray-100 rounded uppercase tracking-wide"
              >
                {state}
              </span>
            ))}
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
  const starFilled = colors.starFilled ?? "#f59e0b";
  const starEmpty = colors.starEmpty ?? "#d1d5db";
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
        `Reviews for ${profile?.full_name ?? "Loan Officer"}`
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
        <div className="flex items-center gap-2 mt-3 p-2 text-[10px] leading-snug text-gray-500 bg-gray-50 rounded">
          <Home size={18} className="flex-shrink-0 text-gray-400" />
          <span>
            {content.disclaimerText ??
              "Equal Housing Lender. NMLS Consumer Access: www.nmlsconsumeraccess.org"}
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
