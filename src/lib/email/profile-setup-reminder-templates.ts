/**
 * Profile & Setup Reminder Sequence Email Templates (S084)
 *
 * Nudge users who haven't completed their profile or key setup steps:
 *
 * Profile Completion Reminders:
 * - Day 3: Missing photo reminder with easy upload link
 * - Day 7: Incomplete bio reminder with tips
 * - Day 14: Final profile reminder with impact stats
 *
 * Setup Completion Reminders:
 * - Day 3: No survey template created
 * - Day 7: No survey sent
 * - Day 5: No Google connected (admins only)
 * - Day 7: No team members invited (admins only)
 */

import type {
  ProfileReminderPhotoEmailData,
  ProfileReminderBioEmailData,
  ProfileReminderFinalEmailData,
  SetupReminderSurveyTemplateEmailData,
  SetupReminderFirstSurveyEmailData,
  SetupReminderGoogleConnectEmailData,
  SetupReminderInviteTeamEmailData,
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

export const PROFILE_REMINDER_SUBJECT_LINES = {
  photo: (firstName: string) => `${firstName}, add your photo for 2x more reviews`,
  bio: (firstName: string) => `${firstName}, complete your bio to build trust`,
  final: (firstName: string) => `${firstName}, your profile is almost there`,
  survey_template: () => `Create your first survey template`,
  first_survey: () => `Ready to get your first review?`,
  google_connect: () => `Connect Google to sync your reviews`,
  invite_team: () => `Invite your team to get started`,
} as const;

// ============================================================================
// Base Email Wrapper
// ============================================================================

function wrapInReminderEmailTemplate(
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
                <a href="${sanitizeUrl(unsubscribeUrl)}" style="color: ${colors.text.muted}; text-decoration: underline;">Unsubscribe from reminder emails</a>
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

function getProgressColor(percent: number): string {
  if (percent >= 80) return colors.accent.success;
  if (percent >= 50) return colors.accent.warning;
  return colors.primary;
}

function createProgressBar(completionPercent: number): string {
  const fillWidth = Math.min(100, Math.max(0, completionPercent));
  const progressColor = getProgressColor(fillWidth);

  return `
    <div style="margin: 16px 0;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-size: 14px; color: ${colors.text.secondary};">Profile Completion</span>
        <span style="font-size: 14px; font-weight: 600; color: ${colors.text.primary};">${fillWidth}%</span>
      </div>
      <div style="background-color: ${colors.background.muted}; border-radius: 8px; height: 8px; overflow: hidden;">
        <div style="background-color: ${progressColor}; width: ${fillWidth}%; height: 100%; border-radius: 8px; transition: width 0.3s ease;"></div>
      </div>
    </div>
  `;
}

function createBenefitItem(icon: string, title: string, description: string): string {
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

function createTipItem(tip: string): string {
  return `
    <li style="margin-bottom: 8px; padding-left: 8px; color: ${colors.text.secondary}; font-size: 14px;">
      ${escapeHtml(tip)}
    </li>
  `;
}

// ============================================================================
// Profile Reminder Email 1: Missing Photo (Day 3)
// ============================================================================

export function getProfileReminderPhotoEmail(
  data: ProfileReminderPhotoEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    PROFILE_REMINDER_SUBJECT_LINES.photo(data.firstName)
  );

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 80px; height: 80px; margin: 0 auto 20px; background-color: ${colors.background.muted}; border-radius: 50%; text-align: center; line-height: 80px; border: 3px dashed ${colors.border.accent};">
          <span style="font-size: 36px;">📷</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Add your photo, ${escapeHtml(data.firstName)}
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Profiles with photos get 2x more reviews
        </p>
      </td>
    </tr>
    <!-- Progress Bar -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        ${createProgressBar(data.completionPercent)}
      </td>
    </tr>
    <!-- Benefits -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
            Why adding a photo matters:
          </h2>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${createBenefitItem("🤝", "Build Trust", "Clients connect better with a face they recognize")}
            ${createBenefitItem("⭐", "More Reviews", "Profiles with photos receive 2x more client feedback")}
            ${createBenefitItem("🏆", "Stand Out", "Appear more professional on leaderboards and testimonials")}
          </table>
        </div>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Upload Your Photo", data.uploadPhotoUrl, "primary")}
        <p style="margin: 16px 0 0 0; font-size: 13px; color: ${colors.text.muted};">
          Takes less than 30 seconds
        </p>
      </td>
    </tr>
    <!-- Personal Touch -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          Need help? Just reply to this email and our team will assist you.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInReminderEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Add your photo to get 2x more reviews, ${data.firstName}`
    ),
  };
}

// ============================================================================
// Profile Reminder Email 2: Incomplete Bio (Day 7)
// ============================================================================

export function getProfileReminderBioEmail(
  data: ProfileReminderBioEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    PROFILE_REMINDER_SUBJECT_LINES.bio(data.firstName)
  );

  const bioTips = data.bioTips || [
    "Mention your years of experience in the industry",
    "Highlight any specializations or certifications",
    "Share what makes your approach unique",
    "Keep it friendly and approachable",
  ];

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.primaryLight}; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">✍️</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Tell your story, ${escapeHtml(data.firstName)}
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          A great bio helps clients choose you over competitors
        </p>
      </td>
    </tr>
    <!-- Progress Bar -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        ${createProgressBar(data.completionPercent)}
      </td>
    </tr>
    <!-- Bio Tips -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
            Tips for a great bio:
          </h2>
          <ul style="margin: 0; padding-left: 20px; list-style-type: disc;">
            ${bioTips.map(tip => createTipItem(tip)).join("")}
          </ul>
        </div>
      </td>
    </tr>
    <!-- Example Bio -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.white}; border: 1px solid ${colors.border.default}; border-radius: 12px; padding: 20px;">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: ${colors.text.muted}; text-transform: uppercase; letter-spacing: 0.5px;">
            EXAMPLE BIO
          </p>
          <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; font-style: italic; line-height: 1.6;">
            "With 15 years helping families achieve their homeownership dreams, I specialize in first-time buyers and refinancing. My clients appreciate my clear communication and attention to detail. When I'm not crunching numbers, you'll find me coaching little league."
          </p>
        </div>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Write Your Bio", data.editProfileUrl, "primary")}
      </td>
    </tr>
    <!-- Personal Touch -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          Not sure what to write? Our team can help craft the perfect bio for you.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInReminderEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Complete your bio to build trust with clients`
    ),
  };
}

// ============================================================================
// Profile Reminder Email 3: Final Reminder with Impact Stats (Day 14)
// ============================================================================

export function getProfileReminderFinalEmail(
  data: ProfileReminderFinalEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    PROFILE_REMINDER_SUBJECT_LINES.final(data.firstName)
  );

  const missingItemsHtml = data.missingItems
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid ${colors.border.subtle};">
            <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
              <tr>
                <td style="width: 24px;">
                  <span style="color: ${colors.accent.warning}; font-size: 16px;">○</span>
                </td>
                <td style="font-size: 14px; color: ${colors.text.secondary};">
                  ${escapeHtml(item.label)}
                </td>
                <td style="text-align: right;">
                  <a href="${sanitizeUrl(item.actionUrl)}" style="font-size: 13px; color: ${colors.primary}; text-decoration: none; font-weight: 500;">
                    Complete →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `
    )
    .join("");

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.accent.warning} 0%, ${colors.primary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.accent.warning}20; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">🎯</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          You're ${data.completionPercent}% there!
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Complete your profile to unlock its full potential
        </p>
      </td>
    </tr>
    <!-- Progress Bar -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        ${createProgressBar(data.completionPercent)}
      </td>
    </tr>
    <!-- Impact Stats -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.primaryLight}20; border-radius: 12px; padding: 20px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: ${colors.text.secondary};">
            Complete profiles receive on average
          </p>
          <table width="100%" cellpadding="8" cellspacing="0" role="presentation" style="margin-top: 12px;">
            <tr>
              ${createStatCard(data.impactStats?.moreReviews || "2.3x", "More Reviews")}
              <td width="16"></td>
              ${createStatCard(data.impactStats?.higherRating || "+0.4", "Rating Boost")}
              <td width="16"></td>
              ${createStatCard(data.impactStats?.moreResponses || "68%", "Response Rate")}
            </tr>
          </table>
        </div>
      </td>
    </tr>
    <!-- Missing Items Checklist -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          Quick wins to complete:
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 16px;">
          ${missingItemsHtml}
        </table>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Complete Your Profile", data.profileUrl, "primary")}
      </td>
    </tr>
    <!-- Urgency Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          This is our last reminder. Complete your profile today to start getting better results!
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInReminderEmailTemplate(
      content,
      data.unsubscribeUrl,
      `You're ${data.completionPercent}% done - finish your profile today`
    ),
  };
}

// ============================================================================
// Setup Reminder Email 1: No Survey Template (Day 3)
// ============================================================================

export function getSetupReminderSurveyTemplateEmail(
  data: SetupReminderSurveyTemplateEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    PROFILE_REMINDER_SUBJECT_LINES.survey_template()
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
          <span style="font-size: 32px;">📋</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Create your first survey
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Start collecting valuable client feedback today
        </p>
      </td>
    </tr>
    <!-- Setup Progress -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        ${createProgressBar(data.setupProgress)}
        <p style="margin: 8px 0 0 0; font-size: 12px; color: ${colors.text.muted}; text-align: center;">
          Setup Progress
        </p>
      </td>
    </tr>
    <!-- Benefits -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
            Why surveys matter:
          </h2>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${createBenefitItem("📊", "Track NPS Scores", "Measure client satisfaction over time")}
            ${createBenefitItem("💬", "Get Testimonials", "Turn happy clients into public advocates")}
            ${createBenefitItem("🔔", "Early Warnings", "Address issues before they become public reviews")}
          </table>
        </div>
      </td>
    </tr>
    <!-- Template Options -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <p style="margin: 0 0 12px 0; font-size: 14px; color: ${colors.text.secondary};">
          Choose from our pre-built templates or create your own:
        </p>
        <table width="100%" cellpadding="8" cellspacing="8" role="presentation">
          <tr>
            <td style="background-color: ${colors.background.subtle}; border-radius: 8px; padding: 12px; text-align: center;">
              <span style="font-size: 24px;">⭐</span>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: ${colors.text.secondary};">Post-Transaction</p>
            </td>
            <td style="background-color: ${colors.background.subtle}; border-radius: 8px; padding: 12px; text-align: center;">
              <span style="font-size: 24px;">📈</span>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: ${colors.text.secondary};">NPS Survey</p>
            </td>
            <td style="background-color: ${colors.background.subtle}; border-radius: 8px; padding: 12px; text-align: center;">
              <span style="font-size: 24px;">✨</span>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: ${colors.text.secondary};">Custom</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Create Survey Template", data.createTemplateUrl, "primary")}
      </td>
    </tr>
    <!-- Help Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          Need help? Check out our <a href="${sanitizeUrl(data.helpUrl || data.dashboardUrl)}" style="color: ${colors.primary}; text-decoration: underline;">survey best practices guide</a>.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInReminderEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Create your first survey template to start collecting feedback`
    ),
  };
}

// ============================================================================
// Setup Reminder Email 2: No Survey Sent (Day 7)
// ============================================================================

export function getSetupReminderFirstSurveyEmail(
  data: SetupReminderFirstSurveyEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    PROFILE_REMINDER_SUBJECT_LINES.first_survey()
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
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Send your first survey
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          You're one step away from your first review
        </p>
      </td>
    </tr>
    <!-- Setup Progress -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        ${createProgressBar(data.setupProgress)}
      </td>
    </tr>
    <!-- How it works -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
            How it works:
          </h2>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding: 8px 0;">
                <table cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td style="width: 32px; height: 32px; background-color: ${colors.primary}; border-radius: 50%; text-align: center; line-height: 32px; color: white; font-weight: 600; font-size: 14px;">1</td>
                    <td style="padding-left: 12px; font-size: 14px; color: ${colors.text.secondary};">Enter your client's email</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <table cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td style="width: 32px; height: 32px; background-color: ${colors.primary}; border-radius: 50%; text-align: center; line-height: 32px; color: white; font-weight: 600; font-size: 14px;">2</td>
                    <td style="padding-left: 12px; font-size: 14px; color: ${colors.text.secondary};">We send a beautiful, branded survey</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <table cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td style="width: 32px; height: 32px; background-color: ${colors.primary}; border-radius: 50%; text-align: center; line-height: 32px; color: white; font-weight: 600; font-size: 14px;">3</td>
                    <td style="padding-left: 12px; font-size: 14px; color: ${colors.text.secondary};">Get notified when they respond</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
    <!-- Recent Client Suggestion -->
    ${data.recentClientName ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.primaryLight}20; border-radius: 12px; padding: 20px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: ${colors.text.secondary};">
            💡 Suggestion: Start with your most recent client
          </p>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
            ${escapeHtml(data.recentClientName)}
          </p>
        </div>
      </td>
    </tr>
    ` : ""}
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Send Your First Survey", data.sendSurveyUrl, "primary")}
      </td>
    </tr>
    <!-- Tip -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          <strong>Pro tip:</strong> Send surveys within 48 hours of closing for the best response rates.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInReminderEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Send your first survey and start building your reputation`
    ),
  };
}

// ============================================================================
// Setup Reminder Email 3: No Google Connected (Day 5, Admins Only)
// ============================================================================

export function getSetupReminderGoogleConnectEmail(
  data: SetupReminderGoogleConnectEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    PROFILE_REMINDER_SUBJECT_LINES.google_connect()
  );

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: #4285F420; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">🔗</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Connect Google Business Profile
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Sync your Google reviews automatically
        </p>
      </td>
    </tr>
    <!-- Setup Progress -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        ${createProgressBar(data.setupProgress)}
      </td>
    </tr>
    <!-- Benefits -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
            Why connect Google:
          </h2>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${createBenefitItem("🔄", "Auto-Sync Reviews", "All your Google reviews appear in one dashboard")}
            ${createBenefitItem("⚡", "Quick Responses", "Reply to Google reviews without leaving RepWell")}
            ${createBenefitItem("📈", "Unified Analytics", "See all your reviews and ratings in one place")}
          </table>
        </div>
      </td>
    </tr>
    <!-- Security Note -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.accent.info}15; border-left: 4px solid ${colors.accent.info}; border-radius: 0 8px 8px 0; padding: 16px 20px;">
          <p style="margin: 0; font-size: 14px; color: ${colors.text.primary};">
            <strong>🔒 Secure Connection:</strong> We use OAuth 2.0 and never store your Google password. You can disconnect at any time.
          </p>
        </div>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Connect Google Business", data.googleConnectUrl, "primary")}
      </td>
    </tr>
    <!-- Help Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          Don't have a Google Business Profile? <a href="https://business.google.com" style="color: ${colors.primary}; text-decoration: underline;">Create one here</a> first.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInReminderEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Connect Google Business Profile to sync your reviews`
    ),
  };
}

// ============================================================================
// Setup Reminder Email 4: No Team Members Invited (Day 7, Admins Only)
// ============================================================================

export function getSetupReminderInviteTeamEmail(
  data: SetupReminderInviteTeamEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    PROFILE_REMINDER_SUBJECT_LINES.invite_team()
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
          <span style="font-size: 32px;">👥</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Invite your team
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Help your team build their online reputation
        </p>
      </td>
    </tr>
    <!-- Setup Progress -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        ${createProgressBar(data.setupProgress)}
      </td>
    </tr>
    <!-- Team Benefits -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
            Benefits of adding your team:
          </h2>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${createBenefitItem("🏆", "Leaderboards", "Motivate with friendly competition")}
            ${createBenefitItem("📊", "Team Analytics", "Track performance across your entire team")}
            ${createBenefitItem("🎯", "Better Results", "Teams using RepWell get 3x more reviews")}
          </table>
        </div>
      </td>
    </tr>
    <!-- Team Limit Info -->
    ${data.teamLimit ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.primaryLight}20; border-radius: 12px; padding: 20px; text-align: center;">
          <p style="margin: 0 0 4px 0; font-size: 14px; color: ${colors.text.secondary};">
            Your plan includes
          </p>
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${colors.primary};">
            ${data.teamLimit} team members
          </p>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: ${colors.text.muted};">
            ${data.currentTeamCount || 1} of ${data.teamLimit} seats used
          </p>
        </div>
      </td>
    </tr>
    ` : ""}
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Invite Team Members", data.inviteTeamUrl, "primary")}
      </td>
    </tr>
    <!-- Quick Invite Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          <strong>Quick tip:</strong> Invite starts with loan officers who have the most client interactions.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInReminderEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Invite your team to start building your organization's reputation`
    ),
  };
}
