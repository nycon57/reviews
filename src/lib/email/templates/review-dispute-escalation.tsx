/**
 * Review Dispute Escalation Email Template
 *
 * Sent to the RepWell moderation team when a review on an individual account
 * is disputed. Individual accounts cannot adjudicate their own disputes, so
 * the platform team reviews them.
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
import type { ReviewDisputeEscalationEmailData } from "../types";

interface ReviewDisputeEscalationEmailProps {
  data: ReviewDisputeEscalationEmailData;
}

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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Text
      style={{
        margin: `0 0 ${spacing[1]}`,
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
      }}
    >
      <span style={{ fontWeight: 600, color: colors.text.primary }}>
        {label}:
      </span>{" "}
      {value}
    </Text>
  );
}

export function ReviewDisputeEscalationEmail({
  data,
}: ReviewDisputeEscalationEmailProps) {
  const {
    organizationName,
    reporterName,
    reporterEmail,
    reasonLabel,
    details,
    rating,
    customerName,
    reviewExcerpt,
    reviewUrl,
    toEmail,
  } = data;

  const reporter =
    [reporterName, reporterEmail].filter(Boolean).join(" / ") || "Anonymous";

  return (
    <EmailLayout preview={`Review dispute escalated by ${organizationName}`}>
      <RepwellHeader />

      <SingleColumnLayout>
        <EmailParagraph>
          A review dispute from an individual account needs the RepWell team to
          adjudicate it.
        </EmailParagraph>

        <Spacer size="md" />

        <EmailCard showAccentBar accentColor={colors.repwell.sage[200]}>
          <DetailRow label="Account" value={organizationName} />
          <DetailRow label="Reported by" value={reporter} />
          <DetailRow label="Grounds" value={reasonLabel} />
          {details && <DetailRow label="Details" value={details} />}
        </EmailCard>

        <Spacer size="md" />

        {/* Disputed review excerpt */}
        <EmailCard>
          <Section style={{ marginBottom: spacing[2] }}>
            <StarRatingInline rating={rating} />
          </Section>
          {customerName && (
            <DetailRow label="Reviewer" value={customerName} />
          )}
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
            &ldquo;{reviewExcerpt}&rdquo;
          </Text>
        </EmailCard>

        <Spacer size="lg" />

        <Section style={{ textAlign: "center" }}>
          <PrimaryButton href={reviewUrl}>View Review</PrimaryButton>
        </Section>
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}
