/**
 * Referral Friend Converted Email Template
 *
 * Notification sent to referrer when their friend converts to a paid plan.
 * Includes reward details, celebration, and encouragement to refer more.
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
  colors,
  typography,
  spacing,
} from "../components";
import type { ReferralFriendConvertedEmailData } from "../types";
import {
  formatRewardValue,
  getRewardIcon,
  formatDateLong,
} from "../referral-utils";

interface ReferralFriendConvertedEmailProps {
  data: ReferralFriendConvertedEmailData;
}

export function ReferralFriendConvertedEmail({ data }: ReferralFriendConvertedEmailProps) {
  const {
    referrerFirstName,
    friendName,
    friendPlanName,
    convertedAt,
    rewardEarned,
    rewardType,
    totalRewardsEarned,
    totalSuccessfulReferrals,
    referralProgramUrl,
    toEmail,
  } = data;

  const formattedDate = formatDateLong(convertedAt);
  const rewardIcon = getRewardIcon(rewardType);

  return (
    <EmailLayout
      preview={`You earned ${rewardEarned}! ${friendName} upgraded to ${friendPlanName}.`}
    >
      <RepwellHeader />

      <SingleColumnLayout>
        {/* Hero Section */}
        <Section style={{ textAlign: "center", marginBottom: spacing[6] }}>
          <Text
            style={{
              margin: 0,
              fontSize: "64px",
              marginBottom: spacing[3],
            }}
          >
            🎊
          </Text>
          <Badge variant="success">Reward Earned!</Badge>
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
            You just earned {rewardEarned}!
          </Text>
        </Section>

        <EmailParagraph>
          Congratulations {referrerFirstName}!
        </EmailParagraph>

        <EmailParagraph>
          Your friend <strong>{friendName}</strong> just upgraded to the{" "}
          <strong>{friendPlanName}</strong> plan, and you&apos;ve earned your referral
          reward!
        </EmailParagraph>

        {/* Reward Card */}
        <Section
          style={{
            padding: spacing[8],
            background: `linear-gradient(135deg, ${colors.repwell.teal[300]} 0%, ${colors.repwell.teal[400]} 100%)`,
            borderRadius: "16px",
            textAlign: "center",
          }}
        >
          <Text
            style={{
              margin: 0,
              fontSize: "48px",
              marginBottom: spacing[2],
            }}
          >
            {rewardIcon}
          </Text>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.display,
              fontSize: typography.fontSize["4xl"],
              fontWeight: typography.fontWeight.bold,
              color: colors.text.inverse,
              marginBottom: spacing[2],
            }}
          >
            {rewardEarned}
          </Text>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              color: colors.text.inverseMuted,
            }}
          >
            Added to your account
          </Text>
        </Section>

        <Spacer size="md" />

        {/* Conversion Details */}
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
            Referral Details
          </Text>
          <Section style={{ marginBottom: spacing[2] }}>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: colors.text.muted,
                display: "inline",
              }}
            >
              Friend:{" "}
            </Text>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: colors.text.primary,
                fontWeight: typography.fontWeight.medium,
                display: "inline",
              }}
            >
              {friendName}
            </Text>
          </Section>
          <Section style={{ marginBottom: spacing[2] }}>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: colors.text.muted,
                display: "inline",
              }}
            >
              Plan:{" "}
            </Text>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: colors.text.primary,
                fontWeight: typography.fontWeight.medium,
                display: "inline",
              }}
            >
              {friendPlanName}
            </Text>
          </Section>
          <Section>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: colors.text.muted,
                display: "inline",
              }}
            >
              Converted:{" "}
            </Text>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: colors.text.primary,
                fontWeight: typography.fontWeight.medium,
                display: "inline",
              }}
            >
              {formattedDate}
            </Text>
          </Section>
        </EmailCard>

        <Spacer size="md" />

        {/* Lifetime Stats */}
        <Section
          style={{
            padding: spacing[6],
            backgroundColor: colors.background.subtle,
            borderRadius: "12px",
          }}
        >
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.secondary,
              marginBottom: spacing[4],
              textAlign: "center",
            }}
          >
            Your Lifetime Referral Stats
          </Text>
          <Section
            style={{
              display: "flex",
              justifyContent: "space-around",
              textAlign: "center",
            }}
          >
            <Section>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.display,
                  fontSize: typography.fontSize["2xl"],
                  fontWeight: typography.fontWeight.bold,
                  color: colors.primary,
                }}
              >
                {totalSuccessfulReferrals}
              </Text>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.xs,
                  color: colors.text.muted,
                }}
              >
                Successful Referrals
              </Text>
            </Section>
            <Section>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.display,
                  fontSize: typography.fontSize["2xl"],
                  fontWeight: typography.fontWeight.bold,
                  color: colors.accent.success,
                }}
              >
                {formatRewardValue(totalRewardsEarned, rewardType)}
              </Text>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.xs,
                  color: colors.text.muted,
                }}
              >
                Total Earned
              </Text>
            </Section>
          </Section>
        </Section>

        <Spacer size="lg" />

        {/* CTA */}
        <Section style={{ textAlign: "center" }}>
          <Text
            style={{
              margin: 0,
              marginBottom: spacing[4],
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
              textAlign: "center",
            }}
          >
            Keep the momentum going! Share Repwell with more colleagues and earn
            even more rewards.
          </Text>
          <PrimaryButton href={referralProgramUrl}>
            Refer More Friends
          </PrimaryButton>
        </Section>
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}
