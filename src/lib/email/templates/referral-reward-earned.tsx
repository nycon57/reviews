/**
 * Referral Reward Earned Email Template
 *
 * Notification about reward credit/discount being applied to account.
 * Includes redemption instructions and available balance.
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
  SecondaryButton,
  Spacer,
  Badge,
  CalloutBox,
  colors,
  typography,
  spacing,
} from "../components";
import type { ReferralRewardEarnedEmailData } from "../types";

interface ReferralRewardEarnedEmailProps {
  data: ReferralRewardEarnedEmailData;
}

export function ReferralRewardEarnedEmail({ data }: ReferralRewardEarnedEmailProps) {
  const {
    referrerFirstName,
    rewardDescription,
    rewardType,
    rewardExpiresAt,
    howToRedeem,
    redeemUrl,
    totalRewardsEarned,
    availableBalance,
    friendName,
    referralProgramUrl,
    toEmail,
  } = data;

  const rewardIcon = {
    credit: "💳",
    discount: "🏷️",
    cash: "💵",
    points: "⭐",
  }[rewardType];

  const formattedExpiry = rewardExpiresAt
    ? new Date(rewardExpiresAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <EmailLayout
      preview={`Your referral reward is ready! ${rewardDescription}`}
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
            🎁
          </Text>
          <Badge variant="success">Reward Ready</Badge>
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
            Your reward is ready to use!
          </Text>
        </Section>

        <EmailParagraph>
          Hi {referrerFirstName},
        </EmailParagraph>

        <EmailParagraph>
          {friendName
            ? `Thanks to your referral of ${friendName}, you've earned a reward that's now available in your account.`
            : "Your referral reward has been credited to your account and is ready to use!"}
        </EmailParagraph>

        {/* Reward Card */}
        <Section
          style={{
            padding: spacing[8],
            background: `linear-gradient(135deg, ${colors.repwell.sage[100]} 0%, ${colors.background.subtle} 100%)`,
            borderRadius: "16px",
            textAlign: "center",
            border: `2px solid ${colors.repwell.sage[200]}`,
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
              color: colors.primary,
              marginBottom: spacing[2],
            }}
          >
            {rewardDescription}
          </Text>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              color: colors.text.muted,
            }}
          >
            Available in your account
          </Text>
          {formattedExpiry && (
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.xs,
                color: colors.accent.warning,
                marginTop: spacing[2],
              }}
            >
              Expires: {formattedExpiry}
            </Text>
          )}
        </Section>

        <Spacer size="md" />

        {/* How to Redeem */}
        <CalloutBox variant="info" title="How to Use Your Reward">
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            {howToRedeem}
          </Text>
        </CalloutBox>

        <Spacer size="md" />

        {/* Account Balance */}
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
            Your Rewards Summary
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
                  color: colors.accent.success,
                }}
              >
                ${availableBalance}
              </Text>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.xs,
                  color: colors.text.muted,
                }}
              >
                Available Balance
              </Text>
            </Section>
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
                ${totalRewardsEarned}
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

        {/* CTAs */}
        <Section style={{ textAlign: "center" }}>
          <PrimaryButton href={redeemUrl}>
            Use Your Reward
          </PrimaryButton>
          <Spacer size="sm" />
          <SecondaryButton href={referralProgramUrl}>
            Refer More Friends
          </SecondaryButton>
        </Section>

        <Spacer size="md" />

        {/* Encouragement */}
        <Section
          style={{
            padding: spacing[4],
            backgroundColor: colors.background.muted,
            borderRadius: "8px",
            textAlign: "center",
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
            Want to earn more rewards? Share Repwell with your network and get rewarded
            for every friend who signs up!
          </Text>
        </Section>
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}
