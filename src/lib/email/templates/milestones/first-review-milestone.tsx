/**
 * First Review Milestone Email Template
 *
 * Celebratory email sent when a user receives their first customer review.
 * Includes review details, celebration graphics, and next milestone preview.
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
  colors,
  typography,
  spacing,
} from "../../components";
import { CelebrationHeader } from "./celebration-header";
import { SocialShareCta } from "./social-share-cta";
import { renderStars } from "../../utils";
import type { FirstReviewMilestoneEmailData } from "../../types";

interface FirstReviewMilestoneEmailProps {
  data: FirstReviewMilestoneEmailData;
}

export function FirstReviewMilestoneEmail({ data }: FirstReviewMilestoneEmailProps) {
  const {
    firstName,
    customerName,
    reviewRating,
    reviewText,
    reviewDate,
    nextMilestoneCount,
    viewReviewUrl,
    dashboardUrl: _dashboardUrl,
    socialShareLinks,
    toEmail,
  } = data;

  return (
    <EmailLayout preview={`Congratulations ${firstName}! You received your first review!`}>
      <RepwellHeader />

      <CelebrationHeader
        emoji="🎉"
        title="Your First Review!"
        subtitle={`Congratulations, ${firstName}!`}
      />

      <SingleColumnLayout>
        <EmailParagraph>
          This is a huge milestone! You&apos;ve just received your first customer review,
          and we couldn&apos;t be more excited for you.
        </EmailParagraph>

        {/* Review Card */}
        <EmailCard showAccentBar accentColor={colors.accent.success}>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: "32px",
              color: "#FFD700",
              letterSpacing: "2px",
              marginBottom: spacing[2],
            }}
          >
            {renderStars(reviewRating)}
          </Text>

          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              color: colors.text.muted,
              marginBottom: spacing[3],
            }}
          >
            {reviewRating} out of 5 stars
          </Text>

          {reviewText && (
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.base,
                color: colors.text.secondary,
                fontStyle: "italic",
                lineHeight: typography.lineHeight.relaxed,
                marginBottom: spacing[3],
              }}
            >
              &ldquo;{reviewText}&rdquo;
            </Text>
          )}

          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              color: colors.text.muted,
            }}
          >
            — {customerName} • {reviewDate}
          </Text>
        </EmailCard>

        <Spacer size="md" />

        {/* Next Milestone Preview */}
        <Section
          style={{
            padding: spacing[4],
            backgroundColor: colors.background.subtle,
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.secondary,
              marginBottom: spacing[2],
            }}
          >
            Next Milestone
          </Text>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.display,
              fontSize: typography.fontSize["2xl"],
              fontWeight: typography.fontWeight.bold,
              color: colors.primary,
            }}
          >
            {nextMilestoneCount} Reviews
          </Text>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              color: colors.text.muted,
            }}
          >
            Keep up the great work!
          </Text>
        </Section>

        <Spacer size="md" />

        {/* CTA */}
        <Section style={{ textAlign: "center" }}>
          <PrimaryButton href={viewReviewUrl}>View Your Review</PrimaryButton>
        </Section>

        {/* Social Share */}
        <SocialShareCta
          message="Share your achievement with your network!"
          socialShareLinks={socialShareLinks}
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
            Tips to get more reviews:
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
            • Send survey requests shortly after closing
            <br />
            • Follow up with satisfied customers
            <br />
            • Make it easy with direct review links
          </Text>
        </EmailCard>
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}

export default FirstReviewMilestoneEmail;
