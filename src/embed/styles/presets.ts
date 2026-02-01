/**
 * Embed-side theme preset defaults.
 *
 * These mirror the dashboard's theme-presets.ts but are compiled standalone
 * into embed.js (no imports from the main app). Used to resolve a preset name
 * to its full theme config when the widget config only specifies a preset key.
 */

import type { WidgetThemeColors, WidgetThemeTypography, WidgetThemeLayout } from "../types";

export interface EmbedPreset {
  colors: WidgetThemeColors;
  typography: WidgetThemeTypography;
  layout: WidgetThemeLayout;
}

export const EMBED_PRESETS: Record<string, EmbedPreset> = {
  clean_white: {
    colors: {
      primary: "#2563eb",
      secondary: "#3b82f6",
      background: "#ffffff",
      text: "#374151",
      accent: "#2563eb",
      border: "#e5e7eb",
      starFilled: "#f59e0b",
      starEmpty: "#d1d5db",
    },
    typography: { fontFamily: "system-ui", headerSize: "18px", bodySize: "14px" },
    layout: {
      maxWidth: "600px",
      padding: "16px",
      borderRadius: "8px",
      shadow: "sm",
      cardStyle: "bordered",
    },
  },
  dark: {
    colors: {
      primary: "#60a5fa",
      secondary: "#818cf8",
      background: "#1e1e2e",
      text: "#e2e8f0",
      accent: "#60a5fa",
      border: "#334155",
      starFilled: "#fbbf24",
      starEmpty: "#475569",
    },
    typography: { fontFamily: "system-ui", headerSize: "18px", bodySize: "14px" },
    layout: {
      maxWidth: "600px",
      padding: "16px",
      borderRadius: "8px",
      shadow: "md",
      cardStyle: "elevated",
    },
  },
  brand_match: {
    colors: {
      primary: "#52796f",
      secondary: "#354f52",
      background: "#f8faf8",
      text: "#2f3e46",
      accent: "#84a98c",
      border: "#cad2c5",
      starFilled: "#f59e0b",
      starEmpty: "#cad2c5",
    },
    typography: { fontFamily: "'Source Sans 3', sans-serif", headerSize: "18px", bodySize: "14px" },
    layout: {
      maxWidth: "600px",
      padding: "16px",
      borderRadius: "8px",
      shadow: "sm",
      cardStyle: "bordered",
    },
  },
  mortgage_classic: {
    colors: {
      primary: "#1e3a5f",
      secondary: "#2c5282",
      background: "#ffffff",
      text: "#1e3a5f",
      accent: "#c5a35a",
      border: "#d4d9e1",
      starFilled: "#c5a35a",
      starEmpty: "#d4d9e1",
    },
    typography: { fontFamily: "Georgia, serif", headerSize: "20px", bodySize: "14px" },
    layout: {
      maxWidth: "600px",
      padding: "20px",
      borderRadius: "4px",
      shadow: "md",
      cardStyle: "bordered",
    },
  },
  modern_minimal: {
    colors: {
      primary: "#171717",
      secondary: "#404040",
      background: "#ffffff",
      text: "#171717",
      accent: "#171717",
      border: "#f0f0f0",
      starFilled: "#171717",
      starEmpty: "#e5e5e5",
    },
    typography: { fontFamily: "'Inter', sans-serif", headerSize: "16px", bodySize: "14px" },
    layout: {
      maxWidth: "600px",
      padding: "16px",
      borderRadius: "2px",
      shadow: "none",
      cardStyle: "flat",
    },
  },
  trust_badge: {
    colors: {
      primary: "#166534",
      secondary: "#15803d",
      background: "#f0fdf4",
      text: "#14532d",
      accent: "#22c55e",
      border: "#bbf7d0",
      starFilled: "#22c55e",
      starEmpty: "#bbf7d0",
    },
    typography: { fontFamily: "system-ui", headerSize: "18px", bodySize: "14px" },
    layout: {
      maxWidth: "600px",
      padding: "16px",
      borderRadius: "12px",
      shadow: "sm",
      cardStyle: "elevated",
    },
  },
  social_card: {
    colors: {
      primary: "#7c3aed",
      secondary: "#6d28d9",
      background: "#ffffff",
      text: "#1f2937",
      accent: "#7c3aed",
      border: "#e5e7eb",
      starFilled: "#f59e0b",
      starEmpty: "#d1d5db",
    },
    typography: { fontFamily: "'Poppins', sans-serif", headerSize: "18px", bodySize: "14px" },
    layout: {
      maxWidth: "600px",
      padding: "20px",
      borderRadius: "16px",
      shadow: "lg",
      cardStyle: "elevated",
    },
  },
  custom: {
    colors: {
      primary: "#2563eb",
      secondary: "#3b82f6",
      background: "#ffffff",
      text: "#1a1a2e",
      accent: "#2563eb",
      border: "#e5e7eb",
      starFilled: "#f59e0b",
      starEmpty: "#d1d5db",
    },
    typography: { fontFamily: "system-ui", headerSize: "18px", bodySize: "14px" },
    layout: {
      maxWidth: "600px",
      padding: "16px",
      borderRadius: "8px",
      shadow: "sm",
      cardStyle: "bordered",
    },
  },
};

/**
 * Resolve a preset name to its full theme config.
 * Returns the clean_white preset as fallback.
 */
export function resolvePreset(presetName: string | undefined): EmbedPreset {
  if (!presetName) return EMBED_PRESETS.clean_white;
  return EMBED_PRESETS[presetName] ?? EMBED_PRESETS.clean_white;
}
