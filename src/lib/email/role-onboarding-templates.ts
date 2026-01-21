/**
 * Role-Based Feature Onboarding Email Templates
 *
 * Feature discovery sequences tailored to each role:
 * - Loan Officer: 7 emails over 30 days (dashboard, surveys, sharing, responding, video, mobile, Google)
 * - Manager: 6 emails over 30 days (team dashboard, approvals, leaderboards, reports, coaching, analytics)
 * - Admin: 5 emails over 30 days (settings, users, integrations, billing, compliance)
 *
 * Weekly pacing to avoid fatigue. Emails skip if feature already used.
 */

import type {
  RoleOnboardingLO1DashboardEmailData,
  RoleOnboardingLO2SurveysEmailData,
  RoleOnboardingLO3SharingEmailData,
  RoleOnboardingLO4RespondingEmailData,
  RoleOnboardingLO5VideoEmailData,
  RoleOnboardingLO6MobileEmailData,
  RoleOnboardingLO7GoogleEmailData,
  RoleOnboardingMgr1TeamDashboardEmailData,
  RoleOnboardingMgr2ApprovalsEmailData,
  RoleOnboardingMgr3LeaderboardsEmailData,
  RoleOnboardingMgr4ReportsEmailData,
  RoleOnboardingMgr5CoachingEmailData,
  RoleOnboardingMgr6AnalyticsEmailData,
  RoleOnboardingAdmin1SettingsEmailData,
  RoleOnboardingAdmin2UsersEmailData,
  RoleOnboardingAdmin3IntegrationsEmailData,
  RoleOnboardingAdmin4BillingEmailData,
  RoleOnboardingAdmin5ComplianceEmailData,
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

function wrapInRoleOnboardingEmailTemplate(
  content: string,
  unsubscribeUrl: string,
  preheaderText?: string,
  currentStep?: number,
  totalSteps?: number
): string {
  const preheader = preheaderText
    ? `<span style="display: none; font-size: 1px; color: #fafafa; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">${escapeHtml(preheaderText)}</span>`
    : "";

  const progressIndicator =
    currentStep && totalSteps ? createStepIndicator(currentStep, totalSteps) : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RepWell Feature Guide</title>
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
          <tr>
            <td align="center" style="padding: 0;">
              <span style="font-size: 12px; color: ${colors.text.muted}; text-transform: uppercase; letter-spacing: 1px;">Feature Guide</span>
            </td>
          </tr>
        </table>
        <!-- Main Content Card -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color: ${colors.background.white}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          ${content}
        </table>
        <!-- Footer -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 32px;">
          ${
            progressIndicator
              ? `
          <tr>
            <td align="center" style="padding: 0 0 16px 0;">
              ${progressIndicator}
            </td>
          </tr>
          `
              : ""
          }
          <tr>
            <td align="center" style="color: ${colors.text.muted}; font-size: 12px; padding: 0 20px;">
              <p style="margin: 0 0 8px 0;">
                Powered by <a href="${emailConfig.baseUrl}" style="color: ${colors.primary}; text-decoration: none;">RepWell</a>
              </p>
              <p style="margin: 0 0 16px 0;">
                <a href="${sanitizeUrl(unsubscribeUrl)}" style="color: ${colors.text.muted}; text-decoration: underline;">Unsubscribe from feature guides</a>
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
    <a href="${sanitizeUrl(url)}" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; ${styles[variant]}">
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
    <p style="margin: 8px 0 0 0; font-size: 11px; color: ${colors.text.muted};">
      Email ${currentStep} of ${totalSteps} in your feature guide
    </p>
  `;
}

function createTipBox(title: string, content: string): string {
  return `
    <tr>
      <td style="padding: 24px 40px;">
        <div style="background-color: ${colors.primaryLight}; border-left: 4px solid ${colors.primary}; border-radius: 0 8px 8px 0; padding: 16px 20px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: ${colors.text.primary};">
            ${escapeHtml(title)}
          </h4>
          <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; line-height: 1.5;">
            ${escapeHtml(content)}
          </p>
        </div>
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
      <div style="font-size: 12px; color: ${colors.text.secondary}; margin-top: 4px;">
        ${escapeHtml(label)}
      </div>
    </td>
  `;
}

// ============================================================================
// LOAN OFFICER SEQUENCE (7 emails)
// ============================================================================

/**
 * LO Email 1: Dashboard tour and key metrics
 */
export function getRoleOnboardingLO1DashboardEmail(
  data: RoleOnboardingLO1DashboardEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `${data.firstName}, let's explore your RepWell dashboard`
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
          <span style="font-size: 32px;">📊</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Your Dashboard: Command Central
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Everything you need to manage your reputation in one place
        </p>
      </td>
    </tr>
    <!-- Stats Preview -->
    ${
      data.currentRating || data.currentReviewCount
        ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <table width="100%" cellpadding="0" cellspacing="8" role="presentation">
          <tr>
            ${data.currentRating ? createStatCard(data.currentRating.toFixed(1), "Current Rating") : ""}
            ${data.currentReviewCount ? createStatCard(String(data.currentReviewCount), "Total Reviews") : ""}
          </tr>
        </table>
      </td>
    </tr>
    `
        : ""
    }
    <!-- Features -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          What you'll find on your dashboard:
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${createFeatureItem("⭐", "Review Summary", "See your average rating, review count, and recent feedback at a glance")}
          ${createFeatureItem("📈", "NPS Tracking", "Monitor your Net Promoter Score and customer satisfaction trends")}
          ${createFeatureItem("🔔", "Recent Activity", "Stay updated on new reviews, responses, and survey completions")}
        </table>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Explore My Dashboard", data.dashboardTourUrl, "primary")}
        <div style="margin-top: 12px;">
          ${createButton("View My Metrics", data.metricsUrl, "ghost")}
        </div>
      </td>
    </tr>
    ${createTipBox("Pro Tip", "Check your dashboard first thing each morning to catch new reviews and respond promptly.")}
  `;

  return {
    subject,
    html: wrapInRoleOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Explore your RepWell dashboard and track your key metrics.",
      data.currentStep,
      data.totalSteps
    ),
  };
}

/**
 * LO Email 2: Sending survey requests manually
 */
export function getRoleOnboardingLO2SurveysEmail(
  data: RoleOnboardingLO2SurveysEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `${data.firstName}, ready to collect your first review?`
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
          <span style="font-size: 32px;">📧</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Send Survey Requests
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          The easiest way to collect feedback from happy clients
        </p>
      </td>
    </tr>
    <!-- Features -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          How it works:
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${createFeatureItem("1️⃣", "Enter client details", "Add their name and email address")}
          ${createFeatureItem("2️⃣", "Choose a template", "Select from proven survey designs")}
          ${createFeatureItem("3️⃣", "Send & track", "Survey goes out instantly with automatic reminders")}
        </table>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Send My First Survey", data.createSurveyUrl, "primary")}
        <div style="margin-top: 12px;">
          ${createButton("Browse Templates", data.surveyTemplatesUrl, "ghost")}
        </div>
      </td>
    </tr>
    ${createTipBox("Best Practice", "Send survey requests within 24-48 hours of closing. Clients are most likely to respond while the experience is fresh!")}
  `;

  return {
    subject,
    html: wrapInRoleOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Learn how to send survey requests and collect reviews.",
      data.currentStep,
      data.totalSteps
    ),
  };
}

/**
 * LO Email 3: Sharing positive reviews
 */
export function getRoleOnboardingLO3SharingEmail(
  data: RoleOnboardingLO3SharingEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `${data.firstName}, amplify your best reviews`
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
          <span style="font-size: 32px;">📣</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Share Your Success
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Turn great reviews into powerful marketing assets
        </p>
      </td>
    </tr>
    <!-- Features -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          Ways to share your reviews:
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${createFeatureItem("🔗", "Social Media", "One-click sharing to LinkedIn, Facebook, and Twitter")}
          ${createFeatureItem("🌐", "Website Widget", "Display reviews on your personal website")}
          ${createFeatureItem("📱", "Email Signature", "Add a review highlight to your email footer")}
        </table>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("View My Reviews", data.reviewsUrl, "primary")}
        <div style="margin-top: 12px;">
          ${createButton("Manage Testimonials", data.testimonialsUrl, "ghost")}
        </div>
      </td>
    </tr>
    ${createTipBox("Social Proof", "Professionals who regularly share reviews see 40% more referrals. Make it a weekly habit!")}
  `;

  return {
    subject,
    html: wrapInRoleOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Learn how to share your positive reviews and testimonials.",
      data.currentStep,
      data.totalSteps
    ),
  };
}

/**
 * LO Email 4: Responding to reviews
 */
export function getRoleOnboardingLO4RespondingEmail(
  data: RoleOnboardingLO4RespondingEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `${data.firstName}, the art of review responses`
  );

  const pendingNotice =
    data.pendingResponseCount && data.pendingResponseCount > 0
      ? `<p style="margin: 16px 0 0 0; font-size: 14px; color: ${colors.accent.warning}; font-weight: 600;">You have ${data.pendingResponseCount} review${data.pendingResponseCount > 1 ? "s" : ""} waiting for your response!</p>`
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
          <span style="font-size: 32px;">💬</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Respond to Reviews
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Show clients you value their feedback
        </p>
        ${pendingNotice}
      </td>
    </tr>
    <!-- Features -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          Response best practices:
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${createFeatureItem("⚡", "Respond Quickly", "Aim to respond within 24 hours for maximum impact")}
          ${createFeatureItem("🙏", "Be Personal", "Reference specific details from their review")}
          ${createFeatureItem("🤝", "Stay Professional", "Even negative reviews deserve a thoughtful reply")}
        </table>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Respond to Reviews", data.reviewsUrl, "primary")}
        <div style="margin-top: 12px;">
          ${createButton("View Response Templates", data.responseTemplatesUrl, "ghost")}
        </div>
      </td>
    </tr>
    ${createTipBox("Did You Know?", "89% of consumers read business responses to reviews. Your responses are public marketing!")}
  `;

  return {
    subject,
    html: wrapInRoleOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Learn how to craft effective responses to client reviews.",
      data.currentStep,
      data.totalSteps
    ),
  };
}

/**
 * LO Email 5: Video testimonial requests
 */
export function getRoleOnboardingLO5VideoEmail(
  data: RoleOnboardingLO5VideoEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `${data.firstName}, video testimonials are 10x more powerful`
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
          <span style="font-size: 32px;">🎬</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Video Testimonials
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          The most powerful form of social proof
        </p>
      </td>
    </tr>
    <!-- Why Video Section -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px; text-align: center;">
          <p style="margin: 0 0 12px 0; font-size: 36px; font-weight: 700; color: ${colors.primary};">10x</p>
          <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary};">more engagement than text reviews</p>
        </div>
      </td>
    </tr>
    <!-- Features -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          How video requests work:
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${createFeatureItem("📱", "Easy Recording", "Clients record from their phone or computer")}
          ${createFeatureItem("✂️", "Auto-Editing", "We trim and enhance the video for you")}
          ${createFeatureItem("🚀", "One-Click Share", "Publish to social media or your website")}
        </table>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Request Video Testimonial", data.videoRequestUrl, "primary")}
        <div style="margin-top: 12px;">
          ${createButton("View Video Gallery", data.videoGalleryUrl, "ghost")}
        </div>
      </td>
    </tr>
    ${createTipBox("Best Candidates", "Ask your happiest clients who've left 5-star written reviews. They're already fans!")}
  `;

  return {
    subject,
    html: wrapInRoleOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Discover the power of video testimonials.",
      data.currentStep,
      data.totalSteps
    ),
  };
}

/**
 * LO Email 6: Mobile app features
 */
export function getRoleOnboardingLO6MobileEmail(
  data: RoleOnboardingLO6MobileEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `${data.firstName}, manage reviews on the go`
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
          <span style="font-size: 32px;">📱</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          RepWell Mobile
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Your reputation management in your pocket
        </p>
      </td>
    </tr>
    <!-- Features -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          Mobile features:
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${createFeatureItem("🔔", "Instant Notifications", "Get alerts when new reviews come in")}
          ${createFeatureItem("💬", "Quick Responses", "Reply to reviews from anywhere")}
          ${createFeatureItem("📧", "Send Surveys", "Request reviews right after client meetings")}
          ${createFeatureItem("📊", "Track Metrics", "View your dashboard on the go")}
        </table>
      </td>
    </tr>
    <!-- App Store Buttons -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        <table width="100%" cellpadding="0" cellspacing="12" role="presentation">
          <tr>
            <td width="50%" style="text-align: right;">
              ${createButton("App Store", data.appStoreUrl, "primary")}
            </td>
            <td width="50%" style="text-align: left;">
              ${createButton("Google Play", data.playStoreUrl, "secondary")}
            </td>
          </tr>
        </table>
        <div style="margin-top: 16px;">
          ${createButton("Mobile Setup Guide", data.mobileGuideUrl, "ghost")}
        </div>
      </td>
    </tr>
    ${createTipBox("Speed Matters", "Loan officers who respond to reviews within 1 hour see 35% better client satisfaction scores.")}
  `;

  return {
    subject,
    html: wrapInRoleOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Download the RepWell mobile app and manage reviews anywhere.",
      data.currentStep,
      data.totalSteps
    ),
  };
}

/**
 * LO Email 7: Google review management
 */
export function getRoleOnboardingLO7GoogleEmail(
  data: RoleOnboardingLO7GoogleEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `${data.firstName}, master Google reviews`
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
          <span style="font-size: 32px;">🔍</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Google Review Management
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Dominate local search with great reviews
        </p>
      </td>
    </tr>
    <!-- Stats -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: ${colors.text.muted};">Did you know?</p>
          <p style="margin: 0; font-size: 18px; font-weight: 600; color: ${colors.text.primary};">90% of consumers read Google reviews before choosing a business</p>
        </div>
      </td>
    </tr>
    <!-- Features -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          With Google connected, you can:
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${createFeatureItem("🔄", "Auto-Sync Reviews", "All Google reviews appear in your dashboard automatically")}
          ${createFeatureItem("💬", "Respond Faster", "Reply to Google reviews without leaving RepWell")}
          ${createFeatureItem("📈", "Track Rankings", "Monitor your Google Business Profile performance")}
        </table>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Connect Google Account", data.googleConnectUrl, "primary")}
        <div style="margin-top: 12px;">
          ${createButton("View Google Reviews", data.googleReviewsUrl, "ghost")}
        </div>
      </td>
    </tr>
    <!-- Final Message -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.primaryLight}; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          You've completed your feature guide! 🎉
        </p>
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary};">
          You now know everything you need to build an amazing online reputation.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInRoleOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Connect Google and manage all your reviews in one place.",
      data.currentStep,
      data.totalSteps
    ),
  };
}

// ============================================================================
// MANAGER SEQUENCE (6 emails)
// ============================================================================

/**
 * Manager Email 1: Team dashboard overview
 */
export function getRoleOnboardingMgr1TeamDashboardEmail(
  data: RoleOnboardingMgr1TeamDashboardEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `${data.firstName}, meet your team dashboard`
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
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Your Team Dashboard
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Monitor and support your team's reputation success
        </p>
      </td>
    </tr>
    <!-- Team Stats -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <table width="100%" cellpadding="0" cellspacing="8" role="presentation">
          <tr>
            ${createStatCard(String(data.teamSize), "Team Members")}
          </tr>
        </table>
      </td>
    </tr>
    <!-- Features -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          As a manager, you can:
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${createFeatureItem("📊", "Track Team Performance", "See aggregate metrics and individual loan officer stats")}
          ${createFeatureItem("⚖️", "Review Approvals", "Approve or flag reviews before they go public")}
          ${createFeatureItem("🏆", "View Leaderboards", "Motivate your team with friendly competition")}
        </table>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("View Team Dashboard", data.teamDashboardUrl, "primary")}
        <div style="margin-top: 12px;">
          ${createButton("Manage Team Members", data.teamMembersUrl, "ghost")}
        </div>
      </td>
    </tr>
    ${createTipBox("Manager Insight", "Teams whose managers check the dashboard daily have 2x better review collection rates.")}
  `;

  return {
    subject,
    html: wrapInRoleOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Discover your team management tools in RepWell.",
      data.currentStep,
      data.totalSteps
    ),
  };
}

/**
 * Manager Email 2: Review approval workflow
 */
export function getRoleOnboardingMgr2ApprovalsEmail(
  data: RoleOnboardingMgr2ApprovalsEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `${data.firstName}, control what gets published`
  );

  const pendingNotice =
    data.pendingApprovalCount > 0
      ? `<p style="margin: 16px 0 0 0; font-size: 14px; color: ${colors.accent.warning}; font-weight: 600;">You have ${data.pendingApprovalCount} review${data.pendingApprovalCount > 1 ? "s" : ""} pending approval!</p>`
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
          <span style="font-size: 32px;">✅</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Review Approval Workflow
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Quality control for your team's reputation
        </p>
        ${pendingNotice}
      </td>
    </tr>
    <!-- Features -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          Approval workflow options:
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${createFeatureItem("🔒", "Require Approval", "All reviews need manager sign-off before publishing")}
          ${createFeatureItem("⚠️", "Flag Low Ratings", "Only reviews below a threshold need approval")}
          ${createFeatureItem("🚀", "Auto-Approve", "Trust your team with automatic publishing")}
        </table>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("View Approval Queue", data.approvalQueueUrl, "primary")}
        <div style="margin-top: 12px;">
          ${createButton("Configure Settings", data.approvalSettingsUrl, "ghost")}
        </div>
      </td>
    </tr>
    ${createTipBox("Compliance Tip", "Many mortgage companies require manager approval for compliance. Check with your compliance team!")}
  `;

  return {
    subject,
    html: wrapInRoleOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Learn about review approval workflows.",
      data.currentStep,
      data.totalSteps
    ),
  };
}

/**
 * Manager Email 3: Leaderboards and gamification
 */
export function getRoleOnboardingMgr3LeaderboardsEmail(
  data: RoleOnboardingMgr3LeaderboardsEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `${data.firstName}, motivate with friendly competition`
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
          <span style="font-size: 32px;">🏆</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Leaderboards & Gamification
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Turn reputation building into a team sport
        </p>
      </td>
    </tr>
    <!-- Stats -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: ${colors.text.muted};">Teams using leaderboards see</p>
          <p style="margin: 0; font-size: 36px; font-weight: 700; color: ${colors.primary};">47%</p>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: ${colors.text.secondary};">more reviews collected</p>
        </div>
      </td>
    </tr>
    <!-- Features -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          Leaderboard features:
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${createFeatureItem("📊", "Multiple Rankings", "By reviews, rating, response time, and more")}
          ${createFeatureItem("🎯", "Goals & Milestones", "Set team and individual targets")}
          ${createFeatureItem("🏅", "Badges & Recognition", "Celebrate achievements automatically")}
        </table>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("View Leaderboard", data.leaderboardUrl, "primary")}
        <div style="margin-top: 12px;">
          ${createButton("Configure Gamification", data.gamificationSettingsUrl, "ghost")}
        </div>
      </td>
    </tr>
    ${createTipBox("Motivation Hack", "Share the leaderboard in team meetings. Public recognition drives healthy competition!")}
  `;

  return {
    subject,
    html: wrapInRoleOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Discover team leaderboards and gamification features.",
      data.currentStep,
      data.totalSteps
    ),
  };
}

/**
 * Manager Email 4: Reports and exports
 */
export function getRoleOnboardingMgr4ReportsEmail(
  data: RoleOnboardingMgr4ReportsEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `${data.firstName}, data-driven insights for your team`
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
          <span style="font-size: 32px;">📈</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Reports & Exports
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Turn data into actionable insights
        </p>
      </td>
    </tr>
    <!-- Features -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          Available reports:
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${createFeatureItem("📊", "Team Performance", "Review counts, ratings, and trends by team member")}
          ${createFeatureItem("📅", "Scheduled Reports", "Automatic weekly/monthly email summaries")}
          ${createFeatureItem("📥", "Data Exports", "Download CSV/Excel for further analysis")}
          ${createFeatureItem("🎯", "Goal Tracking", "Progress toward team targets")}
        </table>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("View Reports", data.reportsUrl, "primary")}
        <div style="margin-top: 12px;">
          ${createButton("Schedule Reports", data.scheduledReportsUrl, "ghost")}
        </div>
      </td>
    </tr>
    ${createTipBox("Executive Summary", "Schedule a weekly report to your inbox every Monday morning for quick team status checks.")}
  `;

  return {
    subject,
    html: wrapInRoleOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Learn about team reports and data exports.",
      data.currentStep,
      data.totalSteps
    ),
  };
}

/**
 * Manager Email 5: Team performance coaching tips
 */
export function getRoleOnboardingMgr5CoachingEmail(
  data: RoleOnboardingMgr5CoachingEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `${data.firstName}, coaching tips for reputation success`
  );

  const performanceStats =
    data.topPerformersCount || data.lowPerformersCount
      ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <table width="100%" cellpadding="0" cellspacing="8" role="presentation">
          <tr>
            ${data.topPerformersCount ? createStatCard(String(data.topPerformersCount), "Top Performers") : ""}
            ${data.lowPerformersCount ? createStatCard(String(data.lowPerformersCount), "Need Support") : ""}
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
          <span style="font-size: 32px;">🎯</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Coaching Your Team
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Help every team member succeed
        </p>
      </td>
    </tr>
    ${performanceStats}
    <!-- Coaching Tips -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          Proven coaching strategies:
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${createFeatureItem("🌟", "Celebrate Wins", "Publicly recognize top performers in team meetings")}
          ${createFeatureItem("📞", "1:1 Check-ins", "Review individual metrics monthly with struggling team members")}
          ${createFeatureItem("📚", "Share Best Practices", "Have top performers share their techniques")}
          ${createFeatureItem("🎯", "Set Clear Goals", "Give each person a specific, achievable target")}
        </table>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("View Team Analytics", data.teamAnalyticsUrl, "primary")}
      </td>
    </tr>
    ${createTipBox("Management Insight", "Teams with weekly review goals collect 3x more reviews than those without specific targets.")}
  `;

  return {
    subject,
    html: wrapInRoleOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Tips for coaching your team to reputation success.",
      data.currentStep,
      data.totalSteps
    ),
  };
}

/**
 * Manager Email 6: Advanced analytics
 */
export function getRoleOnboardingMgr6AnalyticsEmail(
  data: RoleOnboardingMgr6AnalyticsEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `${data.firstName}, unlock advanced analytics`
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
          <span style="font-size: 32px;">📊</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Advanced Analytics
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Deep insights for strategic decisions
        </p>
      </td>
    </tr>
    <!-- Features -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          Advanced features:
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${createFeatureItem("📈", "Trend Analysis", "Spot patterns over time and predict future performance")}
          ${createFeatureItem("🏢", "Industry Benchmarks", "Compare your team against industry averages")}
          ${createFeatureItem("💬", "Sentiment Insights", "AI-powered analysis of review language")}
          ${createFeatureItem("🔍", "Deep Dives", "Filter and segment data any way you need")}
        </table>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Explore Analytics", data.advancedAnalyticsUrl, "primary")}
        <div style="margin-top: 12px;">
          ${createButton("View Trends", data.trendsUrl, "ghost")}
        </div>
      </td>
    </tr>
    <!-- Final Message -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.primaryLight}; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          You've completed your manager feature guide! 🎉
        </p>
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary};">
          You're ready to lead your team to reputation excellence.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInRoleOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Discover advanced analytics for strategic insights.",
      data.currentStep,
      data.totalSteps
    ),
  };
}

// ============================================================================
// ADMIN SEQUENCE (5 emails)
// ============================================================================

/**
 * Admin Email 1: Settings and configuration
 */
export function getRoleOnboardingAdmin1SettingsEmail(
  data: RoleOnboardingAdmin1SettingsEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `${data.firstName}, configure your RepWell account`
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
          <span style="font-size: 32px;">⚙️</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Settings & Configuration
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Customize RepWell for your organization
        </p>
      </td>
    </tr>
    <!-- Setup Progress -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.border.subtle}; border-radius: 8px; height: 8px; overflow: hidden;">
          <div style="background-color: ${colors.primary}; height: 100%; width: ${data.setupProgress}%; border-radius: 8px;"></div>
        </div>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center;">
          Setup is ${data.setupProgress}% complete
        </p>
      </td>
    </tr>
    <!-- Features -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          Key settings to configure:
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${createFeatureItem("🎨", "Branding", "Add your logo, colors, and customize email templates")}
          ${createFeatureItem("🔔", "Notifications", "Control who gets alerted and when")}
          ${createFeatureItem("🔒", "Security", "Configure SSO, 2FA, and access controls")}
        </table>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Open Settings", data.settingsUrl, "primary")}
        <div style="margin-top: 12px;">
          ${createButton("Configure Branding", data.brandingUrl, "ghost")}
        </div>
      </td>
    </tr>
    ${createTipBox("Quick Win", "Start with branding - adding your logo to emails increases response rates by 20%.")}
  `;

  return {
    subject,
    html: wrapInRoleOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Configure RepWell settings for your organization.",
      data.currentStep,
      data.totalSteps
    ),
  };
}

/**
 * Admin Email 2: User management and permissions
 */
export function getRoleOnboardingAdmin2UsersEmail(
  data: RoleOnboardingAdmin2UsersEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `${data.firstName}, manage your team members`
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
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          User Management
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Control access and permissions
        </p>
      </td>
    </tr>
    <!-- Team Stats -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <table width="100%" cellpadding="0" cellspacing="8" role="presentation">
          <tr>
            ${createStatCard(String(data.teamCount), "Current Users")}
          </tr>
        </table>
      </td>
    </tr>
    <!-- Features -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          User management features:
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${createFeatureItem("📧", "Invite Users", "Send invitations to new team members")}
          ${createFeatureItem("🎭", "Assign Roles", "Admin, Manager, or Loan Officer permissions")}
          ${createFeatureItem("🔐", "Access Control", "Limit what each role can see and do")}
        </table>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Manage Users", data.usersUrl, "primary")}
        <div style="margin-top: 12px;">
          ${createButton("Invite Team Members", data.inviteUrl, "ghost")}
        </div>
      </td>
    </tr>
    ${createTipBox("Role Guide", "Loan Officers collect reviews, Managers oversee teams, Admins control settings and billing.")}
  `;

  return {
    subject,
    html: wrapInRoleOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Learn about user management and permissions.",
      data.currentStep,
      data.totalSteps
    ),
  };
}

/**
 * Admin Email 3: Integration setup deep dive
 */
export function getRoleOnboardingAdmin3IntegrationsEmail(
  data: RoleOnboardingAdmin3IntegrationsEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `${data.firstName}, connect your tools to RepWell`
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
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Integrations Deep Dive
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Connect your existing tools for seamless workflows
        </p>
      </td>
    </tr>
    <!-- Stats -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <table width="100%" cellpadding="0" cellspacing="8" role="presentation">
          <tr>
            ${createStatCard(String(data.connectedIntegrationsCount), "Connected")}
          </tr>
        </table>
      </td>
    </tr>
    <!-- Features -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          Available integrations:
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${createFeatureItem("🔍", "Google Business Profile", "Sync reviews and respond from RepWell")}
          ${createFeatureItem("📊", "CRM Integration", "Auto-send surveys after loan closes")}
          ${createFeatureItem("🔧", "Webhooks", "Connect to custom systems via API")}
          ${createFeatureItem("📱", "Social Media", "Auto-publish reviews to LinkedIn, Facebook")}
        </table>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("View Integrations", data.integrationsUrl, "primary")}
        <div style="margin-top: 12px;">
          ${createButton("Connect Google", data.googleConnectUrl, "ghost")}
        </div>
      </td>
    </tr>
    ${createTipBox("Automation Power", "CRM integration automates survey sends - no manual work for loan officers!")}
  `;

  return {
    subject,
    html: wrapInRoleOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Connect your tools to RepWell for seamless workflows.",
      data.currentStep,
      data.totalSteps
    ),
  };
}

/**
 * Admin Email 4: Billing and subscription management
 */
export function getRoleOnboardingAdmin4BillingEmail(
  data: RoleOnboardingAdmin4BillingEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `${data.firstName}, manage your RepWell subscription`
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
          <span style="font-size: 32px;">💳</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Billing & Subscription
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Manage your plan and payment details
        </p>
      </td>
    </tr>
    <!-- Current Plan -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 12px; padding: 24px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: ${colors.text.muted};">Current Plan</p>
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${colors.primary};">${escapeHtml(data.currentPlan)}</p>
        </div>
      </td>
    </tr>
    <!-- Features -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          Billing features:
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${createFeatureItem("📄", "View Invoices", "Access all past invoices and receipts")}
          ${createFeatureItem("💳", "Update Payment", "Change your credit card or billing info")}
          ${createFeatureItem("📈", "Upgrade Plan", "Add more users or unlock features")}
        </table>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Manage Billing", data.billingUrl, "primary")}
        <div style="margin-top: 12px;">
          ${createButton("View Plans", data.plansUrl, "ghost")}
        </div>
      </td>
    </tr>
    ${createTipBox("Billing Tip", "Annual plans save 20% compared to monthly. Consider upgrading if you're committed long-term.")}
  `;

  return {
    subject,
    html: wrapInRoleOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Manage your RepWell subscription and billing.",
      data.currentStep,
      data.totalSteps
    ),
  };
}

/**
 * Admin Email 5: Compliance and audit features
 */
export function getRoleOnboardingAdmin5ComplianceEmail(
  data: RoleOnboardingAdmin5ComplianceEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    `${data.firstName}, compliance and security features`
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
          <span style="font-size: 32px;">🔒</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
          Compliance & Audit
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Stay compliant and keep your data secure
        </p>
      </td>
    </tr>
    <!-- Features -->
    <tr>
      <td style="padding: 0 40px 32px 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          Compliance features:
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${createFeatureItem("📋", "Audit Logs", "Track all user actions and changes")}
          ${createFeatureItem("📥", "Data Export", "Export all data for compliance reporting")}
          ${createFeatureItem("🔐", "Security Settings", "Configure 2FA, session timeouts, IP restrictions")}
          ${createFeatureItem("📜", "Consent Management", "Track customer consent for review collection")}
        </table>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("View Audit Log", data.auditLogUrl, "primary")}
        <div style="margin-top: 12px;">
          ${createButton("Security Settings", data.securitySettingsUrl, "ghost")}
        </div>
      </td>
    </tr>
    <!-- Final Message -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.primaryLight}; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
          You've completed your admin feature guide! 🎉
        </p>
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary};">
          You're ready to manage ${escapeHtml(data.organizationName)}'s reputation platform.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInRoleOnboardingEmailTemplate(
      content,
      data.unsubscribeUrl,
      "Learn about compliance and audit features.",
      data.currentStep,
      data.totalSteps
    ),
  };
}
