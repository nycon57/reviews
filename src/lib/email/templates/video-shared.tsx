/**
 * Video Shared Email Template
 *
 * Sent to loan officer when their video testimonial is shared on social media.
 * Uses S073 email design system components.
 */

import * as React from "react";
import { Img, Section, Text, Link } from "@react-email/components";
import {
  EmailLayout,
  SingleColumnLayout,
  RepwellHeader,
  RepwellFooter,
  EmailHeading,
  EmailParagraph,
  EmailCard,
  InfoCard,
  Spacer,
  Badge,
  EmailButtonGroup,
  colors,
  typography,
  spacing,
  layout,
} from "../components";
import type { VideoSharedEmailData } from "../types";

interface VideoSharedEmailProps {
  data: VideoSharedEmailData;
}

const platformConfig = {
  linkedin: {
    name: "LinkedIn",
    color: "#0077b5",
    icon: "LinkedIn",
  },
  twitter: {
    name: "Twitter/X",
    color: "#1da1f2",
    icon: "Twitter",
  },
  facebook: {
    name: "Facebook",
    color: "#1877f2",
    icon: "Facebook",
  },
  email: {
    name: "Email",
    color: colors.primary,
    icon: "Email",
  },
  embed: {
    name: "Website Embed",
    color: colors.repwell.teal[400],
    icon: "Embed",
  },
};

export function VideoSharedEmail({ data }: VideoSharedEmailProps) {
  const {
    loanOfficerName,
    customerName,
    testimonialId,
    dashboardUrl,
    videoThumbnailUrl,
    videoDurationSeconds,
    sharedAt,
    platform,
    shareUrl,
    videoPageUrl,
    sharedBy,
    toEmail,
  } = data;

  const videoUrl = `${dashboardUrl}/testimonials/${testimonialId}`;
  const durationText = videoDurationSeconds
    ? formatDuration(videoDurationSeconds)
    : null;
  const platformInfo = platformConfig[platform];

  return (
    <EmailLayout preview={`Your video testimonial was shared on ${platformInfo.name}`}>
      <RepwellHeader />

      <SingleColumnLayout center>
        <Badge variant="info">Shared on {platformInfo.name}</Badge>
        <Spacer size="sm" />
        <EmailHeading as="h1">Your Video Was Shared!</EmailHeading>
        <EmailParagraph>
          {sharedBy ? (
            <>
              Great news, {loanOfficerName}! {sharedBy} shared your video
              testimonial from <strong>{customerName}</strong> on{" "}
              {platformInfo.name}.
            </>
          ) : (
            <>
              Great news, {loanOfficerName}! Your video testimonial from{" "}
              <strong>{customerName}</strong> was shared on {platformInfo.name}.
            </>
          )}
        </EmailParagraph>
      </SingleColumnLayout>

      {/* Video Card with Share Details */}
      <SingleColumnLayout>
        <EmailCard>
          {videoThumbnailUrl && (
            <Section style={{ textAlign: "center", marginBottom: spacing[4] }}>
              <Link href={shareUrl}>
                <Img
                  src={videoThumbnailUrl}
                  alt={`Video testimonial from ${customerName}`}
                  width={400}
                  style={{
                    width: "100%",
                    maxWidth: "400px",
                    height: "auto",
                    borderRadius: "8px",
                    display: "block",
                    margin: "0 auto",
                  }}
                />
              </Link>
            </Section>
          )}

          {/* Video Details */}
          <Section style={{ textAlign: "center" }}>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
              }}
            >
              {customerName}&apos;s Testimonial
            </Text>
            <Text
              style={{
                margin: `${spacing[1]} 0 0 0`,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: colors.text.muted,
              }}
            >
              {durationText && `${durationText} • `}
              Shared {sharedAt}
            </Text>
          </Section>

          <Spacer size="md" />

          {/* Platform Badge */}
          <Section
            style={{
              backgroundColor: colors.background.subtle,
              padding: spacing[4],
              borderRadius: layout.borderRadius.md,
              textAlign: "center",
            }}
          >
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: colors.text.muted,
              }}
            >
              Shared via
            </Text>
            <Text
              style={{
                margin: `${spacing[1]} 0 0 0`,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: platformInfo.color,
              }}
            >
              {platformInfo.name}
            </Text>
          </Section>
        </EmailCard>
      </SingleColumnLayout>

      <Spacer size="md" />

      {/* Engagement Tips */}
      <SingleColumnLayout>
        <InfoCard type="tip" title="Maximize Your Reach">
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
            }}
          >
            {platform === "linkedin" && (
              <>
                Engage with comments on your LinkedIn post to boost visibility.
                Consider adding a personal note about working with{" "}
                {customerName} to make it more authentic.
              </>
            )}
            {platform === "twitter" && (
              <>
                Retweet and engage with replies to maximize reach. Pin the tweet
                to your profile for added visibility with prospects.
              </>
            )}
            {platform === "facebook" && (
              <>
                Respond to comments and consider boosting the post to reach more
                potential clients in your area.
              </>
            )}
            {platform === "email" && (
              <>
                Track engagement by checking if recipients click through to view
                the full testimonial.
              </>
            )}
            {platform === "embed" && (
              <>
                Your video is now visible on your website! Monitor your
                analytics to see how it impacts visitor engagement.
              </>
            )}
          </Text>
        </InfoCard>
      </SingleColumnLayout>

      <Spacer size="md" />

      {/* CTAs */}
      <SingleColumnLayout center>
        <EmailButtonGroup
          buttons={[
            { href: shareUrl, label: "View Shared Post", variant: "primary" },
            { href: videoUrl, label: "View in Dashboard", variant: "secondary" },
          ]}
        />
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}

/**
 * Format duration in seconds to human-readable format
 */
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

export default VideoSharedEmail;
