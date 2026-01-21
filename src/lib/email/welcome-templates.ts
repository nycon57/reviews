/**
 * Welcome Sequence Email Templates
 *
 * 5-email welcome sequence for new users:
 * - Email 1 (Immediate): Welcome + deliver access
 * - Email 2 (Day 1): Profile setup quick win
 * - Email 3 (Day 3): Feature highlight - first action
 * - Email 4 (Day 5): Social proof - customer success
 * - Email 5 (Day 7): Core value - metrics preview
 */

import type {
  Welcome1AccessEmailData,
  Welcome2ProfileEmailData,
  Welcome3FirstActionEmailData,
  Welcome4SocialProofEmailData,
  Welcome5MetricsEmailData,
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
// A/B Test Subject Line Variants
// ============================================================================

export const WELCOME_EMAIL_VARIANTS = {
  email_1: {
    A: (firstName: string, orgName: string) =>
      `Welcome to RepWell, ${firstName}! Your ${orgName} account is ready`,
    B: (firstName: string, _orgName: string) =>
      `${firstName}, you're in! Let's build your reputation`,
  },
  email_3: {
    A: (firstName: string) =>
      `${firstName}, ready to collect your first review?`,
    B: (firstName: string) =>
      `One quick action can transform your reputation, ${firstName}`,
  },
} as const;

// ============================================================================
// Base Email Wrapper
// ============================================================================

function wrapInWelcomeEmailTemplate(
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
                <a href="${sanitizeUrl(unsubscribeUrl)}" style="color: ${colors.text.muted}; text-decoration: underline;">Unsubscribe from welcome emails</a>
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

function createFeatureItem(icon: string, title: string, description: string): string {
  return `
    <tr>
      <td style="padding: 16px 0;">
        <table cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="vertical-align: top; padding-right: 16px;">
              <div style="width: 40px; height: 40px; background-color: ${colors.primaryLight}; border-radius: 8px; text-align: center; line-height: 40px; font-size: 20px;">
                ${icon}
              </div>
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

function createStepIndicator(currentStep: number, totalSteps: number): string {
  const steps = [];
  for (let i = 1; i <= totalSteps; i++) {
    const isActive = i === currentStep;
    const isCompleted = i < currentStep;
    const bgColor = isActive
      ? colors.primary
      : isCompleted
        ? colors.secondary
        : colors.border.default;
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

// ============================================================================
// Email 1: Welcome + Access (Immediate)
// ============================================================================

export function getWelcome1AccessEmail(
  data: Welcome1AccessEmailData,
  variant: "A" | "B" = "A"
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    WELCOME_EMAIL_VARIANTS.email_1[variant](data.firstName, data.organizationName)
  );

  const roleWelcome = {
    admin: "As an admin, you have full control over your organization's reputation management.",
    manager: "As a manager, you can oversee your team's performance and review collection.",
    loan_officer: "You're all set to start collecting reviews and building your online reputation.",
  };

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 32px 40px; text-align: center;">
        <div style="width: 80px; height: 80px; margin: 0 auto 24px; background-color: ${colors.primaryLight}; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 40px;">🎉</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: ${colors.text.primary}; line-height: 1.2;">
          Welcome to RepWell, ${escapeHtml(data.firstName)}!
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Your ${escapeHtml(data.organizationName)} account is ready
        </p>
      </td>
    </tr>
    <!-- Main Content -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <p style="margin: 0 0 24px 0; font-size: 16px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          ${roleWelcome[data.role]}
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          ${createButton("Go to Dashboard", data.dashboardUrl, "primary")}
        </div>
      </td>
    </tr>
    <!-- What's Next Section -->
    <tr>
      <td style="padding: 32px 40px; background-color: ${colors.background.subtle};">
        <h2 style="margin: 0 0 24px 0; font-size: 18px; font-weight: 600; color: ${colors.text.primary}; text-align: center;">
          Here's what you can do next
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${createFeatureItem("👤", "Complete your profile", "Add your photo and bio to personalize your review requests")}
          ${createFeatureItem("📧", "Send your first survey", "Start collecting feedback from your recent clients")}
          ${createFeatureItem("⭐", "Build your reputation", "Watch your reviews grow and showcase your success")}
        </table>
      </td>
    </tr>
    <!-- Sequence Progress -->
    <tr>
      <td style="padding: 24px 40px; text-align: center; border-top: 1px solid ${colors.border.subtle};">
        ${createStepIndicator(1, 5)}
        <p style="margin: 12px 0 0 0; font-size: 12px; color: ${colors.text.muted};">
          Email 1 of 5 in your welcome series
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInWelcomeEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Welcome to RepWell! Your ${data.organizationName} account is ready.`
    ),
  };
}

// ============================================================================
// Email 2: Profile Setup (Day 1)
// ============================================================================

export function getWelcome2ProfileEmail(
  data: Welcome2ProfileEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `${data.firstName}, complete your profile in 5 minutes`
  );

  const progressWidth = Math.min(Math.max(data.profileCompletionPercent, 0), 100);

  const missingFieldsHtml =
    data.missingFields.length > 0
      ? data.missingFields
          .map(
            (field) =>
              `<li style="margin: 8px 0; color: ${colors.text.secondary};">${escapeHtml(field)}</li>`
          )
          .join("")
      : "";

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.accent.warning}20; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">⏱️</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          5 minutes to a stronger profile
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Complete profiles get 3x more review responses
        </p>
      </td>
    </tr>
    <!-- Progress Bar -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <div style="background-color: ${colors.border.subtle}; border-radius: 8px; height: 8px; overflow: hidden;">
          <div style="background-color: ${colors.primary}; height: 100%; width: ${progressWidth}%; border-radius: 8px;"></div>
        </div>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center;">
          Your profile is ${progressWidth}% complete
        </p>
      </td>
    </tr>
    ${
      missingFieldsHtml
        ? `
    <!-- Missing Fields -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 8px; padding: 20px;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: ${colors.text.primary};">
            Still needed:
          </h3>
          <ul style="margin: 0; padding: 0 0 0 20px; list-style-type: disc;">
            ${missingFieldsHtml}
          </ul>
        </div>
      </td>
    </tr>
    `
        : ""
    }
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 40px 40px; text-align: center;">
        ${createButton("Complete My Profile", data.profileUrl, "primary")}
      </td>
    </tr>
    <!-- Why It Matters -->
    <tr>
      <td style="padding: 32px 40px; background-color: ${colors.background.subtle};">
        <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          Why does this matter?
        </h2>
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; line-height: 1.6;">
          When clients see your photo and learn about your experience, they're more likely to leave thoughtful, detailed reviews. A complete profile builds trust before they even click.
        </p>
      </td>
    </tr>
    <!-- Sequence Progress -->
    <tr>
      <td style="padding: 24px 40px; text-align: center; border-top: 1px solid ${colors.border.subtle};">
        ${createStepIndicator(2, 5)}
        <p style="margin: 12px 0 0 0; font-size: 12px; color: ${colors.text.muted};">
          Email 2 of 5 in your welcome series
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInWelcomeEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Complete your profile in just 5 minutes and get 3x more review responses."
    ),
  };
}

// ============================================================================
// Email 3: First Action - Survey/Video (Day 3)
// ============================================================================

export function getWelcome3FirstActionEmail(
  data: Welcome3FirstActionEmailData,
  variant: "A" | "B" = "A"
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    WELCOME_EMAIL_VARIANTS.email_3[variant](data.firstName)
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
          <span style="font-size: 32px;">🚀</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Ready to collect your first review?
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Choose how you'd like to start building your reputation
        </p>
      </td>
    </tr>
    <!-- Two Options -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <!-- Option 1: Survey -->
            <td width="48%" style="vertical-align: top;">
              <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px; text-align: center; height: 100%;">
                <div style="font-size: 40px; margin-bottom: 16px;">📋</div>
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
                  Send a Survey
                </h3>
                <p style="margin: 0 0 16px 0; font-size: 14px; color: ${colors.text.secondary}; line-height: 1.5;">
                  Collect detailed feedback with NPS and star ratings
                </p>
                ${createButton("Create Survey", data.createSurveyUrl, "secondary")}
              </div>
            </td>
            <td width="4%"></td>
            <!-- Option 2: Video -->
            <td width="48%" style="vertical-align: top;">
              <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px; text-align: center; height: 100%;">
                <div style="font-size: 40px; margin-bottom: 16px;">🎬</div>
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
                  Request Video
                </h3>
                <p style="margin: 0 0 16px 0; font-size: 14px; color: ${colors.text.secondary}; line-height: 1.5;">
                  Get authentic video testimonials from happy clients
                </p>
                ${createButton("Request Video", data.requestVideoUrl, "secondary")}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Pro Tip -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.primaryLight}; border-left: 4px solid ${colors.primary};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.primary};">
          <strong>Pro tip:</strong> Start with your most recent happy client. They'll likely give a glowing review while the experience is still fresh!
        </p>
      </td>
    </tr>
    <!-- Sequence Progress -->
    <tr>
      <td style="padding: 24px 40px; text-align: center; border-top: 1px solid ${colors.border.subtle};">
        ${createStepIndicator(3, 5)}
        <p style="margin: 12px 0 0 0; font-size: 12px; color: ${colors.text.muted};">
          Email 3 of 5 in your welcome series
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInWelcomeEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Ready to collect your first review? Choose between a survey or video testimonial."
    ),
  };
}

// ============================================================================
// Email 4: Social Proof - Success Story (Day 5)
// ============================================================================

export function getWelcome4SocialProofEmail(
  data: Welcome4SocialProofEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `How ${data.successStory.companyName} transformed their reputation`
  );

  const metricSection = data.successStory.metric
    ? `
    <div style="background-color: ${colors.primaryLight}; border-radius: 8px; padding: 16px; margin-top: 20px; text-align: center;">
      <div style="font-size: 32px; font-weight: 700; color: ${colors.primary};">
        ${escapeHtml(data.successStory.metric)}
      </div>
      <div style="font-size: 14px; color: ${colors.text.secondary};">
        ${escapeHtml(data.successStory.metricLabel || "")}
      </div>
    </div>
  `
    : "";

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: ${colors.primary}; text-transform: uppercase; letter-spacing: 1px;">
          Success Story
        </p>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          See what's possible with RepWell
        </h1>
      </td>
    </tr>
    <!-- Success Story Card -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 32px; border: 1px solid ${colors.border.subtle};">
          <!-- Quote -->
          <div style="position: relative;">
            <span style="font-size: 48px; color: ${colors.primaryLight}; position: absolute; top: -10px; left: -10px; line-height: 1;">"</span>
            <p style="margin: 0 0 24px 24px; font-size: 18px; color: ${colors.text.primary}; font-style: italic; line-height: 1.6;">
              ${escapeHtml(data.successStory.quote)}
            </p>
          </div>
          <!-- Attribution -->
          <div style="display: flex; align-items: center; border-top: 1px solid ${colors.border.subtle}; padding-top: 20px;">
            <div style="width: 48px; height: 48px; background-color: ${colors.primary}; border-radius: 50%; text-align: center; line-height: 48px; color: #ffffff; font-weight: 600; font-size: 18px;">
              ${escapeHtml(data.successStory.personName.charAt(0))}
            </div>
            <div style="margin-left: 16px;">
              <p style="margin: 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
                ${escapeHtml(data.successStory.personName)}
              </p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: ${colors.text.secondary};">
                ${escapeHtml(data.successStory.personTitle)}, ${escapeHtml(data.successStory.companyName)}
              </p>
            </div>
          </div>
          ${metricSection}
        </div>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 40px 40px; text-align: center;">
        <p style="margin: 0 0 20px 0; font-size: 16px; color: ${colors.text.secondary};">
          Ready to write your own success story?
        </p>
        ${createButton("Start Building My Reputation", data.dashboardUrl, "primary")}
      </td>
    </tr>
    <!-- Sequence Progress -->
    <tr>
      <td style="padding: 24px 40px; text-align: center; border-top: 1px solid ${colors.border.subtle};">
        ${createStepIndicator(4, 5)}
        <p style="margin: 12px 0 0 0; font-size: 12px; color: ${colors.text.muted};">
          Email 4 of 5 in your welcome series
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInWelcomeEmailTemplate(
      content,
      data.unsubscribeUrl,
      `See how ${data.successStory.companyName} transformed their reputation with RepWell.`
    ),
  };
}

// ============================================================================
// Email 5: Core Value - Metrics Preview (Day 7)
// ============================================================================

export function getWelcome5MetricsEmail(
  data: Welcome5MetricsEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `${data.firstName}, here's what you can unlock with RepWell`
  );

  const hasMetrics =
    data.sampleMetrics.averageRating ||
    data.sampleMetrics.reviewCount ||
    data.sampleMetrics.npsScore;

  const metricsHtml = hasMetrics
    ? `
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary}; text-align: center;">
          Your metrics so far
        </h2>
        <table width="100%" cellpadding="0" cellspacing="8" role="presentation">
          <tr>
            ${data.sampleMetrics.averageRating ? createStatCard(data.sampleMetrics.averageRating.toFixed(1), "Avg Rating") : ""}
            ${data.sampleMetrics.reviewCount ? createStatCard(String(data.sampleMetrics.reviewCount), "Reviews") : ""}
            ${data.sampleMetrics.npsScore ? createStatCard(String(data.sampleMetrics.npsScore), "NPS Score") : ""}
          </tr>
        </table>
      </td>
    </tr>
  `
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
          <span style="font-size: 32px;">📊</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Your reputation dashboard awaits
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Track your progress and celebrate your wins
        </p>
      </td>
    </tr>
    ${metricsHtml}
    <!-- What You Can Track -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
            With RepWell, you can track:
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: ${colors.secondary}; margin-right: 8px;">✓</span>
                <span style="color: ${colors.text.secondary};">Average star rating across all platforms</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: ${colors.secondary}; margin-right: 8px;">✓</span>
                <span style="color: ${colors.text.secondary};">Net Promoter Score (NPS) trends</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: ${colors.secondary}; margin-right: 8px;">✓</span>
                <span style="color: ${colors.text.secondary};">Review response rates and timing</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: ${colors.secondary}; margin-right: 8px;">✓</span>
                <span style="color: ${colors.text.secondary};">Sentiment analysis and key themes</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: ${colors.secondary}; margin-right: 8px;">✓</span>
                <span style="color: ${colors.text.secondary};">Team leaderboards and comparisons</span>
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("View My Analytics", data.analyticsUrl, "primary")}
      </td>
    </tr>
    <!-- Final Welcome -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.primaryLight}; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          That's the end of your welcome series! 🎉
        </p>
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary};">
          We're here whenever you need us. Just reply to any email or check out our help center.
        </p>
      </td>
    </tr>
    <!-- Sequence Progress -->
    <tr>
      <td style="padding: 24px 40px; text-align: center; border-top: 1px solid ${colors.border.subtle};">
        ${createStepIndicator(5, 5)}
        <p style="margin: 12px 0 0 0; font-size: 12px; color: ${colors.text.muted};">
          Email 5 of 5 in your welcome series
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInWelcomeEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Your reputation dashboard awaits. Track your progress and celebrate your wins!"
    ),
  };
}
