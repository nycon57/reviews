"use strict";
(() => {
  // src/embed/core/discovery.ts
  var WIDGET_SELECTOR = "[data-repwell-widget]";
  function discoverWidgets() {
    const elements = document.querySelectorAll(WIDGET_SELECTOR);
    const widgets = [];
    for (const element of elements) {
      if (element.hasAttribute("data-repwell-initialized")) continue;
      const widgetId = element.getAttribute("data-repwell-widget");
      if (!widgetId) {
        console.warn("[RepWell] Element has data-repwell-widget but no value:", element);
        continue;
      }
      widgets.push({ element, widgetId });
    }
    return widgets;
  }

  // src/embed/styles/base.ts
  var BASE_STYLES = (
    /* css */
    `
  :host {
    display: block;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: #1a1a2e;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* \u2500\u2500 Skeleton shimmer \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

  .rw-skeleton {
    padding: 16px;
  }

  .rw-skeleton__header {
    margin-bottom: 16px;
  }

  .rw-skeleton__cards {
    display: flex;
    gap: 16px;
  }

  .rw-skeleton__card {
    flex: 1;
    padding: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .rw-shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: rw-shimmer 1.5s ease-in-out infinite;
    border-radius: 4px;
  }

  @keyframes rw-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* \u2500\u2500 Widget container \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

  .rw-widget {
    padding: 16px;
  }

  .rw-widget__header {
    margin-bottom: 16px;
  }

  .rw-widget__title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .rw-widget__subtitle {
    font-size: 13px;
    color: #6b7280;
  }

  /* \u2500\u2500 Review cards \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

  .rw-reviews {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .rw-review {
    padding: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
    transition: box-shadow 0.15s ease;
  }

  .rw-review:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .rw-review__top {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .rw-review__avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
    color: #6b7280;
    flex-shrink: 0;
  }

  .rw-review__meta {
    flex: 1;
    min-width: 0;
  }

  .rw-review__name {
    font-weight: 600;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rw-review__date {
    font-size: 12px;
    color: #9ca3af;
  }

  .rw-review__stars {
    display: flex;
    gap: 2px;
    margin-bottom: 8px;
  }

  .rw-star {
    width: 16px;
    height: 16px;
  }

  .rw-star--filled {
    color: #f59e0b;
  }

  .rw-star--empty {
    color: #d1d5db;
  }

  .rw-review__text {
    font-size: 14px;
    line-height: 1.6;
    color: #374151;
  }

  .rw-review__source {
    margin-top: 8px;
    font-size: 11px;
    color: #9ca3af;
    text-transform: capitalize;
  }

  /* \u2500\u2500 CTA \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

  .rw-cta {
    display: inline-block;
    margin-top: 16px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    color: #fff;
    background: #2563eb;
    border: none;
    border-radius: 6px;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .rw-cta:hover {
    background: #1d4ed8;
  }

  /* \u2500\u2500 Branding \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

  .rw-branding {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #f3f4f6;
    font-size: 11px;
    color: #9ca3af;
    text-align: center;
  }

  .rw-branding a {
    color: #6b7280;
    text-decoration: none;
  }

  .rw-branding a:hover {
    text-decoration: underline;
  }

  /* \u2500\u2500 Disclaimer (NMLS) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

  .rw-disclaimer {
    margin-top: 12px;
    padding: 8px 12px;
    font-size: 11px;
    line-height: 1.4;
    color: #6b7280;
    background: #f9fafb;
    border-radius: 4px;
  }

  /* \u2500\u2500 Error fallback \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

  .rw-error {
    padding: 24px 16px;
    text-align: center;
    color: #6b7280;
    font-size: 13px;
  }

  /* \u2500\u2500 Empty state \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

  .rw-empty {
    padding: 32px 16px;
    text-align: center;
    color: #9ca3af;
    font-size: 14px;
  }
`
  );

  // src/embed/core/shadow-dom.ts
  function attachShadow(host) {
    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = BASE_STYLES;
    shadow.appendChild(style);
    return shadow;
  }

  // src/embed/core/lazy-loader.ts
  var callbacks = /* @__PURE__ */ new Map();
  var observer = null;
  function getObserver() {
    if (observer) return observer;
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const cb = callbacks.get(entry.target);
            observer.unobserve(entry.target);
            callbacks.delete(entry.target);
            cb == null ? void 0 : cb();
          }
        }
      },
      { rootMargin: "200px" }
    );
    return observer;
  }
  function observe(element, onVisible) {
    if (typeof IntersectionObserver === "undefined") {
      onVisible();
      return;
    }
    callbacks.set(element, onVisible);
    getObserver().observe(element);
  }
  function unobserve(element) {
    callbacks.delete(element);
    observer == null ? void 0 : observer.unobserve(element);
  }

  // src/embed/core/skeleton.ts
  var SKELETON_HEIGHT = "280px";
  function createShimmer(width, height, marginBottom) {
    const el2 = document.createElement("div");
    el2.className = "rw-shimmer";
    el2.style.width = width;
    el2.style.height = height;
    if (marginBottom) el2.style.marginBottom = marginBottom;
    return el2;
  }
  function createSkeletonCard() {
    const card = document.createElement("div");
    card.className = "rw-skeleton__card";
    card.appendChild(createShimmer("120px", "16px", "8px"));
    card.appendChild(createShimmer("80px", "12px", "12px"));
    card.appendChild(createShimmer("100%", "12px", "6px"));
    card.appendChild(createShimmer("90%", "12px", "6px"));
    card.appendChild(createShimmer("70%", "12px"));
    return card;
  }
  function renderSkeleton(root) {
    const wrapper = document.createElement("div");
    wrapper.className = "rw-skeleton";
    wrapper.setAttribute("aria-busy", "true");
    wrapper.setAttribute("aria-label", "Loading reviews");
    wrapper.style.height = SKELETON_HEIGHT;
    wrapper.style.overflow = "hidden";
    const header = document.createElement("div");
    header.className = "rw-skeleton__header";
    header.appendChild(createShimmer("60%", "24px", "12px"));
    header.appendChild(createShimmer("40%", "16px"));
    wrapper.appendChild(header);
    const cards = document.createElement("div");
    cards.className = "rw-skeleton__cards";
    cards.appendChild(createSkeletonCard());
    cards.appendChild(createSkeletonCard());
    wrapper.appendChild(cards);
    root.appendChild(wrapper);
  }
  function removeSkeleton(root) {
    const el2 = root.querySelector(".rw-skeleton");
    if (el2) el2.remove();
  }

  // src/embed/widgets/registry.ts
  var registry = /* @__PURE__ */ new Map();
  function registerWidget(type, renderer) {
    registry.set(type, renderer);
  }
  function getWidgetRenderer(type) {
    var _a;
    return (_a = registry.get(type)) != null ? _a : null;
  }

  // src/embed/core/dom-helpers.ts
  var STAR_PATH = "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";
  function el(tag, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }
  function text(tag, content, className) {
    const node = el(tag, className);
    node.textContent = content;
    return node;
  }
  function starSVG(filled, filledColor, emptyColor) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 20 20");
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute("class", `rw-star ${filled ? "rw-star--filled" : "rw-star--empty"}`);
    svg.setAttribute("aria-hidden", "true");
    svg.style.color = filled ? filledColor : emptyColor;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", STAR_PATH);
    svg.appendChild(path);
    return svg;
  }
  function getInitials(name) {
    var _a, _b;
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (_b = (_a = parts[0][0]) == null ? void 0 : _a.toUpperCase()) != null ? _b : "?";
  }
  function truncateText(str, max) {
    if (str.length <= max) return { text: str, truncated: false };
    return { text: str.slice(0, max).trimEnd() + "\u2026", truncated: true };
  }
  function formatAbsoluteDate(dateStr) {
    try {
      return new Date(dateStr).toLocaleDateString(void 0, {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  }
  function formatRelativeDate(dateStr) {
    try {
      const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 864e5);
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    } catch (e) {
      return dateStr;
    }
  }
  function applyTheme(root, colors, layout) {
    const host = root.host;
    if (colors == null ? void 0 : colors.background) host.style.setProperty("--rw-bg", colors.background);
    if (colors == null ? void 0 : colors.text) host.style.setProperty("--rw-text", colors.text);
    if (colors == null ? void 0 : colors.primary) host.style.setProperty("--rw-primary", colors.primary);
    if (colors == null ? void 0 : colors.border) host.style.setProperty("--rw-border", colors.border);
    if (layout == null ? void 0 : layout.maxWidth) host.style.maxWidth = layout.maxWidth;
    if (layout == null ? void 0 : layout.borderRadius) host.style.setProperty("--rw-radius", layout.borderRadius);
  }

  // src/embed/core/renderer.ts
  function renderWidget(root, config, reviews, apiBase) {
    var _a, _b, _c, _d, _e;
    const typeRenderer = getWidgetRenderer(config.widget_type);
    if (typeRenderer && apiBase) {
      typeRenderer(root, config, reviews, apiBase);
      return;
    }
    const cfg = config.config;
    const content = cfg == null ? void 0 : cfg.content;
    const theme = cfg == null ? void 0 : cfg.theme;
    const colors = theme == null ? void 0 : theme.colors;
    applyTheme(root, colors, theme == null ? void 0 : theme.layout);
    const container = el("div", "rw-widget");
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", (_a = content == null ? void 0 : content.headerText) != null ? _a : "Customer Reviews");
    if ((content == null ? void 0 : content.showHeader) !== false) {
      const header = el("div", "rw-widget__header");
      header.appendChild(text("h3", (_b = content == null ? void 0 : content.headerText) != null ? _b : "Customer Reviews", "rw-widget__title"));
      if (reviews.length > 0) {
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        header.appendChild(
          text("p", `${avg.toFixed(1)} average from ${reviews.length} reviews`, "rw-widget__subtitle")
        );
      }
      container.appendChild(header);
    }
    if (reviews.length === 0) {
      container.appendChild(text("div", "No reviews yet.", "rw-empty"));
    } else {
      const list = el("div", "rw-reviews");
      const starFilled = (_c = colors == null ? void 0 : colors.starFilled) != null ? _c : "#f59e0b";
      const starEmpty = (_d = colors == null ? void 0 : colors.starEmpty) != null ? _d : "#d1d5db";
      const truncLen = (_e = content == null ? void 0 : content.truncateLength) != null ? _e : 300;
      for (const review of reviews) {
        const card = el("div", "rw-review");
        if ((content == null ? void 0 : content.showAvatar) !== false || review.reviewer_name) {
          const top = el("div", "rw-review__top");
          if ((content == null ? void 0 : content.showAvatar) !== false) {
            top.appendChild(text("div", getInitials(review.reviewer_name), "rw-review__avatar"));
          }
          const meta = el("div", "rw-review__meta");
          if (review.reviewer_name) {
            meta.appendChild(text("span", review.reviewer_name, "rw-review__name"));
          }
          if ((content == null ? void 0 : content.showDate) !== false && review.review_date) {
            meta.appendChild(text("span", formatAbsoluteDate(review.review_date), "rw-review__date"));
          }
          top.appendChild(meta);
          card.appendChild(top);
        }
        const stars = el("div", "rw-review__stars");
        stars.setAttribute("aria-label", `${review.rating} out of 5 stars`);
        for (let i = 1; i <= 5; i++) {
          stars.appendChild(starSVG(i <= review.rating, starFilled, starEmpty));
        }
        card.appendChild(stars);
        if (review.text) {
          const { text: reviewText } = truncLen > 0 ? truncateText(review.text, truncLen) : { text: review.text };
          card.appendChild(text("p", reviewText, "rw-review__text"));
        }
        if ((content == null ? void 0 : content.showSource) !== false && review.source) {
          card.appendChild(text("span", `via ${review.source}`, "rw-review__source"));
        }
        list.appendChild(card);
      }
      container.appendChild(list);
    }
    if ((content == null ? void 0 : content.showCTA) && content.ctaText && content.ctaUrl) {
      const cta = document.createElement("a");
      cta.className = "rw-cta";
      cta.textContent = content.ctaText;
      cta.href = content.ctaUrl;
      cta.target = "_blank";
      cta.rel = "noopener noreferrer";
      if (colors == null ? void 0 : colors.primary) cta.style.background = colors.primary;
      container.appendChild(cta);
    }
    if ((content == null ? void 0 : content.showDisclaimer) || (content == null ? void 0 : content.showNMLS)) {
      container.appendChild(
        text(
          "div",
          "NMLS Consumer Access: www.nmlsconsumeraccess.org. Equal Housing Lender.",
          "rw-disclaimer"
        )
      );
    }
    if ((content == null ? void 0 : content.showBranding) !== false) {
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
  function renderError(root, message) {
    const err = el("div", "rw-error");
    err.setAttribute("role", "alert");
    err.textContent = message != null ? message : "Unable to load reviews. Please try again later.";
    root.appendChild(err);
  }

  // src/embed/core/api-client.ts
  var REQUEST_TIMEOUT_MS = 1e4;
  function buildUrl(apiBase, widgetId, path) {
    return `${apiBase}/api/v1/widgets/${encodeURIComponent(widgetId)}/${path}`;
  }
  async function request(url, signal) {
    const controller = new AbortController();
    const onExternalAbort = () => controller.abort();
    signal.addEventListener("abort", onExternalAbort, { once: true });
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" }
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    } finally {
      clearTimeout(timeoutId);
      signal.removeEventListener("abort", onExternalAbort);
    }
  }
  function fetchConfig(apiBase, widgetId, signal) {
    return request(buildUrl(apiBase, widgetId, "config"), signal);
  }
  function fetchReviews(apiBase, widgetId, signal, limit = 10, cursor) {
    let url = buildUrl(apiBase, widgetId, "reviews") + `?limit=${limit}`;
    if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
    return request(url, signal);
  }
  function sendEvent(apiBase, widgetId, eventType, metadata) {
    const url = buildUrl(apiBase, widgetId, "events");
    const body = JSON.stringify({
      event_type: eventType,
      page_url: location.href,
      referrer: document.referrer || null,
      metadata: metadata != null ? metadata : null
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    } else {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true
      }).catch(() => {
      });
    }
  }

  // src/embed/core/event-tracker.ts
  var sessionId = null;
  function getSessionId() {
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    }
    return sessionId;
  }
  function trackImpression(apiBase, widgetId) {
    sendEvent(apiBase, widgetId, "impression", { session_id: getSessionId() });
  }
  function trackClick(apiBase, widgetId, eventType, metadata) {
    sendEvent(apiBase, widgetId, eventType, {
      ...metadata,
      session_id: getSessionId()
    });
  }

  // src/embed/widgets/lo-review/styles.ts
  var LO_REVIEW_STYLES = (
    /* css */
    `
  .rw-lo-profile {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    margin-bottom: 16px;
    background: var(--rw-bg, #fff);
    border: 1px solid var(--rw-border, #e5e7eb);
    border-radius: var(--rw-radius, 8px);
  }

  .rw-lo-profile__photo {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    background: #e5e7eb;
  }

  .rw-lo-profile__photo-placeholder {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--rw-primary, #52796f);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .rw-lo-profile__info { flex: 1; min-width: 0; }

  .rw-lo-profile__name {
    font-size: 18px;
    font-weight: 700;
    color: var(--rw-text, #1a1a2e);
    margin-bottom: 2px;
    line-height: 1.3;
  }

  .rw-lo-profile__title { font-size: 13px; color: #6b7280; margin-bottom: 4px; }
  .rw-lo-profile__nmls { font-size: 12px; color: #6b7280; }
  .rw-lo-profile__nmls a { color: var(--rw-primary, #52796f); text-decoration: none; }
  .rw-lo-profile__nmls a:hover { text-decoration: underline; }

  .rw-lo-profile__states { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }

  .rw-lo-profile__state-tag {
    font-size: 11px;
    padding: 1px 6px;
    background: #f3f4f6;
    color: #4b5563;
    border-radius: 4px;
    white-space: nowrap;
  }

  .rw-lo-profile__rating { display: flex; align-items: center; gap: 8px; margin-top: 6px; }

  .rw-lo-profile__rating-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--rw-text, #1a1a2e);
    line-height: 1;
  }

  .rw-lo-profile__rating-count { font-size: 13px; color: #6b7280; }

  .rw-lo-reviews { display: grid; gap: 12px; grid-template-columns: 1fr; }

  .rw-lo-review {
    padding: 16px;
    border-radius: var(--rw-radius, 8px);
    transition: box-shadow 0.15s ease;
  }

  .rw-lo-review--bordered { border: 1px solid var(--rw-border, #e5e7eb); background: #fff; }
  .rw-lo-review--shadow { background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04); }
  .rw-lo-review--flat { background: #f9fafb; }
  .rw-lo-review:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

  .rw-lo-review__header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }

  .rw-lo-review__avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
    color: #6b7280;
    flex-shrink: 0;
  }

  .rw-lo-review__meta { flex: 1; min-width: 0; }

  .rw-lo-review__name {
    font-weight: 600;
    font-size: 14px;
    color: var(--rw-text, #1a1a2e);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rw-lo-review__date { font-size: 12px; color: #9ca3af; }
  .rw-lo-review__stars { display: flex; gap: 2px; margin-bottom: 8px; }
  .rw-lo-review__text { font-size: 14px; line-height: 1.6; color: #374151; cursor: pointer; }

  .rw-lo-review__text--truncated::after {
    content: " Read more";
    color: var(--rw-primary, #52796f);
    font-weight: 500;
  }

  .rw-lo-review__tags { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 10px; }
  .rw-lo-review__source { font-size: 11px; color: #9ca3af; text-transform: capitalize; }

  .rw-lo-review__loan-tag { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500; white-space: nowrap; }
  .rw-lo-review__loan-tag--purchase { background: #dbeafe; color: #1e40af; }
  .rw-lo-review__loan-tag--refinance { background: #fef3c7; color: #92400e; }
  .rw-lo-review__loan-tag--va { background: #d1fae5; color: #065f46; }
  .rw-lo-review__loan-tag--fha { background: #ede9fe; color: #5b21b6; }
  .rw-lo-review__loan-tag--jumbo { background: #fce7f3; color: #9d174d; }
  .rw-lo-review__loan-tag--default { background: #f3f4f6; color: #4b5563; }

  .rw-lo-review__fthb-badge {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 500;
    background: #ecfdf5;
    color: #047857;
    white-space: nowrap;
  }

  .rw-lo-actions { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; }

  .rw-lo-actions__write-review {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    color: var(--rw-primary, #52796f);
    background: transparent;
    border: 1px solid var(--rw-primary, #52796f);
    border-radius: 6px;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .rw-lo-actions__write-review:hover { background: var(--rw-primary, #52796f); color: #fff; }

  .rw-lo-disclaimer {
    margin-top: 16px;
    padding: 10px 14px;
    font-size: 10px;
    line-height: 1.5;
    color: #6b7280;
    background: #f9fafb;
    border-radius: 4px;
    border: 1px solid #f3f4f6;
  }

  .rw-lo-disclaimer__ehl {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
    font-weight: 600;
    font-size: 11px;
    color: #4b5563;
  }

  @media (max-width: 480px) {
    .rw-lo-profile { flex-direction: column; text-align: center; }
    .rw-lo-profile__states { justify-content: center; }
    .rw-lo-profile__rating { justify-content: center; }
    .rw-lo-reviews { grid-template-columns: 1fr !important; }
    .rw-lo-actions { flex-direction: column; }
    .rw-lo-actions__write-review, .rw-cta { width: 100%; text-align: center; justify-content: center; }
  }
`
  );

  // src/embed/widgets/lo-review/template.ts
  function starsRow(rating, filledColor, emptyColor, className) {
    const row = el("div", className);
    row.setAttribute("role", "img");
    row.setAttribute("aria-label", `${rating} out of 5 stars`);
    for (let i = 1; i <= 5; i++) {
      row.appendChild(starSVG(i <= rating, filledColor, emptyColor));
    }
    return row;
  }
  function getLoanTagClass(loanType) {
    var _a;
    const normalized = loanType.toLowerCase().replace(/\s+/g, "");
    const m = { purchase: "purchase", refinance: "refinance", va: "va", fha: "fha", jumbo: "jumbo" };
    return (_a = m[normalized]) != null ? _a : "default";
  }
  var NMLS_BASE = "https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/";
  function buildProfileHeader(profile, config, starFilled, starEmpty) {
    var _a, _b;
    const content = (_a = config.config) == null ? void 0 : _a.content;
    const section = el("div", "rw-lo-profile");
    const photoUrl = (_b = profile.photo_url) != null ? _b : profile.avatar_url;
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
    if ((content == null ? void 0 : content.showNMLS) !== false && profile.nmls_id) {
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
  function buildReviewCard(review, config, starFilled, starEmpty, apiBase) {
    var _a, _b, _c, _d, _e;
    const content = (_a = config.config) == null ? void 0 : _a.content;
    const cardStyle = (_b = content == null ? void 0 : content.cardStyle) != null ? _b : "bordered";
    const card = el("div", `rw-lo-review rw-lo-review--${cardStyle}`);
    card.setAttribute("role", "article");
    card.setAttribute("aria-label", `Review by ${(_c = review.reviewer_name) != null ? _c : "Anonymous"}`);
    const header = el("div", "rw-lo-review__header");
    if ((content == null ? void 0 : content.showAvatar) !== false) {
      header.appendChild(text("div", getInitials(review.reviewer_name), "rw-lo-review__avatar"));
    }
    const meta = el("div", "rw-lo-review__meta");
    if (review.reviewer_name) meta.appendChild(text("span", review.reviewer_name, "rw-lo-review__name"));
    if ((content == null ? void 0 : content.showDate) !== false && review.review_date) {
      const dateFormat = (_d = content == null ? void 0 : content.dateFormat) != null ? _d : "relative";
      const dateText = dateFormat === "relative" ? formatRelativeDate(review.review_date) : formatAbsoluteDate(review.review_date);
      meta.appendChild(text("span", dateText, "rw-lo-review__date"));
    }
    header.appendChild(meta);
    card.appendChild(header);
    card.appendChild(starsRow(review.rating, starFilled, starEmpty, "rw-lo-review__stars"));
    if (review.text) {
      const truncLen = (_e = content == null ? void 0 : content.truncateLength) != null ? _e : 300;
      const { text: displayText, truncated } = truncLen > 0 ? truncateText(review.text, truncLen) : { text: review.text, truncated: false };
      const textEl = text("p", displayText, "rw-lo-review__text");
      if (truncated) {
        textEl.classList.add("rw-lo-review__text--truncated");
        textEl.setAttribute("role", "button");
        textEl.setAttribute("tabindex", "0");
        textEl.setAttribute("aria-expanded", "false");
        const expand = () => {
          textEl.textContent = review.text;
          textEl.classList.remove("rw-lo-review__text--truncated");
          textEl.removeAttribute("role");
          textEl.removeAttribute("tabindex");
          textEl.setAttribute("aria-expanded", "true");
          trackClick(apiBase, config.widget_id, "click_review", { review_id: review.id });
        };
        textEl.addEventListener("click", expand);
        textEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            expand();
          }
        });
      }
      card.appendChild(textEl);
    }
    const tags = el("div", "rw-lo-review__tags");
    let hasTags = false;
    if ((content == null ? void 0 : content.showSource) !== false && review.source) {
      tags.appendChild(text("span", `via ${review.source}`, "rw-lo-review__source"));
      hasTags = true;
    }
    if (review.loan_type) {
      tags.appendChild(text("span", review.loan_type, `rw-lo-review__loan-tag rw-lo-review__loan-tag--${getLoanTagClass(review.loan_type)}`));
      hasTags = true;
    }
    if (review.first_time_homebuyer) {
      tags.appendChild(text("span", "First-Time Homebuyer", "rw-lo-review__fthb-badge"));
      hasTags = true;
    }
    if (hasTags) card.appendChild(tags);
    return card;
  }
  function buildLoReviewDOM(config, reviews, apiBase) {
    var _a, _b, _c, _d, _e, _f, _g;
    const cfg = config.config;
    const content = cfg == null ? void 0 : cfg.content;
    const colors = (_a = cfg == null ? void 0 : cfg.theme) == null ? void 0 : _a.colors;
    const profile = config.entity_profile;
    const container = el("div", "rw-widget");
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", (_c = content == null ? void 0 : content.headerText) != null ? _c : `Reviews for ${(_b = profile == null ? void 0 : profile.full_name) != null ? _b : "Loan Officer"}`);
    const starFilled = (_d = colors == null ? void 0 : colors.starFilled) != null ? _d : "#f59e0b";
    const starEmpty = (_e = colors == null ? void 0 : colors.starEmpty) != null ? _e : "#d1d5db";
    if (profile && (content == null ? void 0 : content.showHeader) !== false) {
      container.appendChild(buildProfileHeader(profile, config, starFilled, starEmpty));
    }
    if (reviews.length === 0) {
      container.appendChild(text("div", "No reviews yet.", "rw-empty"));
    } else {
      const grid = el("div", "rw-lo-reviews");
      const columns = (_f = content == null ? void 0 : content.columns) != null ? _f : 1;
      if (columns > 1) grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
      for (const review of reviews) {
        grid.appendChild(buildReviewCard(review, config, starFilled, starEmpty, apiBase));
      }
      container.appendChild(grid);
    }
    const hasActions = (content == null ? void 0 : content.showCTA) && content.ctaText && content.ctaUrl || (content == null ? void 0 : content.showWriteReview) && content.writeReviewUrl;
    if (hasActions) {
      const actions = el("div", "rw-lo-actions");
      if ((content == null ? void 0 : content.showCTA) && content.ctaText && content.ctaUrl) {
        const cta = document.createElement("a");
        cta.className = "rw-cta";
        cta.textContent = content.ctaText;
        cta.href = content.ctaUrl;
        cta.target = "_blank";
        cta.rel = "noopener noreferrer";
        if (colors == null ? void 0 : colors.primary) cta.style.background = colors.primary;
        cta.addEventListener("click", () => {
          trackClick(apiBase, config.widget_id, "click_cta");
        });
        actions.appendChild(cta);
      }
      if ((content == null ? void 0 : content.showWriteReview) && content.writeReviewUrl) {
        const writeBtn = document.createElement("a");
        writeBtn.className = "rw-lo-actions__write-review";
        writeBtn.textContent = "Write a Review";
        writeBtn.href = content.writeReviewUrl;
        writeBtn.target = "_blank";
        writeBtn.rel = "noopener noreferrer";
        writeBtn.addEventListener("click", () => {
          trackClick(apiBase, config.widget_id, "click_write_review");
        });
        actions.appendChild(writeBtn);
      }
      container.appendChild(actions);
    }
    if (content == null ? void 0 : content.showDisclaimer) {
      const disclaimer = el("div", "rw-lo-disclaimer");
      const ehl = el("div", "rw-lo-disclaimer__ehl");
      ehl.textContent = "\u2302 Equal Housing Lender";
      disclaimer.appendChild(ehl);
      const disclaimerContent = (_g = content.disclaimerText) != null ? _g : "NMLS Consumer Access: www.nmlsconsumeraccess.org. This is not a commitment to lend. Not all borrowers will qualify. Equal Housing Lender.";
      disclaimer.appendChild(text("div", disclaimerContent));
      container.appendChild(disclaimer);
    }
    if ((content == null ? void 0 : content.showBranding) !== false) {
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

  // src/embed/widgets/lo-review/index.ts
  function renderLoReviewWidget(root, config, reviews, apiBase) {
    var _a, _b, _c, _d;
    applyTheme(root, (_b = (_a = config.config) == null ? void 0 : _a.theme) == null ? void 0 : _b.colors, (_d = (_c = config.config) == null ? void 0 : _c.theme) == null ? void 0 : _d.layout);
    const style = document.createElement("style");
    style.textContent = LO_REVIEW_STYLES;
    root.appendChild(style);
    root.appendChild(buildLoReviewDOM(config, reviews, apiBase));
  }
  registerWidget("lo_review", renderLoReviewWidget);

  // src/embed/index.ts
  function resolveApiBase() {
    const scriptTag = document.currentScript;
    if (scriptTag == null ? void 0 : scriptTag.dataset.apiBase) {
      return scriptTag.dataset.apiBase.replace(/\/$/, "");
    }
    if (scriptTag == null ? void 0 : scriptTag.src) {
      try {
        const url = new URL(scriptTag.src);
        return url.origin;
      } catch (e) {
      }
    }
    return location.origin;
  }
  var instances = /* @__PURE__ */ new Map();
  var instanceCounter = 0;
  function generateInstanceId() {
    return `rw-${++instanceCounter}`;
  }
  async function loadWidget(instance, apiBase) {
    var _a, _b, _c;
    instance.state = 3 /* Loading */;
    const controller = new AbortController();
    instance.abortController = controller;
    try {
      const config = await fetchConfig(apiBase, instance.widgetId, controller.signal);
      if (controller.signal.aborted) return;
      instance.config = config;
      const limit = (_c = (_b = (_a = config.config) == null ? void 0 : _a.filters) == null ? void 0 : _b.maxReviews) != null ? _c : 10;
      const data = await fetchReviews(apiBase, instance.widgetId, controller.signal, limit);
      if (controller.signal.aborted) return;
      instance.reviews = data.reviews;
      removeSkeleton(instance.shadowRoot);
      renderWidget(instance.shadowRoot, config, data.reviews, apiBase);
      instance.state = 4 /* Rendered */;
      trackImpression(apiBase, instance.widgetId);
    } catch (err) {
      if (controller.signal.aborted) return;
      instance.state = 5 /* Error */;
      removeSkeleton(instance.shadowRoot);
      renderError(instance.shadowRoot);
      console.warn(`[RepWell] Failed to load widget "${instance.widgetId}":`, err);
    } finally {
      instance.abortController = null;
    }
  }
  function initializeWidget(element, widgetId, apiBase) {
    if (element.hasAttribute("data-repwell-initialized")) return;
    const id = generateInstanceId();
    element.setAttribute("data-repwell-initialized", id);
    if (!element.style.minHeight) {
      element.style.minHeight = "280px";
    }
    const shadowRoot = attachShadow(element);
    const instance = {
      id,
      widgetId,
      element,
      shadowRoot,
      state: 1 /* ShadowAttached */,
      config: null,
      reviews: [],
      abortController: null
    };
    instances.set(id, instance);
    renderSkeleton(shadowRoot);
    instance.state = 2 /* Observing */;
    observe(element, () => {
      loadWidget(instance, apiBase);
    });
  }
  function destroyInstance(instance) {
    var _a;
    (_a = instance.abortController) == null ? void 0 : _a.abort();
    unobserve(instance.element);
    while (instance.shadowRoot.firstChild) {
      instance.shadowRoot.firstChild.remove();
    }
    instance.element.removeAttribute("data-repwell-initialized");
    instance.element.style.minHeight = "";
    instances.delete(instance.id);
  }
  function init() {
    const apiBase = api._apiBase;
    const widgets = discoverWidgets();
    if (widgets.length === 0) {
      console.warn("[RepWell] No widget elements found. Add data-repwell-widget attributes.");
      return;
    }
    for (const { element, widgetId } of widgets) {
      initializeWidget(element, widgetId, apiBase);
    }
  }
  function refresh(widgetId) {
    var _a;
    const apiBase = api._apiBase;
    for (const instance of instances.values()) {
      if (instance.widgetId === widgetId) {
        (_a = instance.abortController) == null ? void 0 : _a.abort();
        const style = instance.shadowRoot.querySelector("style");
        while (instance.shadowRoot.firstChild) {
          instance.shadowRoot.firstChild.remove();
        }
        if (style) instance.shadowRoot.appendChild(style);
        instance.state = 1 /* ShadowAttached */;
        instance.config = null;
        instance.reviews = [];
        renderSkeleton(instance.shadowRoot);
        loadWidget(instance, apiBase);
      }
    }
  }
  function destroy(widgetId) {
    for (const instance of instances.values()) {
      if (instance.widgetId === widgetId) {
        destroyInstance(instance);
      }
    }
  }
  var api = {
    init,
    refresh,
    destroy,
    _instances: instances,
    _apiBase: resolveApiBase()
  };
  window.RepWell = api;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
  var mutationObserver = new MutationObserver((mutations) => {
    let hasNewWidgets = false;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement && (node.hasAttribute("data-repwell-widget") || node.querySelector("[data-repwell-widget]"))) {
          hasNewWidgets = true;
          break;
        }
      }
      if (hasNewWidgets) break;
    }
    if (hasNewWidgets) {
      requestAnimationFrame(() => init());
    }
  });
  mutationObserver.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });
})();
//# sourceMappingURL=embed.js.map
