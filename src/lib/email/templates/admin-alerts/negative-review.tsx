/**
 * Negative Review Alert Email (S089)
 *
 * Sent to managers when a team member receives a low-rating review.
 */

import * as React from "react";
import { Section, Text, Img } from "@react-email/components";
import {
  EmailCard,
  EmailButtonGroup,
  Spacer,
  colors,
  typography,
  spacing,
  layout,
} from "../../components";
import {
  AlertLayout,
  AlertTitle,
  AlertDescription,
  AlertDetailsTable,
  AlertDetailRow,
  RatingDisplay,
} from "./alert-layout";
import type { AdminAlertNegativeReviewEmailData } from "../../types";

interface Props {
  data: AdminAlertNegativeReviewEmailData;
}

export function AdminAlertNegativeReviewEmail({ data }: Props) {
  const {
    recipientName,
    organizationName,
    loanOfficerName,
    loanOfficerPhotoUrl,
    customerName,
    rating,
    reviewText,
    reviewDate,
    reviewSource,
    suggestedResponse,
    actionUrl,
    toEmail,
    unsubscribeUrl,
  } = data;

  return (
    <AlertLayout
      preview={`${loanOfficerName} received a ${rating}-star review`}
      severity={rating === 1 ? "critical" : "high"}
      alertType="negative_review"
      toEmail={toEmail}
      unsubscribeUrl={unsubscribeUrl}
    >
      <AlertTitle>
        Negative Review Received
      </AlertTitle>
      <AlertDescription>
        Hi {recipientName}, a team member at {organizationName} just received a low-rating
        review that may need your attention.
      </AlertDescription>

      {/* Review Card */}
      <EmailCard>
        <Section style={{ padding: spacing[4] }}>
          {/* Loan Officer Info */}
          <table style={{ width: "100%", marginBottom: spacing[4] }}>
            <tr>
              {loanOfficerPhotoUrl && (
                <td style={{ width: "48px", verticalAlign: "top" }}>
                  <Img
                    src={loanOfficerPhotoUrl}
                    alt={loanOfficerName}
                    width={40}
                    height={40}
                    style={{
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                </td>
              )}
              <td style={{ verticalAlign: "top" }}>
                <Text
                  style={{
                    margin: 0,
                    fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text.primary,
                  }}
                >
                  {loanOfficerName}
                </Text>
                <Text
                  style={{
                    margin: `${spacing[1]} 0 0 0`,
                    fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize.sm,
                    color: colors.text.muted,
                  }}
                >
                  Received review on {reviewDate}
                </Text>
              </td>
              <td style={{ textAlign: "right", verticalAlign: "top" }}>
                <RatingDisplay rating={rating} size="lg" />
              </td>
            </tr>
          </table>

          {/* Customer & Source */}
          <AlertDetailsTable>
            <AlertDetailRow label="Customer" value={customerName} />
            {reviewSource && (
              <AlertDetailRow label="Source" value={reviewSource} />
            )}
          </AlertDetailsTable>

          {/* Review Text */}
          {reviewText && (
            <>
              <Text
                style={{
                  margin: `0 0 ${spacing[2]} 0`,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.primary,
                }}
              >
                Review Content:
              </Text>
              <Section
                style={{
                  background: colors.background.muted,
                  padding: spacing[4],
                  borderRadius: layout.borderRadius.md,
                  borderLeft: `3px solid ${colors.border.default}`,
                }}
              >
                <Text
                  style={{
                    margin: 0,
                    fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary,
                    fontStyle: "italic",
                    lineHeight: 1.6,
                  }}
                >
                  "{reviewText}"
                </Text>
              </Section>
            </>
          )}
        </Section>
      </EmailCard>

      {/* Suggested Response */}
      {suggestedResponse && (
        <>
          <Spacer size="md" />
          <Text
            style={{
              margin: `0 0 ${spacing[2]} 0`,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            AI-Suggested Response:
          </Text>
          <EmailCard>
            <Section style={{ padding: spacing[4] }}>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  lineHeight: 1.6,
                }}
              >
                {suggestedResponse}
              </Text>
            </Section>
          </EmailCard>
        </>
      )}

      <Spacer size="md" />

      {/* CTA */}
      <EmailButtonGroup
        buttons={[
          { href: actionUrl, label: "View Review Details", variant: "primary" },
          { href: `${actionUrl}#respond`, label: "Respond Now", variant: "secondary" },
        ]}
      />

      <Spacer size="sm" />

      <Text
        style={{
          margin: 0,
          fontFamily: typography.fontFamily.body,
          fontSize: typography.fontSize.xs,
          color: colors.text.muted,
          textAlign: "center",
        }}
      >
        Quick action can help turn this situation around and show the customer you care.
      </Text>
    </AlertLayout>
  );
}

export default AdminAlertNegativeReviewEmail;
