/**
 * Social Share CTA Component
 *
 * Call-to-action section for sharing achievements on social media.
 * Displays share buttons for LinkedIn, Twitter, and Facebook.
 */

import * as React from "react";
import { Section, Text, Link } from "@react-email/components";
import { colors, typography, spacing, layout } from "../../components";

interface SocialShareCtaProps {
  message: string;
  socialShareLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

const socialButtonStyle = {
  display: "inline-block",
  padding: `${spacing[2]} ${spacing[4]}`,
  margin: `0 ${spacing[2]}`,
  fontFamily: typography.fontFamily.body,
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.semibold,
  textDecoration: "none",
  borderRadius: layout.borderRadius.md,
  color: colors.text.inverse,
};

export function SocialShareCta({ message, socialShareLinks }: SocialShareCtaProps) {
  if (!socialShareLinks) return null;

  const { linkedin, twitter, facebook } = socialShareLinks;
  const hasAnyLink = linkedin || twitter || facebook;

  if (!hasAnyLink) return null;

  return (
    <Section
      style={{
        textAlign: "center",
        padding: `${spacing[6]} ${spacing[4]}`,
        backgroundColor: colors.background.muted,
        borderRadius: layout.borderRadius.lg,
        marginTop: spacing[6],
      }}
    >
      <Text
        style={{
          margin: 0,
          fontFamily: typography.fontFamily.body,
          fontSize: typography.fontSize.base,
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.primary,
          marginBottom: spacing[4],
        }}
      >
        {message}
      </Text>

      <Section style={{ textAlign: "center" }}>
        {linkedin && (
          <Link
            href={linkedin}
            style={{
              ...socialButtonStyle,
              backgroundColor: "#0A66C2",
            }}
          >
            Share on LinkedIn
          </Link>
        )}
        {twitter && (
          <Link
            href={twitter}
            style={{
              ...socialButtonStyle,
              backgroundColor: "#1DA1F2",
            }}
          >
            Share on X
          </Link>
        )}
        {facebook && (
          <Link
            href={facebook}
            style={{
              ...socialButtonStyle,
              backgroundColor: "#1877F2",
            }}
          >
            Share on Facebook
          </Link>
        )}
      </Section>
    </Section>
  );
}
