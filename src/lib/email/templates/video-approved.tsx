/**
 * Video Approved and Published Email Template
 *
 * Sent to loan officer when their video testimonial is approved.
 * Includes share buttons for social media and deep link to video.
 * Uses S073 email design system components.
 */

import * as React from "react";
import { Img, Section, Text, Link, Row, Column } from "@react-email/components";
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
import type { VideoApprovedPublishedEmailData } from "../types";
import { formatDuration } from "../utils";

interface VideoApprovedEmailProps {
  data: VideoApprovedPublishedEmailData;
}

export function VideoApprovedEmail({ data }: VideoApprovedEmailProps) {
  const {
    loanOfficerName,
    customerName,
    testimonialId,
    dashboardUrl,
    videoThumbnailUrl,
    videoDurationSeconds,
    approvedAt,
    shareUrl,
    videoPageUrl,
    socialShareLinks,
    toEmail,
  } = data;

  const videoUrl = `${dashboardUrl}/testimonials/${testimonialId}`;
  const durationText = videoDurationSeconds
    ? formatDuration(videoDurationSeconds)
    : null;

  return (
    <EmailLayout preview={`Great news! Your video from ${customerName} is approved and ready to share`}>
      <RepwellHeader />

      {/* Success Banner */}
      <Section
        style={{
          backgroundColor: "#dcfce7",
          padding: `${spacing[4]} ${spacing[6]}`,
          borderBottom: "1px solid #86efac",
          textAlign: "center",
        }}
      >
        <Text
          style={{
            margin: 0,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: "#166534",
          }}
        >
          Video Testimonial Approved
        </Text>
      </Section>

      <SingleColumnLayout center>
        <Spacer size="sm" />
        <Badge variant="success">Approved</Badge>
        <Spacer size="sm" />
        <EmailHeading as="h1">Your Video is Ready to Share!</EmailHeading>
        <EmailParagraph>
          Congratulations {loanOfficerName}! The video testimonial from{" "}
          <strong>{customerName}</strong> has been approved and is now available
          in your library.
        </EmailParagraph>
      </SingleColumnLayout>

      {/* Video Card with Thumbnail */}
      <SingleColumnLayout>
        <EmailCard>
          {videoThumbnailUrl && (
            <Section style={{ textAlign: "center", marginBottom: spacing[4] }}>
              <Link href={videoPageUrl}>
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
              Approved {approvedAt}
            </Text>
          </Section>

          <Spacer size="md" />

          {/* Share Buttons */}
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
                margin: `0 0 ${spacing[3]} 0`,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.secondary,
              }}
            >
              Share this testimonial
            </Text>

            <Row style={{ display: "inline-block" }}>
              {socialShareLinks?.linkedin && (
                <Column
                  style={{
                    display: "inline-block",
                    padding: `0 ${spacing[2]}`,
                  }}
                >
                  <Link
                    href={socialShareLinks.linkedin}
                    style={{
                      display: "inline-block",
                      padding: `${spacing[2]} ${spacing[4]}`,
                      backgroundColor: "#0077b5",
                      color: "#ffffff",
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      textDecoration: "none",
                      borderRadius: layout.borderRadius.md,
                    }}
                  >
                    LinkedIn
                  </Link>
                </Column>
              )}

              {socialShareLinks?.twitter && (
                <Column
                  style={{
                    display: "inline-block",
                    padding: `0 ${spacing[2]}`,
                  }}
                >
                  <Link
                    href={socialShareLinks.twitter}
                    style={{
                      display: "inline-block",
                      padding: `${spacing[2]} ${spacing[4]}`,
                      backgroundColor: "#1da1f2",
                      color: "#ffffff",
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      textDecoration: "none",
                      borderRadius: layout.borderRadius.md,
                    }}
                  >
                    Twitter
                  </Link>
                </Column>
              )}

              {socialShareLinks?.facebook && (
                <Column
                  style={{
                    display: "inline-block",
                    padding: `0 ${spacing[2]}`,
                  }}
                >
                  <Link
                    href={socialShareLinks.facebook}
                    style={{
                      display: "inline-block",
                      padding: `${spacing[2]} ${spacing[4]}`,
                      backgroundColor: "#1877f2",
                      color: "#ffffff",
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      textDecoration: "none",
                      borderRadius: layout.borderRadius.md,
                    }}
                  >
                    Facebook
                  </Link>
                </Column>
              )}
            </Row>
          </Section>
        </EmailCard>
      </SingleColumnLayout>

      <Spacer size="md" />

      {/* Tips for Sharing */}
      <SingleColumnLayout>
        <InfoCard type="tip" title="Tips for Sharing">
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
            }}
          >
            Video testimonials are powerful social proof! Share on LinkedIn for
            maximum professional impact, or add to your email signature for
            prospects.
          </Text>
        </InfoCard>
      </SingleColumnLayout>

      <Spacer size="md" />

      {/* CTAs */}
      <SingleColumnLayout center>
        <EmailButtonGroup
          buttons={[
            { href: videoUrl, label: "View in Dashboard", variant: "primary" },
            { href: shareUrl, label: "Copy Share Link", variant: "secondary" },
          ]}
        />
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}

export default VideoApprovedEmail;
