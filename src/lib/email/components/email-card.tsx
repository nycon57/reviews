import * as React from "react";
import { Section, Text, Img, Row, Column } from "@react-email/components";
import { colors, typography, spacing, layout, gradients } from "../theme";

// =============================================================================
// EMAIL CARD COMPONENT
// =============================================================================

export interface EmailCardProps {
  /** Card content */
  children: React.ReactNode;
  /** Show colored top accent bar */
  showAccentBar?: boolean;
  /** Accent bar color (solid color or 'gradient' for brand gradient) */
  accentColor?: "gradient" | "primary" | "success" | "warning" | "error" | "info" | string;
  /** Background color */
  backgroundColor?: string;
  /** Border color */
  borderColor?: string;
  /** Padding inside the card */
  padding?: string;
  /** Border radius */
  borderRadius?: string;
  /** Add shadow effect */
  shadow?: boolean;
}

/**
 * Email card component with optional colored accent bar.
 * Follows Repwell design system with gradient accent pattern.
 */
export function EmailCard({
  children,
  showAccentBar = true,
  accentColor = "gradient",
  backgroundColor = colors.background.white,
  borderColor = colors.border.default,
  padding = spacing[6],
  borderRadius = layout.borderRadius.lg,
  shadow = true,
}: EmailCardProps) {
  // Determine accent bar style
  const getAccentBarStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      height: "4px",
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
    };

    if (accentColor === "gradient") {
      return {
        ...baseStyle,
        background: gradients.brandAccent,
      };
    }

    const accentColors: Record<string, string> = {
      primary: colors.primary,
      success: colors.accent.success,
      warning: colors.accent.warning,
      error: colors.accent.error,
      info: colors.accent.info,
    };

    return {
      ...baseStyle,
      backgroundColor: accentColors[accentColor] || accentColor,
    };
  };

  return (
    <Section
      style={{
        backgroundColor,
        border: `1px solid ${borderColor}`,
        borderRadius,
        overflow: "hidden",
        boxShadow: shadow
          ? "0 2px 8px -2px rgba(47, 62, 70, 0.1), 0 4px 16px -4px rgba(47, 62, 70, 0.1)"
          : undefined,
      }}
    >
      {/* Accent bar */}
      {showAccentBar && <Section style={getAccentBarStyle()} />}

      {/* Card content */}
      <Section style={{ padding }}>{children}</Section>
    </Section>
  );
}

// =============================================================================
// FEATURE CARD COMPONENT
// =============================================================================

export interface FeatureCardProps {
  /** Icon URL or inline SVG data URI */
  iconUrl?: string;
  /** Icon alt text */
  iconAlt?: string;
  /** Feature title */
  title: string;
  /** Feature description */
  description: string;
  /** Accent color for icon background */
  accentColor?: string;
}

/**
 * Feature card with icon, title, and description.
 * Useful for feature lists in marketing emails.
 */
export function FeatureCard({
  iconUrl,
  iconAlt = "",
  title,
  description,
  accentColor = colors.repwell.sage[100],
}: FeatureCardProps) {
  return (
    <EmailCard showAccentBar={false} shadow={false} padding={spacing[4]}>
      <Row>
        {/* Icon */}
        {iconUrl && (
          <Column style={{ width: "48px", verticalAlign: "top", paddingRight: spacing[3] }}>
            <Section
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: accentColor,
                borderRadius: layout.borderRadius.md,
                textAlign: "center",
              }}
            >
              <Img
                src={iconUrl}
                alt={iconAlt}
                width="24"
                height="24"
                style={{
                  display: "inline-block",
                  marginTop: "8px",
                }}
              />
            </Section>
          </Column>
        )}

        {/* Content */}
        <Column style={{ verticalAlign: "top" }}>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.repwell.teal[400],
              lineHeight: typography.lineHeight.tight,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              margin: `${spacing[1]} 0 0 0`,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              color: colors.text.muted,
              lineHeight: typography.lineHeight.normal,
            }}
          >
            {description}
          </Text>
        </Column>
      </Row>
    </EmailCard>
  );
}

// =============================================================================
// INFO CARD COMPONENT
// =============================================================================

export interface InfoCardProps {
  /** Card type for styling */
  type: "info" | "success" | "warning" | "error" | "tip";
  /** Card title */
  title?: string;
  /** Card content */
  children: React.ReactNode;
}

/**
 * Informational card with colored styling based on type.
 * Useful for alerts, tips, and notices.
 */
export function InfoCard({ type, title, children }: InfoCardProps) {
  const typeConfig = {
    info: {
      backgroundColor: "#eff6ff",
      borderColor: "#bfdbfe",
      accentColor: "#3b82f6",
      titleColor: "#1d4ed8",
      textColor: "#1e40af",
    },
    success: {
      backgroundColor: "#dcfce7",
      borderColor: "#86efac",
      accentColor: colors.accent.success,
      titleColor: "#166534",
      textColor: "#15803d",
    },
    warning: {
      backgroundColor: "#fef3c7",
      borderColor: "#fcd34d",
      accentColor: colors.accent.warning,
      titleColor: "#92400e",
      textColor: "#a16207",
    },
    error: {
      backgroundColor: "#fef2f2",
      borderColor: "#fecaca",
      accentColor: colors.accent.error,
      titleColor: "#991b1b",
      textColor: "#b91c1c",
    },
    tip: {
      backgroundColor: colors.repwell.sage[100],
      borderColor: colors.repwell.sage[200],
      accentColor: colors.repwell.teal[300],
      titleColor: colors.repwell.teal[400],
      textColor: colors.repwell.teal[300],
    },
  };

  const config = typeConfig[type];

  return (
    <Section
      style={{
        backgroundColor: config.backgroundColor,
        border: `1px solid ${config.borderColor}`,
        borderRadius: layout.borderRadius.lg,
        overflow: "hidden",
      }}
    >
      {/* Accent bar */}
      <Section
        style={{
          height: "3px",
          backgroundColor: config.accentColor,
        }}
      />

      {/* Content */}
      <Section style={{ padding: spacing[4] }}>
        {title && (
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: config.titleColor,
              textTransform: "uppercase",
              letterSpacing: typography.letterSpacing.wide,
            }}
          >
            {title}
          </Text>
        )}
        <Section
          style={{
            marginTop: title ? spacing[2] : 0,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.sm,
            color: config.textColor,
            lineHeight: typography.lineHeight.normal,
          }}
        >
          {children}
        </Section>
      </Section>
    </Section>
  );
}

// =============================================================================
// SUMMARY CARD COMPONENT
// =============================================================================

export interface SummaryCardProps {
  /** Card title */
  title: string;
  /** Summary items as key-value pairs */
  items: Array<{ label: string; value: string | React.ReactNode }>;
  /** Show accent bar */
  showAccentBar?: boolean;
}

/**
 * Summary card displaying key-value pairs.
 * Useful for order summaries, account details, etc.
 */
export function SummaryCard({ title, items, showAccentBar = true }: SummaryCardProps) {
  return (
    <EmailCard showAccentBar={showAccentBar}>
      {/* Title */}
      <Text
        style={{
          margin: 0,
          marginBottom: spacing[4],
          fontFamily: typography.fontFamily.display,
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.bold,
          color: colors.repwell.teal[400],
        }}
      >
        {title}
      </Text>

      {/* Items */}
      {items.map((item, index) => (
        <Row
          key={index}
          style={{
            paddingTop: spacing[2],
            paddingBottom: spacing[2],
            borderBottom:
              index < items.length - 1 ? `1px solid ${colors.border.subtle}` : undefined,
          }}
        >
          <Column style={{ width: "40%" }}>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: colors.text.muted,
              }}
            >
              {item.label}
            </Text>
          </Column>
          <Column style={{ width: "60%", textAlign: "right" }}>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.primary,
              }}
            >
              {item.value}
            </Text>
          </Column>
        </Row>
      ))}
    </EmailCard>
  );
}

// =============================================================================
// IMAGE CARD COMPONENT
// =============================================================================

export interface ImageCardProps {
  /** Image URL */
  imageUrl: string;
  /** Image alt text */
  imageAlt: string;
  /** Card title */
  title?: string;
  /** Card description */
  description?: string;
  /** Image position */
  imagePosition?: "top" | "left";
  /** Image width (for left position) */
  imageWidth?: string;
}

/**
 * Card with featured image.
 * Image can be positioned at top or left.
 */
export function ImageCard({
  imageUrl,
  imageAlt,
  title,
  description,
  imagePosition = "top",
  imageWidth = "120px",
}: ImageCardProps) {
  if (imagePosition === "left") {
    return (
      <EmailCard showAccentBar={false}>
        <Row>
          <Column style={{ width: imageWidth, verticalAlign: "top", paddingRight: spacing[4] }}>
            <Img
              src={imageUrl}
              alt={imageAlt}
              width={parseInt(imageWidth)}
              style={{
                width: imageWidth,
                height: "auto",
                borderRadius: layout.borderRadius.md,
              }}
            />
          </Column>
          <Column style={{ verticalAlign: "top" }}>
            {title && (
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.repwell.teal[400],
                }}
              >
                {title}
              </Text>
            )}
            {description && (
              <Text
                style={{
                  margin: `${spacing[2]} 0 0 0`,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.muted,
                  lineHeight: typography.lineHeight.normal,
                }}
              >
                {description}
              </Text>
            )}
          </Column>
        </Row>
      </EmailCard>
    );
  }

  return (
    <EmailCard showAccentBar={false} padding="0">
      {/* Image at top */}
      <Img
        src={imageUrl}
        alt={imageAlt}
        width="100%"
        style={{
          width: "100%",
          height: "auto",
          display: "block",
        }}
      />

      {/* Content */}
      {(title || description) && (
        <Section style={{ padding: spacing[4] }}>
          {title && (
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                color: colors.repwell.teal[400],
              }}
            >
              {title}
            </Text>
          )}
          {description && (
            <Text
              style={{
                margin: `${spacing[2]} 0 0 0`,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: colors.text.muted,
                lineHeight: typography.lineHeight.normal,
              }}
            >
              {description}
            </Text>
          )}
        </Section>
      )}
    </EmailCard>
  );
}
