/**
 * Review Wall Widget template — builds the DOM tree for a masonry grid of reviews.
 * Reuses buildReviewCard from company-review to minimize bundle size.
 * All DOM construction uses safe methods (createElement/textContent) — no innerHTML.
 */

import type { PublicWidgetConfig, PublicReview } from "../../types";
import { trackClick } from "../../core/event-tracker";
import { el, text } from "../../core/dom-helpers";
import { buildReviewCard } from "../company-review/template";

// ── Scroll Depth Tracking ───────────────────────────────────────────

const DEPTH_THRESHOLDS = [25, 50, 75, 100];

function setupScrollDepthTracking(
  wrapper: HTMLElement,
  apiBase: string,
  widgetId: string,
): void {
  const tracked = new Set<number>();

  for (const pct of DEPTH_THRESHOLDS) {
    const sentinel = el("div", "rw-wall__depth-sentinel");
    sentinel.style.top = `${pct}%`;
    sentinel.setAttribute("data-depth", String(pct));
    wrapper.appendChild(sentinel);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const depth = Number(
          (entry.target as HTMLElement).dataset.depth,
        );
        if (depth && !tracked.has(depth)) {
          tracked.add(depth);
          trackClick(apiBase, widgetId, "scroll_depth", {
            depth_percent: depth,
          });
          observer.unobserve(entry.target);
        }
      }
    },
    { root: null, threshold: 0.1 },
  );

  const sentinels = wrapper.querySelectorAll(".rw-wall__depth-sentinel");
  for (const s of sentinels) {
    observer.observe(s);
  }
}

// ── Infinite Scroll ─────────────────────────────────────────────────

function setupInfiniteScroll(
  sentinel: HTMLElement,
  onLoadMore: () => void,
): IntersectionObserver {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          onLoadMore();
        }
      }
    },
    { root: null, rootMargin: "200px", threshold: 0 },
  );

  observer.observe(sentinel);
  return observer;
}

// ── Main Builder ────────────────────────────────────────────────────

export function buildReviewWallDOM(
  config: PublicWidgetConfig,
  reviews: PublicReview[],
  apiBase: string,
): HTMLElement {
  const cfg = config.config;
  const content = cfg?.content;
  const colors = cfg?.theme?.colors;
  const wall = cfg?.wall;
  const filters = cfg?.filters;

  const container = el("div", "rw-wall");
  container.setAttribute("role", "region");
  container.setAttribute(
    "aria-label",
    content?.headerText ?? "Review Wall",
  );

  const starFilled = colors?.starFilled ?? "#f59e0b";
  const starEmpty = colors?.starEmpty ?? "#d1d5db";

  // Header
  if (content?.showHeader !== false && content?.headerText) {
    const header = el("div", "rw-wall__header");
    header.appendChild(
      text("h3", content.headerText, "rw-wall__title"),
    );
    container.appendChild(header);
  }

  // Empty state
  if (reviews.length === 0) {
    container.appendChild(
      text("div", "No reviews yet.", "rw-empty"),
    );
    return container;
  }

  // Set CSS custom properties for column count
  const columns = Math.min(Math.max(wall?.columns ?? 3, 2), 5);
  const columnsTablet = Math.min(
    Math.max(wall?.columnsTablet ?? Math.min(columns, 2), 1),
    3,
  );
  const columnsMobile = wall?.columnsMobile ?? 1;
  const gap = wall?.gap ?? 16;

  container.style.setProperty("--rw-wall-columns", String(columns));
  container.style.setProperty(
    "--rw-wall-columns-tablet",
    String(columnsTablet),
  );
  container.style.setProperty(
    "--rw-wall-columns-mobile",
    String(columnsMobile),
  );
  container.style.setProperty("--rw-wall-gap", `${gap}px`);

  // Configure truncation
  const shouldTruncate = wall?.truncateReviews === true;
  const truncateLength = wall?.truncateLength ?? 0;

  // Build a config overlay that disables truncation by default
  const cardConfig: PublicWidgetConfig = shouldTruncate
    ? {
        ...config,
        config: {
          ...cfg,
          content: {
            ...content,
            truncateLength: truncateLength || 200,
          },
        },
      }
    : {
        ...config,
        config: {
          ...cfg,
          content: { ...content, truncateLength: 0 },
        },
      };

  // Determine load more mode
  const loadMoreMode = wall?.loadMore ?? "button";
  const perPage = content?.reviewsPerPage ?? 12;
  const featuredOnly = filters?.featuredOnly ?? false;

  // Grid wrapper (for scroll depth positioning)
  const wrapper = el("div", "rw-wall__grid-wrapper");
  const grid = el("div", "rw-wall__grid");

  let visibleCount = Math.min(perPage, reviews.length);

  /** Append cards starting from `fromIndex` up to `visibleCount`. */
  const appendCards = (fromIndex: number): void => {
    for (let i = fromIndex; i < visibleCount; i++) {
      const review = reviews[i];
      const cardWrapper = el("div", "rw-wall__card");

      // Featured card emphasis: accent border + gradient background
      if (featuredOnly || (review.rating === 5 && review.text && review.text.length > 100)) {
        cardWrapper.classList.add("rw-wall__card--featured");
      }

      cardWrapper.appendChild(
        buildReviewCard(
          review,
          cardConfig,
          starFilled,
          starEmpty,
          apiBase,
        ),
      );

      // Track click on card
      cardWrapper.addEventListener("click", () => {
        trackClick(apiBase, config.widget_id, "click_review", {
          review_id: review.id,
        });
      });

      // Animate cards added after initial render
      if (fromIndex > 0) {
        cardWrapper.classList.add("rw-wall__card--new");
      }

      grid.appendChild(cardWrapper);
    }
  };

  appendCards(0);
  wrapper.appendChild(grid);

  // Scroll depth tracking
  setupScrollDepthTracking(wrapper, apiBase, config.widget_id);

  container.appendChild(wrapper);

  // Load more / infinite scroll
  if (reviews.length > perPage) {
    if (loadMoreMode === "button") {
      const loadMoreBtn = document.createElement("button");
      loadMoreBtn.className = "rw-wall__load-more";
      loadMoreBtn.textContent = "Load More Reviews";
      loadMoreBtn.type = "button";
      loadMoreBtn.addEventListener("click", () => {
        const prevCount = visibleCount;
        visibleCount = Math.min(
          visibleCount + perPage,
          reviews.length,
        );
        appendCards(prevCount);

        if (visibleCount >= reviews.length) {
          loadMoreBtn.style.display = "none";
        }
      });
      container.appendChild(loadMoreBtn);
    } else if (loadMoreMode === "scroll") {
      const sentinel = el("div", "rw-wall__sentinel");
      container.appendChild(sentinel);

      setupInfiniteScroll(sentinel, () => {
        if (visibleCount >= reviews.length) return;
        const prevCount = visibleCount;
        visibleCount = Math.min(
          visibleCount + perPage,
          reviews.length,
        );
        appendCards(prevCount);
      });
    }
  }

  // CTA
  if (content?.showCTA && content.ctaText && content.ctaUrl) {
    const ctaWrapper = el("div", "rw-wall__cta-wrapper");
    const cta = document.createElement("a");
    cta.className = "rw-cta";
    cta.textContent = content.ctaText;
    cta.href = content.ctaUrl;
    cta.target = "_blank";
    cta.rel = "noopener noreferrer";
    if (colors?.primary) cta.style.background = colors.primary;
    cta.addEventListener("click", () => {
      trackClick(apiBase, config.widget_id, "click_cta");
    });
    ctaWrapper.appendChild(cta);
    container.appendChild(ctaWrapper);
  }

  // Disclaimer
  if (content?.showDisclaimer) {
    const disclaimer = el("div", "rw-wall__disclaimer");
    const ehlLabel = el("div", "rw-wall__disclaimer-ehl");
    ehlLabel.textContent = "Equal Housing Lender";
    disclaimer.appendChild(ehlLabel);
    disclaimer.appendChild(
      text(
        "div",
        content.disclaimerText ||
          "This is not a commitment to lend. Programs, rates, terms, and conditions are subject to change without notice.",
        "rw-wall__disclaimer-text",
      ),
    );
    const nmlsLink = document.createElement("a");
    nmlsLink.className = "rw-wall__disclaimer-nmls";
    nmlsLink.href = "https://www.nmlsconsumeraccess.org";
    nmlsLink.target = "_blank";
    nmlsLink.rel = "noopener noreferrer";
    nmlsLink.textContent = "NMLS Consumer Access";
    disclaimer.appendChild(nmlsLink);
    container.appendChild(disclaimer);
  }

  // Branding
  if (content?.showBranding !== false) {
    const branding = el("div", "rw-wall__branding");
    branding.textContent = "Powered by ";
    const link = document.createElement("a");
    link.href = "https://repwell.com";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "RepWell";
    branding.appendChild(link);
    container.appendChild(branding);
  }

  // Recalculate masonry on resize (CSS columns handles this natively,
  // but we re-trigger scroll depth sentinel positions)
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  window.addEventListener("resize", () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Re-position depth sentinels
      const sentinels = wrapper.querySelectorAll(
        ".rw-wall__depth-sentinel",
      );
      for (const s of sentinels) {
        (s as HTMLElement).style.top = `${(s as HTMLElement).dataset.depth}%`;
      }
    }, 150);
  });

  return container;
}
