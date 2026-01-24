/**
 * Team Member Joined Alert Email (S089)
 *
 * Sent to managers/admins when a new team member joins.
 */

import * as React from "react";
import { Section, Text, Img } from "@react-email/components";
import {
  EmailCard,
  EmailButtonGroup,
  Spacer,
  Badge,
  colors,
  typography,
  spacing,
} from "../../components";
import {
  AlertLayout,
  AlertTitle,
  AlertDescription,
  AlertDetailsTable,
  AlertDetailRow,
} from "./alert-layout";
import type { AdminAlertTeamMemberJoinedEmailData } from "../../types";

interface Props {
  data: AdminAlertTeamMemberJoinedEmailData;
}

const roleLabels: Record<string, { label: string; variant: "default" | "info" | "brand" }> = {
  admin: { label: "Admin", variant: "brand" },
  manager: { label: "Manager", variant: "info" },
  user: { label: "User", variant: "default" },
};

export function AdminAlertTeamMemberJoinedEmail({ data }: Props) {
  const {
    recipientName,
    organizationName,
    newMemberName,
    newMemberEmail,
    newMemberRole,
    newMemberPhotoUrl,
    invitedBy,
    joinedAt,
    actionUrl,
    teamDirectoryUrl,
    toEmail,
    unsubscribeUrl,
  } = data;

  const roleInfo = roleLabels[newMemberRole] || roleLabels.user;

  return (
    <AlertLayout
      preview={`${newMemberName} joined ${organizationName}`}
      severity="low"
      alertType="team_member_joined"
      toEmail={toEmail}
      unsubscribeUrl={unsubscribeUrl}
    >
      <AlertTitle>
        New Team Member 🎉
      </AlertTitle>
      <AlertDescription>
        Hi {recipientName}, {newMemberName} has joined {organizationName}. Welcome them to the team!
      </AlertDescription>

      {/* New Member Card */}
      <EmailCard>
        <Section style={{ padding: spacing[4], textAlign: "center" }}>
          {/* Profile Photo */}
          {newMemberPhotoUrl ? (
            <Img
              src={newMemberPhotoUrl}
              alt={newMemberName}
              width={80}
              height={80}
              style={{
                borderRadius: "50%",
                objectFit: "cover",
                margin: "0 auto",
                display: "block",
              }}
            />
          ) : (
            <Section
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: colors.primary,
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: "32px",
                  color: "#ffffff",
                  fontWeight: typography.fontWeight.bold,
                  lineHeight: "80px",
                  textAlign: "center",
                }}
              >
                {newMemberName.charAt(0).toUpperCase()}
              </Text>
            </Section>
          )}

          <Spacer size="sm" />

          {/* Name and Role */}
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            {newMemberName}
          </Text>

          <Spacer size="xs" />

          <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>

          <Spacer size="md" />

          {/* Details */}
          <Section style={{ textAlign: "left" }}>
            <AlertDetailsTable>
              <AlertDetailRow label="Email" value={newMemberEmail} />
              <AlertDetailRow label="Joined" value={joinedAt} />
              {invitedBy && <AlertDetailRow label="Invited by" value={invitedBy} />}
            </AlertDetailsTable>
          </Section>
        </Section>
      </EmailCard>

      <Spacer size="md" />

      {/* CTAs */}
      <EmailButtonGroup
        buttons={[
          { href: actionUrl, label: "View Profile", variant: "primary" },
          { href: teamDirectoryUrl, label: "Team Directory", variant: "secondary" },
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
        Consider sending a welcome message to help them get started.
      </Text>
    </AlertLayout>
  );
}

export default AdminAlertTeamMemberJoinedEmail;
