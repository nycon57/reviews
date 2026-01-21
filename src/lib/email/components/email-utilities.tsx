import * as React from "react";
import { Section, Hr, Text } from "@react-email/components";
import { colors, typography, spacing, gradients } from "../theme";

// =============================================================================
// SPACER COMPONENT
// =============================================================================

export interface SpacerProps {
  /** Height of the spacer */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  /** Custom height (overrides size) */
  height?: string;
}

/**
 * Vertical spacer component for adding consistent spacing.
 */
export function Spacer({ size = "md", height }: SpacerProps) {
  const sizeMap = {
    xs: spacing[2],   // 8px
    sm: spacing[4],   // 16px
    md: spacing[6],   // 24px
    lg: spacing[8],   // 32px
    xl: spacing[10],  // 40px
    "2xl": spacing[12], // 48px
  };

  return (
    <Section
      style={{
        height: height || sizeMap[size],
        lineHeight: height || sizeMap[size],
        fontSize: "1px",
      }}
    >
      &nbsp;
    </Section>
  );
}

// =============================================================================
// DIVIDER COMPONENT
// =============================================================================

export interface DividerProps {
  /** Divider style variant */
  variant?: "solid" | "dashed" | "dotted" | "gradient";
  /** Divider color */
  color?: string;
  /** Divider thickness */
  thickness?: string;
  /** Vertical margin */
  margin?: string;
  /** Width percentage */
  width?: string;
}

/**
 * Horizontal divider component for separating content sections.
 */
export function Divider({
  variant = "solid",
  color = colors.border.default,
  thickness = "1px",
  margin = spacing[6],
  width = "100%",
}: DividerProps) {
  if (variant === "gradient") {
    return (
      <Section
        style={{
          margin: `${margin} auto`,
          width,
          height: thickness,
          background: gradients.brandAccent,
          borderRadius: "9999px",
        }}
      />
    );
  }

  return (
    <Hr
      style={{
        margin: `${margin} auto`,
        width,
        border: "none",
        borderTop: `${thickness} ${variant} ${color}`,
      }}
    />
  );
}

// =============================================================================
// TEXT DIVIDER COMPONENT
// =============================================================================

export interface TextDividerProps {
  /** Text to display in the center */
  text: string;
  /** Line color */
  lineColor?: string;
  /** Text color */
  textColor?: string;
  /** Vertical margin */
  margin?: string;
}

/**
 * Divider with centered text label.
 * Useful for "or", dates, or section labels.
 */
export function TextDivider({
  text,
  lineColor = colors.border.default,
  textColor = colors.text.muted,
  margin = spacing[6],
}: TextDividerProps) {
  return (
    <Section
      style={{
        margin: `${margin} 0`,
        textAlign: "center",
        position: "relative",
      }}
    >
      {/* Line behind text */}
      <Hr
        style={{
          border: "none",
          borderTop: `1px solid ${lineColor}`,
          margin: 0,
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
        }}
      />
      {/* Text label */}
      <Text
        style={{
          display: "inline-block",
          margin: 0,
          padding: `0 ${spacing[4]}`,
          backgroundColor: colors.background.white,
          fontFamily: typography.fontFamily.body,
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.medium,
          color: textColor,
          textTransform: "uppercase",
          letterSpacing: typography.letterSpacing.wide,
          position: "relative",
        }}
      >
        {text}
      </Text>
    </Section>
  );
}

// =============================================================================
// ACCENT BAR COMPONENT
// =============================================================================

export interface AccentBarProps {
  /** Bar color or 'gradient' for brand gradient */
  color?: "gradient" | "primary" | "success" | "warning" | "error" | string;
  /** Bar height */
  height?: string;
  /** Bar width */
  width?: string;
  /** Vertical margin */
  margin?: string;
  /** Align bar */
  align?: "left" | "center" | "right";
}

/**
 * Colored accent bar for visual emphasis.
 * Can be used as a decorative element or section indicator.
 */
export function AccentBar({
  color = "gradient",
  height = "4px",
  width = "100%",
  margin = "0",
  align = "left",
}: AccentBarProps) {
  const colorMap: Record<string, string> = {
    primary: colors.primary,
    success: colors.accent.success,
    warning: colors.accent.warning,
    error: colors.accent.error,
  };

  const textAlignMap = {
    left: "left" as const,
    center: "center" as const,
    right: "right" as const,
  };

  const style: React.CSSProperties = {
    height,
    width,
    margin: align === "center" ? `${margin} auto` : margin,
    marginLeft: align === "right" ? "auto" : undefined,
    borderRadius: "9999px",
  };

  if (color === "gradient") {
    style.background = gradients.brandAccent;
  } else {
    style.backgroundColor = colorMap[color] || color;
  }

  return (
    <Section style={{ textAlign: textAlignMap[align] }}>
      <Section style={style} />
    </Section>
  );
}

// =============================================================================
// BADGE COMPONENT
// =============================================================================

export interface BadgeProps {
  /** Badge text */
  children: React.ReactNode;
  /** Badge variant */
  variant?: "default" | "success" | "warning" | "error" | "info" | "brand";
  /** Badge size */
  size?: "sm" | "md";
}

/**
 * Inline badge component for status indicators and labels.
 */
export function Badge({
  children,
  variant = "default",
  size = "md",
}: BadgeProps) {
  const variantConfig = {
    default: {
      backgroundColor: colors.background.muted,
      color: colors.text.secondary,
    },
    success: {
      backgroundColor: "#dcfce7",
      color: "#166534",
    },
    warning: {
      backgroundColor: "#fef3c7",
      color: "#92400e",
    },
    error: {
      backgroundColor: "#fef2f2",
      color: "#991b1b",
    },
    info: {
      backgroundColor: "#eff6ff",
      color: "#1d4ed8",
    },
    brand: {
      backgroundColor: colors.repwell.sage[100],
      color: colors.repwell.teal[400],
    },
  };

  const sizeConfig = {
    sm: {
      padding: `${spacing[1]} ${spacing[2]}`,
      fontSize: typography.fontSize.xs,
    },
    md: {
      padding: `${spacing[1]} ${spacing[3]}`,
      fontSize: typography.fontSize.sm,
    },
  };

  const config = variantConfig[variant];
  const sizeStyle = sizeConfig[size];

  return (
    <Text
      style={{
        display: "inline-block",
        margin: 0,
        padding: sizeStyle.padding,
        fontFamily: typography.fontFamily.body,
        fontSize: sizeStyle.fontSize,
        fontWeight: typography.fontWeight.medium,
        color: config.color,
        backgroundColor: config.backgroundColor,
        borderRadius: "9999px",
        lineHeight: "1.2",
      }}
    >
      {children}
    </Text>
  );
}

// =============================================================================
// PILL COMPONENT
// =============================================================================

export interface PillProps {
  /** Pill text */
  children: React.ReactNode;
  /** Pill color */
  color?: string;
  /** Background color */
  backgroundColor?: string;
  /** Show dot indicator */
  showDot?: boolean;
  /** Dot color */
  dotColor?: string;
}

/**
 * Pill component for tags and categories.
 */
export function Pill({
  children,
  color = colors.text.muted,
  backgroundColor = colors.background.subtle,
  showDot = false,
  dotColor,
}: PillProps) {
  return (
    <Text
      style={{
        display: "inline-block",
        margin: 0,
        padding: `${spacing[1]} ${spacing[3]}`,
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        color,
        backgroundColor,
        borderRadius: "9999px",
        lineHeight: "1.4",
      }}
    >
      {showDot && (
        <span
          style={{
            display: "inline-block",
            width: "6px",
            height: "6px",
            backgroundColor: dotColor || color,
            borderRadius: "50%",
            marginRight: spacing[2],
            verticalAlign: "middle",
          }}
        />
      )}
      {children}
    </Text>
  );
}

// =============================================================================
// CALLOUT BOX COMPONENT
// =============================================================================

export interface CalloutBoxProps {
  /** Callout content */
  children: React.ReactNode;
  /** Callout variant */
  variant?: "default" | "info" | "tip" | "warning" | "important";
  /** Optional title */
  title?: string;
  /** Optional icon */
  icon?: string;
}

/**
 * Callout box for highlighting important information.
 */
export function CalloutBox({
  children,
  variant = "default",
  title,
  icon,
}: CalloutBoxProps) {
  const variantConfig = {
    default: {
      backgroundColor: colors.background.subtle,
      borderColor: colors.border.default,
      iconBg: colors.background.muted,
      titleColor: colors.text.primary,
      textColor: colors.text.secondary,
      defaultIcon: "💡",
    },
    info: {
      backgroundColor: "#eff6ff",
      borderColor: "#bfdbfe",
      iconBg: "#dbeafe",
      titleColor: "#1d4ed8",
      textColor: "#1e40af",
      defaultIcon: "ℹ️",
    },
    tip: {
      backgroundColor: colors.repwell.sage[100],
      borderColor: colors.repwell.sage[200],
      iconBg: colors.repwell.sage[200],
      titleColor: colors.repwell.teal[400],
      textColor: colors.repwell.teal[300],
      defaultIcon: "✨",
    },
    warning: {
      backgroundColor: "#fef3c7",
      borderColor: "#fcd34d",
      iconBg: "#fde68a",
      titleColor: "#92400e",
      textColor: "#a16207",
      defaultIcon: "⚠️",
    },
    important: {
      backgroundColor: "#fef2f2",
      borderColor: "#fecaca",
      iconBg: "#fee2e2",
      titleColor: "#991b1b",
      textColor: "#b91c1c",
      defaultIcon: "❗",
    },
  };

  const config = variantConfig[variant];
  const displayIcon = icon || config.defaultIcon;

  return (
    <Section
      style={{
        padding: spacing[4],
        backgroundColor: config.backgroundColor,
        border: `1px solid ${config.borderColor}`,
        borderRadius: "8px",
      }}
    >
      {/* Icon and title row */}
      {(displayIcon || title) && (
        <Section style={{ marginBottom: spacing[2] }}>
          {displayIcon && (
            <Text
              style={{
                display: "inline-block",
                margin: 0,
                marginRight: spacing[2],
                fontSize: typography.fontSize.lg,
                verticalAlign: "middle",
              }}
            >
              {displayIcon}
            </Text>
          )}
          {title && (
            <Text
              style={{
                display: "inline",
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: config.titleColor,
                verticalAlign: "middle",
              }}
            >
              {title}
            </Text>
          )}
        </Section>
      )}

      {/* Content */}
      <Text
        style={{
          margin: 0,
          fontFamily: typography.fontFamily.body,
          fontSize: typography.fontSize.sm,
          color: config.textColor,
          lineHeight: typography.lineHeight.normal,
        }}
      >
        {children}
      </Text>
    </Section>
  );
}

// =============================================================================
// HIDDEN PREHEADER COMPONENT
// =============================================================================

export interface HiddenPreheaderProps {
  /** Preheader text (preview text in email clients) */
  text: string;
  /** Minimum length to pad to (prevents showing email content) */
  minLength?: number;
}

/**
 * Hidden preheader text that appears in email client previews.
 * Pads with whitespace to prevent body content from showing.
 */
export function HiddenPreheader({ text, minLength = 150 }: HiddenPreheaderProps) {
  // Clamp minLength to reasonable bounds to prevent memory issues
  const clampedMinLength = Math.min(Math.max(minLength, 0), 500);

  // Pad with non-breaking spaces and zero-width characters
  const padding = clampedMinLength > text.length
    ? "\u200C\u00A0".repeat(Math.ceil((clampedMinLength - text.length) / 2))
    : "";

  // Note: msoHide is a valid MSO-specific CSS property for Outlook email clients
  const hiddenStyle = {
    display: "none",
    fontSize: "1px",
    lineHeight: "1px",
    maxHeight: "0px",
    maxWidth: "0px",
    opacity: 0,
    overflow: "hidden",
    msoHide: "all",
  } as React.CSSProperties;

  return (
    <Section style={hiddenStyle}>
      {text}
      {padding}
    </Section>
  );
}

// =============================================================================
// RESPONSIVE HIDE COMPONENT
// =============================================================================

export interface ResponsiveHideProps {
  /** Content to conditionally show */
  children: React.ReactNode;
  /** Hide on mobile devices */
  hideOnMobile?: boolean;
  /** Hide on desktop */
  hideOnDesktop?: boolean;
}

/**
 * Component to conditionally hide content on different screen sizes.
 * Note: Requires CSS support in email client.
 */
export function ResponsiveHide({
  children,
  hideOnMobile = false,
  hideOnDesktop = false,
}: ResponsiveHideProps) {
  const className = hideOnMobile
    ? "hide-on-mobile"
    : hideOnDesktop
    ? "hide-on-desktop"
    : undefined;

  return (
    <Section className={className}>
      {children}
    </Section>
  );
}

// =============================================================================
// EMPTY STATE COMPONENT
// =============================================================================

export interface EmptyStateProps {
  /** Icon or emoji */
  icon?: string;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Action button text */
  actionText?: string;
  /** Action button URL */
  actionUrl?: string;
}

/**
 * Empty state component for when there's no content to display.
 */
export function EmptyState({
  icon = "📭",
  title,
  description,
  actionText,
  actionUrl,
}: EmptyStateProps) {
  return (
    <Section
      style={{
        padding: spacing[10],
        textAlign: "center",
      }}
    >
      <Text
        style={{
          margin: 0,
          fontSize: "48px",
          lineHeight: "1",
        }}
      >
        {icon}
      </Text>
      <Text
        style={{
          margin: `${spacing[4]} 0 0 0`,
          fontFamily: typography.fontFamily.body,
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.primary,
        }}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={{
            margin: `${spacing[2]} 0 0 0`,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.sm,
            color: colors.text.muted,
          }}
        >
          {description}
        </Text>
      )}
      {actionText && actionUrl && (
        <Section style={{ marginTop: spacing[4] }}>
          <a
            href={actionUrl}
            style={{
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.primary,
              textDecoration: "none",
            }}
          >
            {actionText} →
          </a>
        </Section>
      )}
    </Section>
  );
}
