/**
 * Video Approval Needed Email Template
 *
 * Sent to manager when a video testimonial needs approval.
 * Includes video thumbnail for quick visual preview.
 * Uses S073 email design system components.
 */

import * as React from "react";
import { Img, Section, Text, Row, Column } from "@react-email/components";
import {
  EmailLayout,
  SingleColumnLayout,
  RepwellHeader,
  RepwellFooter,
  EmailHeading,
  EmailParagraph,
  EmailCard,
  Spacer,
  EmailButtonGroup,
  colors,
  typography,
  spacing,
} from "../components";
import type { VideoApprovalNeededEmailData } from "../types";
import { formatDuration } from "../utils";

interface VideoApprovalNeededEmailProps {
  data: VideoApprovalNeededEmailData;
}

export function VideoApprovalNeededEmail({
  data,
}: VideoApprovalNeededEmailProps) {
  const {
    managerName,
    loanOfficerName,
    customerName,
    testimonialId,
    submittedAt,
    approvalQueueUrl,
    videoThumbnailUrl,
    videoDurationSeconds,
    transcriptionPreview,
    toEmail,
  } = data;

  const reviewUrl = `${approvalQueueUrl}${approvalQueueUrl.includes('?') ? '&' : '?'}testimonialId=${encodeURIComponent(testimonialId)}`;
  const durationText = videoDurationSeconds
    ? formatDuration(videoDurationSeconds)
    : null;

  return (
    <EmailLayout preview={`Video testimonial from ${customerName} needs your approval`}>
      <RepwellHeader />

      {/* Warning Banner */}
      <Section
        style={{
          backgroundColor: "#fef3c7",
          padding: `${spacing[4]} ${spacing[6]}`,
          borderBottom: "1px solid #fcd34d",
          textAlign: "center",
        }}
      >
        <Text
          style={{
            margin: 0,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: "#92400e",
          }}
        >
          Action Required: Video Testimonial Pending Approval
        </Text>
      </Section>

      <SingleColumnLayout center>
        <Spacer size="sm" />
        <EmailHeading as="h1">Video Needs Your Approval</EmailHeading>
        <EmailParagraph>
          Hi {managerName}, a new video testimonial submitted by{" "}
          <strong>{customerName}</strong> for <strong>{loanOfficerName}</strong>{" "}
          is ready for your review.
        </EmailParagraph>
      </SingleColumnLayout>

      {/* Video Preview Card */}
      <SingleColumnLayout>
        <EmailCard accentColor="warning">
          <Row>
            {/* Thumbnail Column */}
            {videoThumbnailUrl && (
              <Column
                style={{
                  width: "40%",
                  verticalAlign: "top",
                  paddingRight: spacing[4],
                }}
              >
                <Img
                  src={videoThumbnailUrl}
                  alt={`Video testimonial from ${customerName}`}
                  width={200}
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: "6px",
                    display: "block",
                  }}
                />
              </Column>
            )}

            {/* Details Column */}
            <Column
              style={{
                width: videoThumbnailUrl ? "60%" : "100%",
                verticalAlign: "top",
              }}
            >
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.primary,
                }}
              >
                {customerName}
              </Text>
              <Text
                style={{
                  margin: `${spacing[1]} 0`,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.muted,
                }}
              >
                For: {loanOfficerName}
              </Text>

              <Section style={{ marginTop: spacing[3] }}>
                {durationText && (
                  <Row>
                    <Column>
                      <Text
                        style={{
                          margin: 0,
                          fontFamily: typography.fontFamily.body,
                          fontSize: typography.fontSize.xs,
                          color: colors.text.muted,
                        }}
                      >
                        <strong>Duration:</strong> {durationText}
                      </Text>
                    </Column>
                  </Row>
                )}
                <Row>
                  <Column>
                    <Text
                      style={{
                        margin: durationText ? `${spacing[1]} 0 0 0` : 0,
                        fontFamily: typography.fontFamily.body,
                        fontSize: typography.fontSize.xs,
                        color: colors.text.muted,
                      }}
                    >
                      <strong>Submitted:</strong> {submittedAt}
                    </Text>
                  </Column>
                </Row>
              </Section>
            </Column>
          </Row>

          {/* Transcription Preview */}
          {transcriptionPreview && (
            <Section
              style={{
                marginTop: spacing[4],
                paddingTop: spacing[4],
                borderTop: `1px solid ${colors.border.subtle}`,
              }}
            >
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.muted,
                  textTransform: "uppercase",
                  letterSpacing: typography.letterSpacing.wide,
                }}
              >
                Transcription Preview
              </Text>
              <Text
                style={{
                  margin: `${spacing[2]} 0 0 0`,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  fontStyle: "italic",
                  lineHeight: typography.lineHeight.relaxed,
                }}
              >
                &ldquo;{transcriptionPreview}&rdquo;
              </Text>
            </Section>
          )}
        </EmailCard>
      </SingleColumnLayout>

      <Spacer size="md" />

      {/* CTAs */}
      <SingleColumnLayout center>
        <EmailButtonGroup
          buttons={[
            { href: reviewUrl, label: "Review & Approve", variant: "primary" },
            { href: approvalQueueUrl, label: "View Approval Queue", variant: "secondary" },
          ]}
        />
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}

export default VideoApprovalNeededEmail;
