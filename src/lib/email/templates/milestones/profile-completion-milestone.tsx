/**
 * Profile Completion Milestone Email Template
 *
 * Celebratory email sent when a user reaches profile completion milestones
 * (50%, 75%, 100%). Shows progress, unlocked benefits, and remaining fields.
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
import type { ProfileCompletionMilestoneEmailData } from "../../types";

interface ProfileCompletionMilestoneEmailProps {
  data: ProfileCompletionMilestoneEmailData;
}

function getCompletionEmoji(percent: number): string {
  if (percent >= 100) return "🏆";
  if (percent >= 75) return "🌟";
  return "🎯";
}

function getCompletionTitle(percent: number): string {
  if (percent >= 100) return "Profile Complete!";
  if (percent >= 75) return "Almost There!";
  return "Great Progress!";
}

function getCompletionMessage(percent: number): string {
  if (percent >= 100) {
    return "Your profile is now 100% complete! You've unlocked all the benefits of a fully optimized profile.";
  }
  if (percent >= 75) {
    return "You're so close to a complete profile! Just a few more details and you'll unlock all the benefits.";
  }
  return "You've made great progress on your profile! A complete profile helps build trust with customers.";
}

export function ProfileCompletionMilestoneEmail({
  data,
}: ProfileCompletionMilestoneEmailProps) {
  const {
    firstName,
    completionPercent,
    previousPercent,
    missingFields,
    benefitsUnlocked,
    profileUrl,
    socialShareLinks,
    toEmail,
  } = data;

  const isComplete = completionPercent >= 100;
  const progressColor = isComplete ? colors.accent.success : colors.primary;

  return (
    <EmailLayout
      preview={`${firstName}, your profile is now ${completionPercent}% complete!`}
    >
      <RepwellHeader />

      <CelebrationHeader
        emoji={getCompletionEmoji(completionPercent)}
        title={getCompletionTitle(completionPercent)}
        subtitle={`${completionPercent}% Profile Complete`}
      />

      <SingleColumnLayout>
        <EmailParagraph>{getCompletionMessage(completionPercent)}</EmailParagraph>

        {/* Progress Card */}
        <EmailCard showAccentBar accentColor={progressColor}>
          <Section style={{ textAlign: "center" }}>
            {/* Large percentage display */}
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.display,
                fontSize: "72px",
                fontWeight: typography.fontWeight.bold,
                color: progressColor,
                lineHeight: "1",
              }}
            >
              {completionPercent}%
            </Text>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.lg,
                color: colors.text.muted,
                marginTop: spacing[2],
              }}
            >
              Profile Complete
            </Text>
          </Section>

          <Spacer size="md" />

          {/* Progress bar */}
          <ProgressBar value={completionPercent} color={progressColor} showValue={false} />

          <Spacer size="sm" />

          {/* Progress comparison */}
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              color: colors.text.muted,
              textAlign: "center",
            }}
          >
            Up from {previousPercent}% (+{completionPercent - previousPercent}%)
          </Text>
        </EmailCard>

        <Spacer size="md" />

        {/* Benefits Unlocked */}
        {benefitsUnlocked && benefitsUnlocked.length > 0 && (
          <>
            <EmailCard>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.accent.success,
                  marginBottom: spacing[3],
                }}
              >
                ✓ Benefits Unlocked
              </Text>
              {benefitsUnlocked.map((benefit, index) => (
                <Text
                  key={index}
                  style={{
                    margin: 0,
                    fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary,
                    lineHeight: typography.lineHeight.relaxed,
                    paddingLeft: spacing[2],
                    marginBottom: index < benefitsUnlocked.length - 1 ? spacing[2] : 0,
                  }}
                >
                  ✓ {benefit}
                </Text>
              ))}
            </EmailCard>

            <Spacer size="md" />
          </>
        )}

        {/* Missing Fields (only if not complete) */}
        {!isComplete && missingFields && missingFields.length > 0 && (
          <>
            <EmailCard>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.primary,
                  marginBottom: spacing[3],
                }}
              >
                Complete these to reach 100%:
              </Text>
              {missingFields.map((field, index) => (
                <Text
                  key={index}
                  style={{
                    margin: 0,
                    fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary,
                    lineHeight: typography.lineHeight.relaxed,
                    paddingLeft: spacing[2],
                    marginBottom: index < missingFields.length - 1 ? spacing[2] : 0,
                  }}
                >
                  ○ {field}
                </Text>
              ))}
            </EmailCard>

            <Spacer size="md" />
          </>
        )}

        {/* Why Profile Matters */}
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
            Why does profile completion matter?
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
            • Builds trust with potential customers
            <br />
            • Improves your visibility in search results
            <br />
            • Enables personalized customer communications
            <br />• Unlocks advanced platform features
          </Text>
        </EmailCard>

        <Spacer size="md" />

        {/* CTA */}
        <Section style={{ textAlign: "center" }}>
          <PrimaryButton href={profileUrl}>
            {isComplete ? "View Your Profile" : "Complete Your Profile"}
          </PrimaryButton>
        </Section>

        {/* Social Share (only for 100% completion) */}
        {isComplete && (
          <SocialShareCta
            message="Share your complete profile achievement!"
            socialShareLinks={socialShareLinks}
          />
        )}
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}

export default ProfileCompletionMilestoneEmail;
