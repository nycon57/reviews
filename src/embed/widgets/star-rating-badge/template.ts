/**
 * Star Rating Badge Widget template — builds the compact badge DOM.
 * Displays star icons (with partial fill via clip-path), numeric rating,
 * review count, and optional entity name. Supports inline and floating modes.
 * All DOM construction uses safe methods (createElement/textContent) — no innerHTML.
 */

import type { PublicWidgetConfig, WidgetBadge } from "../../types";
import { el, text, starSVG } from "../../core/dom-helpers";
import { trackClick } from "../../core/event-tracker";
import { t, tp } from "../../i18n";

// ── Partial Star Helper ─────────────────────────────────────────────

/**
 * Creates a star pair: an empty star underneath and a filled star clipped
 * to `fraction` (0–1) on top, achieving smooth partial-star rendering.
 */
function partialStar(
  fraction: number,
  filledColor: string,
  emptyColor: string
): HTMLElement {
  const pair = el("span", "rw-srb__star-pair");
  pair.setAttribute("aria-hidden", "true");

  // Empty star (background layer) — starSVG(false) already sets rw-star--empty
  const empty = starSVG(false, filledColor, emptyColor);
  pair.appendChild(empty);

  // Filled star clipped to the fraction — swap class to rw-star--partial for CSS targeting
  const filled = starSVG(true, filledColor, emptyColor);
  filled.classList.replace("rw-star--filled", "rw-star--partial");
  filled.style.clipPath = `inset(0 ${((1 - fraction) * 100).toFixed(1)}% 0 0)`;
  pair.appendChild(filled);

  return pair;
}

/**
 * Builds a stars row with fractional support.
 * e.g., rating=4.3 → 4 full stars + 1 star at 30% fill.
 */
function buildStarsRow(
  rating: number,
  filledColor: string,
  emptyColor: string
): HTMLElement {
  const row = el("div", "rw-srb__stars");
  row.setAttribute("aria-hidden", "true");

  const fullCount = Math.floor(rating);
  const fraction = rating - fullCount;

  for (let i = 0; i < 5; i++) {
    if (i < fullCount) {
      // Full star
      row.appendChild(starSVG(true, filledColor, emptyColor));
    } else if (i === fullCount && fraction > 0.05) {
      // Partial star (skip if fraction is negligible)
      row.appendChild(partialStar(fraction, filledColor, emptyColor));
    } else {
      // Empty star
      row.appendChild(starSVG(false, filledColor, emptyColor));
    }
  }

  return row;
}

// ── URL Sanitization ─────────────────────────────────────────────────

/** Only allow http/https URLs to prevent javascript: and data: injection. */
function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Floating Mode Setup ─────────────────────────────────────────────

function applyFloatingMode(
  host: HTMLElement,
  badge: WidgetBadge
): void {
  host.classList.add("rw-srb-floating");

  const pos = badge.floatPosition ?? "bottom-right";
  host.classList.add(`rw-srb-float--${pos}`);

  // Custom offsets
  if (badge.floatOffsetX != null) {
    const isRight = pos.includes("right");
    host.style.setProperty(isRight ? "right" : "left", `${badge.floatOffsetX}px`);
  }
  if (badge.floatOffsetY != null) {
    const isBottom = pos.includes("bottom");
    host.style.setProperty(isBottom ? "bottom" : "top", `${badge.floatOffsetY}px`);
  }
  if (badge.floatZIndex != null) {
    host.style.zIndex = String(badge.floatZIndex);
  }

  // Animation
  const anim = badge.floatAnimation ?? "fade";
  if (anim !== "none") {
    host.classList.add(`rw-srb-anim--${anim}`);
  }
}

// ── Auto-Refresh ────────────────────────────────────────────────────

const REFRESH_INTERVALS: Record<string, number> = {
  "1hr": 3_600_000,
  "6hr": 21_600_000,
  "24hr": 86_400_000,
};

// ── Main Builder ────────────────────────────────────────────────────

/**
 * Builds the Star Rating Badge widget DOM.
 * Returns the badge element and optionally sets up floating mode on the host.
 */
export function buildStarRatingBadgeDOM(
  config: PublicWidgetConfig,
  apiBase: string,
  shadowRoot: ShadowRoot
): HTMLElement {
  const cfg = config.config;
  const colors = cfg?.theme?.colors;
  const badge = cfg?.badge;
  const profile = config.entity_profile;

  const starFilled = colors?.starFilled ?? "#f59e0b";
  const starEmpty = colors?.starEmpty ?? "#d1d5db";

  const averageRating = profile?.average_rating ?? 0;
  const totalReviews = profile?.total_reviews ?? 0;
  const entityName =
    profile?.organization_name ?? profile?.full_name ?? null;

  // Determine if floating
  const isFloating = badge?.placement === "floating";
  if (isFloating) {
    applyFloatingMode(shadowRoot.host as HTMLElement, badge!);
  }

  // Build the badge as a link or div
  const safeUrl = badge?.clickUrl ? sanitizeUrl(badge.clickUrl) : null;
  let container: HTMLElement;

  if (safeUrl) {
    const link = document.createElement("a");
    link.className = "rw-srb";
    link.href = safeUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.addEventListener("click", () => {
      trackClick(apiBase, config.widget_id, "click_cta");
    });
    container = link;
  } else {
    container = el("div", "rw-srb");
  }

  // Accessible label
  container.setAttribute("role", "img");
  container.setAttribute(
    "aria-label",
    tp("ratedAriaLabel", totalReviews, { rating: averageRating.toFixed(1), count: totalReviews }),
  );

  // Apply badge dimensions
  if (badge?.width) container.style.width = badge.width;
  if (badge?.height) container.style.height = badge.height;

  // Numeric rating
  container.appendChild(
    text("span", averageRating.toFixed(1), "rw-srb__rating")
  );

  // Stars with partial fill
  container.appendChild(
    buildStarsRow(averageRating, starFilled, starEmpty)
  );

  // Info section (count + optional name)
  const showName = badge?.showName !== false;
  if (totalReviews > 0 || (showName && entityName)) {
    const info = el("div", "rw-srb__info");
    if (showName && entityName) {
      info.appendChild(text("span", entityName, "rw-srb__name"));
    }
    if (totalReviews > 0) {
      info.appendChild(
        text(
          "span",
          `${totalReviews} ${totalReviews === 1 ? t("review") : t("reviews")}`,
          "rw-srb__count"
        )
      );
    }
    container.appendChild(info);
  }

  // Auto-refresh via setTimeout
  const interval = badge?.refreshInterval ?? "never";
  const refreshMs = REFRESH_INTERVALS[interval];
  if (refreshMs && typeof window !== "undefined" && window.RepWell) {
    setTimeout(() => {
      window.RepWell.refresh(config.widget_id);
    }, refreshMs);
  }

  return container;
}
