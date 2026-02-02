/**
 * LO Review Widget template — builds the DOM tree for the loan officer review widget.
 * All DOM construction uses safe methods (createElement/textContent) — no innerHTML.
 */

import type {
  PublicWidgetConfig,
  PublicReview,
  EntityProfile,
} from "../../types";
import { trackClick } from "../../core/event-tracker";
import {
  el,
  text,
  starSVG,
  getInitials,
  truncateText,
  formatRelativeDate,
  formatAbsoluteDate,
} from "../../core/dom-helpers";
import { buildNmlsBadge } from "../../components/nmls-badge";
import { buildComplianceFooter } from "../../components/compliance-footer";
import { buildLoanTypeTag } from "../../components/loan-type-tag";
import { buildFirstTimeBuyerBadge } from "../../components/first-time-buyer-badge";
import type { WidgetInstance } from "../../types";
import { buildFilterControls } from "../shared/filter-controls";
import { t } from "../../i18n";

function starsRow(rating: number, filledColor: string, emptyColor: string, className: string): HTMLElement {
  const row = el("div", className);
  row.setAttribute("role", "img");
  row.setAttribute("aria-label", t("starsAriaLabel", { rating }));
  for (let i = 1; i <= 5; i++) {
    row.appendChild(starSVG(i <= rating, filledColor, emptyColor));
  }
  return row;
}

function buildProfileHeader(profile: EntityProfile, config: PublicWidgetConfig, starFilled: string, starEmpty: string): HTMLElement {
  const section = el("div", "rw-lo-profile");

  const photoUrl = profile.photo_url ?? profile.avatar_url;
  if (photoUrl) {
    const img = document.createElement("img");
    img.className = "rw-lo-profile__photo";
    img.src = photoUrl;
    img.alt = profile.full_name ? `Photo of ${profile.full_name}` : "Loan Officer photo";
    img.loading = "lazy";
    section.appendChild(img);
  } else {
    section.appendChild(text("div", getInitials(profile.full_name), "rw-lo-profile__photo-placeholder"));
  }

  const info = el("div", "rw-lo-profile__info");
  if (profile.full_name) info.appendChild(text("h3", profile.full_name, "rw-lo-profile__name"));
  if (profile.title) info.appendChild(text("div", profile.title, "rw-lo-profile__title"));

  // NMLS display is mandatory for LO widgets per SAFE Act — showNMLS config is ignored
  const nmlsBadge = buildNmlsBadge(profile.nmls_id, "individual", "rw-lo-profile__nmls");
  if (nmlsBadge) info.appendChild(nmlsBadge);

  if (profile.licensing_states && profile.licensing_states.length > 0) {
    const statesRow = el("div", "rw-lo-profile__states");
    statesRow.appendChild(text("span", t("licensedIn"), "rw-lo-profile__states-label"));
    for (const state of profile.licensing_states) {
      statesRow.appendChild(text("span", state, "rw-lo-profile__state-tag"));
    }
    info.appendChild(statesRow);
  }

  if (profile.average_rating != null) {
    const ratingRow = el("div", "rw-lo-profile__rating");
    ratingRow.appendChild(text("span", profile.average_rating.toFixed(1), "rw-lo-profile__rating-value"));
    ratingRow.appendChild(starsRow(Math.round(profile.average_rating), starFilled, starEmpty, "rw-review__stars"));
    if (profile.total_reviews != null) {
      ratingRow.appendChild(text("span", `${profile.total_reviews} ${profile.total_reviews === 1 ? t("review") : t("reviews")}`, "rw-lo-profile__rating-count"));
    }
    info.appendChild(ratingRow);
  }

  section.appendChild(info);
  return section;
}

function buildReviewCard(review: PublicReview, config: PublicWidgetConfig, starFilled: string, starEmpty: string, apiBase: string): HTMLElement {
  const content = config.config?.content;
  const cardStyle = content?.cardStyle ?? "bordered";
  const card = el("div", `rw-lo-review rw-lo-review--${cardStyle}`);
  card.setAttribute("role", "article");
  card.setAttribute("aria-label", t("reviewByAriaLabel", { name: review.reviewer_name ?? t("anonymous") }));

  const header = el("div", "rw-lo-review__header");
  if (content?.showAvatar !== false) {
    header.appendChild(text("div", getInitials(review.reviewer_name), "rw-lo-review__avatar"));
  }

  const meta = el("div", "rw-lo-review__meta");
  if (review.reviewer_name) meta.appendChild(text("span", review.reviewer_name, "rw-lo-review__name"));
  if (content?.showDate !== false && review.review_date) {
    const dateFormat = content?.dateFormat ?? "relative";
    const dateText = dateFormat === "relative" ? formatRelativeDate(review.review_date) : formatAbsoluteDate(review.review_date);
    meta.appendChild(text("span", dateText, "rw-lo-review__date"));
  }
  header.appendChild(meta);
  card.appendChild(header);

  card.appendChild(starsRow(review.rating, starFilled, starEmpty, "rw-lo-review__stars"));

  if (review.text) {
    const truncLen = content?.truncateLength ?? 300;
    const { text: displayText, truncated } = truncLen > 0 ? truncateText(review.text, truncLen) : { text: review.text, truncated: false };
    const textEl = text("p", displayText, "rw-lo-review__text");

    if (truncated) {
      textEl.classList.add("rw-lo-review__text--truncated");
      textEl.setAttribute("role", "button");
      textEl.setAttribute("tabindex", "0");
      textEl.setAttribute("aria-expanded", "false");
      const expand = (): void => {
        textEl.textContent = review.text!;
        textEl.classList.remove("rw-lo-review__text--truncated");
        textEl.removeAttribute("role");
        textEl.removeAttribute("tabindex");
        textEl.setAttribute("aria-expanded", "true");
        trackClick(apiBase, config.widget_id, "click_review", { review_id: review.id });
      };
      textEl.addEventListener("click", expand);
      textEl.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); expand(); }
      });
    }
    card.appendChild(textEl);
  }

  const tags = el("div", "rw-lo-review__tags");
  let hasTags = false;
  if (content?.showSource !== false && review.source) { tags.appendChild(text("span", `${t("via")} ${review.source}`, "rw-lo-review__source")); hasTags = true; }
  if (review.loan_type) { tags.appendChild(buildLoanTypeTag(review.loan_type, "rw-lo-review")); hasTags = true; }
  if (review.first_time_homebuyer) {
    tags.appendChild(buildFirstTimeBuyerBadge("rw-lo-review__fthb-badge"));
    hasTags = true;
  }
  if (hasTags) card.appendChild(tags);

  return card;
}

/**
 * Builds the LO Review widget DOM tree (without styles/theme — handled by index.ts).
 */
export function buildLoReviewDOM(config: PublicWidgetConfig, reviews: PublicReview[], apiBase: string, instance?: WidgetInstance): HTMLElement {
  const cfg = config.config;
  const content = cfg?.content;
  const colors = cfg?.theme?.colors;
  const profile = config.entity_profile;

  const container = el("div", "rw-widget");
  container.setAttribute("role", "region");
  container.setAttribute("aria-label", content?.headerText ?? `Reviews for ${profile?.full_name ?? "Loan Officer"}`);

  const starFilled = colors?.starFilled ?? "#f59e0b";
  const starEmpty = colors?.starEmpty ?? "#d1d5db";

  if (profile && content?.showHeader !== false) {
    container.appendChild(buildProfileHeader(profile, config, starFilled, starEmpty));
  }

  const grid = el("div", "rw-lo-reviews");
  const columns = Math.min(Math.max(content?.columns ?? 1, 1), 6);
  if (columns > 1) grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

  const renderCards = (reviewList: PublicReview[]): void => {
    while (grid.firstChild) grid.firstChild.remove();
    for (const review of reviewList) {
      grid.appendChild(buildReviewCard(review, config, starFilled, starEmpty, apiBase));
    }
  };

  // Insert filter toolbar before reviews if enabled
  if (content?.showFilters && instance) {
    container.appendChild(
      buildFilterControls({
        instance,
        config,
        apiBase,
        reviewsContainer: grid,
        renderReviews: renderCards,
      }),
    );
  }

  if (reviews.length === 0) {
    container.appendChild(text("div", t("noReviewsYet"), "rw-empty"));
  } else {
    renderCards(reviews);
    container.appendChild(grid);
  }

  const hasActions = (content?.showCTA && content.ctaText && content.ctaUrl) || (content?.showWriteReview && content.writeReviewUrl);
  if (hasActions) {
    const actions = el("div", "rw-lo-actions");
    if (content?.showCTA && content.ctaText && content.ctaUrl) {
      const cta = document.createElement("a");
      cta.className = "rw-cta";
      cta.textContent = content.ctaText;
      cta.href = content.ctaUrl;
      cta.target = "_blank";
      cta.rel = "noopener noreferrer";
      if (colors?.primary) cta.style.background = colors.primary;
      cta.addEventListener("click", () => { trackClick(apiBase, config.widget_id, "click_cta"); });
      actions.appendChild(cta);
    }
    if (content?.showWriteReview && content.writeReviewUrl) {
      const writeBtn = document.createElement("a");
      writeBtn.className = "rw-lo-actions__write-review";
      writeBtn.textContent = t("writeReview");
      writeBtn.href = content.writeReviewUrl;
      writeBtn.target = "_blank";
      writeBtn.rel = "noopener noreferrer";
      writeBtn.addEventListener("click", () => { trackClick(apiBase, config.widget_id, "click_write_review"); });
      actions.appendChild(writeBtn);
    }
    container.appendChild(actions);
  }

  if (content?.showDisclaimer) {
    container.appendChild(
      buildComplianceFooter({
        classPrefix: "rw-lo-disclaimer",
        disclaimerText: content.disclaimerText,
      }),
    );
  }

  if (content?.showBranding !== false) {
    const branding = el("div", "rw-branding");
    branding.textContent = `${t("poweredBy")} `;
    const link = document.createElement("a");
    link.href = "https://repwell.com";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "RepWell";
    branding.appendChild(link);
    container.appendChild(branding);
  }

  return container;
}
