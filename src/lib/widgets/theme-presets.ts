/**
 * Shared theme preset definitions.
 * Importable by both the dashboard Widget Builder and the embed script.
 *
 * Each preset provides a complete set of color, typography, and layout values
 * that map to CSS custom properties (--rw-*) at render time.
 */

// ── Types ──────────────────────────────────────────────────────────────

export interface ThemePresetColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
  border: string;
  starFilled: string;
  starEmpty: string;
}

export interface ThemePresetTypography {
  fontFamily: string;
  headerSize: string;
  bodySize: string;
}

export interface ThemePresetLayout {
  maxWidth: string;
  padding: string;
  borderRadius: string;
  shadow: "none" | "sm" | "md" | "lg" | "xl";
  cardStyle: "flat" | "elevated" | "bordered" | "glass";
}

export interface ThemePresetConfig {
  label: string;
  colors: ThemePresetColors;
  typography: ThemePresetTypography;
  layout: ThemePresetLayout;
  /** Simplified colors used for the miniature preview thumbnail */
  preview: { bg: string; accent: string; text: string };
}

export type ThemePresetKey =
  | "clean_white"
  | "dark"
  | "brand_match"
  | "mortgage_classic"
  | "modern_minimal"
  | "trust_badge"
  | "social_card"
  | "custom";

// ── Preset definitions ─────────────────────────────────────────────────

export const THEME_PRESETS: Record<ThemePresetKey, ThemePresetConfig> = {
  clean_white: {
    label: "Clean White",
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
    typography: {
      fontFamily: "system-ui",
      headerSize: "18px",
      bodySize: "14px",
    },
    layout: {
      maxWidth: "600px",
      padding: "16px",
      borderRadius: "8px",
      shadow: "sm",
      cardStyle: "bordered",
    },
    preview: { bg: "#ffffff", accent: "#2563eb", text: "#374151" },
  },

  dark: {
    label: "Dark",
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
    typography: {
      fontFamily: "system-ui",
      headerSize: "18px",
      bodySize: "14px",
    },
    layout: {
      maxWidth: "600px",
      padding: "16px",
      borderRadius: "8px",
      shadow: "md",
      cardStyle: "elevated",
    },
    preview: { bg: "#1e1e2e", accent: "#60a5fa", text: "#e2e8f0" },
  },

  brand_match: {
    label: "Brand Match",
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
    typography: {
      fontFamily: "'Source Sans 3', sans-serif",
      headerSize: "18px",
      bodySize: "14px",
    },
    layout: {
      maxWidth: "600px",
      padding: "16px",
      borderRadius: "8px",
      shadow: "sm",
      cardStyle: "bordered",
    },
    preview: { bg: "#f8faf8", accent: "#52796f", text: "#2f3e46" },
  },

  mortgage_classic: {
    label: "Mortgage Classic",
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
    typography: {
      fontFamily: "Georgia, serif",
      headerSize: "20px",
      bodySize: "14px",
    },
    layout: {
      maxWidth: "600px",
      padding: "20px",
      borderRadius: "4px",
      shadow: "md",
      cardStyle: "bordered",
    },
    preview: { bg: "#ffffff", accent: "#1e3a5f", text: "#1e3a5f" },
  },

  modern_minimal: {
    label: "Modern Minimal",
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
    typography: {
      fontFamily: "'Inter', sans-serif",
      headerSize: "16px",
      bodySize: "14px",
    },
    layout: {
      maxWidth: "600px",
      padding: "16px",
      borderRadius: "2px",
      shadow: "none",
      cardStyle: "flat",
    },
    preview: { bg: "#ffffff", accent: "#171717", text: "#171717" },
  },

  trust_badge: {
    label: "Trust Badge",
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
    typography: {
      fontFamily: "system-ui",
      headerSize: "18px",
      bodySize: "14px",
    },
    layout: {
      maxWidth: "600px",
      padding: "16px",
      borderRadius: "12px",
      shadow: "sm",
      cardStyle: "elevated",
    },
    preview: { bg: "#f0fdf4", accent: "#166534", text: "#14532d" },
  },

  social_card: {
    label: "Social Card",
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
    typography: {
      fontFamily: "'Poppins', sans-serif",
      headerSize: "18px",
      bodySize: "14px",
    },
    layout: {
      maxWidth: "600px",
      padding: "20px",
      borderRadius: "16px",
      shadow: "lg",
      cardStyle: "elevated",
    },
    preview: { bg: "#ffffff", accent: "#7c3aed", text: "#1f2937" },
  },

  custom: {
    label: "Custom",
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
    typography: {
      fontFamily: "system-ui",
      headerSize: "18px",
      bodySize: "14px",
    },
    layout: {
      maxWidth: "600px",
      padding: "16px",
      borderRadius: "8px",
      shadow: "sm",
      cardStyle: "bordered",
    },
    preview: { bg: "#ffffff", accent: "#2563eb", text: "#1a1a2e" },
  },
};

/** Get a preset config by key, falling back to clean_white */
export function getPreset(key: string): ThemePresetConfig {
  return THEME_PRESETS[key as ThemePresetKey] ?? THEME_PRESETS.clean_white;
}

/** All preset keys in display order */
export const PRESET_KEYS: ThemePresetKey[] = [
  "clean_white",
  "dark",
  "brand_match",
  "mortgage_classic",
  "modern_minimal",
  "trust_badge",
  "social_card",
  "custom",
];
