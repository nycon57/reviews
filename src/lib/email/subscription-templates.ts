/**
 * Subscription Lifecycle Email Templates (S087)
 *
 * Transactional emails for subscription events:
 * - Upgrade confirmation with new features highlighted
 * - Downgrade confirmation with what changes
 * - Renewal reminder (14 days before annual renewal)
 * - Renewal success confirmation with receipt
 * - Cancellation confirmation with offboarding checklist
 * - Cancellation feedback request
 * - Plan change effective date notice (for end-of-period changes)
 * - Invoice available notification with PDF download
 * - Price increase notice (30 days advance for annual)
 *
 * Design principles:
 * - Clear billing information with receipt/invoice details
 * - Next billing date and amount always visible
 * - Helpful context about what's changing
 * - Easy access to billing portal for updates
 */

import type {
  SubscriptionUpgradeConfirmationEmailData,
  SubscriptionDowngradeConfirmationEmailData,
  SubscriptionRenewalReminderEmailData,
  SubscriptionRenewedEmailData,
  SubscriptionCancelledEmailData,
  SubscriptionCancellationFeedbackEmailData,
  SubscriptionPlanChangeScheduledEmailData,
  SubscriptionInvoiceAvailableEmailData,
  SubscriptionPriceIncreaseNoticeEmailData,
  SubscriptionInvoiceDetails,
  PlanFeature,
  PaymentMethodSummary,
} from "./types";
import { emailConfig } from "./client";
import { colors } from "./theme";

// ============================================================================
// Types
// ============================================================================

interface EmailContent {
  subject: string;
  html: string;
}

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

export const SUBSCRIPTION_SUBJECT_LINES = {
  upgrade: {
    A: (planName: string) => `Welcome to ${planName} - Your upgrade is complete`,
    B: (firstName: string) => `${firstName}, you're all set with your new plan`,
  },
  downgrade: {
    A: (planName: string) => `Your plan change to ${planName} is confirmed`,
    B: () => `Important: Changes to your subscription`,
  },
  renewalReminder: {
    A: (days: number) => `Your subscription renews in ${days} days`,
    B: (planName: string) => `Upcoming renewal for ${planName}`,
  },
  renewed: {
    A: () => `Payment received - Thank you!`,
    B: (planName: string) => `Your ${planName} subscription has been renewed`,
  },
  cancelled: {
    A: () => `We're sorry to see you go`,
    B: () => `Your subscription cancellation is confirmed`,
  },
  cancellationFeedback: {
    A: (firstName: string) => `${firstName}, we'd love your feedback`,
    B: () => `Help us improve - Quick survey`,
  },
  planChangeScheduled: {
    A: (planName: string, date: string) =>
      `Your plan will change to ${planName} on ${date}`,
    B: () => `Scheduled plan change confirmed`,
  },
  invoiceAvailable: {
    A: (invoiceNumber: string) => `Invoice ${invoiceNumber} is ready`,
    B: () => `Your invoice is available`,
  },
  priceIncrease: {
    A: (days: number) => `Important: Pricing update in ${days} days`,
    B: () => `Notice of upcoming price change`,
  },
} as const;

// ============================================================================
// Base Email Wrapper
// ============================================================================

function wrapInSubscriptionEmailTemplate(
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
  variant: "primary" | "secondary" | "ghost" | "success" | "warning" = "primary"
): string {
  const styles = {
    primary: `background-color: ${colors.primary}; color: #ffffff; border: none;`,
    secondary: `background-color: transparent; color: ${colors.primary}; border: 2px solid ${colors.primary};`,
    ghost: `background-color: transparent; color: ${colors.text.secondary}; border: 1px solid ${colors.border.default};`,
    success: `background-color: ${colors.accent.success}; color: #ffffff; border: none;`,
    warning: `background-color: ${colors.accent.warning}; color: #ffffff; border: none;`,
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
    return escapeHtml(dateString);
  }
}

function formatShortDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return escapeHtml(dateString);
  }
}

function createPaymentMethodDisplay(
  paymentMethod: PaymentMethodSummary | undefined
): string {
  if (!paymentMethod) {
    return "";
  }

  const brandName = paymentMethod.brand
    ? paymentMethod.brand.charAt(0).toUpperCase() + paymentMethod.brand.slice(1)
    : "Card";

  const expiry =
    paymentMethod.expMonth && paymentMethod.expYear
      ? `${String(paymentMethod.expMonth).padStart(2, "0")}/${String(paymentMethod.expYear).slice(-2)}`
      : "";

  return `
    <div style="font-size: 14px; color: ${colors.text.secondary};">
      Paid with ${escapeHtml(brandName)} ending in ${escapeHtml(paymentMethod.last4)}${expiry ? ` (exp. ${escapeHtml(expiry)})` : ""}
    </div>
  `;
}

function createBillingCycleLabel(cycle: "monthly" | "yearly"): string {
  return cycle === "yearly" ? "per year" : "per month";
}

function createSupportFooter(supportEmail: string): string {
  return `
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          Questions? Reply to this email or contact <a href="mailto:${escapeHtml(supportEmail)}" style="color: ${colors.primary}; text-decoration: underline;">${escapeHtml(supportEmail)}</a>
        </p>
      </td>
    </tr>
  `;
}

function createInvoiceSummary(invoice: SubscriptionInvoiceDetails): string {
  const lineItemsHtml = invoice.lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: ${colors.text.secondary}; border-bottom: 1px solid ${colors.border.subtle};">
          ${escapeHtml(item.description)}
          ${item.quantity > 1 ? `<span style="color: ${colors.text.muted};"> &times; ${item.quantity}</span>` : ""}
        </td>
        <td style="padding: 8px 0; font-size: 14px; font-weight: 500; color: ${colors.text.primary}; text-align: right; border-bottom: 1px solid ${colors.border.subtle};">
          ${formatCurrency(item.amount, invoice.currency)}
        </td>
      </tr>
    `
    )
    .join("");

  const taxRow = invoice.tax
    ? `
    <tr>
      <td style="padding: 8px 0; font-size: 14px; color: ${colors.text.secondary};">
        Tax
      </td>
      <td style="padding: 8px 0; font-size: 14px; color: ${colors.text.primary}; text-align: right;">
        ${formatCurrency(invoice.tax, invoice.currency)}
      </td>
    </tr>
  `
    : "";

  return `
    <div style="background-color: ${colors.background.subtle}; border-radius: 8px; padding: 20px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.text.muted};">
          Invoice ${invoice.invoiceNumber ? escapeHtml(invoice.invoiceNumber) : ""}
        </div>
        <div style="font-size: 12px; color: ${colors.text.muted};">
          ${formatShortDate(invoice.invoiceDate)}
        </div>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        ${lineItemsHtml}
        ${taxRow}
        <tr>
          <td style="padding: 12px 0 0 0; font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
            Total
          </td>
          <td style="padding: 12px 0 0 0; font-size: 16px; font-weight: 700; color: ${colors.text.primary}; text-align: right;">
            ${formatCurrency(invoice.total, invoice.currency)}
          </td>
        </tr>
      </table>
      ${
        invoice.pdfUrl
          ? `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid ${colors.border.default}; text-align: center;">
          <a href="${sanitizeUrl(invoice.pdfUrl)}" style="font-size: 14px; color: ${colors.primary}; text-decoration: underline;">
            Download PDF Receipt
          </a>
        </div>
      `
          : ""
      }
    </div>
  `;
}

function createFeatureList(
  features: PlanFeature[],
  type: "gained" | "lost" | "keeping"
): string {
  const iconMap = {
    gained: `<span style="color: ${colors.accent.success};">&#10003;</span>`,
    lost: `<span style="color: ${colors.accent.error};">&#10007;</span>`,
    keeping: `<span style="color: ${colors.primary};">&#10003;</span>`,
  };

  const bgColorMap = {
    gained: `${colors.accent.success}10`,
    lost: `${colors.accent.error}10`,
    keeping: colors.background.subtle,
  };

  const icon = iconMap[type];
  const bgColor = bgColorMap[type];

  return features
    .map(
      (feature) => `
      <div style="background-color: ${bgColor}; border-radius: 6px; padding: 12px 16px; margin-bottom: 8px;">
        <div style="display: flex; align-items: flex-start;">
          <span style="margin-right: 8px; font-size: 16px;">${icon}</span>
          <div>
            <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary};">
              ${escapeHtml(feature.name)}
            </div>
            <div style="font-size: 13px; color: ${colors.text.secondary}; margin-top: 2px;">
              ${escapeHtml(feature.description)}
            </div>
          </div>
        </div>
      </div>
    `
    )
    .join("");
}

function createNextBillingBox(
  nextBillingDate: string,
  nextBillingAmount: number,
  currency: string
): string {
  return `
    <div style="background-color: ${colors.background.muted}; border-radius: 8px; padding: 16px 20px; text-align: center;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.text.muted}; margin-bottom: 4px;">
        Next billing date
      </div>
      <div style="font-size: 18px; font-weight: 600; color: ${colors.text.primary}; margin-bottom: 4px;">
        ${formatShortDate(nextBillingDate)}
      </div>
      <div style="font-size: 14px; color: ${colors.text.secondary};">
        ${formatCurrency(nextBillingAmount, currency)}
      </div>
    </div>
  `;
}

// ============================================================================
// Email 1: Upgrade Confirmation
// ============================================================================

export function getSubscriptionUpgradeConfirmationEmail(
  data: SubscriptionUpgradeConfirmationEmailData
): EmailContent {
  const subject = sanitizeSubject(
    SUBSCRIPTION_SUBJECT_LINES.upgrade.A(data.newPlanName)
  );

  const newFeaturesHtml =
    data.newFeatures.length > 0
      ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary}; margin-bottom: 12px;">
          New features unlocked:
        </div>
        ${createFeatureList(data.newFeatures, "gained")}
      </td>
    </tr>
  `
      : "";

  const proratedSection = data.proratedAmount
    ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.primaryLight}20; border-radius: 8px; padding: 12px 16px; text-align: center;">
          <div style="font-size: 14px; color: ${colors.text.secondary};">
            Prorated charge for this billing period: <strong style="color: ${colors.text.primary};">${formatCurrency(data.proratedAmount, data.currency)}</strong>
          </div>
        </div>
      </td>
    </tr>
  `
    : "";

  const invoiceSection = data.invoiceDetails
    ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        ${createInvoiceSummary(data.invoiceDetails)}
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
          <span style="font-size: 32px;">&#127881;</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Welcome to ${escapeHtml(data.newPlanName)}!
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          ${escapeHtml(data.firstName)}, you now have access to all your new features.
        </p>
      </td>
    </tr>
    <!-- Plan Change Summary -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 8px; padding: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="width: 45%; vertical-align: top;">
                <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.text.muted}; margin-bottom: 4px;">
                  Previous Plan
                </div>
                <div style="font-size: 16px; color: ${colors.text.secondary};">
                  ${escapeHtml(data.previousPlanName)}
                </div>
                <div style="font-size: 14px; color: ${colors.text.muted};">
                  ${formatCurrency(data.previousPrice, data.currency)} ${createBillingCycleLabel(data.billingCycle)}
                </div>
              </td>
              <td style="width: 10%; text-align: center; vertical-align: middle;">
                <span style="font-size: 24px; color: ${colors.primary};">&rarr;</span>
              </td>
              <td style="width: 45%; vertical-align: top; text-align: right;">
                <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.accent.success}; margin-bottom: 4px;">
                  New Plan
                </div>
                <div style="font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
                  ${escapeHtml(data.newPlanName)}
                </div>
                <div style="font-size: 14px; color: ${colors.primary};">
                  ${formatCurrency(data.newPrice, data.currency)} ${createBillingCycleLabel(data.billingCycle)}
                </div>
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
    <!-- Prorated Amount -->
    ${proratedSection}
    <!-- New Features -->
    ${newFeaturesHtml}
    <!-- Invoice Summary -->
    ${invoiceSection}
    <!-- Next Billing -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        ${createNextBillingBox(data.nextBillingDate, data.nextBillingAmount, data.currency)}
      </td>
    </tr>
    <!-- Payment Method -->
    <tr>
      <td style="padding: 0 40px 24px 40px; text-align: center;">
        ${createPaymentMethodDisplay(data.paymentMethod)}
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Go to Dashboard", data.dashboardUrl, "primary")}
        <div style="margin-top: 12px;">
          <a href="${sanitizeUrl(data.billingUrl)}" style="font-size: 14px; color: ${colors.primary}; text-decoration: underline;">Manage billing</a>
        </div>
      </td>
    </tr>
    <!-- Support Note -->
    ${createSupportFooter(data.supportEmail)}
  `;

  return {
    subject,
    html: wrapInSubscriptionEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Your upgrade to ${data.newPlanName} is complete.`
    ),
  };
}

// ============================================================================
// Email 2: Downgrade Confirmation
// ============================================================================

export function getSubscriptionDowngradeConfirmationEmail(
  data: SubscriptionDowngradeConfirmationEmailData
): EmailContent {
  const subject = sanitizeSubject(
    SUBSCRIPTION_SUBJECT_LINES.downgrade.A(data.newPlanName)
  );

  const effectiveDateMessage = data.isEndOfPeriod
    ? `Your plan will change on <strong>${formatShortDate(data.effectiveDate)}</strong> at the end of your current billing period.`
    : `Your plan has been changed effective <strong>${formatShortDate(data.effectiveDate)}</strong>.`;

  const featuresLosingHtml =
    data.featuresLosing.length > 0
      ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary}; margin-bottom: 12px;">
          Features you'll lose:
        </div>
        ${createFeatureList(data.featuresLosing, "lost")}
      </td>
    </tr>
  `
      : "";

  const featuresKeepingHtml =
    data.featuresKeeping.length > 0
      ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary}; margin-bottom: 12px;">
          Features you'll keep:
        </div>
        ${createFeatureList(data.featuresKeeping, "keeping")}
      </td>
    </tr>
  `
      : "";

  const creditSection = data.creditAmount
    ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.primaryLight}20; border-radius: 8px; padding: 12px 16px; text-align: center;">
          <div style="font-size: 14px; color: ${colors.text.secondary};">
            Account credit: <strong style="color: ${colors.accent.success};">${formatCurrency(data.creditAmount, data.currency)}</strong>
          </div>
          <div style="font-size: 12px; color: ${colors.text.muted}; margin-top: 4px;">
            This will be applied to your next invoice
          </div>
        </div>
      </td>
    </tr>
  `
    : "";

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.text.muted} 0%, ${colors.primary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Your plan change is confirmed
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          ${effectiveDateMessage}
        </p>
      </td>
    </tr>
    <!-- Plan Change Summary -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 8px; padding: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="width: 45%; vertical-align: top;">
                <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.text.muted}; margin-bottom: 4px;">
                  Current Plan
                </div>
                <div style="font-size: 16px; color: ${colors.text.secondary};">
                  ${escapeHtml(data.previousPlanName)}
                </div>
                <div style="font-size: 14px; color: ${colors.text.muted};">
                  ${formatCurrency(data.previousPrice, data.currency)} ${createBillingCycleLabel(data.billingCycle)}
                </div>
              </td>
              <td style="width: 10%; text-align: center; vertical-align: middle;">
                <span style="font-size: 24px; color: ${colors.text.muted};">&rarr;</span>
              </td>
              <td style="width: 45%; vertical-align: top; text-align: right;">
                <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.text.muted}; margin-bottom: 4px;">
                  New Plan
                </div>
                <div style="font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
                  ${escapeHtml(data.newPlanName)}
                </div>
                <div style="font-size: 14px; color: ${colors.text.secondary};">
                  ${formatCurrency(data.newPrice, data.currency)} ${createBillingCycleLabel(data.billingCycle)}
                </div>
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
    <!-- Credit Section -->
    ${creditSection}
    <!-- Features Losing -->
    ${featuresLosingHtml}
    <!-- Features Keeping -->
    ${featuresKeepingHtml}
    <!-- Next Billing -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        ${createNextBillingBox(data.nextBillingDate, data.nextBillingAmount, data.currency)}
      </td>
    </tr>
    <!-- Upgrade CTA -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.primaryLight}15; border: 1px solid ${colors.primary}; border-radius: 8px; padding: 16px 20px; text-align: center;">
          <p style="margin: 0 0 12px 0; font-size: 14px; color: ${colors.text.secondary};">
            Changed your mind? You can upgrade anytime.
          </p>
          ${createButton("Upgrade Plan", data.upgradeUrl, "secondary")}
        </div>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Go to Dashboard", data.dashboardUrl, "primary")}
        <div style="margin-top: 12px;">
          <a href="${sanitizeUrl(data.billingUrl)}" style="font-size: 14px; color: ${colors.primary}; text-decoration: underline;">Manage billing</a>
        </div>
      </td>
    </tr>
    <!-- Support Note -->
    ${createSupportFooter(data.supportEmail)}
  `;

  return {
    subject,
    html: wrapInSubscriptionEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Your plan will change to ${data.newPlanName}. Here's what to expect.`
    ),
  };
}

// ============================================================================
// Email 3: Renewal Reminder
// ============================================================================

export function getSubscriptionRenewalReminderEmail(
  data: SubscriptionRenewalReminderEmailData
): EmailContent {
  const subject = sanitizeSubject(
    SUBSCRIPTION_SUBJECT_LINES.renewalReminder.A(data.daysTillRenewal)
  );

  const usageSummaryHtml = data.usageSummary
    ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary}; margin-bottom: 12px; text-align: center;">
          What you've accomplished this billing period
        </div>
        <table width="100%" cellpadding="8" cellspacing="0" role="presentation">
          <tr>
            <td style="text-align: center; padding: 16px; background-color: ${colors.background.subtle}; border-radius: 8px;">
              <div style="font-size: 28px; font-weight: 700; color: ${colors.primary};">
                ${data.usageSummary.reviewsCollected}
              </div>
              <div style="font-size: 12px; color: ${colors.text.secondary}; text-transform: uppercase; letter-spacing: 0.5px;">
                Reviews
              </div>
            </td>
            <td width="8"></td>
            <td style="text-align: center; padding: 16px; background-color: ${colors.background.subtle}; border-radius: 8px;">
              <div style="font-size: 28px; font-weight: 700; color: ${colors.primary};">
                ${data.usageSummary.surveysSent}
              </div>
              <div style="font-size: 12px; color: ${colors.text.secondary}; text-transform: uppercase; letter-spacing: 0.5px;">
                Surveys
              </div>
            </td>
            <td width="8"></td>
            <td style="text-align: center; padding: 16px; background-color: ${colors.background.subtle}; border-radius: 8px;">
              <div style="font-size: 28px; font-weight: 700; color: ${colors.primary};">
                ${data.usageSummary.teamMembers}
              </div>
              <div style="font-size: 12px; color: ${colors.text.secondary}; text-transform: uppercase; letter-spacing: 0.5px;">
                Team
              </div>
            </td>
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
        <div style="display: inline-block; background-color: ${colors.primaryLight}20; color: ${colors.primary}; font-size: 14px; font-weight: 600; padding: 6px 16px; border-radius: 20px; margin-bottom: 16px;">
          Renews in ${data.daysTillRenewal} days
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Your subscription is renewing soon
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          ${escapeHtml(data.firstName)}, here are your ${escapeHtml(data.planName)} renewal details.
        </p>
      </td>
    </tr>
    <!-- Renewal Details -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 8px; padding: 20px; text-align: center;">
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.text.muted}; margin-bottom: 8px;">
            Renewal date
          </div>
          <div style="font-size: 24px; font-weight: 700; color: ${colors.text.primary}; margin-bottom: 4px;">
            ${formatDate(data.renewalDate)}
          </div>
          <div style="font-size: 18px; color: ${colors.primary};">
            ${formatCurrency(data.renewalAmount, data.currency)}
          </div>
          <div style="font-size: 14px; color: ${colors.text.muted}; margin-top: 4px;">
            ${escapeHtml(data.planName)} &bull; Billed ${data.billingCycle === "yearly" ? "annually" : "monthly"}
          </div>
        </div>
      </td>
    </tr>
    <!-- Payment Method -->
    <tr>
      <td style="padding: 0 40px 24px 40px; text-align: center;">
        ${createPaymentMethodDisplay(data.paymentMethod)}
        <div style="margin-top: 8px;">
          <a href="${sanitizeUrl(data.updatePaymentUrl)}" style="font-size: 14px; color: ${colors.primary}; text-decoration: underline;">Update payment method</a>
        </div>
      </td>
    </tr>
    <!-- Usage Summary -->
    ${usageSummaryHtml}
    <!-- Actions -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("View Billing Details", data.billingUrl, "primary")}
        <div style="margin-top: 16px;">
          <a href="${sanitizeUrl(data.cancelUrl)}" style="font-size: 14px; color: ${colors.text.muted}; text-decoration: underline;">Cancel subscription</a>
        </div>
      </td>
    </tr>
    <!-- Support Note -->
    ${createSupportFooter(data.supportEmail)}
  `;

  return {
    subject,
    html: wrapInSubscriptionEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Your ${data.planName} subscription renews on ${formatShortDate(data.renewalDate)}.`
    ),
  };
}

// ============================================================================
// Email 4: Subscription Renewed
// ============================================================================

export function getSubscriptionRenewedEmail(
  data: SubscriptionRenewedEmailData
): EmailContent {
  const subject = sanitizeSubject(SUBSCRIPTION_SUBJECT_LINES.renewed.A());

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${colors.accent.success} 0%, ${colors.primary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.accent.success}20; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">&#10003;</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Payment received - Thank you!
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          ${escapeHtml(data.firstName)}, your ${escapeHtml(data.planName)} subscription has been renewed.
        </p>
      </td>
    </tr>
    <!-- Invoice Summary -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        ${createInvoiceSummary(data.invoiceDetails)}
      </td>
    </tr>
    <!-- Payment Method -->
    <tr>
      <td style="padding: 0 40px 24px 40px; text-align: center;">
        ${createPaymentMethodDisplay(data.paymentMethod)}
      </td>
    </tr>
    <!-- Next Billing -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        ${createNextBillingBox(data.nextBillingDate, data.nextBillingAmount, data.currency)}
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Go to Dashboard", data.dashboardUrl, "primary")}
        <div style="margin-top: 12px;">
          <a href="${sanitizeUrl(data.billingUrl)}" style="font-size: 14px; color: ${colors.primary}; text-decoration: underline;">View billing history</a>
        </div>
      </td>
    </tr>
    <!-- Support Note -->
    ${createSupportFooter(data.supportEmail)}
  `;

  return {
    subject,
    html: wrapInSubscriptionEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Your ${data.planName} subscription has been renewed. Here's your receipt.`
    ),
  };
}

// ============================================================================
// Email 5: Subscription Cancelled
// ============================================================================

export function getSubscriptionCancelledEmail(
  data: SubscriptionCancelledEmailData
): EmailContent {
  const subject = sanitizeSubject(SUBSCRIPTION_SUBJECT_LINES.cancelled.B());

  const offboardingHtml = data.offboardingChecklist
    .map(
      (item) => `
      <div style="background-color: ${colors.background.subtle}; border-radius: 6px; padding: 12px 16px; margin-bottom: 8px;">
        <div style="display: flex; align-items: flex-start;">
          <span style="margin-right: 8px; font-size: 16px; color: ${colors.text.muted};">&#9744;</span>
          <div>
            <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary};">
              ${escapeHtml(item.title)}
            </div>
            <div style="font-size: 13px; color: ${colors.text.secondary}; margin-top: 2px;">
              ${escapeHtml(item.description)}
            </div>
            ${
              item.actionUrl
                ? `<a href="${sanitizeUrl(item.actionUrl)}" style="font-size: 13px; color: ${colors.primary}; text-decoration: underline; margin-top: 4px; display: inline-block;">Take action</a>`
                : ""
            }
          </div>
        </div>
      </div>
    `
    )
    .join("");

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background-color: ${colors.text.muted};"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          We're sorry to see you go
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          ${escapeHtml(data.firstName)}, your ${escapeHtml(data.planName)} subscription has been cancelled.
        </p>
      </td>
    </tr>
    <!-- Access Period -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.accent.warning}15; border: 1px solid ${colors.accent.warning}; border-radius: 8px; padding: 16px 20px; text-align: center;">
          <div style="font-size: 14px; color: ${colors.text.secondary}; margin-bottom: 4px;">
            You still have access until
          </div>
          <div style="font-size: 20px; font-weight: 700; color: ${colors.text.primary};">
            ${formatDate(data.effectiveEndDate)}
          </div>
          <div style="font-size: 14px; color: ${colors.accent.warning}; margin-top: 4px;">
            ${data.daysRemaining} days remaining
          </div>
        </div>
      </td>
    </tr>
    <!-- Offboarding Checklist -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary}; margin-bottom: 12px;">
          Before you go, you may want to:
        </div>
        ${offboardingHtml}
      </td>
    </tr>
    <!-- Export Data -->
    <tr>
      <td style="padding: 0 40px 24px 40px; text-align: center;">
        ${createButton("Export Your Data", data.dataExportUrl, "secondary")}
      </td>
    </tr>
    <!-- Reactivate -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.primaryLight}15; border: 1px solid ${colors.primary}; border-radius: 8px; padding: 16px 20px; text-align: center;">
          <p style="margin: 0 0 12px 0; font-size: 14px; color: ${colors.text.secondary};">
            Changed your mind? Reactivate anytime before ${formatShortDate(data.effectiveEndDate)}.
          </p>
          ${createButton("Reactivate Subscription", data.reactivateUrl, "primary")}
        </div>
      </td>
    </tr>
    <!-- Feedback Link -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        <a href="${sanitizeUrl(data.feedbackUrl)}" style="font-size: 14px; color: ${colors.primary}; text-decoration: underline;">Tell us why you're leaving</a>
      </td>
    </tr>
    <!-- Support Note -->
    ${createSupportFooter(data.supportEmail)}
  `;

  return {
    subject,
    html: wrapInSubscriptionEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Your subscription has been cancelled. You have ${data.daysRemaining} days of access remaining.`
    ),
  };
}

// ============================================================================
// Email 6: Cancellation Feedback Request
// ============================================================================

export function getSubscriptionCancellationFeedbackEmail(
  data: SubscriptionCancellationFeedbackEmailData
): EmailContent {
  const subject = sanitizeSubject(
    SUBSCRIPTION_SUBJECT_LINES.cancellationFeedback.A(data.firstName)
  );

  const feedbackOptionsHtml = data.feedbackOptions
    .map(
      (option) => `
      <a href="${sanitizeUrl(data.feedbackUrl)}?reason=${encodeURIComponent(option.value)}" style="display: block; background-color: ${colors.background.subtle}; border-radius: 6px; padding: 12px 16px; margin-bottom: 8px; text-decoration: none; color: ${colors.text.primary}; font-size: 14px;">
        ${escapeHtml(option.label)}
      </a>
    `
    )
    .join("");

  const specialOfferHtml =
    data.specialOfferAvailable && data.specialOfferDetails
      ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); border-radius: 12px; padding: 20px 24px; text-align: center;">
          <div style="font-size: 12px; color: ${colors.text.inverseMuted}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
            Special offer
          </div>
          <div style="font-size: 20px; font-weight: 700; color: ${colors.text.inverse}; margin-bottom: 8px;">
            Get ${data.specialOfferDetails.discountPercent}% off your next billing period
          </div>
          <div style="font-size: 14px; color: ${colors.text.inverseMuted}; margin-bottom: 16px;">
            Valid until ${formatShortDate(data.specialOfferDetails.validUntil)}
          </div>
          ${createButton("Claim Offer & Stay", data.specialOfferDetails.reactivateUrl, "secondary")}
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
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.primaryLight}20; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">&#128172;</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          We'd love your feedback
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          ${escapeHtml(data.firstName)}, your feedback helps us improve RepWell.
        </p>
      </td>
    </tr>
    <!-- Quick Feedback -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary}; margin-bottom: 12px;">
          What's the main reason you're leaving?
        </div>
        ${feedbackOptionsHtml}
        <a href="${sanitizeUrl(data.feedbackUrl)}" style="display: block; text-align: center; font-size: 14px; color: ${colors.primary}; text-decoration: underline; margin-top: 12px;">
          Something else? Tell us more
        </a>
      </td>
    </tr>
    <!-- Special Offer -->
    ${specialOfferHtml}
    <!-- Support Note -->
    <tr>
      <td style="padding: 24px 40px; background-color: ${colors.background.subtle}; border-top: 1px solid ${colors.border.subtle};">
        <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; text-align: center; line-height: 1.6;">
          Thank you for being a RepWell customer. We hope to see you again!
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInSubscriptionEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Quick question -- what made you cancel?`
    ),
  };
}

// ============================================================================
// Email 7: Plan Change Scheduled
// ============================================================================

export function getSubscriptionPlanChangeScheduledEmail(
  data: SubscriptionPlanChangeScheduledEmailData
): EmailContent {
  const subject = sanitizeSubject(
    SUBSCRIPTION_SUBJECT_LINES.planChangeScheduled.A(
      data.scheduledPlanName,
      formatShortDate(data.scheduledDate)
    )
  );

  const changeTypeLabel =
    data.changeType === "upgrade" ? "Upgrading to" : "Changing to";
  const changeTypeColor =
    data.changeType === "upgrade" ? colors.accent.success : colors.text.muted;

  const featureChangesHtml =
    data.featureChanges.length > 0
      ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary}; margin-bottom: 12px;">
          What will change:
        </div>
        ${createFeatureList(data.featureChanges, data.changeType === "upgrade" ? "gained" : "lost")}
      </td>
    </tr>
  `
      : "";

  const content = `
    <!-- Accent Bar -->
    <tr>
      <td style="height: 4px; background: linear-gradient(90deg, ${changeTypeColor} 0%, ${colors.primary} 100%);"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 48px 40px 24px 40px; text-align: center;">
        <div style="display: inline-block; background-color: ${changeTypeColor}20; color: ${changeTypeColor}; font-size: 14px; font-weight: 600; padding: 6px 16px; border-radius: 20px; margin-bottom: 16px;">
          Scheduled for ${formatShortDate(data.scheduledDate)}
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Your plan change is scheduled
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          ${escapeHtml(data.firstName)}, your change to ${escapeHtml(data.scheduledPlanName)} takes effect in ${data.daysUntilChange} days.
        </p>
      </td>
    </tr>
    <!-- Plan Change Summary -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 8px; padding: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="width: 45%; vertical-align: top;">
                <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.text.muted}; margin-bottom: 4px;">
                  Current Plan
                </div>
                <div style="font-size: 16px; color: ${colors.text.secondary};">
                  ${escapeHtml(data.currentPlanName)}
                </div>
                <div style="font-size: 14px; color: ${colors.text.muted};">
                  ${formatCurrency(data.currentPrice, data.currency)} ${createBillingCycleLabel(data.billingCycle)}
                </div>
              </td>
              <td style="width: 10%; text-align: center; vertical-align: middle;">
                <span style="font-size: 24px; color: ${changeTypeColor};">&rarr;</span>
              </td>
              <td style="width: 45%; vertical-align: top; text-align: right;">
                <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: ${changeTypeColor}; margin-bottom: 4px;">
                  ${changeTypeLabel}
                </div>
                <div style="font-size: 16px; font-weight: 600; color: ${colors.text.primary};">
                  ${escapeHtml(data.scheduledPlanName)}
                </div>
                <div style="font-size: 14px; color: ${data.changeType === "upgrade" ? colors.primary : colors.text.secondary};">
                  ${formatCurrency(data.scheduledPrice, data.currency)} ${createBillingCycleLabel(data.billingCycle)}
                </div>
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
    <!-- Effective Date -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.muted}; border-radius: 8px; padding: 16px 20px; text-align: center;">
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.text.muted}; margin-bottom: 4px;">
            Change takes effect on
          </div>
          <div style="font-size: 18px; font-weight: 600; color: ${colors.text.primary};">
            ${formatDate(data.scheduledDate)}
          </div>
        </div>
      </td>
    </tr>
    <!-- Feature Changes -->
    ${featureChangesHtml}
    <!-- Cancel Change -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        <p style="margin: 0 0 12px 0; font-size: 14px; color: ${colors.text.secondary};">
          Changed your mind?
        </p>
        ${createButton("Cancel Scheduled Change", data.cancelChangeUrl, "secondary")}
        <div style="margin-top: 12px;">
          <a href="${sanitizeUrl(data.billingUrl)}" style="font-size: 14px; color: ${colors.primary}; text-decoration: underline;">Manage billing</a>
        </div>
      </td>
    </tr>
    <!-- Support Note -->
    ${createSupportFooter(data.supportEmail)}
  `;

  return {
    subject,
    html: wrapInSubscriptionEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Your plan will change to ${data.scheduledPlanName} on ${formatShortDate(data.scheduledDate)}.`
    ),
  };
}

// ============================================================================
// Email 8: Invoice Available
// ============================================================================

export function getSubscriptionInvoiceAvailableEmail(
  data: SubscriptionInvoiceAvailableEmailData
): EmailContent {
  const subject = sanitizeSubject(
    SUBSCRIPTION_SUBJECT_LINES.invoiceAvailable.A(
      data.invoiceDetails.invoiceNumber || data.invoiceDetails.invoiceId
    )
  );

  const payNowSection =
    data.invoiceDetails.status === "open" && data.payNowUrl
      ? `
    <tr>
      <td style="padding: 0 40px 24px 40px; text-align: center;">
        ${createButton("Pay Now", data.payNowUrl, "primary")}
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
        <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${colors.primaryLight}20; border-radius: 50%; text-align: center; line-height: 64px;">
          <span style="font-size: 32px;">&#128196;</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Your invoice is ready
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          ${escapeHtml(data.firstName)}, here's your invoice for ${escapeHtml(data.planName)}.
        </p>
      </td>
    </tr>
    <!-- Billing Period -->
    <tr>
      <td style="padding: 0 40px 24px 40px; text-align: center;">
        <div style="font-size: 14px; color: ${colors.text.muted};">
          Billing period: ${formatShortDate(data.billingPeriod.start)} - ${formatShortDate(data.billingPeriod.end)}
        </div>
      </td>
    </tr>
    <!-- Invoice Summary -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        ${createInvoiceSummary(data.invoiceDetails)}
      </td>
    </tr>
    <!-- Payment Method -->
    <tr>
      <td style="padding: 0 40px 24px 40px; text-align: center;">
        ${createPaymentMethodDisplay(data.paymentMethod)}
      </td>
    </tr>
    <!-- Pay Now -->
    ${payNowSection}
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("View Billing History", data.billingUrl, "secondary")}
      </td>
    </tr>
    <!-- Support Note -->
    ${createSupportFooter(data.supportEmail)}
  `;

  return {
    subject,
    html: wrapInSubscriptionEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Your invoice for ${formatCurrency(data.invoiceDetails.total, data.invoiceDetails.currency)} is ready.`
    ),
  };
}

// ============================================================================
// Email 9: Price Increase Notice
// ============================================================================

export function getSubscriptionPriceIncreaseNoticeEmail(
  data: SubscriptionPriceIncreaseNoticeEmailData
): EmailContent {
  const subject = sanitizeSubject(
    SUBSCRIPTION_SUBJECT_LINES.priceIncrease.A(data.daysUntilIncrease)
  );

  const newFeaturesHtml =
    data.newFeatures && data.newFeatures.length > 0
      ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary}; margin-bottom: 12px;">
          What's improving:
        </div>
        <ul style="margin: 0; padding: 0 0 0 20px;">
          ${data.newFeatures.map((f) => `<li style="font-size: 14px; color: ${colors.text.secondary}; margin: 8px 0;">${escapeHtml(f)}</li>`).join("")}
        </ul>
      </td>
    </tr>
  `
      : "";

  const reasonHtml = data.reason
    ? `
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 8px; padding: 16px 20px;">
          <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary}; margin-bottom: 8px;">
            Why is the price changing?
          </div>
          <p style="margin: 0; font-size: 14px; color: ${colors.text.secondary}; line-height: 1.6;">
            ${escapeHtml(data.reason)}
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
        <div style="display: inline-block; background-color: ${colors.accent.warning}20; color: ${colors.accent.warning}; font-size: 14px; font-weight: 600; padding: 6px 16px; border-radius: 20px; margin-bottom: 16px;">
          ${data.daysUntilIncrease} days notice
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: ${colors.text.primary};">
          Important: Pricing update
        </h1>
        <p style="margin: 0; font-size: 16px; color: ${colors.text.secondary};">
          ${escapeHtml(data.firstName)}, the price for your ${escapeHtml(data.planName)} plan is changing on ${formatShortDate(data.effectiveDate)}.
        </p>
      </td>
    </tr>
    <!-- Price Change -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.subtle}; border-radius: 8px; padding: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="width: 45%; vertical-align: top;">
                <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.text.muted}; margin-bottom: 4px;">
                  Current Price
                </div>
                <div style="font-size: 24px; font-weight: 600; color: ${colors.text.secondary};">
                  ${formatCurrency(data.currentPrice, data.currency)}
                </div>
                <div style="font-size: 14px; color: ${colors.text.muted};">
                  ${createBillingCycleLabel(data.billingCycle)}
                </div>
              </td>
              <td style="width: 10%; text-align: center; vertical-align: middle;">
                <span style="font-size: 24px; color: ${colors.accent.warning};">&rarr;</span>
              </td>
              <td style="width: 45%; vertical-align: top; text-align: right;">
                <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.accent.warning}; margin-bottom: 4px;">
                  New Price
                </div>
                <div style="font-size: 24px; font-weight: 700; color: ${colors.text.primary};">
                  ${formatCurrency(data.newPrice, data.currency)}
                </div>
                <div style="font-size: 14px; color: ${colors.accent.warning};">
                  +${formatCurrency(data.priceIncreaseAmount, data.currency)} (+${data.priceIncreasePercent}%)
                </div>
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
    <!-- Effective Date -->
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        <div style="background-color: ${colors.background.muted}; border-radius: 8px; padding: 16px 20px; text-align: center;">
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.text.muted}; margin-bottom: 4px;">
            New price takes effect on
          </div>
          <div style="font-size: 18px; font-weight: 600; color: ${colors.text.primary};">
            ${formatDate(data.effectiveDate)}
          </div>
        </div>
      </td>
    </tr>
    <!-- Reason -->
    ${reasonHtml}
    <!-- New Features -->
    ${newFeaturesHtml}
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
                  &#10003; Continue with your plan
                </div>
                <div style="font-size: 13px; color: ${colors.text.secondary}; margin-top: 4px;">
                  No action needed. Your subscription will continue at the new rate.
                </div>
              </div>
            </td>
          </tr>
          ${
            data.downgradePlanUrl
              ? `
            <tr>
              <td style="padding: 8px 0;">
                <div style="background-color: ${colors.background.subtle}; border-radius: 8px; padding: 12px 16px;">
                  <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary};">
                    &#8595; Switch to a different plan
                  </div>
                  <div style="font-size: 13px; color: ${colors.text.secondary}; margin-top: 4px;">
                    <a href="${sanitizeUrl(data.downgradePlanUrl)}" style="color: ${colors.primary}; text-decoration: underline;">View available plans</a>
                  </div>
                </div>
              </td>
            </tr>
          `
              : ""
          }
          <tr>
            <td style="padding: 8px 0;">
              <div style="background-color: ${colors.background.subtle}; border-radius: 8px; padding: 12px 16px;">
                <div style="font-size: 14px; font-weight: 600; color: ${colors.text.primary};">
                  &#10007; Cancel your subscription
                </div>
                <div style="font-size: 13px; color: ${colors.text.secondary}; margin-top: 4px;">
                  <a href="${sanitizeUrl(data.cancelUrl)}" style="color: ${colors.text.muted}; text-decoration: underline;">Cancel before the price change</a>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding: 0 40px 32px 40px; text-align: center;">
        ${createButton("Manage Subscription", data.billingUrl, "primary")}
      </td>
    </tr>
    <!-- Support Note -->
    ${createSupportFooter(data.supportEmail)}
  `;

  return {
    subject,
    html: wrapInSubscriptionEmailTemplate(
      content,
      data.unsubscribeUrl,
      `Your ${data.planName} plan price will change on ${formatShortDate(data.effectiveDate)}.`
    ),
  };
}
