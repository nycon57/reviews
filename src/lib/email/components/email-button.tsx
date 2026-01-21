import * as React from "react";
import { Button, Section, Row, Column } from "@react-email/components";
import { colors, typography, spacing, layout } from "../theme";

// =============================================================================
// EMAIL BUTTON COMPONENT
// =============================================================================

export interface EmailButtonProps {
  /** Button URL */
  href: string;
  /** Button text */
  children: React.ReactNode;
  /** Button variant */
  variant?: "primary" | "secondary" | "ghost" | "inverse" | "success" | "warning" | "danger";
  /** Button size */
  size?: "sm" | "md" | "lg";
  /** Full width button */
  fullWidth?: boolean;
  /** Custom background color (overrides variant) */
  backgroundColor?: string;
  /** Custom text color (overrides variant) */
  textColor?: string;
  /** Custom border color */
  borderColor?: string;
  /** Align button */
  align?: "left" | "center" | "right";
}

/**
 * Styled button component following Repwell design guidelines.
 * Uses bulletproof button technique for maximum email client compatibility.
 */
export function EmailButton({
  href,
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  backgroundColor,
  textColor,
  borderColor,
  align = "center",
}: EmailButtonProps) {
  // Variant styles
  const variantConfig = {
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
    success: {
      backgroundColor: colors.accent.success,
      color: colors.text.inverse,
      border: "none",
    },
    warning: {
      backgroundColor: colors.accent.warning,
      color: colors.text.primary,
      border: "none",
    },
    danger: {
      backgroundColor: colors.accent.error,
      color: colors.text.inverse,
      border: "none",
    },
  };

  // Size styles
  const sizeConfig = {
    sm: {
      padding: `${spacing[2]} ${spacing[4]}`,
      fontSize: typography.fontSize.sm,
      borderRadius: layout.borderRadius.md,
    },
    md: {
      padding: `${spacing[3]} ${spacing[6]}`,
      fontSize: typography.fontSize.base,
      borderRadius: layout.borderRadius.lg,
    },
    lg: {
      padding: `${spacing[4]} ${spacing[8]}`,
      fontSize: typography.fontSize.base,
      borderRadius: layout.borderRadius.lg,
    },
  };

  const config = variantConfig[variant];
  const sizeStyle = sizeConfig[size];

  // Note: msoLineHeightRule and msoPaddingAlt are valid MSO-specific CSS properties for Outlook email clients
  const buttonStyle = {
    display: "inline-block",
    textDecoration: "none",
    fontFamily: typography.fontFamily.body,
    fontSize: sizeStyle.fontSize,
    fontWeight: typography.fontWeight.semibold,
    textAlign: "center",
    backgroundColor: backgroundColor || config.backgroundColor,
    color: textColor || config.color,
    border: borderColor ? `2px solid ${borderColor}` : config.border,
    borderRadius: sizeStyle.borderRadius,
    padding: sizeStyle.padding,
    width: fullWidth ? "100%" : "auto",
    boxSizing: "border-box",
    msoLineHeightRule: "exactly",
    msoPaddingAlt: sizeStyle.padding,
  } as React.CSSProperties;

  return (
    <Section style={{ textAlign: align }}>
      <Button href={href} style={buttonStyle}>
        {children}
      </Button>
    </Section>
  );
}

// =============================================================================
// BUTTON GROUP COMPONENT
// =============================================================================

export interface EmailButtonGroupProps {
  /** Array of button configurations */
  buttons: Array<{
    href: string;
    label: string;
    variant?: "primary" | "secondary" | "ghost" | "inverse";
  }>;
  /** Alignment */
  align?: "left" | "center" | "right";
  /** Gap between buttons */
  gap?: string;
  /** Stack buttons vertically on mobile */
  stackOnMobile?: boolean;
}

/**
 * Group of buttons arranged horizontally (stacks on mobile).
 */
export function EmailButtonGroup({
  buttons,
  align = "center",
  gap = spacing[3],
  stackOnMobile = true,
}: EmailButtonGroupProps) {
  if (buttons.length === 0) return null;

  return (
    <Section style={{ textAlign: align }}>
      <Row>
        {buttons.map((button, index) => (
          <Column
            key={index}
            className={stackOnMobile ? "mobile-stack" : undefined}
            style={{
              display: "inline-block",
              paddingLeft: index > 0 ? gap : "0",
              paddingBottom: stackOnMobile ? gap : "0",
            }}
          >
            <EmailButton
              href={button.href}
              variant={button.variant || (index === 0 ? "primary" : "secondary")}
              align={align}
            >
              {button.label}
            </EmailButton>
          </Column>
        ))}
      </Row>
    </Section>
  );
}

// =============================================================================
// ICON BUTTON COMPONENT
// =============================================================================

export interface IconButtonProps {
  /** Button URL */
  href: string;
  /** Icon image URL (inline SVG data URI recommended) */
  iconUrl: string;
  /** Icon alt text */
  iconAlt: string;
  /** Optional label text */
  label?: string;
  /** Variant */
  variant?: "primary" | "secondary" | "ghost";
  /** Size */
  size?: "sm" | "md" | "lg";
}

/**
 * Button with leading icon.
 * For email compatibility, icons should be inline SVG data URIs.
 */
export function IconButton({
  href,
  iconUrl,
  iconAlt,
  label,
  variant = "primary",
  size = "md",
}: IconButtonProps) {
  const iconSize = {
    sm: "16px",
    md: "20px",
    lg: "24px",
  };

  const variantConfig = {
    primary: {
      backgroundColor: colors.primary,
      color: colors.text.inverse,
    },
    secondary: {
      backgroundColor: "transparent",
      color: colors.repwell.teal[400],
    },
    ghost: {
      backgroundColor: "transparent",
      color: colors.primary,
    },
  };

  const sizeConfig = {
    sm: {
      padding: `${spacing[2]} ${spacing[3]}`,
      fontSize: typography.fontSize.sm,
    },
    md: {
      padding: `${spacing[3]} ${spacing[5]}`,
      fontSize: typography.fontSize.base,
    },
    lg: {
      padding: `${spacing[4]} ${spacing[6]}`,
      fontSize: typography.fontSize.base,
    },
  };

  const config = variantConfig[variant];
  const sizeStyle = sizeConfig[size];

  return (
    <Button
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: spacing[2],
        textDecoration: "none",
        fontFamily: typography.fontFamily.body,
        fontSize: sizeStyle.fontSize,
        fontWeight: typography.fontWeight.semibold,
        textAlign: "center",
        backgroundColor: config.backgroundColor,
        color: config.color,
        border: variant === "secondary" ? `2px solid ${colors.primary}` : "none",
        borderRadius: layout.borderRadius.lg,
        padding: sizeStyle.padding,
      }}
    >
      <img
        src={iconUrl}
        alt={iconAlt}
        width={iconSize[size]}
        height={iconSize[size]}
        style={{
          display: "inline-block",
          verticalAlign: "middle",
        }}
      />
      {label && <span style={{ verticalAlign: "middle" }}>{label}</span>}
    </Button>
  );
}

// =============================================================================
// TEXT LINK BUTTON
// =============================================================================

export interface TextLinkButtonProps {
  /** Button URL */
  href: string;
  /** Link text */
  children: React.ReactNode;
  /** Show arrow icon */
  showArrow?: boolean;
  /** Arrow direction */
  arrowDirection?: "right" | "left";
  /** Color */
  color?: string;
}

/**
 * Text-style link that looks like a subtle button.
 * Useful for secondary actions.
 */
export function TextLinkButton({
  href,
  children,
  showArrow = true,
  arrowDirection = "right",
  color,
}: TextLinkButtonProps) {
  const arrow = arrowDirection === "right" ? " \u2192" : "\u2190 ";

  return (
    <Button
      href={href}
      style={{
        display: "inline-block",
        textDecoration: "none",
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: color || colors.primary,
        backgroundColor: "transparent",
        border: "none",
        padding: `${spacing[2]} 0`,
      }}
    >
      {arrowDirection === "left" && showArrow && arrow}
      {children}
      {arrowDirection === "right" && showArrow && arrow}
    </Button>
  );
}

// =============================================================================
// ACTION BUTTONS (PRE-CONFIGURED)
// =============================================================================

/**
 * Primary CTA button - most prominent action.
 */
export function PrimaryButton({
  href,
  children,
  size = "md",
  fullWidth = false,
  align = "center",
}: Omit<EmailButtonProps, "variant">) {
  return (
    <EmailButton
      href={href}
      variant="primary"
      size={size}
      fullWidth={fullWidth}
      align={align}
    >
      {children}
    </EmailButton>
  );
}

/**
 * Secondary CTA button - alternative action.
 */
export function SecondaryButton({
  href,
  children,
  size = "md",
  fullWidth = false,
  align = "center",
}: Omit<EmailButtonProps, "variant">) {
  return (
    <EmailButton
      href={href}
      variant="secondary"
      size={size}
      fullWidth={fullWidth}
      align={align}
    >
      {children}
    </EmailButton>
  );
}

/**
 * Ghost button - minimal emphasis action.
 */
export function GhostButton({
  href,
  children,
  size = "md",
  align = "center",
}: Omit<EmailButtonProps, "variant" | "fullWidth">) {
  return (
    <EmailButton href={href} variant="ghost" size={size} align={align}>
      {children}
    </EmailButton>
  );
}
