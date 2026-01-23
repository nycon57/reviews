/**
 * Abandoned Action Recovery Email Templates (S093)
 *
 * Recovers users who started but didn't complete key actions:
 *
 * Email 1 (1 hour after abandonment): Gentle, helpful reminder
 * Email 2 (24 hours after abandonment): More urgency, highlight value
 *
 * Action types:
 * - survey_creation: Started creating a survey template
 * - survey_send: Selected contacts but didn't send
 * - video_request: Started video testimonial request
 * - billing_upgrade: Visited pricing/upgrade page
 * - profile_completion: Started editing profile
 * - integration_setup: Started OAuth/integration setup
 */

import type {
  AbandonedSurveyCreationEmailData,
  AbandonedSurveySendEmailData,
  AbandonedVideoRequestEmailData,
  AbandonedBillingUpgradeEmailData,
  AbandonedProfileCompletionEmailData,
  AbandonedIntegrationSetupEmailData,
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
    .replace(/'/g, "&#039;")
    .replace(/`/g, "&#96;");
}

function sanitizeUrl(url: string): string {
  const allowedProtocols = ["http:", "https:", "mailto:"];
  try {
    const parsed = new URL(url);
    if (!allowedProtocols.includes(parsed.protocol)) {
      return "#";
    }

    // For http/https URLs, validate domain is from our application
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      const baseUrl = emailConfig.baseUrl;
      let allowedHostname: string;
      try {
        allowedHostname = new URL(baseUrl).hostname;
      } catch {
        allowedHostname = "localhost";
      }

      // Allow exact match or localhost for development
      if (
        parsed.hostname !== allowedHostname &&
        parsed.hostname !== "localhost"
      ) {
        console.warn(`Blocked external URL in email template: ${url}`);
        return "#";
      }
    }

    return parsed.href;
  } catch {
    return "#";
  }
}

function sanitizeSubject(subject: string): string {
  // eslint-disable-next-line no-control-regex
  return subject.replace(/[\x00-\x1F\x7F-\x9F\r\n]/g, "");
}

// ============================================================================
// Subject Line Variants
// ============================================================================

export const ABANDONED_ACTION_SUBJECT_LINES = {
  survey_creation_1: (firstName: string) =>
    `${firstName}, your survey is waiting`,
  survey_creation_2: (firstName: string) =>
    `${firstName}, finish your survey in 2 minutes`,
  survey_send_1: (contactCount: number) =>
    `${contactCount} contacts ready for your survey`,
  survey_send_2: () => `Your survey contacts are still waiting`,
  video_request_1: (firstName: string) =>
    `${firstName}, send that video request`,
  video_request_2: () => `Video testimonials = 4x more conversions`,
  billing_upgrade_1: (firstName: string) =>
    `${firstName}, still thinking about upgrading?`,
  billing_upgrade_2: (planName: string) =>
    `Unlock ${planName} features today`,
  profile_completion_1: (percent: number) =>
    `You're ${percent}% done with your profile`,
  profile_completion_2: (firstName: string) =>
    `${firstName}, complete profiles get 2x more reviews`,
  integration_setup_1: (integrationName: string) =>
    `Connect ${integrationName} in 30 seconds`,
  integration_setup_2: (integrationName: string) =>
    `Don't miss out on ${integrationName} sync`,
} as const;

// ============================================================================
// Base Email Wrapper
// ============================================================================

function wrapInRecoveryEmailTemplate(
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
                <a href="${sanitizeUrl(unsubscribeUrl)}" style="color: ${colors.text.muted}; text-decoration: underline;">Unsubscribe from recovery emails</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: ${colors.text.muted};">
                © ${new Date().getFullYear()} RepWell. All rights reserved.
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

function createProgressBar(completionPercent: number): string {
  const fillWidth = Math.min(100, Math.max(0, completionPercent));
  const progressColor =
    fillWidth >= 80
      ? colors.accent.success
      : fillWidth >= 50
        ? colors.accent.warning
        : colors.primary;

  return `
    <div style="margin: 16px 0;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-size: 14px; color: ${colors.text.secondary};">Progress</span>
        <span style="font-size: 14px; font-weight: 600; color: ${colors.text.primary};">${fillWidth}%</span>
      </div>
      <div style="background-color: ${colors.background.muted}; border-radius: 8px; height: 8px; overflow: hidden;">
        <div style="background-color: ${progressColor}; width: ${fillWidth}%; height: 100%; border-radius: 8px; transition: width 0.3s ease;"></div>
      </div>
    </div>
  `;
}

function createBenefitItem(
  icon: string,
  title: string,
  description: string
): string {
  return `
    <tr>
      <td style="padding: 12px 0;">
        <table cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="vertical-align: top; padding-right: 16px;">
              <div style="width: 40px; height: 40px; background-color: ${colors.primaryLight}; border-radius: 8px; text-align: center; line-height: 40px; font-size: 20px;">
                ${icon}
              </div>
            </td>
            <td style="vertical-align: top;">
              <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: ${colors.text.primary};">
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

function createStatCard(value: string, label: string): string {
  return `
    <td style="text-align: center; padding: 16px 12px; background-color: ${colors.background.subtle}; border-radius: 8px;">
      <div style="font-size: 28px; font-weight: 700; color: ${colors.primary}; line-height: 1.2;">
        ${escapeHtml(value)}
      </div>
      <div style="font-size: 12px; color: ${colors.text.secondary}; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
        ${escapeHtml(label)}
      </div>
    </td>
  `;
}

function createFeatureList(features: string[]): string {
  return features
    .map(
      (feature) => `
    <li style="margin-bottom: 8px; padding-left: 8px; color: ${colors.text.secondary}; font-size: 14px;">
      ${escapeHtml(feature)}
    </li>
  `
    )
    .join("");
}

// ============================================================================
// Survey Creation Recovery Emails
// ============================================================================

/**
 * Email 1: Gentle reminder 1 hour after starting survey creation
 */
export function getAbandonedSurveyCreation1Email(
  data: AbandonedSurveyCreationEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    ABANDONED_ACTION_SUBJECT_LINES.survey_creation_1(data.firstName)
  );

  const templateInfo = data.templateName
    ? `<p style="margin: 0 0 16px 0; font-size: 14px; color: ${colors.text.secondary};">
        You were creating: <strong style="color: ${colors.text.primary};">${escapeHtml(data.templateName)}</strong>
      </p>`
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
          <span style="font-size: 32px;">📋</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Pick up where you left off
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Your survey template is waiting for you
        </p>
      </td>
    </tr>
    <!-- Template Info -->
    <tr>
      <td style="padding: 0 40px 24px 40px; text-align: center;">
        ${templateInfo}
        <p style="margin: 0; font-size: 14px; color: ${colors.text.muted};">
          We saved your progress so you can continue anytime.
        </p>
      </td>
    </tr>
    <!-- Benefits -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
            Why finish your survey template:
          </h2>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${createBenefitItem("📊", "Track NPS Scores", "Measure client satisfaction over time")}
            ${createBenefitItem("💬", "Get Testimonials", "Turn happy clients into public advocates")}
            ${createBenefitItem("⚡", "Quick Setup", "Takes less than 2 minutes to complete")}
          </table>
        </div>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Continue Creating Survey", data.resumeUrl, "primary")}
      </td>
    </tr>
    <!-- Help Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          Need help? Reply to this email or check out our <a href="${sanitizeUrl(data.dashboardUrl + "/help")}" style="color: ${colors.primary}; text-decoration: underline;">survey setup guide</a>.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInRecoveryEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Your survey template is waiting, ${data.firstName}`
    ),
  };
}

/**
 * Email 2: More urgency 24 hours after starting survey creation
 */
export function getAbandonedSurveyCreation2Email(
  data: AbandonedSurveyCreationEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    ABANDONED_ACTION_SUBJECT_LINES.survey_creation_2(data.firstName)
  );

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.accent.warning} 0%, ${colors.primary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.accent.warning}20; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">⏱️</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          2 minutes to finish
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Complete your survey and start collecting feedback today
        </p>
      </td>
    </tr>
    <!-- Stats -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.primaryLight}20; border-radius: 12px; padding: 20px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: ${colors.text.secondary};">
            Users who complete surveys see
          </p>
          <table width="100%" cellpadding="8" cellspacing="0" role="presentation" style="margin-top: 12px;">
            <tr>
              ${createStatCard("3.2x", "More Reviews")}
              <td width="16"></td>
              ${createStatCard("40%", "Response Rate")}
              <td width="16"></td>
              ${createStatCard("+0.5", "Rating Boost")}
            </tr>
          </table>
        </div>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 16px 40px; text-align: center;">
        ${createButton("Finish My Survey", data.resumeUrl, "primary")}
      </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        <a href="${sanitizeUrl(data.createSurveyUrl)}" style="color: ${colors.text.secondary}; font-size: 14px; text-decoration: underline;">
          Or start a new survey from scratch
        </a>
      </td>
    </tr>
    <!-- Urgency Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          <strong>Pro tip:</strong> Send your first survey within a week to build momentum.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInRecoveryEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Finish your survey in 2 minutes`
    ),
  };
}

// ============================================================================
// Survey Send Recovery Emails
// ============================================================================

/**
 * Email 1: Gentle reminder 1 hour after selecting contacts
 */
export function getAbandonedSurveySend1Email(
  data: AbandonedSurveySendEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    ABANDONED_ACTION_SUBJECT_LINES.survey_send_1(data.contactsSelected)
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
          <span style="font-size: 32px;">📨</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Your contacts are ready
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          ${data.contactsSelected} ${data.contactsSelected === 1 ? "contact is" : "contacts are"} waiting for your survey
        </p>
      </td>
    </tr>
    <!-- Contact Count Highlight -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.primaryLight}20; border-radius: 12px; padding: 24px; text-align: center;">
          <div style="font-size: 48px; font-weight: 700; color: ${colors.primary}; line-height: 1;">
            ${data.contactsSelected}
          </div>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: ${colors.text.secondary};">
            ${data.contactsSelected === 1 ? "contact" : "contacts"} selected and ready to send
          </p>
        </div>
      </td>
    </tr>
    ${data.templateName ? `
    <!-- Template Info -->
    <tr>
      <td style="padding: 0 40px 24px 40px; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.muted};">
          Using template: <strong style="color: ${colors.text.primary};">${escapeHtml(data.templateName)}</strong>
        </p>
      </td>
    </tr>
    ` : ""}
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Send Survey Now", data.resumeUrl, "primary")}
        <p style="margin: 16px 0 0 0; font-size: 13px; color: ${colors.text.muted};">
          One click to reach all your contacts
        </p>
      </td>
    </tr>
    <!-- Help Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          Surveys sent within 48 hours of closing get the best response rates.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInRecoveryEmailTemplate(
      content,
      data.unsubscribeUrl,
      `${data.contactsSelected} contacts ready for your survey`
    ),
  };
}

/**
 * Email 2: More urgency 24 hours after selecting contacts
 */
export function getAbandonedSurveySend2Email(
  data: AbandonedSurveySendEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    ABANDONED_ACTION_SUBJECT_LINES.survey_send_2()
  );

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.accent.warning} 0%, ${colors.primary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.accent.warning}20; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">⏰</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Don't miss the window
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Response rates drop after 48 hours
        </p>
      </td>
    </tr>
    <!-- Stats -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
            Why send now:
          </h2>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${createBenefitItem("📈", "Higher Response Rate", "Clients respond best when the experience is fresh")}
            ${createBenefitItem("⭐", "Better Reviews", "Recent interactions lead to more detailed feedback")}
            ${createBenefitItem("🎯", "More Accurate", "Capture sentiment while it's still top of mind")}
          </table>
        </div>
      </td>
    </tr>
    <!-- Contact Reminder -->
    <tr>
      <td style="padding: 0 40px 24px 40px; text-align: center;">
        <p style="margin: 0; font-size: 16px; color: ${colors.text.primary};">
          <strong>${data.contactsSelected} ${data.contactsSelected === 1 ? "contact" : "contacts"}</strong> still waiting
        </p>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Send Survey Now", data.resumeUrl, "primary")}
      </td>
    </tr>
    <!-- Urgency Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          This is the last reminder we'll send about this survey.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInRecoveryEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Your survey contacts are still waiting`
    ),
  };
}

// ============================================================================
// Video Request Recovery Emails
// ============================================================================

/**
 * Email 1: Gentle reminder 1 hour after starting video request
 */
export function getAbandonedVideoRequest1Email(
  data: AbandonedVideoRequestEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    ABANDONED_ACTION_SUBJECT_LINES.video_request_1(data.firstName)
  );

  const customerInfo = data.customerName
    ? `<p style="margin: 0 0 16px 0; font-size: 14px; color: ${colors.text.secondary};">
        Requesting from: <strong style="color: ${colors.text.primary};">${escapeHtml(data.customerName)}</strong>
      </p>`
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
          <span style="font-size: 32px;">🎬</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Finish your video request
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Video testimonials are your most powerful marketing tool
        </p>
      </td>
    </tr>
    <!-- Customer Info -->
    <tr>
      <td style="padding: 0 40px 24px 40px; text-align: center;">
        ${customerInfo}
      </td>
    </tr>
    <!-- Benefits -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
            Why video testimonials work:
          </h2>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${createBenefitItem("📈", "4x More Conversions", "Video builds trust faster than text")}
            ${createBenefitItem("🤝", "Personal Connection", "Prospects see real people, not just words")}
            ${createBenefitItem("📱", "Social Ready", "Share across LinkedIn, Facebook, and more")}
          </table>
        </div>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Continue Request", data.resumeUrl, "primary")}
        <p style="margin: 16px 0 0 0; font-size: 13px; color: ${colors.text.muted};">
          Takes less than 60 seconds to complete
        </p>
      </td>
    </tr>
    <!-- Help Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          Need help with video testimonials? Check our <a href="${sanitizeUrl(data.dashboardUrl + "/help/video")}" style="color: ${colors.primary}; text-decoration: underline;">video best practices guide</a>.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInRecoveryEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Video testimonials are your most powerful marketing tool`
    ),
  };
}

/**
 * Email 2: More urgency 24 hours after starting video request
 */
export function getAbandonedVideoRequest2Email(
  data: AbandonedVideoRequestEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    ABANDONED_ACTION_SUBJECT_LINES.video_request_2()
  );

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.accent.warning} 0%, ${colors.primary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.accent.warning}20; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">🚀</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Video = 4x more conversions
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Don't miss out on your most powerful marketing tool
        </p>
      </td>
    </tr>
    <!-- Stats -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.primaryLight}20; border-radius: 12px; padding: 20px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: ${colors.text.secondary};">
            Video testimonials outperform written reviews
          </p>
          <table width="100%" cellpadding="8" cellspacing="0" role="presentation" style="margin-top: 12px;">
            <tr>
              ${createStatCard("4x", "Conversions")}
              <td width="16"></td>
              ${createStatCard("2x", "Trust")}
              <td width="16"></td>
              ${createStatCard("85%", "Recall")}
            </tr>
          </table>
        </div>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 16px 40px; text-align: center;">
        ${createButton("Send Video Request", data.resumeUrl, "primary")}
      </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        <a href="${sanitizeUrl(data.createRequestUrl)}" style="color: ${colors.text.secondary}; font-size: 14px; text-decoration: underline;">
          Or start a new video request
        </a>
      </td>
    </tr>
    <!-- Urgency Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          <strong>Top performers</strong> collect 2+ video testimonials per month.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInRecoveryEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Video testimonials = 4x more conversions`
    ),
  };
}

// ============================================================================
// Billing Upgrade Recovery Emails
// ============================================================================

/**
 * Email 1: Gentle reminder 1 hour after visiting pricing
 */
export function getAbandonedBillingUpgrade1Email(
  data: AbandonedBillingUpgradeEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    ABANDONED_ACTION_SUBJECT_LINES.billing_upgrade_1(data.firstName)
  );

  const planInfo = data.targetPlan
    ? `<p style="margin: 0 0 16px 0; font-size: 14px; color: ${colors.text.secondary};">
        You were looking at: <strong style="color: ${colors.primary};">${escapeHtml(data.targetPlan)}</strong>
      </p>`
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
          <span style="font-size: 32px;">💎</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Still considering an upgrade?
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          We noticed you were exploring our plans
        </p>
      </td>
    </tr>
    <!-- Plan Info -->
    <tr>
      <td style="padding: 0 40px 24px 40px; text-align: center;">
        ${planInfo}
      </td>
    </tr>
    ${data.featuresHighlight && data.featuresHighlight.length > 0 ? `
    <!-- Features Highlight -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
            What you'll unlock:
          </h2>
          <ul style="margin: 0; padding-left: 20px; list-style-type: disc;">
            ${createFeatureList(data.featuresHighlight)}
          </ul>
        </div>
      </td>
    </tr>
    ` : ""}
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 16px 40px; text-align: center;">
        ${createButton("View Plans", data.pricingUrl, "primary")}
      </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        <a href="${sanitizeUrl(data.dashboardUrl + "/support")}" style="color: ${colors.text.secondary}; font-size: 14px; text-decoration: underline;">
          Have questions? Talk to our team
        </a>
      </td>
    </tr>
    <!-- Help Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          No pressure - upgrade when you're ready. We're here if you have questions.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInRecoveryEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Still considering an upgrade, ${data.firstName}?`
    ),
  };
}

/**
 * Email 2: More urgency 24 hours after visiting pricing
 */
export function getAbandonedBillingUpgrade2Email(
  data: AbandonedBillingUpgradeEmailData
): { subject: string; html: string } {
  const planName = data.targetPlan || "Premium";
  const subject = sanitizeSubject(
    ABANDONED_ACTION_SUBJECT_LINES.billing_upgrade_2(planName)
  );

  const specialOfferHtml =
    data.specialOffer && data.specialOffer.discountPercent
      ? `
    <!-- Special Offer -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.accent.success}15; border: 2px solid ${colors.accent.success}; border-radius: 12px; padding: 24px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: ${colors.accent.success};">
            🎉 SPECIAL OFFER
          </p>
          <p style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
            ${data.specialOffer.discountPercent}% OFF
          </p>
          ${data.specialOffer.validUntil ? `
          <p style="margin: 0; font-size: 13px; color: ${colors.text.muted};">
            Valid until ${escapeHtml(data.specialOffer.validUntil)}
          </p>
          ` : ""}
        </div>
      </td>
    </tr>
    `
      : "";

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.accent.success} 0%, ${colors.primary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.accent.success}20; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">⚡</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Unlock ${escapeHtml(planName)} today
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Get more reviews, better insights, and faster growth
        </p>
      </td>
    </tr>
    ${specialOfferHtml}
    <!-- Benefits -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
            Why teams upgrade:
          </h2>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${createBenefitItem("📊", "Advanced Analytics", "Deeper insights into your performance")}
            ${createBenefitItem("🔗", "More Integrations", "Connect your entire tech stack")}
            ${createBenefitItem("👥", "Team Features", "Leaderboards, coaching, and more")}
          </table>
        </div>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Upgrade Now", data.upgradeUrl, "primary")}
      </td>
    </tr>
    <!-- Urgency Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          Upgrade risk-free with our 30-day money-back guarantee.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInRecoveryEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Unlock ${planName} features today`
    ),
  };
}

// ============================================================================
// Profile Completion Recovery Emails
// ============================================================================

/**
 * Email 1: Gentle reminder 1 hour after starting profile edits
 */
export function getAbandonedProfileCompletion1Email(
  data: AbandonedProfileCompletionEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    ABANDONED_ACTION_SUBJECT_LINES.profile_completion_1(data.completionPercent)
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
          <span style="font-size: 32px;">👤</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          You're ${data.completionPercent}% there!
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Finish your profile to get more reviews
        </p>
      </td>
    </tr>
    <!-- Progress Bar -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        ${createProgressBar(data.completionPercent)}
      </td>
    </tr>
    ${data.fieldsIncomplete && data.fieldsIncomplete.length > 0 ? `
    <!-- Missing Fields -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
            Quick wins remaining:
          </h2>
          <ul style="margin: 0; padding-left: 20px; list-style-type: disc;">
            ${createFeatureList(data.fieldsIncomplete)}
          </ul>
        </div>
      </td>
    </tr>
    ` : ""}
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Complete My Profile", data.profileUrl, "primary")}
        <p style="margin: 16px 0 0 0; font-size: 13px; color: ${colors.text.muted};">
          Takes less than 5 minutes
        </p>
      </td>
    </tr>
    <!-- Help Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          Complete profiles build trust and attract more clients.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInRecoveryEmailTemplate(
      content,
      data.unsubscribeUrl,
      `You're ${data.completionPercent}% done with your profile`
    ),
  };
}

/**
 * Email 2: More urgency 24 hours after starting profile edits
 */
export function getAbandonedProfileCompletion2Email(
  data: AbandonedProfileCompletionEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    ABANDONED_ACTION_SUBJECT_LINES.profile_completion_2(data.firstName)
  );

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.accent.warning} 0%, ${colors.primary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.accent.warning}20; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">⭐</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Complete profiles get 2x more reviews
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Don't let an incomplete profile hold you back
        </p>
      </td>
    </tr>
    <!-- Progress Bar -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        ${createProgressBar(data.completionPercent)}
      </td>
    </tr>
    <!-- Stats -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.primaryLight}20; border-radius: 12px; padding: 20px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: ${colors.text.secondary};">
            Complete profiles on RepWell see
          </p>
          <table width="100%" cellpadding="8" cellspacing="0" role="presentation" style="margin-top: 12px;">
            <tr>
              ${createStatCard(data.benefitStats?.moreInquiries || "2x", "Reviews")}
              <td width="16"></td>
              ${createStatCard(data.benefitStats?.higherTrust || "3x", "Trust")}
              <td width="16"></td>
              ${createStatCard("+40%", "Responses")}
            </tr>
          </table>
        </div>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Finish My Profile", data.profileUrl, "primary")}
      </td>
    </tr>
    <!-- Urgency Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          <strong>Just ${100 - data.completionPercent}% left to go!</strong> You're almost there.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInRecoveryEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Complete profiles get 2x more reviews`
    ),
  };
}

// ============================================================================
// Integration Setup Recovery Emails
// ============================================================================

/**
 * Email 1: Gentle reminder 1 hour after starting integration setup
 */
export function getAbandonedIntegrationSetup1Email(
  data: AbandonedIntegrationSetupEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    ABANDONED_ACTION_SUBJECT_LINES.integration_setup_1(
      data.integrationDisplayName
    )
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
          <span style="font-size: 32px;">🔗</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Connect ${escapeHtml(data.integrationDisplayName)}
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          We noticed you started the connection process
        </p>
      </td>
    </tr>
    ${data.integrationBenefits && data.integrationBenefits.length > 0 ? `
    <!-- Benefits -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
            What you'll get with ${escapeHtml(data.integrationDisplayName)}:
          </h2>
          <ul style="margin: 0; padding-left: 20px; list-style-type: disc;">
            ${createFeatureList(data.integrationBenefits)}
          </ul>
        </div>
      </td>
    </tr>
    ` : `
    <!-- Generic Benefits -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
            Why connect integrations:
          </h2>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${createBenefitItem("🔄", "Auto-Sync", "Reviews sync automatically to your dashboard")}
            ${createBenefitItem("⚡", "Save Time", "No more manual importing or copying")}
            ${createBenefitItem("📊", "Unified View", "See all your data in one place")}
          </table>
        </div>
      </td>
    </tr>
    `}
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton(`Connect ${data.integrationDisplayName}`, data.resumeUrl, "primary")}
        <p style="margin: 16px 0 0 0; font-size: 13px; color: ${colors.text.muted};">
          Secure connection via OAuth - takes 30 seconds
        </p>
      </td>
    </tr>
    <!-- Help Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          ${data.setupGuideUrl ? `
          Need help? Check our <a href="${sanitizeUrl(data.setupGuideUrl)}" style="color: ${colors.primary}; text-decoration: underline;">${escapeHtml(data.integrationDisplayName)} setup guide</a>.
          ` : `
          Need help? Reply to this email and our team will assist you.
          `}
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInRecoveryEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Connect ${data.integrationDisplayName} in 30 seconds`
    ),
  };
}

/**
 * Email 2: More urgency 24 hours after starting integration setup
 */
export function getAbandonedIntegrationSetup2Email(
  data: AbandonedIntegrationSetupEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    ABANDONED_ACTION_SUBJECT_LINES.integration_setup_2(
      data.integrationDisplayName
    )
  );

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.accent.warning} 0%, ${colors.primary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.accent.warning}20; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">⚠️</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Missing out on ${escapeHtml(data.integrationDisplayName)} sync
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Your reviews and data aren't syncing yet
        </p>
      </td>
    </tr>
    <!-- Benefits -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
            What you're missing without ${escapeHtml(data.integrationDisplayName)}:
          </h2>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${createBenefitItem("📥", "Auto-Import Reviews", "Reviews appear in your dashboard automatically")}
            ${createBenefitItem("💬", "Quick Responses", "Respond to reviews from one place")}
            ${createBenefitItem("📊", "Complete Analytics", "See your full reputation picture")}
          </table>
        </div>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 16px 40px; text-align: center;">
        ${createButton(`Connect ${data.integrationDisplayName}`, data.resumeUrl, "primary")}
      </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        <a href="${sanitizeUrl(data.integrationsUrl)}" style="color: ${colors.text.secondary}; font-size: 14px; text-decoration: underline;">
          View all integrations
        </a>
      </td>
    </tr>
    <!-- Urgency Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          We use secure OAuth - we never see or store your password.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInRecoveryEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Don't miss out on ${data.integrationDisplayName} sync`
    ),
  };
}

// ============================================================================
// Email Template Dispatch Function
// ============================================================================

/**
 * Gets the appropriate email template based on action type and email number
 */
export function getAbandonedActionRecoveryEmail(
  actionType: string,
  emailNumber: 1 | 2,
  data:
    | AbandonedSurveyCreationEmailData
    | AbandonedSurveySendEmailData
    | AbandonedVideoRequestEmailData
    | AbandonedBillingUpgradeEmailData
    | AbandonedProfileCompletionEmailData
    | AbandonedIntegrationSetupEmailData
): { subject: string; html: string } {
  switch (actionType) {
    case "survey_creation":
      return emailNumber === 1
        ? getAbandonedSurveyCreation1Email(
            data as AbandonedSurveyCreationEmailData
          )
        : getAbandonedSurveyCreation2Email(
            data as AbandonedSurveyCreationEmailData
          );
    case "survey_send":
      return emailNumber === 1
        ? getAbandonedSurveySend1Email(data as AbandonedSurveySendEmailData)
        : getAbandonedSurveySend2Email(data as AbandonedSurveySendEmailData);
    case "video_request":
      return emailNumber === 1
        ? getAbandonedVideoRequest1Email(data as AbandonedVideoRequestEmailData)
        : getAbandonedVideoRequest2Email(
            data as AbandonedVideoRequestEmailData
          );
    case "billing_upgrade":
      return emailNumber === 1
        ? getAbandonedBillingUpgrade1Email(
            data as AbandonedBillingUpgradeEmailData
          )
        : getAbandonedBillingUpgrade2Email(
            data as AbandonedBillingUpgradeEmailData
          );
    case "profile_completion":
      return emailNumber === 1
        ? getAbandonedProfileCompletion1Email(
            data as AbandonedProfileCompletionEmailData
          )
        : getAbandonedProfileCompletion2Email(
            data as AbandonedProfileCompletionEmailData
          );
    case "integration_setup":
      return emailNumber === 1
        ? getAbandonedIntegrationSetup1Email(
            data as AbandonedIntegrationSetupEmailData
          )
        : getAbandonedIntegrationSetup2Email(
            data as AbandonedIntegrationSetupEmailData
          );
    default:
      throw new Error(`Unknown abandoned action type: ${actionType}`);
  }
}
