/**
 * RepWell Embed Script — entry point.
 *
 * Discovers [data-repwell-widget] elements, lazy-loads via Intersection Observer,
 * fetches config/reviews from the public API, and renders inside Shadow DOM.
 *
 * Global API: window.RepWell = { init(), refresh(widgetId), destroy(widgetId) }
 */

import type {
  RepWellAPI,
  WidgetInstance,
  HookEvent,
  HookCallback,
  RuntimeOverrides,
} from "./types";
import { WidgetState } from "./types";
import { discoverWidgets, readEntityOverride } from "./core/discovery";
import { attachShadow, loadGoogleFontInShadow } from "./core/shadow-dom";
import { observe, unobserve } from "./core/lazy-loader";
import { renderSkeleton, removeSkeleton } from "./core/skeleton";
import { renderWidget, renderError } from "./core/renderer";
import { fetchConfig, fetchReviews, WidgetApiError } from "./core/api-client";
import { trackImpression } from "./core/event-tracker";
import { attachScrollDepthTracking } from "./core/scroll-tracker";
import { setupConversionTracking } from "./core/conversion-tracker";
import { DomainNotAllowedError, fetchWithDomainCheck } from "./core/domain-check";
import { resolveAbVariant, clearAbAssignment } from "./core/ab-resolver";
import { injectStructuredData, removeStructuredData } from "./seo/structured-data";
import { setInstanceForRoot } from "./widgets/registry";
import { setLocale } from "./i18n";
import { sanitizeCustomCSS } from "./core/css-sanitizer";
import {
  addHookListener,
  removeHookListener,
  emitHookEvent,
  clearHookListeners,
} from "./core/hooks";

// Widget type registrations (self-register on import)
import "./widgets/review-profile";
import "./widgets/lo-review";
import "./widgets/company-review";
import "./widgets/branch-review";
import "./widgets/star-rating-badge";
import "./widgets/review-carousel";
import "./widgets/video-testimonial";
import "./widgets/review-wall";
import "./widgets/nps-score-badge";
import "./widgets/social-proof-banner";

// ── Resolve API base URL from the script tag ────────────────────────

function resolveApiBase(): string {
  // Check for explicit data attribute first
  const scriptTag = document.currentScript as HTMLScriptElement | null;
  if (scriptTag?.dataset.apiBase) {
    return scriptTag.dataset.apiBase.replace(/\/$/, "");
  }

  // Derive from script src (e.g. https://repwell.ai/embed.js -> https://repwell.ai)
  if (scriptTag?.src) {
    try {
      const url = new URL(scriptTag.src);
      return url.origin;
    } catch {
      // fall through
    }
  }

  // Fallback: assume same origin
  return location.origin;
}

// ── Instance registry ───────────────────────────────────────────────

const instances = new Map<string, WidgetInstance>();
let instanceCounter = 0;

function generateInstanceId(): string {
  return `rw-${++instanceCounter}`;
}

// ── Widget lifecycle ────────────────────────────────────────────────

async function loadWidget(instance: WidgetInstance, apiBase: string): Promise<void> {
  instance.state = WidgetState.Loading;
  instance._scrollCleanup?.();
  instance._scrollCleanup = null;
  instance._conversionCleanup?.();
  instance._conversionCleanup = null;

  const controller = new AbortController();
  instance.abortController = controller;

  try {
    // Fetch config (wraps 403 → DomainNotAllowedError for clear feedback)
    const config = await fetchWithDomainCheck(instance.widgetId, () =>
      fetchConfig(apiBase, instance.widgetId, controller.signal, instance.entityOverride)
    );
    if (controller.signal.aborted) return;

    // Resolve A/B variant: may redirect to variant widget slug
    const resolvedWidgetId = resolveAbVariant(instance.widgetId, config.ab_test);
    let finalConfig = config;

    if (resolvedWidgetId !== instance.widgetId) {
      // Visitor assigned to variant B — fetch variant config
      finalConfig = await fetchWithDomainCheck(resolvedWidgetId, () =>
        fetchConfig(apiBase, resolvedWidgetId, controller.signal, instance.entityOverride)
      );
      if (controller.signal.aborted) return;
    }

    instance.config = finalConfig;

    // Fetch reviews for the resolved widget
    const limit = finalConfig.config?.filters?.maxReviews ?? 10;
    const data = await fetchWithDomainCheck(resolvedWidgetId, () =>
      fetchReviews(
        apiBase,
        resolvedWidgetId,
        controller.signal,
        limit,
        undefined,
        instance.activeFilters,
        instance.entityOverride,
      )
    );
    if (controller.signal.aborted) return;
    instance.reviews = data.reviews;

    // Set locale from widget config before rendering
    setLocale(finalConfig.config?.content?.language ?? "en");

    // Load Google Font inside Shadow DOM if a non-system font is selected
    loadGoogleFontInShadow(instance.shadowRoot, finalConfig.config?.theme?.typography?.fontFamily);

    // Register instance so widget renderers can access it for interactive filters
    setInstanceForRoot(instance.shadowRoot, instance);

    // Replace skeleton with rendered widget
    removeSkeleton(instance.shadowRoot);
    renderWidget(instance.shadowRoot, finalConfig, data.reviews, apiBase);

    // Inject custom CSS into Shadow DOM (sanitized)
    const customCSS = finalConfig.config?.advanced?.customCSS;
    if (customCSS) {
      const { sanitized } = sanitizeCustomCSS(customCSS);
      if (sanitized) {
        const customStyle = document.createElement("style");
        customStyle.setAttribute("data-repwell-custom", "true");
        customStyle.textContent = sanitized;
        instance.shadowRoot.appendChild(customStyle);
      }
    }

    instance.state = WidgetState.Rendered;

    // Emit hook events
    emitHookEvent(instance.widgetId, "ready", {
      widgetType: finalConfig.widget_type,
      config: finalConfig.config,
    });
    emitHookEvent(instance.widgetId, "review-loaded", {
      widgetType: finalConfig.widget_type,
      config: finalConfig.config,
    });

    // Inject JSON-LD structured data into host page <head>
    injectStructuredData(finalConfig, data.reviews, finalConfig.entity_profile);

    // Track impression for the resolved widget config so analytics include entity metadata.
    trackImpression(apiBase, finalConfig);

    // Attach scroll depth tracking for long widgets (Review Wall, etc.)
    const scrollCleanup = attachScrollDepthTracking(
      instance.shadowRoot.host as HTMLElement,
      apiBase,
      finalConfig,
    );
    instance._scrollCleanup = scrollCleanup;

    // Set up conversion attribution if configured
    const analyticsConfig = finalConfig.config?.analytics;
    if (analyticsConfig?.conversionUrl) {
      const conversionCleanup = setupConversionTracking(
        apiBase,
        resolvedWidgetId,
        analyticsConfig.conversionUrl,
      );
      instance._conversionCleanup = conversionCleanup;
    }
  } catch (err) {
    if (controller.signal.aborted) return;

    instance.state = WidgetState.Error;
    removeSkeleton(instance.shadowRoot);

    if (err instanceof DomainNotAllowedError) {
      renderError(instance.shadowRoot, "This widget is not authorized for this domain.");
      console.warn(`[RepWell] ${err.message}`);
      emitHookEvent(instance.widgetId, "error", { error: err.message });
    } else if (err instanceof WidgetApiError) {
      renderError(instance.shadowRoot, err.message);
      console.warn(`[RepWell] Failed to load widget "${instance.widgetId}":`, err);
      emitHookEvent(instance.widgetId, "error", { error: err.message, code: err.code });
    } else {
      renderError(instance.shadowRoot);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.warn(`[RepWell] Failed to load widget "${instance.widgetId}":`, err);
      emitHookEvent(instance.widgetId, "error", { error: errorMsg });
    }
  } finally {
    instance.abortController = null;
  }
}

function initializeWidget(
  element: HTMLElement,
  widgetId: string,
  apiBase: string,
  entityOverride: WidgetInstance["entityOverride"],
): void {
  // Skip if already initialized
  if (element.hasAttribute("data-repwell-initialized")) return;

  const id = generateInstanceId();
  element.setAttribute("data-repwell-initialized", id);

  // Set fixed dimensions to prevent CLS
  if (!element.style.minHeight) {
    element.style.minHeight = "280px";
  }

  const shadowRoot = attachShadow(element);

  const instance: WidgetInstance = {
    id,
    widgetId,
    entityOverride,
    element,
    shadowRoot,
    state: WidgetState.ShadowAttached,
    config: null,
    reviews: [],
    abortController: null,
    activeFilters: {},
  };

  instances.set(id, instance);

  // Show skeleton immediately for perceived speed
  renderSkeleton(shadowRoot);

  // Observe for lazy loading
  instance.state = WidgetState.Observing;
  observe(element, () => {
    loadWidget(instance, apiBase);
  });
}

function destroyInstance(instance: WidgetInstance): void {
  // Abort any in-flight requests
  instance.abortController?.abort();

  // Clean up hook listeners for this widget
  clearHookListeners(instance.widgetId);

  // Clean up scroll depth and conversion tracking
  instance._scrollCleanup?.();
  instance._conversionCleanup?.();

  // Stop observing
  unobserve(instance.element);

  // Clear A/B test assignment so visitor gets fresh assignment on next load
  clearAbAssignment(instance.widgetId);

  // Remove JSON-LD structured data from <head>
  removeStructuredData(instance.widgetId);
  if (instance.config?.widget_id && instance.config.widget_id !== instance.widgetId) {
    removeStructuredData(instance.config.widget_id);
  }

  // Clear shadow DOM contents
  while (instance.shadowRoot.firstChild) {
    instance.shadowRoot.firstChild.remove();
  }

  // Remove tracking attributes
  instance.element.removeAttribute("data-repwell-initialized");
  instance.element.style.minHeight = "";

  instances.delete(instance.id);
}

// ── Public API ──────────────────────────────────────────────────────

function init(): void {
  const apiBase = api._apiBase;
  const widgets = discoverWidgets();

  if (widgets.length === 0) {
    console.warn("[RepWell] No widget elements found. Add data-repwell-widget attributes.");
    return;
  }

  for (const { element, widgetId, entityOverride } of widgets) {
    initializeWidget(element, widgetId, apiBase, entityOverride);
  }
}

function refresh(widgetId: string): void {
  const apiBase = api._apiBase;

  for (const instance of instances.values()) {
    if (instance.widgetId === widgetId) {
      // Abort current load if any
      instance.abortController?.abort();

      // Remove stale JSON-LD so it gets re-injected with fresh data
      removeStructuredData(instance.widgetId);
      if (instance.config?.widget_id && instance.config.widget_id !== instance.widgetId) {
        removeStructuredData(instance.config.widget_id);
      }
      instance._scrollCleanup?.();
      instance._scrollCleanup = null;
      instance._conversionCleanup?.();
      instance._conversionCleanup = null;

      // Clear current content
      const style = instance.shadowRoot.querySelector("style");
      while (instance.shadowRoot.firstChild) {
        instance.shadowRoot.firstChild.remove();
      }
      // Re-attach styles
      if (style) instance.shadowRoot.appendChild(style);

      instance.state = WidgetState.ShadowAttached;
      instance.config = null;
      instance.reviews = [];
      instance.entityOverride = readEntityOverride(instance.element);

      renderSkeleton(instance.shadowRoot);
      loadWidget(instance, apiBase);
    }
  }
}

function destroy(widgetId: string): void {
  for (const instance of instances.values()) {
    if (instance.widgetId === widgetId) {
      destroyInstance(instance);
    }
  }
}

function on(widgetId: string, event: HookEvent, callback: HookCallback): void {
  addHookListener(widgetId, event, callback);
}

function off(widgetId: string, event: HookEvent, callback: HookCallback): void {
  removeHookListener(widgetId, event, callback);
}

/** Safe color fields that configure() is allowed to override. */
const SAFE_COLOR_KEYS = new Set([
  "primary", "secondary", "background", "text", "accent", "border", "starFilled", "starEmpty",
]);

/** Safe content fields that configure() is allowed to override. */
const SAFE_CONTENT_KEYS = new Set([
  "showHeader", "showCTA", "ctaText", "ctaUrl", "showBranding", "showSource", "showDate", "showAvatar",
]);

function configure(widgetId: string, overrides: RuntimeOverrides): void {
  if (!overrides || typeof overrides !== "object") return;

  const apiBase = api._apiBase;
  for (const instance of instances.values()) {
    if (instance.widgetId !== widgetId || !instance.config) continue;
    const cfg = instance.config.config;
    if (!cfg) continue;

    // Apply only safe color overrides
    if (overrides.theme?.colors && typeof overrides.theme.colors === "object") {
      if (!cfg.theme) cfg.theme = {};
      const safeColors: Record<string, string> = {};
      for (const [k, v] of Object.entries(overrides.theme.colors)) {
        if (SAFE_COLOR_KEYS.has(k) && typeof v === "string" && v.length <= 50) {
          safeColors[k] = v;
        }
      }
      cfg.theme.colors = { ...cfg.theme.colors, ...safeColors };
    }

    // Apply only safe content overrides
    if (overrides.content && typeof overrides.content === "object") {
      const safeContent: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(overrides.content)) {
        if (!SAFE_CONTENT_KEYS.has(k)) continue;
        if (typeof v === "boolean") {
          safeContent[k] = v;
        } else if (typeof v === "string" && v.length <= 500) {
          safeContent[k] = v;
        }
      }
      cfg.content = { ...cfg.content, ...safeContent };
    }

    const baseStyle = instance.shadowRoot.querySelector("style:not([data-repwell-custom])");
    const customStyle = instance.shadowRoot.querySelector("[data-repwell-custom]");
    while (instance.shadowRoot.firstChild) { instance.shadowRoot.firstChild.remove(); }
    if (baseStyle) instance.shadowRoot.appendChild(baseStyle);
    renderWidget(instance.shadowRoot, instance.config, instance.reviews, apiBase);
    if (customStyle) instance.shadowRoot.appendChild(customStyle);
  }
}

const api: RepWellAPI = {
  init,
  refresh,
  destroy,
  on,
  off,
  configure,
  _instances: instances,
  _apiBase: resolveApiBase(),
};

// ── Expose global namespace ─────────────────────────────────────────

declare global {
  interface Window {
    RepWell: RepWellAPI;
  }
}

window.RepWell = api;

// ── Auto-init on DOM ready ──────────────────────────────────────────

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  // DOM already loaded (script loaded async/defer or at end of body)
  init();
}

// Also watch for dynamically added widgets via MutationObserver
const mutationObserver = new MutationObserver((mutations) => {
  let hasNewWidgets = false;
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (
        node instanceof HTMLElement &&
        (node.hasAttribute("data-repwell-widget") ||
          node.querySelector("[data-repwell-widget]"))
      ) {
        hasNewWidgets = true;
        break;
      }
    }
    if (hasNewWidgets) break;
  }

  if (hasNewWidgets) {
    // Batch: wait a frame to catch all mutations in one pass
    requestAnimationFrame(() => init());
  }
});

mutationObserver.observe(document.body || document.documentElement, {
  childList: true,
  subtree: true,
});
