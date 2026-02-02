/**
 * Social Proof Banner Widget — DOM construction.
 * Builds notification popup, counter bar, or floating badge depending on config.
 * All DOM via createElement/textContent — no innerHTML.
 */

import type {
  PublicWidgetConfig,
  PublicReview,
  WidgetSocialProofBanner,
} from "../../types";
import {
  el,
  text,
  starSVG,
  getInitials,
  truncateText,
  formatRelativeDate,
} from "../../core/dom-helpers";
import { trackClick } from "../../core/event-tracker";
import { t } from "../../i18n";
import { registerTrigger } from "./trigger-engine";
import {
  shouldShow,
  wasDismissed,
  recordShown,
  recordDismissed,
} from "./frequency-manager";

interface BannerContext {
  config: PublicWidgetConfig;
  reviews: PublicReview[];
  apiBase: string;
  spb: WidgetSocialProofBanner;
}

// ── Close button SVG ──────────────────────────────────────────────────

function closeSVG(): SVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M18 6L6 18M6 6l12 12");
  svg.appendChild(path);
  return svg;
}

function starFilledSVG(color: string): SVGElement {
  return starSVG(true, color, "#d1d5db");
}

// ── Stars row ─────────────────────────────────────────────────────────

function buildStars(
  rating: number,
  filledColor: string,
  count: number = 5
): HTMLElement {
  const row = el("div");
  for (let i = 1; i <= count; i++) {
    row.appendChild(starSVG(i <= rating, filledColor, "#d1d5db"));
  }
  return row;
}

// ── Close button ──────────────────────────────────────────────────────

function buildCloseButton(
  ctx: BannerContext,
  container: HTMLElement
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "rw-spb-close";
  btn.setAttribute("aria-label", t("dismissBanner"));
  btn.appendChild(closeSVG());
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    container.classList.remove("rw-spb--visible");
    recordDismissed(
      ctx.config.widget_id,
      ctx.spb.frequency ?? "every_visit"
    );
    trackClick(ctx.apiBase, ctx.config.widget_id, "banner_dismiss");
  });
  return btn;
}

// ── Notification Popup ────────────────────────────────────────────────

function buildNotificationCard(
  review: PublicReview,
  filledColor: string
): HTMLElement {
  const card = el("div", "rw-spb-notification rw-spb-notification--enter");

  // Avatar
  const avatar = el("div", "rw-spb-notification__avatar");
  avatar.textContent = getInitials(review.reviewer_name);
  card.appendChild(avatar);

  // Body
  const body = el("div", "rw-spb-notification__body");

  // Header (name + LO)
  const header = el("div", "rw-spb-notification__header");
  const name = text("span", review.reviewer_name ?? "Anonymous", "rw-spb-notification__name");
  header.appendChild(name);
  if (review.loan_officer_name) {
    const lo = text("span", `${t("for")} ${review.loan_officer_name}`, "rw-spb-notification__lo");
    header.appendChild(lo);
  }
  body.appendChild(header);

  // Stars
  const stars = buildStars(review.rating, filledColor);
  stars.className = "rw-spb-notification__stars";
  body.appendChild(stars);

  // Snippet
  if (review.text) {
    const { text: snippet } = truncateText(review.text, 120);
    const snippetEl = text("p", `"${snippet}"`, "rw-spb-notification__snippet");
    body.appendChild(snippetEl);
  }

  card.appendChild(body);
  return card;
}

interface NotificationResult {
  element: HTMLElement;
  stopRotation: () => void;
}

function buildNotification(ctx: BannerContext): NotificationResult {
  const wrapper = el("div");
  wrapper.style.position = "relative";

  const reviews = ctx.reviews.slice(0, 10); // cap rotation pool
  if (reviews.length === 0) return { element: wrapper, stopRotation: () => {} };

  const filledColor =
    ctx.config.config?.theme?.colors?.starFilled ?? "#f59e0b";

  let currentIndex = 0;
  let currentCard = buildNotificationCard(reviews[0], filledColor);
  wrapper.appendChild(currentCard);

  // Click tracking for notification cards
  wrapper.addEventListener("click", (e) => {
    if ((e.target as HTMLElement)?.closest(".rw-spb-close")) return;
    trackClick(ctx.apiBase, ctx.config.widget_id, "banner_click", {
      mode: "notification",
    });
  });

  // Auto-rotate reviews (store intervalId for cleanup)
  let intervalId: ReturnType<typeof setInterval> | null = null;
  if (reviews.length > 1) {
    const interval = ctx.spb.interval ?? 5000;
    const rotate = () => {
      currentCard.className = "rw-spb-notification rw-spb-notification--exit";
      setTimeout(() => {
        currentIndex = (currentIndex + 1) % reviews.length;
        const newCard = buildNotificationCard(reviews[currentIndex], filledColor);
        wrapper.replaceChild(newCard, currentCard);
        currentCard = newCard;
      }, 250);
    };
    intervalId = setInterval(rotate, interval);
  }

  return {
    element: wrapper,
    stopRotation: () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
  };
}

// ── Counter Bar ───────────────────────────────────────────────────────

function buildCounterBar(ctx: BannerContext): HTMLElement {
  const bar = el("div", "rw-spb-counter");

  const profile = ctx.config.entity_profile;
  const avgRating = profile?.average_rating ?? 4.8;
  const totalReviews = profile?.total_reviews ?? 0;

  // Star + rating
  const ratingGroup = el("div", "rw-spb-counter__rating");
  const filledColor =
    ctx.config.config?.theme?.colors?.starFilled ?? "#f59e0b";
  ratingGroup.appendChild(starFilledSVG(filledColor));
  ratingGroup.appendChild(text("span", avgRating.toFixed(1)));
  bar.appendChild(ratingGroup);

  // Text
  const countText = text(
    "span",
    t("averageFrom", { count: totalReviews.toLocaleString() }),
    "rw-spb-counter__text"
  );
  bar.appendChild(countText);

  // CTA
  const ctaText = ctx.spb.ctaText ?? t("readReviews");
  const ctaUrl = ctx.spb.ctaUrl;
  if (ctaUrl && (ctaUrl.startsWith("http://") || ctaUrl.startsWith("https://"))) {
    const cta = document.createElement("a");
    cta.className = "rw-spb-counter__cta";
    cta.textContent = ctaText;
    cta.href = ctaUrl;
    cta.target = "_blank";
    cta.rel = "noopener noreferrer";
    cta.addEventListener("click", () => {
      trackClick(ctx.apiBase, ctx.config.widget_id, "banner_click", {
        mode: "counter_bar",
      });
    });
    bar.appendChild(cta);
  }

  return bar;
}

// ── Floating Badge ────────────────────────────────────────────────────

function buildFloatingBadge(ctx: BannerContext): HTMLElement {
  const badge = el("div", "rw-spb-badge");
  const review = ctx.reviews[0];
  if (!review) return badge;

  const filledColor =
    ctx.config.config?.theme?.colors?.starFilled ?? "#f59e0b";

  // Collapsed view
  const collapsed = el("div", "rw-spb-badge__collapsed");

  const avatar = el("div", "rw-spb-badge__avatar");
  avatar.textContent = getInitials(review.reviewer_name);
  collapsed.appendChild(avatar);

  const info = el("div", "rw-spb-badge__info");
  info.appendChild(
    text("div", review.reviewer_name ?? "Anonymous", "rw-spb-badge__name")
  );
  const ratingRow = buildStars(review.rating, filledColor);
  ratingRow.className = "rw-spb-badge__rating";
  info.appendChild(ratingRow);
  collapsed.appendChild(info);

  badge.appendChild(collapsed);

  // Expanded view (shown on hover)
  const expanded = el("div", "rw-spb-badge__expanded");
  if (review.text) {
    const { text: snippet } = truncateText(review.text, 150);
    expanded.appendChild(
      text("p", `"${snippet}"`, "rw-spb-badge__snippet")
    );
  }
  const dateStr = formatRelativeDate(review.review_date);
  expanded.appendChild(text("span", dateStr, "rw-spb-badge__snippet"));
  badge.appendChild(expanded);

  // Hover expand
  badge.addEventListener("mouseenter", () =>
    badge.classList.add("rw-spb-badge--hover")
  );
  badge.addEventListener("mouseleave", () =>
    badge.classList.remove("rw-spb-badge--hover")
  );

  badge.addEventListener("click", (e) => {
    if ((e.target as HTMLElement)?.closest(".rw-spb-close")) return;
    trackClick(ctx.apiBase, ctx.config.widget_id, "banner_click", {
      mode: "floating_badge",
    });
  });

  badge.style.position = "relative";
  return badge;
}

// ── Public builder ────────────────────────────────────────────────────

export function buildSocialProofBannerDOM(
  config: PublicWidgetConfig,
  reviews: PublicReview[],
  apiBase: string,
  hostRoot: ShadowRoot
): { cleanup: () => void } {
  const spb: WidgetSocialProofBanner = config.config?.socialProofBanner ?? {};
  const widgetId = config.widget_id;
  const frequency = spb.frequency ?? "every_visit";

  // Check frequency & dismissal
  if (!shouldShow(widgetId, frequency) || wasDismissed(widgetId, frequency)) {
    return { cleanup: () => {} };
  }

  const mode = spb.displayMode ?? "notification";
  const placement = spb.placement ?? "bottom-right";
  const animation = spb.animation ?? "slide";
  const zIndex = spb.zIndex ?? 99999;

  const ctx: BannerContext = { config, reviews, apiBase, spb };

  // Build outer container
  const container = el("div", "rw-spb");
  container.classList.add(`rw-spb--${placement}`);
  container.classList.add(`rw-spb--anim-${animation}`);
  container.style.setProperty("--rw-spb-z", String(zIndex));

  // Build mode-specific content
  let stopRotation: (() => void) | null = null;
  switch (mode) {
    case "notification": {
      const result = buildNotification(ctx);
      container.appendChild(result.element);
      stopRotation = result.stopRotation;
      break;
    }
    case "counter_bar":
      container.appendChild(buildCounterBar(ctx));
      break;
    case "floating_badge":
      container.appendChild(buildFloatingBadge(ctx));
      break;
  }

  // Add close button targeting the outer container (single handler, correct target)
  if (spb.dismissable !== false) {
    container.appendChild(buildCloseButton(ctx, container));
  }

  hostRoot.appendChild(container);

  // Register trigger
  const trigger = registerTrigger(
    { type: spb.trigger ?? "immediate", value: spb.triggerValue },
    () => {
      container.classList.add("rw-spb--visible");
      recordShown(widgetId, frequency);
      trackClick(apiBase, widgetId, "impression", { mode });
    }
  );

  return {
    cleanup: () => {
      trigger.destroy();
      stopRotation?.();
      container.remove();
    },
  };
}
