/**
 * Admin Alert Digest Email (S089)
 *
 * Daily digest summarizing all alerts for managers/admins
 * who prefer batched notifications over immediate delivery.
 */

import * as React from "react";
import { Section, Text, Link } from "@react-email/components";
import {
  EmailLayout,
  SingleColumnLayout,
  RepwellHeader,
  RepwellFooter,
  EmailHeading,
  EmailParagraph,
  EmailCard,
  Spacer,
  Badge,
  EmailButton,
  colors,
  typography,
  spacing,
  layout,
} from "../../components";
import type { AdminAlertDigestEmailData, AdminAlertDigestItem } from "../../types";

interface Props {
  data: AdminAlertDigestEmailData;
}

const alertTypeLabels: Record<string, { label: string; icon: string }> = {
  negative_review: { label: "Negative Review", icon: "⭐" },
  team_struggling: { label: "Team Performance", icon: "📉" },
  compliance_violation: { label: "Compliance", icon: "⚠️" },
  usage_limit: { label: "Usage Limit", icon: "📊" },
  team_member_joined: { label: "New Member", icon: "👋" },
  team_member_left: { label: "Member Left", icon: "👤" },
  unusual_activity: { label: "Security", icon: "🔐" },
  integration_disconnected: { label: "Integration", icon: "🔌" },
};

const severityColors: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: "#FEE2E2", text: "#991B1B", border: "#DC2626" },
  high: { bg: "#FFEDD5", text: "#9A3412", border: "#EA580C" },
  medium: { bg: "#FEF3C7", text: "#92400E", border: "#F59E0B" },
  low: { bg: "#F3F4F6", text: "#374151", border: "#9CA3AF" },
};

function AlertItem({ alert }: { alert: AdminAlertDigestItem }) {
  const typeInfo = alertTypeLabels[alert.alertType] || { label: "Alert", icon: "📋" };
  const severityStyle = severityColors[alert.severity] || severityColors.low;

  return (
    <Section
      style={{
        padding: spacing[3],
        borderLeft: `4px solid ${severityStyle.border}`,
        background: severityStyle.bg,
        borderRadius: layout.borderRadius.md,
        marginBottom: spacing[3],
      }}
    >
      <table style={{ width: "100%" }}>
        <tr>
          <td style={{ verticalAlign: "top" }}>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: severityStyle.text,
              }}
            >
              {typeInfo.icon} {typeInfo.label}
            </Text>
            <Text
              style={{
                margin: `${spacing[1]} 0 0 0`,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: severityStyle.text,
              }}
            >
              {alert.summary}
            </Text>
            <Text
              style={{
                margin: `${spacing[1]} 0 0 0`,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.xs,
                color: colors.text.muted,
              }}
            >
              {alert.timestamp}
            </Text>
          </td>
          <td style={{ textAlign: "right", verticalAlign: "top", width: "80px" }}>
            <Link
              href={alert.actionUrl}
              style={{
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.xs,
                color: colors.primary,
                textDecoration: "none",
              }}
            >
              View →
            </Link>
          </td>
        </tr>
      </table>
    </Section>
  );
}

function AlertGroup({
  severity,
  alerts,
}: {
  severity: string;
  alerts: AdminAlertDigestItem[];
}) {
  if (alerts.length === 0) return null;

  const severityLabels: Record<string, string> = {
    critical: "Critical",
    high: "High Priority",
    medium: "Medium Priority",
    low: "Low Priority",
  };

  return (
    <Section style={{ marginBottom: spacing[4] }}>
      <table style={{ width: "100%", marginBottom: spacing[2] }}>
        <tr>
          <td>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.secondary,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {severityLabels[severity] || severity}
            </Text>
          </td>
          <td style={{ textAlign: "right" }}>
            <Badge variant={severity === "critical" || severity === "high" ? "brand" : "default"}>
              {alerts.length}
            </Badge>
          </td>
        </tr>
      </table>
      {alerts.map((alert, index) => (
        <AlertItem key={index} alert={alert} />
      ))}
    </Section>
  );
}

export function AdminAlertDigestEmail({ data }: Props) {
  const {
    recipientName,
    organizationName,
    digestDate,
    alerts,
    totalAlerts,
    criticalCount,
    highCount,
    dashboardUrl,
    alertSettingsUrl,
    toEmail,
    unsubscribeUrl: _unsubscribeUrl,
  } = data;
  void _unsubscribeUrl;

  // Group alerts by severity
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  const mediumAlerts = alerts.filter((a) => a.severity === "medium");
  const lowAlerts = alerts.filter((a) => a.severity === "low");

  const hasUrgent = criticalCount > 0 || highCount > 0;

  return (
    <EmailLayout preview={`Daily Alert Digest: ${totalAlerts} alert(s) for ${organizationName}`}>
      <RepwellHeader />

      {/* Header Banner */}
      <Section
        style={{
          background: hasUrgent
            ? "linear-gradient(135deg, #DC2626 0%, #EA580C 100%)"
            : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
          padding: `${spacing[4]} ${spacing[6]}`,
          textAlign: "center",
        }}
      >
        <Text
          style={{
            margin: 0,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: "#ffffff",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Daily Alert Digest
        </Text>
      </Section>

      <SingleColumnLayout>
        <Spacer size="md" />

        <EmailHeading as="h1">
          {totalAlerts} Alert{totalAlerts !== 1 ? "s" : ""} Today
        </EmailHeading>

        <Text
          style={{
            margin: `${spacing[2]} 0 0 0`,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.base,
            color: colors.text.secondary,
            textAlign: "center",
          }}
        >
          {digestDate} • {organizationName}
        </Text>

        <Spacer size="md" />

        <EmailParagraph>Hi {recipientName},</EmailParagraph>
        <EmailParagraph>
          Here&apos;s your daily summary of alerts that need your attention.
          {hasUrgent && " You have urgent items that require immediate review."}
        </EmailParagraph>

        <Spacer size="md" />

        {/* Summary Stats */}
        <EmailCard>
          <Section style={{ padding: spacing[4] }}>
            <table style={{ width: "100%", textAlign: "center" }}>
              <tr>
                <td style={{ width: "25%" }}>
                  <Text
                    style={{
                      margin: 0,
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize["2xl"],
                      fontWeight: typography.fontWeight.bold,
                      color: criticalCount > 0 ? "#DC2626" : colors.text.primary,
                    }}
                  >
                    {criticalCount}
                  </Text>
                  <Text
                    style={{
                      margin: `${spacing[1]} 0 0 0`,
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize.xs,
                      color: colors.text.muted,
                    }}
                  >
                    Critical
                  </Text>
                </td>
                <td style={{ width: "25%" }}>
                  <Text
                    style={{
                      margin: 0,
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize["2xl"],
                      fontWeight: typography.fontWeight.bold,
                      color: highCount > 0 ? "#EA580C" : colors.text.primary,
                    }}
                  >
                    {highCount}
                  </Text>
                  <Text
                    style={{
                      margin: `${spacing[1]} 0 0 0`,
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize.xs,
                      color: colors.text.muted,
                    }}
                  >
                    High
                  </Text>
                </td>
                <td style={{ width: "25%" }}>
                  <Text
                    style={{
                      margin: 0,
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize["2xl"],
                      fontWeight: typography.fontWeight.bold,
                      color: colors.text.primary,
                    }}
                  >
                    {mediumAlerts.length}
                  </Text>
                  <Text
                    style={{
                      margin: `${spacing[1]} 0 0 0`,
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize.xs,
                      color: colors.text.muted,
                    }}
                  >
                    Medium
                  </Text>
                </td>
                <td style={{ width: "25%" }}>
                  <Text
                    style={{
                      margin: 0,
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize["2xl"],
                      fontWeight: typography.fontWeight.bold,
                      color: colors.text.primary,
                    }}
                  >
                    {lowAlerts.length}
                  </Text>
                  <Text
                    style={{
                      margin: `${spacing[1]} 0 0 0`,
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize.xs,
                      color: colors.text.muted,
                    }}
                  >
                    Low
                  </Text>
                </td>
              </tr>
            </table>
          </Section>
        </EmailCard>

        <Spacer size="md" />

        {/* Alerts by Severity */}
        <AlertGroup severity="critical" alerts={criticalAlerts} />
        <AlertGroup severity="high" alerts={highAlerts} />
        <AlertGroup severity="medium" alerts={mediumAlerts} />
        <AlertGroup severity="low" alerts={lowAlerts} />

        <Spacer size="md" />

        {/* CTAs */}
        <Section style={{ textAlign: "center" }}>
          <EmailButton href={dashboardUrl} variant="primary">
            View Dashboard
          </EmailButton>
          <Spacer size="sm" />
          <Link
            href={alertSettingsUrl}
            style={{
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              color: colors.text.muted,
              textDecoration: "underline",
            }}
          >
            Manage alert preferences
          </Link>
        </Section>

        <Spacer size="lg" />
      </SingleColumnLayout>

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}

export default AdminAlertDigestEmail;
