"use client";

import * as React from "react";
import type { IconProps as PhosphorIconProps, IconWeight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/**
 * Brand colors for duotone icons
 */
export const brandColors = {
  primary: "#52796f", // repwell-teal-300
  secondary: "#84a98c", // repwell-sage-200
} as const;

/**
 * Icon size presets matching the design system
 */
export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  "2xl": 40,
} as const;

export type IconSize = keyof typeof iconSizes | number;

export interface IconWrapperProps {
  /**
   * The Phosphor icon component to render
   */
  icon: React.ComponentType<PhosphorIconProps>;

  /**
   * Icon weight - affects visual style
   * - regular: Default, clean look for UI elements
   * - duotone: Two-color for emphasis, feature cards, marketing
   * - bold: Strong emphasis, active states
   * - fill: Solid fill for selected/active states
   * - thin/light: Subtle, decorative
   */
  weight?: IconWeight;

  /**
   * Size preset or exact pixel value
   */
  size?: IconSize;

  /**
   * Primary color - for regular/bold/fill weights and duotone primary
   */
  color?: string;

  /**
   * Secondary color for duotone weight
   */
  duotoneColor?: string;

  /**
   * Use brand colors automatically (for duotone)
   */
  branded?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Accessible label for screen readers
   */
  "aria-label"?: string;
}

/**
 * Icon wrapper component with brand styling defaults
 *
 * @example
 * // Basic usage
 * <Icon icon={Star} size="md" />
 *
 * // Branded duotone
 * <Icon icon={Star} weight="duotone" branded />
 *
 * // Custom colors
 * <Icon icon={Star} weight="duotone" color="#52796f" duotoneColor="#84a98c" />
 */
export function Icon({
  icon: IconComponent,
  weight = "regular",
  size = "md",
  color,
  duotoneColor,
  branded = false,
  className,
  "aria-label": ariaLabel,
}: IconWrapperProps) {
  const pixelSize = typeof size === "number" ? size : iconSizes[size];

  // Apply brand colors for duotone when branded is true
  const iconProps: PhosphorIconProps = {
    size: pixelSize,
    weight,
    "aria-label": ariaLabel,
  };

  if (weight === "duotone") {
    if (branded) {
      iconProps.color = brandColors.primary;
      // Note: Phosphor's duotone uses opacity for secondary color
      // We set the primary color and the secondary is derived automatically
    } else if (color) {
      iconProps.color = color;
    }
  } else if (color) {
    iconProps.color = color;
  }

  return (
    <IconComponent
      {...iconProps}
      className={cn("shrink-0", className)}
    />
  );
}

/**
 * Utility to create a pre-configured icon with consistent settings
 */
export function createBrandedIcon(
  IconComponent: React.ComponentType<PhosphorIconProps>,
  defaultWeight: IconWeight = "duotone"
) {
  return function BrandedIcon(props: Omit<IconWrapperProps, "icon">) {
    return <Icon icon={IconComponent} weight={defaultWeight} branded {...props} />;
  };
}

// Export types
export type { IconWeight };
