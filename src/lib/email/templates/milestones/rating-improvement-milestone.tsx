/**
 * Rating Improvement Milestone Email Template
 *
 * Celebratory email sent when a user's average rating improves significantly.
 * Shows before/after comparison and encourages continued excellence.
 */

import * as React from "react";
import { Section, Text } from "@react-email/components";
import {
  EmailLayout,
  SingleColumnLayout,
  RepwellHeader,
  RepwellFooter,
  EmailParagraph,
  PrimaryButton,
  EmailCard,
  Spacer,
  StatsRow,
  colors,
  typography,
  spacing,
} from "../../components";
import { CelebrationHeader } from "./celebration-header";
import { SocialShareCta } from "./social-share-cta";
import type { RatingImprovementMilestoneEmailData } from "../../types";

interface RatingImprovementMilestoneEmailProps {
  data: RatingImprovementMilestoneEmailData;
}

function renderStars(rating: number): string {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  return "★".repeat(fullStars) + (hasHalf ? "½" : "") + "☆".repeat(5 - fullStars - (hasHalf ? 1 : 0));
}

export function RatingImprovementMilestoneEmail({ data }: RatingImprovementMilestoneEmailProps) {
  const {
    firstName,
    previousRating,
    currentRating,
    improvementAmount,
    totalReviews,
    periodDescription,
    viewAnalyticsUrl,
    socialShareLinks,
    toEmail,
  } = data;

  return (
    <EmailLayout
      preview={`${firstName}, your rating improved to ${currentRating.toFixed(1)} stars!`}
    >
      <RepwellHeader />

      <CelebrationHeader
        emoji="📈"
        title="Rating on the Rise!"
        subtitle={`+${improvementAmount.toFixed(1)} Star Improvement`}
      />

      <SingleColumnLayout>
        <EmailParagraph>
          Congratulations, {firstName}! Your dedication to customer experience is
          showing results. Your average rating has improved over the {periodDescription}.
        </EmailParagraph>

        {/* Before/After Comparison */}
        <EmailCard showAccentBar accentColor={colors.accent.success}>
          <Section style={{ textAlign: "center" }}>
            {/* Previous Rating */}
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: colors.text.muted,
                marginBottom: spacing[1],
              }}
            >
              Previous Rating
            </Text>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: "24px",
                color: colors.text.secondary,
                letterSpacing: "2px",
                opacity: 0.7,
              }}
            >
              {renderStars(previousRating)}
            </Text>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.lg,
                color: colors.text.secondary,
                marginBottom: spacing[4],
              }}
            >
              {previousRating.toFixed(1)}
            </Text>

            {/* Arrow */}
            <Text
              style={{
                margin: 0,
                fontSize: "32px",
                marginBottom: spacing[4],
              }}
            >
              ⬇️
            </Text>

            {/* Current Rating */}
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: colors.text.muted,
                marginBottom: spacing[1],
              }}
            >
              Current Rating
            </Text>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: "32px",
                color: "#FFD700",
                letterSpacing: "2px",
              }}
            >
              {renderStars(currentRating)}
            </Text>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.display,
                fontSize: typography.fontSize["3xl"],
                fontWeight: typography.fontWeight.bold,
                color: colors.primary,
              }}
            >
              {currentRating.toFixed(1)}
            </Text>
          </Section>

          <Spacer size="md" />

          {/* Improvement Badge */}
          <Section
            style={{
              padding: spacing[3],
              backgroundColor: colors.accent.success + "15",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.accent.success,
              }}
            >
              +{improvementAmount.toFixed(1)} ★ Improvement
            </Text>
          </Section>
        </EmailCard>

        <Spacer size="md" />

        {/* Stats */}
        <StatsRow
          stats={[
            {
              label: "Total Reviews",
              value: totalReviews.toString(),
            },
            {
              label: "Period",
              value: periodDescription,
            },
          ]}
        />

        <Spacer size="md" />

        {/* Tips Section */}
        <EmailCard>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: spacing[2],
            }}
          >
            Keep the momentum going:
          </Text>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            • Respond promptly to all customer feedback
            <br />
            • Address concerns before they become reviews
            <br />
            • Follow up with satisfied customers for reviews
          </Text>
        </EmailCard>

        <Spacer size="md" />

        {/* CTA */}
        <Section style={{ textAlign: "center" }}>
          <PrimaryButton href={viewAnalyticsUrl}>View Your Analytics</PrimaryButton>
        </Section>

        {/* Social Share */}
        <SocialShareCta
          message="Share your rating improvement with your network!"
          socialShareLinks={socialShareLinks}
        />
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}

export default RatingImprovementMilestoneEmail;
