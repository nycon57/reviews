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

function starsRow(rating: number, filledColor: string, emptyColor: string, className: string): HTMLElement {
  const row = el("div", className);
  row.setAttribute("role", "img");
  row.setAttribute("aria-label", `${rating} out of 5 stars`);
  for (let i = 1; i <= 5; i++) {
    row.appendChild(starSVG(i <= rating, filledColor, emptyColor));
  }
  return row;
}

function getLoanTagClass(loanType: string): string {
  const normalized = loanType.toLowerCase().replace(/\s+/g, "");
  const m: Record<string, string> = { purchase: "purchase", refinance: "refinance", va: "va", fha: "fha", jumbo: "jumbo" };
  return m[normalized] ?? "default";
}

const NMLS_BASE = "https://www.nmlsconsumeraccess.org/EntityDetails.aspx/INDIVIDUAL/";

function buildProfileHeader(profile: EntityProfile, config: PublicWidgetConfig, starFilled: string, starEmpty: string): HTMLElement {
  const content = config.config?.content;
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

  if (content?.showNMLS !== false && profile.nmls_id) {
    const nmlsWrapper = el("div", "rw-lo-profile__nmls");
    nmlsWrapper.textContent = "NMLS# ";
    const nmlsLink = document.createElement("a");
    nmlsLink.textContent = profile.nmls_id;
    nmlsLink.href = `${NMLS_BASE}${encodeURIComponent(profile.nmls_id)}`;
    nmlsLink.target = "_blank";
    nmlsLink.rel = "noopener noreferrer";
    nmlsLink.setAttribute("aria-label", `NMLS ID ${profile.nmls_id} - view on NMLS Consumer Access`);
    nmlsWrapper.appendChild(nmlsLink);
    info.appendChild(nmlsWrapper);
  }

  if (profile.licensing_states && profile.licensing_states.length > 0) {
    const states = el("div", "rw-lo-profile__states");
    for (const state of profile.licensing_states) {
      states.appendChild(text("span", state, "rw-lo-profile__state-tag"));
    }
    info.appendChild(states);
  }

  if (profile.average_rating != null) {
    const ratingRow = el("div", "rw-lo-profile__rating");
    ratingRow.appendChild(text("span", profile.average_rating.toFixed(1), "rw-lo-profile__rating-value"));
    ratingRow.appendChild(starsRow(Math.round(profile.average_rating), starFilled, starEmpty, "rw-review__stars"));
    if (profile.total_reviews != null) {
      ratingRow.appendChild(text("span", `${profile.total_reviews} review${profile.total_reviews === 1 ? "" : "s"}`, "rw-lo-profile__rating-count"));
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
  card.setAttribute("aria-label", `Review by ${review.reviewer_name ?? "Anonymous"}`);

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
  if (content?.showSource !== false && review.source) { tags.appendChild(text("span", `via ${review.source}`, "rw-lo-review__source")); hasTags = true; }
  if (review.loan_type) { tags.appendChild(text("span", review.loan_type, `rw-lo-review__loan-tag rw-lo-review__loan-tag--${getLoanTagClass(review.loan_type)}`)); hasTags = true; }
  if (review.first_time_homebuyer) { tags.appendChild(text("span", "First-Time Homebuyer", "rw-lo-review__fthb-badge")); hasTags = true; }
  if (hasTags) card.appendChild(tags);

  return card;
}

/**
 * Builds the LO Review widget DOM tree (without styles/theme — handled by index.ts).
 */
export function buildLoReviewDOM(config: PublicWidgetConfig, reviews: PublicReview[], apiBase: string): HTMLElement {
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

  if (reviews.length === 0) {
    container.appendChild(text("div", "No reviews yet.", "rw-empty"));
  } else {
    const grid = el("div", "rw-lo-reviews");
    const columns = Math.min(Math.max(content?.columns ?? 1, 1), 6);
    if (columns > 1) grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    for (const review of reviews) {
      grid.appendChild(buildReviewCard(review, config, starFilled, starEmpty, apiBase));
    }
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
      writeBtn.textContent = "Write a Review";
      writeBtn.href = content.writeReviewUrl;
      writeBtn.target = "_blank";
      writeBtn.rel = "noopener noreferrer";
      writeBtn.addEventListener("click", () => { trackClick(apiBase, config.widget_id, "click_write_review"); });
      actions.appendChild(writeBtn);
    }
    container.appendChild(actions);
  }

  if (content?.showDisclaimer) {
    const disclaimer = el("div", "rw-lo-disclaimer");
    const ehl = el("div", "rw-lo-disclaimer__ehl");
    ehl.textContent = "\u2302 Equal Housing Lender";
    disclaimer.appendChild(ehl);
    const disclaimerContent = content.disclaimerText ?? "NMLS Consumer Access: www.nmlsconsumeraccess.org. This is not a commitment to lend. Not all borrowers will qualify. Equal Housing Lender.";
    disclaimer.appendChild(text("div", disclaimerContent));
    container.appendChild(disclaimer);
  }

  if (content?.showBranding !== false) {
    const branding = el("div", "rw-branding");
    branding.textContent = "Powered by ";
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
