import * as React from "react";
import { Section, Img, Text, Link } from "@react-email/components";
import { colors, typography, spacing, gradients, layout } from "../theme";

// =============================================================================
// EMAIL HEADER COMPONENT
// =============================================================================

export interface EmailHeaderProps {
  /** Organization name to display */
  organizationName?: string;
  /** Organization logo URL */
  logoUrl?: string;
  /** Logo alt text */
  logoAlt?: string;
  /** Logo height in pixels */
  logoHeight?: number;
  /** Logo max width in pixels */
  logoMaxWidth?: number;
  /** Background color variant */
  variant?: "default" | "subtle" | "brand" | "dark";
  /** Show the gradient accent bar */
  showAccentBar?: boolean;
  /** Custom background color (overrides variant) */
  backgroundColor?: string;
  /** Center the content */
  center?: boolean;
  /** Navigation links (optional) */
  navLinks?: Array<{ label: string; href: string }>;
}

/**
 * Email header component with Repwell branding.
 * Displays logo or organization name with brand-aligned styling.
 */
export function EmailHeader({
  organizationName = "Repwell",
  logoUrl,
  logoAlt,
  logoHeight = 48,
  logoMaxWidth = 200,
  variant = "default",
  showAccentBar = true,
  backgroundColor,
  center = true,
  navLinks,
}: EmailHeaderProps) {
  // Determine background color based on variant
  const bgColor =
    backgroundColor ||
    {
      default: colors.background.white,
      subtle: colors.background.subtle,
      brand: colors.repwell.sage[100],
      dark: colors.repwell.teal[500],
    }[variant];

  // Determine text color based on variant
  const textColor =
    variant === "dark" ? colors.text.inverse : colors.repwell.teal[400];

  // Determine border color based on variant
  const borderColor =
    variant === "dark" ? colors.repwell.teal[400] : colors.border.default;

  return (
    <>
      {/* Gradient accent bar */}
      {showAccentBar && (
        <Section
          style={{
            height: "4px",
            background: gradients.brandAccent,
          }}
        />
      )}

      {/* Header content */}
      <Section
        style={{
          padding: `${spacing[6]} ${spacing[8]}`,
          backgroundColor: bgColor,
          borderBottom: `1px solid ${borderColor}`,
          textAlign: center ? "center" : "left",
        }}
      >
        {/* Logo or text fallback */}
        {logoUrl ? (
          <Img
            src={logoUrl}
            alt={logoAlt || organizationName}
            height={logoHeight}
            style={{
              display: "inline-block",
              maxWidth: `${logoMaxWidth}px`,
              height: `${logoHeight}px`,
              width: "auto",
            }}
          />
        ) : (
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.display,
              fontSize: typography.fontSize["2xl"],
              fontWeight: typography.fontWeight.bold,
              color: textColor,
              letterSpacing: typography.letterSpacing.tight,
            }}
          >
            {organizationName}
          </Text>
        )}

        {/* Optional navigation links */}
        {navLinks && navLinks.length > 0 && (
          <Section
            style={{
              marginTop: spacing[4],
              textAlign: center ? "center" : "left",
            }}
          >
            {navLinks.map((link, index) => (
              <React.Fragment key={link.href}>
                <Link
                  href={link.href}
                  style={{
                    fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize.sm,
                    color: variant === "dark" ? colors.text.inverseMuted : colors.repwell.teal[300],
                    textDecoration: "none",
                  }}
                >
                  {link.label}
                </Link>
                {index < navLinks.length - 1 && (
                  <Text
                    style={{
                      display: "inline",
                      margin: `0 ${spacing[3]}`,
                      color: variant === "dark" ? colors.text.inverseMuted : colors.border.default,
                    }}
                  >
                    |
                  </Text>
                )}
              </React.Fragment>
            ))}
          </Section>
        )}
      </Section>
    </>
  );
}

// =============================================================================
// REPWELL BRANDED HEADER
// =============================================================================

export interface RepwellHeaderProps {
  /** Variant for the header */
  variant?: "default" | "subtle" | "dark";
  /** Show accent bar */
  showAccentBar?: boolean;
}

/**
 * Pre-configured Repwell branded header.
 * Uses the Repwell logo with brand-aligned styling.
 */
export function RepwellHeader({
  variant = "default",
  showAccentBar = true,
}: RepwellHeaderProps) {
  // For now, use text-based logo until we have a hosted logo URL
  // In production, this would use a CDN-hosted logo
  return (
    <EmailHeader
      organizationName="Repwell"
      variant={variant}
      showAccentBar={showAccentBar}
      logoUrl={undefined} // Replace with actual logo URL when available
    />
  );
}

// =============================================================================
// ORGANIZATION HEADER
// =============================================================================

export interface OrganizationHeaderProps {
  /** Organization name */
  name: string;
  /** Organization logo URL */
  logoUrl?: string;
  /** Show loan officer info */
  loanOfficer?: {
    name: string;
    photoUrl?: string;
    title?: string;
  };
  /** Variant */
  variant?: "default" | "subtle";
  /** Show accent bar */
  showAccentBar?: boolean;
}

/**
 * Organization-branded header with optional loan officer info.
 * Used for customer-facing emails like survey invitations.
 */
export function OrganizationHeader({
  name,
  logoUrl,
  loanOfficer,
  variant = "default",
  showAccentBar = true,
}: OrganizationHeaderProps) {
  const bgColor = variant === "subtle" ? colors.background.subtle : colors.background.white;

  return (
    <>
      {/* Gradient accent bar */}
      {showAccentBar && (
        <Section
          style={{
            height: "4px",
            background: gradients.brandAccent,
          }}
        />
      )}

      {/* Organization branding */}
      <Section
        style={{
          padding: `${spacing[8]} ${spacing[8]}`,
          backgroundColor: bgColor,
          borderBottom: `1px solid ${colors.border.default}`,
          textAlign: "center",
        }}
      >
        {/* Logo or text fallback */}
        {logoUrl ? (
          <Img
            src={logoUrl}
            alt={name}
            height={48}
            style={{
              display: "inline-block",
              maxWidth: "200px",
              height: "48px",
              width: "auto",
              marginBottom: loanOfficer ? spacing[6] : 0,
            }}
          />
        ) : (
          <Text
            style={{
              margin: 0,
              marginBottom: loanOfficer ? spacing[6] : 0,
              fontFamily: typography.fontFamily.display,
              fontSize: typography.fontSize["2xl"],
              fontWeight: typography.fontWeight.bold,
              color: colors.repwell.teal[400],
            }}
          >
            {name}
          </Text>
        )}

        {/* Loan Officer info */}
        {loanOfficer && (
          <Section style={{ textAlign: "center" }}>
            {/* Photo */}
            {loanOfficer.photoUrl ? (
              <Img
                src={loanOfficer.photoUrl}
                alt={loanOfficer.name}
                width={80}
                height={80}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `3px solid ${colors.repwell.sage[200]}`,
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
                  backgroundColor: colors.repwell.sage[100],
                  display: "inline-block",
                  textAlign: "center",
                  lineHeight: "80px",
                }}
              >
                <Text
                  style={{
                    margin: 0,
                    fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize["3xl"],
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.repwell.teal[300],
                    lineHeight: "80px",
                  }}
                >
                  {loanOfficer.name.charAt(0).toUpperCase()}
                </Text>
              </Section>
            )}

            {/* Name and title */}
            <Text
              style={{
                margin: `${spacing[3]} 0 0 0`,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: colors.repwell.teal[500],
              }}
            >
              {loanOfficer.name}
            </Text>
            {loanOfficer.title && (
              <Text
                style={{
                  margin: `${spacing[1]} 0 0 0`,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  color: colors.repwell.teal[300],
                }}
              >
                {loanOfficer.title}
              </Text>
            )}
          </Section>
        )}
      </Section>
    </>
  );
}

// =============================================================================
// STATUS HEADER
// =============================================================================

export interface StatusHeaderProps {
  /** Status type */
  status: "success" | "warning" | "error" | "info" | "pending";
  /** Optional title text */
  title?: string;
}

/**
 * Colored status header for notification emails.
 * Used for review approvals, alerts, etc.
 */
export function StatusHeader({ status, title }: StatusHeaderProps) {
  const statusConfig = {
    success: {
      backgroundColor: "#dcfce7",
      borderColor: "#86efac",
      textColor: "#166534",
      defaultTitle: "Success",
    },
    warning: {
      backgroundColor: "#fef3c7",
      borderColor: "#fcd34d",
      textColor: "#92400e",
      defaultTitle: "Action Required",
    },
    error: {
      backgroundColor: "#fef2f2",
      borderColor: "#fecaca",
      textColor: "#991b1b",
      defaultTitle: "Alert",
    },
    info: {
      backgroundColor: "#eff6ff",
      borderColor: "#bfdbfe",
      textColor: "#1d4ed8",
      defaultTitle: "Information",
    },
    pending: {
      backgroundColor: colors.repwell.sage[100],
      borderColor: colors.repwell.sage[200],
      textColor: colors.repwell.teal[400],
      defaultTitle: "Pending Review",
    },
  };

  const config = statusConfig[status];

  return (
    <Section
      style={{
        padding: `${spacing[6]} ${spacing[8]}`,
        backgroundColor: config.backgroundColor,
        borderBottom: `1px solid ${config.borderColor}`,
        textAlign: "center",
      }}
    >
      <Text
        style={{
          margin: 0,
          fontFamily: typography.fontFamily.display,
          fontSize: typography.fontSize["2xl"],
          fontWeight: typography.fontWeight.bold,
          color: config.textColor,
        }}
      >
        {title || config.defaultTitle}
      </Text>
    </Section>
  );
}
