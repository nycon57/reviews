import * as React from "react";
import { Section, Text, Link, Row, Column, Img } from "@react-email/components";
import { colors, typography, spacing, layout } from "../theme";

// =============================================================================
// SOCIAL LINK ICONS (inline SVG data URIs for email compatibility)
// =============================================================================

const socialIcons = {
  linkedin: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='%23cad2c5'%3E%3Cpath d='M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z'/%3E%3C/svg%3E`,
  twitter: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='%23cad2c5'%3E%3Cpath d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'/%3E%3C/svg%3E`,
  facebook: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='%23cad2c5'%3E%3Cpath d='M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z'/%3E%3C/svg%3E`,
  instagram: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='%23cad2c5'%3E%3Cpath d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z'/%3E%3C/svg%3E`,
};

// =============================================================================
// EMAIL FOOTER COMPONENT
// =============================================================================

export interface EmailFooterProps {
  /** Unsubscribe URL */
  unsubscribeUrl: string;
  /** Preferences URL */
  preferencesUrl?: string;
  /** Company name */
  companyName?: string;
  /** Company address */
  address?: string;
  /** Show social links */
  showSocialLinks?: boolean;
  /** Social media links */
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  /** Footer variant */
  variant?: "default" | "minimal" | "dark";
  /** Custom tagline */
  tagline?: string;
  /** Privacy policy URL */
  privacyUrl?: string;
  /** Terms of service URL */
  termsUrl?: string;
}

/**
 * Email footer with unsubscribe link, preferences, and optional social links.
 * Compliant with email best practices and CAN-SPAM requirements.
 */
export function EmailFooter({
  unsubscribeUrl,
  preferencesUrl,
  companyName = "Repwell",
  address,
  showSocialLinks = true,
  socialLinks,
  variant = "default",
  tagline = "Reputation done well.",
  privacyUrl,
  termsUrl,
}: EmailFooterProps) {
  const isDark = variant === "dark";
  const bgColor = isDark ? colors.repwell.teal[500] : colors.background.subtle;
  const textColor = isDark ? colors.text.inverseMuted : colors.repwell.teal[300];
  const linkColor = isDark ? colors.text.inverse : colors.repwell.teal[300];
  const mutedColor = isDark ? colors.repwell.sage[100] : colors.repwell.teal[300];

  if (variant === "minimal") {
    return (
      <Section
        style={{
          padding: `${spacing[6]} ${spacing[8]}`,
          textAlign: "center",
        }}
      >
        <Text
          style={{
            margin: 0,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.xs,
            color: colors.repwell.teal[300],
          }}
        >
          Powered by {companyName} |{" "}
          <Link
            href={unsubscribeUrl}
            style={{
              color: colors.repwell.teal[300],
              textDecoration: "underline",
            }}
          >
            Unsubscribe
          </Link>
        </Text>
      </Section>
    );
  }

  return (
    <Section
      style={{
        padding: `${spacing[10]} ${spacing[8]}`,
        backgroundColor: bgColor,
        borderTop: !isDark ? `1px solid ${colors.border.default}` : undefined,
      }}
    >
      {/* Logo/Company name and tagline */}
      <Section style={{ textAlign: "center", marginBottom: spacing[6] }}>
        <Text
          style={{
            margin: 0,
            fontFamily: typography.fontFamily.display,
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: isDark ? colors.text.inverse : colors.repwell.teal[400],
          }}
        >
          {companyName}
        </Text>
        {tagline && (
          <Text
            style={{
              margin: `${spacing[1]} 0 0 0`,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              color: mutedColor,
            }}
          >
            {tagline}
          </Text>
        )}
      </Section>

      {/* Social links */}
      {showSocialLinks && socialLinks && Object.keys(socialLinks).length > 0 && (
        <Section style={{ textAlign: "center", marginBottom: spacing[6] }}>
          <Row style={{ display: "inline-block" }}>
            {socialLinks.linkedin && (
              <Column style={{ padding: `0 ${spacing[2]}`, display: "inline-block" }}>
                <Link href={socialLinks.linkedin}>
                  <Img
                    src={socialIcons.linkedin}
                    alt="LinkedIn"
                    width={24}
                    height={24}
                    style={{ display: "inline-block" }}
                  />
                </Link>
              </Column>
            )}
            {socialLinks.twitter && (
              <Column style={{ padding: `0 ${spacing[2]}`, display: "inline-block" }}>
                <Link href={socialLinks.twitter}>
                  <Img
                    src={socialIcons.twitter}
                    alt="X (Twitter)"
                    width={24}
                    height={24}
                    style={{ display: "inline-block" }}
                  />
                </Link>
              </Column>
            )}
            {socialLinks.facebook && (
              <Column style={{ padding: `0 ${spacing[2]}`, display: "inline-block" }}>
                <Link href={socialLinks.facebook}>
                  <Img
                    src={socialIcons.facebook}
                    alt="Facebook"
                    width={24}
                    height={24}
                    style={{ display: "inline-block" }}
                  />
                </Link>
              </Column>
            )}
            {socialLinks.instagram && (
              <Column style={{ padding: `0 ${spacing[2]}`, display: "inline-block" }}>
                <Link href={socialLinks.instagram}>
                  <Img
                    src={socialIcons.instagram}
                    alt="Instagram"
                    width={24}
                    height={24}
                    style={{ display: "inline-block" }}
                  />
                </Link>
              </Column>
            )}
          </Row>
        </Section>
      )}

      {/* Links row */}
      <Section style={{ textAlign: "center", marginBottom: spacing[4] }}>
        <Link
          href={unsubscribeUrl}
          style={{
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.sm,
            color: linkColor,
            textDecoration: "underline",
          }}
        >
          Unsubscribe
        </Link>
        {preferencesUrl && (
          <>
            <Text
              style={{
                display: "inline",
                margin: `0 ${spacing[2]}`,
                color: textColor,
              }}
            >
              |
            </Text>
            <Link
              href={preferencesUrl}
              style={{
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: linkColor,
                textDecoration: "underline",
              }}
            >
              Email Preferences
            </Link>
          </>
        )}
        {privacyUrl && (
          <>
            <Text
              style={{
                display: "inline",
                margin: `0 ${spacing[2]}`,
                color: textColor,
              }}
            >
              |
            </Text>
            <Link
              href={privacyUrl}
              style={{
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: linkColor,
                textDecoration: "underline",
              }}
            >
              Privacy Policy
            </Link>
          </>
        )}
        {termsUrl && (
          <>
            <Text
              style={{
                display: "inline",
                margin: `0 ${spacing[2]}`,
                color: textColor,
              }}
            >
              |
            </Text>
            <Link
              href={termsUrl}
              style={{
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: linkColor,
                textDecoration: "underline",
              }}
            >
              Terms of Service
            </Link>
          </>
        )}
      </Section>

      {/* Address and copyright */}
      <Section style={{ textAlign: "center" }}>
        {address && (
          <Text
            style={{
              margin: `0 0 ${spacing[2]} 0`,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.xs,
              color: textColor,
            }}
          >
            {address}
          </Text>
        )}
        <Text
          style={{
            margin: 0,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.xs,
            color: textColor,
          }}
        >
          &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
        </Text>
      </Section>
    </Section>
  );
}

// =============================================================================
// REPWELL BRANDED FOOTER
// =============================================================================

export interface RepwellFooterProps {
  /** Email address for unsubscribe */
  email: string;
  /** Base URL for the app */
  baseUrl?: string;
  /** Variant */
  variant?: "default" | "minimal" | "dark";
}

/**
 * Pre-configured Repwell branded footer with standard links.
 */
export function RepwellFooter({
  email,
  baseUrl = "https://app.repwell.ai",
  variant = "default",
}: RepwellFooterProps) {
  const unsubscribeUrl = `${baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(email)}`;
  const preferencesUrl = `${baseUrl}/settings/notifications`;
  const privacyUrl = `${baseUrl}/privacy`;
  const termsUrl = `${baseUrl}/terms`;

  return (
    <EmailFooter
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
      privacyUrl={privacyUrl}
      termsUrl={termsUrl}
      companyName="Repwell"
      tagline="Reputation done well."
      showSocialLinks={true}
      socialLinks={{
        linkedin: "https://linkedin.com/company/repwell",
        twitter: "https://twitter.com/repwell",
      }}
      variant={variant}
    />
  );
}

// =============================================================================
// POWERED BY FOOTER
// =============================================================================

export interface PoweredByFooterProps {
  /** Unsubscribe URL */
  unsubscribeUrl: string;
  /** Organization name (optional) */
  organizationName?: string;
}

/**
 * Minimal "Powered by Repwell" footer for white-label emails.
 */
export function PoweredByFooter({
  unsubscribeUrl,
  organizationName,
}: PoweredByFooterProps) {
  return (
    <Section
      style={{
        padding: `${spacing[6]} ${spacing[8]}`,
        textAlign: "center",
        borderTop: `1px solid ${colors.border.default}`,
      }}
    >
      <Text
        style={{
          margin: 0,
          fontFamily: typography.fontFamily.body,
          fontSize: typography.fontSize.xs,
          color: colors.repwell.teal[300],
        }}
      >
        {organizationName && (
          <>
            {organizationName}
            <br />
          </>
        )}
        Powered by{" "}
        <Link
          href="https://repwell.ai"
          style={{
            color: colors.repwell.teal[300],
            fontWeight: typography.fontWeight.semibold,
          }}
        >
          Repwell
        </Link>
      </Text>
      <Text
        style={{
          margin: `${spacing[3]} 0 0 0`,
          fontFamily: typography.fontFamily.body,
          fontSize: typography.fontSize.xs,
          color: colors.repwell.teal[300],
        }}
      >
        <Link
          href={unsubscribeUrl}
          style={{
            color: colors.repwell.teal[300],
            textDecoration: "underline",
          }}
        >
          Unsubscribe
        </Link>
      </Text>
    </Section>
  );
}
