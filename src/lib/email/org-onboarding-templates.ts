/**
 * Organization Onboarding Email Sequence Templates
 *
 * 6-email onboarding sequence for organization admins:
 * - Email 1 (Immediate): Org created confirmation + admin getting started guide
 * - Email 2 (Day 1): Branding setup - upload logo, set colors, customize survey
 * - Email 3 (Day 2): Team setup - invite loan officers and managers
 * - Email 4 (Day 4): Integration guide - connect Google Business Profile
 * - Email 5 (Day 6): Billing setup reminder (conditional - skip if subscribed)
 * - Email 6 (Day 10): Advanced features - leaderboards, reports, automation
 */

import type {
  OrgOnboarding1WelcomeEmailData,
  OrgOnboarding2BrandingEmailData,
  OrgOnboarding3TeamEmailData,
  OrgOnboarding4IntegrationsEmailData,
  OrgOnboarding5BillingEmailData,
  OrgOnboarding6AdvancedEmailData,
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
// Base Email Wrapper
// ============================================================================

function wrapInOrgOnboardingEmailTemplate(
  content: string,
  unsubscribeUrl: string,
  preheaderText?: string
): string {
  const preheader = preheaderText
    ? `<span style="display: none; font-size: 1px; color: #fafafa; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">${escapeHtml(preheaderText)}</span>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RepWell</title>
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
              <img src="${emailConfig.baseUrl}/images/repwell-logo.png" alt="RepWell" width="140" style="display: block;" />
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
                <a href="${sanitizeUrl(unsubscribeUrl)}" style="color: ${colors.text.muted}; text-decoration: underline;">Unsubscribe from onboarding emails</a>
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

function createSetupItem(
  icon: string,
  title: string,
  description: string,
  isComplete: boolean = false
): string {
  const checkIcon = isComplete
    ? `<div style="width: 40px; height: 40px; background-color: ${colors.accent.success}; border-radius: 50%; text-align: center; line-height: 40px; color: #ffffff; font-size: 20px;">&#10003;</div>`
    : `<div style="width: 40px; height: 40px; background-color: ${colors.primaryLight}; border-radius: 8px; text-align: center; line-height: 40px; font-size: 20px;">${icon}</div>`;

  return `
    <tr>
      <td style="padding: 16px 0;">
        <table cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="vertical-align: top; padding-right: 16px;">
              ${checkIcon}
            </td>
            <td style="vertical-align: top;">
              <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
                ${escapeHtml(title)}
              </h3>
              <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; line-height: 1.5;">
                ${escapeHtml(description)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function getStepIndicatorColor(step: number, currentStep: number): string {
  if (step === currentStep) return colors.primary;
  if (step < currentStep) return colors.secondary;
  return colors.border.default;
}

function createStepIndicator(currentStep: number, totalSteps: number): string {
  const steps = [];
  for (let i = 1; i <= totalSteps; i++) {
    const bgColor = getStepIndicatorColor(i, currentStep);
    steps.push(
      `<td style="padding: 0 4px;">
        <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${bgColor};"></div>
      </td>`
    );
  }
  return `
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto;">
      <tr>${steps.join("")}</tr>
    </table>
  `;
}

function createProgressBar(percent: number): string {
  const width = Math.min(Math.max(percent, 0), 100);
  return `
    <div style="background-color: ${colors.border.subtle}; border-radius: 8px; height: 8px; overflow: hidden;">
      <div style="background-color: ${colors.primary}; height: 100%; width: ${width}%; border-radius: 8px;"></div>
    </div>
    <p style="margin: 8px 0 0 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center;">
      ${width}% setup complete
    </p>
  `;
}

function createFeatureCard(
  icon: string,
  title: string,
  description: string,
  url: string
): string {
  return `
    <td width="48%" style="vertical-align: top;">
      <a href="${sanitizeUrl(url)}" style="text-decoration: none; display: block;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px; text-align: center; height: 100%; border: 1px solid ${colors.border.subtle};">
          <div style="font-size: 40px; margin-bottom: 16px;">${icon}</div>
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
            ${escapeHtml(title)}
          </h3>
          <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; line-height: 1.5;">
            ${escapeHtml(description)}
          </p>
        </div>
      </a>
    </td>
  `;
}

// ============================================================================
// Email 1: Org Created + Getting Started (Immediate)
// ============================================================================

export function getOrgOnboarding1WelcomeEmail(
  data: OrgOnboarding1WelcomeEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `Welcome to RepWell, ${data.adminName}! Your organization is ready`
  );

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 32px 40px; text-align: center;">
        <div style="width: 80px; height: 80px; margin: 0 auto 24px; background-color: ${colors.primaryLight}; border-radius: 50%; text-align: center; line-height: 80px;">
          <span style="font-size: 40px;">&#127881;</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: ${colors.text.primary}; line-height: 1.2;">
          Welcome to RepWell, ${escapeHtml(data.adminName)}!
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Your ${escapeHtml(data.organizationName)} account is ready to go
        </p>
      </td>
    </tr>
    <!-- Main Content -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <p style="margin: 0 0 24px 0; font-size: 16px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          As an admin, you have full control over your organization's reputation management platform. Let's get you set up for success!
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          ${createButton("Go to Dashboard", data.dashboardUrl, "primary")}
        </div>
      </td>
    </tr>
    <!-- Getting Started Section -->
    <tr>
      <td style="padding: 32px 40px; background-color: ${colors.background.subtle};">
        <h2 style="margin: 0 0 24px 0; font-size: 18px; font-weight: 600; color: ${colors.text.primary}; text-align: center;">
          Your Setup Checklist
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${createSetupItem("&#127912;", "Set up your branding", "Upload your logo and customize colors to match your brand")}
          ${createSetupItem("&#128101;", "Invite your team", "Add loan officers and managers to start collecting reviews")}
          ${createSetupItem("&#128279;", "Connect Google Business Profile", "Sync your reviews and respond from one place")}
          ${createSetupItem("&#128179;", "Choose your plan", "Select the plan that fits your team's needs")}
        </table>
      </td>
    </tr>
    <!-- Help Resources -->
    <tr>
      <td style="padding: 32px 40px; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0 0 16px 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center;">
          Need help getting started?
        </p>
        <div style="text-align: center;">
          ${createButton("Visit Help Center", data.helpCenterUrl, "secondary")}
        </div>
      </td>
    </tr>
    <!-- Sequence Progress -->
    <tr>
      <td style="padding: 24px 40px; text-align: center; border-top: 1px solid ${colors.border.subtle};">
        ${createStepIndicator(1, 6)}
        <p style="margin: 12px 0 0 0; font-size: 12px; color: ${colors.text.muted};">
          Email 1 of 6 in your admin onboarding series
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInOrgOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Welcome to RepWell! Your ${data.organizationName} account is ready.`
    ),
  };
}

// ============================================================================
// Email 2: Branding Setup (Day 1)
// ============================================================================

export function getOrgOnboarding2BrandingEmail(
  data: OrgOnboarding2BrandingEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `${data.adminName}, make RepWell your own with custom branding`
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
          <span style="font-size: 32px;">&#127912;</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Make it yours with custom branding
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Your surveys and emails should feel like they come from ${escapeHtml(data.organizationName)}
        </p>
      </td>
    </tr>
    <!-- Progress Bar -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        ${createProgressBar(data.setupProgress)}
      </td>
    </tr>
    <!-- Branding Checklist -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
            Branding checklist
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${createSetupItem("&#128247;", "Upload your logo", "Appears in surveys, emails, and review widgets", data.hasLogo)}
            ${createSetupItem("&#127752;", "Set your brand colors", "Customize the look to match your company", data.hasCustomColor)}
          </table>
        </div>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Customize Branding", data.brandingUrl, "primary")}
        <div style="margin-top: 16px;">
          ${createButton("Preview Survey", data.surveyPreviewUrl, "ghost")}
        </div>
      </td>
    </tr>
    <!-- Why It Matters -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.primaryLight}; border-left: 4px solid ${colors.primary};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.primary};">
          <strong>Why branding matters:</strong> Surveys with custom branding see 35% higher completion rates. Clients are more likely to respond when they recognize your company.
        </p>
      </td>
    </tr>
    <!-- Sequence Progress -->
    <tr>
      <td style="padding: 24px 40px; text-align: center; border-top: 1px solid ${colors.border.subtle};">
        ${createStepIndicator(2, 6)}
        <p style="margin: 12px 0 0 0; font-size: 12px; color: ${colors.text.muted};">
          Email 2 of 6 in your admin onboarding series
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInOrgOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Customize your branding to boost survey completion rates by 35%."
    ),
  };
}

// ============================================================================
// Email 3: Team Setup (Day 2)
// ============================================================================

export function getOrgOnboarding3TeamEmail(
  data: OrgOnboarding3TeamEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `Ready to invite your team to ${data.organizationName}?`
  );

  const teamCountText =
    data.teamCount > 0
      ? `You have ${data.teamCount} team member${data.teamCount === 1 ? "" : "s"} so far.`
      : "You haven't invited anyone yet.";

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.primaryLight}; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">&#128101;</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Build your team
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          ${teamCountText}
        </p>
      </td>
    </tr>
    <!-- Progress Bar -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        ${createProgressBar(data.setupProgress)}
      </td>
    </tr>
    <!-- Team Roles -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
            Who can you invite?
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${createSetupItem("&#128119;", "Loan Officers", "Send surveys, collect reviews, and build their reputation")}
            ${createSetupItem("&#128188;", "Managers", "Oversee team performance and approve reviews")}
            ${createSetupItem("&#128736;", "Admins", "Full access to settings, billing, and team management")}
          </table>
        </div>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Invite Team Members", data.inviteUrl, "primary")}
        <div style="margin-top: 16px;">
          ${createButton("Manage Team", data.teamUrl, "ghost")}
        </div>
      </td>
    </tr>
    <!-- Pro Tip -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.primaryLight}; border-left: 4px solid ${colors.primary};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.primary};">
          <strong>Pro tip:</strong> Invite your top performers first! They'll help set the standard and can mentor others on getting great reviews.
        </p>
      </td>
    </tr>
    <!-- Sequence Progress -->
    <tr>
      <td style="padding: 24px 40px; text-align: center; border-top: 1px solid ${colors.border.subtle};">
        ${createStepIndicator(3, 6)}
        <p style="margin: 12px 0 0 0; font-size: 12px; color: ${colors.text.muted};">
          Email 3 of 6 in your admin onboarding series
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInOrgOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Invite your loan officers and managers to start collecting reviews."
    ),
  };
}

// ============================================================================
// Email 4: Integrations - Google Business Profile (Day 4)
// ============================================================================

export function getOrgOnboarding4IntegrationsEmail(
  data: OrgOnboarding4IntegrationsEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `Connect Google Business Profile to ${data.organizationName}`
  );

  const connectionStatus = data.hasGoogleConnected
    ? `<div style="background-color: ${colors.accent.success}20; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
        <span style="color: ${colors.accent.success}; font-size: 24px;">&#10003;</span>
        <p style="margin: 8px 0 0 0; font-size: 14px; font-weight: 600; color: ${colors.accent.success};">
          Google Business Profile connected!
        </p>
      </div>`
    : "";

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.primaryLight}; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">&#128279;</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Supercharge with Google
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Connect your Google Business Profile to sync reviews automatically
        </p>
      </td>
    </tr>
    <!-- Progress Bar -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        ${createProgressBar(data.setupProgress)}
      </td>
    </tr>
    <!-- Connection Status -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        ${connectionStatus}
      </td>
    </tr>
    <!-- Benefits -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
            Why connect Google?
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: ${colors.secondary}; margin-right: 8px;">&#10003;</span>
                <span style="color: ${colors.text.secondary};">Auto-sync all Google reviews to your dashboard</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: ${colors.secondary}; margin-right: 8px;">&#10003;</span>
                <span style="color: ${colors.text.secondary};">Respond to reviews without leaving RepWell</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: ${colors.secondary}; margin-right: 8px;">&#10003;</span>
                <span style="color: ${colors.text.secondary};">Track Google ratings alongside survey feedback</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: ${colors.secondary}; margin-right: 8px;">&#10003;</span>
                <span style="color: ${colors.text.secondary};">Get alerts for new Google reviews instantly</span>
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${data.hasGoogleConnected ? createButton("View All Integrations", data.integrationsUrl, "primary") : createButton("Connect Google Business", data.googleConnectUrl, "primary")}
        ${!data.hasGoogleConnected ? `<div style="margin-top: 16px;">${createButton("Skip for now", data.integrationsUrl, "ghost")}</div>` : ""}
      </td>
    </tr>
    <!-- Sequence Progress -->
    <tr>
      <td style="padding: 24px 40px; text-align: center; border-top: 1px solid ${colors.border.subtle};">
        ${createStepIndicator(4, 6)}
        <p style="margin: 12px 0 0 0; font-size: 12px; color: ${colors.text.muted};">
          Email 4 of 6 in your admin onboarding series
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInOrgOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Connect Google Business Profile to sync reviews automatically."
    ),
  };
}

// ============================================================================
// Email 5: Billing Setup (Day 6) - Conditional
// ============================================================================

export function getOrgOnboarding5BillingEmail(
  data: OrgOnboarding5BillingEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `${data.adminName}, unlock full access to RepWell`
  );

  const trialWarning =
    data.trialEndsAt && data.daysRemaining !== undefined
      ? `<div style="background-color: ${colors.accent.warning}20; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 14px; color: ${colors.text.primary};">
            <strong>Your trial ends in ${data.daysRemaining} day${data.daysRemaining === 1 ? "" : "s"}</strong>
          </p>
        </div>`
      : "";

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.primaryLight}; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">&#128179;</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Unlock your full potential
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Choose a plan to keep your reputation growing
        </p>
      </td>
    </tr>
    <!-- Trial Warning -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        ${trialWarning}
      </td>
    </tr>
    <!-- Progress Bar -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        ${createProgressBar(data.setupProgress)}
      </td>
    </tr>
    <!-- Current Plan -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: ${colors.text.muted}; text-transform: uppercase; letter-spacing: 0.5px;">
            Current Plan
          </p>
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
            ${escapeHtml(data.currentPlan)}
          </p>
        </div>
      </td>
    </tr>
    <!-- What You Get -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          What's included with a paid plan:
        </h3>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: ${colors.secondary}; margin-right: 8px;">&#10003;</span>
              <span style="color: ${colors.text.secondary};">Unlimited surveys and review requests</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: ${colors.secondary}; margin-right: 8px;">&#10003;</span>
              <span style="color: ${colors.text.secondary};">Advanced analytics and reporting</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: ${colors.secondary}; margin-right: 8px;">&#10003;</span>
              <span style="color: ${colors.text.secondary};">Team leaderboards and gamification</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: ${colors.secondary}; margin-right: 8px;">&#10003;</span>
              <span style="color: ${colors.text.secondary};">Priority support from our team</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("View Plans & Pricing", data.pricingUrl, "primary")}
        <div style="margin-top: 16px;">
          ${createButton("Manage Billing", data.billingUrl, "ghost")}
        </div>
      </td>
    </tr>
    <!-- Sequence Progress -->
    <tr>
      <td style="padding: 24px 40px; text-align: center; border-top: 1px solid ${colors.border.subtle};">
        ${createStepIndicator(5, 6)}
        <p style="margin: 12px 0 0 0; font-size: 12px; color: ${colors.text.muted};">
          Email 5 of 6 in your admin onboarding series
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInOrgOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Choose a plan to unlock unlimited surveys, analytics, and more."
    ),
  };
}

// ============================================================================
// Email 6: Advanced Features (Day 10)
// ============================================================================

export function getOrgOnboarding6AdvancedEmail(
  data: OrgOnboarding6AdvancedEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `${data.adminName}, discover advanced features in RepWell`
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
          <span style="font-size: 32px;">&#128640;</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Level up with advanced features
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          You've got the basics down. Now let's supercharge your reputation.
        </p>
      </td>
    </tr>
    <!-- Progress Bar -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        ${createProgressBar(data.setupProgress)}
      </td>
    </tr>
    <!-- Feature Cards -->
    <tr>
      <td style="padding: 0 40px 16px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            ${createFeatureCard("&#127942;", "Leaderboards", "Motivate your team with rankings and achievements", data.leaderboardsUrl)}
            <td width="4%"></td>
            ${createFeatureCard("&#128202;", "Reports", "Generate insights to share with leadership", data.reportsUrl)}
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            ${createFeatureCard("&#9889;", "Automation", "Set up automated survey triggers and reminders", data.automationUrl)}
            <td width="4%"></td>
            ${createFeatureCard("&#128200;", "Analytics", "Deep dive into your performance metrics", data.analyticsUrl)}
          </tr>
        </table>
      </td>
    </tr>
    <!-- Final CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Explore All Features", data.dashboardUrl, "primary")}
      </td>
    </tr>
    <!-- Final Message -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.primaryLight}; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          That's the end of your onboarding series! &#127881;
        </p>
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary};">
          We're here whenever you need us. Just reply to any email or reach out to support.
        </p>
      </td>
    </tr>
    <!-- Sequence Progress -->
    <tr>
      <td style="padding: 24px 40px; text-align: center; border-top: 1px solid ${colors.border.subtle};">
        ${createStepIndicator(6, 6)}
        <p style="margin: 12px 0 0 0; font-size: 12px; color: ${colors.text.muted};">
          Email 6 of 6 in your admin onboarding series
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInOrgOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Discover leaderboards, reports, automation, and more advanced features."
    ),
  };
}
