/** Interactive filter controls — rating, source, loan type, sort, date range, keyword search. */

import type { PublicReview, PublicWidgetConfig, WidgetInstance } from "../../types";
import { applyFilterChange, resetFilters } from "./filter-engine";
import type { FilterEngineContext } from "./filter-engine";
import { FILTER_STYLES } from "./filter-styles";

export interface FilterControlsOptions {
  instance: WidgetInstance;
  config: PublicWidgetConfig;
  apiBase: string;
  reviewsContainer: HTMLElement;
  renderReviews: (reviews: PublicReview[]) => void;
}

const R_OPTS: [string, number][] = [["All", 0], ["5\u2605", 5], ["4\u2605+", 4], ["3\u2605+", 3]];
const S_OPTS: [string, string][] = [["Newest", "newest"], ["Oldest", "oldest"], ["Highest", "highest"], ["Lowest", "lowest"]];
const L_TYPES = ["Purchase", "Refinance", "VA", "FHA", "Jumbo", "USDA", "Conventional"];
const D_OPTS: [string, string][] = [["All Time", ""], ["30 Days", "last_30d"], ["90 Days", "last_90d"], ["Year", "last_year"]];

export function buildFilterControls(opts: FilterControlsOptions): HTMLElement {
  const { instance, config, apiBase, reviewsContainer, renderReviews } = opts;

  // Inject filter styles once
  injectFilterStyles(instance.shadowRoot);

  const toolbar = document.createElement("div");
  toolbar.className = "rw-filter-toolbar";
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", "Filter reviews");

  const ctx: FilterEngineContext = {
    instance,
    apiBase,
    onLoading: () => {
      reviewsContainer.classList.add("rw-filter-loading");
    },
    onReviewsLoaded: (newReviews) => {
      reviewsContainer.classList.remove("rw-filter-loading");
      removeEmptyState(reviewsContainer);
      renderReviews(newReviews);
    },
    onEmpty: () => {
      reviewsContainer.classList.remove("rw-filter-loading");
      showEmptyState(reviewsContainer, ctx);
    },
    onError: () => {
      reviewsContainer.classList.remove("rw-filter-loading");
    },
  };

  buildRatingFilter(toolbar, ctx);
  buildSortDropdown(toolbar, ctx, config);
  const sources = extractSources(instance.reviews);
  if (sources.length > 1) buildSourceDropdown(toolbar, ctx, sources);
  buildDateRangeDropdown(toolbar, ctx);
  buildLoanTypePills(toolbar, ctx);
  buildKeywordSearch(toolbar, ctx);

  return toolbar;
}

function injectFilterStyles(root: ShadowRoot): void {
  if (root.querySelector("style[data-rw-filters]")) return;
  const style = document.createElement("style");
  style.setAttribute("data-rw-filters", "");
  style.textContent = FILTER_STYLES;
  root.appendChild(style);
}

function extractSources(reviews: PublicReview[]): string[] {
  return [...new Set(reviews.map((r) => r.source).filter(Boolean))];
}

// ── Rating filter ─────────────────────────────────────────────────

function buildRatingFilter(toolbar: HTMLElement, ctx: FilterEngineContext): void {
  const group = document.createElement("div");
  group.className = "rw-filter-stars";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Minimum rating");

  for (const [label, value] of R_OPTS) {
    const btn = document.createElement("button");
    btn.className = "rw-filter-star-btn";
    btn.textContent = label;
    btn.type = "button";
    btn.setAttribute("aria-pressed", value === 0 ? "true" : "false");
    btn.addEventListener("click", () => {
      for (const b of group.querySelectorAll(".rw-filter-star-btn"))
        (b as HTMLElement).setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-pressed", "true");
      applyFilterChange(ctx, "minRating", value || undefined);
    });
    group.appendChild(btn);
  }

  toolbar.appendChild(group);
}

// ── Sort dropdown ─────────────────────────────────────────────────

function buildSortDropdown(
  toolbar: HTMLElement,
  ctx: FilterEngineContext,
  config: PublicWidgetConfig,
): void {
  const select = document.createElement("select");
  select.className = "rw-filter-select";
  select.setAttribute("aria-label", "Sort reviews");

  for (const [label, value] of S_OPTS) {
    const o = document.createElement("option");
    o.value = value; o.textContent = label;
    select.appendChild(o);
  }
  const configSort = config.config?.filters?.sortOrder;
  if (configSort) select.value = configSort;

  select.addEventListener("change", () => {
    applyFilterChange(ctx, "sortOrder", select.value);
  });

  toolbar.appendChild(select);
}

// ── Source dropdown ───────────────────────────────────────────────

function buildSourceDropdown(
  toolbar: HTMLElement,
  ctx: FilterEngineContext,
  sources: string[],
): void {
  const select = document.createElement("select");
  select.className = "rw-filter-select";
  select.setAttribute("aria-label", "Filter by source");

  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = "All Sources";
  select.appendChild(allOpt);

  for (const src of sources) {
    const option = document.createElement("option");
    option.value = src;
    option.textContent = src;
    select.appendChild(option);
  }

  select.addEventListener("change", () => {
    const val = select.value ? [select.value] : undefined;
    applyFilterChange(ctx, "sources", val);
  });

  toolbar.appendChild(select);
}

// ── Loan type pills ──────────────────────────────────────────────

function buildLoanTypePills(toolbar: HTMLElement, ctx: FilterEngineContext): void {
  const group = document.createElement("div");
  group.className = "rw-filter-pills";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Loan type");

  for (const lt of L_TYPES) {
    const pill = document.createElement("button");
    pill.className = "rw-filter-pill";
    pill.textContent = lt;
    pill.type = "button";
    pill.setAttribute("aria-pressed", "false");
    pill.addEventListener("click", () => {
      const pressed = pill.getAttribute("aria-pressed") === "true";
      pill.setAttribute("aria-pressed", pressed ? "false" : "true");
      const selected: string[] = [];
      for (const p of group.querySelectorAll(".rw-filter-pill[aria-pressed='true']")) {
        selected.push(p.textContent ?? "");
      }
      applyFilterChange(ctx, "loanTypes", selected.length > 0 ? selected : undefined);
    });
    group.appendChild(pill);
  }

  toolbar.appendChild(group);
}

// ── Date range dropdown ───────────────────────────────────────

function buildDateRangeDropdown(
  toolbar: HTMLElement,
  ctx: FilterEngineContext,
): void {
  const select = document.createElement("select");
  select.className = "rw-filter-select";
  select.setAttribute("aria-label", "Filter by date range");

  for (const [label, value] of D_OPTS) {
    const o = document.createElement("option");
    o.value = value; o.textContent = label;
    select.appendChild(o);
  }
  const currentRange = ctx.instance.activeFilters.dateRange;
  if (currentRange) select.value = currentRange;

  select.addEventListener("change", () => {
    applyFilterChange(ctx, "dateRange", select.value || undefined);
  });

  toolbar.appendChild(select);
}

// ── Keyword search ────────────────────────────────────────────

function buildKeywordSearch(
  toolbar: HTMLElement,
  ctx: FilterEngineContext,
): void {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "rw-filter-search";
  input.placeholder = "Search reviews\u2026";
  input.setAttribute("aria-label", "Search reviews by keyword");

  // Set initial value if keywords exist
  const currentKeywords = ctx.instance.activeFilters.keywords;
  if (currentKeywords && currentKeywords.length > 0) {
    input.value = currentKeywords.join(" ");
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  input.addEventListener("input", () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const val = input.value.trim();
      const keywords = val
        ? val.split(/\s+/).filter(Boolean)
        : undefined;
      applyFilterChange(ctx, "keywords", keywords);
    }, 400);
  });

  toolbar.appendChild(input);
}

// ── Empty state ──────────────────────────────────────────────────

function showEmptyState(container: HTMLElement, ctx: FilterEngineContext): void {
  while (container.firstChild) container.firstChild.remove();

  const empty = document.createElement("div");
  empty.className = "rw-filter-empty";

  const msg = document.createElement("p");
  msg.textContent = "No reviews match your filters.";
  empty.appendChild(msg);

  const resetBtn = document.createElement("button");
  resetBtn.className = "rw-filter-reset-btn";
  resetBtn.textContent = "Reset Filters";
  resetBtn.type = "button";
  resetBtn.addEventListener("click", () => {
    resetFilters(ctx);
  });
  empty.appendChild(resetBtn);

  container.appendChild(empty);
}

function removeEmptyState(container: HTMLElement): void {
  const empty = container.querySelector(".rw-filter-empty");
  if (empty) empty.remove();
}
