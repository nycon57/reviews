/**
 * Video Processing Complete Email Template
 *
 * Sent to loan officer when video processing is complete with transcription preview.
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
  EmailCard,
  InfoCard,
  Spacer,
  Badge,
  Divider,
  EmailButtonGroup,
  colors,
  typography,
  spacing,
} from "../components";
import type { VideoProcessingCompleteEmailData } from "../types";

interface VideoProcessingCompleteEmailProps {
  data: VideoProcessingCompleteEmailData;
}

export function VideoProcessingCompleteEmail({
  data,
}: VideoProcessingCompleteEmailProps) {
  const {
    loanOfficerName,
    customerName,
    testimonialId,
    dashboardUrl,
    videoThumbnailUrl,
    videoDurationSeconds,
    processedAt,
    transcriptionPreview,
    toEmail,
  } = data;

  const videoUrl = `${dashboardUrl}/testimonials/${testimonialId}`;
  const durationText = videoDurationSeconds
    ? formatDuration(videoDurationSeconds)
    : null;

  return (
    <EmailLayout preview={`Video from ${customerName} is ready for review`}>
      <RepwellHeader />

      <SingleColumnLayout center>
        <Badge variant="success">Ready for Review</Badge>
        <Spacer size="sm" />
        <EmailHeading as="h1">Video Processing Complete</EmailHeading>
        <EmailParagraph>
          Great news, {loanOfficerName}! The video testimonial from{" "}
          <strong>{customerName}</strong> has been processed and is ready for
          review.
        </EmailParagraph>
      </SingleColumnLayout>

      {/* Video Thumbnail with Details */}
      <SingleColumnLayout>
        <EmailCard>
          {videoThumbnailUrl && (
            <Section style={{ textAlign: "center", marginBottom: spacing[4] }}>
              <Img
                src={videoThumbnailUrl}
                alt={`Video testimonial from ${customerName}`}
                width={480}
                style={{
                  width: "100%",
                  maxWidth: "480px",
                  height: "auto",
                  borderRadius: "8px",
                  display: "block",
                  margin: "0 auto",
                }}
              />
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
              Processed {processedAt}
            </Text>
          </Section>
        </EmailCard>
      </SingleColumnLayout>

      {/* Transcription Preview */}
      {transcriptionPreview && (
        <>
          <Spacer size="md" />
          <SingleColumnLayout>
            <Text
              style={{
                margin: `0 0 ${spacing[2]} 0`,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.muted,
                textTransform: "uppercase",
                letterSpacing: typography.letterSpacing.wider,
              }}
            >
              Transcription Preview
            </Text>
            <EmailCard showAccentBar={false} accentColor="info">
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  fontStyle: "italic",
                  lineHeight: typography.lineHeight.relaxed,
                }}
              >
                &ldquo;{transcriptionPreview}&rdquo;
              </Text>
            </EmailCard>
          </SingleColumnLayout>
        </>
      )}

      <Spacer size="md" />

      {/* Next Steps */}
      <SingleColumnLayout>
        <InfoCard type="tip" title="Next Steps">
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
            }}
          >
            Review the video in your dashboard. Once approved, you&apos;ll be
            able to share it on your profile, social media, and marketing
            materials.
          </Text>
        </InfoCard>
      </SingleColumnLayout>

      <Spacer size="md" />

      {/* CTAs */}
      <SingleColumnLayout center>
        <EmailButtonGroup
          buttons={[
            { href: videoUrl, label: "Review Video", variant: "primary" },
            { href: `${dashboardUrl}/testimonials`, label: "View All Testimonials", variant: "secondary" },
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

export default VideoProcessingCompleteEmail;
