/**
 * Feature Announcement Email Template (S088)
 *
 * Sent to users when a new feature is launched.
 * Includes hero image/GIF, feature highlights, and CTAs.
 * Uses S073 email design system components.
 */

import * as React from "react";
import { Img, Section, Text, Link, Row, Column } from "@react-email/components";
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
  EmailButtonGroup,
  colors,
  typography,
  spacing,
  layout,
} from "../components";
import type { AnnouncementFeatureEmailData } from "../types";

interface AnnouncementFeatureEmailProps {
  data: AnnouncementFeatureEmailData;
}

export function AnnouncementFeatureEmail({ data }: AnnouncementFeatureEmailProps) {
  const {
    firstName,
    title,
    subtitle,
    content,
    imageUrl,
    gifUrl,
    ctaText,
    ctaUrl,
    secondaryCtaText,
    secondaryCtaUrl,
    featureHighlights,
    releaseDate,
    toEmail,
    unsubscribeUrl,
    preferencesUrl,
  } = data;

  // Use GIF if available, otherwise use static image
  const heroImageUrl = gifUrl || imageUrl;

  return (
    <EmailLayout preview={`New Feature: ${title}`}>
      <RepwellHeader />

      {/* New Feature Banner */}
      <Section
        style={{
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
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
          New Feature Announcement
        </Text>
      </Section>

      <SingleColumnLayout center>
        <Spacer size="md" />
        <Badge variant="brand">New</Badge>
        <Spacer size="sm" />
        <EmailHeading as="h1">{title}</EmailHeading>
        {subtitle && (
          <Text
            style={{
              margin: `${spacing[2]} 0 0 0`,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.lg,
              color: colors.text.secondary,
              textAlign: "center",
            }}
          >
            {subtitle}
          </Text>
        )}
        <Spacer size="sm" />
        <EmailParagraph>Hi {firstName},</EmailParagraph>
        <EmailParagraph>{content}</EmailParagraph>
      </SingleColumnLayout>

      {/* Hero Image/GIF */}
      {heroImageUrl && (
        <SingleColumnLayout>
          <EmailCard>
            <Section style={{ textAlign: "center" }}>
              <Link href={ctaUrl}>
                <Img
                  src={heroImageUrl}
                  alt={title}
                  width={560}
                  style={{
                    width: "100%",
                    maxWidth: "560px",
                    height: "auto",
                    borderRadius: layout.borderRadius.lg,
                    display: "block",
                    margin: "0 auto",
                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
                  }}
                />
              </Link>
            </Section>
          </EmailCard>
        </SingleColumnLayout>
      )}

      <Spacer size="md" />

      {/* Feature Highlights */}
      {featureHighlights && featureHighlights.length > 0 && (
        <>
          <SingleColumnLayout>
            <Text
              style={{
                margin: `0 0 ${spacing[4]} 0`,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
                textAlign: "center",
              }}
            >
              What you can do now
            </Text>
            {featureHighlights.map((highlight, index) => (
              <InfoCard
                key={index}
                type="info"
                title={highlight.title}
              >
                <Text
                  style={{
                    margin: 0,
                    fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary,
                  }}
                >
                  {highlight.description}
                </Text>
              </InfoCard>
            ))}
          </SingleColumnLayout>
          <Spacer size="md" />
        </>
      )}

      {/* CTAs */}
      <SingleColumnLayout center>
        <EmailButtonGroup
          buttons={[
            { href: ctaUrl, label: ctaText, variant: "primary" },
            ...(secondaryCtaText && secondaryCtaUrl
              ? [{ href: secondaryCtaUrl, label: secondaryCtaText, variant: "secondary" as const }]
              : []),
          ]}
        />
      </SingleColumnLayout>

      <Spacer size="md" />

      {/* Release Date */}
      {releaseDate && (
        <SingleColumnLayout center>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              color: colors.text.muted,
              textAlign: "center",
            }}
          >
            Released on {releaseDate}
          </Text>
        </SingleColumnLayout>
      )}

      <Spacer size="lg" />

      {/* Footer with unsubscribe */}
      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}

export default AnnouncementFeatureEmail;
