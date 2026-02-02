import type { BaseWidgetProps, RatingDistribution } from "../types";
import { useWidgetConfig } from "../hooks/useWidgetConfig";
import { useWidgetEvents } from "../hooks/useWidgetEvents";
import { WidgetShell } from "../utils/WidgetShell";
import { ReviewCard } from "../utils/ReviewCard";
import { Stars } from "../utils/Stars";
import { getInitials, pluralize } from "../utils/helpers";

const DEFAULT_API_BASE = "https://app.repwell.com";

function RatingDistributionBar({ distribution }: { distribution: RatingDistribution }) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  return (
    <div className="rw-rating-dist">
      {([5, 4, 3, 2, 1] as const).map((star) => {
        const count = distribution[star];
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={star} className="rw-rating-dist__row">
            <span className="rw-rating-dist__label">{star}</span>
            <div className="rw-rating-dist__bar">
              <div className="rw-rating-dist__fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="rw-rating-dist__count">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Company Review Widget.
 * Displays organization-level reviews with rating distribution and source breakdown.
 */
export function CompanyReviewWidget({
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

  return (
    <WidgetShell
      className={className}
      style={style}
      ariaLabel={content?.headerText ?? `Reviews for ${profile?.organization_name ?? "Company"}`}
      loading={loading}
      error={error}
      fallback={fallback}
    >
      {config && (
        <>
          {profile && content?.showHeader !== false && (
            <div className="rw-company-profile">
              {profile.logo_url ? (
                <img
                  className="rw-company-profile__logo"
                  src={profile.logo_url}
                  alt={profile.organization_name ?? "Company logo"}
                  loading="lazy"
                />
              ) : (
                <div className="rw-company-profile__logo-placeholder">
                  {getInitials(profile.organization_name)}
                </div>
              )}
              <div className="rw-company-profile__info">
                {profile.organization_name && (
                  <h3 className="rw-company-profile__name">{profile.organization_name}</h3>
                )}
                {profile.average_rating != null && (
                  <div className="rw-company-profile__rating">
                    <span className="rw-company-profile__rating-value">
                      {profile.average_rating.toFixed(1)}
                    </span>
                    <Stars rating={Math.round(profile.average_rating)} filledColor={starFilled} emptyColor={starEmpty} />
                    {profile.total_reviews != null && (
                      <span className="rw-company-profile__rating-count">
                        {profile.total_reviews} {pluralize(profile.total_reviews, "review")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {content?.showRatingDistribution && profile?.rating_distribution && (
            <RatingDistributionBar distribution={profile.rating_distribution} />
          )}

          {content?.showSourceBreakdown && profile?.source_breakdown && profile.source_breakdown.length > 0 && (
            <div className="rw-source-breakdown">
              {profile.source_breakdown.map((source) => (
                <div key={source.source} className="rw-source-breakdown__item">
                  <span className="rw-source-breakdown__name">{source.source}</span>
                  <span className="rw-source-breakdown__avg">{source.average.toFixed(1)}</span>
                  <span className="rw-source-breakdown__count">({source.count})</span>
                </div>
              ))}
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="rw-empty">No reviews yet.</div>
          ) : (
            <div
              className="rw-company-reviews"
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

          {content?.showWriteReview && content.writeReviewUrl && (
            <div className="rw-company-actions">
              <a
                className="rw-cta rw-cta--outline"
                href={content.writeReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => emit("click_write_review")}
              >
                Write a Review
              </a>
            </div>
          )}

          {content?.showCTA && content.ctaText && content.ctaUrl && (
            <div className="rw-company-actions">
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
