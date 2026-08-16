import type { CSSProperties } from "react";
import { SHADOW_VALUES, generateThemeStyleObject } from "@/lib/widgets/theme-utils";
import type { WidgetThemeColors, WidgetContent } from "./shared";

export interface WidgetThemeLayout {
  maxWidth?: string;
  padding?: string;
  borderRadius?: string;
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  cardStyle?: "flat" | "elevated" | "bordered" | "glass";
}

export type PreviewCardStyle = NonNullable<WidgetContent["cardStyle"]>;

export function resolvePreviewCardStyle(
  layoutCardStyle: WidgetThemeLayout["cardStyle"] | undefined,
  contentCardStyle: WidgetContent["cardStyle"] | undefined,
): PreviewCardStyle {
  switch (layoutCardStyle) {
    case "elevated":
      return "shadow";
    case "flat":
      return "flat";
    case "bordered":
      return "bordered";
    case "glass":
      return "glass";
    default:
      return contentCardStyle ?? "bordered";
  }
}

export function getPreviewContainerStyle(
  colors: WidgetThemeColors,
  layout?: WidgetThemeLayout,
): CSSProperties {
  return {
    ...generateThemeStyleObject(colors, undefined, layout),
    borderRadius: layout?.borderRadius ?? "8px",
    padding: layout?.padding ?? "16px",
    background: "var(--rw-surface, var(--rw-bg, #ffffff))",
    color: "var(--rw-text, #1a1a2e)",
  } as CSSProperties;
}

export function getPreviewCardStyle(
  cardStyle: PreviewCardStyle,
  layout?: WidgetThemeLayout,
): CSSProperties {
  const style: CSSProperties = {
    borderRadius: layout?.borderRadius ?? "8px",
  };

  if (cardStyle === "bordered") {
    style.background = "var(--rw-surface, var(--rw-bg, #ffffff))";
    style.borderTopWidth = "1px";
    style.borderRightWidth = "1px";
    style.borderBottomWidth = "1px";
    style.borderLeftWidth = "1px";
    style.borderTopStyle = "solid";
    style.borderRightStyle = "solid";
    style.borderBottomStyle = "solid";
    style.borderLeftStyle = "solid";
    style.borderTopColor = "var(--rw-border, #e5e7eb)";
    style.borderRightColor = "var(--rw-border, #e5e7eb)";
    style.borderBottomColor = "var(--rw-border, #e5e7eb)";
    style.borderLeftColor = "var(--rw-border, #e5e7eb)";
    return style;
  }

  if (cardStyle === "flat") {
    style.background = "var(--rw-surface-muted, #f9fafb)";
    return style;
  }

  if (cardStyle === "glass") {
    style.background = "var(--rw-glass-bg, rgba(255, 255, 255, 0.6))";
    style.backdropFilter = "blur(12px)";
    style.WebkitBackdropFilter = "blur(12px)";
    style.border = "1px solid var(--rw-glass-border, rgba(255, 255, 255, 0.3))";
    style.boxShadow = "0 4px 30px rgba(0, 0, 0, 0.05)";
    return style;
  }

  // shadow/elevated
  style.background = "var(--rw-surface, var(--rw-bg, #ffffff))";
  style.boxShadow =
    layout?.shadow && layout.shadow !== "none"
      ? SHADOW_VALUES[layout.shadow] ?? SHADOW_VALUES.md
      : SHADOW_VALUES.md;
  return style;
}

export function getPreviewCardClasses(
  cardStyle: PreviewCardStyle,
  ...baseClasses: string[]
): string {
  return [
    ...baseClasses,
    cardStyle === "shadow" && "shadow-md hover:shadow-lg",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Apply featured review styling: left accent border + subtle gradient background. */
export function applyFeaturedStyle(
  style: CSSProperties,
  accentColor: string,
): CSSProperties {
  const gradient = `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 8%, var(--rw-surface, var(--rw-bg, #ffffff)) 92%) 0%, color-mix(in srgb, ${accentColor} 14%, var(--rw-surface, var(--rw-bg, #ffffff)) 86%) 100%)`;
  const featured: CSSProperties = {
    ...style,
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: accentColor,
  };
  // Keep an explicit background from the caller; only unstyled cards get the tint.
  if (style.background == null) featured.background = gradient;
  return featured;
}

export function getPreviewSurfaceStyle(
  layout?: WidgetThemeLayout,
): CSSProperties {
  return {
    borderRadius: layout?.borderRadius ?? "8px",
  };
}
