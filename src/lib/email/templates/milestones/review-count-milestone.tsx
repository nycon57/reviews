/**
 * Review Count Milestone Email Template
 *
 * Celebratory email sent when a user reaches review count milestones
 * (10, 25, 50, 100, 250, 500 reviews). Includes stats comparison and next goal.
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
  ProgressBar,
  colors,
  typography,
  spacing,
} from "../../components";
import { CelebrationHeader } from "./celebration-header";
import { SocialShareCta } from "./social-share-cta";
import type { ReviewCountMilestoneEmailData } from "../../types";

interface ReviewCountMilestoneEmailProps {
  data: ReviewCountMilestoneEmailData;
}

function getMilestoneEmoji(count: number): string {
  if (count >= 500) return "🏆";
  if (count >= 250) return "💎";
  if (count >= 100) return "🌟";
  if (count >= 50) return "🔥";
  if (count >= 25) return "⭐";
  return "🎯";
}

function getMilestoneTitle(count: number): string {
  if (count >= 500) return "Review Legend!";
  if (count >= 250) return "Review Master!";
  if (count >= 100) return "Centurion!";
  if (count >= 50) return "Review Champion!";
  if (count >= 25) return "Review Pro!";
  return "Rising Star!";
}

export function ReviewCountMilestoneEmail({ data }: ReviewCountMilestoneEmailProps) {
  const {
    firstName,
    reviewCount,
    previousMilestone,
    nextMilestone,
    averageRating,
    percentileRank,
    timeToAchieve,
    viewReviewsUrl,
    socialShareLinks,
    toEmail,
  } = data;

  const progressToNext = nextMilestone
    ? Math.round((reviewCount / nextMilestone) * 100)
    : 100;

  return (
    <EmailLayout
      preview={`Congratulations ${firstName}! You've reached ${reviewCount} reviews!`}
    >
      <RepwellHeader />

      <CelebrationHeader
        emoji={getMilestoneEmoji(reviewCount)}
        title={getMilestoneTitle(reviewCount)}
        subtitle={`${reviewCount} Reviews Achieved!`}
      />

      <SingleColumnLayout>
        <EmailParagraph>
          Incredible achievement, {firstName}! You&apos;ve collected{" "}
          <strong>{reviewCount} customer reviews</strong>
          {timeToAchieve && ` in ${timeToAchieve}`}. Your dedication to customer
          experience is paying off!
        </EmailParagraph>

        {/* Stats Card */}
        <EmailCard showAccentBar accentColor={colors.primary}>
          <Section style={{ textAlign: "center" }}>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.display,
                fontSize: "64px",
                fontWeight: typography.fontWeight.bold,
                color: colors.primary,
                lineHeight: "1",
              }}
            >
              {reviewCount}
            </Text>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.lg,
                color: colors.text.muted,
                marginTop: spacing[2],
              }}
            >
              Total Reviews
            </Text>
          </Section>

          <Spacer size="md" />

          <StatsRow
            stats={[
              {
                label: "Average Rating",
                value: `${averageRating.toFixed(1)} ★`,
              },
              ...(percentileRank
                ? [
                    {
                      label: "Ranking",
                      value: `Top ${percentileRank}%`,
                    },
                  ]
                : []),
              ...(previousMilestone
                ? [
                    {
                      label: "Previous Milestone",
                      value: previousMilestone.toString(),
                    },
                  ]
                : []),
            ]}
          />
        </EmailCard>

        <Spacer size="md" />

        {/* Next Milestone Progress */}
        {nextMilestone && (
          <>
            <EmailCard>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.secondary,
                  marginBottom: spacing[3],
                }}
              >
                Progress to Next Milestone: {nextMilestone} Reviews
              </Text>

              <ProgressBar
                value={progressToNext}
                color={colors.primary}
                showValue
              />

              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.muted,
                  marginTop: spacing[2],
                }}
              >
                {nextMilestone - reviewCount} more reviews to go!
              </Text>
            </EmailCard>

            <Spacer size="md" />
          </>
        )}

        {/* CTA */}
        <Section style={{ textAlign: "center" }}>
          <PrimaryButton href={viewReviewsUrl}>View All Reviews</PrimaryButton>
        </Section>

        {/* Social Share */}
        <SocialShareCta
          message={`Share your ${reviewCount} review milestone!`}
          socialShareLinks={socialShareLinks}
        />
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}
