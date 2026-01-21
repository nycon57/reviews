/**
 * Trial Ending Sequence Email Templates
 *
 * Conversion-focused sequence for trial users approaching trial end:
 * - Email 1 (7 days before): Trial ending soon - what you've accomplished
 * - Email 2 (3 days before): Feature comparison - what you'll lose vs keep
 * - Email 3 (1 day before): Final reminder with easy upgrade CTA
 * - Email 4 (Trial ended): Grace period notice (if applicable)
 * - Email 5 (3 days after): Win-back offer (if applicable)
 */

import type {
  TrialEnding1AccomplishmentsEmailData,
  TrialEnding2FeatureComparisonEmailData,
  TrialEnding3FinalReminderEmailData,
  TrialEnding4GracePeriodEmailData,
  TrialEnding5WinbackEmailData,
  TrialUsageStats,
  TrialFeatureComparison,
  TrialPricingInfo,
  TrialSpecialOffer,
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
// Subject Line Variants (Personalized)
// ============================================================================

export const TRIAL_ENDING_SUBJECT_LINES = {
  email_1: {
    A: (firstName: string, daysRemaining: number) =>
      `${firstName}, you have ${daysRemaining} days left to keep your progress`,
    B: (firstName: string, reviewCount: number) =>
      reviewCount > 0
        ? `${firstName}, don't lose your ${reviewCount} reviews`
        : `${firstName}, your trial is ending soon`,
  },
  email_2: {
    A: (daysRemaining: number) =>
      `${daysRemaining} days left: Here's what you'll lose access to`,
    B: () => `See what's included in your free trial`,
  },
  email_3: {
    urgency: () => `Tomorrow is the last day of your trial`,
    value: (firstName: string) =>
      `${firstName}, keep building your reputation`,
  },
  email_4: {
    A: (gracePeriodDays: number) =>
      `Your trial ended - ${gracePeriodDays} day grace period activated`,
    B: () => `Your account has been downgraded`,
  },
  email_5: {
    A: (firstName: string) => `${firstName}, we want you back`,
    B: (discountPercent: number) =>
      `Special offer: ${discountPercent}% off to come back`,
  },
} as const;

// ============================================================================
// Base Email Wrapper
// ============================================================================

function wrapInTrialEndingEmailTemplate(
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
                <a href="${sanitizeUrl(unsubscribeUrl)}" style="color: ${colors.text.muted}; text-decoration: underline;">Unsubscribe from trial notifications</a>
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
  variant: "primary" | "secondary" | "ghost" | "warning" = "primary"
): string {
  const styles = {
    primary: `background-color: ${colors.primary}; color: #ffffff; border: none;`,
    secondary: `background-color: transparent; color: ${colors.primary}; border: 2px solid ${colors.primary};`,
    ghost: `background-color: transparent; color: ${colors.text.secondary}; border: 1px solid ${colors.border.default};`,
    warning: `background-color: ${colors.accent.warning}; color: #ffffff; border: none;`,
  };

  return `
    <a href="${sanitizeUrl(url)}" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; ${styles[variant]} transition: opacity 0.2s;">
      ${escapeHtml(text)}
    </a>
  `;
}

function createStatCard(value: string, label: string, icon?: string): string {
  const iconHtml = icon
    ? `<div style="font-size: 20px; margin-bottom: 4px;">${icon}</div>`
    : "";
  return `
    <td style="text-align: center; padding: 16px 12px; background-color: ${colors.background.subtle}; border-radius: 8px; width: 25%;">
      ${iconHtml}
      <div style="font-size: 28px; font-weight: 700; color: ${colors.primary}; line-height: 1.2;">
        ${escapeHtml(value)}
      </div>
      <div style="font-size: 12px; color: ${colors.text.secondary}; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
        ${escapeHtml(label)}
      </div>
    </td>
  `;
}

function createFeatureRow(
  feature: TrialFeatureComparison,
  index: number
): string {
  const bgColor = index % 2 === 0 ? colors.background.white : colors.background.subtle;
  const usedBadge = feature.userHasUsed
    ? `<span style="display: inline-block; background-color: ${colors.primaryLight}; color: ${colors.text.primary}; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">USED</span>`
    : "";
  const freeIcon = feature.includedInFree ? "&#10003;" : "&#10007;";
  const paidIcon = feature.includedInPaid ? "&#10003;" : "&#10007;";
  const freeColor = feature.includedInFree ? colors.accent.success : colors.accent.error;
  const paidColor = feature.includedInPaid ? colors.accent.success : colors.accent.error;

  return `
    <tr style="background-color: ${bgColor};">
      <td style="padding: 12px 16px; border-bottom: 1px solid ${colors.border.subtle};">
        <div style="font-size: 14px; font-weight: 500; color: ${colors.text.primary};">
          ${escapeHtml(feature.featureName)}${usedBadge}
        </div>
        <div style="font-size: 12px; color: ${colors.text.secondary}; margin-top: 2px;">
          ${escapeHtml(feature.description)}
        </div>
      </td>
      <td style="padding: 12px 16px; text-align: center; border-bottom: 1px solid ${colors.border.subtle};">
        <span style="font-size: 18px; color: ${freeColor};">${freeIcon}</span>
      </td>
      <td style="padding: 12px 16px; text-align: center; border-bottom: 1px solid ${colors.border.subtle};">
        <span style="font-size: 18px; color: ${paidColor};">${paidIcon}</span>
      </td>
    </tr>
  `;
}

function createPricingCard(pricing: TrialPricingInfo): string {
  const annualMonthly = Math.round(pricing.annualPrice / 12);
  const featuresHtml = pricing.features
    .slice(0, 4)
    .map(
      (f) =>
        `<li style="margin: 8px 0; font-size: 14px; color: ${colors.text.secondary};">${escapeHtml(f)}</li>`
    )
    .join("");

  return `
    <div style="background-color: ${colors.background.subtle}; border: 2px solid ${colors.primary}; border-radius: 12px; padding: 24px; text-align: center;">
      <div style="font-size: 14px; font-weight: 600; color: ${colors.primary}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
        ${escapeHtml(pricing.planName)}
      </div>
      <div style="margin-bottom: 16px;">
        <span style="font-size: 36px; font-weight: 700; color: ${colors.text.primary};">$${annualMonthly}</span>
        <span style="font-size: 16px; color: ${colors.text.secondary};">/month</span>
      </div>
      <div style="font-size: 12px; color: ${colors.accent.success}; margin-bottom: 16px;">
        Save ${pricing.annualDiscount}% with annual billing ($${pricing.annualPrice}/year)
      </div>
      <ul style="list-style: none; padding: 0; margin: 0 0 16px 0; text-align: left;">
        ${featuresHtml}
      </ul>
    </div>
  `;
}

function createSpecialOfferBanner(offer: TrialSpecialOffer): string {
  let offerText = "";
  switch (offer.offerType) {
    case "discount":
      offerText = `Get ${offer.discountPercent}% off your first payment`;
      break;
    case "extended_trial":
      offerText = `Get ${offer.extendedDays} more days free`;
      break;
    case "free_month":
      offerText = `Get your first month free`;
      break;
  }

  const expiresDate = new Date(offer.expiresAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return `
    <div style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); border-radius: 12px; padding: 20px 24px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 12px; color: ${colors.text.inverseMuted}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
        Special Offer
      </div>
      <div style="font-size: 20px; font-weight: 700; color: ${colors.text.inverse}; margin-bottom: 8px;">
        ${offerText}
      </div>
      <div style="font-size: 14px; color: ${colors.text.inverseMuted};">
        Use code <strong style="color: ${colors.text.inverse};">${escapeHtml(offer.offerCode)}</strong> &bull; Expires ${expiresDate}
      </div>
    </div>
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

function createUsageStatsGrid(stats: TrialUsageStats): string {
  const statCards = [];

  if (stats.totalReviews > 0) {
    statCards.push(createStatCard(String(stats.totalReviews), "Reviews"));
  }
  if (stats.averageRating !== null) {
    statCards.push(createStatCard(stats.averageRating.toFixed(1), "Avg Rating", "&#11088;"));
  }
  if (stats.surveysSent > 0) {
    statCards.push(createStatCard(String(stats.surveysSent), "Surveys Sent"));
  }
  if (stats.videoTestimonials > 0) {
    statCards.push(createStatCard(String(stats.videoTestimonials), "Videos"));
  }
  if (stats.teamMembersAdded > 0) {
    statCards.push(createStatCard(String(stats.teamMembersAdded), "Team Members"));
  }

  if (statCards.length === 0) {
    return "";
  }

  // Limit to 4 cards max
  const displayCards = statCards.slice(0, 4);

  return `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <table width="100%" cellpadding="8" cellspacing="0" role="presentation">
          <tr>
            ${displayCards.join('<td width="8"></td>')}
          </tr>
        </table>
      </td>
    </tr>
  `;
}

// ============================================================================
// Email 1: Trial Ending Soon - What You've Accomplished (7 days before)
// ============================================================================

export function getTrialEnding1AccomplishmentsEmail(
  data: TrialEnding1AccomplishmentsEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    TRIAL_ENDING_SUBJECT_LINES.email_1.A(data.firstName, data.daysRemaining)
  );

  const hasActivity =
    data.usageStats.totalReviews > 0 ||
    data.usageStats.surveysSent > 0 ||
    data.usageStats.videoTestimonials > 0;

  const accomplishmentMessage = hasActivity
    ? `You've been building something great. In just ${14 - data.daysRemaining} days, look at what you've accomplished:`
    : `Your trial is ending soon, but there's still time to experience the full power of RepWell.`;

  const roiSection =
    data.roiEstimate
      ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.primaryLight}; border-radius: 8px; padding: 16px 20px;">
          <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary}; margin-bottom: 8px;">
            Your RepWell Impact
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding: 4px 0;">
                <span style="font-size: 14px; color: ${colors.text.secondary};">Time saved:</span>
                <span style="font-size: 14px; font-weight: 600; color: ${colors.text.primary}; float: right;">${escapeHtml(data.roiEstimate.timeSaved)}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">
                <span style="font-size: 14px; color: ${colors.text.secondary};">Reputation impact:</span>
                <span style="font-size: 14px; font-weight: 600; color: ${colors.text.primary}; float: right;">${escapeHtml(data.roiEstimate.reputationImpact)}</span>
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
  `
      : "";

  const topAccomplishmentSection = data.topAccomplishment
    ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-left: 4px solid ${colors.accent.success}; border-radius: 0 8px 8px 0; padding: 16px 20px;">
          <div style="font-size: 12px; font-weight: 600; color: ${colors.accent.success}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
            Top Accomplishment
          </div>
          <div style="font-size: 16px; color: ${colors.text.primary};">
            ${escapeHtml(data.topAccomplishment)}
          </div>
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
        <div style="display: inline-block; background-color: ${colors.accent.warning}20; color: ${colors.accent.warning}; font-size: 14px; font-weight: 600; padding: 6px 16px; border-radius: 20px; margin-bottom: 16px;">
          ${data.daysRemaining} days remaining
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          ${escapeHtml(data.firstName)}, look how far you've come!
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          ${accomplishmentMessage}
        </p>
      </td>
    </tr>
    <!-- Usage Stats -->
    ${createUsageStatsGrid(data.usageStats)}
    <!-- Top Accomplishment -->
    ${topAccomplishmentSection}
    <!-- ROI Section -->
    ${roiSection}
    <!-- Trial End Notice -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.muted}; border-radius: 8px; padding: 16px 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary};">
            Your trial ends on <strong style="color: ${colors.text.primary};">${formatDate(data.trialEndsAt)}</strong>
          </p>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: ${colors.text.secondary};">
            Upgrade now to keep your reviews, surveys, and team data.
          </p>
        </div>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Upgrade to Keep Your Progress", data.upgradeUrl, "primary")}
        <div style="margin-top: 12px;">
          <a href="${sanitizeUrl(data.pricingUrl)}" style="font-size: 14px; color: ${colors.primary}; text-decoration: underline;">View pricing options</a>
        </div>
      </td>
    </tr>
    <!-- Support Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          Have questions? Reply to this email and we'll help you find the right plan for your team.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInTrialEndingEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Your trial ends in ${data.daysRemaining} days. Don't lose your progress!`
    ),
  };
}

// ============================================================================
// Email 2: Feature Comparison - What You'll Lose vs Keep (3 days before)
// ============================================================================

export function getTrialEnding2FeatureComparisonEmail(
  data: TrialEnding2FeatureComparisonEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    TRIAL_ENDING_SUBJECT_LINES.email_2.A(data.daysRemaining)
  );

  const featureRowsHtml = data.featureComparison
    .slice(0, 6)
    .map((feature, index) => createFeatureRow(feature, index))
    .join("");

  const featuresAtRiskHtml =
    data.featuresAtRisk.length > 0
      ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.accent.error}10; border-left: 4px solid ${colors.accent.error}; border-radius: 0 8px 8px 0; padding: 16px 20px;">
          <div style="font-size: 14px; font-weight: 600; color: ${colors.accent.error}; margin-bottom: 8px;">
            Features you'll lose access to:
          </div>
          <ul style="margin: 0; padding: 0 0 0 20px;">
            ${data.featuresAtRisk.map((f) => `<li style="font-size: 14px; color: ${colors.text.secondary}; margin: 4px 0;">${escapeHtml(f)}</li>`).join("")}
          </ul>
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
        <div style="display: inline-block; background-color: ${colors.accent.warning}20; color: ${colors.accent.warning}; font-size: 14px; font-weight: 600; padding: 6px 16px; border-radius: 20px; margin-bottom: 16px;">
          Only ${data.daysRemaining} days left
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Here's what changes when your trial ends
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          You've used <strong>${data.featuresUsedCount} premium features</strong> during your trial
        </p>
      </td>
    </tr>
    <!-- Feature Comparison Table -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border: 1px solid ${colors.border.default}; border-radius: 8px; overflow: hidden;">
          <tr style="background-color: ${colors.background.muted};">
            <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: ${colors.text.secondary}; text-transform: uppercase; letter-spacing: 0.5px;">
              Feature
            </th>
            <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: ${colors.text.secondary}; text-transform: uppercase; letter-spacing: 0.5px; width: 80px;">
              Free
            </th>
            <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: ${colors.primary}; text-transform: uppercase; letter-spacing: 0.5px; width: 80px;">
              Pro
            </th>
          </tr>
          ${featureRowsHtml}
        </table>
      </td>
    </tr>
    <!-- Features At Risk -->
    ${featuresAtRiskHtml}
    <!-- Pricing Card -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        ${createPricingCard(data.pricing)}
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Upgrade Now", data.upgradeUrl, "primary")}
        <div style="margin-top: 12px;">
          <a href="${sanitizeUrl(data.pricingUrl)}" style="font-size: 14px; color: ${colors.primary}; text-decoration: underline;">Compare all plans</a>
        </div>
      </td>
    </tr>
    <!-- Guarantee Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          &#10003; 30-day money-back guarantee &bull; Cancel anytime &bull; No long-term contracts
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInTrialEndingEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Only ${data.daysRemaining} days left. See what you'll keep vs. lose.`
    ),
  };
}

// ============================================================================
// Email 3: Final Reminder with Easy Upgrade CTA (1 day before)
// ============================================================================

export function getTrialEnding3FinalReminderEmail(
  data: TrialEnding3FinalReminderEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    data.messageVariant === "urgency"
      ? TRIAL_ENDING_SUBJECT_LINES.email_3.urgency()
      : TRIAL_ENDING_SUBJECT_LINES.email_3.value(data.firstName)
  );

  const headerEmoji = data.messageVariant === "urgency" ? "&#9888;" : "&#128640;";
  const headerTitle =
    data.messageVariant === "urgency"
      ? "Your trial ends tomorrow"
      : `${data.firstName}, don't stop now`;
  const headerMessage =
    data.messageVariant === "urgency"
      ? "This is your last chance to upgrade without losing your data and progress."
      : "You've built something valuable. Keep the momentum going with RepWell Pro.";

  const specialOfferSection = data.specialOffer
    ? createSpecialOfferBanner(data.specialOffer)
    : "";

  const urgencyBox =
    data.messageVariant === "urgency"
      ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.accent.error}10; border: 1px solid ${colors.accent.error}; border-radius: 8px; padding: 16px 20px; text-align: center;">
          <div style="font-size: 16px; font-weight: 600; color: ${colors.accent.error}; margin-bottom: 4px;">
            What happens tomorrow:
          </div>
          <ul style="margin: 8px 0 0 0; padding: 0; list-style: none; font-size: 14px; color: ${colors.text.secondary};">
            <li style="margin: 4px 0;">&#10007; Your ${data.usageStats.totalReviews} reviews become read-only</li>
            <li style="margin: 4px 0;">&#10007; Team members lose access</li>
            <li style="margin: 4px 0;">&#10007; Automated features are paused</li>
          </ul>
        </div>
      </td>
    </tr>
  `
      : "";

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.accent.error} 0%, ${colors.accent.warning} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.accent.warning}20; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">${headerEmoji}</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          ${escapeHtml(headerTitle)}
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          ${headerMessage}
        </p>
      </td>
    </tr>
    <!-- Special Offer -->
    ${specialOfferSection ? `<tr><td style="padding: 0 40px 24px 40px;">${specialOfferSection}</td></tr>` : ""}
    <!-- Usage Stats -->
    ${createUsageStatsGrid(data.usageStats)}
    <!-- Urgency Box -->
    ${urgencyBox}
    <!-- Pricing Summary -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 8px; padding: 20px; text-align: center;">
          <div style="font-size: 14px; color: ${colors.text.secondary}; margin-bottom: 8px;">
            ${escapeHtml(data.pricing.planName)} - Starting at
          </div>
          <div style="font-size: 32px; font-weight: 700; color: ${colors.primary};">
            $${Math.round(data.pricing.annualPrice / 12)}<span style="font-size: 16px; font-weight: 400;">/month</span>
          </div>
          <div style="font-size: 12px; color: ${colors.accent.success}; margin-top: 4px;">
            Save ${data.pricing.annualDiscount}% with annual billing
          </div>
        </div>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Upgrade Now - Keep Everything", data.upgradeUrl, "primary")}
        <div style="margin-top: 16px;">
          ${createButton("View All Plans", data.pricingUrl, "secondary")}
        </div>
      </td>
    </tr>
    <!-- Support Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          Questions? Reply to this email or chat with us at ${emailConfig.baseUrl}/help
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInTrialEndingEmailTemplate(
      content,
      data.unsubscribeUrl,
      data.messageVariant === "urgency"
        ? "Tomorrow is the last day. Don't lose your data."
        : `Keep building your reputation, ${data.firstName}.`
    ),
  };
}

// ============================================================================
// Email 4: Grace Period Notice (trial ended)
// ============================================================================

export function getTrialEnding4GracePeriodEmail(
  data: TrialEnding4GracePeriodEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    TRIAL_ENDING_SUBJECT_LINES.email_4.A(data.gracePeriodDays)
  );

  const accountStatusMessage = {
    grace_period: `We've given you ${data.gracePeriodDays} more days to decide. Your account is fully functional until ${formatDate(data.gracePeriodEndsAt)}.`,
    limited_access: "Your account has been downgraded. You can still view your data, but some features are now restricted.",
    read_only: "Your account is now in read-only mode. Upgrade to regain full access.",
  };

  const restrictedFeaturesHtml =
    data.restrictedFeatures.length > 0
      ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.muted}; border-radius: 8px; padding: 16px 20px;">
          <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary}; margin-bottom: 8px;">
            Restricted features:
          </div>
          <ul style="margin: 0; padding: 0 0 0 20px;">
            ${data.restrictedFeatures.map((f) => `<li style="font-size: 14px; color: ${colors.text.secondary}; margin: 4px 0;">${escapeHtml(f)}</li>`).join("")}
          </ul>
        </div>
      </td>
    </tr>
  `
      : "";

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.text.muted} 0%, ${colors.accent.warning} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.accent.warning}20; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">&#9203;</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Your trial has ended
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          ${accountStatusMessage[data.accountStatus]}
        </p>
      </td>
    </tr>
    <!-- Grace Period Countdown -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.accent.warning}15; border: 1px solid ${colors.accent.warning}; border-radius: 8px; padding: 20px; text-align: center;">
          <div style="font-size: 14px; color: ${colors.text.secondary}; margin-bottom: 4px;">
            Grace period ends in
          </div>
          <div style="font-size: 36px; font-weight: 700; color: ${colors.accent.warning};">
            ${data.gracePeriodDays} days
          </div>
          <div style="font-size: 14px; color: ${colors.text.muted}; margin-top: 4px;">
            ${formatDate(data.gracePeriodEndsAt)}
          </div>
        </div>
      </td>
    </tr>
    <!-- What You've Built -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary}; margin-bottom: 12px; text-align: center;">
          Don't lose what you've built
        </div>
        ${createUsageStatsGrid(data.usageStats) ? "" : ""}
      </td>
    </tr>
    ${createUsageStatsGrid(data.usageStats)}
    <!-- Restricted Features -->
    ${restrictedFeaturesHtml}
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Upgrade Now", data.upgradeUrl, "warning")}
        <div style="margin-top: 12px;">
          <a href="${sanitizeUrl(data.pricingUrl)}" style="font-size: 14px; color: ${colors.primary}; text-decoration: underline;">View pricing options</a>
        </div>
      </td>
    </tr>
    <!-- Data Export Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          Need to export your data? <a href="${sanitizeUrl(data.dashboardUrl + "/settings/export")}" style="color: ${colors.primary}; text-decoration: underline;">Download your reviews and surveys</a> before the grace period ends.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInTrialEndingEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Your trial ended. You have ${data.gracePeriodDays} days to upgrade.`
    ),
  };
}

// ============================================================================
// Email 5: Win-Back Offer (3 days after trial ended)
// ============================================================================

export function getTrialEnding5WinbackEmail(
  data: TrialEnding5WinbackEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    data.specialOffer.discountPercent
      ? TRIAL_ENDING_SUBJECT_LINES.email_5.B(data.specialOffer.discountPercent)
      : TRIAL_ENDING_SUBJECT_LINES.email_5.A(data.firstName)
  );

  const personalMessage = data.isHighValueProspect
    ? `As one of our most engaged trial users, we'd hate to see you go without giving it one more shot.`
    : `We noticed you haven't upgraded yet. We'd love to have you as part of the RepWell family.`;

  const competitorSection = data.competitorMention
    ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 8px; padding: 16px 20px;">
          <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; line-height: 1.6;">
            <strong>Comparing alternatives?</strong> ${escapeHtml(data.competitorMention)}
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
          <span style="font-size: 32px;">&#128140;</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          ${escapeHtml(data.firstName)}, we want you back
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          ${personalMessage}
        </p>
      </td>
    </tr>
    <!-- Special Offer Banner -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        ${createSpecialOfferBanner(data.specialOffer)}
      </td>
    </tr>
    <!-- What They Accomplished -->
    <tr>
      <td style="padding: 0 40px 8px 40px;">
        <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary}; text-align: center; margin-bottom: 12px;">
          Remember what you built during your trial?
        </div>
      </td>
    </tr>
    ${createUsageStatsGrid(data.usageStats)}
    <!-- Competitor Section -->
    ${competitorSection}
    <!-- Testimonial / Social Proof -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 8px; padding: 20px; text-align: center;">
          <div style="font-size: 16px; font-style: italic; color: ${colors.text.secondary}; line-height: 1.6; margin-bottom: 12px;">
            "RepWell helped us increase our review response rate by 300% in the first month."
          </div>
          <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary};">
            &#8212; Sarah M., Branch Manager
          </div>
        </div>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Claim Your Offer", data.upgradeUrl, "primary")}
        <div style="margin-top: 16px;">
          ${createButton("See What's Included", data.pricingUrl, "secondary")}
        </div>
      </td>
    </tr>
    <!-- No Pressure Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          No pressure. We just wanted to make sure you knew this offer was available. If now isn't the right time, we understand.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInTrialEndingEmailTemplate(
      content,
      data.unsubscribeUrl,
      data.specialOffer.discountPercent
        ? `Special offer: ${data.specialOffer.discountPercent}% off to come back`
        : `${data.firstName}, we miss you. Here's a special offer.`
    ),
  };
}
