/**
 * Streak Milestone Email Template
 *
 * Celebratory email sent when a user achieves a response/activity streak
 * (7, 30, 90 day streaks).
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
import type { StreakMilestoneEmailData } from "../../types";

interface StreakMilestoneEmailProps {
  data: StreakMilestoneEmailData;
}

function getStreakEmoji(days: number): string {
  if (days >= 90) return "🏆";
  if (days >= 30) return "🔥";
  if (days >= 7) return "⚡";
  return "✨";
}

function getStreakTier(days: number): "bronze" | "silver" | "gold" | "platinum" {
  if (days >= 90) return "platinum";
  if (days >= 30) return "gold";
  if (days >= 7) return "silver";
  return "bronze";
}

function getStreakMessage(days: number): string {
  if (days >= 90) return "Legendary consistency! Your dedication is unmatched.";
  if (days >= 30) return "A full month of excellence! You're building great habits.";
  if (days >= 7) return "A whole week! You're on your way to greatness.";
  return "Great start! Keep the momentum going.";
}

export function StreakMilestoneEmail({ data }: StreakMilestoneEmailProps) {
  const {
    firstName,
    streakDays,
    streakType: _streakType,
    streakDescription,
    nextStreakDays,
    viewStreakUrl,
    socialShareLinks,
    toEmail,
  } = data;

  const emoji = getStreakEmoji(streakDays);
  const tier = getStreakTier(streakDays);
  const message = getStreakMessage(streakDays);

  // Create flame icons for visual impact
  const flameCount = Math.min(Math.ceil(streakDays / 7), 10);
  const flames = "🔥".repeat(flameCount);

  return (
    <EmailLayout
      preview={`Congratulations ${firstName}! ${streakDays}-day streak achieved!`}
    >
      <RepwellHeader />

      <CelebrationHeader
        emoji={emoji}
        title={`${streakDays}-Day Streak!`}
        subtitle={streakDescription}
        badgeTier={tier}
      />

      <SingleColumnLayout>
        <EmailParagraph>{message}</EmailParagraph>

        {/* Streak Card */}
        <EmailCard showAccentBar accentColor="#FF6B35">
          <Section style={{ textAlign: "center" }}>
            <Text
              style={{
                margin: 0,
                fontSize: "32px",
                lineHeight: "1.2",
                marginBottom: spacing[3],
              }}
            >
              {flames}
            </Text>

            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.display,
                fontSize: "72px",
                fontWeight: typography.fontWeight.bold,
                color: "#FF6B35",
                lineHeight: "1",
              }}
            >
              {streakDays}
            </Text>

            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.secondary,
                marginTop: spacing[2],
              }}
            >
              Days in a Row
            </Text>
          </Section>
        </EmailCard>

        <Spacer size="md" />

        {/* Next Streak Goal */}
        {nextStreakDays && (
          <>
            <EmailCard>
              <Section style={{ textAlign: "center" }}>
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
                  Next Streak Milestone
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
                  {nextStreakDays} Days
                </Text>

                <Text
                  style={{
                    margin: 0,
                    fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize.sm,
                    color: colors.text.muted,
                    marginTop: spacing[2],
                  }}
                >
                  Only {nextStreakDays - streakDays} more days to go!
                </Text>
              </Section>
            </EmailCard>

            <Spacer size="md" />
          </>
        )}

        {/* Tips to maintain streak */}
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
            Keep your streak alive:
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
            • Set a daily reminder to check your dashboard
            <br />
            • Respond to reviews as they come in
            <br />
            • Enable push notifications for new activity
          </Text>
        </EmailCard>

        <Spacer size="md" />

        {/* CTA */}
        <Section style={{ textAlign: "center" }}>
          <PrimaryButton href={viewStreakUrl}>View Your Streak</PrimaryButton>
        </Section>

        {/* Social Share */}
        <SocialShareCta
          message={`Share your ${streakDays}-day streak!`}
          socialShareLinks={socialShareLinks}
        />
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}

export default StreakMilestoneEmail;
