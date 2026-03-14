/**
 * Review Carousel Widget template — builds the DOM tree for a rotating carousel of reviews.
 * Reuses buildReviewCard from company-review to minimize bundle size.
 * All DOM construction uses safe methods (createElement/textContent) — no innerHTML.
 */

import type { PublicWidgetConfig, PublicReview } from "../../types";
import { trackClick } from "../../core/event-tracker";
import { el, text } from "../../core/dom-helpers";
import { buildComplianceFooter } from "../../components/compliance-footer";
import { t } from "../../i18n";
import { buildReviewCard } from "../company-review/template";
import { CarouselEngine } from "./carousel-engine";
import { applyTransition, type TransitionMode } from "./transitions";

function createArrowSVG(dir: "left" | "right"): SVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", dir === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7");
  svg.appendChild(path);
  return svg;
}

function getResponsiveVisibleCards(configured: number): number {
  if (typeof window === "undefined") return configured;
  const w = window.innerWidth;
  if (w < 480) return 1;
  if (w < 768) return Math.min(configured, 2);
  if (w < 1024) return Math.min(configured, 3);
  return configured;
}

export function buildReviewCarouselDOM(
  config: PublicWidgetConfig,
  reviews: PublicReview[],
  apiBase: string,
): HTMLElement {
  const cfg = config.config;
  const content = cfg?.content;
  const colors = cfg?.theme?.colors;
  const carousel = cfg?.carousel;

  const container = el("div", "rw-carousel");
  container.setAttribute("role", "region");
  container.setAttribute("aria-label", content?.headerText ?? t("customerReviews"));
  container.setAttribute("aria-roledescription", "carousel");

  const starFilled = colors?.starFilled ?? "#f59e0b";
  const starEmpty = colors?.starEmpty ?? "#d1d5db";

  if (content?.showHeader !== false && content?.headerText) {
    const header = el("div", "rw-carousel__header");
    header.appendChild(text("h3", content.headerText, "rw-carousel__title"));
    container.appendChild(header);
  }

  if (reviews.length === 0) {
    container.appendChild(text("div", t("noReviewsYet"), "rw-empty"));
    return container;
  }

  const transitionMode: TransitionMode = carousel?.transition ?? "slide";
  const configuredVisible = carousel?.visibleCards ?? carousel?.slidesPerView ?? 3;
  const visibleCards = getResponsiveVisibleCards(configuredVisible);
  const interval = carousel?.interval ?? 5000;
  const autoplay = carousel?.autoplay !== false;
  const showArrows = carousel?.showArrows !== false;
  const showDots = carousel?.showDots !== false;

  const viewport = el("div", "rw-carousel__viewport");
  const track = el("div", `rw-carousel__track rw-carousel__track--${transitionMode}`);

  if (transitionMode === "fade" || transitionMode === "flip") {
    track.style.gridTemplateColumns = `repeat(${visibleCards}, 1fr)`;
  }

  // Build cards — reuse company-review card builder
  const cardElements: HTMLElement[] = [];
  for (const review of reviews) {
    const cardWrapper = el("div", "rw-carousel__card");
    if (transitionMode === "slide") {
      cardWrapper.style.width = `${100 / visibleCards}%`;
    }
    cardWrapper.setAttribute("aria-roledescription", "slide");
    cardWrapper.appendChild(buildReviewCard(review, config, starFilled, starEmpty, apiBase));
    track.appendChild(cardWrapper);
    cardElements.push(cardWrapper);
  }

  viewport.appendChild(track);

  const engine = new CarouselEngine({
    totalSlides: reviews.length,
    visibleCards,
    interval,
    autoplay,
    onNavigate: (index, direction) => {
      applyTransition(transitionMode, track, cardElements, index, visibleCards);
      updateDots(index);
      updateAriaLabels(index);
      trackClick(apiBase, config, "carousel_navigate", {
        direction,
        index,
        transition: transitionMode,
      });
    },
  });

  applyTransition(transitionMode, track, cardElements, 0, visibleCards);

  // Nav row: [prev] [viewport] [next] — arrows sit outside the carousel
  const navRow = el("div", "rw-carousel__nav");

  if (showArrows && reviews.length > visibleCards) {
    const prevBtn = document.createElement("button");
    prevBtn.className = "rw-carousel__arrow rw-carousel__arrow--prev";
    prevBtn.type = "button";
    prevBtn.setAttribute("aria-label", t("previousReviews"));
    prevBtn.appendChild(createArrowSVG("left"));
    prevBtn.addEventListener("click", () => engine.prev());
    navRow.appendChild(prevBtn);
  }

  navRow.appendChild(viewport);

  if (showArrows && reviews.length > visibleCards) {
    const nextBtn = document.createElement("button");
    nextBtn.className = "rw-carousel__arrow rw-carousel__arrow--next";
    nextBtn.type = "button";
    nextBtn.setAttribute("aria-label", t("nextReviews"));
    nextBtn.appendChild(createArrowSVG("right"));
    nextBtn.addEventListener("click", () => engine.next());
    navRow.appendChild(nextBtn);
  }

  container.appendChild(navRow);

  // Dots
  const dotElements: HTMLButtonElement[] = [];
  const dotCount = engine.maxIndex + 1;

  const updateDots = (index: number): void => {
    for (let i = 0; i < dotElements.length; i++) {
      dotElements[i].classList.toggle("rw-carousel__dot--active", i === index);
      dotElements[i].setAttribute("aria-selected", String(i === index));
    }
  };

  const updateAriaLabels = (index: number): void => {
    for (let i = 0; i < cardElements.length; i++) {
      const inView = i >= index && i < index + visibleCards;
      cardElements[i].setAttribute("aria-hidden", String(!inView));
    }
  };

  updateAriaLabels(0);

  if (showDots && dotCount > 1) {
    const dotsNav = el("div", "rw-carousel__dots");
    dotsNav.setAttribute("role", "tablist");
    dotsNav.setAttribute("aria-label", t("reviewSlides"));

    for (let i = 0; i < dotCount; i++) {
      const dot = document.createElement("button");
      dot.className = `rw-carousel__dot${i === 0 ? " rw-carousel__dot--active" : ""}`;
      dot.type = "button";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", t("goToSlide", { n: i + 1 }));
      dot.setAttribute("aria-selected", String(i === 0));
      dot.addEventListener("click", () => engine.goTo(i, "dot"));
      dotsNav.appendChild(dot);
      dotElements.push(dot);
    }
    container.appendChild(dotsNav);
  }

  // Hover pause
  container.addEventListener("mouseenter", () => engine.pause());
  container.addEventListener("mouseleave", () => engine.resume());

  // Touch/swipe
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;

  viewport.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isSwiping = false;
  }, { passive: true });

  viewport.addEventListener("touchmove", (e) => {
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) isSwiping = true;
  }, { passive: true });

  viewport.addEventListener("touchend", (e) => {
    if (!isSwiping) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      if (dx < 0) engine.next();
      else engine.prev();
    }
  });

  // Keyboard
  container.setAttribute("tabindex", "0");
  container.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); engine.prev(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); engine.next(); }
  });

  engine.observeVisibility(container);
  engine.start();

  // CTA
  if (content?.showCTA && content.ctaText && content.ctaUrl) {
    const ctaWrapper = el("div", "rw-carousel__cta-wrapper");
    const cta = document.createElement("a");
    cta.className = "rw-cta";
    cta.textContent = content.ctaText;
    cta.href = content.ctaUrl;
    cta.target = "_blank";
    cta.rel = "noopener noreferrer";
    if (colors?.primary) cta.style.background = colors.primary;
    cta.addEventListener("click", () => { trackClick(apiBase, config, "click_cta"); });
    ctaWrapper.appendChild(cta);
    container.appendChild(ctaWrapper);
  }

  // Disclaimer
  if (content?.showDisclaimer) {
    container.appendChild(
      buildComplianceFooter({
        classPrefix: "rw-carousel__disclaimer",
        disclaimerText: content.disclaimerText,
      }),
    );
  }

  // Branding
  if (content?.showBranding !== false) {
    const branding = el("div", "rw-carousel__branding");
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
