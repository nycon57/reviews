/**
 * Theme engine for the RepWell embed script.
 *
 * Applies theme configuration to a widget's Shadow DOM :host element
 * via CSS custom properties (--rw-*). Handles:
 * - Color, typography, and layout CSS custom property injection
 * - Shadow value resolution from size tokens
 * - Google Font loading inside Shadow DOM
 */

import type { WidgetThemeColors, WidgetThemeLayout, WidgetThemeTypography } from "../types";
import { loadFontInShadow } from "./fonts";

// ── Shadow size token → CSS value mapping ──────────────────────────────

const SHADOW_MAP: Record<string, string> = {
  none: "none",
  sm: "0 1px 2px 0 rgba(0,0,0,0.05)",
  md: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
  lg: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
  xl: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
};

/**
 * Apply all theme CSS custom properties to the Shadow DOM :host element
 * and load any required Google Font.
 */
export function applyTheme(
  root: ShadowRoot,
  colors?: WidgetThemeColors,
  layout?: WidgetThemeLayout,
  typography?: WidgetThemeTypography,
): void {
  const host = root.host as HTMLElement;
  const primary = colors?.primary ?? "#52796f";
  const background = colors?.background ?? "#ffffff";
  const text = colors?.text ?? "#1a1a2e";
  const accent = colors?.accent ?? primary;
  const border = colors?.border ?? "#e5e7eb";

  // ── Colors ──
  host.style.setProperty("--rw-primary", primary);
  host.style.setProperty("--rw-bg", background);
  host.style.setProperty("--rw-text", text);
  host.style.setProperty("--rw-accent", accent);
  if (colors?.starFilled) host.style.setProperty("--rw-star-fill", colors.starFilled);
  if (colors?.starEmpty) host.style.setProperty("--rw-star-empty", colors.starEmpty);
  host.style.setProperty("--rw-border", border);
  host.style.setProperty("--rw-surface", background);
  host.style.setProperty("--rw-text-muted", `color-mix(in srgb, ${text} 72%, ${background} 28%)`);
  host.style.setProperty("--rw-text-subtle", `color-mix(in srgb, ${text} 52%, ${background} 48%)`);
  host.style.setProperty("--rw-text-secondary", "var(--rw-text-muted)");
  host.style.setProperty("--rw-surface-muted", `color-mix(in srgb, ${background} 90%, ${primary} 10%)`);
  host.style.setProperty("--rw-surface-strong", `color-mix(in srgb, ${background} 78%, ${text} 22%)`);
  host.style.setProperty("--rw-border-soft", `color-mix(in srgb, ${border} 72%, ${background} 28%)`);
  host.style.setProperty("--rw-featured-start", `color-mix(in srgb, ${accent} 8%, ${background} 92%)`);
  host.style.setProperty("--rw-featured-end", `color-mix(in srgb, ${accent} 14%, ${background} 86%)`);

  // ── Typography ──
  if (typography?.fontFamily) host.style.setProperty("--rw-font", typography.fontFamily);
  if (typography?.headerSize) host.style.setProperty("--rw-heading-size", typography.headerSize);
  if (typography?.bodySize) host.style.setProperty("--rw-body-size", typography.bodySize);

  // Enforce minimum 10px font size for disclaimer text (regulatory requirement)
  const bodyPx = typography?.bodySize ? parseInt(typography.bodySize, 10) : 14;
  const disclaimerSize = Math.max(10, Math.min(bodyPx - 2, 12));
  host.style.setProperty("--rw-disclaimer-size", `${disclaimerSize}px`);

  // ── Layout ──
  if (layout?.borderRadius) host.style.setProperty("--rw-radius", layout.borderRadius);
  if (layout?.padding) host.style.setProperty("--rw-padding", layout.padding);
  if (layout?.maxWidth) host.style.setProperty("--rw-max-width", layout.maxWidth);
  if (layout?.shadow) {
    host.style.setProperty("--rw-shadow", SHADOW_MAP[layout.shadow] ?? "none");
  }

  // ── Google Font loading ──
  loadFontInShadow(root, typography?.fontFamily);
}

/** Resolve a shadow size token to its CSS value */
export function resolveShadow(token: string | undefined): string {
  if (!token) return "none";
  return SHADOW_MAP[token] ?? "none";
}
