/**
 * Video Processing Started Email Template
 *
 * Sent to loan officer when video processing begins.
 * Uses S073 email design system components.
 */

import * as React from "react";
import { Img, Section, Text } from "@react-email/components";
import {
  EmailLayout,
  SingleColumnLayout,
  RepwellHeader,
  RepwellFooter,
  EmailHeading,
  EmailParagraph,
  PrimaryButton,
  EmailCard,
  InfoCard,
  Spacer,
  Badge,
  colors,
  typography,
  spacing,
} from "../components";
import type { VideoProcessingStartedEmailData } from "../types";

interface VideoProcessingStartedEmailProps {
  data: VideoProcessingStartedEmailData;
}

export function VideoProcessingStartedEmail({
  data,
}: VideoProcessingStartedEmailProps) {
  const {
    loanOfficerName,
    customerName,
    testimonialId,
    dashboardUrl,
    videoThumbnailUrl,
    videoDurationSeconds,
    submittedAt,
    estimatedProcessingTime,
    toEmail,
  } = data;

  const videoUrl = `${dashboardUrl}/testimonials/${testimonialId}`;
  const durationText = videoDurationSeconds
    ? formatDuration(videoDurationSeconds)
    : null;

  return (
    <EmailLayout preview={`Video testimonial from ${customerName} is being processed`}>
      <RepwellHeader />

      <SingleColumnLayout center>
        <Badge variant="info">Processing</Badge>
        <Spacer size="sm" />
        <EmailHeading as="h1">Video Processing Started</EmailHeading>
        <EmailParagraph>
          Hi {loanOfficerName}, a new video testimonial from{" "}
          <strong>{customerName}</strong> has been received and is now being
          processed.
        </EmailParagraph>
      </SingleColumnLayout>

      {/* Video Thumbnail */}
      {videoThumbnailUrl && (
        <SingleColumnLayout center>
          <EmailCard showAccentBar={false}>
            <Section style={{ textAlign: "center" }}>
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
              {/* Play button overlay indicator */}
              <Section
                style={{
                  marginTop: spacing[3],
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
                  {durationText && `Duration: ${durationText}`}
                  {durationText && submittedAt && " | "}
                  {submittedAt && `Submitted: ${submittedAt}`}
                </Text>
              </Section>
            </Section>
          </EmailCard>
        </SingleColumnLayout>
      )}

      <Spacer size="md" />

      {/* Processing Info */}
      <SingleColumnLayout>
        <InfoCard type="info" title="What happens next?">
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
            }}
          >
            Our system is processing the video to optimize quality and generate
            a transcription. You&apos;ll receive another notification when
            processing is complete.
            {estimatedProcessingTime && (
              <>
                <br />
                <br />
                <strong>Estimated time:</strong> {estimatedProcessingTime}
              </>
            )}
          </Text>
        </InfoCard>
      </SingleColumnLayout>

      <Spacer size="md" />

      {/* CTA */}
      <SingleColumnLayout center>
        <PrimaryButton href={videoUrl}>View in Dashboard</PrimaryButton>
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

export default VideoProcessingStartedEmail;
