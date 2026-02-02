/**
 * Renders widget content (reviews, header, CTA, branding) into a Shadow DOM root.
 * All DOM construction uses safe methods (createElement/textContent) — no innerHTML.
 */

import type { PublicWidgetConfig, PublicReview } from "../types";
import { getWidgetRenderer } from "../widgets/registry";
import {
  el,
  text,
  starSVG,
  getInitials,
  truncateText,
  formatAbsoluteDate,
  applyTheme,
} from "./dom-helpers";
import { createEqualHousingLenderSVG } from "../assets/equal-housing-lender";
import { setLocale, t } from "../i18n";

// ── Main render ─────────────────────────────────────────────────────

export function renderWidget(
  root: ShadowRoot,
  config: PublicWidgetConfig,
  reviews: PublicReview[],
  apiBase?: string
): void {
  // Set locale from widget config before rendering any content
  setLocale(config.config?.content?.language ?? "en");

  // Dispatch to type-specific renderer if registered
  const typeRenderer = getWidgetRenderer(config.widget_type);
  if (typeRenderer && apiBase) {
    typeRenderer(root, config, reviews, apiBase);
    return;
  }

  const cfg = config.config;
  const content = cfg?.content;
  const theme = cfg?.theme;
  const colors = theme?.colors;

  // Apply theme CSS custom properties
  applyTheme(root, colors, theme?.layout, theme?.typography);

  const container = el("div", "rw-widget");
  container.setAttribute("role", "region");
  container.setAttribute("aria-label", content?.headerText ?? t("customerReviews"));

  // Header
  if (content?.showHeader !== false) {
    const header = el("div", "rw-widget__header");
    header.appendChild(text("h3", content?.headerText ?? t("customerReviews"), "rw-widget__title"));

    if (reviews.length > 0) {
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      header.appendChild(
        text("p", `${avg.toFixed(1)} ${t("averageFrom", { count: reviews.length })}`, "rw-widget__subtitle")
      );
    }
    container.appendChild(header);
  }

  // Reviews list
  if (reviews.length === 0) {
    container.appendChild(text("div", t("noReviewsYet"), "rw-empty"));
  } else {
    const list = el("div", "rw-reviews");
    const starFilled = colors?.starFilled ?? "#f59e0b";
    const starEmpty = colors?.starEmpty ?? "#d1d5db";
    const truncLen = content?.truncateLength ?? 300;

    for (const review of reviews) {
      const card = el("div", "rw-review");

      // Top row: avatar + name + date
      if (content?.showAvatar !== false || review.reviewer_name) {
        const top = el("div", "rw-review__top");

        if (content?.showAvatar !== false) {
          top.appendChild(text("div", getInitials(review.reviewer_name), "rw-review__avatar"));
        }

        const meta = el("div", "rw-review__meta");
        if (review.reviewer_name) {
          meta.appendChild(text("span", review.reviewer_name, "rw-review__name"));
        }
        if (content?.showDate !== false && review.review_date) {
          meta.appendChild(text("span", formatAbsoluteDate(review.review_date), "rw-review__date"));
        }
        top.appendChild(meta);
        card.appendChild(top);
      }

      // Stars
      const stars = el("div", "rw-review__stars");
      stars.setAttribute("aria-label", t("starsAriaLabel", { rating: review.rating }));
      for (let i = 1; i <= 5; i++) {
        stars.appendChild(starSVG(i <= review.rating, starFilled, starEmpty));
      }
      card.appendChild(stars);

      // Review text
      if (review.text) {
        const { text: reviewText } = truncLen > 0
          ? truncateText(review.text, truncLen)
          : { text: review.text };
        card.appendChild(text("p", reviewText, "rw-review__text"));
      }

      // Source badge
      if (content?.showSource !== false && review.source) {
        card.appendChild(text("span", `${t("via")} ${review.source}`, "rw-review__source"));
      }

      list.appendChild(card);
    }
    container.appendChild(list);
  }

  // CTA button
  if (content?.showCTA && content.ctaText && content.ctaUrl) {
    const cta = document.createElement("a");
    cta.className = "rw-cta";
    cta.textContent = content.ctaText;
    cta.href = content.ctaUrl;
    cta.target = "_blank";
    cta.rel = "noopener noreferrer";
    if (colors?.primary) cta.style.background = colors.primary;
    container.appendChild(cta);
  }

  // Compliance disclaimer
  if (content?.showDisclaimer || content?.showNMLS) {
    const disclaimer = el("div", "rw-disclaimer");
    const ehlRow = el("div", "rw-disclaimer__ehl");
    ehlRow.appendChild(createEqualHousingLenderSVG(16));
    ehlRow.appendChild(document.createTextNode(t("equalHousingLender")));
    disclaimer.appendChild(ehlRow);
    disclaimer.appendChild(text("div", content?.disclaimerText || t("defaultDisclaimer")));
    const nmlsLink = document.createElement("a");
    nmlsLink.href = "https://www.nmlsconsumeraccess.org";
    nmlsLink.target = "_blank";
    nmlsLink.rel = "noopener noreferrer";
    nmlsLink.textContent = "NMLS Consumer Access";
    nmlsLink.style.fontSize = "10px";
    nmlsLink.style.color = colors?.primary ?? "#52796f";
    nmlsLink.style.textDecoration = "none";
    disclaimer.appendChild(nmlsLink);
    container.appendChild(disclaimer);
  }

  // Branding
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

  root.appendChild(container);
}

export function renderError(root: ShadowRoot, message?: string): void {
  const err = el("div", "rw-error");
  err.setAttribute("role", "alert");
  err.textContent = message ?? t("unableToLoadReviews");
  root.appendChild(err);
}
