import * as React from "react";
import { Section, Text, Img, Row, Column } from "@react-email/components";
import { colors, typography, spacing, layout } from "../theme";

// =============================================================================
// STAR RATING HELPER COMPONENT
// =============================================================================

interface StarRatingProps {
  rating?: number;
}

function StarRating({ rating }: StarRatingProps) {
  if (!rating) return null;

  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span
        key={i}
        style={{
          color: i <= rating ? "#facc15" : colors.border.default,
          fontSize: "16px",
          marginRight: "2px",
        }}
      >
        ★
      </span>
    );
  }

  return (
    <Section style={{ marginBottom: spacing[3] }}>
      {stars}
    </Section>
  );
}

// =============================================================================
// TESTIMONIAL COMPONENT
// =============================================================================

export interface TestimonialProps {
  /** Testimonial quote text */
  quote: string;
  /** Author name */
  authorName: string;
  /** Author title/role */
  authorTitle?: string;
  /** Author company */
  authorCompany?: string;
  /** Author photo URL */
  authorPhotoUrl?: string;
  /** Star rating (1-5) */
  rating?: number;
  /** Testimonial variant */
  variant?: "default" | "featured" | "compact";
}

/**
 * Testimonial/quote component for social proof.
 * Displays customer quotes with optional author info and rating.
 */
export function Testimonial({
  quote,
  authorName,
  authorTitle,
  authorCompany,
  authorPhotoUrl,
  rating,
  variant = "default",
}: TestimonialProps) {
  if (variant === "compact") {
    return (
      <Section
        style={{
          padding: spacing[4],
          backgroundColor: colors.background.subtle,
          borderRadius: layout.borderRadius.md,
          borderLeft: `3px solid ${colors.primary}`,
        }}
      >
        <StarRating rating={rating} />
        <Text
          style={{
            margin: 0,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.sm,
            fontStyle: "italic",
            color: colors.text.secondary,
            lineHeight: typography.lineHeight.relaxed,
          }}
        >
          "{quote}"
        </Text>
        <Text
          style={{
            margin: `${spacing[2]} 0 0 0`,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.muted,
          }}
        >
          — {authorName}
          {authorTitle && `, ${authorTitle}`}
        </Text>
      </Section>
    );
  }

  if (variant === "featured") {
    return (
      <Section
        style={{
          padding: spacing[8],
          backgroundColor: colors.repwell.sage[100],
          borderRadius: layout.borderRadius.xl,
          textAlign: "center",
        }}
      >
        {/* Quote mark */}
        <Text
          style={{
            margin: 0,
            fontFamily: typography.fontFamily.display,
            fontSize: "64px",
            color: colors.repwell.sage[200],
            lineHeight: "1",
          }}
        >
          "
        </Text>

        <StarRating rating={rating} />

        {/* Quote */}
        <Text
          style={{
            margin: 0,
            fontFamily: typography.fontFamily.display,
            fontSize: typography.fontSize.xl,
            fontStyle: "italic",
            color: colors.repwell.teal[400],
            lineHeight: typography.lineHeight.relaxed,
          }}
        >
          {quote}
        </Text>

        {/* Author */}
        <Section style={{ marginTop: spacing[6] }}>
          {authorPhotoUrl && (
            <Img
              src={authorPhotoUrl}
              alt={authorName}
              width="64"
              height="64"
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                objectFit: "cover",
                margin: "0 auto",
                display: "block",
                border: `3px solid ${colors.background.white}`,
              }}
            />
          )}
          <Text
            style={{
              margin: `${spacing[3]} 0 0 0`,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.repwell.teal[500],
            }}
          >
            {authorName}
          </Text>
          {(authorTitle || authorCompany) && (
            <Text
              style={{
                margin: `${spacing[1]} 0 0 0`,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: colors.repwell.teal[300],
              }}
            >
              {authorTitle}
              {authorTitle && authorCompany && " at "}
              {authorCompany}
            </Text>
          )}
        </Section>
      </Section>
    );
  }

  // Default variant
  return (
    <Section
      style={{
        padding: spacing[6],
        backgroundColor: colors.background.white,
        border: `1px solid ${colors.border.default}`,
        borderRadius: layout.borderRadius.lg,
      }}
    >
      <StarRating rating={rating} />

      {/* Quote */}
      <Text
        style={{
          margin: 0,
          fontFamily: typography.fontFamily.body,
          fontSize: typography.fontSize.base,
          fontStyle: "italic",
          color: colors.text.secondary,
          lineHeight: typography.lineHeight.relaxed,
        }}
      >
        "{quote}"
      </Text>

      {/* Author */}
      <Row style={{ marginTop: spacing[4] }}>
        {authorPhotoUrl && (
          <Column style={{ width: "48px", verticalAlign: "middle", paddingRight: spacing[3] }}>
            <Img
              src={authorPhotoUrl}
              alt={authorName}
              width="40"
              height="40"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          </Column>
        )}
        <Column style={{ verticalAlign: "middle" }}>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.repwell.teal[400],
            }}
          >
            {authorName}
          </Text>
          {(authorTitle || authorCompany) && (
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.xs,
                color: colors.text.muted,
              }}
            >
              {authorTitle}
              {authorTitle && authorCompany && " at "}
              {authorCompany}
            </Text>
          )}
        </Column>
      </Row>
    </Section>
  );
}

// =============================================================================
// REVIEW CARD COMPONENT
// =============================================================================

export interface ReviewCardProps {
  /** Review text */
  review: string;
  /** Reviewer name */
  reviewerName: string;
  /** Review source (Google, Zillow, etc.) */
  source?: string;
  /** Source icon URL */
  sourceIconUrl?: string;
  /** Star rating (1-5) */
  rating: number;
  /** Review date */
  date?: string;
  /** Truncate review text */
  truncate?: boolean;
  /** Max characters before truncation */
  maxLength?: number;
}

/**
 * Review card displaying customer reviews with source attribution.
 * Designed for displaying aggregated reviews in emails.
 */
export function ReviewCard({
  review,
  reviewerName,
  source,
  sourceIconUrl,
  rating,
  date,
  truncate = false,
  maxLength = 200,
}: ReviewCardProps) {
  const displayReview = truncate && review.length > maxLength
    ? review.slice(0, maxLength).trim() + "..."
    : review;

  // Star display
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span
        key={i}
        style={{
          color: i <= rating ? "#facc15" : colors.border.default,
          fontSize: "14px",
          marginRight: "1px",
        }}
      >
        ★
      </span>
    );
  }

  return (
    <Section
      style={{
        padding: spacing[4],
        backgroundColor: colors.background.white,
        border: `1px solid ${colors.border.default}`,
        borderRadius: layout.borderRadius.md,
      }}
    >
      {/* Header with rating and source */}
      <Row style={{ marginBottom: spacing[3] }}>
        <Column style={{ verticalAlign: "middle" }}>
          {stars}
        </Column>
        {source && (
          <Column style={{ textAlign: "right", verticalAlign: "middle" }}>
            <Row>
              {sourceIconUrl && (
                <Column style={{ paddingRight: spacing[1] }}>
                  <Img
                    src={sourceIconUrl}
                    alt={source}
                    width="16"
                    height="16"
                    style={{ verticalAlign: "middle" }}
                  />
                </Column>
              )}
              <Column>
                <Text
                  style={{
                    margin: 0,
                    fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize.xs,
                    color: colors.text.muted,
                    verticalAlign: "middle",
                  }}
                >
                  {source}
                </Text>
              </Column>
            </Row>
          </Column>
        )}
      </Row>

      {/* Review text */}
      <Text
        style={{
          margin: 0,
          fontFamily: typography.fontFamily.body,
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
          lineHeight: typography.lineHeight.normal,
        }}
      >
        {displayReview}
      </Text>

      {/* Footer with name and date */}
      <Row style={{ marginTop: spacing[3] }}>
        <Column>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary,
            }}
          >
            {reviewerName}
          </Text>
        </Column>
        {date && (
          <Column style={{ textAlign: "right" }}>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.xs,
                color: colors.text.muted,
              }}
            >
              {date}
            </Text>
          </Column>
        )}
      </Row>
    </Section>
  );
}

// =============================================================================
// SOCIAL PROOF BAR COMPONENT
// =============================================================================

export interface SocialProofBarProps {
  /** Array of social proof items */
  items: Array<{
    label: string;
    value: string;
    iconUrl?: string;
  }>;
  /** Background color */
  backgroundColor?: string;
  /** Separator between items */
  showSeparator?: boolean;
}

/**
 * Horizontal bar displaying multiple social proof metrics.
 * Useful for showing ratings, review counts, badges, etc.
 */
export function SocialProofBar({
  items,
  backgroundColor = colors.repwell.sage[100],
  showSeparator = true,
}: SocialProofBarProps) {
  return (
    <Section
      style={{
        padding: `${spacing[4]} ${spacing[6]}`,
        backgroundColor,
        borderRadius: layout.borderRadius.lg,
      }}
    >
      <Row>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <Column
              style={{
                textAlign: "center",
                paddingLeft: index > 0 ? spacing[4] : 0,
                paddingRight: index < items.length - 1 ? spacing[4] : 0,
              }}
            >
              {item.iconUrl && (
                <Img
                  src={item.iconUrl}
                  alt=""
                  width="24"
                  height="24"
                  style={{
                    display: "inline-block",
                    verticalAlign: "middle",
                    marginRight: spacing[2],
                  }}
                />
              )}
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.repwell.teal[400],
                  display: "inline",
                }}
              >
                {item.value}
              </Text>
              <Text
                style={{
                  margin: `${spacing[1]} 0 0 0`,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.xs,
                  color: colors.repwell.teal[300],
                }}
              >
                {item.label}
              </Text>
            </Column>
            {showSeparator && index < items.length - 1 && (
              <Column
                style={{
                  width: "1px",
                  backgroundColor: colors.repwell.sage[200],
                }}
              />
            )}
          </React.Fragment>
        ))}
      </Row>
    </Section>
  );
}

// =============================================================================
// LOGO CLOUD COMPONENT
// =============================================================================

export interface LogoCloudProps {
  /** Array of logo items */
  logos: Array<{
    url: string;
    alt: string;
    width?: number;
  }>;
  /** Title above logos */
  title?: string;
  /** Background color */
  backgroundColor?: string;
}

/**
 * Logo cloud for displaying partner/client logos.
 * Useful for "As seen on" or "Trusted by" sections.
 */
export function LogoCloud({
  logos,
  title,
  backgroundColor = colors.background.subtle,
}: LogoCloudProps) {
  return (
    <Section
      style={{
        padding: spacing[6],
        backgroundColor,
        borderRadius: layout.borderRadius.lg,
        textAlign: "center",
      }}
    >
      {title && (
        <Text
          style={{
            margin: `0 0 ${spacing[4]} 0`,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.muted,
            textTransform: "uppercase",
            letterSpacing: typography.letterSpacing.wider,
          }}
        >
          {title}
        </Text>
      )}
      <Row>
        {logos.map((logo, index) => (
          <Column
            key={index}
            style={{
              padding: `0 ${spacing[3]}`,
            }}
          >
            <Img
              src={logo.url}
              alt={logo.alt}
              width={logo.width || 100}
              style={{
                maxWidth: `${logo.width || 100}px`,
                height: "auto",
                filter: "grayscale(100%)",
                opacity: 0.6,
              }}
            />
          </Column>
        ))}
      </Row>
    </Section>
  );
}

// =============================================================================
// NPS SCORE DISPLAY COMPONENT
// =============================================================================

export interface NPSScoreDisplayProps {
  /** NPS score (-100 to 100) */
  score: number;
  /** Total responses */
  totalResponses?: number;
  /** Show breakdown */
  showBreakdown?: boolean;
  /** Promoter percentage */
  promoters?: number;
  /** Passive percentage */
  passives?: number;
  /** Detractor percentage */
  detractors?: number;
}

/**
 * NPS score display component.
 * Shows the NPS score with optional breakdown.
 */
export function NPSScoreDisplay({
  score,
  totalResponses,
  showBreakdown = false,
  promoters,
  passives,
  detractors,
}: NPSScoreDisplayProps) {
  // Determine score color
  const getScoreColor = (nps: number) => {
    if (nps >= 50) return colors.accent.success;
    if (nps >= 0) return colors.accent.warning;
    return colors.accent.error;
  };

  return (
    <Section
      style={{
        padding: spacing[6],
        backgroundColor: colors.background.white,
        border: `1px solid ${colors.border.default}`,
        borderRadius: layout.borderRadius.lg,
        textAlign: "center",
      }}
    >
      {/* Score */}
      <Text
        style={{
          margin: 0,
          fontFamily: typography.fontFamily.display,
          fontSize: typography.fontSize["5xl"],
          fontWeight: typography.fontWeight.bold,
          color: getScoreColor(score),
          lineHeight: "1",
        }}
      >
        {score > 0 ? "+" : ""}{score}
      </Text>
      <Text
        style={{
          margin: `${spacing[2]} 0 0 0`,
          fontFamily: typography.fontFamily.body,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          color: colors.text.muted,
          textTransform: "uppercase",
          letterSpacing: typography.letterSpacing.wide,
        }}
      >
        NPS Score
      </Text>

      {totalResponses && (
        <Text
          style={{
            margin: `${spacing[1]} 0 0 0`,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.xs,
            color: colors.text.subtle,
          }}
        >
          Based on {totalResponses.toLocaleString()} responses
        </Text>
      )}

      {/* Breakdown */}
      {showBreakdown && (promoters !== undefined || passives !== undefined || detractors !== undefined) && (
        <Row style={{ marginTop: spacing[4] }}>
          {promoters !== undefined && (
            <Column style={{ textAlign: "center" }}>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.accent.success,
                }}
              >
                {promoters}%
              </Text>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.xs,
                  color: colors.text.muted,
                }}
              >
                Promoters
              </Text>
            </Column>
          )}
          {passives !== undefined && (
            <Column style={{ textAlign: "center" }}>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.accent.warning,
                }}
              >
                {passives}%
              </Text>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.xs,
                  color: colors.text.muted,
                }}
              >
                Passives
              </Text>
            </Column>
          )}
          {detractors !== undefined && (
            <Column style={{ textAlign: "center" }}>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.accent.error,
                }}
              >
                {detractors}%
              </Text>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.xs,
                  color: colors.text.muted,
                }}
              >
                Detractors
              </Text>
            </Column>
          )}
        </Row>
      )}
    </Section>
  );
}
