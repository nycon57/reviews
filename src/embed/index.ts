/**
 * RepWell Embed Script — entry point.
 *
 * Discovers [data-repwell-widget] elements, lazy-loads via Intersection Observer,
 * fetches config/reviews from the public API, and renders inside Shadow DOM.
 *
 * Global API: window.RepWell = { init(), refresh(widgetId), destroy(widgetId) }
 */

import type { RepWellAPI, WidgetInstance } from "./types";
import { WidgetState } from "./types";
import { discoverWidgets } from "./core/discovery";
import { attachShadow } from "./core/shadow-dom";
import { observe, unobserve } from "./core/lazy-loader";
import { renderSkeleton, removeSkeleton } from "./core/skeleton";
import { renderWidget, renderError } from "./core/renderer";
import { fetchConfig, fetchReviews } from "./core/api-client";
import { trackImpression } from "./core/event-tracker";

// Widget type registrations (self-register on import)
import "./widgets/lo-review";
import "./widgets/company-review";
import "./widgets/star-rating-badge";

// ── Resolve API base URL from the script tag ────────────────────────

function resolveApiBase(): string {
  // Check for explicit data attribute first
  const scriptTag = document.currentScript as HTMLScriptElement | null;
  if (scriptTag?.dataset.apiBase) {
    return scriptTag.dataset.apiBase.replace(/\/$/, "");
  }

  // Derive from script src (e.g. https://app.repwell.com/embed.js -> https://app.repwell.com)
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

  const controller = new AbortController();
  instance.abortController = controller;

  try {
    // Fetch config
    const config = await fetchConfig(apiBase, instance.widgetId, controller.signal);
    if (controller.signal.aborted) return;
    instance.config = config;

    // Fetch reviews
    const limit = config.config?.filters?.maxReviews ?? 10;
    const data = await fetchReviews(apiBase, instance.widgetId, controller.signal, limit);
    if (controller.signal.aborted) return;
    instance.reviews = data.reviews;

    // Replace skeleton with rendered widget
    removeSkeleton(instance.shadowRoot);
    renderWidget(instance.shadowRoot, config, data.reviews, apiBase);
    instance.state = WidgetState.Rendered;

    // Track impression
    trackImpression(apiBase, instance.widgetId);
  } catch (err) {
    if (controller.signal.aborted) return;

    instance.state = WidgetState.Error;
    removeSkeleton(instance.shadowRoot);
    renderError(instance.shadowRoot);
    console.warn(`[RepWell] Failed to load widget "${instance.widgetId}":`, err);
  } finally {
    instance.abortController = null;
  }
}

function initializeWidget(element: HTMLElement, widgetId: string, apiBase: string): void {
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
    element,
    shadowRoot,
    state: WidgetState.ShadowAttached,
    config: null,
    reviews: [],
    abortController: null,
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

  // Stop observing
  unobserve(instance.element);

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

  for (const { element, widgetId } of widgets) {
    initializeWidget(element, widgetId, apiBase);
  }
}

function refresh(widgetId: string): void {
  const apiBase = api._apiBase;

  for (const instance of instances.values()) {
    if (instance.widgetId === widgetId) {
      // Abort current load if any
      instance.abortController?.abort();

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

const api: RepWellAPI = {
  init,
  refresh,
  destroy,
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
