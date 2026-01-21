/**
 * Team Member Invite Email Sequence Templates
 *
 * 5-email invite sequence for team members:
 * - Email 1 (Immediate): Initial invitation from inviter
 * - Email 2 (Day 2): Reminder if not accepted
 * - Email 3 (Day 5): Final reminder with urgency
 * - Email 4 (On Accept): Role-specific welcome and quick start
 * - Email 5 (Day 14): Expiration notice
 *
 * Role-specific content:
 * - Loan Officer: Sees review collection, testimonials, leaderboard features
 * - Manager: Sees team analytics, performance tracking, approval workflows
 */

import type {
  TeamInvite1InitialEmailData,
  TeamInvite2ReminderEmailData,
  TeamInvite3FinalReminderEmailData,
  TeamInvite4WelcomeEmailData,
  TeamInvite5ExpirationEmailData,
} from "./types";
import { emailConfig } from "./client";
import { colors } from "./theme";

// ============================================================================
// Security Helper Functions
// ============================================================================

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeUrl(url: string): string {
  const allowedProtocols = ["http:", "https:", "mailto:"];
  try {
    const parsed = new URL(url);
    if (!allowedProtocols.includes(parsed.protocol)) {
      return "#";
    }
    return url;
  } catch {
    return "#";
  }
}

function sanitizeSubject(subject: string): string {
  return subject.replace(/[\r\n]/g, "");
}

// ============================================================================
// Role Display Helpers
// ============================================================================

function getRoleDisplayName(role: "admin" | "manager" | "loan_officer"): string {
  switch (role) {
    case "admin":
      return "Administrator";
    case "manager":
      return "Team Manager";
    case "loan_officer":
      return "Loan Officer";
    default:
      return "Team Member";
  }
}

function getRoleIcon(role: "admin" | "manager" | "loan_officer"): string {
  switch (role) {
    case "admin":
      return "&#128272;"; // key
    case "manager":
      return "&#128200;"; // chart
    case "loan_officer":
      return "&#11088;"; // star
    default:
      return "&#128100;"; // person
  }
}

function getRoleFeatures(role: "admin" | "manager" | "loan_officer"): string[] {
  switch (role) {
    case "admin":
      return [
        "Full organization control",
        "Billing and subscription management",
        "Team permissions and settings",
        "Integration configuration",
      ];
    case "manager":
      return [
        "Team performance analytics",
        "Review and testimonial approval",
        "Loan officer oversight",
        "Team leaderboard access",
      ];
    case "loan_officer":
      return [
        "Collect customer reviews",
        "Request video testimonials",
        "Track your performance",
        "Compete on leaderboards",
      ];
    default:
      return [];
  }
}

// ============================================================================
// Base Email Wrapper
// ============================================================================

function wrapInTeamInviteEmailTemplate(
  content: string,
  unsubscribeUrl: string,
  preheaderText?: string,
  organizationLogoUrl?: string
): string {
  const preheader = preheaderText
    ? `<span style="display: none; font-size: 1px; color: #fafafa; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">${escapeHtml(preheaderText)}</span>`
    : "";

  const logoHtml = organizationLogoUrl
    ? `<img src="${sanitizeUrl(organizationLogoUrl)}" alt="Organization Logo" width="160" style="display: block; max-height: 60px; width: auto; max-width: 160px;" />`
    : `<img src="${emailConfig.baseUrl}/images/repwell-logo.png" alt="RepWell" width="140" style="display: block;" />`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RepWell Team Invite</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${colors.background.subtle}; line-height: 1.6;">
  ${preheader}
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: ${colors.background.subtle}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Logo Header -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 24px;">
          <tr>
            <td align="center" style="padding: 0 0 8px 0;">
              ${logoHtml}
            </td>
          </tr>
        </table>
        <!-- Main Content Card -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color: ${colors.background.white}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          ${content}
        </table>
        <!-- Footer -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 32px;">
          <tr>
            <td align="center" style="color: ${colors.text.muted}; font-size: 12px; padding: 0 20px;">
              <p style="margin: 0 0 8px 0;">
                Powered by <a href="${emailConfig.baseUrl}" style="color: ${colors.primary}; text-decoration: none;">RepWell</a>
              </p>
              <p style="margin: 0 0 16px 0;">
                <a href="${sanitizeUrl(unsubscribeUrl)}" style="color: ${colors.text.muted}; text-decoration: underline;">Unsubscribe from invite emails</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: ${colors.text.muted};">
                &copy; ${new Date().getFullYear()} RepWell. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

// ============================================================================
// Shared UI Components
// ============================================================================

function createButton(
  text: string,
  url: string,
  variant: "primary" | "secondary" | "ghost" = "primary"
): string {
  const styles = {
    primary: `background-color: ${colors.primary}; color: #ffffff; border: none;`,
    secondary: `background-color: transparent; color: ${colors.primary}; border: 2px solid ${colors.primary};`,
    ghost: `background-color: transparent; color: ${colors.text.secondary}; border: 1px solid ${colors.border.default};`,
  };

  return `
    <a href="${sanitizeUrl(url)}" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; ${styles[variant]} transition: opacity 0.2s;">
      ${escapeHtml(text)}
    </a>
  `;
}

function createFeatureListItem(text: string): string {
  return `
    <tr>
      <td style="padding: 8px 0;">
        <table cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="vertical-align: top; padding-right: 12px;">
              <div style="width: 20px; height: 20px; background-color: ${colors.primaryLight}; border-radius: 50%; text-align: center; line-height: 20px; color: ${colors.primary}; font-size: 12px;">&#10003;</div>
            </td>
            <td style="vertical-align: top; font-size: 15px; color: ${colors.text.secondary};">
              ${escapeHtml(text)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function createUrgencyBanner(message: string, variant: "warning" | "error" = "warning"): string {
  const bgColor = variant === "error" ? colors.accent.error : colors.accent.warning;
  const textColor = colors.text.inverse;

  return `
    <tr>
      <td style="padding: 16px 40px; background-color: ${bgColor}; text-align: center;">
        <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${textColor};">
          ${escapeHtml(message)}
        </p>
      </td>
    </tr>
  `;
}

function createQuickStartItem(
  icon: string,
  title: string,
  url: string,
  description: string
): string {
  return `
    <tr>
      <td style="padding: 16px 0;">
        <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
          <tr>
            <td style="vertical-align: top; padding-right: 16px; width: 48px;">
              <div style="width: 40px; height: 40px; background-color: ${colors.primaryLight}; border-radius: 8px; text-align: center; line-height: 40px; font-size: 20px;">${icon}</div>
            </td>
            <td style="vertical-align: top;">
              <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
                <a href="${sanitizeUrl(url)}" style="color: ${colors.text.primary}; text-decoration: none;">${escapeHtml(title)}</a>
              </h3>
              <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary};">
                ${escapeHtml(description)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function formatExpirationDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ============================================================================
// Email 1: Initial Invitation (Immediate)
// ============================================================================

export function getTeamInvite1InitialEmail(
  data: TeamInvite1InitialEmailData
): { subject: string; html: string } {
  const roleDisplay = getRoleDisplayName(data.role);
  const roleIcon = getRoleIcon(data.role);
  const features = getRoleFeatures(data.role);

  const subject = sanitizeSubject(
    `${data.inviterName} invited you to join ${data.organizationName} on RepWell`
  );

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 80px; height: 80px; margin: 0 auto 24px; background-color: ${colors.primaryLight}; border-radius: 50%; text-align: center; line-height: 80px;">
          <span style="font-size: 40px;">${roleIcon}</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: ${colors.text.primary}; line-height: 1.2;">
          You're invited to join ${escapeHtml(data.organizationName)}
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          ${escapeHtml(data.inviterName)} has invited you as a <strong>${roleDisplay}</strong>
        </p>
      </td>
    </tr>
    <!-- Main Content -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <p style="margin: 0 0 24px 0; font-size: 16px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          Join your team on RepWell to manage customer reviews, collect testimonials, and grow your reputation.
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          ${createButton("Accept Invitation", data.acceptUrl, "primary")}
        </div>
        <p style="margin: 0; font-size: 14px; color: ${colors.text.muted}; text-align: center;">
          This invitation expires on ${formatExpirationDate(data.expiresAt)}
        </p>
      </td>
    </tr>
    <!-- Role Features Section -->
    <tr>
      <td style="padding: 32px 40px; background-color: ${colors.background.subtle};">
        <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: ${colors.text.primary};">
          What you'll be able to do as a ${roleDisplay}:
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${features.map((f) => createFeatureListItem(f)).join("")}
        </table>
      </td>
    </tr>
    <!-- Footer Note -->
    <tr>
      <td style="padding: 24px 40px; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.muted}; text-align: center;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInTeamInviteEmailTemplate(
      content,
      data.unsubscribeUrl,
      `${data.inviterName} invited you to join ${data.organizationName} as a ${roleDisplay}`,
      data.organizationLogoUrl
    ),
  };
}

// ============================================================================
// Email 2: Reminder (Day 2)
// ============================================================================

export function getTeamInvite2ReminderEmail(
  data: TeamInvite2ReminderEmailData
): { subject: string; html: string } {
  const roleDisplay = getRoleDisplayName(data.role);
  const features = getRoleFeatures(data.role);

  const subject = sanitizeSubject(
    `Reminder: Your invitation to ${data.organizationName} is waiting`
  );

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.primaryLight}; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">&#128236;</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Your invitation is waiting
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          ${escapeHtml(data.inviterName)} is waiting for you to join ${escapeHtml(data.organizationName)}
        </p>
      </td>
    </tr>
    <!-- Main Content -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <p style="margin: 0 0 24px 0; font-size: 16px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          You were invited to join as a <strong>${roleDisplay}</strong>. Accept your invitation to get started with your team.
        </p>
        <div style="text-align: center; margin-bottom: 24px;">
          ${createButton("Accept Invitation", data.acceptUrl, "primary")}
        </div>
      </td>
    </tr>
    <!-- Quick Benefits -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-radius: 0;">
        <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          Quick reminder of what's waiting for you:
        </h3>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${features.slice(0, 3).map((f) => createFeatureListItem(f)).join("")}
        </table>
      </td>
    </tr>
    <!-- Expiration Notice -->
    <tr>
      <td style="padding: 24px 40px; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.muted}; text-align: center;">
          This invitation expires in ${data.daysUntilExpiration} days (${formatExpirationDate(data.expiresAt)})
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInTeamInviteEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Reminder: Your team invitation to ${data.organizationName} is waiting`,
      data.organizationLogoUrl
    ),
  };
}

// ============================================================================
// Email 3: Final Reminder with Urgency (Day 5)
// ============================================================================

export function getTeamInvite3FinalReminderEmail(
  data: TeamInvite3FinalReminderEmailData
): { subject: string; html: string } {
  const roleDisplay = getRoleDisplayName(data.role);

  const subject = sanitizeSubject(
    `Final reminder: Your ${data.organizationName} invitation expires soon`
  );

  const content = `
    <!-- Urgency Banner -->
    ${createUrgencyBanner(`Your invitation expires in ${data.daysUntilExpiration} days`, "warning")}
    <!-- Header -->
    <tr>
      <td style="padding: 40px 40px 24px 40px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.accent.warning}; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">&#9200;</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Don't miss out!
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Your invitation to join ${escapeHtml(data.organizationName)} is expiring soon
        </p>
      </td>
    </tr>
    <!-- Main Content -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <p style="margin: 0 0 24px 0; font-size: 16px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          ${escapeHtml(data.inviterName)} invited you to join as a <strong>${roleDisplay}</strong>. This is your final reminder before the invitation expires on ${formatExpirationDate(data.expiresAt)}.
        </p>
        <div style="text-align: center; margin-bottom: 16px;">
          ${createButton("Accept Now", data.acceptUrl, "primary")}
        </div>
      </td>
    </tr>
    <!-- What Happens If Expired -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary};">
          <strong>What happens if it expires?</strong><br/>
          You'll need to request a new invitation from ${escapeHtml(data.inviterName)} or another admin at ${escapeHtml(data.organizationName)}.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 24px 40px; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.muted}; text-align: center;">
          If you're having trouble, reply to this email for help.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInTeamInviteEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Final reminder: Your invitation to ${data.organizationName} expires in ${data.daysUntilExpiration} days`,
      data.organizationLogoUrl
    ),
  };
}

// ============================================================================
// Email 4: Welcome Email (On Accept) - Role-Specific
// ============================================================================

export function getTeamInvite4WelcomeEmail(
  data: TeamInvite4WelcomeEmailData
): { subject: string; html: string } {
  const roleDisplay = getRoleDisplayName(data.role);
  const roleIcon = getRoleIcon(data.role);

  const subject = sanitizeSubject(
    `Welcome to ${data.organizationName}! Here's how to get started`
  );

  // Build role-specific quick start items
  function buildQuickStartContent(): string {
    const items: string[] = [];

    if (data.role === "loan_officer") {
      items.push(
        createQuickStartItem(
          "&#11088;",
          "Collect Reviews",
          data.reviewsUrl || data.dashboardUrl,
          "Send survey requests to clients to collect reviews and testimonials."
        ),
        createQuickStartItem(
          "&#127942;",
          "Check Leaderboards",
          data.leaderboardUrl || data.dashboardUrl,
          "See how you rank against your team and track your review performance."
        ),
        createQuickStartItem(
          "&#128100;",
          "Complete Your Profile",
          data.profileUrl,
          "Add your photo and bio to personalize survey requests to clients."
        )
      );
    } else if (data.role === "manager") {
      items.push(
        createQuickStartItem(
          "&#128200;",
          "Team Analytics",
          data.teamAnalyticsUrl || data.dashboardUrl,
          "View team performance metrics, review trends, and NPS scores."
        ),
        createQuickStartItem(
          "&#128101;",
          "Manage Your Team",
          data.teamManagementUrl || data.dashboardUrl,
          "Oversee loan officer accounts and manage review approvals."
        ),
        createQuickStartItem(
          "&#128100;",
          "Complete Your Profile",
          data.profileUrl,
          "Set up your manager profile with photo and contact information."
        )
      );
    } else {
      items.push(
        createQuickStartItem(
          "&#128200;",
          "Explore Dashboard",
          data.dashboardUrl,
          "Access all organization settings, team management, and analytics."
        ),
        createQuickStartItem(
          "&#128100;",
          "Complete Your Profile",
          data.profileUrl,
          "Set up your admin profile with photo and contact information."
        )
      );
    }

    return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">${items.join("")}</table>`;
  }

  const quickStartContent = buildQuickStartContent();

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 80px; height: 80px; margin: 0 auto 24px; background-color: ${colors.primaryLight}; border-radius: 50%; text-align: center; line-height: 80px;">
          <span style="font-size: 40px;">${roleIcon}</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: ${colors.text.primary}; line-height: 1.2;">
          Welcome to ${escapeHtml(data.organizationName)}!
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          You're all set up as a ${roleDisplay}
        </p>
      </td>
    </tr>
    <!-- Main Content -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <p style="margin: 0 0 24px 0; font-size: 16px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          ${escapeHtml(data.inviteeEmail ? data.inviteeName : "You")}, welcome to the team! Here's how to get the most out of RepWell.
        </p>
        <div style="text-align: center;">
          ${createButton("Go to Dashboard", data.dashboardUrl, "primary")}
        </div>
      </td>
    </tr>
    <!-- Quick Start Section -->
    <tr>
      <td style="padding: 32px 40px; background-color: ${colors.background.subtle};">
        <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: ${colors.text.primary};">
          Quick Start Guide
        </h2>
        ${quickStartContent}
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 24px 40px; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.muted}; text-align: center;">
          Questions? Reply to this email or contact your admin.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInTeamInviteEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Welcome to ${data.organizationName}! Here's how to get started as a ${roleDisplay}`,
      data.organizationLogoUrl
    ),
  };
}

// ============================================================================
// Email 5: Expiration Notice (Day 14)
// ============================================================================

export function getTeamInvite5ExpirationEmail(
  data: TeamInvite5ExpirationEmailData
): { subject: string; html: string } {
  const roleDisplay = getRoleDisplayName(data.role);

  const subject = sanitizeSubject(
    `Your ${data.organizationName} invitation has expired`
  );

  const content = `
    <!-- Accent Bar (muted) -->
    <tr>
      <td style="height: 4px; background-color: ${colors.border.default};"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.background.muted}; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">&#128683;</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Your invitation has expired
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          The invitation to join ${escapeHtml(data.organizationName)} as a ${roleDisplay} is no longer valid
        </p>
      </td>
    </tr>
    <!-- Main Content -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <p style="margin: 0 0 24px 0; font-size: 16px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          Your invitation from ${escapeHtml(data.inviterName)} expired on ${formatExpirationDate(data.expiredAt)}. If you still want to join the team, you can request a new invitation.
        </p>
        ${
          data.canRequestNewInvite && data.requestNewInviteUrl
            ? `<div style="text-align: center;">
                ${createButton("Request New Invitation", data.requestNewInviteUrl, "primary")}
              </div>`
            : `<div style="text-align: center; padding: 16px 24px; background-color: ${colors.background.subtle}; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary};">
                  Contact ${escapeHtml(data.inviterName)} or another admin at ${escapeHtml(data.organizationName)} to request a new invitation.
                </p>
              </div>`
        }
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 24px 40px; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.muted}; text-align: center;">
          If you no longer wish to join, no action is needed.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInTeamInviteEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Your invitation to ${data.organizationName} has expired`,
      data.organizationLogoUrl
    ),
  };
}
