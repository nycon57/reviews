/**
 * Shared DOM construction helpers for widget renderers.
 * All DOM construction uses safe methods (createElement/textContent) — no innerHTML.
 */

import type { WidgetThemeColors, WidgetThemeLayout, WidgetThemeTypography } from "../types";
import { applyTheme as applyThemeEngine } from "../styles/theme-engine";
import {
  formatAbsoluteDate as formatAbsoluteDateI18n,
  formatRelativeDate as formatRelativeDateI18n,
} from "../i18n/date-formatter";

const STAR_PATH =
  "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";

export function el(tag: string, className?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

export function text(tag: string, content: string, className?: string): HTMLElement {
  const node = el(tag, className);
  node.textContent = content;
  return node;
}

export function starSVG(filled: boolean, filledColor: string, emptyColor: string): SVGElement {
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

export function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0]?.toUpperCase() ?? "?";
}

export function truncateText(str: string, max: number): { text: string; truncated: boolean } {
  if (str.length <= max) return { text: str, truncated: false };
  return { text: str.slice(0, max).trimEnd() + "\u2026", truncated: true };
}

export function formatAbsoluteDate(dateStr: string): string {
  return formatAbsoluteDateI18n(dateStr);
}

export function formatRelativeDate(dateStr: string): string {
  return formatRelativeDateI18n(dateStr);
}

/**
 * Apply theme CSS custom properties + load Google Font via the theme engine.
 * Delegates to styles/theme-engine.ts to keep a single source of truth.
 */
export function applyTheme(
  root: ShadowRoot,
  colors?: WidgetThemeColors,
  layout?: WidgetThemeLayout,
  typography?: WidgetThemeTypography,
): void {
  applyThemeEngine(root, colors, layout, typography);
}
