import type { BaseWidgetProps } from "../types";
import { useWidgetConfig } from "../hooks/useWidgetConfig";
import { useWidgetEvents } from "../hooks/useWidgetEvents";
import { WidgetShell } from "../utils/WidgetShell";
import { ReviewCard } from "../utils/ReviewCard";
import { Stars } from "../utils/Stars";
import { getInitials, pluralize } from "../utils/helpers";

const DEFAULT_API_BASE = "https://app.repwell.com";

/**
 * Loan Officer Review Widget.
 * Displays an individual loan officer's profile, rating, and reviews.
 */
export function LOReviewWidget({
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
  const profile = config?.entity_profile;
  const starFilled = colors?.starFilled ?? "#f59e0b";
  const starEmpty = colors?.starEmpty ?? "#d1d5db";
  const columns = Math.min(Math.max(content?.columns ?? 1, 1), 6);
  const cardStyle = content?.cardStyle ?? "bordered";
  const photoUrl = profile?.photo_url ?? profile?.avatar_url;

  return (
    <WidgetShell
      className={className}
      style={style}
      ariaLabel={content?.headerText ?? `Reviews for ${profile?.full_name ?? "Loan Officer"}`}
      loading={loading}
      error={error}
      fallback={fallback}
    >
      {config && (
        <>
          {profile && content?.showHeader !== false && (
            <div className="rw-lo-profile">
              {photoUrl ? (
                <img
                  className="rw-lo-profile__photo"
                  src={photoUrl}
                  alt={profile.full_name ? `Photo of ${profile.full_name}` : "Loan Officer photo"}
                  loading="lazy"
                />
              ) : (
                <div className="rw-lo-profile__photo-placeholder">
                  {getInitials(profile.full_name)}
                </div>
              )}
              <div className="rw-lo-profile__info">
                {profile.full_name && (
                  <h3 className="rw-lo-profile__name">{profile.full_name}</h3>
                )}
                {profile.title && (
                  <div className="rw-lo-profile__title">{profile.title}</div>
                )}
                {profile.nmls_id && (
                  <div className="rw-lo-profile__nmls">NMLS# {profile.nmls_id}</div>
                )}
                {profile.licensing_states && profile.licensing_states.length > 0 && (
                  <div className="rw-lo-profile__licensed-states">
                    Licensed in {profile.licensing_states.join(", ")}
                  </div>
                )}
                {profile.average_rating != null && (
                  <div className="rw-lo-profile__rating">
                    <span className="rw-lo-profile__rating-value">
                      {profile.average_rating.toFixed(1)}
                    </span>
                    <Stars rating={Math.round(profile.average_rating)} filledColor={starFilled} emptyColor={starEmpty} />
                    {profile.total_reviews != null && (
                      <span className="rw-lo-profile__rating-count">
                        {profile.total_reviews} {pluralize(profile.total_reviews, "review")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="rw-empty">No reviews yet.</div>
          ) : (
            <div
              className="rw-lo-reviews"
              style={columns > 1 ? { display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: "1rem" } : undefined}
            >
              {reviews.map((review) => (
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
          )}

          {content?.showCTA && content.ctaText && content.ctaUrl && (
            <div className="rw-lo-actions">
              <a
                className="rw-cta"
                href={content.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => emit("click_cta")}
                style={colors?.primary ? { background: colors.primary } : undefined}
              >
                {content.ctaText}
              </a>
            </div>
          )}

          {content?.showDisclaimer && (
            <div className="rw-disclaimer">
              {content.disclaimerText ?? "This is not a commitment to lend. Programs, rates, terms, and conditions are subject to change without notice."}
            </div>
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
