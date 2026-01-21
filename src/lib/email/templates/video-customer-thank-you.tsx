/**
 * Video Customer Thank You Email Template
 *
 * Sent to customer immediately after they submit a video testimonial.
 * Uses S073 email design system components.
 */

import * as React from "react";
import { Img, Section, Text } from "@react-email/components";
import {
  EmailLayout,
  SingleColumnLayout,
  OrganizationHeader,
  PoweredByFooter,
  EmailHeading,
  EmailParagraph,
  EmailCard,
  InfoCard,
  Spacer,
  colors,
  typography,
  spacing,
} from "../components";
import type { VideoCustomerThankYouEmailData } from "../types";

interface VideoCustomerThankYouEmailProps {
  data: VideoCustomerThankYouEmailData;
}

export function VideoCustomerThankYouEmail({
  data,
}: VideoCustomerThankYouEmailProps) {
  const {
    customerName,
    loanOfficerName,
    loanOfficerPhotoUrl,
    organizationName,
    organizationLogoUrl,
    submittedAt,
    nextStepsMessage,
    toEmail,
  } = data;

  const unsubscribeUrl = `https://app.repwell.ai/api/email/unsubscribe?email=${encodeURIComponent(toEmail)}`;

  return (
    <EmailLayout preview={`Thank you for sharing your experience with ${loanOfficerName}`}>
      <OrganizationHeader
        name={organizationName}
        logoUrl={organizationLogoUrl}
        loanOfficer={
          loanOfficerPhotoUrl
            ? {
                name: loanOfficerName,
                photoUrl: loanOfficerPhotoUrl,
              }
            : undefined
        }
      />

      <SingleColumnLayout center>
        <Spacer size="sm" />
        <EmailHeading as="h1">Thank You, {customerName}!</EmailHeading>
        <EmailParagraph>
          We truly appreciate you taking the time to record a video testimonial
          about your experience with <strong>{loanOfficerName}</strong> at{" "}
          {organizationName}.
        </EmailParagraph>
      </SingleColumnLayout>

      {/* Confirmation Card */}
      <SingleColumnLayout>
        <EmailCard accentColor="success">
          <Section style={{ textAlign: "center" }}>
            {/* Success checkmark */}
            <Section
              style={{
                width: "64px",
                height: "64px",
                backgroundColor: "#dcfce7",
                borderRadius: "50%",
                margin: "0 auto",
                display: "table",
              }}
            >
              <Text
                style={{
                  display: "table-cell",
                  verticalAlign: "middle",
                  textAlign: "center",
                  fontSize: "32px",
                  lineHeight: "1",
                }}
              >
                ✓
              </Text>
            </Section>

            <Spacer size="md" />

            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: "#166534",
              }}
            >
              Video Submitted Successfully
            </Text>
            <Text
              style={{
                margin: `${spacing[2]} 0 0 0`,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: colors.text.muted,
              }}
            >
              Received on {submittedAt}
            </Text>
          </Section>
        </EmailCard>
      </SingleColumnLayout>

      <Spacer size="md" />

      {/* What Happens Next */}
      <SingleColumnLayout>
        <InfoCard type="info" title="What happens next?">
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            {nextStepsMessage || (
              <>
                Your video testimonial will be reviewed by the {organizationName}{" "}
                team. Once approved, it may be featured on their website and
                social media to help other customers learn about their services.
                <br />
                <br />
                If you have any questions, please reach out to{" "}
                {loanOfficerName} directly.
              </>
            )}
          </Text>
        </InfoCard>
      </SingleColumnLayout>

      <Spacer size="md" />

      {/* Personal Thank You Note */}
      <SingleColumnLayout>
        <EmailCard showAccentBar={false}>
          <Section style={{ textAlign: "center" }}>
            {loanOfficerPhotoUrl && (
              <Img
                src={loanOfficerPhotoUrl}
                alt={loanOfficerName}
                width={80}
                height={80}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  margin: "0 auto",
                  display: "block",
                  border: `3px solid ${colors.repwell.sage[200]}`,
                }}
              />
            )}
            <Spacer size="sm" />
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.base,
                fontStyle: "italic",
                color: colors.text.secondary,
                lineHeight: typography.lineHeight.relaxed,
              }}
            >
              &ldquo;Thank you so much for taking the time to share your
              experience. Your kind words mean the world to me and will help
              others feel confident in their decision.&rdquo;
            </Text>
            <Text
              style={{
                margin: `${spacing[3]} 0 0 0`,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
              }}
            >
              — {loanOfficerName}
            </Text>
          </Section>
        </EmailCard>
      </SingleColumnLayout>

      <Spacer size="lg" />

      <PoweredByFooter
        unsubscribeUrl={unsubscribeUrl}
        organizationName={organizationName}
      />
    </EmailLayout>
  );
}

export default VideoCustomerThankYouEmail;
