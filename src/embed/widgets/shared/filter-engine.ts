/**
 * Filter engine — manages filter state, re-fetches reviews, and tracks events.
 * Used by filter-controls.ts to handle user interactions.
 */

import type { ActiveFilters, PublicReview, WidgetInstance } from "../../types";
import { fetchReviews } from "../../core/api-client";
import { trackClick } from "../../core/event-tracker";

export interface FilterEngineContext {
  instance: WidgetInstance;
  apiBase: string;
  toolbar?: HTMLElement;
  onLoading: () => void;
  onReviewsLoaded: (reviews: PublicReview[]) => void;
  onEmpty: () => void;
  onError: () => void;
}

export async function applyFilterChange(
  ctx: FilterEngineContext,
  filterType: string,
  value: unknown
): Promise<void> {
  const { instance, apiBase } = ctx;

  // Update the instance's active filters
  const filters = { ...instance.activeFilters } as Record<string, unknown>;
  if (value === undefined || value === null || value === "" ||
      (Array.isArray(value) && value.length === 0)) {
    delete filters[filterType];
  } else {
    filters[filterType] = value;
  }
  instance.activeFilters = filters as ActiveFilters;

  // Track filter_change event (skip internal reset marker)
  if (filterType !== "_reset") {
    trackClick(apiBase, instance.widgetId, "filter_change", {
      filter_type: filterType,
      filter_value: value,
    });
  }

  // Abort any in-flight filter request for THIS instance
  if (instance.abortController) {
    instance.abortController.abort();
  }
  instance.abortController = new AbortController();
  const controller = instance.abortController;

  ctx.onLoading();

  try {
    const limit = instance.config?.config?.filters?.maxReviews ?? 10;
    const data = await fetchReviews(
      apiBase,
      instance.widgetId,
      controller.signal,
      limit,
      undefined,
      instance.activeFilters
    );

    if (controller.signal.aborted) return;

    instance.reviews = data.reviews;

    if (data.reviews.length === 0) {
      ctx.onEmpty();
    } else {
      ctx.onReviewsLoaded(data.reviews);
    }
  } catch (err) {
    if (controller.signal.aborted) return;
    ctx.onError();
    console.warn("[RepWell] Filter fetch failed:", err);
  }
}

export function resetFilters(ctx: FilterEngineContext): void {
  ctx.instance.activeFilters = {};

  // Reset toolbar UI controls to default visual state
  if (ctx.toolbar) {
    const starBtns = ctx.toolbar.querySelectorAll(".rw-filter-star-btn");
    starBtns.forEach((btn, i) => {
      (btn as HTMLElement).setAttribute("aria-pressed", i === 0 ? "true" : "false");
    });
    for (const sel of ctx.toolbar.querySelectorAll<HTMLSelectElement>(".rw-filter-select")) {
      sel.selectedIndex = 0;
    }
    for (const pill of ctx.toolbar.querySelectorAll(".rw-filter-pill")) {
      (pill as HTMLElement).setAttribute("aria-pressed", "false");
    }
    const search = ctx.toolbar.querySelector<HTMLInputElement>(".rw-filter-search");
    if (search) search.value = "";
  }

  // Re-fetch with no filters
  applyFilterChange(ctx, "_reset", undefined);
}
