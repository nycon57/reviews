/**
 * Review Video Upsell Email Template
 *
 * Sent after a direct text review is verified and published. Invites the
 * customer to record a quick video version of their review.
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
  Spacer,
  colors,
  typography,
} from "../components";
import type { ReviewVideoUpsellEmailData } from "../types";

interface ReviewVideoUpsellEmailProps {
  data: ReviewVideoUpsellEmailData;
}

export function ReviewVideoUpsellEmail({ data }: ReviewVideoUpsellEmailProps) {
  const { customerName, professionalName, requestUrl, toEmail } = data;

  return (
    <EmailLayout preview={`${professionalName} would love a quick video version of your review`}>
      <RepwellHeader />

      <SingleColumnLayout>
        <EmailParagraph>Hi {customerName || "there"},</EmailParagraph>

        <EmailParagraph>
          Your review is making an impact. It is live, and it is already
          helping others decide who to work with. Thank you for taking the
          time.
        </EmailParagraph>

        <EmailParagraph>
          One small idea: {professionalName} would love a quick video version.
          A short clip in your own words carries even more weight than text,
          and it takes about a minute to record right from your phone.
        </EmailParagraph>

        <Spacer size="lg" />

        <Section style={{ textAlign: "center" }}>
          <PrimaryButton href={requestUrl}>Record a quick video</PrimaryButton>
        </Section>

        <Spacer size="lg" />

        <Text
          style={{
            margin: 0,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.sm,
            color: colors.text.muted,
            textAlign: "center",
          }}
        >
          No pressure at all. If video is not your thing, your written review
          already means a lot.
        </Text>
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}
