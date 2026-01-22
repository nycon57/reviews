/**
 * Security Update Notification Email Template (S088)
 *
 * Sent to users for security-related updates.
 * Includes severity level, required actions, and deadlines.
 * Uses S073 email design system components.
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
  InfoCard,
  Spacer,
  Badge,
  EmailButton,
  colors,
  typography,
  spacing,
  layout,
} from "../components";
import type { AnnouncementSecurityEmailData } from "../types";

interface AnnouncementSecurityEmailProps {
  data: AnnouncementSecurityEmailData;
}

// Severity level styling
const severityStyles: Record<
  string,
  {
    bgColor: string;
    textColor: string;
    borderColor: string;
    label: string;
    headerBg: string;
  }
> = {
  critical: {
    bgColor: "#fef2f2",
    textColor: "#991b1b",
    borderColor: "#ef4444",
    label: "Critical",
    headerBg: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
  },
  high: {
    bgColor: "#fff7ed",
    textColor: "#c2410c",
    borderColor: "#f97316",
    label: "High",
    headerBg: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
  },
  medium: {
    bgColor: "#fefce8",
    textColor: "#a16207",
    borderColor: "#eab308",
    label: "Medium",
    headerBg: "linear-gradient(135deg, #ca8a04 0%, #a16207 100%)",
  },
  low: {
    bgColor: "#f0fdf4",
    textColor: "#166534",
    borderColor: "#22c55e",
    label: "Low",
    headerBg: "linear-gradient(135deg, #16a34a 0%, #166534 100%)",
  },
};

export function AnnouncementSecurityEmail({ data }: AnnouncementSecurityEmailProps) {
  const {
    firstName,
    title,
    content,
    severity,
    actionRequired,
    requiredActions,
    affectedFeatures,
    ctaText,
    ctaUrl,
    securityPageUrl,
    toEmail,
    unsubscribeUrl,
    preferencesUrl,
  } = data;

  const severityStyle = severityStyles[severity] || severityStyles.medium;

  return (
    <EmailLayout preview={`Security Update: ${title}`}>
      <RepwellHeader />

      {/* Security Banner */}
      <Section
        style={{
          background: severityStyle.headerBg,
          padding: `${spacing[4]} ${spacing[6]}`,
          textAlign: "center",
        }}
      >
        <Text
          style={{
            margin: 0,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.bold,
            color: "#ffffff",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Security Update
        </Text>
      </Section>

      <SingleColumnLayout center>
        <Spacer size="md" />
        <Badge
          variant={
            severity === "critical" || severity === "high"
              ? "error"
              : severity === "medium"
                ? "warning"
                : "info"
          }
        >
          {severityStyle.label} Severity
        </Badge>
        {actionRequired && (
          <>
            <Spacer size="xs" />
            <Badge variant="error">Action Required</Badge>
          </>
        )}
        <Spacer size="sm" />
        <EmailHeading as="h1">{title}</EmailHeading>
        <Spacer size="sm" />
        <EmailParagraph>Hi {firstName},</EmailParagraph>
        <EmailParagraph>{content}</EmailParagraph>
      </SingleColumnLayout>

      <Spacer size="md" />

      {/* Required Actions */}
      {requiredActions && requiredActions.length > 0 && (
        <>
          <SingleColumnLayout>
            <Text
              style={{
                margin: `0 0 ${spacing[3]} 0`,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
              }}
            >
              {actionRequired ? "Required Actions" : "Recommended Actions"}
            </Text>

            {requiredActions.map((action, index) => (
              <Section
                key={index}
                style={{
                  marginBottom: spacing[3],
                  borderLeft: `4px solid ${severityStyle.borderColor}`,
                  backgroundColor: severityStyle.bgColor,
                  paddingLeft: spacing[4],
                }}
              >
              <EmailCard>
                <Section style={{ display: "flex", alignItems: "flex-start" }}>
                  <Text
                    style={{
                      margin: 0,
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.bold,
                      color: severityStyle.textColor,
                      width: "32px",
                      minWidth: "32px",
                    }}
                  >
                    {index + 1}.
                  </Text>
                  <Section style={{ flex: 1 }}>
                    <Text
                      style={{
                        margin: 0,
                        fontFamily: typography.fontFamily.body,
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.text.primary,
                      }}
                    >
                      {action.title}
                    </Text>
                    <Text
                      style={{
                        margin: `${spacing[1]} 0 0 0`,
                        fontFamily: typography.fontFamily.body,
                        fontSize: typography.fontSize.sm,
                        color: colors.text.secondary,
                        lineHeight: typography.lineHeight.relaxed,
                      }}
                    >
                      {action.description}
                    </Text>
                    {action.deadline && (
                      <Text
                        style={{
                          margin: `${spacing[2]} 0 0 0`,
                          fontFamily: typography.fontFamily.body,
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.semibold,
                          color: severityStyle.textColor,
                        }}
                      >
                        Deadline: {action.deadline}
                      </Text>
                    )}
                    {action.actionUrl && (
                      <Text style={{ margin: `${spacing[2]} 0 0 0` }}>
                        <Link
                          href={action.actionUrl}
                          style={{
                            fontFamily: typography.fontFamily.body,
                            fontSize: typography.fontSize.sm,
                            fontWeight: typography.fontWeight.medium,
                            color: colors.primary[600],
                            textDecoration: "none",
                          }}
                        >
                          Take Action &rarr;
                        </Link>
                      </Text>
                    )}
                  </Section>
                </Section>
              </EmailCard>
              </Section>
            ))}
          </SingleColumnLayout>
          <Spacer size="md" />
        </>
      )}

      {/* Affected Features */}
      {affectedFeatures && affectedFeatures.length > 0 && (
        <>
          <SingleColumnLayout>
            <InfoCard type="warning" title="Affected Features">
              <Section
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: spacing[2],
                }}
              >
                {affectedFeatures.map((feature, index) => (
                  <Text
                    key={index}
                    style={{
                      margin: `${spacing[1]} ${spacing[2]} ${spacing[1]} 0`,
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize.sm,
                      color: colors.text.primary,
                      backgroundColor: colors.background.subtle,
                      padding: `${spacing[1]} ${spacing[2]}`,
                      borderRadius: layout.borderRadius.sm,
                      display: "inline-block",
                    }}
                  >
                    {feature}
                  </Text>
                ))}
              </Section>
            </InfoCard>
          </SingleColumnLayout>
          <Spacer size="md" />
        </>
      )}

      {/* CTA */}
      <SingleColumnLayout center>
        <EmailButton
          href={ctaUrl}
          variant={severity === "critical" || severity === "high" ? "primary" : "secondary"}
        >
          {ctaText}
        </EmailButton>
      </SingleColumnLayout>

      <Spacer size="md" />

      {/* Security Page Link */}
      {securityPageUrl && (
        <>
          <SingleColumnLayout center>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                textAlign: "center",
              }}
            >
              For more details, visit our{" "}
              <Link
                href={securityPageUrl}
                style={{
                  color: colors.primary[600],
                  textDecoration: "underline",
                }}
              >
                security page
              </Link>
              .
            </Text>
          </SingleColumnLayout>
          <Spacer size="md" />
        </>
      )}

      {/* Important Note for Critical/High */}
      {(severity === "critical" || severity === "high") && (
        <>
          <SingleColumnLayout>
            <Section
              style={{
                backgroundColor: severityStyle.bgColor,
                border: `1px solid ${severityStyle.borderColor}`,
                borderRadius: layout.borderRadius.md,
                padding: spacing[4],
                textAlign: "center",
              }}
            >
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: severityStyle.textColor,
                }}
              >
                This is a {severityStyle.label.toLowerCase()} severity security update.
                {actionRequired && " Your immediate attention is required."}
              </Text>
            </Section>
          </SingleColumnLayout>
          <Spacer size="md" />
        </>
      )}

      <Spacer size="lg" />

      {/* Footer - Note: Security emails shouldn't be fully unsubscribable for critical updates */}
      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}

export default AnnouncementSecurityEmail;
