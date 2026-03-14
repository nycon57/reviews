/**
 * Review Wall Widget template — builds the DOM tree for a masonry grid of reviews.
 * Reuses buildReviewCard from company-review to minimize bundle size.
 * All DOM construction uses safe methods (createElement/textContent) — no innerHTML.
 */

import type { PublicWidgetConfig, PublicReview } from "../../types";
import { trackClick } from "../../core/event-tracker";
import { el, text } from "../../core/dom-helpers";
import { buildComplianceFooter } from "../../components/compliance-footer";
import { buildReviewCard } from "../company-review/template";
import { t } from "../../i18n";

// ── Scroll Depth Tracking ───────────────────────────────────────────

const DEPTH_THRESHOLDS = [25, 50, 75, 100];

function setupScrollDepthTracking(
  wrapper: HTMLElement,
  apiBase: string,
  config: PublicWidgetConfig,
): IntersectionObserver {
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
          trackClick(apiBase, config, "scroll_depth", {
            depth_percent: depth,
          });
          observer.unobserve(entry.target);

          // Disconnect once all thresholds tracked
          if (tracked.size === DEPTH_THRESHOLDS.length) {
            observer.disconnect();
          }
        }
      }
    },
    { root: null, threshold: 0.1 },
  );

  const sentinels = wrapper.querySelectorAll(".rw-wall__depth-sentinel");
  for (const s of sentinels) {
    observer.observe(s);
  }

  return observer;
}

// ── Infinite Scroll ─────────────────────────────────────────────────

function setupInfiniteScroll(
  sentinel: HTMLElement,
  onLoadMore: () => void,
): IntersectionObserver {
  let loading = false;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !loading) {
          loading = true;
          onLoadMore();
          // Reset flag after a frame to batch DOM updates
          requestAnimationFrame(() => {
            loading = false;
          });
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
    content?.headerText ?? t("reviewWall"),
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
      text("div", t("noReviewsYet"), "rw-empty"),
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

      // Track click on card (analytics-only, not primary interaction)
      cardWrapper.addEventListener("click", () => {
        trackClick(apiBase, config, "click_review", {
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

  // Scroll depth tracking (store observer for cleanup)
  const depthObserver = setupScrollDepthTracking(wrapper, apiBase, config);

  container.appendChild(wrapper);

  // Track observers for cleanup when widget is removed from DOM
  let scrollObserver: IntersectionObserver | null = null;

  // Load more / infinite scroll
  if (reviews.length > perPage) {
    if (loadMoreMode === "button") {
      const loadMoreBtn = document.createElement("button");
      loadMoreBtn.className = "rw-wall__load-more";
      loadMoreBtn.textContent = t("loadMore");
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

      scrollObserver = setupInfiniteScroll(sentinel, () => {
        if (visibleCount >= reviews.length) return;
        const prevCount = visibleCount;
        visibleCount = Math.min(
          visibleCount + perPage,
          reviews.length,
        );
        appendCards(prevCount);

        // Stop observing once all reviews loaded
        if (visibleCount >= reviews.length && scrollObserver) {
          scrollObserver.disconnect();
          scrollObserver = null;
        }
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
      trackClick(apiBase, config, "click_cta");
    });
    ctaWrapper.appendChild(cta);
    container.appendChild(ctaWrapper);
  }

  // Disclaimer
  if (content?.showDisclaimer) {
    container.appendChild(
      buildComplianceFooter({
        classPrefix: "rw-wall__disclaimer",
        disclaimerText: content.disclaimerText,
      }),
    );
  }

  // Branding
  if (content?.showBranding !== false) {
    const branding = el("div", "rw-wall__branding");
    branding.textContent = `${t("poweredBy")} `;
    const link = document.createElement("a");
    link.href = "https://repwell.com";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "RepWell";
    branding.appendChild(link);
    container.appendChild(branding);
  }

  // Cleanup observers when container is removed from DOM.
  // Uses MutationObserver on the parent to detect removal.
  const resizeHandler = (): void => {
    // Re-position depth sentinels after layout change
    const sentinels = wrapper.querySelectorAll(
      ".rw-wall__depth-sentinel",
    );
    for (const s of sentinels) {
      (s as HTMLElement).style.top = `${(s as HTMLElement).dataset.depth}%`;
    }
  };

  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  const debouncedResize = (): void => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeHandler, 150);
  };

  window.addEventListener("resize", debouncedResize);

  // Cleanup when the widget container is disconnected from the DOM
  const cleanupObserver = new MutationObserver(() => {
    if (!container.isConnected) {
      window.removeEventListener("resize", debouncedResize);
      if (resizeTimer) clearTimeout(resizeTimer);
      depthObserver.disconnect();
      scrollObserver?.disconnect();
      cleanupObserver.disconnect();
    }
  });

  // Observe the parent (Shadow DOM host) for removals
  requestAnimationFrame(() => {
    const parent = container.parentNode;
    if (parent) {
      cleanupObserver.observe(parent, { childList: true });
    }
  });

  return container;
}
