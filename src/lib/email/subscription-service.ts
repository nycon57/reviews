/**
 * Subscription Lifecycle Email Service (S087)
 *
 * Handles sending transactional emails for subscription events:
 * - Upgrade confirmation
 * - Downgrade confirmation
 * - Renewal reminder (14 days before)
 * - Renewal success with receipt
 * - Cancellation confirmation with offboarding
 * - Cancellation feedback request
 * - Plan change scheduled notice
 * - Invoice available notification
 * - Price increase notice (30 days advance)
 *
 * Key behaviors:
 * - Called from Stripe webhook handlers
 * - All emails include clear billing info
 * - Respects user notification preferences
 * - Logs all emails for analytics
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, getFromAddress, emailConfig } from "./client";
import type {
  EmailTemplate,
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
  InvoiceLineItem,
  PaymentMethodSummary,
  PlanFeature,
} from "./types";
import {
  getSubscriptionUpgradeConfirmationEmail,
  getSubscriptionDowngradeConfirmationEmail,
  getSubscriptionRenewalReminderEmail,
  getSubscriptionRenewedEmail,
  getSubscriptionCancelledEmail,
  getSubscriptionCancellationFeedbackEmail,
  getSubscriptionPlanChangeScheduledEmail,
  getSubscriptionInvoiceAvailableEmail,
  getSubscriptionPriceIncreaseNoticeEmail,
} from "./subscription-templates";

// ============================================================================
// Types
// ============================================================================

interface SendEmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
}

interface UserInfo {
  id: string;
  email: string;
  full_name: string | null;
  receive_notifications: boolean | null;
}

interface OrganizationInfo {
  id: string;
  name: string;
  subscription_tier: string | null;
}

// Internal feature definition type (simpler than email template PlanFeature)
interface FeatureDefinition {
  name: string;
  description: string;
}

// Plan feature definitions for each tier
const PLAN_FEATURES: Record<string, FeatureDefinition[]> = {
  free: [
    { name: "Basic Surveys", description: "Send up to 50 surveys per month" },
    { name: "Manual Review Requests", description: "Request reviews one at a time" },
    { name: "Basic Analytics", description: "View survey responses and NPS" },
  ],
  starter: [
    { name: "Unlimited Surveys", description: "Send unlimited surveys each month" },
    { name: "Automated Campaigns", description: "Schedule recurring survey campaigns" },
    { name: "Review Monitoring", description: "Monitor Google reviews automatically" },
    { name: "Basic Reporting", description: "Weekly email reports" },
    { name: "Up to 3 Team Members", description: "Invite your team to collaborate" },
  ],
  professional: [
    { name: "Everything in Starter", description: "All Starter features included" },
    { name: "Video Testimonials", description: "Collect video testimonials from customers" },
    { name: "AI-Powered Insights", description: "Sentiment analysis and key phrase extraction" },
    { name: "Google Business Sync", description: "Two-way sync with Google Business Profile" },
    { name: "Advanced Analytics", description: "Detailed dashboards and trend analysis" },
    { name: "Up to 10 Team Members", description: "Larger team collaboration" },
    { name: "Priority Support", description: "Get help faster when you need it" },
  ],
  enterprise: [
    { name: "Everything in Professional", description: "All Professional features included" },
    { name: "Unlimited Team Members", description: "No limits on your team size" },
    { name: "Custom Branding", description: "White-label surveys and emails" },
    { name: "API Access", description: "Integrate with your existing tools" },
    { name: "Dedicated Account Manager", description: "Personal support contact" },
    { name: "Custom Integrations", description: "Build custom workflows" },
    { name: "SLA Guarantee", description: "99.9% uptime commitment" },
  ],
};

// Default offboarding checklist
const DEFAULT_OFFBOARDING_CHECKLIST = [
  {
    title: "Export your reviews",
    description: "Download all your collected reviews before your access ends.",
    actionUrl: "/dashboard/settings/export",
  },
  {
    title: "Export survey responses",
    description: "Save your survey data and NPS scores.",
    actionUrl: "/dashboard/settings/export",
  },
  {
    title: "Save video testimonials",
    description: "Download any video testimonials you've collected.",
    actionUrl: "/dashboard/testimonials",
  },
  {
    title: "Update integrations",
    description: "Disconnect any connected services that rely on RepWell.",
    actionUrl: "/dashboard/settings/integrations",
  },
];

// Default feedback options for cancellation
const DEFAULT_FEEDBACK_OPTIONS = [
  { value: "too_expensive", label: "Too expensive for my needs" },
  { value: "not_using", label: "Not using it enough" },
  { value: "missing_features", label: "Missing features I need" },
  { value: "found_alternative", label: "Found a better alternative" },
  { value: "technical_issues", label: "Technical issues" },
  { value: "closing_business", label: "Closing my business" },
];

// ============================================================================
// Helper Functions
// ============================================================================

const SUPPORT_EMAIL = "support@repwell.ai";

const PLAN_DISPLAY_NAMES: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

async function isEmailUnsubscribed(email: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("email_unsubscribes")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  return !!data;
}

async function logEmail(params: {
  toEmail: string;
  toName?: string;
  fromEmail: string;
  fromName?: string;
  subject: string;
  templateName: EmailTemplate;
  organizationId?: string;
  userId?: string;
  resendMessageId?: string;
  status: string;
  errorMessage?: string;
}): Promise<string | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("email_logs")
    .insert({
      to_email: params.toEmail,
      to_name: params.toName,
      from_email: params.fromEmail,
      from_name: params.fromName,
      subject: params.subject,
      template_name: params.templateName,
      organization_id: params.organizationId,
      resend_message_id: params.resendMessageId,
      status: params.status,
      sent_at: params.status === "sent" ? new Date().toISOString() : null,
      error_message: params.errorMessage,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to log email:", error);
    return null;
  }

  return data.id;
}

async function getUserAndOrganization(
  organizationId: string
): Promise<{ user: UserInfo; organization: OrganizationInfo } | null> {
  const supabase = createAdminClient();

  // Get admin user for the organization
  const { data: adminUser, error: userError } = await supabase
    .from("users")
    .select(
      `
      id,
      email,
      full_name,
      receive_notifications,
      organizations!inner(id, name, subscription_tier)
    `
    )
    .eq("organization_id", organizationId)
    .eq("role", "admin")
    .limit(1)
    .single();

  if (userError || !adminUser) {
    console.error("Admin user not found:", userError?.message);
    return null;
  }

  const org = adminUser.organizations as unknown as OrganizationInfo;

  return {
    user: {
      id: adminUser.id,
      email: adminUser.email,
      full_name: adminUser.full_name,
      receive_notifications: adminUser.receive_notifications,
    },
    organization: org,
  };
}

function buildBaseUrls(organizationId: string): {
  baseUrl: string;
  dashboardUrl: string;
  billingUrl: string;
  unsubscribeUrl: string;
} {
  const baseUrl = emailConfig.baseUrl;
  return {
    baseUrl,
    dashboardUrl: `${baseUrl}/dashboard`,
    billingUrl: `${baseUrl}/dashboard/settings/billing`,
    unsubscribeUrl: `${baseUrl}/api/email/unsubscribe?org=${organizationId}`,
  };
}

/**
 * Map Stripe payment method to our summary type
 */
export function mapStripePaymentMethod(
  paymentMethod: {
    type?: string;
    card?: {
      brand?: string;
      last4?: string;
      exp_month?: number;
      exp_year?: number;
    };
  } | null
): PaymentMethodSummary | undefined {
  if (!paymentMethod?.card) {
    return undefined;
  }

  // Map Stripe payment method type to our expected type
  const mapType = (type: string | undefined): "card" | "bank_account" | "other" => {
    if (type === "card") return "card";
    if (type === "us_bank_account" || type === "sepa_debit" || type === "bacs_debit") return "bank_account";
    return "card"; // Default to card since we have card details
  };

  return {
    type: mapType(paymentMethod.type),
    brand: paymentMethod.card.brand,
    last4: paymentMethod.card.last4 || "****",
    expMonth: paymentMethod.card.exp_month,
    expYear: paymentMethod.card.exp_year,
  };
}

/**
 * Map Stripe invoice to our invoice details type
 */
export function mapStripeInvoice(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  invoice: any
): SubscriptionInvoiceDetails | null {
  if (!invoice) {
    return null;
  }

  const lineItems: InvoiceLineItem[] =
    invoice.lines?.data?.map((line: { description?: string; quantity?: number; amount?: number; price?: { unit_amount?: number } }) => {
      const quantity = line.quantity || 1;
      const amount = line.amount || 0;
      return {
        description: line.description || "Subscription",
        quantity,
        unitPrice: line.price?.unit_amount ?? (quantity > 0 ? Math.round(amount / quantity) : amount),
        amount,
      };
    }) || [];

  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.number || undefined,
    invoiceDate: invoice.created
      ? new Date(invoice.created * 1000).toISOString()
      : new Date().toISOString(),
    subtotal: invoice.subtotal || invoice.total || 0,
    tax: invoice.tax || undefined,
    total: invoice.total || 0,
    currency: invoice.currency || "usd",
    status: (invoice.status as "draft" | "open" | "paid" | "void") || "open",
    pdfUrl: invoice.invoice_pdf || undefined,
    lineItems,
  };
}

/**
 * Get features that differ between two plans
 */
function featureDefToPlanFeature(
  f: FeatureDefinition,
  includedInCurrent: boolean,
  includedInNew: boolean
): PlanFeature {
  return {
    name: f.name,
    description: f.description,
    includedInCurrentPlan: includedInCurrent,
    includedInNewPlan: includedInNew,
  };
}

function getPlanFeatureDiff(
  fromPlan: string,
  toPlan: string
): { gained: PlanFeature[]; lost: PlanFeature[]; keeping: PlanFeature[] } {
  const fromFeatures = PLAN_FEATURES[fromPlan] || [];
  const toFeatures = PLAN_FEATURES[toPlan] || [];

  const fromNames = new Set(fromFeatures.map((f) => f.name));
  const toNames = new Set(toFeatures.map((f) => f.name));

  return {
    gained: toFeatures
      .filter((f) => !fromNames.has(f.name))
      .map((f) => featureDefToPlanFeature(f, false, true)),
    lost: fromFeatures
      .filter((f) => !toNames.has(f.name))
      .map((f) => featureDefToPlanFeature(f, true, false)),
    keeping: toFeatures
      .filter((f) => fromNames.has(f.name))
      .map((f) => featureDefToPlanFeature(f, true, true)),
  };
}

// ============================================================================
// Email Sending Functions
// ============================================================================

/**
 * Send upgrade confirmation email
 * Called when subscription plan is upgraded
 */
export async function sendSubscriptionUpgradeEmail(params: {
  organizationId: string;
  previousPlan: string;
  newPlan: string;
  previousPrice: number;
  newPrice: number;
  currency: string;
  billingCycle: "monthly" | "yearly";
  effectiveDate: string;
  nextBillingDate: string;
  nextBillingAmount: number;
  proratedAmount?: number;
  invoiceDetails?: SubscriptionInvoiceDetails;
  paymentMethod?: PaymentMethodSummary;
}): Promise<SendEmailResult> {
  const userOrg = await getUserAndOrganization(params.organizationId);
  if (!userOrg) {
    return { success: false, error: "User or organization not found" };
  }

  const { user, organization } = userOrg;

  // Check notification preferences
  if (user.receive_notifications === false) {
    return { success: false, error: "User has disabled notifications" };
  }

  // Check unsubscribe status
  const unsubscribed = await isEmailUnsubscribed(user.email);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const urls = buildBaseUrls(params.organizationId);
  const featureDiff = getPlanFeatureDiff(params.previousPlan, params.newPlan);

  // Map plan keys to display names
  const planNames = PLAN_DISPLAY_NAMES;

  const emailData: SubscriptionUpgradeConfirmationEmailData = {
    toEmail: user.email,
    toName: user.full_name || undefined,
    firstName: user.full_name?.split(" ")[0] || "there",
    organizationName: organization.name,
    previousPlanName: planNames[params.previousPlan] || params.previousPlan,
    newPlanName: planNames[params.newPlan] || params.newPlan,
    previousPrice: params.previousPrice,
    newPrice: params.newPrice,
    currency: params.currency,
    billingCycle: params.billingCycle,
    effectiveDate: params.effectiveDate,
    newFeatures: featureDiff.gained,
    nextBillingDate: params.nextBillingDate,
    nextBillingAmount: params.nextBillingAmount,
    proratedAmount: params.proratedAmount,
    invoiceDetails: params.invoiceDetails,
    paymentMethod: params.paymentMethod,
    dashboardUrl: urls.dashboardUrl,
    billingUrl: urls.billingUrl,
    unsubscribeUrl: urls.unsubscribeUrl,
    supportEmail: SUPPORT_EMAIL,
    organizationId: params.organizationId,
  };

  const { subject, html } = getSubscriptionUpgradeConfirmationEmail(emailData);

  return sendEmail({
    to: user.email,
    subject,
    html,
    templateName: "subscription_upgrade_confirmation",
    user,
    organizationId: params.organizationId,
  });
}

/**
 * Send downgrade confirmation email
 * Called when subscription plan is downgraded
 */
export async function sendSubscriptionDowngradeEmail(params: {
  organizationId: string;
  previousPlan: string;
  newPlan: string;
  previousPrice: number;
  newPrice: number;
  currency: string;
  billingCycle: "monthly" | "yearly";
  effectiveDate: string;
  isEndOfPeriod: boolean;
  nextBillingDate: string;
  nextBillingAmount: number;
  creditAmount?: number;
}): Promise<SendEmailResult> {
  const userOrg = await getUserAndOrganization(params.organizationId);
  if (!userOrg) {
    return { success: false, error: "User or organization not found" };
  }

  const { user, organization } = userOrg;

  if (user.receive_notifications === false) {
    return { success: false, error: "User has disabled notifications" };
  }

  const unsubscribed = await isEmailUnsubscribed(user.email);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const urls = buildBaseUrls(params.organizationId);
  const featureDiff = getPlanFeatureDiff(params.previousPlan, params.newPlan);

  const planNames = PLAN_DISPLAY_NAMES;

  const emailData: SubscriptionDowngradeConfirmationEmailData = {
    toEmail: user.email,
    toName: user.full_name || undefined,
    firstName: user.full_name?.split(" ")[0] || "there",
    organizationName: organization.name,
    previousPlanName: planNames[params.previousPlan] || params.previousPlan,
    newPlanName: planNames[params.newPlan] || params.newPlan,
    previousPrice: params.previousPrice,
    newPrice: params.newPrice,
    currency: params.currency,
    billingCycle: params.billingCycle,
    featuresLosing: featureDiff.lost,
    featuresKeeping: featureDiff.keeping,
    effectiveDate: params.effectiveDate,
    isEndOfPeriod: params.isEndOfPeriod,
    nextBillingDate: params.nextBillingDate,
    nextBillingAmount: params.nextBillingAmount,
    creditAmount: params.creditAmount,
    dashboardUrl: urls.dashboardUrl,
    billingUrl: urls.billingUrl,
    upgradeUrl: `${urls.billingUrl}/upgrade`,
    unsubscribeUrl: urls.unsubscribeUrl,
    supportEmail: SUPPORT_EMAIL,
    organizationId: params.organizationId,
  };

  const { subject, html } = getSubscriptionDowngradeConfirmationEmail(emailData);

  return sendEmail({
    to: user.email,
    subject,
    html,
    templateName: "subscription_downgrade_confirmation",
    user,
    organizationId: params.organizationId,
  });
}

/**
 * Send renewal reminder email
 * Called 14 days before annual subscription renewal
 */
export async function sendSubscriptionRenewalReminderEmail(params: {
  organizationId: string;
  planName: string;
  renewalDate: string;
  renewalAmount: number;
  currency: string;
  billingCycle: "monthly" | "yearly";
  paymentMethod?: PaymentMethodSummary;
  usageSummary?: {
    reviewsCollected: number;
    surveysSent: number;
    teamMembers: number;
  };
}): Promise<SendEmailResult> {
  const userOrg = await getUserAndOrganization(params.organizationId);
  if (!userOrg) {
    return { success: false, error: "User or organization not found" };
  }

  const { user, organization } = userOrg;

  if (user.receive_notifications === false) {
    return { success: false, error: "User has disabled notifications" };
  }

  const unsubscribed = await isEmailUnsubscribed(user.email);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const urls = buildBaseUrls(params.organizationId);
  const renewalDate = new Date(params.renewalDate);
  const daysTillRenewal = daysBetween(new Date(), renewalDate);

  const planNames = PLAN_DISPLAY_NAMES;

  const emailData: SubscriptionRenewalReminderEmailData = {
    toEmail: user.email,
    toName: user.full_name || undefined,
    firstName: user.full_name?.split(" ")[0] || "there",
    organizationName: organization.name,
    planName: planNames[params.planName] || params.planName,
    renewalDate: params.renewalDate,
    renewalAmount: params.renewalAmount,
    currency: params.currency,
    billingCycle: params.billingCycle,
    daysTillRenewal,
    paymentMethod: params.paymentMethod,
    usageSummary: params.usageSummary,
    dashboardUrl: urls.dashboardUrl,
    billingUrl: urls.billingUrl,
    updatePaymentUrl: `${urls.billingUrl}/payment`,
    cancelUrl: `${urls.billingUrl}/cancel`,
    unsubscribeUrl: urls.unsubscribeUrl,
    supportEmail: SUPPORT_EMAIL,
    organizationId: params.organizationId,
  };

  const { subject, html } = getSubscriptionRenewalReminderEmail(emailData);

  return sendEmail({
    to: user.email,
    subject,
    html,
    templateName: "subscription_renewal_reminder",
    user,
    organizationId: params.organizationId,
  });
}

/**
 * Send renewal success email (payment receipt)
 * Called when subscription payment succeeds
 */
export async function sendSubscriptionRenewedEmail(params: {
  organizationId: string;
  planName: string;
  renewedDate: string;
  amountPaid: number;
  currency: string;
  billingCycle: "monthly" | "yearly";
  invoiceDetails: SubscriptionInvoiceDetails;
  nextBillingDate: string;
  nextBillingAmount: number;
  paymentMethod?: PaymentMethodSummary;
}): Promise<SendEmailResult> {
  const userOrg = await getUserAndOrganization(params.organizationId);
  if (!userOrg) {
    return { success: false, error: "User or organization not found" };
  }

  const { user, organization } = userOrg;

  if (user.receive_notifications === false) {
    return { success: false, error: "User has disabled notifications" };
  }

  const unsubscribed = await isEmailUnsubscribed(user.email);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const urls = buildBaseUrls(params.organizationId);

  const planNames = PLAN_DISPLAY_NAMES;

  const emailData: SubscriptionRenewedEmailData = {
    toEmail: user.email,
    toName: user.full_name || undefined,
    firstName: user.full_name?.split(" ")[0] || "there",
    organizationName: organization.name,
    planName: planNames[params.planName] || params.planName,
    renewedDate: params.renewedDate,
    amountPaid: params.amountPaid,
    currency: params.currency,
    billingCycle: params.billingCycle,
    invoiceDetails: params.invoiceDetails,
    nextBillingDate: params.nextBillingDate,
    nextBillingAmount: params.nextBillingAmount,
    paymentMethod: params.paymentMethod,
    dashboardUrl: urls.dashboardUrl,
    billingUrl: urls.billingUrl,
    unsubscribeUrl: urls.unsubscribeUrl,
    supportEmail: SUPPORT_EMAIL,
    organizationId: params.organizationId,
  };

  const { subject, html } = getSubscriptionRenewedEmail(emailData);

  return sendEmail({
    to: user.email,
    subject,
    html,
    templateName: "subscription_renewed",
    user,
    organizationId: params.organizationId,
  });
}

/**
 * Send cancellation confirmation email
 * Called when subscription is cancelled
 */
export async function sendSubscriptionCancelledEmail(params: {
  organizationId: string;
  planName: string;
  effectiveEndDate: string;
}): Promise<SendEmailResult> {
  const userOrg = await getUserAndOrganization(params.organizationId);
  if (!userOrg) {
    return { success: false, error: "User or organization not found" };
  }

  const { user, organization } = userOrg;

  if (user.receive_notifications === false) {
    return { success: false, error: "User has disabled notifications" };
  }

  const unsubscribed = await isEmailUnsubscribed(user.email);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const urls = buildBaseUrls(params.organizationId);
  const endDate = new Date(params.effectiveEndDate);
  const daysRemaining = daysBetween(new Date(), endDate);

  const planNames = PLAN_DISPLAY_NAMES;

  // Build action URLs with base URL
  const offboardingChecklist = DEFAULT_OFFBOARDING_CHECKLIST.map((item) => ({
    ...item,
    actionUrl: item.actionUrl
      ? `${urls.baseUrl}${item.actionUrl}`
      : undefined,
  }));

  const emailData: SubscriptionCancelledEmailData = {
    toEmail: user.email,
    toName: user.full_name || undefined,
    firstName: user.full_name?.split(" ")[0] || "there",
    organizationName: organization.name,
    planName: planNames[params.planName] || params.planName,
    cancellationDate: new Date().toISOString(),
    effectiveEndDate: params.effectiveEndDate,
    daysRemaining: Math.max(0, daysRemaining),
    offboardingChecklist,
    dataExportUrl: `${urls.baseUrl}/dashboard/settings/export`,
    reactivateUrl: `${urls.billingUrl}/reactivate`,
    feedbackUrl: `${urls.baseUrl}/feedback/cancellation`,
    dashboardUrl: urls.dashboardUrl,
    billingUrl: urls.billingUrl,
    unsubscribeUrl: urls.unsubscribeUrl,
    supportEmail: SUPPORT_EMAIL,
    organizationId: params.organizationId,
  };

  const { subject, html } = getSubscriptionCancelledEmail(emailData);

  return sendEmail({
    to: user.email,
    subject,
    html,
    templateName: "subscription_cancelled",
    user,
    organizationId: params.organizationId,
  });
}

/**
 * Send cancellation feedback request email
 * Called 1-2 days after cancellation
 */
export async function sendSubscriptionCancellationFeedbackEmail(params: {
  organizationId: string;
  planName: string;
  cancellationDate: string;
  effectiveEndDate: string;
  specialOfferAvailable?: boolean;
  specialOfferDetails?: {
    discountPercent: number;
    validUntil: string;
    reactivateUrl: string;
  };
}): Promise<SendEmailResult> {
  const userOrg = await getUserAndOrganization(params.organizationId);
  if (!userOrg) {
    return { success: false, error: "User or organization not found" };
  }

  const { user, organization } = userOrg;

  if (user.receive_notifications === false) {
    return { success: false, error: "User has disabled notifications" };
  }

  const unsubscribed = await isEmailUnsubscribed(user.email);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const urls = buildBaseUrls(params.organizationId);

  const planNames = PLAN_DISPLAY_NAMES;

  const emailData: SubscriptionCancellationFeedbackEmailData = {
    toEmail: user.email,
    toName: user.full_name || undefined,
    firstName: user.full_name?.split(" ")[0] || "there",
    organizationName: organization.name,
    planName: planNames[params.planName] || params.planName,
    cancellationDate: params.cancellationDate,
    effectiveEndDate: params.effectiveEndDate,
    feedbackUrl: `${urls.baseUrl}/feedback/cancellation`,
    feedbackOptions: DEFAULT_FEEDBACK_OPTIONS,
    specialOfferAvailable: params.specialOfferAvailable,
    specialOfferDetails: params.specialOfferDetails,
    dashboardUrl: urls.dashboardUrl,
    billingUrl: urls.billingUrl,
    unsubscribeUrl: urls.unsubscribeUrl,
    supportEmail: SUPPORT_EMAIL,
    organizationId: params.organizationId,
  };

  const { subject, html } =
    getSubscriptionCancellationFeedbackEmail(emailData);

  return sendEmail({
    to: user.email,
    subject,
    html,
    templateName: "subscription_cancellation_feedback",
    user,
    organizationId: params.organizationId,
  });
}

/**
 * Send plan change scheduled email
 * Called when a plan change is scheduled for end of billing period
 */
export async function sendSubscriptionPlanChangeScheduledEmail(params: {
  organizationId: string;
  currentPlan: string;
  scheduledPlan: string;
  currentPrice: number;
  scheduledPrice: number;
  currency: string;
  billingCycle: "monthly" | "yearly";
  scheduledDate: string;
  changeType: "upgrade" | "downgrade";
}): Promise<SendEmailResult> {
  const userOrg = await getUserAndOrganization(params.organizationId);
  if (!userOrg) {
    return { success: false, error: "User or organization not found" };
  }

  const { user, organization } = userOrg;

  if (user.receive_notifications === false) {
    return { success: false, error: "User has disabled notifications" };
  }

  const unsubscribed = await isEmailUnsubscribed(user.email);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const urls = buildBaseUrls(params.organizationId);
  const scheduledDate = new Date(params.scheduledDate);
  const daysUntilChange = daysBetween(new Date(), scheduledDate);

  const planNames = PLAN_DISPLAY_NAMES;

  const featureDiff = getPlanFeatureDiff(
    params.currentPlan,
    params.scheduledPlan
  );

  const emailData: SubscriptionPlanChangeScheduledEmailData = {
    toEmail: user.email,
    toName: user.full_name || undefined,
    firstName: user.full_name?.split(" ")[0] || "there",
    organizationName: organization.name,
    currentPlanName: planNames[params.currentPlan] || params.currentPlan,
    scheduledPlanName: planNames[params.scheduledPlan] || params.scheduledPlan,
    currentPrice: params.currentPrice,
    scheduledPrice: params.scheduledPrice,
    currency: params.currency,
    billingCycle: params.billingCycle,
    scheduledDate: params.scheduledDate,
    daysUntilChange,
    changeType: params.changeType,
    featureChanges:
      params.changeType === "upgrade" ? featureDiff.gained : featureDiff.lost,
    dashboardUrl: urls.dashboardUrl,
    billingUrl: urls.billingUrl,
    cancelChangeUrl: `${urls.billingUrl}/cancel-scheduled-change`,
    unsubscribeUrl: urls.unsubscribeUrl,
    supportEmail: SUPPORT_EMAIL,
    organizationId: params.organizationId,
  };

  const { subject, html } =
    getSubscriptionPlanChangeScheduledEmail(emailData);

  return sendEmail({
    to: user.email,
    subject,
    html,
    templateName: "subscription_plan_change_scheduled",
    user,
    organizationId: params.organizationId,
  });
}

/**
 * Send invoice available email
 * Called when a new invoice is generated
 */
export async function sendSubscriptionInvoiceAvailableEmail(params: {
  organizationId: string;
  planName: string;
  invoiceDetails: SubscriptionInvoiceDetails;
  billingPeriod: { start: string; end: string };
  paymentMethod?: PaymentMethodSummary;
  payNowUrl?: string;
}): Promise<SendEmailResult> {
  const userOrg = await getUserAndOrganization(params.organizationId);
  if (!userOrg) {
    return { success: false, error: "User or organization not found" };
  }

  const { user, organization } = userOrg;

  if (user.receive_notifications === false) {
    return { success: false, error: "User has disabled notifications" };
  }

  const unsubscribed = await isEmailUnsubscribed(user.email);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const urls = buildBaseUrls(params.organizationId);

  const planNames = PLAN_DISPLAY_NAMES;

  const emailData: SubscriptionInvoiceAvailableEmailData = {
    toEmail: user.email,
    toName: user.full_name || undefined,
    firstName: user.full_name?.split(" ")[0] || "there",
    organizationName: organization.name,
    planName: planNames[params.planName] || params.planName,
    invoiceDetails: params.invoiceDetails,
    billingPeriod: params.billingPeriod,
    paymentMethod: params.paymentMethod,
    dashboardUrl: urls.dashboardUrl,
    billingUrl: urls.billingUrl,
    payNowUrl: params.payNowUrl,
    unsubscribeUrl: urls.unsubscribeUrl,
    supportEmail: SUPPORT_EMAIL,
    organizationId: params.organizationId,
  };

  const { subject, html } = getSubscriptionInvoiceAvailableEmail(emailData);

  return sendEmail({
    to: user.email,
    subject,
    html,
    templateName: "subscription_invoice_available",
    user,
    organizationId: params.organizationId,
  });
}

/**
 * Send price increase notice email
 * Called 30 days before annual renewal with price increase
 */
export async function sendSubscriptionPriceIncreaseNoticeEmail(params: {
  organizationId: string;
  planName: string;
  currentPrice: number;
  newPrice: number;
  currency: string;
  billingCycle: "monthly" | "yearly";
  effectiveDate: string;
  reason?: string;
  newFeatures?: string[];
}): Promise<SendEmailResult> {
  const userOrg = await getUserAndOrganization(params.organizationId);
  if (!userOrg) {
    return { success: false, error: "User or organization not found" };
  }

  const { user, organization } = userOrg;

  if (user.receive_notifications === false) {
    return { success: false, error: "User has disabled notifications" };
  }

  const unsubscribed = await isEmailUnsubscribed(user.email);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const urls = buildBaseUrls(params.organizationId);
  const effectiveDate = new Date(params.effectiveDate);
  const daysUntilIncrease = daysBetween(new Date(), effectiveDate);
  const priceIncreaseAmount = params.newPrice - params.currentPrice;
  const priceIncreasePercent = Math.round(
    (priceIncreaseAmount / params.currentPrice) * 100
  );

  const planNames = PLAN_DISPLAY_NAMES;

  const emailData: SubscriptionPriceIncreaseNoticeEmailData = {
    toEmail: user.email,
    toName: user.full_name || undefined,
    firstName: user.full_name?.split(" ")[0] || "there",
    organizationName: organization.name,
    planName: planNames[params.planName] || params.planName,
    currentPrice: params.currentPrice,
    newPrice: params.newPrice,
    priceIncreaseAmount,
    priceIncreasePercent,
    currency: params.currency,
    billingCycle: params.billingCycle,
    effectiveDate: params.effectiveDate,
    daysUntilIncrease,
    reason: params.reason,
    newFeatures: params.newFeatures,
    dashboardUrl: urls.dashboardUrl,
    billingUrl: urls.billingUrl,
    cancelUrl: `${urls.billingUrl}/cancel`,
    downgradePlanUrl: `${urls.billingUrl}/plans`,
    unsubscribeUrl: urls.unsubscribeUrl,
    supportEmail: SUPPORT_EMAIL,
    organizationId: params.organizationId,
  };

  const { subject, html } =
    getSubscriptionPriceIncreaseNoticeEmail(emailData);

  return sendEmail({
    to: user.email,
    subject,
    html,
    templateName: "subscription_price_increase_notice",
    user,
    organizationId: params.organizationId,
  });
}

// ============================================================================
// Core Email Sending Function
// ============================================================================

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  templateName: EmailTemplate;
  user: UserInfo;
  organizationId: string;
}): Promise<SendEmailResult> {
  const resend = getResendClient();

  try {
    const response = await resend.emails.send({
      from: getFromAddress(),
      to: params.to,
      subject: params.subject,
      html: params.html,
      tags: [
        { name: "template", value: params.templateName },
        { name: "organization_id", value: params.organizationId },
        { name: "category", value: "subscription_lifecycle" },
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: params.to,
        toName: params.user.full_name || undefined,
        fromEmail: emailConfig.defaultFromEmail,
        subject: params.subject,
        templateName: params.templateName,
        organizationId: params.organizationId,
        userId: params.user.id,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    const emailId = await logEmail({
      toEmail: params.to,
      toName: params.user.full_name || undefined,
      fromEmail: emailConfig.defaultFromEmail,
      subject: params.subject,
      templateName: params.templateName,
      organizationId: params.organizationId,
      userId: params.user.id,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, emailId: emailId || response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: params.to,
      toName: params.user.full_name || undefined,
      fromEmail: emailConfig.defaultFromEmail,
      subject: params.subject,
      templateName: params.templateName,
      organizationId: params.organizationId,
      userId: params.user.id,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// Cron Job Handlers
// ============================================================================

/**
 * Process renewal reminders for annual subscriptions
 * Called daily by cron job to send 14-day advance notices
 */
export async function processRenewalReminders(): Promise<{
  processed: number;
  failed: number;
  errors: string[];
}> {
  const supabase = createAdminClient();
  const result = { processed: 0, failed: 0, errors: [] as string[] };

  // Find organizations with annual subscriptions renewing in 14 days
  const targetDate = addDays(new Date(), 14);
  const targetDateStart = new Date(targetDate);
  targetDateStart.setHours(0, 0, 0, 0);
  const targetDateEnd = new Date(targetDate);
  targetDateEnd.setHours(23, 59, 59, 999);

  const { data: orgs, error } = await supabase
    .from("organizations")
    .select("id, subscription_tier, subscription_ends_at")
    .eq("subscription_status", "active")
    .gte("subscription_ends_at", targetDateStart.toISOString())
    .lte("subscription_ends_at", targetDateEnd.toISOString());

  if (error) {
    result.errors.push(`Failed to fetch organizations: ${error.message}`);
    return result;
  }

  if (!orgs || orgs.length === 0) {
    return result;
  }

  for (const org of orgs) {
    try {
      // Skip if we've already sent a reminder for this period
      const { data: existingEmail } = await supabase
        .from("email_logs")
        .select("id")
        .eq("organization_id", org.id)
        .eq("template_name", "subscription_renewal_reminder")
        .gte("sent_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1)
        .maybeSingle();

      if (existingEmail) {
        continue; // Already sent reminder recently
      }

      // TODO: Fetch actual subscription data from Stripe
      // For now, use placeholder values
      const sendResult = await sendSubscriptionRenewalReminderEmail({
        organizationId: org.id,
        planName: org.subscription_tier || "professional",
        renewalDate: org.subscription_ends_at || targetDate.toISOString(),
        renewalAmount: 0, // Would be fetched from Stripe
        currency: "usd",
        billingCycle: "yearly",
      });

      if (sendResult.success) {
        result.processed++;
      } else {
        result.failed++;
        result.errors.push(`Org ${org.id}: ${sendResult.error}`);
      }
    } catch (err) {
      result.failed++;
      result.errors.push(
        `Org ${org.id}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return result;
}

/**
 * Process cancellation feedback requests
 * Called daily to send feedback requests 2 days after cancellation
 */
export async function processCancellationFeedbackRequests(): Promise<{
  processed: number;
  failed: number;
  errors: string[];
}> {
  const supabase = createAdminClient();
  const result = { processed: 0, failed: 0, errors: [] as string[] };

  // Find organizations cancelled 2 days ago
  const targetDate = addDays(new Date(), -2);
  const targetDateStart = new Date(targetDate);
  targetDateStart.setHours(0, 0, 0, 0);
  const targetDateEnd = new Date(targetDate);
  targetDateEnd.setHours(23, 59, 59, 999);

  const { data: orgs, error } = await supabase
    .from("organizations")
    .select("id, subscription_tier, subscription_cancelled_at, subscription_ends_at")
    .eq("subscription_status", "cancelled")
    .gte("subscription_cancelled_at", targetDateStart.toISOString())
    .lte("subscription_cancelled_at", targetDateEnd.toISOString());

  if (error) {
    result.errors.push(`Failed to fetch organizations: ${error.message}`);
    return result;
  }

  if (!orgs || orgs.length === 0) {
    return result;
  }

  for (const org of orgs) {
    try {
      // Skip if we've already sent a feedback request
      const { data: existingEmail } = await supabase
        .from("email_logs")
        .select("id")
        .eq("organization_id", org.id)
        .eq("template_name", "subscription_cancellation_feedback")
        .limit(1)
        .maybeSingle();

      if (existingEmail) {
        continue; // Already sent feedback request
      }

      const sendResult = await sendSubscriptionCancellationFeedbackEmail({
        organizationId: org.id,
        planName: org.subscription_tier || "professional",
        cancellationDate: org.subscription_cancelled_at || new Date().toISOString(),
        effectiveEndDate: org.subscription_ends_at || new Date().toISOString(),
        specialOfferAvailable: false, // Could be determined by business rules
      });

      if (sendResult.success) {
        result.processed++;
      } else {
        result.failed++;
        result.errors.push(`Org ${org.id}: ${sendResult.error}`);
      }
    } catch (err) {
      result.failed++;
      result.errors.push(
        `Org ${org.id}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return result;
}
