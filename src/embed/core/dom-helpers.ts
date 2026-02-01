/**
 * Shared DOM construction helpers for widget renderers.
 * All DOM construction uses safe methods (createElement/textContent) — no innerHTML.
 */

import type { WidgetThemeColors, WidgetThemeLayout } from "../types";

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

export function formatRelativeDate(dateStr: string): string {
  try {
    const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch {
    return dateStr;
  }
}

export function applyTheme(
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
