/**
 * Usage Limit Alert Email (S089)
 *
 * Sent to admins when approaching plan usage limits.
 */

import * as React from "react";
import { Section, Text } from "@react-email/components";
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
} from "./alert-layout";
import type { AdminAlertUsageLimitEmailData } from "../../types";

interface Props {
  data: AdminAlertUsageLimitEmailData;
}

const limitTypeLabels: Record<string, { label: string; unit: string; icon: string }> = {
  users: { label: "Team Members", unit: "users", icon: "👥" },
  loan_officers: { label: "Loan Officers", unit: "loan officers", icon: "👤" },
  surveys_monthly: { label: "Monthly Surveys", unit: "surveys", icon: "📊" },
  api_calls_daily: { label: "Daily API Calls", unit: "calls", icon: "🔌" },
  storage: { label: "Storage", unit: "GB", icon: "💾" },
};

export function AdminAlertUsageLimitEmail({ data }: Props) {
  const {
    recipientName,
    organizationName,
    limitType,
    currentUsage,
    maxLimit,
    percentUsed,
    periodEnd,
    actionUrl: _actionUrl,
    upgradeUrl,
    usageDetailsUrl,
    toEmail,
    unsubscribeUrl,
  } = data;
  void _actionUrl; // Reserved for future use

  const limitInfo = limitTypeLabels[limitType] || { label: limitType, unit: "items", icon: "📈" };
  const remaining = maxLimit - currentUsage;
  const isOverLimit = percentUsed >= 100;
  const isCritical = percentUsed >= 90;

  return (
    <AlertLayout
      preview={`${organizationName} is at ${percentUsed}% of ${limitInfo.label.toLowerCase()} limit`}
      severity={isOverLimit ? "critical" : isCritical ? "high" : "medium"}
      alertType="usage_limit"
      toEmail={toEmail}
      unsubscribeUrl={unsubscribeUrl}
    >
      <AlertTitle>
        {isOverLimit ? "Usage Limit Exceeded" : "Approaching Usage Limit"}
      </AlertTitle>
      <AlertDescription>
        Hi {recipientName}, {organizationName} has {isOverLimit ? "exceeded" : "nearly reached"} its
        {" "}{limitInfo.label.toLowerCase()} limit. {isOverLimit
          ? "Some features may be restricted until the limit is increased."
          : "Consider upgrading to avoid service interruptions."}
      </AlertDescription>

      {/* Usage Card */}
      <EmailCard>
        <Section style={{ padding: spacing[4] }}>
          {/* Usage Header */}
          <table style={{ width: "100%", marginBottom: spacing[4] }}>
            <tr>
              <td>
                <Text
                  style={{
                    margin: 0,
                    fontFamily: typography.fontFamily.body,
                    fontSize: "32px",
                  }}
                >
                  {limitInfo.icon}
                </Text>
              </td>
              <td style={{ width: "100%", paddingLeft: spacing[3] }}>
                <Text
                  style={{
                    margin: 0,
                    fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text.primary,
                  }}
                >
                  {limitInfo.label}
                </Text>
                <Text
                  style={{
                    margin: `${spacing[1]} 0 0 0`,
                    fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize.sm,
                    color: colors.text.muted,
                  }}
                >
                  {currentUsage.toLocaleString()} of {maxLimit.toLocaleString()} {limitInfo.unit}
                </Text>
              </td>
              <td style={{ textAlign: "right" }}>
                <Text
                  style={{
                    margin: 0,
                    fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize["2xl"],
                    fontWeight: typography.fontWeight.bold,
                    color: isOverLimit ? "#DC2626" : isCritical ? "#F59E0B" : colors.primary,
                  }}
                >
                  {percentUsed}%
                </Text>
              </td>
            </tr>
          </table>

          {/* Progress Bar */}
          <ProgressBar
            value={Math.min(percentUsed, 100)}
            color={isOverLimit ? "#DC2626" : isCritical ? "#F59E0B" : colors.primary}
            showValue={false}
          />

          {/* Details */}
          <Section style={{ marginTop: spacing[4] }}>
            <AlertDetailsTable>
              <AlertDetailRow
                label="Remaining"
                value={
                  <span
                    style={{
                      color: remaining <= 0 ? "#DC2626" : remaining < maxLimit * 0.1 ? "#F59E0B" : colors.text.secondary,
                      fontWeight: 600,
                    }}
                  >
                    {remaining > 0 ? `${remaining.toLocaleString()} ${limitInfo.unit}` : "Limit reached"}
                  </span>
                }
              />
              {periodEnd && (
                <AlertDetailRow label="Period Ends" value={periodEnd} />
              )}
            </AlertDetailsTable>
          </Section>

          {/* Warning Message */}
          {isOverLimit && (
            <Section
              style={{
                background: "#FEE2E2",
                padding: spacing[3],
                borderRadius: layout.borderRadius.md,
                marginTop: spacing[4],
              }}
            >
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  color: "#991B1B",
                }}
              >
                ⚠️ Your organization has exceeded its plan limit. New {limitInfo.unit.toLowerCase()} cannot
                be added until you upgrade or usage decreases.
              </Text>
            </Section>
          )}
        </Section>
      </EmailCard>

      <Spacer size="md" />

      {/* CTAs */}
      <EmailButtonGroup
        buttons={[
          { href: upgradeUrl, label: "Upgrade Plan", variant: "primary" },
          { href: usageDetailsUrl, label: "View Usage Details", variant: "secondary" },
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
        Need help? Contact our team at support@repwell.ai
      </Text>
    </AlertLayout>
  );
}

export default AdminAlertUsageLimitEmail;
