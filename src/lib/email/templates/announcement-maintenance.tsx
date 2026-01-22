/**
 * Maintenance Notification Email Template (S088)
 *
 * Sent to users before scheduled maintenance windows.
 * Includes downtime info, affected services, and workarounds.
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
  EmailList,
  colors,
  typography,
  spacing,
  layout,
} from "../components";
import type { AnnouncementMaintenanceEmailData } from "../types";

interface AnnouncementMaintenanceEmailProps {
  data: AnnouncementMaintenanceEmailData;
}

// Impact level styling
const impactStyles: Record<
  string,
  { bgColor: string; textColor: string; borderColor: string; label: string }
> = {
  minimal: {
    bgColor: "#dcfce7",
    textColor: "#166534",
    borderColor: "#86efac",
    label: "Minimal Impact",
  },
  partial: {
    bgColor: "#fef3c7",
    textColor: "#92400e",
    borderColor: "#fcd34d",
    label: "Partial Outage",
  },
  full: {
    bgColor: "#fee2e2",
    textColor: "#991b1b",
    borderColor: "#fca5a5",
    label: "Full Outage",
  },
};

export function AnnouncementMaintenanceEmail({ data }: AnnouncementMaintenanceEmailProps) {
  const {
    firstName,
    title,
    content,
    maintenanceStart,
    maintenanceEnd,
    expectedDuration,
    affectedServices,
    impactLevel,
    workarounds,
    statusPageUrl,
    ctaText,
    ctaUrl,
    toEmail,
  } = data;

  const impact = impactStyles[impactLevel] || impactStyles.partial;

  // Format dates
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  return (
    <EmailLayout preview={`Scheduled Maintenance: ${title}`}>
      <RepwellHeader />

      {/* Maintenance Banner */}
      <Section
        style={{
          backgroundColor: impact.bgColor,
          padding: `${spacing[4]} ${spacing[6]}`,
          borderBottom: `2px solid ${impact.borderColor}`,
          textAlign: "center",
        }}
      >
        <Text
          style={{
            margin: 0,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.bold,
            color: impact.textColor,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Scheduled Maintenance Notice
        </Text>
      </Section>

      <SingleColumnLayout center>
        <Spacer size="md" />
        <Badge
          variant={
            impactLevel === "full"
              ? "error"
              : impactLevel === "partial"
                ? "warning"
                : "success"
          }
        >
          {impact.label}
        </Badge>
        <Spacer size="sm" />
        <EmailHeading as="h1">{title}</EmailHeading>
        <Spacer size="sm" />
        <EmailParagraph>Hi {firstName},</EmailParagraph>
        <EmailParagraph>{content}</EmailParagraph>
      </SingleColumnLayout>

      <Spacer size="md" />

      {/* Maintenance Window Card */}
      <SingleColumnLayout>
        <Section
          style={{
            borderLeft: `4px solid ${impact.borderColor}`,
            paddingLeft: spacing[4],
          }}
        >
        <EmailCard>
          {/* Time Info */}
          <Section style={{ marginBottom: spacing[4] }}>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.muted,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Maintenance Window
            </Text>
            <Spacer size="xs" />
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
              }}
            >
              {formatDateTime(maintenanceStart)}
            </Text>
            <Text
              style={{
                margin: `${spacing[1]} 0 0 0`,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
              }}
            >
              to {formatDateTime(maintenanceEnd)}
            </Text>
            <Text
              style={{
                margin: `${spacing[2]} 0 0 0`,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: colors.text.muted,
              }}
            >
              Expected duration: {expectedDuration}
            </Text>
          </Section>

          {/* Affected Services */}
          {affectedServices && affectedServices.length > 0 && (
            <Section>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Affected Services
              </Text>
              <Spacer size="xs" />
              <Section style={{ display: "flex", flexWrap: "wrap", gap: spacing[2] }}>
                {affectedServices.map((service, index) => (
                  <Text
                    key={index}
                    style={{
                      margin: `${spacing[1]} ${spacing[2]} ${spacing[1]} 0`,
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize.sm,
                      color: impact.textColor,
                      backgroundColor: impact.bgColor,
                      padding: `${spacing[1]} ${spacing[2]}`,
                      borderRadius: layout.borderRadius.sm,
                      display: "inline-block",
                    }}
                  >
                    {service}
                  </Text>
                ))}
              </Section>
            </Section>
          )}
        </EmailCard>
        </Section>
      </SingleColumnLayout>

      <Spacer size="md" />

      {/* Workarounds */}
      {workarounds && workarounds.length > 0 && (
        <>
          <SingleColumnLayout>
            <InfoCard type="tip" title="During the Maintenance">
              <EmailList
                items={workarounds}
                textColor={colors.text.secondary}
              />
            </InfoCard>
          </SingleColumnLayout>
          <Spacer size="md" />
        </>
      )}

      {/* Status Page Link */}
      {statusPageUrl && (
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
              Check our{" "}
              <Link
                href={statusPageUrl}
                style={{
                  color: colors.primary[600],
                  textDecoration: "underline",
                }}
              >
                status page
              </Link>{" "}
              for real-time updates during the maintenance window.
            </Text>
          </SingleColumnLayout>
          <Spacer size="md" />
        </>
      )}

      {/* CTA */}
      {ctaText && ctaUrl && (
        <SingleColumnLayout center>
          <EmailButton href={ctaUrl} variant="secondary">
            {ctaText}
          </EmailButton>
        </SingleColumnLayout>
      )}

      <Spacer size="lg" />

      {/* Footer with unsubscribe */}
      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}

export default AnnouncementMaintenanceEmail;
