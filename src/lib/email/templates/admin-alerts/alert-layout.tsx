/**
 * Alert Layout Component (S089)
 *
 * Shared layout for all admin alert emails with severity-based styling.
 */

import * as React from "react";
import { Section, Text } from "@react-email/components";
import {
  EmailLayout,
  SingleColumnLayout,
  RepwellHeader,
  RepwellFooter,
  Spacer,
  colors,
  typography,
  spacing,
} from "../../components";
import type { AdminAlertSeverity, AdminAlertType } from "../../types";

interface AlertLayoutProps {
  preview: string;
  severity: AdminAlertSeverity;
  alertType: AdminAlertType;
  children: React.ReactNode;
  toEmail: string;
  unsubscribeUrl?: string;
}

const severityColors: Record<AdminAlertSeverity, { bg: string; text: string; border: string }> = {
  critical: { bg: "#FEE2E2", text: "#991B1B", border: "#DC2626" },
  high: { bg: "#FEF3C7", text: "#92400E", border: "#F59E0B" },
  medium: { bg: "#DBEAFE", text: "#1E40AF", border: "#3B82F6" },
  low: { bg: "#F3F4F6", text: "#374151", border: "#9CA3AF" },
};

const alertTypeLabels: Record<AdminAlertType, string> = {
  negative_review: "Negative Review Alert",
  team_struggling: "Team Performance Alert",
  compliance_violation: "Compliance Alert",
  usage_limit: "Usage Limit Alert",
  team_member_joined: "Team Update",
  team_member_left: "Team Update",
  unusual_activity: "Activity Alert",
  integration_disconnected: "Integration Alert",
};

const severityLabels: Record<AdminAlertSeverity, string> = {
  critical: "CRITICAL",
  high: "HIGH PRIORITY",
  medium: "ATTENTION NEEDED",
  low: "FYI",
};

export function AlertLayout({
  preview,
  severity,
  alertType,
  children,
  toEmail,
  unsubscribeUrl: _unsubscribeUrl,
}: AlertLayoutProps) {
  const severityStyle = severityColors[severity];

  return (
    <EmailLayout preview={preview}>
      <RepwellHeader />

      {/* Alert Banner */}
      <Section
        style={{
          background: severityStyle.bg,
          borderLeft: `4px solid ${severityStyle.border}`,
          padding: `${spacing[3]} ${spacing[6]}`,
        }}
      >
        <Text
          style={{
            margin: 0,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.bold,
            color: severityStyle.text,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {severityLabels[severity]} - {alertTypeLabels[alertType]}
        </Text>
      </Section>

      <SingleColumnLayout>
        <Spacer size="md" />
        {children}
        <Spacer size="lg" />
      </SingleColumnLayout>

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}

export function AlertTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        margin: `0 0 ${spacing[2]} 0`,
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize["2xl"],
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        lineHeight: 1.3,
      }}
    >
      {children}
    </Text>
  );
}

export function AlertDescription({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        margin: `0 0 ${spacing[4]} 0`,
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.base,
        color: colors.text.secondary,
        lineHeight: 1.6,
      }}
    >
      {children}
    </Text>
  );
}

interface AlertDetailRowProps {
  label: string;
  value: string | React.ReactNode;
  highlight?: boolean;
}

export function AlertDetailRow({ label, value, highlight }: AlertDetailRowProps) {
  return (
    <tr>
      <td
        style={{
          padding: `${spacing[2]} ${spacing[3]} ${spacing[2]} 0`,
          fontFamily: typography.fontFamily.body,
          fontSize: typography.fontSize.sm,
          color: colors.text.muted,
          verticalAlign: "top",
          width: "120px",
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: spacing[2],
          fontFamily: typography.fontFamily.body,
          fontSize: typography.fontSize.sm,
          fontWeight: highlight ? typography.fontWeight.semibold : typography.fontWeight.normal,
          color: highlight ? colors.text.primary : colors.text.secondary,
          verticalAlign: "top",
        }}
      >
        {value}
      </td>
    </tr>
  );
}

export function AlertDetailsTable({ children }: { children: React.ReactNode }) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        marginBottom: spacing[4],
      }}
    >
      <tbody>{children}</tbody>
    </table>
  );
}

interface RatingDisplayProps {
  rating: number;
  size?: "sm" | "md" | "lg";
}

export function RatingDisplay({ rating, size = "md" }: RatingDisplayProps) {
  const sizes = {
    sm: { fontSize: "14px", starSize: "14px" },
    md: { fontSize: "18px", starSize: "18px" },
    lg: { fontSize: "24px", starSize: "24px" },
  };
  const { fontSize, starSize } = sizes[size];
  const fullStars = Math.floor(rating);
  const emptyStars = 5 - fullStars;

  return (
    <span style={{ fontSize, lineHeight: 1 }}>
      <span style={{ color: "#F59E0B", fontSize: starSize }}>
        {"★".repeat(fullStars)}
      </span>
      <span style={{ color: "#D1D5DB", fontSize: starSize }}>
        {"★".repeat(emptyStars)}
      </span>
      <span
        style={{
          marginLeft: spacing[2],
          fontFamily: typography.fontFamily.body,
          fontWeight: typography.fontWeight.semibold,
          color: rating <= 2 ? "#DC2626" : rating <= 3 ? "#F59E0B" : "#10B981",
        }}
      >
        {rating.toFixed(1)}
      </span>
    </span>
  );
}
