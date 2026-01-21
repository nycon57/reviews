import * as React from "react";
import { Section, Text, Button, Img, Row, Column } from "@react-email/components";
import { colors, typography, spacing, layout, gradients } from "../theme";

// =============================================================================
// CTA SECTION COMPONENT
// =============================================================================

export interface CTASectionProps {
  /** CTA headline */
  headline: string;
  /** CTA description/subtext */
  description?: string;
  /** Primary button text */
  buttonText: string;
  /** Primary button URL */
  buttonUrl: string;
  /** Secondary button text */
  secondaryButtonText?: string;
  /** Secondary button URL */
  secondaryButtonUrl?: string;
  /** Background variant */
  variant?: "default" | "brand" | "dark" | "gradient";
  /** Align content */
  align?: "left" | "center";
  /** Eyebrow text above headline */
  eyebrow?: string;
}

/**
 * Call-to-action section with headline, description, and buttons.
 * Supports multiple visual variants for different contexts.
 */
export function CTASection({
  headline,
  description,
  buttonText,
  buttonUrl,
  secondaryButtonText,
  secondaryButtonUrl,
  variant = "default",
  align = "center",
  eyebrow,
}: CTASectionProps) {
  // Variant configuration
  const variantConfig = {
    default: {
      backgroundColor: colors.background.white,
      headlineColor: colors.repwell.teal[400],
      descriptionColor: colors.text.muted,
      eyebrowColor: colors.primary,
      buttonBg: colors.primary,
      buttonColor: colors.text.inverse,
      secondaryButtonBg: "transparent",
      secondaryButtonColor: colors.primary,
      secondaryButtonBorder: colors.primary,
    },
    brand: {
      backgroundColor: colors.repwell.sage[100],
      headlineColor: colors.repwell.teal[400],
      descriptionColor: colors.repwell.teal[300],
      eyebrowColor: colors.repwell.teal[300],
      buttonBg: colors.repwell.teal[400],
      buttonColor: colors.text.inverse,
      secondaryButtonBg: "transparent",
      secondaryButtonColor: colors.repwell.teal[400],
      secondaryButtonBorder: colors.repwell.teal[400],
    },
    dark: {
      backgroundColor: colors.repwell.teal[500],
      headlineColor: colors.text.inverse,
      descriptionColor: colors.text.inverseMuted,
      eyebrowColor: colors.repwell.sage[200],
      buttonBg: colors.background.white,
      buttonColor: colors.repwell.teal[500],
      secondaryButtonBg: "transparent",
      secondaryButtonColor: colors.text.inverse,
      secondaryButtonBorder: colors.text.inverseMuted,
    },
    gradient: {
      backgroundColor: colors.repwell.sage[100],
      headlineColor: colors.repwell.teal[400],
      descriptionColor: colors.repwell.teal[300],
      eyebrowColor: colors.repwell.teal[300],
      buttonBg: colors.primary,
      buttonColor: colors.text.inverse,
      secondaryButtonBg: "transparent",
      secondaryButtonColor: colors.primary,
      secondaryButtonBorder: colors.primary,
    },
  };

  const config = variantConfig[variant];

  return (
    <Section
      style={{
        padding: spacing[10],
        backgroundColor: config.backgroundColor,
        background: variant === "gradient" ? gradients.subtleBackground : undefined,
        textAlign: align,
        borderRadius: layout.borderRadius.lg,
      }}
    >
      {/* Eyebrow */}
      {eyebrow && (
        <Text
          style={{
            margin: `0 0 ${spacing[2]} 0`,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold,
            color: config.eyebrowColor,
            textTransform: "uppercase",
            letterSpacing: typography.letterSpacing.wider,
          }}
        >
          {eyebrow}
        </Text>
      )}

      {/* Headline */}
      <Text
        style={{
          margin: 0,
          fontFamily: typography.fontFamily.display,
          fontSize: typography.fontSize["2xl"],
          fontWeight: typography.fontWeight.bold,
          color: config.headlineColor,
          lineHeight: typography.lineHeight.tight,
        }}
      >
        {headline}
      </Text>

      {/* Description */}
      {description && (
        <Text
          style={{
            margin: `${spacing[3]} 0 0 0`,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.base,
            color: config.descriptionColor,
            lineHeight: typography.lineHeight.relaxed,
          }}
        >
          {description}
        </Text>
      )}

      {/* Buttons */}
      <Section style={{ marginTop: spacing[6] }}>
        <Button
          href={buttonUrl}
          style={{
            display: "inline-block",
            padding: `${spacing[3]} ${spacing[6]}`,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            textDecoration: "none",
            backgroundColor: config.buttonBg,
            color: config.buttonColor,
            borderRadius: layout.borderRadius.lg,
            border: "none",
          }}
        >
          {buttonText}
        </Button>

        {secondaryButtonText && secondaryButtonUrl && (
          <Button
            href={secondaryButtonUrl}
            style={{
              display: "inline-block",
              marginLeft: spacing[3],
              padding: `${spacing[3]} ${spacing[6]}`,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              textDecoration: "none",
              backgroundColor: config.secondaryButtonBg,
              color: config.secondaryButtonColor,
              borderRadius: layout.borderRadius.lg,
              border: `2px solid ${config.secondaryButtonBorder}`,
            }}
          >
            {secondaryButtonText}
          </Button>
        )}
      </Section>
    </Section>
  );
}

// =============================================================================
// HERO CTA COMPONENT
// =============================================================================

export interface HeroCTAProps {
  /** Hero headline */
  headline: string;
  /** Hero subheadline */
  subheadline?: string;
  /** CTA button text */
  buttonText: string;
  /** CTA button URL */
  buttonUrl: string;
  /** Hero image URL */
  imageUrl?: string;
  /** Image alt text */
  imageAlt?: string;
  /** Image position */
  imagePosition?: "top" | "bottom" | "right";
}

/**
 * Hero CTA section with large headline and optional image.
 * Used for primary email calls-to-action.
 */
export function HeroCTA({
  headline,
  subheadline,
  buttonText,
  buttonUrl,
  imageUrl,
  imageAlt = "",
  imagePosition = "bottom",
}: HeroCTAProps) {
  const content = (
    <Section style={{ textAlign: "center" }}>
      <Text
        style={{
          margin: 0,
          fontFamily: typography.fontFamily.display,
          fontSize: typography.fontSize["3xl"],
          fontWeight: typography.fontWeight.bold,
          color: colors.repwell.teal[400],
          lineHeight: typography.lineHeight.tight,
        }}
      >
        {headline}
      </Text>

      {subheadline && (
        <Text
          style={{
            margin: `${spacing[4]} 0 0 0`,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.lg,
            color: colors.text.muted,
            lineHeight: typography.lineHeight.relaxed,
          }}
        >
          {subheadline}
        </Text>
      )}

      <Section style={{ marginTop: spacing[6] }}>
        <Button
          href={buttonUrl}
          style={{
            display: "inline-block",
            padding: `${spacing[4]} ${spacing[8]}`,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            textDecoration: "none",
            backgroundColor: colors.primary,
            color: colors.text.inverse,
            borderRadius: layout.borderRadius.lg,
            border: "none",
          }}
        >
          {buttonText}
        </Button>
      </Section>
    </Section>
  );

  const image = imageUrl && (
    <Img
      src={imageUrl}
      alt={imageAlt}
      width="100%"
      style={{
        maxWidth: "400px",
        width: "100%",
        height: "auto",
        display: "block",
        margin: "0 auto",
      }}
    />
  );

  if (imagePosition === "right" && imageUrl) {
    return (
      <Section style={{ padding: spacing[8] }}>
        <Row>
          <Column style={{ width: "55%", verticalAlign: "middle", paddingRight: spacing[6] }}>
            <Section style={{ textAlign: "left" }}>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.display,
                  fontSize: typography.fontSize["2xl"],
                  fontWeight: typography.fontWeight.bold,
                  color: colors.repwell.teal[400],
                  lineHeight: typography.lineHeight.tight,
                }}
              >
                {headline}
              </Text>

              {subheadline && (
                <Text
                  style={{
                    margin: `${spacing[3]} 0 0 0`,
                    fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize.base,
                    color: colors.text.muted,
                    lineHeight: typography.lineHeight.relaxed,
                  }}
                >
                  {subheadline}
                </Text>
              )}

              <Section style={{ marginTop: spacing[5] }}>
                <Button
                  href={buttonUrl}
                  style={{
                    display: "inline-block",
                    padding: `${spacing[3]} ${spacing[6]}`,
                    fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.semibold,
                    textDecoration: "none",
                    backgroundColor: colors.primary,
                    color: colors.text.inverse,
                    borderRadius: layout.borderRadius.lg,
                    border: "none",
                  }}
                >
                  {buttonText}
                </Button>
              </Section>
            </Section>
          </Column>
          <Column style={{ width: "45%", verticalAlign: "middle" }}>
            <Img
              src={imageUrl}
              alt={imageAlt}
              width="100%"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                borderRadius: layout.borderRadius.lg,
              }}
            />
          </Column>
        </Row>
      </Section>
    );
  }

  return (
    <Section style={{ padding: spacing[8] }}>
      {imagePosition === "top" && image && (
        <Section style={{ marginBottom: spacing[6] }}>{image}</Section>
      )}

      {content}

      {imagePosition === "bottom" && image && (
        <Section style={{ marginTop: spacing[6] }}>{image}</Section>
      )}
    </Section>
  );
}

// =============================================================================
// INLINE CTA COMPONENT
// =============================================================================

export interface InlineCTAProps {
  /** CTA text */
  text: string;
  /** Link text */
  linkText: string;
  /** Link URL */
  linkUrl: string;
  /** Show arrow */
  showArrow?: boolean;
}

/**
 * Inline CTA with text and link.
 * Useful for subtle CTAs within content.
 */
export function InlineCTA({
  text,
  linkText,
  linkUrl,
  showArrow = true,
}: InlineCTAProps) {
  return (
    <Section
      style={{
        padding: spacing[4],
        backgroundColor: colors.background.subtle,
        borderRadius: layout.borderRadius.md,
        borderLeft: `3px solid ${colors.primary}`,
      }}
    >
      <Text
        style={{
          margin: 0,
          fontFamily: typography.fontFamily.body,
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
        }}
      >
        {text}{" "}
        <a
          href={linkUrl}
          style={{
            color: colors.primary,
            fontWeight: typography.fontWeight.medium,
            textDecoration: "none",
          }}
        >
          {linkText}
          {showArrow && " →"}
        </a>
      </Text>
    </Section>
  );
}

// =============================================================================
// BANNER CTA COMPONENT
// =============================================================================

export interface BannerCTAProps {
  /** Banner text */
  text: string;
  /** Button text */
  buttonText: string;
  /** Button URL */
  buttonUrl: string;
  /** Background color */
  backgroundColor?: string;
  /** Text color */
  textColor?: string;
  /** Dismissible */
  dismissible?: boolean;
}

/**
 * Full-width banner CTA.
 * Useful for announcements and promotions.
 */
export function BannerCTA({
  text,
  buttonText,
  buttonUrl,
  backgroundColor = colors.repwell.teal[400],
  textColor = colors.text.inverse,
}: BannerCTAProps) {
  return (
    <Section
      style={{
        padding: `${spacing[4]} ${spacing[6]}`,
        backgroundColor,
      }}
    >
      <Row>
        <Column style={{ verticalAlign: "middle" }}>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: textColor,
            }}
          >
            {text}
          </Text>
        </Column>
        <Column style={{ width: "auto", textAlign: "right", verticalAlign: "middle" }}>
          <Button
            href={buttonUrl}
            style={{
              display: "inline-block",
              padding: `${spacing[2]} ${spacing[4]}`,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              textDecoration: "none",
              backgroundColor: colors.background.white,
              color: backgroundColor,
              borderRadius: layout.borderRadius.md,
              border: "none",
            }}
          >
            {buttonText}
          </Button>
        </Column>
      </Row>
    </Section>
  );
}

// =============================================================================
// SURVEY CTA COMPONENT
// =============================================================================

export interface SurveyCTAProps {
  /** Survey intro text */
  introText?: string;
  /** Survey question */
  question: string;
  /** Survey URL */
  surveyUrl: string;
  /** Button text */
  buttonText?: string;
  /** Show rating scale preview */
  showRatingScale?: boolean;
  /** Rating scale labels */
  ratingLabels?: { low: string; high: string };
}

/**
 * Survey invitation CTA with optional NPS scale preview.
 * Designed specifically for survey invitation emails.
 */
export function SurveyCTA({
  introText = "We'd love your feedback",
  question,
  surveyUrl,
  buttonText = "Take Survey",
  showRatingScale = true,
  ratingLabels = { low: "Not likely", high: "Very likely" },
}: SurveyCTAProps) {
  return (
    <Section
      style={{
        padding: spacing[8],
        backgroundColor: colors.repwell.sage[100],
        borderRadius: layout.borderRadius.lg,
        textAlign: "center",
      }}
    >
      {/* Intro text */}
      <Text
        style={{
          margin: 0,
          fontFamily: typography.fontFamily.body,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          color: colors.repwell.teal[300],
          textTransform: "uppercase",
          letterSpacing: typography.letterSpacing.wider,
        }}
      >
        {introText}
      </Text>

      {/* Question */}
      <Text
        style={{
          margin: `${spacing[3]} 0 0 0`,
          fontFamily: typography.fontFamily.display,
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.bold,
          color: colors.repwell.teal[400],
          lineHeight: typography.lineHeight.normal,
        }}
      >
        {question}
      </Text>

      {/* Rating scale preview */}
      {showRatingScale && (
        <Section style={{ marginTop: spacing[6] }}>
          <Row>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <Column key={num} style={{ padding: "0 2px" }}>
                <Section
                  style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor:
                      num <= 6
                        ? colors.accent.error
                        : num <= 8
                        ? colors.accent.warning
                        : colors.accent.success,
                    borderRadius: layout.borderRadius.sm,
                    opacity: 0.7,
                    textAlign: "center",
                    lineHeight: "32px",
                  }}
                >
                  <Text
                    style={{
                      margin: 0,
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.text.inverse,
                      lineHeight: "32px",
                    }}
                  >
                    {num}
                  </Text>
                </Section>
              </Column>
            ))}
          </Row>
          <Row style={{ marginTop: spacing[1] }}>
            <Column style={{ textAlign: "left" }}>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.xs,
                  color: colors.text.muted,
                }}
              >
                {ratingLabels.low}
              </Text>
            </Column>
            <Column style={{ textAlign: "right" }}>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.xs,
                  color: colors.text.muted,
                }}
              >
                {ratingLabels.high}
              </Text>
            </Column>
          </Row>
        </Section>
      )}

      {/* Button */}
      <Section style={{ marginTop: spacing[6] }}>
        <Button
          href={surveyUrl}
          style={{
            display: "inline-block",
            padding: `${spacing[4]} ${spacing[8]}`,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            textDecoration: "none",
            backgroundColor: colors.repwell.teal[400],
            color: colors.text.inverse,
            borderRadius: layout.borderRadius.lg,
            border: "none",
          }}
        >
          {buttonText}
        </Button>
      </Section>
    </Section>
  );
}
