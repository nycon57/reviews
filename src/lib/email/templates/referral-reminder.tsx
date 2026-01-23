/**
 * Referral Program Reminder Email Template
 *
 * Reminder sent to inactive referrers to encourage them to share again.
 * Includes potential earnings, social sharing prompts, and leaderboard stats.
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
  CalloutBox,
  colors,
  typography,
  spacing,
} from "../components";
import type { ReferralReminderEmailData } from "../types";

interface ReferralReminderEmailProps {
  data: ReferralReminderEmailData;
}

export function ReferralReminderEmail({ data }: ReferralReminderEmailProps) {
  const {
    referrerFirstName,
    daysSinceLastReferral,
    totalReferrals,
    pendingRewards,
    potentialEarnings,
    rewardPerReferral,
    socialShareLinks,
    topReferrerStats,
    referralLink,
    referralProgramUrl,
    toEmail,
  } = data;

  return (
    <EmailLayout
      preview={`You could be earning ${potentialEarnings}! Share Repwell with your network.`}
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
            💰
          </Text>
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
            You&apos;re missing out on rewards!
          </Text>
        </Section>

        <EmailParagraph>
          Hey {referrerFirstName},
        </EmailParagraph>

        <EmailParagraph>
          It&apos;s been {daysSinceLastReferral} days since you last shared Repwell.
          Did you know you could be earning {potentialEarnings} just by sharing
          your referral link with colleagues?
        </EmailParagraph>

        {/* Earnings Potential Card */}
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
            Earn for every friend who signs up
          </Text>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.display,
              fontSize: typography.fontSize["4xl"],
              fontWeight: typography.fontWeight.bold,
              color: colors.text.inverse,
            }}
          >
            {rewardPerReferral}
          </Text>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              color: colors.text.inverseMuted,
              marginTop: spacing[2],
            }}
          >
            Per successful referral
          </Text>
        </Section>

        <Spacer size="md" />

        {/* Your Stats */}
        <EmailCard>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: spacing[4],
            }}
          >
            Your Referral Summary
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
                Pending
              </Text>
            </Section>
          </Section>
        </EmailCard>

        {/* Top Referrer Stats */}
        {topReferrerStats && (
          <>
            <Spacer size="md" />
            <CalloutBox variant="tip" title="Top Referrer This Month">
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                }}
              >
                <strong>{topReferrerStats.name}</strong> has referred{" "}
                <strong>{topReferrerStats.referrals}</strong> friends this month.
                Could you be next?
              </Text>
            </CalloutBox>
          </>
        )}

        <Spacer size="md" />

        {/* Easy Ways to Share */}
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
            Easy ways to share
          </Text>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.relaxed,
              marginBottom: spacing[4],
            }}
          >
            Share your unique link with colleagues, post on social media, or mention
            Repwell in your next team meeting!
          </Text>

          {/* Social Share Buttons */}
          {socialShareLinks && (
            <Section
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: spacing[2],
                justifyContent: "center",
              }}
            >
              {socialShareLinks.linkedin && (
                <Link
                  href={socialShareLinks.linkedin}
                  style={{
                    display: "inline-block",
                    padding: `${spacing[2]} ${spacing[4]}`,
                    backgroundColor: "#0A66C2",
                    color: "#ffffff",
                    borderRadius: "6px",
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    textDecoration: "none",
                    marginRight: spacing[2],
                    marginBottom: spacing[2],
                  }}
                >
                  Share on LinkedIn
                </Link>
              )}
              {socialShareLinks.twitter && (
                <Link
                  href={socialShareLinks.twitter}
                  style={{
                    display: "inline-block",
                    padding: `${spacing[2]} ${spacing[4]}`,
                    backgroundColor: "#1DA1F2",
                    color: "#ffffff",
                    borderRadius: "6px",
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    textDecoration: "none",
                    marginRight: spacing[2],
                    marginBottom: spacing[2],
                  }}
                >
                  Share on Twitter
                </Link>
              )}
              {socialShareLinks.whatsapp && (
                <Link
                  href={socialShareLinks.whatsapp}
                  style={{
                    display: "inline-block",
                    padding: `${spacing[2]} ${spacing[4]}`,
                    backgroundColor: "#25D366",
                    color: "#ffffff",
                    borderRadius: "6px",
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    textDecoration: "none",
                    marginBottom: spacing[2],
                  }}
                >
                  Share via WhatsApp
                </Link>
              )}
            </Section>
          )}
        </EmailCard>

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
            Your unique referral link:
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

        <Spacer size="lg" />

        {/* CTA */}
        <Section style={{ textAlign: "center" }}>
          <PrimaryButton href={referralProgramUrl}>
            Start Referring Now
          </PrimaryButton>
        </Section>
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}
