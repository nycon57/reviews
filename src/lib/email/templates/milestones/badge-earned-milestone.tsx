/**
 * Badge Earned Milestone Email Template
 *
 * Celebratory email sent when a user earns a new badge/achievement.
 * Shows the badge details, progress, and next badge to unlock.
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
  ProgressBar,
  colors,
  typography,
  spacing,
} from "../../components";
import { CelebrationHeader } from "./celebration-header";
import { SocialShareCta } from "./social-share-cta";
import type { BadgeEarnedMilestoneEmailData } from "../../types";

interface BadgeEarnedMilestoneEmailProps {
  data: BadgeEarnedMilestoneEmailData;
}

function getBadgeEmoji(icon: string, tier?: string): string {
  // Map common icons to emojis
  const iconMap: Record<string, string> = {
    star: "⭐",
    "trending-up": "📈",
    award: "🏆",
    trophy: "🏆",
    crown: "👑",
    shield: "🛡️",
    "thumbs-up": "👍",
    heart: "❤️",
    "mail-check": "✉️",
    flame: "🔥",
    medal: "🥇",
  };

  // Use tier-specific emoji if platinum or gold
  if (tier === "platinum") return "💎";
  if (tier === "gold") return "🏆";

  return iconMap[icon] || "🎖️";
}

function getTierColor(tier?: string): string {
  switch (tier) {
    case "platinum":
      return "#E5E4E2";
    case "gold":
      return "#FFD700";
    case "silver":
      return "#C0C0C0";
    case "bronze":
      return "#CD7F32";
    default:
      return colors.primary;
  }
}

export function BadgeEarnedMilestoneEmail({ data }: BadgeEarnedMilestoneEmailProps) {
  const {
    firstName,
    badgeName,
    badgeDescription,
    badgeIcon,
    badgeTier,
    totalBadgesEarned,
    totalBadgesAvailable,
    nextBadgeName,
    nextBadgeProgress,
    viewBadgesUrl,
    socialShareLinks,
    toEmail,
  } = data;

  const badgeEmoji = getBadgeEmoji(badgeIcon, badgeTier);
  const tierColor = getTierColor(badgeTier);
  const badgeProgress = Math.round((totalBadgesEarned / totalBadgesAvailable) * 100);

  return (
    <EmailLayout
      preview={`Congratulations ${firstName}! You've earned the ${badgeName} badge!`}
    >
      <RepwellHeader />

      <CelebrationHeader
        emoji={badgeEmoji}
        title="Badge Unlocked!"
        subtitle={badgeName}
        badgeTier={badgeTier}
      />

      <SingleColumnLayout>
        <EmailParagraph>
          Way to go, {firstName}! You&apos;ve earned a new badge through your
          outstanding performance.
        </EmailParagraph>

        {/* Badge Card */}
        <EmailCard showAccentBar accentColor={tierColor}>
          <Section style={{ textAlign: "center" }}>
            <Text
              style={{
                margin: 0,
                fontSize: "64px",
                lineHeight: "1",
                marginBottom: spacing[3],
              }}
            >
              {badgeEmoji}
            </Text>

            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.display,
                fontSize: typography.fontSize["2xl"],
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}
            >
              {badgeName}
            </Text>

            {badgeTier && (
              <Text
                style={{
                  margin: 0,
                  display: "inline-block",
                  padding: `${spacing[1]} ${spacing[3]}`,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  color: badgeTier === "bronze" ? "#8B4513" : "#333",
                  backgroundColor: tierColor,
                  borderRadius: "9999px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: spacing[3],
                }}
              >
                {badgeTier}
              </Text>
            )}

            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.base,
                color: colors.text.secondary,
                lineHeight: typography.lineHeight.relaxed,
              }}
            >
              {badgeDescription}
            </Text>
          </Section>
        </EmailCard>

        <Spacer size="md" />

        {/* Badge Collection Progress */}
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
            Your Badge Collection: {totalBadgesEarned} of {totalBadgesAvailable}
          </Text>

          <ProgressBar
            value={badgeProgress}
            color={colors.primary}
            showValue
          />
        </EmailCard>

        {/* Next Badge Preview */}
        {nextBadgeName && (
          <>
            <Spacer size="md" />

            <EmailCard>
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
                Next Badge to Unlock
              </Text>

              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.primary,
                  marginBottom: spacing[2],
                }}
              >
                {nextBadgeName}
              </Text>

              {nextBadgeProgress !== undefined && (
                <ProgressBar
                  value={nextBadgeProgress}
                  color={colors.secondary}
                  showValue
                />
              )}
            </EmailCard>
          </>
        )}

        <Spacer size="md" />

        {/* CTA */}
        <Section style={{ textAlign: "center" }}>
          <PrimaryButton href={viewBadgesUrl}>View All Badges</PrimaryButton>
        </Section>

        {/* Social Share */}
        <SocialShareCta
          message={`Share your ${badgeName} badge!`}
          socialShareLinks={socialShareLinks}
        />
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}
