/**
 * Referral Leaderboard Email Template
 *
 * Periodic update showing referral leaderboard standings.
 * Includes rank, position changes, and incentive to climb higher.
 */

import * as React from "react";
import { Section, Text, Link } from "@react-email/components";
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
import type { ReferralLeaderboardEmailData } from "../types";

interface ReferralLeaderboardEmailProps {
  data: ReferralLeaderboardEmailData;
}

export function ReferralLeaderboardEmail({ data }: ReferralLeaderboardEmailProps) {
  const {
    referrerFirstName,
    leaderboardPeriod,
    periodStartDate,
    periodEndDate,
    userRank,
    userReferrals,
    previousRank,
    rankChange,
    topReferrers,
    referralsToNextRank,
    leaderboardRewards,
    socialShareLinks,
    referralLink,
    referralProgramUrl,
    toEmail,
  } = data;

  const periodLabel = {
    weekly: "This Week",
    monthly: "This Month",
    all_time: "All Time",
  }[leaderboardPeriod];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getRankChangeIcon = () => {
    if (!rankChange || rankChange === "same") return "➡️";
    return rankChange === "up" ? "⬆️" : "⬇️";
  };

  const getRankChangeColor = () => {
    if (!rankChange || rankChange === "same") return colors.text.muted;
    return rankChange === "up" ? colors.accent.success : colors.accent.error;
  };

  const getOrdinalSuffix = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <EmailLayout
      preview={`You're ranked #${userRank} on the referral leaderboard! ${periodLabel}`}
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
            🏆
          </Text>
          <Badge variant="default">{periodLabel} Leaderboard</Badge>
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
            Referral Leaderboard Update
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
            {formatDate(periodStartDate)} - {formatDate(periodEndDate)}
          </Text>
        </Section>

        <EmailParagraph>
          Hey {referrerFirstName},
        </EmailParagraph>

        <EmailParagraph>
          Here&apos;s where you stand on the referral leaderboard. Keep sharing to climb
          higher and earn more rewards!
        </EmailParagraph>

        {/* User's Rank Card */}
        <Section
          style={{
            padding: spacing[6],
            background: `linear-gradient(135deg, ${colors.repwell.teal[300]} 0%, ${colors.repwell.teal[400]} 100%)`,
            borderRadius: "16px",
            textAlign: "center",
          }}
        >
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              color: colors.text.inverseMuted,
              marginBottom: spacing[2],
            }}
          >
            Your Current Rank
          </Text>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.display,
              fontSize: "64px",
              fontWeight: typography.fontWeight.bold,
              color: colors.text.inverse,
              lineHeight: 1,
            }}
          >
            #{userRank}
          </Text>
          {previousRank && (
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: getRankChangeColor(),
                marginTop: spacing[2],
              }}
            >
              {getRankChangeIcon()}{" "}
              {rankChange === "up"
                ? `Up ${previousRank - userRank} spots`
                : rankChange === "down"
                ? `Down ${userRank - previousRank} spots`
                : "No change"}
            </Text>
          )}
          <Spacer size="sm" />
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.base,
              color: colors.text.inverseMuted,
            }}
          >
            {userReferrals} referral{userReferrals !== 1 ? "s" : ""} {periodLabel.toLowerCase()}
          </Text>
        </Section>

        <Spacer size="md" />

        {/* Leaderboard Table */}
        <EmailCard>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: spacing[4],
            }}
          >
            Top Referrers
          </Text>
          {topReferrers.map((referrer, index) => (
            <Section
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                padding: `${spacing[3]} 0`,
                borderBottom:
                  index < topReferrers.length - 1
                    ? `1px solid ${colors.border.subtle}`
                    : "none",
                backgroundColor: referrer.isCurrentUser
                  ? colors.repwell.sage[100]
                  : "transparent",
                marginLeft: referrer.isCurrentUser ? `-${spacing[4]}` : "0",
                marginRight: referrer.isCurrentUser ? `-${spacing[4]}` : "0",
                paddingLeft: referrer.isCurrentUser ? spacing[4] : "0",
                paddingRight: referrer.isCurrentUser ? spacing[4] : "0",
                borderRadius: referrer.isCurrentUser ? "8px" : "0",
              }}
            >
              <Section style={{ width: "40px", textAlign: "center" }}>
                <Text
                  style={{
                    margin: 0,
                    fontFamily: typography.fontFamily.display,
                    fontSize: referrer.rank <= 3 ? typography.fontSize.xl : typography.fontSize.base,
                    fontWeight: typography.fontWeight.bold,
                    color:
                      referrer.rank === 1
                        ? "#FFD700"
                        : referrer.rank === 2
                        ? "#C0C0C0"
                        : referrer.rank === 3
                        ? "#CD7F32"
                        : colors.text.muted,
                  }}
                >
                  {referrer.rank === 1
                    ? "🥇"
                    : referrer.rank === 2
                    ? "🥈"
                    : referrer.rank === 3
                    ? "🥉"
                    : `#${referrer.rank}`}
                </Text>
              </Section>
              <Section style={{ flex: 1 }}>
                <Text
                  style={{
                    margin: 0,
                    fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize.sm,
                    fontWeight: referrer.isCurrentUser
                      ? typography.fontWeight.bold
                      : typography.fontWeight.medium,
                    color: colors.text.primary,
                  }}
                >
                  {referrer.name}
                  {referrer.isCurrentUser && " (You)"}
                </Text>
              </Section>
              <Section style={{ textAlign: "right" }}>
                <Text
                  style={{
                    margin: 0,
                    fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.primary,
                  }}
                >
                  {referrer.referrals} referral{referrer.referrals !== 1 ? "s" : ""}
                </Text>
                {referrer.reward && (
                  <Text
                    style={{
                      margin: 0,
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize.xs,
                      color: colors.accent.success,
                    }}
                  >
                    {referrer.reward}
                  </Text>
                )}
              </Section>
            </Section>
          ))}
        </EmailCard>

        {/* Next Rank Info */}
        {referralsToNextRank && referralsToNextRank > 0 && (
          <>
            <Spacer size="md" />
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
                  color: colors.text.secondary,
                }}
              >
                Just <strong>{referralsToNextRank}</strong> more referral
                {referralsToNextRank !== 1 ? "s" : ""} to move up to{" "}
                <strong>{getOrdinalSuffix(userRank - 1)}</strong> place!
              </Text>
            </Section>
          </>
        )}

        {/* Rewards Info */}
        {leaderboardRewards && leaderboardRewards.length > 0 && (
          <>
            <Spacer size="md" />
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
                Leaderboard Prizes
              </Text>
              {leaderboardRewards.map((reward, index) => (
                <Section
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: `${spacing[2]} 0`,
                    borderBottom:
                      index < leaderboardRewards.length - 1
                        ? `1px solid ${colors.border.subtle}`
                        : "none",
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
                    {reward.rank}
                  </Text>
                  <Text
                    style={{
                      margin: 0,
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.primary,
                    }}
                  >
                    {reward.reward}
                  </Text>
                </Section>
              ))}
            </EmailCard>
          </>
        )}

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
            Share your referral link to climb the leaderboard and win rewards!
          </Text>
          <PrimaryButton href={referralProgramUrl}>
            Share &amp; Climb Higher
          </PrimaryButton>
        </Section>

        <Spacer size="md" />

        {/* Referral Link */}
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
              fontSize: typography.fontSize.xs,
              color: colors.text.muted,
              marginBottom: spacing[2],
            }}
          >
            Your referral link:
          </Text>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.mono,
              fontSize: typography.fontSize.sm,
              color: colors.primary,
              wordBreak: "break-all",
            }}
          >
            {referralLink}
          </Text>
        </Section>

        {/* Social Share */}
        {socialShareLinks && (
          <>
            <Spacer size="md" />
            <Section style={{ textAlign: "center" }}>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.muted,
                  marginBottom: spacing[3],
                }}
              >
                Quick share:
              </Text>
              <Section
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: spacing[2],
                }}
              >
                {socialShareLinks.linkedin && (
                  <Link
                    href={socialShareLinks.linkedin}
                    style={{
                      display: "inline-block",
                      padding: `${spacing[2]} ${spacing[3]}`,
                      backgroundColor: "#0A66C2",
                      color: "#ffffff",
                      borderRadius: "6px",
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.medium,
                      textDecoration: "none",
                      marginRight: spacing[2],
                    }}
                  >
                    LinkedIn
                  </Link>
                )}
                {socialShareLinks.twitter && (
                  <Link
                    href={socialShareLinks.twitter}
                    style={{
                      display: "inline-block",
                      padding: `${spacing[2]} ${spacing[3]}`,
                      backgroundColor: "#1DA1F2",
                      color: "#ffffff",
                      borderRadius: "6px",
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.medium,
                      textDecoration: "none",
                    }}
                  >
                    Twitter
                  </Link>
                )}
              </Section>
            </Section>
          </>
        )}
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}
