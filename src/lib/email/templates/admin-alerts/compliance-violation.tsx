/**
 * Compliance Violation Alert Email (S089)
 *
 * Sent to managers when flagged content is detected.
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
import type { AdminAlertComplianceViolationEmailData } from "../../types";

interface Props {
  data: AdminAlertComplianceViolationEmailData;
}

const violationTypeLabels: Record<string, { label: string; description: string }> = {
  profanity: { label: "Profanity", description: "Inappropriate language detected" },
  pii: { label: "PII Exposure", description: "Personal identifiable information found" },
  legal_risk: { label: "Legal Risk", description: "Potentially litigious content" },
  brand_violation: { label: "Brand Violation", description: "Content violates brand guidelines" },
  other: { label: "Policy Violation", description: "Content flagged for review" },
};

const contentSourceLabels: Record<string, string> = {
  review: "Customer Review",
  response: "Response to Review",
  testimonial: "Video Testimonial",
  bio: "Profile Bio",
};

export function AdminAlertComplianceViolationEmail({ data }: Props) {
  const {
    recipientName,
    organizationName,
    violationType,
    flaggedContent,
    contentSource,
    loanOfficerName,
    customerName,
    flaggedAt,
    actionUrl,
    reviewQueueUrl,
    toEmail,
    unsubscribeUrl,
  } = data;

  const violationInfo = violationTypeLabels[violationType] || violationTypeLabels.other;

  return (
    <AlertLayout
      preview={`Compliance alert: ${violationInfo.label} detected`}
      severity={violationType === "pii" || violationType === "legal_risk" ? "critical" : "high"}
      alertType="compliance_violation"
      toEmail={toEmail}
      unsubscribeUrl={unsubscribeUrl}
    >
      <AlertTitle>
        Compliance Review Required
      </AlertTitle>
      <AlertDescription>
        Hi {recipientName}, content at {organizationName} has been flagged for potential
        compliance issues and requires your immediate review.
      </AlertDescription>

      {/* Violation Details Card */}
      <EmailCard>
        <Section style={{ padding: spacing[4] }}>
          {/* Violation Type Badge */}
          <Section style={{ marginBottom: spacing[4] }}>
            <Badge variant="error">{violationInfo.label}</Badge>
            <Text
              style={{
                margin: `${spacing[2]} 0 0 0`,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
              }}
            >
              {violationInfo.description}
            </Text>
          </Section>

          {/* Context Details */}
          <AlertDetailsTable>
            <AlertDetailRow label="Content Type" value={contentSourceLabels[contentSource] || contentSource} />
            <AlertDetailRow label="Flagged At" value={flaggedAt} />
            {loanOfficerName && <AlertDetailRow label="Team Member" value={loanOfficerName} />}
            {customerName && <AlertDetailRow label="Customer" value={customerName} />}
          </AlertDetailsTable>

          {/* Flagged Content Preview */}
          <Text
            style={{
              margin: `${spacing[4]} 0 ${spacing[2]} 0`,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            Flagged Content:
          </Text>
          <Section
            style={{
              background: "#FEE2E2",
              padding: spacing[4],
              borderRadius: layout.borderRadius.md,
              borderLeft: `3px solid #DC2626`,
            }}
          >
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.mono,
                fontSize: typography.fontSize.sm,
                color: "#991B1B",
                lineHeight: 1.6,
                wordBreak: "break-word",
              }}
            >
              {flaggedContent}
            </Text>
          </Section>
        </Section>
      </EmailCard>

      <Spacer size="md" />

      {/* Actions */}
      <EmailButtonGroup
        buttons={[
          { href: actionUrl, label: "Review Content", variant: "primary" },
          { href: reviewQueueUrl, label: "View All Flagged", variant: "secondary" },
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
        Please review this content within 24 hours to maintain compliance standards.
      </Text>
    </AlertLayout>
  );
}

export default AdminAlertComplianceViolationEmail;
