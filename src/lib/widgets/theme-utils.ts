/**
 * Theme utilities for widget CSS custom property injection,
 * WCAG contrast validation, and Google Fonts loading.
 */

// ── Font definitions ────────────────────────────────────────────────────

export interface FontOption {
  label: string;
  value: string;
  type: "system" | "google";
}

/** 10 web-safe system fonts + 20 popular Google Fonts */
export const FONT_OPTIONS: FontOption[] = [
  // System / web-safe fonts
  { label: "System Default", value: "system-ui", type: "system" },
  { label: "Arial", value: "Arial, sans-serif", type: "system" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif", type: "system" },
  { label: "Georgia", value: "Georgia, serif", type: "system" },
  { label: "Times New Roman", value: "'Times New Roman', serif", type: "system" },
  { label: "Courier New", value: "'Courier New', monospace", type: "system" },
  { label: "Verdana", value: "Verdana, sans-serif", type: "system" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif", type: "system" },
  { label: "Palatino", value: "'Palatino Linotype', serif", type: "system" },
  { label: "Garamond", value: "Garamond, serif", type: "system" },
  // Google Fonts
  { label: "Inter", value: "'Inter', sans-serif", type: "google" },
  { label: "Roboto", value: "'Roboto', sans-serif", type: "google" },
  { label: "Open Sans", value: "'Open Sans', sans-serif", type: "google" },
  { label: "Lato", value: "'Lato', sans-serif", type: "google" },
  { label: "Poppins", value: "'Poppins', sans-serif", type: "google" },
  { label: "Montserrat", value: "'Montserrat', sans-serif", type: "google" },
  { label: "Source Sans 3", value: "'Source Sans 3', sans-serif", type: "google" },
  { label: "Raleway", value: "'Raleway', sans-serif", type: "google" },
  { label: "Nunito", value: "'Nunito', sans-serif", type: "google" },
  { label: "Work Sans", value: "'Work Sans', sans-serif", type: "google" },
  { label: "Merriweather", value: "'Merriweather', serif", type: "google" },
  { label: "Playfair Display", value: "'Playfair Display', serif", type: "google" },
  { label: "Lora", value: "'Lora', serif", type: "google" },
  { label: "PT Serif", value: "'PT Serif', serif", type: "google" },
  { label: "Libre Baskerville", value: "'Libre Baskerville', serif", type: "google" },
  { label: "DM Sans", value: "'DM Sans', sans-serif", type: "google" },
  { label: "Outfit", value: "'Outfit', sans-serif", type: "google" },
  { label: "Plus Jakarta Sans", value: "'Plus Jakarta Sans', sans-serif", type: "google" },
  { label: "Manrope", value: "'Manrope', sans-serif", type: "google" },
  { label: "Space Grotesk", value: "'Space Grotesk', sans-serif", type: "google" },
];

// ── Shadow values ───────────────────────────────────────────────────────

export const SHADOW_VALUES: Record<string, string> = {
  none: "none",
  sm: "0 1px 2px 0 rgba(0,0,0,0.05)",
  md: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
  lg: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
  xl: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
};

// ── CSS custom properties ───────────────────────────────────────────────

export interface ThemeColors {
  primary?: string;
  secondary?: string;
  background?: string;
  text?: string;
  accent?: string;
  border?: string;
  starFilled?: string;
  starEmpty?: string;
}

export interface ThemeTypography {
  fontFamily?: string;
  headerSize?: string;
  bodySize?: string;
  smallSize?: string;
}

export interface ThemeLayout {
  maxWidth?: string;
  padding?: string;
  borderRadius?: string;
  gap?: string;
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  cardStyle?: "flat" | "elevated" | "bordered" | "glass";
}

function buildSemanticThemeVars(colors?: ThemeColors): Record<string, string> {
  const primary = colors?.primary ?? "#52796f";
  const background = colors?.background ?? "#ffffff";
  const text = colors?.text ?? "#1a1a2e";
  const accent = colors?.accent ?? primary;
  const border = colors?.border ?? "#e5e7eb";

  return {
    "--rw-surface": background,
    "--rw-text-muted": `color-mix(in srgb, ${text} 72%, ${background} 28%)`,
    "--rw-text-subtle": `color-mix(in srgb, ${text} 52%, ${background} 48%)`,
    "--rw-text-secondary": `color-mix(in srgb, ${text} 72%, ${background} 28%)`,
    "--rw-surface-muted": `color-mix(in srgb, ${background} 90%, ${primary} 10%)`,
    "--rw-surface-strong": `color-mix(in srgb, ${background} 78%, ${text} 22%)`,
    "--rw-border-soft": `color-mix(in srgb, ${border} 72%, ${background} 28%)`,
    "--rw-featured-start": `color-mix(in srgb, ${accent} 8%, ${background} 92%)`,
    "--rw-featured-end": `color-mix(in srgb, ${accent} 14%, ${background} 86%)`,
  };
}

/** Generate CSS custom properties string for Shadow DOM :host injection */
export function generateThemeCSSProperties(
  colors?: ThemeColors,
  typography?: ThemeTypography,
  layout?: ThemeLayout,
): string {
  const props: string[] = [];

  if (colors?.primary) props.push(`--rw-primary: ${colors.primary}`);
  if (colors?.background) props.push(`--rw-bg: ${colors.background}`);
  if (colors?.text) props.push(`--rw-text: ${colors.text}`);
  if (colors?.accent) props.push(`--rw-accent: ${colors.accent}`);
  if (colors?.starFilled) props.push(`--rw-star-fill: ${colors.starFilled}`);
  if (colors?.starEmpty) props.push(`--rw-star-empty: ${colors.starEmpty}`);
  if (colors?.border) props.push(`--rw-border: ${colors.border}`);

  if (typography?.fontFamily) props.push(`--rw-font: ${typography.fontFamily}`);
  if (typography?.headerSize) props.push(`--rw-heading-size: ${typography.headerSize}`);
  if (typography?.bodySize) props.push(`--rw-body-size: ${typography.bodySize}`);

  if (layout?.borderRadius) props.push(`--rw-radius: ${layout.borderRadius}`);
  if (layout?.shadow) props.push(`--rw-shadow: ${SHADOW_VALUES[layout.shadow] ?? "none"}`);
  if (layout?.padding) props.push(`--rw-padding: ${layout.padding}`);
  if (layout?.maxWidth) props.push(`--rw-max-width: ${layout.maxWidth}`);

  for (const [key, value] of Object.entries(buildSemanticThemeVars(colors))) {
    props.push(`${key}: ${value}`);
  }

  return props.join("; ");
}

/** Generate a CSS style object for React inline styles */
export function generateThemeStyleObject(
  colors?: ThemeColors,
  typography?: ThemeTypography,
  layout?: ThemeLayout,
): Record<string, string> {
  const style: Record<string, string> = {};

  if (colors?.primary) style["--rw-primary"] = colors.primary;
  if (colors?.background) style["--rw-bg"] = colors.background;
  if (colors?.text) style["--rw-text"] = colors.text;
  if (colors?.accent) style["--rw-accent"] = colors.accent;
  if (colors?.starFilled) style["--rw-star-fill"] = colors.starFilled;
  if (colors?.starEmpty) style["--rw-star-empty"] = colors.starEmpty;
  if (colors?.border) style["--rw-border"] = colors.border;

  if (typography?.fontFamily) style["--rw-font"] = typography.fontFamily;
  if (typography?.headerSize) style["--rw-heading-size"] = typography.headerSize;
  if (typography?.bodySize) style["--rw-body-size"] = typography.bodySize;

  if (layout?.borderRadius) style["--rw-radius"] = layout.borderRadius;
  if (layout?.shadow) style["--rw-shadow"] = SHADOW_VALUES[layout.shadow] ?? "none";
  if (layout?.padding) style["--rw-padding"] = layout.padding;
  if (layout?.maxWidth) style["--rw-max-width"] = layout.maxWidth;

  Object.assign(style, buildSemanticThemeVars(colors));

  return style;
}

// ── Google Fonts loading ────────────────────────────────────────────────

/** Extract the Google Font family name from a CSS font-family value */
function extractGoogleFontName(fontFamily: string): string | null {
  const match = FONT_OPTIONS.find(
    (f) => f.value === fontFamily && f.type === "google",
  );
  return match ? match.label : null;
}

/** Build a Google Fonts <link> URL for a given font family value */
export function getGoogleFontUrl(fontFamily: string): string | null {
  const name = extractGoogleFontName(fontFamily);
  if (!name) return null;
  const encoded = name.replace(/\s+/g, "+");
  return `https://fonts.googleapis.com/css2?family=${encoded}:wght@300;400;500;600;700&display=swap`;
}

/** Generate a <link> tag string for Shadow DOM injection */
export function getGoogleFontLinkTag(fontFamily: string): string | null {
  const url = getGoogleFontUrl(fontFamily);
  if (!url) return null;
  return `<link rel="stylesheet" href="${url}" />`;
}

// ── WCAG contrast ratio ─────────────────────────────────────────────────

/** Parse a hex color string to [r, g, b] */
function hexToRgb(hex: string): [number, number, number] | null {
  const cleaned = hex.replace("#", "");
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return [r, g, b];
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return [r, g, b];
  }
  return null;
}

/** Calculate relative luminance per WCAG 2.1 */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Calculate contrast ratio between two hex colors (returns ratio like 4.5) */
export function getContrastRatio(color1: string, color2: string): number | null {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  if (!rgb1 || !rgb2) return null;

  const l1 = relativeLuminance(...rgb1);
  const l2 = relativeLuminance(...rgb2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG AA requires 4.5:1 for normal text, 3:1 for large text */
export function checkWcagContrast(
  textColor: string,
  bgColor: string,
): { ratio: number; passNormal: boolean; passLarge: boolean } | null {
  const ratio = getContrastRatio(textColor, bgColor);
  if (ratio === null) return null;
  return {
    ratio: Math.round(ratio * 100) / 100,
    passNormal: ratio >= 4.5,
    passLarge: ratio >= 3,
  };
}

export interface ContrastWarning {
  pair: string;
  textColor: string;
  bgColor: string;
  ratio: number;
  passNormal: boolean;
  passLarge: boolean;
}

// ── Brand color derivation ──────────────────────────────────────────────

/** Lighten a hex color by a factor (0-1). 0 = no change, 1 = white. */
export function lightenHex(hex: string, factor: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb.map((c) => Math.round(c + (255 - c) * factor));
  return `#${[r, g, b].map((c) => Math.min(255, c).toString(16).padStart(2, "0")).join("")}`;
}

/** Darken a hex color by a factor (0-1). 0 = no change, 1 = black. */
export function darkenHex(hex: string, factor: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb.map((c) => Math.round(c * (1 - factor)));
  return `#${[r, g, b].map((c) => Math.max(0, c).toString(16).padStart(2, "0")).join("")}`;
}

/** Generate a brand_match theme config from org brand colors */
export function buildBrandMatchPreset(
  primaryColor: string,
  secondaryColor: string,
  fontFamily: string,
) {
  return {
    colors: {
      primary: primaryColor,
      secondary: secondaryColor,
      background: lightenHex(primaryColor, 0.95),
      text: darkenHex(primaryColor, 0.6),
      accent: secondaryColor,
      border: lightenHex(primaryColor, 0.8),
      starFilled: "#f59e0b",
      starEmpty: lightenHex(primaryColor, 0.8),
    },
    typography: {
      fontFamily,
      headerSize: "18px",
      bodySize: "14px",
    },
    layout: {
      maxWidth: "600px",
      padding: "16px",
      borderRadius: "8px",
      shadow: "sm" as const,
      cardStyle: "bordered" as const,
    },
  };
}

/** Check all relevant color pairs and return any contrast warnings */
export function getContrastWarnings(colors: ThemeColors): ContrastWarning[] {
  const warnings: ContrastWarning[] = [];
  const bg = colors.background ?? "#ffffff";
  const pairs: [string, string, string][] = [
    ["Text / Background", colors.text ?? "#1a1a2e", bg],
    ["Primary / Background", colors.primary ?? "#52796f", bg],
    ["Accent / Background", colors.accent ?? "#52796f", bg],
  ];

  for (const [pair, fg, background] of pairs) {
    const result = checkWcagContrast(fg, background);
    if (result) {
      warnings.push({
        pair,
        textColor: fg,
        bgColor: background,
        ...result,
      });
    }
  }

  return warnings;
}
