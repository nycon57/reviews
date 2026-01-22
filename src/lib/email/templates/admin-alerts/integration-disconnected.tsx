/**
 * Integration Disconnected Alert Email (S089)
 *
 * Sent to managers/admins when an integration loses connection.
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
import type { AdminAlertIntegrationDisconnectedEmailData } from "../../types";

interface Props {
  data: AdminAlertIntegrationDisconnectedEmailData;
}

const integrationInfo: Record<string, { label: string; icon: string; color: string }> = {
  google_business: { label: "Google Business Profile", icon: "🔗", color: "#4285F4" },
  google_reviews: { label: "Google Reviews", icon: "⭐", color: "#4285F4" },
  zillow: { label: "Zillow", icon: "🏠", color: "#006AFF" },
  facebook: { label: "Facebook", icon: "📘", color: "#1877F2" },
  linkedin: { label: "LinkedIn", icon: "💼", color: "#0A66C2" },
  twitter: { label: "Twitter/X", icon: "𝕏", color: "#000000" },
  email: { label: "Email Service", icon: "📧", color: "#6366F1" },
  unknown: { label: "Integration", icon: "🔌", color: colors.text.muted },
};

const disconnectReasonLabels: Record<string, string> = {
  token_expired: "Access token has expired",
  revoked: "Access was revoked by the user",
  api_error: "API returned an error",
  rate_limited: "Rate limit exceeded",
  account_suspended: "Connected account was suspended",
  unknown: "Connection was lost",
};

export function AdminAlertIntegrationDisconnectedEmail({ data }: Props) {
  const {
    recipientName,
    organizationName,
    integrationName,
    disconnectedAt,
    reason,
    affectedFeatures,
    reconnectUrl,
    integrationsUrl,
    toEmail,
    unsubscribeUrl,
  } = data;

  const integration = integrationInfo[integrationName] || integrationInfo.unknown;
  const reasonText = disconnectReasonLabels[reason || "unknown"] || disconnectReasonLabels.unknown;

  return (
    <AlertLayout
      preview={`${integration.label} disconnected from ${organizationName}`}
      severity="medium"
      alertType="integration_disconnected"
      toEmail={toEmail}
      unsubscribeUrl={unsubscribeUrl}
    >
      <AlertTitle>
        Integration Disconnected
      </AlertTitle>
      <AlertDescription>
        Hi {recipientName}, the {integration.label} integration for {organizationName} has been
        disconnected. Some features may not work until it&apos;s reconnected.
      </AlertDescription>

      {/* Integration Card */}
      <EmailCard>
        <Section style={{ padding: spacing[4] }}>
          {/* Integration Header */}
          <table style={{ width: "100%", marginBottom: spacing[4] }}>
            <tr>
              <td style={{ width: "48px", verticalAlign: "top" }}>
                <Section
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: layout.borderRadius.md,
                    background: `${integration.color}15`,
                    textAlign: "center",
                  }}
                >
                  <Text
                    style={{
                      margin: 0,
                      fontFamily: typography.fontFamily.body,
                      fontSize: "20px",
                      lineHeight: "40px",
                    }}
                  >
                    {integration.icon}
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
                  {integration.label}
                </Text>
                <Text
                  style={{
                    margin: `${spacing[1]} 0 0 0`,
                    fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize.sm,
                    color: colors.text.muted,
                  }}
                >
                  {reasonText}
                </Text>
              </td>
              <td style={{ textAlign: "right", verticalAlign: "top" }}>
                <Badge variant="warning">Disconnected</Badge>
              </td>
            </tr>
          </table>

          {/* Details */}
          <AlertDetailsTable>
            <AlertDetailRow label="Disconnected" value={disconnectedAt} />
            <AlertDetailRow label="Organization" value={organizationName} />
          </AlertDetailsTable>

          {/* Affected Features */}
          {affectedFeatures && affectedFeatures.length > 0 && (
            <Section
              style={{
                marginTop: spacing[4],
                padding: spacing[3],
                background: "#FEF3C7",
                borderRadius: layout.borderRadius.md,
              }}
            >
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: "#92400E",
                  marginBottom: spacing[2],
                }}
              >
                Affected Features:
              </Text>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  color: "#92400E",
                }}
              >
                {affectedFeatures.map((feature, index) => (
                  <React.Fragment key={index}>
                    • {feature}
                    {index < affectedFeatures.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </Text>
            </Section>
          )}
        </Section>
      </EmailCard>

      <Spacer size="md" />

      {/* CTAs */}
      <EmailButtonGroup
        buttons={[
          { href: reconnectUrl, label: "Reconnect Now", variant: "primary" },
          { href: integrationsUrl, label: "All Integrations", variant: "secondary" },
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
        Reconnecting usually only takes a moment. Click the button above to restore the connection.
      </Text>
    </AlertLayout>
  );
}

export default AdminAlertIntegrationDisconnectedEmail;
