/**
 * Company Review Widget template — builds the DOM tree for organization-wide reviews.
 * Displays org branding, aggregate stats, rating distribution, source breakdown,
 * sortable review cards with pagination.
 * All DOM construction uses safe methods (createElement/textContent) — no innerHTML.
 *
 * Exports shared builders (starsRow, buildRatingDistribution, buildSourceBreakdown,
 * buildSortControls, buildReviewCard) for reuse by branch-review widget.
 */

import type {
  PublicWidgetConfig,
  PublicReview,
  EntityProfile,
  RatingDistribution,
  SourceBreakdown,
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
import { createEqualHousingLenderSVG, createHouseIconSVG } from "../../assets/equal-housing-lender";

// ── Shared Helpers (exported for branch-review) ─────────────────────

export function starsRow(rating: number, filledColor: string, emptyColor: string, className: string): HTMLElement {
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
  const m: Record<string, string> = { purchase: "purchase", refinance: "refinance", va: "va", fha: "fha", jumbo: "jumbo", usda: "usda", conventional: "conventional" };
  return m[normalized] ?? "default";
}

const SOURCE_ICONS: Record<string, string> = {
  google: "G",
  zillow: "Z",
  internal: "R",
};

/** Sanitize a value for safe use in CSS class names (alphanumeric + hyphens only). */
function safeClassName(value: string): string {
  return value.replace(/[^a-zA-Z0-9-]/g, "");
}

const SOURCE_LABELS: Record<string, string> = {
  google: "Google",
  zillow: "Zillow",
  internal: "RepWell",
};

const NMLS_COMPANY_BASE = "https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/";

// ── Organization Header ──────────────────────────────────────────────

function buildOrgHeader(
  profile: EntityProfile,
  starFilled: string,
  starEmpty: string
): HTMLElement {
  const section = el("div", "rw-co-header");

  const logoUrl = profile.logo_url ?? profile.photo_url ?? profile.avatar_url;
  if (logoUrl) {
    const img = document.createElement("img");
    img.className = "rw-co-header__logo";
    img.src = logoUrl;
    img.alt = profile.organization_name ?? profile.full_name ?? "Organization logo";
    img.loading = "lazy";
    section.appendChild(img);
  } else {
    const orgName = profile.organization_name ?? profile.full_name;
    section.appendChild(text("div", getInitials(orgName), "rw-co-header__logo-placeholder"));
  }

  const info = el("div", "rw-co-header__info");
  const orgName = profile.organization_name ?? profile.full_name;
  if (orgName) info.appendChild(text("h3", orgName, "rw-co-header__name"));

  // Company NMLS number in header
  if (profile.nmls_id) {
    const nmlsWrapper = el("div", "rw-co-header__nmls");
    nmlsWrapper.textContent = "NMLS# ";
    const nmlsLink = document.createElement("a");
    nmlsLink.textContent = profile.nmls_id;
    nmlsLink.href = `${NMLS_COMPANY_BASE}${encodeURIComponent(profile.nmls_id)}`;
    nmlsLink.target = "_blank";
    nmlsLink.rel = "noopener noreferrer";
    nmlsLink.setAttribute("aria-label", `Company NMLS ID ${profile.nmls_id} - view on NMLS Consumer Access`);
    nmlsWrapper.appendChild(nmlsLink);
    info.appendChild(nmlsWrapper);
  }

  if (profile.average_rating != null) {
    const ratingRow = el("div", "rw-co-header__rating");
    ratingRow.appendChild(text("span", profile.average_rating.toFixed(1), "rw-co-header__rating-value"));
    ratingRow.appendChild(starsRow(Math.round(profile.average_rating), starFilled, starEmpty, "rw-co-header__stars"));
    if (profile.total_reviews != null) {
      ratingRow.appendChild(text("span", `${profile.total_reviews} review${profile.total_reviews === 1 ? "" : "s"}`, "rw-co-header__rating-count"));
    }
    info.appendChild(ratingRow);
  }

  section.appendChild(info);
  return section;
}

// ── Rating Distribution Bar Chart (exported for branch-review) ──────

export function buildRatingDistribution(
  distribution: RatingDistribution,
  totalReviews: number,
  starFilled: string,
  starEmpty: string
): HTMLElement {
  const section = el("div", "rw-co-distribution");
  section.setAttribute("role", "figure");
  section.setAttribute("aria-label", "Rating distribution");

  for (let star = 5; star >= 1; star--) {
    const count = distribution[star as keyof RatingDistribution] ?? 0;
    const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

    const row = el("div", "rw-co-distribution__row");

    const label = text("span", `${star}`, "rw-co-distribution__label");
    label.appendChild(starSVG(true, starFilled, starEmpty));
    row.appendChild(label);

    const barOuter = el("div", "rw-co-distribution__bar-outer");
    const barInner = el("div", "rw-co-distribution__bar-inner");
    barInner.style.width = `${pct}%`;
    barOuter.appendChild(barInner);
    row.appendChild(barOuter);

    row.appendChild(text("span", `${count}`, "rw-co-distribution__count"));

    section.appendChild(row);
  }
  return section;
}

// ── Source Breakdown (exported for branch-review) ────────────────────

export function buildSourceBreakdown(
  sources: SourceBreakdown[],
  starFilled: string,
  starEmpty: string
): HTMLElement {
  const section = el("div", "rw-co-sources");
  section.appendChild(text("h4", "Reviews by Source", "rw-co-sources__title"));

  const list = el("div", "rw-co-sources__list");
  for (const src of sources) {
    const item = el("div", "rw-co-sources__item");

    const icon = text("span", SOURCE_ICONS[src.source] ?? src.source[0]?.toUpperCase() ?? "?", `rw-co-sources__icon rw-co-sources__icon--${safeClassName(src.source)}`);
    item.appendChild(icon);

    const info = el("div", "rw-co-sources__info");
    info.appendChild(text("span", SOURCE_LABELS[src.source] ?? src.source, "rw-co-sources__name"));

    const meta = el("span", "rw-co-sources__meta");
    meta.textContent = `${src.count} reviews \u00B7 ${src.average.toFixed(1)} avg`;
    info.appendChild(meta);
    item.appendChild(info);

    item.appendChild(starsRow(Math.round(src.average), starFilled, starEmpty, "rw-co-sources__stars"));

    list.appendChild(item);
  }
  section.appendChild(list);
  return section;
}

// ── Sorting Controls (exported for branch-review) ───────────────────

export type SortOption = "newest" | "highest" | "lowest";

export function buildSortControls(
  activeSort: SortOption,
  onSort: (sort: SortOption) => void,
  apiBase: string,
  widgetId: string
): HTMLElement {
  const section = el("div", "rw-co-filters");
  section.setAttribute("role", "toolbar");
  section.setAttribute("aria-label", "Sort reviews");

  const options: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Most Recent" },
    { value: "highest", label: "Highest Rated" },
    { value: "lowest", label: "Lowest Rated" },
  ];

  for (const opt of options) {
    const btn = document.createElement("button");
    btn.className = `rw-co-filters__btn${opt.value === activeSort ? " rw-co-filters__btn--active" : ""}`;
    btn.textContent = opt.label;
    btn.type = "button";
    btn.setAttribute("aria-pressed", String(opt.value === activeSort));
    btn.addEventListener("click", () => {
      onSort(opt.value);
      trackClick(apiBase, widgetId, "filter_change", { sort: opt.value });
    });
    section.appendChild(btn);
  }

  return section;
}

// ── Review Card (exported for branch-review) ─────────────────────────

export function buildReviewCard(
  review: PublicReview,
  config: PublicWidgetConfig,
  starFilled: string,
  starEmpty: string,
  apiBase: string
): HTMLElement {
  const content = config.config?.content;
  const cardStyle = content?.cardStyle ?? "bordered";
  const card = el("div", `rw-co-review rw-co-review--${safeClassName(cardStyle)}`);
  card.setAttribute("role", "article");
  card.setAttribute("aria-label", `Review by ${review.reviewer_name ?? "Anonymous"}`);

  const header = el("div", "rw-co-review__header");
  if (content?.showAvatar !== false) {
    header.appendChild(text("div", getInitials(review.reviewer_name), "rw-co-review__avatar"));
  }

  const meta = el("div", "rw-co-review__meta");
  if (review.reviewer_name) meta.appendChild(text("span", review.reviewer_name, "rw-co-review__name"));
  if (content?.showDate !== false && review.review_date) {
    const dateFormat = content?.dateFormat ?? "relative";
    const dateText = dateFormat === "relative" ? formatRelativeDate(review.review_date) : formatAbsoluteDate(review.review_date);
    meta.appendChild(text("span", dateText, "rw-co-review__date"));
  }
  header.appendChild(meta);
  card.appendChild(header);

  card.appendChild(starsRow(review.rating, starFilled, starEmpty, "rw-co-review__stars"));

  if (review.text) {
    const truncLen = content?.truncateLength ?? 300;
    const { text: displayText, truncated } = truncLen > 0 ? truncateText(review.text, truncLen) : { text: review.text, truncated: false };
    const textEl = text("p", displayText, "rw-co-review__text");

    if (truncated) {
      textEl.classList.add("rw-co-review__text--truncated");
      textEl.setAttribute("role", "button");
      textEl.setAttribute("tabindex", "0");
      textEl.setAttribute("aria-expanded", "false");
      const expand = (): void => {
        textEl.textContent = review.text!;
        textEl.classList.remove("rw-co-review__text--truncated");
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

  const tags = el("div", "rw-co-review__tags");
  let hasTags = false;
  if (content?.showSource !== false && review.source) {
    tags.appendChild(text("span", `via ${SOURCE_LABELS[review.source] ?? review.source}`, "rw-co-review__source"));
    hasTags = true;
  }
  if (review.loan_type) {
    tags.appendChild(text("span", review.loan_type, `rw-co-review__loan-tag rw-co-review__loan-tag--${getLoanTagClass(review.loan_type)}`));
    hasTags = true;
  }
  if (review.first_time_homebuyer) {
    const fthb = el("span", "rw-co-review__fthb-badge");
    fthb.appendChild(createHouseIconSVG(11));
    fthb.appendChild(document.createTextNode("First-Time Buyer"));
    tags.appendChild(fthb);
    hasTags = true;
  }
  if (review.loan_officer_name) {
    tags.appendChild(text("span", `LO: ${review.loan_officer_name}`, "rw-co-review__lo-attr"));
    hasTags = true;
  }
  if (hasTags) card.appendChild(tags);

  return card;
}

// ── Main Builder ─────────────────────────────────────────────────────

/**
 * Builds the Company Review widget DOM tree (without styles/theme — handled by index.ts).
 */
export function buildCompanyReviewDOM(
  config: PublicWidgetConfig,
  reviews: PublicReview[],
  apiBase: string
): HTMLElement {
  const cfg = config.config;
  const content = cfg?.content;
  const colors = cfg?.theme?.colors;
  const profile = config.entity_profile;

  const container = el("div", "rw-widget");
  container.setAttribute("role", "region");
  container.setAttribute("aria-label", content?.headerText ?? `Reviews for ${profile?.organization_name ?? profile?.full_name ?? "Organization"}`);

  const starFilled = colors?.starFilled ?? "#f59e0b";
  const starEmpty = colors?.starEmpty ?? "#d1d5db";

  // Organization header
  if (profile && content?.showHeader !== false) {
    container.appendChild(buildOrgHeader(profile, starFilled, starEmpty));
  }

  // Rating distribution bar chart
  if (content?.showRatingDistribution !== false && profile?.rating_distribution && profile.total_reviews) {
    container.appendChild(buildRatingDistribution(profile.rating_distribution, profile.total_reviews, starFilled, starEmpty));
  }

  // Source breakdown
  if (content?.showSourceBreakdown !== false && profile?.source_breakdown && profile.source_breakdown.length > 0) {
    container.appendChild(buildSourceBreakdown(profile.source_breakdown, starFilled, starEmpty));
  }

  // Review list with sort/filter/pagination
  buildReviewListSection(container, reviews, config, starFilled, starEmpty, apiBase);

  // Actions, compliance, branding
  appendWidgetFooter(container, config, apiBase);

  return container;
}

// ── Shared builders for reuse by branch-review ──────────────────────

/** Appends actions (CTA + Write Review), disclaimer, and branding to a widget container. */
export function appendWidgetFooter(
  container: HTMLElement,
  config: PublicWidgetConfig,
  apiBase: string
): void {
  const content = config.config?.content;
  const colors = config.config?.theme?.colors;

  const hasActions = (content?.showCTA && content.ctaText && content.ctaUrl) || (content?.showWriteReview && content.writeReviewUrl);
  if (hasActions) {
    const actions = el("div", "rw-co-actions");
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
      const w = document.createElement("a");
      w.className = "rw-co-actions__write-review";
      w.textContent = "Write a Review";
      w.href = content.writeReviewUrl;
      w.target = "_blank";
      w.rel = "noopener noreferrer";
      w.addEventListener("click", () => { trackClick(apiBase, config.widget_id, "click_write_review"); });
      actions.appendChild(w);
    }
    container.appendChild(actions);
  }

  if (content?.showDisclaimer) {
    const disclaimer = el("div", "rw-co-disclaimer");
    const ehl = el("div", "rw-co-disclaimer__ehl");
    ehl.appendChild(createEqualHousingLenderSVG(18));
    ehl.appendChild(document.createTextNode("Equal Housing Lender"));
    disclaimer.appendChild(ehl);
    disclaimer.appendChild(text("div", content.disclaimerText || "This is not a commitment to lend. Programs, rates, terms, and conditions are subject to change without notice.", "rw-co-disclaimer__text"));
    const nmlsLink = document.createElement("a");
    nmlsLink.className = "rw-co-disclaimer__nmls-link";
    nmlsLink.href = "https://www.nmlsconsumeraccess.org";
    nmlsLink.target = "_blank";
    nmlsLink.rel = "noopener noreferrer";
    nmlsLink.textContent = "NMLS Consumer Access";
    disclaimer.appendChild(nmlsLink);
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
}

/** Builds a review list section with optional sort/filter controls and load-more pagination. */
export function buildReviewListSection(
  container: HTMLElement,
  reviews: PublicReview[],
  config: PublicWidgetConfig,
  starFilled: string,
  starEmpty: string,
  apiBase: string,
  emptyNode?: HTMLElement
): void {
  const content = config.config?.content;
  const perPage = content?.reviewsPerPage ?? 10;
  const columns = Math.min(Math.max(content?.columns ?? 1, 1), 6);

  if (reviews.length === 0) {
    if (emptyNode) container.appendChild(emptyNode);
    else container.appendChild(text("div", "No reviews yet.", "rw-empty"));
    return;
  }

  let currentReviews = [...reviews];
  let visibleCount = Math.min(perPage, currentReviews.length);
  const grid = el("div", "rw-co-reviews");
  if (columns > 1) grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

  const render = (): void => {
    while (grid.firstChild) grid.firstChild.remove();
    for (const r of currentReviews.slice(0, visibleCount)) {
      grid.appendChild(buildReviewCard(r, config, starFilled, starEmpty, apiBase));
    }
  };

  let loadMoreBtn: HTMLButtonElement | null = null;
  const updateLoadMore = (): void => {
    if (loadMoreBtn) loadMoreBtn.style.display = visibleCount < currentReviews.length ? "" : "none";
  };

  if (content?.showFilters) {
    let currentSort: SortOption = "newest";
    currentReviews.sort((a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime());
    const fw = el("div", "rw-co-filters-wrapper");
    const sortFn = (sort: SortOption): void => {
      currentSort = sort;
      currentReviews = [...reviews];
      if (sort === "newest") currentReviews.sort((a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime());
      else if (sort === "highest") currentReviews.sort((a, b) => b.rating - a.rating);
      else currentReviews.sort((a, b) => a.rating - b.rating);
      visibleCount = Math.min(perPage, currentReviews.length);
      render();
      fw.querySelectorAll(".rw-co-filters__btn").forEach((btn, i) => {
        const vals: SortOption[] = ["newest", "highest", "lowest"];
        btn.classList.toggle("rw-co-filters__btn--active", vals[i] === currentSort);
        btn.setAttribute("aria-pressed", String(vals[i] === currentSort));
      });
      updateLoadMore();
    };
    fw.appendChild(buildSortControls(currentSort, sortFn, apiBase, config.widget_id));
    container.appendChild(fw);
  }

  render();
  container.appendChild(grid);

  if (currentReviews.length > perPage) {
    loadMoreBtn = document.createElement("button");
    loadMoreBtn.className = "rw-co-load-more";
    loadMoreBtn.textContent = "Load More Reviews";
    loadMoreBtn.type = "button";
    loadMoreBtn.addEventListener("click", () => {
      visibleCount = Math.min(visibleCount + perPage, currentReviews.length);
      render();
      updateLoadMore();
    });
    container.appendChild(loadMoreBtn);
  }
}
