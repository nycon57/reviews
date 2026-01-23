/**
 * Referral Friend Signed Up Email Template
 *
 * Notification sent to referrer when their friend signs up.
 * Includes friend info, progress toward rewards, and next steps.
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
  ProgressBar,
  colors,
  typography,
  spacing,
} from "../components";
import type { ReferralFriendSignedUpEmailData } from "../types";

interface ReferralFriendSignedUpEmailProps {
  data: ReferralFriendSignedUpEmailData;
}

export function ReferralFriendSignedUpEmail({ data }: ReferralFriendSignedUpEmailProps) {
  const {
    referrerFirstName,
    friendName,
    friendEmail,
    signedUpAt,
    totalReferrals,
    pendingRewards,
    nextMilestone,
    referralProgramUrl,
    toEmail,
  } = data;

  const formattedDate = new Date(signedUpAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <EmailLayout
      preview={`Great news! ${friendName} just signed up using your referral link.`}
    >
      <RepwellHeader />

      <SingleColumnLayout>
        {/* Hero Section */}
        <Section style={{ textAlign: "center", marginBottom: spacing[6] }}>
          <Text
            style={{
              margin: 0,
              fontSize: "48px",
              marginBottom: spacing[3],
            }}
          >
            🎉
          </Text>
          <Badge variant="success">Referral Success</Badge>
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
            Your friend just signed up!
          </Text>
        </Section>

        <EmailParagraph>
          Hey {referrerFirstName},
        </EmailParagraph>

        <EmailParagraph>
          Great news! <strong>{friendName}</strong> just signed up for Repwell using your
          referral link. They&apos;re now exploring the platform and getting set up.
        </EmailParagraph>

        {/* Friend Details Card */}
        <EmailCard showAccentBar accentColor={colors.accent.success}>
          <Section style={{ display: "flex", alignItems: "center", gap: spacing[4] }}>
            <Section
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: colors.repwell.sage[100],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.primary,
                }}
              >
                {friendName.charAt(0).toUpperCase()}
              </Text>
            </Section>
            <Section style={{ flex: 1 }}>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.primary,
                }}
              >
                {friendName}
              </Text>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.muted,
                }}
              >
                {friendEmail}
              </Text>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.xs,
                  color: colors.text.subtle,
                }}
              >
                Signed up on {formattedDate}
              </Text>
            </Section>
          </Section>
        </EmailCard>

        <Spacer size="md" />

        {/* What Happens Next */}
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
            What happens next?
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
            When {friendName} upgrades to a paid plan, you&apos;ll earn your referral
            reward! We&apos;ll send you another email as soon as that happens.
          </Text>
        </EmailCard>

        <Spacer size="md" />

        {/* Stats Section */}
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
            Your Referral Stats
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
                {totalReferrals}
              </Text>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.xs,
                  color: colors.text.muted,
                }}
              >
                Total Referrals
              </Text>
            </Section>
            <Section>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.display,
                  fontSize: typography.fontSize["2xl"],
                  fontWeight: typography.fontWeight.bold,
                  color: colors.accent.warning,
                }}
              >
                {pendingRewards}
              </Text>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.xs,
                  color: colors.text.muted,
                }}
              >
                Pending Rewards
              </Text>
            </Section>
          </Section>
        </Section>

        {/* Next Milestone */}
        {nextMilestone && (
          <>
            <Spacer size="md" />
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
                Next Milestone
              </Text>
              <ProgressBar
                value={Math.round((totalReferrals / Math.max(nextMilestone.referralsNeeded, 1)) * 100)}
                color={colors.primary}
              />
              <Spacer size="sm" />
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                }}
              >
                {nextMilestone.referralsNeeded - totalReferrals} more referrals to unlock{" "}
                <strong>{nextMilestone.reward}</strong>
              </Text>
            </EmailCard>
          </>
        )}

        <Spacer size="lg" />

        {/* CTA */}
        <Section style={{ textAlign: "center" }}>
          <PrimaryButton href={referralProgramUrl}>
            Invite More Friends
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
            The more friends you refer, the more you earn!
          </Text>
        </Section>
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}
