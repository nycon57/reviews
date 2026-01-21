/**
 * Color Utilities for Remotion Compositions
 *
 * Functions for working with colors in video compositions.
 */

import { REPWELL_COLORS } from "../types";

/**
 * Convert hex color to RGB object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/**
 * Interpolate between two colors
 * @param color1 Start color (hex)
 * @param color2 End color (hex)
 * @param progress Progress from 0 to 1
 */
export function interpolateColor(color1: string, color2: string, progress: number): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return color1;

  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * progress);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * progress);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * progress);

  return rgbToHex(r, g, b);
}

/**
 * Get contrasting text color (black or white) for a background
 */
export function getContrastingTextColor(bgColor: string): string {
  const rgb = hexToRgb(bgColor);
  if (!rgb) return REPWELL_COLORS.teal[500];

  // Calculate luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  return luminance > 0.5 ? REPWELL_COLORS.teal[500] : REPWELL_COLORS.white;
}

/**
 * Darken a color by a percentage
 */
export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = 1 - percent / 100;
  return rgbToHex(
    Math.round(rgb.r * factor),
    Math.round(rgb.g * factor),
    Math.round(rgb.b * factor)
  );
}

/**
 * Lighten a color by a percentage
 */
export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = percent / 100;
  return rgbToHex(
    Math.round(rgb.r + (255 - rgb.r) * factor),
    Math.round(rgb.g + (255 - rgb.g) * factor),
    Math.round(rgb.b + (255 - rgb.b) * factor)
  );
}

/**
 * Add opacity to a hex color, returning rgba string
 */
export function withOpacity(hex: string, opacity: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

/**
 * Get default colors if organization colors are not set
 */
export function getOrganizationColors(
  primaryColor: string | null,
  secondaryColor: string | null
) {
  return {
    primary: primaryColor || REPWELL_COLORS.teal[300],
    secondary: secondaryColor || REPWELL_COLORS.sage[200],
    background: REPWELL_COLORS.white,
    text: REPWELL_COLORS.teal[500],
    textMuted: REPWELL_COLORS.teal[400],
  };
}

/**
 * Generate gradient string for backgrounds
 */
export function generateGradient(
  color1: string,
  color2: string,
  angle: number = 135
): string {
  return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
}

/**
 * Preset gradients based on design system
 */
export const PRESET_GRADIENTS = {
  sage: generateGradient(REPWELL_COLORS.sage[100], REPWELL_COLORS.sage[200]),
  teal: generateGradient(REPWELL_COLORS.teal[300], REPWELL_COLORS.teal[400]),
  warm: generateGradient(
    lightenColor(REPWELL_COLORS.sage[100], 20),
    REPWELL_COLORS.sage[100]
  ),
  subtle: generateGradient(
    withOpacity(REPWELL_COLORS.sage[100], 0.3),
    withOpacity(REPWELL_COLORS.teal[300], 0.1)
  ),
} as const;
