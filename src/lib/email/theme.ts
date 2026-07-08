/**
 * Email Design System Theme - Repwell Brand Guidelines
 *
 * This file contains all design tokens for email templates,
 * following the Repwell design system specifications.
 */

import { brandColors } from "@/lib/brand/colors";

// =============================================================================
// COLOR PALETTE
// =============================================================================

export const colors = {
  // Brand Colors
  repwell: brandColors.repwell,

  // Semantic Colors
  primary: brandColors.primary,
  primaryHover: brandColors.primaryHover,
  primaryLight: brandColors.primaryLight,

  secondary: brandColors.secondary,
  secondaryHover: brandColors.secondaryHover,

  // Background Colors
  background: brandColors.background,

  // Text Colors
  text: brandColors.text,

  // Border Colors
  border: brandColors.border,

  // Accent Colors (for status indicators)
  accent: brandColors.accent,

  // Legacy compatibility (for existing templates)
  legacy: {
    gray: {
      50: "#fafafa",
      100: "#f4f4f5",
      200: "#e4e4e7",
      300: "#d4d4d8",
      400: "#a1a1aa",
      500: "#71717a",
      600: "#52525b",
      700: "#3f3f46",
      800: "#27272a",
      900: "#18181b",
    },
  },
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  // Font Families (email-safe)
  fontFamily: {
    // Display/Headlines - serif fallback for emails
    display: '"Georgia", "Times New Roman", "Libre Baskerville", Times, serif',
    // Body/UI - Source Sans 3 with fallbacks
    body: '"Source Sans 3", "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    // Monospace for code
    mono: '"SF Mono", "Monaco", "Inconsolata", "Fira Mono", "Droid Sans Mono", "Source Code Pro", monospace',
  },

  // Font Sizes
  fontSize: {
    xs: "12px",
    sm: "14px",
    base: "16px",
    lg: "18px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "30px",
    "4xl": "36px",
    "5xl": "48px",
  },

  // Font Weights
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },

  // Line Heights
  lineHeight: {
    tight: "1.25",
    normal: "1.5",
    relaxed: "1.625",
    loose: "2",
  },

  // Letter Spacing
  letterSpacing: {
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },
} as const;

// =============================================================================
// SPACING
// =============================================================================

export const spacing = {
  0: "0",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
} as const;

// =============================================================================
// LAYOUT
// =============================================================================

export const layout = {
  // Max widths for email containers
  maxWidth: {
    email: "600px", // Standard email max width
    narrow: "480px", // Narrow content
    content: "560px", // Content area with padding
  },

  // Border radius
  borderRadius: {
    sm: "4px",
    md: "6px",
    lg: "8px",
    xl: "12px",
    "2xl": "16px",
    full: "9999px",
  },
} as const;

// =============================================================================
// SHADOWS
// =============================================================================

export const shadows = {
  sm: "0 1px 2px 0 rgba(47, 62, 70, 0.05)",
  md: "0 4px 6px -1px rgba(47, 62, 70, 0.1), 0 2px 4px -2px rgba(47, 62, 70, 0.1)",
  lg: "0 10px 15px -3px rgba(47, 62, 70, 0.1), 0 4px 6px -4px rgba(47, 62, 70, 0.1)",
} as const;

// =============================================================================
// GRADIENTS
// =============================================================================

export const gradients = {
  // Brand gradient for accent bars
  brandAccent: `linear-gradient(to right, ${colors.repwell.teal[300]}, ${colors.repwell.sage[200]})`,
  // Subtle background gradient
  subtleBackground: `linear-gradient(to bottom, ${colors.background.subtle}, ${colors.background.white})`,
  // Dark section gradient
  darkSection: `linear-gradient(to right, ${colors.repwell.teal[500]}, ${colors.repwell.teal[400]})`,
} as const;

// =============================================================================
// EMAIL-SPECIFIC STYLES
// =============================================================================

export const emailStyles = {
  // Base container styles
  container: {
    maxWidth: layout.maxWidth.email,
    margin: "0 auto",
    backgroundColor: colors.background.white,
  },

  // Wrapper styles for outer padding
  wrapper: {
    padding: `${spacing[10]} ${spacing[4]}`,
    backgroundColor: colors.background.subtle,
  },

  // Content section styles
  section: {
    padding: `${spacing[8]} ${spacing[6]}`,
  },

  // Dark mode media query support
  darkMode: {
    mediaQuery: "@media (prefers-color-scheme: dark)",
    backgroundColor: colors.repwell.teal[500],
    textColor: colors.text.inverse,
    mutedTextColor: colors.text.inverseMuted,
  },
} as const;

// =============================================================================
// BUTTON STYLES
// =============================================================================

export const buttonStyles = {
  base: {
    display: "inline-block",
    textDecoration: "none",
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    borderRadius: layout.borderRadius.lg,
    textAlign: "center" as const,
    transition: "all 0.2s ease",
  },
  sizes: {
    sm: {
      padding: `${spacing[2]} ${spacing[4]}`,
      fontSize: typography.fontSize.sm,
    },
    md: {
      padding: `${spacing[3]} ${spacing[6]}`,
      fontSize: typography.fontSize.base,
    },
    lg: {
      padding: `${spacing[4]} ${spacing[8]}`,
      fontSize: typography.fontSize.base,
    },
  },
  variants: {
    primary: {
      backgroundColor: colors.primary,
      color: colors.text.inverse,
      border: "none",
    },
    secondary: {
      backgroundColor: "transparent",
      color: colors.repwell.teal[400],
      border: `2px solid ${colors.primary}`,
    },
    ghost: {
      backgroundColor: "transparent",
      color: colors.primary,
      border: "none",
    },
    inverse: {
      backgroundColor: colors.background.white,
      color: colors.repwell.teal[500],
      border: "none",
    },
  },
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate inline styles from a style object
 */
export function inlineStyles(styles: Record<string, string | number>): string {
  return Object.entries(styles)
    .map(([key, value]) => `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`)
    .join("; ");
}

/**
 * Merge multiple style objects
 */
export function mergeStyles(
  ...styleObjects: Array<Record<string, string | number>>
): Record<string, string | number> {
  return Object.assign({}, ...styleObjects);
}

// Export the complete theme
export const emailTheme = {
  colors,
  typography,
  spacing,
  layout,
  shadows,
  gradients,
  emailStyles,
  buttonStyles,
} as const;

export type EmailTheme = typeof emailTheme;
