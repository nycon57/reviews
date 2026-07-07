/**
 * Review Verification Email Template
 *
 * Sent after an anonymous direct review submission on a professional's public
 * profile page. The reviewer confirms their email to publish the review.
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
  colors,
  typography,
  spacing,
} from "../components";
import type { ReviewVerificationEmailData } from "../types";

interface ReviewVerificationEmailProps {
  data: ReviewVerificationEmailData;
}

const SNIPPET_LENGTH = 140;

function StarRatingInline({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span
        key={i}
        style={{
          color: i <= Math.round(rating) ? "#facc15" : colors.border.default,
          fontSize: "18px",
          marginRight: "2px",
        }}
      >
        &#9733;
      </span>
    );
  }
  return <>{stars}</>;
}

export function ReviewVerificationEmail({ data }: ReviewVerificationEmailProps) {
  const { customerName, professionalName, rating, reviewText, verifyUrl, toEmail } =
    data;

  const snippet =
    reviewText.length > SNIPPET_LENGTH
      ? `${reviewText.slice(0, SNIPPET_LENGTH).trimEnd()}...`
      : reviewText;

  return (
    <EmailLayout preview={`Confirm your review of ${professionalName}`}>
      <RepwellHeader />

      <SingleColumnLayout>
        <EmailParagraph>Hi {customerName || "there"},</EmailParagraph>

        <EmailParagraph>
          Thanks for sharing your experience with {professionalName}. One quick
          step before your review goes live: confirm that this email address is
          yours.
        </EmailParagraph>

        <Spacer size="md" />

        {/* Review snippet */}
        <EmailCard showAccentBar accentColor={colors.repwell.sage[200]}>
          <Section style={{ marginBottom: spacing[2] }}>
            <StarRatingInline rating={rating} />
          </Section>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
              fontStyle: "italic",
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            &ldquo;{snippet}&rdquo;
          </Text>
        </EmailCard>

        <Spacer size="lg" />

        <Section style={{ textAlign: "center" }}>
          <PrimaryButton href={verifyUrl}>Confirm My Review</PrimaryButton>
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
          If you didn&apos;t write this review, ignore this email.
        </Text>
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}
