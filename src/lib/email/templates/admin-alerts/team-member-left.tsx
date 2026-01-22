/**
 * Team Member Left Alert Email (S089)
 *
 * Sent to managers/admins when a team member leaves.
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
import type { AdminAlertTeamMemberLeftEmailData } from "../../types";

interface Props {
  data: AdminAlertTeamMemberLeftEmailData;
}

const roleLabels: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  loan_officer: "Loan Officer",
};

const reasonLabels: Record<string, { label: string; color: string }> = {
  resigned: { label: "Resigned", color: colors.text.muted },
  terminated: { label: "Terminated", color: "#DC2626" },
  account_deleted: { label: "Account Deleted", color: "#F59E0B" },
  unknown: { label: "Departed", color: colors.text.muted },
};

export function AdminAlertTeamMemberLeftEmail({ data }: Props) {
  const {
    recipientName,
    organizationName,
    departedMemberName,
    departedMemberEmail,
    departedMemberRole,
    leftAt,
    reason,
    pendingItemsCount,
    actionUrl,
    reassignUrl,
    toEmail,
    unsubscribeUrl,
  } = data;

  const reasonInfo = reasonLabels[reason || "unknown"] || reasonLabels.unknown;
  const hasPendingItems = pendingItemsCount && pendingItemsCount > 0;

  return (
    <AlertLayout
      preview={`${departedMemberName} has left ${organizationName}`}
      severity={hasPendingItems ? "medium" : "low"}
      alertType="team_member_left"
      toEmail={toEmail}
      unsubscribeUrl={unsubscribeUrl}
    >
      <AlertTitle>
        Team Member Departed
      </AlertTitle>
      <AlertDescription>
        Hi {recipientName}, {departedMemberName} is no longer part of {organizationName}.
        {hasPendingItems && " There are pending items that may need to be reassigned."}
      </AlertDescription>

      {/* Departed Member Card */}
      <EmailCard>
        <Section style={{ padding: spacing[4] }}>
          {/* Initial and Name */}
          <table style={{ width: "100%", marginBottom: spacing[4] }}>
            <tr>
              <td style={{ width: "48px", verticalAlign: "top" }}>
                <Section
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: colors.background.muted,
                    textAlign: "center",
                  }}
                >
                  <Text
                    style={{
                      margin: 0,
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize.lg,
                      color: colors.text.muted,
                      fontWeight: typography.fontWeight.semibold,
                      lineHeight: "40px",
                    }}
                  >
                    {departedMemberName.charAt(0).toUpperCase()}
                  </Text>
                </Section>
              </td>
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
                  {departedMemberName}
                </Text>
                <Text
                  style={{
                    margin: `${spacing[1]} 0 0 0`,
                    fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize.sm,
                    color: colors.text.muted,
                  }}
                >
                  {roleLabels[departedMemberRole] || departedMemberRole}
                </Text>
              </td>
              <td style={{ textAlign: "right", verticalAlign: "top" }}>
                <Badge variant="default">{reasonInfo.label}</Badge>
              </td>
            </tr>
          </table>

          {/* Details */}
          <AlertDetailsTable>
            <AlertDetailRow label="Email" value={departedMemberEmail} />
            <AlertDetailRow label="Left on" value={leftAt} />
          </AlertDetailsTable>

          {/* Pending Items Warning */}
          {hasPendingItems && (
            <Section
              style={{
                background: "#FEF3C7",
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
                  color: "#92400E",
                }}
              >
                ⚠️ This team member has <strong>{pendingItemsCount}</strong> pending item(s) that
                may need to be reassigned or addressed.
              </Text>
            </Section>
          )}
        </Section>
      </EmailCard>

      <Spacer size="md" />

      {/* CTAs */}
      <EmailButtonGroup
        buttons={[
          ...(hasPendingItems && reassignUrl
            ? [{ href: reassignUrl, label: "Reassign Items", variant: "primary" as const }]
            : []),
          { href: actionUrl, label: "View Details", variant: hasPendingItems ? "secondary" : "primary" },
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
        Their reviews and data have been preserved in the system for reporting purposes.
      </Text>
    </AlertLayout>
  );
}

export default AdminAlertTeamMemberLeftEmail;
