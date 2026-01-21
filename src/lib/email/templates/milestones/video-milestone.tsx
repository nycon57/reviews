/**
 * Video Testimonial Milestone Email Template
 *
 * Celebratory email sent when a user reaches video testimonial milestones
 * (first video, 5, 10 videos).
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
import type { VideoMilestoneEmailData } from "../../types";

interface VideoMilestoneEmailProps {
  data: VideoMilestoneEmailData;
}

function getMilestoneEmoji(count: number): string {
  if (count >= 10) return "🎬";
  if (count >= 5) return "🎥";
  return "📹";
}

function getMilestoneTitle(count: number): string {
  if (count >= 10) return "Video Producer!";
  if (count >= 5) return "Video Star!";
  return "Your First Video!";
}

export function VideoMilestoneEmail({ data }: VideoMilestoneEmailProps) {
  const {
    firstName,
    videoCount,
    nextMilestone,
    latestVideoCustomerName,
    totalViewsCount,
    viewVideosUrl,
    socialShareLinks,
    toEmail,
  } = data;

  const emoji = getMilestoneEmoji(videoCount);
  const title = getMilestoneTitle(videoCount);

  return (
    <EmailLayout
      preview={`Congratulations ${firstName}! ${videoCount === 1 ? "Your first video testimonial!" : `${videoCount} video testimonials!`}`}
    >
      <RepwellHeader />

      <CelebrationHeader
        emoji={emoji}
        title={title}
        subtitle={
          videoCount === 1
            ? "Your video testimonial journey begins!"
            : `${videoCount} Video Testimonials Collected`
        }
      />

      <SingleColumnLayout>
        <EmailParagraph>
          {videoCount === 1
            ? `Amazing, ${firstName}! You've collected your first video testimonial${latestVideoCustomerName ? ` from ${latestVideoCustomerName}` : ""}. Video testimonials are incredibly powerful for building trust with potential clients.`
            : `Fantastic work, ${firstName}! You've now collected ${videoCount} video testimonials. Your customers' stories are making a real impact.`}
        </EmailParagraph>

        {/* Stats Card */}
        <EmailCard showAccentBar accentColor={colors.primary}>
          <Section style={{ textAlign: "center" }}>
            <Text
              style={{
                margin: 0,
                fontSize: "48px",
                lineHeight: "1",
                marginBottom: spacing[2],
              }}
            >
              🎬
            </Text>

            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.display,
                fontSize: "64px",
                fontWeight: typography.fontWeight.bold,
                color: colors.primary,
                lineHeight: "1",
              }}
            >
              {videoCount}
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
              Video{videoCount !== 1 ? "s" : ""} Collected
            </Text>
          </Section>

          {(totalViewsCount !== undefined || latestVideoCustomerName) && (
            <>
              <Spacer size="md" />

              <StatsRow
                stats={[
                  ...(totalViewsCount !== undefined
                    ? [
                        {
                          label: "Total Views",
                          value: totalViewsCount.toLocaleString(),
                        },
                      ]
                    : []),
                  ...(latestVideoCustomerName
                    ? [
                        {
                          label: "Latest From",
                          value: latestVideoCustomerName,
                        },
                      ]
                    : []),
                ]}
                columns={2}
              />
            </>
          )}
        </EmailCard>

        <Spacer size="md" />

        {/* Next Milestone */}
        {nextMilestone && (
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
                  Next Video Milestone
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
                  {nextMilestone} Videos
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
                  {nextMilestone - videoCount} more to go!
                </Text>
              </Section>
            </EmailCard>

            <Spacer size="md" />
          </>
        )}

        {/* Tips */}
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
            Get more video testimonials:
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
            • Ask happy customers right after closing
            <br />
            • Make recording easy with mobile-friendly links
            <br />
            • Share approved videos on social to inspire others
          </Text>
        </EmailCard>

        <Spacer size="md" />

        {/* CTA */}
        <Section style={{ textAlign: "center" }}>
          <PrimaryButton href={viewVideosUrl}>View Your Videos</PrimaryButton>
        </Section>

        {/* Social Share */}
        <SocialShareCta
          message="Share your video testimonial milestone!"
          socialShareLinks={socialShareLinks}
        />
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}
