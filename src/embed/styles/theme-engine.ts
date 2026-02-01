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

  // ── Colors ──
  if (colors?.primary) host.style.setProperty("--rw-primary", colors.primary);
  if (colors?.background) host.style.setProperty("--rw-bg", colors.background);
  if (colors?.text) host.style.setProperty("--rw-text", colors.text);
  if (colors?.accent) host.style.setProperty("--rw-accent", colors.accent);
  if (colors?.starFilled) host.style.setProperty("--rw-star-fill", colors.starFilled);
  if (colors?.starEmpty) host.style.setProperty("--rw-star-empty", colors.starEmpty);
  if (colors?.border) host.style.setProperty("--rw-border", colors.border);

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
