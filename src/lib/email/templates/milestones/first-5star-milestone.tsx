/**
 * First 5-Star Review Milestone Email Template
 *
 * Celebratory email sent when a user receives their first 5-star review.
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
import type { First5StarMilestoneEmailData } from "../../types";

interface First5StarMilestoneEmailProps {
  data: First5StarMilestoneEmailData;
}

export function First5StarMilestoneEmail({ data }: First5StarMilestoneEmailProps) {
  const {
    firstName,
    customerName,
    reviewText,
    reviewDate,
    totalReviews,
    viewReviewUrl,
    socialShareLinks,
    toEmail,
  } = data;

  return (
    <EmailLayout
      preview={`Congratulations ${firstName}! You received your first 5-star review!`}
    >
      <RepwellHeader />

      <CelebrationHeader
        emoji="⭐"
        title="Perfect 5 Stars!"
        subtitle="Your first perfect review!"
        badgeTier="gold"
      />

      <SingleColumnLayout>
        <EmailParagraph>
          This is amazing, {firstName}! You&apos;ve received your first perfect 5-star
          review. This is a testament to the exceptional service you provide.
        </EmailParagraph>

        {/* Review Card */}
        <EmailCard showAccentBar accentColor="#FFD700">
          <Section style={{ textAlign: "center" }}>
            <Text
              style={{
                margin: 0,
                fontSize: "48px",
                letterSpacing: "4px",
                color: "#FFD700",
                marginBottom: spacing[3],
              }}
            >
              ★★★★★
            </Text>

            {reviewText && (
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.lg,
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
          </Section>
        </EmailCard>

        <Spacer size="md" />

        {/* Stats */}
        <EmailCard>
          <Section style={{ textAlign: "center" }}>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: colors.text.muted,
                marginBottom: spacing[2],
              }}
            >
              Your Review Journey
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
              {totalReviews} Total Review{totalReviews !== 1 ? "s" : ""}
            </Text>
          </Section>
        </EmailCard>

        <Spacer size="md" />

        {/* CTA */}
        <Section style={{ textAlign: "center" }}>
          <PrimaryButton href={viewReviewUrl}>View Your Review</PrimaryButton>
        </Section>

        {/* Social Share */}
        <SocialShareCta
          message="Share your perfect 5-star review!"
          socialShareLinks={socialShareLinks}
        />
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}
