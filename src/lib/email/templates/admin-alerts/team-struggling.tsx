/**
 * Team Member Struggling Alert Email (S089)
 *
 * Sent to managers when a team member's performance drops below threshold.
 */

import * as React from "react";
import { Section, Text, Img } from "@react-email/components";
import {
  EmailCard,
  EmailButtonGroup,
  Spacer,
  ProgressBar,
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
import type { AdminAlertTeamStrugglingEmailData } from "../../types";

interface Props {
  data: AdminAlertTeamStrugglingEmailData;
}

const trendLabels: Record<string, { text: string; color: string }> = {
  declining: { text: "Declining", color: "#DC2626" },
  stagnant: { text: "Stagnant", color: "#F59E0B" },
  volatile: { text: "Inconsistent", color: "#6366F1" },
};

export function AdminAlertTeamStrugglingEmail({ data }: Props) {
  const {
    recipientName,
    organizationName,
    loanOfficerName,
    loanOfficerPhotoUrl,
    currentRating,
    threshold,
    reviewCount,
    trend,
    recentReviews,
    actionUrl,
    coachingUrl,
    toEmail,
    unsubscribeUrl,
  } = data;

  const trendInfo = trendLabels[trend] || trendLabels.declining;
  const ratingPercent = Math.min((currentRating / 5) * 100, 100);
  // Threshold percent for potential future use in threshold line visualization
  const _thresholdPercent = (threshold / 5) * 100;
  void _thresholdPercent;

  return (
    <AlertLayout
      preview={`${loanOfficerName} needs coaching support`}
      severity={currentRating < threshold - 0.5 ? "high" : "medium"}
      alertType="team_struggling"
      toEmail={toEmail}
      unsubscribeUrl={unsubscribeUrl}
    >
      <AlertTitle>
        Team Member Needs Support
      </AlertTitle>
      <AlertDescription>
        Hi {recipientName}, {loanOfficerName}'s performance at {organizationName} has dropped
        below your alert threshold. Early intervention can help turn things around.
      </AlertDescription>

      {/* Performance Card */}
      <EmailCard>
        <Section style={{ padding: spacing[4] }}>
          {/* Team Member Info */}
          <table style={{ width: "100%", marginBottom: spacing[4] }}>
            <tr>
              {loanOfficerPhotoUrl && (
                <td style={{ width: "56px", verticalAlign: "top" }}>
                  <Img
                    src={loanOfficerPhotoUrl}
                    alt={loanOfficerName}
                    width={48}
                    height={48}
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
                    fontSize: typography.fontSize.lg,
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
                  {reviewCount} reviews analyzed
                </Text>
              </td>
            </tr>
          </table>

          {/* Rating vs Threshold */}
          <Text
            style={{
              margin: `0 0 ${spacing[2]} 0`,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            Current Rating vs. Threshold
          </Text>

          <Section
            style={{
              background: colors.background.muted,
              padding: spacing[3],
              borderRadius: layout.borderRadius.md,
              marginBottom: spacing[4],
            }}
          >
            <table style={{ width: "100%" }}>
              <tr>
                <td>
                  <RatingDisplay rating={currentRating} size="md" />
                </td>
                <td style={{ textAlign: "right" }}>
                  <Text
                    style={{
                      margin: 0,
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize.sm,
                      color: colors.text.muted,
                    }}
                  >
                    Threshold: {threshold.toFixed(1)} ★
                  </Text>
                </td>
              </tr>
            </table>
            <Section style={{ marginTop: spacing[3] }}>
              <ProgressBar
                value={ratingPercent}
                color={currentRating < threshold ? "#DC2626" : "#F59E0B"}
                showValue={false}
              />
            </Section>
          </Section>

          {/* Performance Details */}
          <AlertDetailsTable>
            <AlertDetailRow
              label="Trend"
              value={
                <span style={{ color: trendInfo.color, fontWeight: 600 }}>
                  {trendInfo.text}
                </span>
              }
            />
            <AlertDetailRow
              label="Gap"
              value={`${(threshold - currentRating).toFixed(1)} points below threshold`}
            />
          </AlertDetailsTable>

          {/* Recent Reviews */}
          {recentReviews && recentReviews.length > 0 && (
            <>
              <Text
                style={{
                  margin: `${spacing[4]} 0 ${spacing[2]} 0`,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.primary,
                }}
              >
                Recent Reviews:
              </Text>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                {recentReviews.slice(0, 5).map((review, index) => (
                  <tr key={index}>
                    <td
                      style={{
                        padding: `${spacing[2]} 0`,
                        borderBottom: index < recentReviews.length - 1 ? `1px solid ${colors.border.subtle}` : "none",
                      }}
                    >
                      <RatingDisplay rating={review.rating} size="sm" />
                    </td>
                    <td
                      style={{
                        padding: `${spacing[2]} 0`,
                        borderBottom: index < recentReviews.length - 1 ? `1px solid ${colors.border.subtle}` : "none",
                        fontFamily: typography.fontFamily.body,
                        fontSize: typography.fontSize.sm,
                        color: colors.text.muted,
                        textAlign: "right",
                      }}
                    >
                      {review.date}
                      {review.customerName && ` - ${review.customerName}`}
                    </td>
                  </tr>
                ))}
              </table>
            </>
          )}
        </Section>
      </EmailCard>

      <Spacer size="md" />

      {/* CTAs */}
      <EmailButtonGroup
        buttons={[
          { href: coachingUrl, label: "Start Coaching Session", variant: "primary" },
          { href: actionUrl, label: "View Full Profile", variant: "secondary" },
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
        Early coaching support can improve ratings by an average of 0.5 stars within 30 days.
      </Text>
    </AlertLayout>
  );
}

export default AdminAlertTeamStrugglingEmail;
