/**
 * Star Rating Badge Widget template — builds the compact badge DOM.
 * Displays star icons (with partial fill via clip-path), numeric rating,
 * review count, optional entity name, and "Verified by RepWell" branding.
 * The entire badge links to the entity's RepWell profile page.
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

// ── RepWell Icon SVG ────────────────────────────────────────────────

/**
 * Inline RepWell shield/checkmark icon for the "Verified by" line.
 * Avoids external image requests from the embed.
 */
function repwellIconSVG(): SVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("class", "rw-srb__verified-icon");
  svg.setAttribute("aria-hidden", "true");

  // Shield path
  const shield = document.createElementNS("http://www.w3.org/2000/svg", "path");
  shield.setAttribute("d", "M12 2L4 6v5c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z");
  shield.setAttribute("fill", "#52796f");
  shield.setAttribute("opacity", "0.15");
  svg.appendChild(shield);

  // Checkmark path
  const check = document.createElementNS("http://www.w3.org/2000/svg", "path");
  check.setAttribute("d", "M9 12l2 2 4-4");
  check.setAttribute("stroke", "#52796f");
  check.setAttribute("stroke-width", "2");
  check.setAttribute("stroke-linecap", "round");
  check.setAttribute("stroke-linejoin", "round");
  svg.appendChild(check);

  return svg;
}

// ── Profile URL Builder ─────────────────────────────────────────────

function buildProfileUrl(config: PublicWidgetConfig, apiBase: string): string | null {
  const profile = config.entity_profile;
  const entityType = config.entity_type;

  // Use the profile's url field if available
  if (profile?.url) {
    return sanitizeUrl(profile.url);
  }

  // Otherwise build from the API base domain
  try {
    const base = new URL(apiBase);
    const origin = base.origin;

    if (entityType === "user" && config.entity_id) {
      // LO profile pages are at /pro/<slug>
      const slug = profile?.full_name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      if (slug) return `${origin}/pro/${slug}`;
    } else if (entityType === "branch" && config.entity_id) {
      return `${origin}/branch/${config.entity_id}`;
    } else if (entityType === "organization") {
      const orgName = profile?.organization_name;
      const slug = orgName
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      if (slug) return `${origin}/org/${slug}`;
    }
  } catch {
    // Invalid apiBase URL — skip
  }

  return null;
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

  // Build the profile URL — badge always links to the RepWell profile
  const profileUrl = badge?.clickUrl
    ? sanitizeUrl(badge.clickUrl)
    : buildProfileUrl(config, apiBase);

  // Build the badge as a link (always clickable to profile) or div
  let container: HTMLElement;

  if (profileUrl) {
    const link = document.createElement("a");
    link.className = "rw-srb";
    link.href = profileUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.addEventListener("click", () => {
      trackClick(apiBase, config, "click_cta");
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

  // Top section: rating + stars + info
  const topRow = el("div", "rw-srb__top");

  // Numeric rating
  topRow.appendChild(
    text("span", averageRating.toFixed(1), "rw-srb__rating")
  );

  // Stars with partial fill
  topRow.appendChild(
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
    topRow.appendChild(info);
  }

  container.appendChild(topRow);

  // Divider
  container.appendChild(el("div", "rw-srb__divider"));

  // Verified by RepWell branding
  const verifiedRow = el("div", "rw-srb__verified");
  verifiedRow.appendChild(repwellIconSVG());
  const verifiedText = el("span", "rw-srb__verified-text");
  verifiedText.textContent = t("verifiedBy") || "Verified by";
  verifiedRow.appendChild(verifiedText);
  const brandName = el("span", "rw-srb__verified-brand");
  brandName.textContent = " RepWell";
  verifiedRow.appendChild(brandName);
  container.appendChild(verifiedRow);

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
