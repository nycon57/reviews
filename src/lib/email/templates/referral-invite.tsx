/**
 * Referral Invite Email Template
 *
 * Email sent when a user invites a friend to join via the referral program.
 * Includes personalized message, rewards info, and prominent signup CTA.
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
  Badge,
  CalloutBox,
  ReferralLinkBox,
  SocialShareSection,
  colors,
  typography,
  spacing,
} from "../components";
import type { ReferralInviteEmailData } from "../types";

interface ReferralInviteEmailProps {
  data: ReferralInviteEmailData;
}

export function ReferralInviteEmail({ data }: ReferralInviteEmailProps) {
  const {
    referrerFirstName,
    referrerFullName,
    recipientName,
    personalMessage,
    rewardForFriend,
    signupUrl,
    referralLink,
    socialShareLinks,
    toEmail,
  } = data;

  const recipientGreeting = recipientName ?? "there";

  return (
    <EmailLayout
      preview={`${referrerFirstName} invited you to try Repwell - Get ${rewardForFriend} when you sign up!`}
    >
      <RepwellHeader />

      <SingleColumnLayout>
        {/* Hero Section */}
        <Section style={{ textAlign: "center", marginBottom: spacing[6] }}>
          <Badge variant="success">Personal Invitation</Badge>
          <Spacer size="sm" />
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.display,
              fontSize: typography.fontSize["3xl"],
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              lineHeight: typography.lineHeight.tight,
            }}
          >
            {referrerFirstName} thinks you&apos;d love Repwell
          </Text>
        </Section>

        {/* Personal Message (if provided) */}
        {personalMessage && (
          <>
            <EmailCard showAccentBar accentColor={colors.repwell.sage[200]}>
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
                &ldquo;{personalMessage}&rdquo;
              </Text>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.muted,
                }}
              >
                — {referrerFullName}
              </Text>
            </EmailCard>
            <Spacer size="md" />
          </>
        )}

        <EmailParagraph>
          Hi {recipientGreeting},
        </EmailParagraph>

        <EmailParagraph>
          Your colleague {referrerFullName} has been using Repwell to manage their
          online reputation and thought you&apos;d benefit from it too.
        </EmailParagraph>

        {/* Rewards Section */}
        <CalloutBox variant="tip" title="Special Offer for You">
          <Section
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: spacing[4],
            }}
          >
            <Section style={{ flex: 1, textAlign: "center" }}>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.display,
                  fontSize: typography.fontSize["2xl"],
                  fontWeight: typography.fontWeight.bold,
                  color: colors.primary,
                  marginBottom: spacing[1],
                }}
              >
                {rewardForFriend}
              </Text>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.muted,
                }}
              >
                Your reward for joining
              </Text>
            </Section>
          </Section>
        </CalloutBox>

        <Spacer size="md" />

        {/* What is Repwell */}
        <EmailCard>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: spacing[3],
            }}
          >
            What is Repwell?
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
            Repwell is the AI-powered reputation management platform trusted by
            mortgage professionals nationwide. Collect reviews, respond to feedback,
            and grow your online presence — all in one place.
          </Text>
          <Spacer size="sm" />
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            • Automated survey distribution
            <br />
            • AI-powered sentiment analysis
            <br />
            • Review aggregation from multiple platforms
            <br />
            • Video testimonial collection
          </Text>
        </EmailCard>

        <Spacer size="lg" />

        {/* CTA */}
        <Section style={{ textAlign: "center" }}>
          <PrimaryButton href={signupUrl}>
            Claim Your {rewardForFriend} &amp; Get Started
          </PrimaryButton>
          <Spacer size="sm" />
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.xs,
              color: colors.text.muted,
            }}
          >
            No credit card required • Free 14-day trial
          </Text>
        </Section>

        <Spacer size="lg" />

        {/* Social Share Section */}
        {socialShareLinks && (
          <>
            <SocialShareSection
              links={socialShareLinks}
              label="Share Repwell with others:"
            />
            <Spacer size="md" />
          </>
        )}

        {/* Referral Link */}
        <ReferralLinkBox
          referralLink={referralLink}
          label="Your personal referral link:"
        />
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}
