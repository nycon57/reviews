/**
 * Leaderboard Achievement Milestone Email Template
 *
 * Celebratory email sent when a user achieves a leaderboard position
 * (entered top 10, reached top 3, or hit #1).
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
import type { LeaderboardMilestoneEmailData } from "../../types";

interface LeaderboardMilestoneEmailProps {
  data: LeaderboardMilestoneEmailData;
}

function getAchievementDetails(type: string): {
  emoji: string;
  title: string;
  tier: "gold" | "silver" | "platinum";
} {
  switch (type) {
    case "reached_number_1":
      return { emoji: "👑", title: "You're #1!", tier: "platinum" };
    case "reached_top_3":
      return { emoji: "🥇", title: "Top 3 Achieved!", tier: "gold" };
    case "entered_top_10":
    default:
      return { emoji: "🏅", title: "Top 10 Achieved!", tier: "silver" };
  }
}

function getPeriodLabel(period: string): string {
  switch (period) {
    case "monthly":
      return "This Month";
    case "quarterly":
      return "This Quarter";
    case "yearly":
      return "This Year";
    case "all_time":
    default:
      return "All Time";
  }
}

export function LeaderboardMilestoneEmail({ data }: LeaderboardMilestoneEmailProps) {
  const {
    firstName,
    currentRank,
    previousRank,
    rankImprovement,
    totalParticipants,
    periodType,
    achievementType,
    reputationScore,
    viewLeaderboardUrl,
    socialShareLinks,
    toEmail,
  } = data;

  const { emoji, title, tier } = getAchievementDetails(achievementType);
  const periodLabel = getPeriodLabel(periodType);

  return (
    <EmailLayout
      preview={`Congratulations ${firstName}! You've reached #${currentRank} on the leaderboard!`}
    >
      <RepwellHeader />

      <CelebrationHeader
        emoji={emoji}
        title={title}
        subtitle={`You're ranked #${currentRank} ${periodLabel}`}
        badgeTier={tier}
      />

      <SingleColumnLayout>
        <EmailParagraph>
          Outstanding work, {firstName}! Your commitment to excellence has earned
          you a spot in the top performers on the leaderboard.
        </EmailParagraph>

        {/* Rank Card */}
        <EmailCard showAccentBar accentColor={tier === "platinum" ? "#E5E4E2" : tier === "gold" ? "#FFD700" : "#C0C0C0"}>
          <Section style={{ textAlign: "center" }}>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.muted,
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: spacing[2],
              }}
            >
              Your Rank
            </Text>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.display,
                fontSize: "72px",
                fontWeight: typography.fontWeight.bold,
                color: colors.primary,
                lineHeight: "1",
              }}
            >
              #{currentRank}
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
              out of {totalParticipants} participants
            </Text>
          </Section>

          <Spacer size="md" />

          <StatsRow
            stats={[
              {
                label: "Reputation Score",
                value: reputationScore.toString(),
              },
              ...(rankImprovement && rankImprovement > 0
                ? [
                    {
                      label: "Positions Gained",
                      value: `+${rankImprovement}`,
                    },
                  ]
                : []),
              ...(previousRank
                ? [
                    {
                      label: "Previous Rank",
                      value: `#${previousRank}`,
                    },
                  ]
                : []),
            ]}
          />
        </EmailCard>

        <Spacer size="md" />

        {/* Achievement Details */}
        <EmailCard>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: spacing[2],
            }}
          >
            What got you here:
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
            Your reputation score is calculated based on:
            <br />
            • Customer reviews and ratings
            <br />
            • NPS and CSAT scores
            <br />
            • Survey response rates
            <br />
            • Consistent performance over time
          </Text>
        </EmailCard>

        <Spacer size="md" />

        {/* CTA */}
        <Section style={{ textAlign: "center" }}>
          <PrimaryButton href={viewLeaderboardUrl}>View Leaderboard</PrimaryButton>
        </Section>

        {/* Social Share */}
        <SocialShareCta
          message="Share your leaderboard achievement!"
          socialShareLinks={socialShareLinks}
        />
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}

export default LeaderboardMilestoneEmail;
