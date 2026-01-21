/**
 * Re-engagement Sequence Email Templates
 *
 * Win-back sequence for users who have become inactive:
 * - Email 1 (Day 7 inactive): Soft check-in - "We miss you"
 * - Email 2 (Day 14 inactive): Feature highlight - What's new
 * - Email 3 (Day 30 inactive): Last chance - Direct ask + incentive
 * - Email 4 (Day 45 inactive): Final email - Ask if they want to stay subscribed
 */

import type {
  Reengagement1MissYouEmailData,
  Reengagement2WhatsNewEmailData,
  Reengagement3LastChanceEmailData,
  Reengagement4FinalEmailData,
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
// Subject Line Variants (Personalized)
// ============================================================================

export const REENGAGEMENT_SUBJECT_LINES = {
  email_1: {
    paid: (firstName: string) => `Is everything okay, ${firstName}?`,
    free: (firstName: string) => `${firstName}, we noticed you've been away`,
  },
  email_2: {
    paid: () => `Here's what's new at RepWell`,
    free: () => `You're missing out on new features`,
  },
  email_3: {
    paid: (reviewCount: number) =>
      `${reviewCount} reviews are waiting for you`,
    free: (reviewCount: number) =>
      reviewCount > 0
        ? `${reviewCount} reviews arrived while you were away`
        : `Your reputation dashboard misses you`,
  },
  email_4: {
    paid: () => `Should we stop emailing you?`,
    free: () => `This is our last email (unless you come back)`,
  },
} as const;

// ============================================================================
// Base Email Wrapper
// ============================================================================

function wrapInReengagementEmailTemplate(
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
                <a href="${sanitizeUrl(unsubscribeUrl)}" style="color: ${colors.text.muted}; text-decoration: underline;">Unsubscribe from re-engagement emails</a>
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

function createFeatureItem(icon: string, title: string, description: string): string {
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

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

// ============================================================================
// Email 1: "We Miss You" (Day 7 inactive)
// ============================================================================

export function getReengagement1MissYouEmail(
  data: Reengagement1MissYouEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    data.isPaidUser
      ? REENGAGEMENT_SUBJECT_LINES.email_1.paid(data.firstName)
      : REENGAGEMENT_SUBJECT_LINES.email_1.free(data.firstName)
  );

  const personalMessage = data.isPaidUser
    ? `We noticed you haven't logged in for a while. Your premium features are ready and waiting for you.`
    : `It's been a week since we last saw you. Everything okay?`;

  const teamSignoff = data.isPaidUser
    ? "The RepWell Team"
    : "Sarah from RepWell";

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.primaryLight}; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">👋</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Hey ${escapeHtml(data.firstName)}, we miss you!
        </h1>
      </td>
    </tr>
    <!-- Personal Message -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <p style="margin: 0 0 24px 0; font-size: 16px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          ${personalMessage}
        </p>
        <p style="margin: 0 0 24px 0; font-size: 14px; color: ${colors.text.muted}; text-align: center;">
          Last active: ${escapeHtml(formatDate(data.lastActiveDate))}
        </p>
      </td>
    </tr>
    <!-- Value Reminder -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px; text-align: center;">
          <p style="margin: 0 0 16px 0; font-size: 16px; color: ${colors.text.primary}; font-weight: 500;">
            ${escapeHtml(data.valueReminder)}
          </p>
          <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary};">
            Your reputation management tools are ready when you are.
          </p>
        </div>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Take a Quick Look", data.quickActionUrl, "primary")}
      </td>
    </tr>
    <!-- Personal Signoff -->
    <tr>
      <td style="padding: 24px 40px 32px 40px; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: ${colors.text.secondary}; line-height: 1.6;">
          If there's anything we can help with, just reply to this email. We read every response.
        </p>
        <p style="margin: 0; font-size: 14px; color: ${colors.text.primary}; font-weight: 500;">
          — ${escapeHtml(teamSignoff)}
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInReengagementEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Hey ${data.firstName}, we noticed you haven't been around. Everything okay?`
    ),
  };
}

// ============================================================================
// Email 2: "What's New" (Day 14 inactive)
// ============================================================================

export function getReengagement2WhatsNewEmail(
  data: Reengagement2WhatsNewEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    data.isPaidUser
      ? REENGAGEMENT_SUBJECT_LINES.email_2.paid()
      : REENGAGEMENT_SUBJECT_LINES.email_2.free()
  );

  const featuresHtml = data.newFeatures
    .slice(0, 3)
    .map((feature) => createFeatureItem(feature.icon, feature.title, feature.description))
    .join("");

  const missedReviewsSection =
    data.missedReviewsCount > 0
      ? `
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <div style="background-color: ${colors.accent.warning}15; border-left: 4px solid ${colors.accent.warning}; border-radius: 0 8px 8px 0; padding: 16px 20px;">
          <p style="margin: 0; font-size: 14px; color: ${colors.text.primary};">
            <strong>While you were away:</strong> You received ${data.missedReviewsCount} new ${data.missedReviewsCount === 1 ? "review" : "reviews"} that ${data.missedReviewsCount === 1 ? "needs" : "need"} your attention.
          </p>
        </div>
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
          <span style="font-size: 32px;">✨</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Here's what's new at RepWell
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          We've been busy making things better for you
        </p>
      </td>
    </tr>
    <!-- New Features -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${featuresHtml}
        </table>
      </td>
    </tr>
    ${missedReviewsSection}
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 40px 40px; text-align: center;">
        ${createButton("See What's New", data.viewUpdatesUrl, "primary")}
      </td>
    </tr>
    <!-- Helpful Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          ${data.isPaidUser ? "As a valued customer, you get early access to all our new features." : "We're always working to help you build a stronger online reputation."}
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInReengagementEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Check out what's new at RepWell since your last visit.`
    ),
  };
}

// ============================================================================
// Email 3: "Last Chance" (Day 30 inactive)
// ============================================================================

export function getReengagement3LastChanceEmail(
  data: Reengagement3LastChanceEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    data.isPaidUser
      ? REENGAGEMENT_SUBJECT_LINES.email_3.paid(data.missedReviewsCount)
      : REENGAGEMENT_SUBJECT_LINES.email_3.free(data.missedReviewsCount)
  );

  const metricsSection =
    data.missedMetrics && (data.missedMetrics.totalReviews || data.missedMetrics.pendingResponses)
      ? `
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <table width="100%" cellpadding="8" cellspacing="0" role="presentation">
          <tr>
            ${data.missedMetrics.totalReviews ? createStatCard(String(data.missedMetrics.totalReviews), "Total Reviews") : ""}
            ${data.missedMetrics.averageRating ? createStatCard(data.missedMetrics.averageRating.toFixed(1), "Avg Rating") : ""}
            ${data.missedMetrics.pendingResponses ? createStatCard(String(data.missedMetrics.pendingResponses), "Pending Responses") : ""}
          </tr>
        </table>
      </td>
    </tr>
  `
      : "";

  const incentiveSection = data.isPaidUser && data.incentiveMessage
    ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.primaryLight}; border-radius: 8px; padding: 16px 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: ${colors.text.primary}; font-weight: 500;">
            💎 ${escapeHtml(data.incentiveMessage)}
          </p>
        </div>
      </td>
    </tr>
  `
    : "";

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
          ${escapeHtml(data.firstName)}, your reviews are waiting
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          It's been 30 days since your last visit
        </p>
      </td>
    </tr>
    <!-- Urgency Message -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          ${escapeHtml(data.urgencyMessage)}
        </p>
      </td>
    </tr>
    ${metricsSection}
    ${incentiveSection}
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 40px 40px; text-align: center;">
        ${createButton("Come Back Now", data.dashboardUrl, "primary")}
      </td>
    </tr>
    <!-- Personal Touch -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          ${data.isPaidUser
            ? "Your premium account is still active. Let's make the most of it together."
            : "We'd love to help you get back on track. Reply to this email if you have any questions."}
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInReengagementEmailTemplate(
      content,
      data.unsubscribeUrl,
      data.missedReviewsCount > 0
        ? `${data.missedReviewsCount} reviews are waiting for you to respond.`
        : `It's been 30 days. Your reputation dashboard misses you.`
    ),
  };
}

// ============================================================================
// Email 4: "Final Email" (Day 45 inactive)
// ============================================================================

export function getReengagement4FinalEmail(
  data: Reengagement4FinalEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    data.isPaidUser
      ? REENGAGEMENT_SUBJECT_LINES.email_4.paid()
      : REENGAGEMENT_SUBJECT_LINES.email_4.free()
  );

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.text.muted} 0%, ${colors.primary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.background.muted}; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">📬</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Should we stop emailing you?
        </h1>
      </td>
    </tr>
    <!-- Message -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <p style="margin: 0 0 16px 0; font-size: 16px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          Hi ${escapeHtml(data.firstName)},
        </p>
        <p style="margin: 0 0 16px 0; font-size: 16px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          We've reached out a few times but haven't heard back. We respect your inbox, so this will be our last email unless you'd like to stay connected.
        </p>
        ${data.missedReviewsCount > 0 ? `
        <p style="margin: 0; font-size: 14px; color: ${colors.text.muted}; text-align: center;">
          (You have ${data.missedReviewsCount} reviews waiting for you, just so you know.)
        </p>
        ` : ""}
      </td>
    </tr>
    <!-- Two Options -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <!-- Option 1: Stay Subscribed -->
            <td width="48%" style="vertical-align: top;">
              <div style="background-color: ${colors.primaryLight}; border-radius: 12px; padding: 24px; text-align: center;">
                <div style="font-size: 32px; margin-bottom: 12px;">✅</div>
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
                  Keep me subscribed
                </h3>
                <p style="margin: 0 0 16px 0; font-size: 14px; color: ${colors.text.secondary}; line-height: 1.5;">
                  I'll be back soon
                </p>
                ${createButton("Stay Connected", data.staySubscribedUrl, "primary")}
              </div>
            </td>
            <td width="4%"></td>
            <!-- Option 2: Unsubscribe -->
            <td width="48%" style="vertical-align: top;">
              <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px; text-align: center; border: 1px solid ${colors.border.subtle};">
                <div style="font-size: 32px; margin-bottom: 12px;">👋</div>
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
                  Unsubscribe me
                </h3>
                <p style="margin: 0 0 16px 0; font-size: 14px; color: ${colors.text.secondary}; line-height: 1.5;">
                  No hard feelings
                </p>
                ${createButton("Unsubscribe", data.unsubscribeUrl, "ghost")}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${data.feedbackUrl ? `
    <!-- Feedback Option -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.muted};">
          Have feedback? <a href="${sanitizeUrl(data.feedbackUrl)}" style="color: ${colors.primary}; text-decoration: underline;">Let us know why you left</a>
        </p>
      </td>
    </tr>
    ` : ""}
    <!-- Final Message -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          Either way, thank you for being part of the RepWell community.
          ${data.isPaidUser ? "Your account will remain active, and you can return anytime." : "We hope to see you again someday."}
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInReengagementEmailTemplate(
      content,
      data.unsubscribeUrl,
      `This is our last email. Would you like to stay connected?`
    ),
  };
}
