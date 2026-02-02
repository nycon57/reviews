import type { BaseWidgetProps } from "../types";
import { useWidgetConfig } from "../hooks/useWidgetConfig";
import { useWidgetEvents } from "../hooks/useWidgetEvents";
import { WidgetShell } from "../utils/WidgetShell";
import { ReviewCard } from "../utils/ReviewCard";
import { Stars } from "../utils/Stars";
import { getInitials, pluralize } from "../utils/helpers";

const DEFAULT_API_BASE = "https://app.repwell.com";

/**
 * Branch Review Widget.
 * Displays a branch location's reviews with team members and aggregate ratings.
 */
export function BranchReviewWidget({
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
      ariaLabel={content?.headerText ?? `Reviews for ${profile?.organization_name ?? "Branch"}`}
      loading={loading}
      error={error}
      fallback={fallback}
    >
      {config && (
        <>
          {profile && content?.showHeader !== false && (
            <div className="rw-branch-profile">
              {profile.logo_url ? (
                <img
                  className="rw-branch-profile__logo"
                  src={profile.logo_url}
                  alt={profile.organization_name ?? "Branch logo"}
                  loading="lazy"
                />
              ) : (
                <div className="rw-branch-profile__logo-placeholder">
                  {getInitials(profile.organization_name)}
                </div>
              )}
              <div className="rw-branch-profile__info">
                {profile.organization_name && (
                  <h3 className="rw-branch-profile__name">{profile.organization_name}</h3>
                )}
                {profile.average_rating != null && (
                  <div className="rw-branch-profile__rating">
                    <span className="rw-branch-profile__rating-value">
                      {profile.average_rating.toFixed(1)}
                    </span>
                    <Stars rating={Math.round(profile.average_rating)} filledColor={starFilled} emptyColor={starEmpty} />
                    {profile.total_reviews != null && (
                      <span className="rw-branch-profile__rating-count">
                        {profile.total_reviews} {pluralize(profile.total_reviews, "review")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {content?.showTeam && profile?.team_members && profile.team_members.length > 0 && (
            <div className="rw-branch-team">
              <h4 className="rw-branch-team__title">Our Team</h4>
              <div className="rw-branch-team__list">
                {profile.team_members.map((member) => (
                  <div key={member.id} className="rw-branch-team__member">
                    {member.photo_url ? (
                      <img
                        className="rw-branch-team__photo"
                        src={member.photo_url}
                        alt={member.full_name ?? "Team member"}
                        loading="lazy"
                      />
                    ) : (
                      <div className="rw-branch-team__photo-placeholder">
                        {getInitials(member.full_name)}
                      </div>
                    )}
                    <div className="rw-branch-team__member-info">
                      {member.full_name && <span className="rw-branch-team__member-name">{member.full_name}</span>}
                      {member.nmls_id && <span className="rw-branch-team__member-nmls">NMLS# {member.nmls_id}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="rw-empty">No reviews yet.</div>
          ) : (
            <div
              className="rw-branch-reviews"
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
            <div className="rw-branch-actions">
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
