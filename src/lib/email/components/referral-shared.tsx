/**
 * Shared components for referral program email templates.
 *
 * Reusable components that appear across multiple referral emails.
 */

import * as React from "react";
import { Section, Text, Link } from "@react-email/components";
import { colors, typography, spacing } from "../theme";

// =============================================================================
// Types
// =============================================================================

export interface SocialShareLinksType {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  whatsapp?: string;
}

// =============================================================================
// Referral Link Box
// =============================================================================

export interface ReferralLinkBoxProps {
  /** The referral link to display */
  referralLink: string;
  /** Optional label text */
  label?: string;
}

/**
 * Displays the user's referral link in a styled box.
 */
export function ReferralLinkBox({
  referralLink,
  label = "Your referral link:",
}: ReferralLinkBoxProps): React.ReactElement {
  return (
    <Section
      style={{
        padding: spacing[4],
        backgroundColor: colors.background.muted,
        borderRadius: "8px",
        textAlign: "center",
      }}
    >
      <Text
        style={{
          margin: 0,
          fontFamily: typography.fontFamily.body,
          fontSize: typography.fontSize.xs,
          color: colors.text.muted,
          marginBottom: spacing[2],
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          margin: 0,
          fontFamily: typography.fontFamily.mono,
          fontSize: typography.fontSize.sm,
          color: colors.primary,
          wordBreak: "break-all",
        }}
      >
        {referralLink}
      </Text>
    </Section>
  );
}

// =============================================================================
// Social Share Buttons
// =============================================================================

export interface SocialShareButtonsProps {
  /** Social share links object */
  links: SocialShareLinksType;
  /** Variant: compact (small buttons) or full (with labels) */
  variant?: "compact" | "full";
  /** Optional label text above buttons */
  label?: string;
}

const SOCIAL_BUTTON_COLORS = {
  linkedin: "#0A66C2",
  twitter: "#1DA1F2",
  facebook: "#1877F2",
  whatsapp: "#25D366",
} as const;

interface SocialButtonConfig {
  href: string;
  label: string;
  fullLabel: string;
  color: string;
}

function getSocialButtonConfigs(links: SocialShareLinksType): SocialButtonConfig[] {
  const configs: SocialButtonConfig[] = [];

  if (links.linkedin) {
    configs.push({
      href: links.linkedin,
      label: "LinkedIn",
      fullLabel: "Share on LinkedIn",
      color: SOCIAL_BUTTON_COLORS.linkedin,
    });
  }
  if (links.twitter) {
    configs.push({
      href: links.twitter,
      label: "Twitter",
      fullLabel: "Share on Twitter",
      color: SOCIAL_BUTTON_COLORS.twitter,
    });
  }
  if (links.facebook) {
    configs.push({
      href: links.facebook,
      label: "Facebook",
      fullLabel: "Share on Facebook",
      color: SOCIAL_BUTTON_COLORS.facebook,
    });
  }
  if (links.whatsapp) {
    configs.push({
      href: links.whatsapp,
      label: "WhatsApp",
      fullLabel: "Share via WhatsApp",
      color: SOCIAL_BUTTON_COLORS.whatsapp,
    });
  }

  return configs;
}

/**
 * Social media share buttons for referral links.
 */
export function SocialShareButtons({
  links,
  variant = "compact",
  label,
}: SocialShareButtonsProps): React.ReactElement | null {
  const configs = getSocialButtonConfigs(links);

  if (configs.length === 0) {
    return null;
  }

  const isCompact = variant === "compact";
  const buttonPadding = isCompact
    ? `${spacing[2]} ${spacing[3]}`
    : `${spacing[2]} ${spacing[4]}`;
  const fontSize = isCompact ? typography.fontSize.xs : typography.fontSize.sm;

  return (
    <Section style={{ textAlign: "center" }}>
      {label && (
        <Text
          style={{
            margin: 0,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.sm,
            color: colors.text.muted,
            marginBottom: spacing[3],
          }}
        >
          {label}
        </Text>
      )}
      <Section
        style={{
          display: "flex",
          justifyContent: "center",
          gap: spacing[2],
        }}
      >
        {configs.map((config, index) => (
          <Link
            key={config.label}
            href={config.href}
            style={{
              display: "inline-block",
              padding: buttonPadding,
              backgroundColor: config.color,
              color: "#ffffff",
              borderRadius: "6px",
              fontSize,
              fontWeight: typography.fontWeight.medium,
              textDecoration: "none",
              marginRight: index < configs.length - 1 ? spacing[2] : undefined,
              marginBottom: spacing[2],
            }}
          >
            {isCompact ? config.label : config.fullLabel}
          </Link>
        ))}
      </Section>
    </Section>
  );
}

// =============================================================================
// Social Share Section (with background)
// =============================================================================

export interface SocialShareSectionProps {
  /** Social share links object */
  links: SocialShareLinksType;
  /** Optional label text */
  label?: string;
}

/**
 * Social share section with subtle background.
 * Used in email templates where social sharing is a secondary action.
 */
export function SocialShareSection({
  links,
  label = "Share with others:",
}: SocialShareSectionProps): React.ReactElement | null {
  const configs = getSocialButtonConfigs(links);

  if (configs.length === 0) {
    return null;
  }

  return (
    <Section
      style={{
        padding: spacing[4],
        backgroundColor: colors.background.subtle,
        borderRadius: "8px",
        textAlign: "center",
      }}
    >
      <Text
        style={{
          margin: 0,
          fontFamily: typography.fontFamily.body,
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
          marginBottom: spacing[3],
        }}
      >
        {label}
      </Text>
      <Section
        style={{
          display: "flex",
          justifyContent: "center",
          gap: spacing[2],
        }}
      >
        {configs.map((config, index) => (
          <Link
            key={config.label}
            href={config.href}
            style={{
              display: "inline-block",
              padding: `${spacing[2]} ${spacing[3]}`,
              backgroundColor: config.color,
              color: "#ffffff",
              borderRadius: "6px",
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              textDecoration: "none",
              marginRight: index < configs.length - 1 ? spacing[2] : undefined,
            }}
          >
            {config.label}
          </Link>
        ))}
      </Section>
    </Section>
  );
}
