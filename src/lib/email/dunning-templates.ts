/**
 * Failed Payment Recovery (Dunning) Sequence Email Templates
 *
 * Revenue recovery sequence when subscription payment fails:
 * - Email 1 (Day 0): Friendly payment failed notice
 * - Email 2 (Day 3): Reminder with easy update payment link
 * - Email 3 (Day 7): Urgent notice - service may be interrupted
 * - Email 4 (Day 10): Final warning before suspension
 * - Email 5 (Day 14): Account suspended notice with recovery path
 *
 * Design principles:
 * - Assume card expired or bank issue (not the customer's fault)
 * - Avoid guilt, maintain positive relationship
 * - Clear update payment CTA linking to Stripe Customer Portal
 * - Explain what happens at each stage
 * - Include common card decline reasons and solutions
 */

import type {
  Dunning1PaymentFailedEmailData,
  Dunning2ReminderEmailData,
  Dunning3UrgentEmailData,
  Dunning4FinalWarningEmailData,
  Dunning5SuspendedEmailData,
  PaymentDeclineReason,
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

export const DUNNING_SUBJECT_LINES = {
  email_1: {
    A: () => `Action needed: Your payment didn't go through`,
    B: (firstName: string) => `${firstName}, we couldn't process your payment`,
  },
  email_2: {
    A: () => `Reminder: Please update your payment method`,
    B: (daysSince: number) =>
      `Your payment is ${daysSince} days overdue - quick fix needed`,
  },
  email_3: {
    A: (daysUntil: number) =>
      `Urgent: Service interruption in ${daysUntil} days`,
    B: () => `Your RepWell access may be interrupted soon`,
  },
  email_4: {
    A: () => `Final notice: Action required to keep your account active`,
    B: (suspensionDate: string) =>
      `Your account will be suspended on ${suspensionDate}`,
  },
  email_5: {
    A: () => `Your RepWell account has been suspended`,
    B: (firstName: string) => `${firstName}, your account is on hold`,
  },
} as const;

// ============================================================================
// Decline Reason Messages
// ============================================================================

export function getDeclineReasonMessage(
  reason: PaymentDeclineReason
): { title: string; message: string; solutions: string[] } {
  const messages: Record<
    PaymentDeclineReason,
    { title: string; message: string; solutions: string[] }
  > = {
    card_declined: {
      title: "Card Declined",
      message:
        "Your bank declined the transaction. This can happen for various security reasons.",
      solutions: [
        "Contact your bank to authorize the charge",
        "Try a different payment method",
        "Check if your card has spending limits",
      ],
    },
    insufficient_funds: {
      title: "Insufficient Funds",
      message:
        "There weren't enough funds available on your card to complete the payment.",
      solutions: [
        "Add funds to your account",
        "Try a different payment method",
        "Contact your bank if this seems incorrect",
      ],
    },
    expired_card: {
      title: "Expired Card",
      message:
        "The card on file has expired. This is an easy fix!",
      solutions: [
        "Update your card details with your new expiration date",
        "Add a new payment method",
      ],
    },
    incorrect_cvc: {
      title: "Security Code Issue",
      message:
        "There was an issue verifying your card's security code.",
      solutions: [
        "Re-enter your payment details carefully",
        "Ensure you're using the correct CVC/CVV",
      ],
    },
    processing_error: {
      title: "Processing Error",
      message:
        "We encountered a temporary issue processing your payment. This isn't your fault.",
      solutions: [
        "We'll automatically retry the payment",
        "No action needed unless the issue persists",
        "Contact us if you continue to see this error",
      ],
    },
    fraud_suspected: {
      title: "Payment Blocked",
      message:
        "Your bank's fraud protection may have blocked this transaction.",
      solutions: [
        "Contact your bank to approve charges from RepWell",
        "Add RepWell as an authorized merchant",
        "Try a different payment method",
      ],
    },
    unknown: {
      title: "Payment Issue",
      message:
        "We couldn't process your payment. Don't worry - this is usually easy to resolve.",
      solutions: [
        "Try updating your payment method",
        "Contact your bank for more details",
        "Reach out to our support team if you need help",
      ],
    },
  };

  return messages[reason];
}

// ============================================================================
// Base Email Wrapper
// ============================================================================

function wrapInDunningEmailTemplate(
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
                <a href="${sanitizeUrl(unsubscribeUrl)}" style="color: ${colors.text.muted}; text-decoration: underline;">Unsubscribe from billing notifications</a>
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
  variant: "primary" | "secondary" | "ghost" | "warning" | "error" = "primary"
): string {
  const styles = {
    primary: `background-color: ${colors.primary}; color: #ffffff; border: none;`,
    secondary: `background-color: transparent; color: ${colors.primary}; border: 2px solid ${colors.primary};`,
    ghost: `background-color: transparent; color: ${colors.text.secondary}; border: 1px solid ${colors.border.default};`,
    warning: `background-color: ${colors.accent.warning}; color: #ffffff; border: none;`,
    error: `background-color: ${colors.accent.error}; color: #ffffff; border: none;`,
  };

  return `
    <a href="${sanitizeUrl(url)}" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; ${styles[variant]} transition: opacity 0.2s;">
      ${escapeHtml(text)}
    </a>
  `;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

function formatShortDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

function createPaymentMethodCard(
  paymentMethod: { cardBrand: string | null; cardLast4: string | null; cardExpMonth: number | null; cardExpYear: number | null } | null
): string {
  if (!paymentMethod || !paymentMethod.cardLast4) {
    return "";
  }

  const brandName = paymentMethod.cardBrand
    ? paymentMethod.cardBrand.charAt(0).toUpperCase() + paymentMethod.cardBrand.slice(1)
    : "Card";

  const expiry =
    paymentMethod.cardExpMonth && paymentMethod.cardExpYear
      ? `${String(paymentMethod.cardExpMonth).padStart(2, "0")}/${String(paymentMethod.cardExpYear).slice(-2)}`
      : "";

  return `
    <div style="background-color: ${colors.background.subtle}; border-radius: 8px; padding: 16px 20px; display: inline-block;">
      <div style="font-size: 14px; color: ${colors.text.secondary}; margin-bottom: 4px;">
        Payment method on file:
      </div>
      <div style="font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
        ${escapeHtml(brandName)} ending in ${escapeHtml(paymentMethod.cardLast4)}
        ${expiry ? `<span style="color: ${colors.text.muted}; font-weight: 400;"> (exp. ${escapeHtml(expiry)})</span>` : ""}
      </div>
    </div>
  `;
}

function createAccountSummaryCard(
  summary: { totalReviews: number; totalSurveys: number; teamMembersCount: number; currentPlan: string }
): string {
  return `
    <div style="background-color: ${colors.background.subtle}; border-radius: 8px; padding: 20px;">
      <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary}; margin-bottom: 12px;">
        Your Account
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="padding: 4px 0; font-size: 14px; color: ${colors.text.secondary};">
            Plan
          </td>
          <td style="padding: 4px 0; font-size: 14px; font-weight: 600; color: ${colors.text.primary}; text-align: right;">
            ${escapeHtml(summary.currentPlan)}
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-size: 14px; color: ${colors.text.secondary};">
            Reviews collected
          </td>
          <td style="padding: 4px 0; font-size: 14px; font-weight: 600; color: ${colors.text.primary}; text-align: right;">
            ${summary.totalReviews}
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-size: 14px; color: ${colors.text.secondary};">
            Surveys sent
          </td>
          <td style="padding: 4px 0; font-size: 14px; font-weight: 600; color: ${colors.text.primary}; text-align: right;">
            ${summary.totalSurveys}
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-size: 14px; color: ${colors.text.secondary};">
            Team members
          </td>
          <td style="padding: 4px 0; font-size: 14px; font-weight: 600; color: ${colors.text.primary}; text-align: right;">
            ${summary.teamMembersCount}
          </td>
        </tr>
      </table>
    </div>
  `;
}

function createSolutionsList(solutions: string[]): string {
  return solutions
    .map(
      (solution) =>
        `<li style="margin: 8px 0; font-size: 14px; color: ${colors.text.secondary};">
          ${escapeHtml(solution)}
        </li>`
    )
    .join("");
}

// ============================================================================
// Email 1: Friendly Payment Failed Notice (Day 0 - Immediate)
// ============================================================================

export function getDunning1PaymentFailedEmail(
  data: Dunning1PaymentFailedEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    DUNNING_SUBJECT_LINES.email_1.A()
  );

  const declineInfo = getDeclineReasonMessage(data.declineReason);

  const retrySection = data.retryDate
    ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.primaryLight}20; border-radius: 8px; padding: 16px 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary};">
            We'll automatically retry your payment on <strong style="color: ${colors.text.primary};">${formatShortDate(data.retryDate)}</strong>
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
          <span style="font-size: 32px;">&#128179;</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          We couldn't process your payment
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          Don't worry, ${escapeHtml(data.firstName)} - this is usually easy to fix.
        </p>
      </td>
    </tr>
    <!-- Invoice Info -->
    <tr>
      <td style="padding: 0 40px 24px 40px; text-align: center;">
        <div style="font-size: 32px; font-weight: 700; color: ${colors.text.primary}; margin-bottom: 4px;">
          ${formatCurrency(data.invoiceAmount, data.invoiceCurrency)}
        </div>
        <div style="font-size: 14px; color: ${colors.text.muted};">
          ${data.invoiceNumber ? `Invoice ${escapeHtml(data.invoiceNumber)} &bull; ` : ""}${formatShortDate(data.failedAt)}
        </div>
      </td>
    </tr>
    <!-- Payment Method -->
    <tr>
      <td style="padding: 0 40px 24px 40px; text-align: center;">
        ${createPaymentMethodCard(data.paymentMethod)}
      </td>
    </tr>
    <!-- Decline Reason -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.accent.warning}10; border-left: 4px solid ${colors.accent.warning}; border-radius: 0 8px 8px 0; padding: 16px 20px;">
          <div style="font-size: 14px; font-weight: 600; color: ${colors.accent.warning}; margin-bottom: 4px;">
            ${escapeHtml(declineInfo.title)}
          </div>
          <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary};">
            ${escapeHtml(declineInfo.message)}
          </p>
        </div>
      </td>
    </tr>
    <!-- Solutions -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary}; margin-bottom: 8px;">
          Here's what you can do:
        </div>
        <ul style="margin: 0; padding: 0 0 0 20px;">
          ${createSolutionsList(data.commonSolutions.length > 0 ? data.commonSolutions : declineInfo.solutions)}
        </ul>
      </td>
    </tr>
    <!-- Retry Notice -->
    ${retrySection}
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Update Payment Method", data.updatePaymentUrl, "primary")}
      </td>
    </tr>
    <!-- Support Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          Need help? Reply to this email or contact us at <a href="mailto:${escapeHtml(data.supportEmail)}" style="color: ${colors.primary}; text-decoration: underline;">${escapeHtml(data.supportEmail)}</a>
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInDunningEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Your payment couldn't be processed. Here's how to fix it.`
    ),
  };
}

// ============================================================================
// Email 2: Reminder with Easy Update Payment Link (Day 3)
// ============================================================================

export function getDunning2ReminderEmail(
  data: Dunning2ReminderEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    DUNNING_SUBJECT_LINES.email_2.A()
  );

  const featuresAtRiskHtml =
    data.featuresAtRisk.length > 0
      ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary}; margin-bottom: 8px;">
          Features that may be affected:
        </div>
        <ul style="margin: 0; padding: 0 0 0 20px;">
          ${data.featuresAtRisk.map((f) => `<li style="font-size: 14px; color: ${colors.text.secondary}; margin: 4px 0;">${escapeHtml(f)}</li>`).join("")}
        </ul>
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
          Payment ${data.daysSinceFailure} days overdue
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Quick reminder about your payment
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          ${escapeHtml(data.firstName)}, we still haven't been able to process your subscription payment.
        </p>
      </td>
    </tr>
    <!-- Invoice Info -->
    <tr>
      <td style="padding: 0 40px 24px 40px; text-align: center;">
        <div style="font-size: 28px; font-weight: 700; color: ${colors.text.primary}; margin-bottom: 4px;">
          ${formatCurrency(data.invoiceAmount, data.invoiceCurrency)}
        </div>
        <div style="font-size: 14px; color: ${colors.text.muted};">
          Amount due
        </div>
      </td>
    </tr>
    <!-- Account Summary -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        ${createAccountSummaryCard(data.accountSummary)}
      </td>
    </tr>
    <!-- Features at Risk -->
    ${featuresAtRiskHtml}
    <!-- Reassurance -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 8px; padding: 16px 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary};">
            Updating your payment method takes less than a minute. Your data and settings are safe while we sort this out.
          </p>
        </div>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Update Payment Now", data.updatePaymentUrl, "primary")}
        <div style="margin-top: 12px;">
          <a href="${sanitizeUrl(data.dashboardUrl)}" style="font-size: 14px; color: ${colors.primary}; text-decoration: underline;">Go to dashboard</a>
        </div>
      </td>
    </tr>
    <!-- Support Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          Having trouble? Our support team is here to help: <a href="mailto:${escapeHtml(data.supportEmail)}" style="color: ${colors.primary}; text-decoration: underline;">${escapeHtml(data.supportEmail)}</a>
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInDunningEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Your payment is ${data.daysSinceFailure} days overdue. Quick update needed.`
    ),
  };
}

// ============================================================================
// Email 3: Urgent Notice - Service May Be Interrupted (Day 7)
// ============================================================================

export function getDunning3UrgentEmail(
  data: Dunning3UrgentEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    DUNNING_SUBJECT_LINES.email_3.A(data.daysUntilSuspension)
  );

  const limitedFeaturesHtml =
    data.featuresAlreadyLimited.length > 0
      ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.accent.error}10; border-radius: 8px; padding: 16px 20px;">
          <div style="font-size: 14px; font-weight: 600; color: ${colors.accent.error}; margin-bottom: 8px;">
            Features currently limited:
          </div>
          <ul style="margin: 0; padding: 0 0 0 20px;">
            ${data.featuresAlreadyLimited.map((f) => `<li style="font-size: 14px; color: ${colors.text.secondary}; margin: 4px 0;">${escapeHtml(f)}</li>`).join("")}
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
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.accent.error}20; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">&#9888;</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Your service may be interrupted
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          ${escapeHtml(data.firstName)}, we've tried multiple times but still can't process your payment.
        </p>
      </td>
    </tr>
    <!-- Countdown Box -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.accent.error}10; border: 1px solid ${colors.accent.error}; border-radius: 8px; padding: 20px; text-align: center;">
          <div style="font-size: 14px; color: ${colors.text.secondary}; margin-bottom: 4px;">
            Account suspension in
          </div>
          <div style="font-size: 36px; font-weight: 700; color: ${colors.accent.error};">
            ${data.daysUntilSuspension} days
          </div>
          <div style="font-size: 14px; color: ${colors.text.muted}; margin-top: 4px;">
            ${formatDate(data.suspensionDate)}
          </div>
        </div>
      </td>
    </tr>
    <!-- Invoice Info -->
    <tr>
      <td style="padding: 0 40px 24px 40px; text-align: center;">
        <div style="font-size: 24px; font-weight: 700; color: ${colors.text.primary}; margin-bottom: 4px;">
          ${formatCurrency(data.invoiceAmount, data.invoiceCurrency)} outstanding
        </div>
        <div style="font-size: 14px; color: ${colors.text.muted};">
          Payment has been overdue for ${data.daysSinceFailure} days
        </div>
      </td>
    </tr>
    <!-- Limited Features -->
    ${limitedFeaturesHtml}
    <!-- Account Summary -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary}; margin-bottom: 12px; text-align: center;">
          Don't lose access to your data
        </div>
        ${createAccountSummaryCard(data.accountSummary)}
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Update Payment Now", data.updatePaymentUrl, "error")}
      </td>
    </tr>
    <!-- Support Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          If you're having financial difficulties, please reach out. We're here to help work out a solution: <a href="mailto:${escapeHtml(data.supportEmail)}" style="color: ${colors.primary}; text-decoration: underline;">${escapeHtml(data.supportEmail)}</a>
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInDunningEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Urgent: Your account will be suspended in ${data.daysUntilSuspension} days.`
    ),
  };
}

// ============================================================================
// Email 4: Final Warning Before Suspension (Day 10)
// ============================================================================

export function getDunning4FinalWarningEmail(
  data: Dunning4FinalWarningEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    DUNNING_SUBJECT_LINES.email_4.A()
  );

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background-color: ${colors.accent.error};"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.accent.error}20; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">&#128680;</span>
        </div>
        <div style="display: inline-block; background-color: ${colors.accent.error}20; color: ${colors.accent.error}; font-size: 14px; font-weight: 600; padding: 6px 16px; border-radius: 20px; margin-bottom: 16px;">
          FINAL NOTICE
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Your account will be suspended tomorrow
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          ${escapeHtml(data.firstName)}, this is the last email before we have to suspend your account.
        </p>
      </td>
    </tr>
    <!-- Suspension Date -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.accent.error}; border-radius: 8px; padding: 20px; text-align: center;">
          <div style="font-size: 14px; color: ${colors.text.inverseMuted}; margin-bottom: 4px;">
            Suspension date
          </div>
          <div style="font-size: 24px; font-weight: 700; color: ${colors.text.inverse};">
            ${formatDate(data.suspensionDate)}
          </div>
        </div>
      </td>
    </tr>
    <!-- What Happens -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary}; margin-bottom: 12px;">
          What happens after suspension:
        </div>
        <ul style="margin: 0; padding: 0 0 0 20px;">
          <li style="font-size: 14px; color: ${colors.text.secondary}; margin: 8px 0;">
            &#10007; You and your team will lose access to the dashboard
          </li>
          <li style="font-size: 14px; color: ${colors.text.secondary}; margin: 8px 0;">
            &#10007; Survey collection and review monitoring will stop
          </li>
          <li style="font-size: 14px; color: ${colors.text.secondary}; margin: 8px 0;">
            &#10007; Automated features will be paused
          </li>
          <li style="font-size: 14px; color: ${colors.text.secondary}; margin: 8px 0;">
            Your data will be retained for ${data.dataRetentionDays} days
          </li>
        </ul>
      </td>
    </tr>
    <!-- Account Summary -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary}; margin-bottom: 12px; text-align: center;">
          What you'll lose access to
        </div>
        ${createAccountSummaryCard(data.accountSummary)}
      </td>
    </tr>
    <!-- Invoice -->
    <tr>
      <td style="padding: 0 40px 24px 40px; text-align: center;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 8px; padding: 16px 20px;">
          <div style="font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
            ${formatCurrency(data.invoiceAmount, data.invoiceCurrency)}
          </div>
          <div style="font-size: 14px; color: ${colors.text.muted};">
            ${data.daysSinceFailure} days overdue
          </div>
        </div>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Pay Now & Keep Your Account", data.updatePaymentUrl, "error")}
      </td>
    </tr>
    <!-- Support Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          If there's a reason you can't pay right now, please talk to us. We may be able to help: <a href="mailto:${escapeHtml(data.supportEmail)}" style="color: ${colors.primary}; text-decoration: underline;">${escapeHtml(data.supportEmail)}</a>
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInDunningEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Final notice: Your account will be suspended on ${formatShortDate(data.suspensionDate)}.`
    ),
  };
}

// ============================================================================
// Email 5: Account Suspended Notice with Recovery Path (Day 14)
// ============================================================================

export function getDunning5SuspendedEmail(
  data: Dunning5SuspendedEmailData
): { subject: string; html: string } {
  const subject = sanitizeSubject(
    DUNNING_SUBJECT_LINES.email_5.A()
  );

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background-color: ${colors.text.muted};"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.background.muted}; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">&#128274;</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Your account has been suspended
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          ${escapeHtml(data.firstName)}, due to an unpaid balance, we've had to pause your account.
        </p>
      </td>
    </tr>
    <!-- Current Status -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.muted}; border-radius: 8px; padding: 20px; text-align: center;">
          <div style="font-size: 14px; color: ${colors.text.muted}; margin-bottom: 4px;">
            Account status
          </div>
          <div style="font-size: 20px; font-weight: 700; color: ${colors.text.secondary};">
            Suspended since ${formatShortDate(data.suspendedAt)}
          </div>
        </div>
      </td>
    </tr>
    <!-- Data Retention -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.accent.warning}15; border: 1px solid ${colors.accent.warning}; border-radius: 8px; padding: 16px 20px;">
          <div style="font-size: 14px; font-weight: 600; color: ${colors.accent.warning}; margin-bottom: 8px;">
            Important: Your data is safe for now
          </div>
          <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary};">
            We'll keep your data for <strong>${data.dataRetentionDays} days</strong> (until ${formatDate(data.dataRetentionEndsAt)}).
            After that, your data will be permanently deleted.
          </p>
        </div>
      </td>
    </tr>
    <!-- Account Summary -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary}; margin-bottom: 12px; text-align: center;">
          Your account data
        </div>
        ${createAccountSummaryCard(data.accountSummary)}
      </td>
    </tr>
    <!-- Outstanding Balance -->
    <tr>
      <td style="padding: 0 40px 24px 40px; text-align: center;">
        <div style="font-size: 14px; color: ${colors.text.secondary}; margin-bottom: 4px;">
          Outstanding balance
        </div>
        <div style="font-size: 32px; font-weight: 700; color: ${colors.text.primary};">
          ${formatCurrency(data.invoiceAmount, data.invoiceCurrency)}
        </div>
      </td>
    </tr>
    <!-- Options -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary}; margin-bottom: 12px;">
          Your options:
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="padding: 8px 0;">
              <div style="background-color: ${colors.primaryLight}20; border-radius: 8px; padding: 12px 16px;">
                <div style="font-size: 14px; font-weight: 600; color: ${colors.primary};">
                  &#10003; Reactivate your account
                </div>
                <div style="font-size: 13px; color: ${colors.text.secondary}; margin-top: 4px;">
                  Pay your outstanding balance and pick up right where you left off.
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <div style="background-color: ${colors.background.subtle}; border-radius: 8px; padding: 12px 16px;">
                <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary};">
                  &#8595; Export your data
                </div>
                <div style="font-size: 13px; color: ${colors.text.secondary}; margin-top: 4px;">
                  Download your reviews, surveys, and contacts before the retention period ends.
                </div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- CTAs -->
    <tr>
      <td style="padding: 0 40px 16px 40px; text-align: center;">
        ${createButton("Reactivate My Account", data.reactivateUrl, "primary")}
      </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Export My Data", data.exportDataUrl, "secondary")}
      </td>
    </tr>
    <!-- Support Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          We're sorry to see you go. If there's anything we could have done differently, please let us know: <a href="mailto:${escapeHtml(data.supportEmail)}" style="color: ${colors.primary}; text-decoration: underline;">${escapeHtml(data.supportEmail)}</a>
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInDunningEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Your RepWell account has been suspended. Your data is safe for ${data.dataRetentionDays} days.`
    ),
  };
}
