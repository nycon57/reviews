/**
 * Product Update Digest Email Template (S088)
 *
 * Monthly changelog digest email with all updates.
 * Groups entries by category with visual styling.
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
  Spacer,
  EmailButton,
  colors,
  typography,
  spacing,
  layout,
} from "../components";
import type { AnnouncementUpdateEmailData } from "../types";

interface AnnouncementUpdateEmailProps {
  data: AnnouncementUpdateEmailData;
}

// Category styling
const categoryStyles: Record<
  string,
  { bgColor: string; textColor: string; label: string }
> = {
  feature: { bgColor: "#dbeafe", textColor: "#1e40af", label: "New Feature" },
  improvement: { bgColor: "#dcfce7", textColor: "#166534", label: "Improvement" },
  bugfix: { bgColor: "#fef3c7", textColor: "#92400e", label: "Bug Fix" },
  performance: { bgColor: "#e0e7ff", textColor: "#4338ca", label: "Performance" },
  security: { bgColor: "#fee2e2", textColor: "#991b1b", label: "Security" },
  other: { bgColor: "#f3f4f6", textColor: "#374151", label: "Update" },
};

export function AnnouncementUpdateEmail({ data }: AnnouncementUpdateEmailProps) {
  const {
    firstName,
    title,
    subtitle,
    introText,
    changelogEntries,
    ctaText,
    ctaUrl,
    period,
    toEmail,
  } = data;

  // Format period dates
  const periodStart = new Date(period.start).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const periodEnd = new Date(period.end).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const periodText =
    periodStart === periodEnd ? periodStart : `${periodStart} - ${periodEnd}`;

  // Group entries by category
  const groupedEntries = changelogEntries.reduce(
    (acc, entry) => {
      const category = entry.category || "other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(entry);
      return acc;
    },
    {} as Record<string, typeof changelogEntries>
  );

  return (
    <EmailLayout preview={`${title} - ${periodText}`}>
      <RepwellHeader />

      {/* Product Update Banner */}
      <Section
        style={{
          backgroundColor: colors.primary[50],
          padding: `${spacing[4]} ${spacing[6]}`,
          borderBottom: `1px solid ${colors.primary[200]}`,
          textAlign: "center",
        }}
      >
        <Text
          style={{
            margin: 0,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: colors.primary[700],
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Product Update
        </Text>
      </Section>

      <SingleColumnLayout center>
        <Spacer size="md" />
        <Text
          style={{
            margin: 0,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.sm,
            color: colors.text.muted,
            textAlign: "center",
          }}
        >
          {periodText}
        </Text>
        <Spacer size="xs" />
        <EmailHeading as="h1">{title}</EmailHeading>
        {subtitle && (
          <Text
            style={{
              margin: `${spacing[2]} 0 0 0`,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
              textAlign: "center",
            }}
          >
            {subtitle}
          </Text>
        )}
        <Spacer size="sm" />
        <EmailParagraph>Hi {firstName},</EmailParagraph>
        {introText && <EmailParagraph>{introText}</EmailParagraph>}
      </SingleColumnLayout>

      <Spacer size="md" />

      {/* Changelog Entries by Category */}
      <SingleColumnLayout>
        {Object.entries(groupedEntries).map(([category, entries]) => {
          const style = categoryStyles[category] || categoryStyles.other;

          return (
            <React.Fragment key={category}>
              {/* Category Header */}
              <Section
                style={{
                  marginBottom: spacing[3],
                }}
              >
                <Text
                  style={{
                    margin: 0,
                    fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.bold,
                    color: style.textColor,
                    backgroundColor: style.bgColor,
                    padding: `${spacing[1]} ${spacing[3]}`,
                    borderRadius: layout.borderRadius.full,
                    display: "inline-block",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {style.label}
                </Text>
              </Section>

              {/* Entries */}
              {entries.map((entry, index) => (
                <Section
                  key={index}
                  style={{
                    marginBottom: spacing[3],
                    borderLeft: `3px solid ${style.textColor}`,
                    paddingLeft: spacing[4],
                  }}
                >
                <EmailCard>
                  <Text
                    style={{
                      margin: 0,
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.primary,
                    }}
                  >
                    {entry.title}
                  </Text>
                  <Text
                    style={{
                      margin: `${spacing[2]} 0 0 0`,
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary,
                      lineHeight: typography.lineHeight.relaxed,
                    }}
                  >
                    {entry.description}
                  </Text>
                  {entry.docsUrl && (
                    <Text
                      style={{
                        margin: `${spacing[2]} 0 0 0`,
                      }}
                    >
                      <Link
                        href={entry.docsUrl}
                        style={{
                          fontFamily: typography.fontFamily.body,
                          fontSize: typography.fontSize.sm,
                          color: colors.primary[600],
                          textDecoration: "none",
                        }}
                      >
                        Learn more &rarr;
                      </Link>
                    </Text>
                  )}
                </EmailCard>
                </Section>
              ))}

              <Spacer size="sm" />
            </React.Fragment>
          );
        })}
      </SingleColumnLayout>

      <Spacer size="md" />

      {/* CTA */}
      {ctaText && ctaUrl && (
        <SingleColumnLayout center>
          <EmailButton href={ctaUrl} variant="primary">
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

export default AnnouncementUpdateEmail;
