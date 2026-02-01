/**
 * Renders widget content (reviews, header, CTA, branding) into a Shadow DOM root.
 * All DOM construction uses safe methods (createElement/textContent) — no innerHTML.
 */

import type {
  PublicWidgetConfig,
  PublicReview,
  WidgetThemeColors,
  WidgetThemeLayout,
} from "../types";

// ── Helpers ──────────────────────────────────────────────────────────

function el(tag: string, className?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function text(tag: string, content: string, className?: string): HTMLElement {
  const node = el(tag, className);
  node.textContent = content;
  return node;
}

function starSVG(filled: boolean, filledColor: string, emptyColor: string): SVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 20 20");
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("class", `rw-star ${filled ? "rw-star--filled" : "rw-star--empty"}`);
  svg.style.color = filled ? filledColor : emptyColor;

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
  );
  svg.appendChild(path);
  return svg;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0]?.toUpperCase() ?? "?";
}

function truncateText(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max).trimEnd() + "\u2026";
}

// ── Apply theme overrides ───────────────────────────────────────────

function applyTheme(
  root: ShadowRoot,
  colors?: WidgetThemeColors,
  layout?: WidgetThemeLayout
): void {
  const host = root.host as HTMLElement;
  if (colors?.background) host.style.setProperty("--rw-bg", colors.background);
  if (colors?.text) host.style.setProperty("--rw-text", colors.text);
  if (colors?.primary) host.style.setProperty("--rw-primary", colors.primary);
  if (colors?.border) host.style.setProperty("--rw-border", colors.border);
  if (layout?.maxWidth) host.style.maxWidth = layout.maxWidth;
  if (layout?.borderRadius) host.style.setProperty("--rw-radius", layout.borderRadius);
}

// ── Main render ─────────────────────────────────────────────────────

export function renderWidget(
  root: ShadowRoot,
  config: PublicWidgetConfig,
  reviews: PublicReview[]
): void {
  const cfg = config.config;
  const content = cfg?.content;
  const theme = cfg?.theme;
  const colors = theme?.colors;

  // Apply theme CSS custom properties
  applyTheme(root, colors, theme?.layout);

  const container = el("div", "rw-widget");
  container.setAttribute("role", "region");
  container.setAttribute("aria-label", content?.headerText ?? "Customer Reviews");

  // Header
  if (content?.showHeader !== false) {
    const header = el("div", "rw-widget__header");
    header.appendChild(text("h3", content?.headerText ?? "Customer Reviews", "rw-widget__title"));

    if (reviews.length > 0) {
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      header.appendChild(
        text("p", `${avg.toFixed(1)} average from ${reviews.length} reviews`, "rw-widget__subtitle")
      );
    }
    container.appendChild(header);
  }

  // Reviews list
  if (reviews.length === 0) {
    container.appendChild(text("div", "No reviews yet.", "rw-empty"));
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
          meta.appendChild(text("span", formatDate(review.review_date), "rw-review__date"));
        }
        top.appendChild(meta);
        card.appendChild(top);
      }

      // Stars
      const stars = el("div", "rw-review__stars");
      stars.setAttribute("aria-label", `${review.rating} out of 5 stars`);
      for (let i = 1; i <= 5; i++) {
        stars.appendChild(starSVG(i <= review.rating, starFilled, starEmpty));
      }
      card.appendChild(stars);

      // Review text
      if (review.text) {
        const reviewText = truncLen > 0 ? truncateText(review.text, truncLen) : review.text;
        card.appendChild(text("p", reviewText, "rw-review__text"));
      }

      // Source badge
      if (content?.showSource !== false && review.source) {
        card.appendChild(text("span", `via ${review.source}`, "rw-review__source"));
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

  // NMLS disclaimer
  if (content?.showDisclaimer || content?.showNMLS) {
    container.appendChild(
      text(
        "div",
        "NMLS Consumer Access: www.nmlsconsumeraccess.org. Equal Housing Lender.",
        "rw-disclaimer"
      )
    );
  }

  // Branding
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

  root.appendChild(container);
}

export function renderError(root: ShadowRoot, message?: string): void {
  const err = el("div", "rw-error");
  err.setAttribute("role", "alert");
  err.textContent = message ?? "Unable to load reviews. Please try again later.";
  root.appendChild(err);
}
