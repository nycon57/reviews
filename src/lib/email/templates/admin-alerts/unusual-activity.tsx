/**
 * Unusual Activity Alert Email (S089)
 *
 * Sent to managers/admins when suspicious activity is detected.
 */

import * as React from "react";
import { Section, Text } from "@react-email/components";
import {
  EmailCard,
  EmailButtonGroup,
  Spacer,
  Badge,
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
import type { AdminAlertUnusualActivityEmailData } from "../../types";

interface Props {
  data: AdminAlertUnusualActivityEmailData;
}

const activityTypeLabels: Record<string, { label: string; icon: string }> = {
  login_anomaly: { label: "Unusual Login", icon: "🔐" },
  bulk_action: { label: "Bulk Action", icon: "📦" },
  data_export: { label: "Data Export", icon: "📤" },
  permission_change: { label: "Permission Change", icon: "🔑" },
  api_abuse: { label: "API Abuse", icon: "⚡" },
  unknown: { label: "Unusual Activity", icon: "⚠️" },
};

export function AdminAlertUnusualActivityEmail({ data }: Props) {
  const {
    recipientName,
    organizationName,
    activityType,
    description,
    userInvolved,
    userEmail,
    ipAddress,
    location,
    detectedAt,
    riskLevel,
    actionUrl,
    securitySettingsUrl,
    toEmail,
    unsubscribeUrl,
  } = data;

  const activityInfo = activityTypeLabels[activityType] || activityTypeLabels.unknown;
  const severity = riskLevel === "critical" ? "critical" : riskLevel === "high" ? "high" : "medium";

  const riskColors: Record<string, string> = {
    low: colors.text.muted,
    medium: "#F59E0B",
    high: "#EA580C",
    critical: "#DC2626",
  };

  return (
    <AlertLayout
      preview={`Security Alert: ${activityInfo.label} detected in ${organizationName}`}
      severity={severity}
      alertType="unusual_activity"
      toEmail={toEmail}
      unsubscribeUrl={unsubscribeUrl}
    >
      <AlertTitle>
        {activityInfo.icon} Security Alert
      </AlertTitle>
      <AlertDescription>
        Hi {recipientName}, we detected unusual activity in your {organizationName} account
        that may require your attention.
      </AlertDescription>

      {/* Activity Details Card */}
      <EmailCard>
        <Section style={{ padding: spacing[4] }}>
          {/* Activity Type Header */}
          <table style={{ width: "100%", marginBottom: spacing[4] }}>
            <tr>
              <td>
                <Text
                  style={{
                    margin: 0,
                    fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text.primary,
                  }}
                >
                  {activityInfo.label}
                </Text>
              </td>
              <td style={{ textAlign: "right" }}>
                <Badge
                  variant={riskLevel === "critical" || riskLevel === "high" ? "brand" : "default"}
                >
                  {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
                </Badge>
              </td>
            </tr>
          </table>

          {/* Description */}
          <Section
            style={{
              background: colors.background.muted,
              padding: spacing[3],
              borderRadius: layout.borderRadius.md,
              marginBottom: spacing[4],
            }}
          >
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
              }}
            >
              {description}
            </Text>
          </Section>

          {/* Details */}
          <AlertDetailsTable>
            {userInvolved && <AlertDetailRow label="User" value={userInvolved} />}
            {userEmail && <AlertDetailRow label="Email" value={userEmail} />}
            {ipAddress && <AlertDetailRow label="IP Address" value={ipAddress} />}
            {location && <AlertDetailRow label="Location" value={location} />}
            <AlertDetailRow label="Detected" value={detectedAt} />
          </AlertDetailsTable>

          {/* Risk Level Indicator */}
          <Section
            style={{
              marginTop: spacing[4],
              padding: spacing[3],
              background: `${riskColors[riskLevel]}10`,
              borderLeft: `4px solid ${riskColors[riskLevel]}`,
              borderRadius: layout.borderRadius.md,
            }}
          >
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: riskColors[riskLevel],
                fontWeight: typography.fontWeight.medium,
              }}
            >
              {riskLevel === "critical" &&
                "Immediate action recommended. This activity poses a significant security risk."}
              {riskLevel === "high" &&
                "Please review this activity soon. It may indicate unauthorized access."}
              {riskLevel === "medium" &&
                "This activity is unusual but may be legitimate. Please verify."}
              {riskLevel === "low" &&
                "This is likely normal activity but we wanted to keep you informed."}
            </Text>
          </Section>
        </Section>
      </EmailCard>

      <Spacer size="md" />

      {/* CTAs */}
      <EmailButtonGroup
        buttons={[
          { href: actionUrl, label: "Review Activity", variant: "primary" },
          { href: securitySettingsUrl, label: "Security Settings", variant: "secondary" },
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
        If you recognize this activity, no action is needed. Otherwise, please review immediately.
      </Text>
    </AlertLayout>
  );
}

export default AdminAlertUnusualActivityEmail;
