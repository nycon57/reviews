/**
 * Failed Payment Recovery (Dunning) Sequence Service
 *
 * Manages the 5-email dunning sequence when subscription payment fails:
 * - Email 1 (Day 0): Friendly payment failed notice - immediate
 * - Email 2 (Day 3): Reminder with easy update payment link
 * - Email 3 (Day 7): Urgent notice - service may be interrupted
 * - Email 4 (Day 10): Final warning before suspension
 * - Email 5 (Day 14): Account suspended notice with recovery path
 *
 * Key behaviors:
 * - Assumes card expired or bank issue (not customer's fault)
 * - Tracks recovery when payment succeeds
 * - Exits sequence on successful payment
 * - Handles account suspension and data retention
 */

import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { getResendClient, getFromAddress, emailConfig } from "./client";
import type {
  EmailTemplate,
  Dunning1PaymentFailedEmailData,
  Dunning2ReminderEmailData,
  Dunning3UrgentEmailData,
  Dunning4FinalWarningEmailData,
  Dunning5SuspendedEmailData,
  PaymentDeclineReason,
  DunningPaymentMethodInfo,
  DunningAccountSummary,
} from "./types";
import {
  getDunning1PaymentFailedEmail,
  getDunning2ReminderEmail,
  getDunning3UrgentEmail,
  getDunning4FinalWarningEmail,
  getDunning5SuspendedEmail,
  getDeclineReasonMessage,
} from "./dunning-templates";

// ============================================================================
// Types
// ============================================================================

interface DunningSequenceConfig {
  totalSteps: 5;
  schedule: {
    step: number;
    daysAfterFailure: number;
    templateName: EmailTemplate;
    suspendAccount: boolean;
  }[];
  dataRetentionDays: number;
  supportEmail: string;
}

interface DunningSequenceRecord {
  id: string;
  user_id: string;
  organization_id: string;
  sequence_type: string;
  status: string;
  current_step: number;
  total_steps: number;
  steps_completed: Array<{
    step: number;
    email_id: string;
    sent_at: string;
  }>;
  ab_test_assignments: Record<string, string>;
  skipped_steps: Array<{
    step: number;
    reason: string;
    skipped_at: string;
  }>;
  exit_reason?: string;
  exit_milestone?: string;
  exited_at?: string;
  next_email_at?: string;
  last_email_at?: string;
  metadata: {
    firstName: string;
    organizationName: string;
    stripeInvoiceId: string;
    invoiceAmount: number;
    invoiceCurrency: string;
    invoiceNumber: string | null;
    failedAt: string;
    declineReason: PaymentDeclineReason;
    paymentMethod: DunningPaymentMethodInfo | null;
    retryCount: number;
  };
  started_at: string;
  completed_at?: string;
}

interface QueueProcessResult {
  processed: number;
  failed: number;
  skipped: number;
  recovered: number;
  errors: string[];
}

// ============================================================================
// Configuration
// ============================================================================

const DUNNING_SEQUENCE_CONFIG: DunningSequenceConfig = {
  totalSteps: 5,
  schedule: [
    {
      step: 1,
      daysAfterFailure: 0, // Immediate
      templateName: "dunning_1_payment_failed",
      suspendAccount: false,
    },
    {
      step: 2,
      daysAfterFailure: 3,
      templateName: "dunning_2_reminder",
      suspendAccount: false,
    },
    {
      step: 3,
      daysAfterFailure: 7,
      templateName: "dunning_3_urgent",
      suspendAccount: false,
    },
    {
      step: 4,
      daysAfterFailure: 10,
      templateName: "dunning_4_final_warning",
      suspendAccount: false,
    },
    {
      step: 5,
      daysAfterFailure: 14,
      templateName: "dunning_5_suspended",
      suspendAccount: true,
    },
  ],
  dataRetentionDays: 30,
  supportEmail: "support@repwell.ai",
};

// Features that get limited/restricted during dunning
const FEATURES_AT_RISK = [
  "Automated survey sending",
  "Video testimonial requests",
  "Team member access",
  "Advanced analytics",
  "Google Business sync",
];

const FEATURES_ALREADY_LIMITED = [
  "Adding new team members",
  "Creating new survey templates",
  "Video testimonial requests",
];

// ============================================================================
// Helper Functions
// ============================================================================

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function calculateNextEmailTime(
  failedAt: string,
  nextStep: number
): Date | null {
  const nextStepConfig = DUNNING_SEQUENCE_CONFIG.schedule.find(
    (s) => s.step === nextStep
  );
  if (!nextStepConfig) return null;

  const failedDate = new Date(failedAt);
  return addDays(failedDate, nextStepConfig.daysAfterFailure);
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

/**
 * Map Stripe decline code to our decline reason type
 */
export function mapStripeDeclineCode(
  declineCode: string | null | undefined
): PaymentDeclineReason {
  if (!declineCode) return "unknown";

  const codeMap: Record<string, PaymentDeclineReason> = {
    card_declined: "card_declined",
    generic_decline: "card_declined",
    insufficient_funds: "insufficient_funds",
    expired_card: "expired_card",
    incorrect_cvc: "incorrect_cvc",
    processing_error: "processing_error",
    fraudulent: "fraud_suspected",
    do_not_honor: "card_declined",
    lost_card: "fraud_suspected",
    stolen_card: "fraud_suspected",
    card_not_supported: "card_declined",
    currency_not_supported: "processing_error",
    duplicate_transaction: "processing_error",
    invalid_amount: "processing_error",
    invalid_card_type: "card_declined",
  };

  return codeMap[declineCode] || "unknown";
}

/**
 * Get account summary for dunning emails
 */
async function getAccountSummary(
  organizationId: string
): Promise<DunningAccountSummary> {
  const supabase = createAdminClient();

  // Run queries in parallel
  const [reviewsResult, surveysResult, usersResult, orgResult] =
    await Promise.all([
      supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      supabase
        .from("surveys")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      supabase
        .from("organizations")
        .select("subscription_tier")
        .eq("id", organizationId)
        .single(),
    ]);

  const tierNames: Record<string, string> = {
    basic: "Basic",
    pro: "Pro",
    enterprise: "Enterprise",
  };

  return {
    totalReviews: reviewsResult.count || 0,
    totalSurveys: surveysResult.count || 0,
    teamMembersCount: usersResult.count || 0,
    currentPlan: tierNames[orgResult.data?.subscription_tier || "basic"] || "Unknown",
    monthlyPrice: 0, // Would be fetched from subscription data
  };
}

/**
 * Check if organization has recovered (payment succeeded)
 */
async function hasPaymentRecovered(
  organizationId: string,
  invoiceId: string
): Promise<boolean> {
  // Use untyped client for invoices table (not in typed schema)
  const supabase = createUntypedAdminClient();

  // Check if the invoice has been paid
  const { data: invoice } = await supabase
    .from("invoices")
    .select("status")
    .eq("organization_id", organizationId)
    .eq("stripe_invoice_id", invoiceId)
    .single();

  return invoice?.status === "paid";
}

/**
 * Suspend an organization's account
 */
async function suspendOrganization(organizationId: string): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from("organizations")
    .update({
      subscription_status: "suspended",
      suspended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", organizationId);
}

/**
 * Reactivate a suspended organization
 */
export async function reactivateOrganization(
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("organizations")
    .update({
      subscription_status: "active",
      suspended_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", organizationId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Start a dunning sequence when payment fails
 * Called from Stripe webhook handler
 */
export async function startDunningSequence(params: {
  organizationId: string;
  stripeInvoiceId: string;
  invoiceAmount: number;
  invoiceCurrency: string;
  invoiceNumber: string | null;
  declineCode: string | null;
  paymentMethod: DunningPaymentMethodInfo | null;
}): Promise<{
  success: boolean;
  sequenceId?: string;
  error?: string;
}> {
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
      organizations!inner(name)
    `
    )
    .eq("organization_id", params.organizationId)
    .eq("role", "admin")
    .limit(1)
    .single();

  if (userError || !adminUser) {
    return {
      success: false,
      error: `Admin user not found: ${userError?.message || "Unknown error"}`,
    };
  }

  const org = adminUser.organizations as { name: string };

  // Check if user wants notifications
  if (adminUser.receive_notifications === false) {
    return { success: false, error: "User has disabled notifications" };
  }

  // Check for existing active dunning sequence for this invoice
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingSequence } = await (supabase.from as any)(
    "email_sequences"
  )
    .select("id")
    .eq("organization_id", params.organizationId)
    .eq("sequence_type", "dunning")
    .in("status", ["active", "paused"])
    .single();

  if (existingSequence) {
    // Update existing sequence with new invoice info instead of creating duplicate
    return {
      success: false,
      error: "Dunning sequence already active for this organization",
    };
  }

  const declineReason = mapStripeDeclineCode(params.declineCode);
  const now = new Date();

  // Create the sequence record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequence, error: insertError } = await (supabase.from as any)(
    "email_sequences"
  )
    .insert({
      user_id: adminUser.id,
      organization_id: params.organizationId,
      sequence_type: "dunning",
      status: "active",
      current_step: 0,
      total_steps: DUNNING_SEQUENCE_CONFIG.totalSteps,
      steps_completed: [],
      ab_test_assignments: {},
      skipped_steps: [],
      next_email_at: now.toISOString(), // Send first email immediately
      metadata: {
        firstName: adminUser.full_name?.split(" ")[0] || "there",
        organizationName: org.name,
        stripeInvoiceId: params.stripeInvoiceId,
        invoiceAmount: params.invoiceAmount,
        invoiceCurrency: params.invoiceCurrency,
        invoiceNumber: params.invoiceNumber,
        failedAt: now.toISOString(),
        declineReason,
        paymentMethod: params.paymentMethod,
        retryCount: 1,
      },
    })
    .select("id")
    .single();

  if (insertError) {
    return {
      success: false,
      error: `Failed to create sequence: ${insertError.message}`,
    };
  }

  // Update organization to past_due status
  await supabase
    .from("organizations")
    .update({
      subscription_status: "past_due",
      updated_at: now.toISOString(),
    })
    .eq("id", params.organizationId);

  return { success: true, sequenceId: sequence.id };
}

/**
 * Process the dunning sequence queue
 * Called by cron job every hour
 */
export async function processDunningSequenceQueue(
  batchSize: number = 50
): Promise<QueueProcessResult> {
  const supabase = createAdminClient();
  const result: QueueProcessResult = {
    processed: 0,
    failed: 0,
    skipped: 0,
    recovered: 0,
    errors: [],
  };

  // Get sequences ready to send
  const now = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequences, error } = await (supabase.from as any)(
    "email_sequences"
  )
    .select("*")
    .eq("sequence_type", "dunning")
    .eq("status", "active")
    .lte("next_email_at", now)
    .order("next_email_at", { ascending: true })
    .limit(batchSize);

  if (error) {
    result.errors.push(`Failed to fetch sequences: ${error.message}`);
    return result;
  }

  if (!sequences || sequences.length === 0) {
    return result;
  }

  // Process each sequence
  for (const sequence of sequences as DunningSequenceRecord[]) {
    try {
      const processResult = await processDunningSequenceStep(sequence);

      if (processResult.success) {
        if (processResult.action === "sent") {
          result.processed++;
        } else if (processResult.action === "skipped") {
          result.skipped++;
        } else if (processResult.action === "recovered") {
          result.recovered++;
        }
      } else {
        result.failed++;
        result.errors.push(
          `Sequence ${sequence.id}: ${processResult.error || "Unknown error"}`
        );
      }
    } catch (err) {
      result.failed++;
      result.errors.push(
        `Sequence ${sequence.id}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return result;
}

/**
 * Process a single dunning sequence step
 */
async function processDunningSequenceStep(
  sequence: DunningSequenceRecord
): Promise<{
  success: boolean;
  action?: "sent" | "skipped" | "recovered" | "completed";
  error?: string;
}> {
  const supabase = createAdminClient();

  // Get user data
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email, full_name, receive_notifications")
    .eq("id", sequence.user_id)
    .single();

  if (userError || !user) {
    return { success: false, error: "User not found" };
  }

  // Check if user still wants notifications
  if (user.receive_notifications === false) {
    await updateDunningSequenceStatus(
      sequence.id,
      "cancelled",
      "user_disabled_notifications"
    );
    return { success: true, action: "skipped" };
  }

  // Check if email is unsubscribed
  const unsubscribed = await isEmailUnsubscribed(user.email);
  if (unsubscribed) {
    await updateDunningSequenceStatus(
      sequence.id,
      "cancelled",
      "email_unsubscribed"
    );
    return { success: true, action: "skipped" };
  }

  // Check if payment has recovered
  const recovered = await hasPaymentRecovered(
    sequence.organization_id,
    sequence.metadata.stripeInvoiceId
  );

  if (recovered) {
    await handlePaymentRecovery(sequence);
    return { success: true, action: "recovered" };
  }

  // Determine next step
  const nextStep = sequence.current_step + 1;

  if (nextStep > DUNNING_SEQUENCE_CONFIG.totalSteps) {
    // Sequence complete
    await updateDunningSequenceStatus(sequence.id, "completed");
    return { success: true, action: "completed" };
  }

  const stepConfig = DUNNING_SEQUENCE_CONFIG.schedule.find(
    (s) => s.step === nextStep
  );

  if (!stepConfig) {
    return { success: false, error: `Invalid step: ${nextStep}` };
  }

  // Get account summary
  const accountSummary = await getAccountSummary(sequence.organization_id);

  // Suspend account if this step requires it
  if (stepConfig.suspendAccount) {
    await suspendOrganization(sequence.organization_id);
  }

  // Send the email
  const sendResult = await sendDunningEmail(
    sequence,
    user,
    stepConfig,
    accountSummary
  );

  if (!sendResult.success) {
    return { success: false, error: sendResult.error };
  }

  // Update sequence after successful send
  await updateDunningSequenceAfterSend(
    sequence,
    nextStep,
    sendResult.emailId!,
    stepConfig.templateName
  );

  return { success: true, action: "sent" };
}

/**
 * Send a dunning email
 */
async function sendDunningEmail(
  sequence: DunningSequenceRecord,
  user: { id: string; email: string; full_name: string | null },
  stepConfig: DunningSequenceConfig["schedule"][number],
  accountSummary: DunningAccountSummary
): Promise<{
  success: boolean;
  emailId?: string;
  error?: string;
}> {
  const resend = getResendClient();
  const baseUrl = emailConfig.baseUrl;
  const unsubscribeUrl = `${baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(user.email)}`;
  const dashboardUrl = `${baseUrl}/dashboard`;
  const updatePaymentUrl = `${baseUrl}/dashboard/settings?tab=billing`;

  const baseData = {
    toEmail: user.email,
    toName: user.full_name || undefined,
    firstName: sequence.metadata.firstName,
    organizationName: sequence.metadata.organizationName,
    dashboardUrl,
    sequenceId: sequence.id,
    unsubscribeUrl,
    updatePaymentUrl,
    supportEmail: DUNNING_SEQUENCE_CONFIG.supportEmail,
    organizationId: sequence.organization_id,
    invoiceAmount: sequence.metadata.invoiceAmount,
    invoiceCurrency: sequence.metadata.invoiceCurrency,
    invoiceNumber: sequence.metadata.invoiceNumber,
    failedAt: sequence.metadata.failedAt,
    paymentMethod: sequence.metadata.paymentMethod,
  };

  const daysSinceFailure = Math.floor(
    (Date.now() - new Date(sequence.metadata.failedAt).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  let emailContent: { subject: string; html: string };

  switch (stepConfig.step) {
    case 1: {
      const declineInfo = getDeclineReasonMessage(
        sequence.metadata.declineReason
      );

      const data: Dunning1PaymentFailedEmailData = {
        ...baseData,
        declineReason: sequence.metadata.declineReason,
        declineMessage: declineInfo.message,
        retryDate: addDays(new Date(), 3).toISOString(),
        commonSolutions: declineInfo.solutions,
      };
      emailContent = getDunning1PaymentFailedEmail(data);
      break;
    }

    case 2: {
      const data: Dunning2ReminderEmailData = {
        ...baseData,
        daysSinceFailure,
        accountSummary,
        featuresAtRisk: FEATURES_AT_RISK,
      };
      emailContent = getDunning2ReminderEmail(data);
      break;
    }

    case 3: {
      const suspensionDate = addDays(
        new Date(sequence.metadata.failedAt),
        14
      ).toISOString();

      const data: Dunning3UrgentEmailData = {
        ...baseData,
        daysSinceFailure,
        daysUntilSuspension: 14 - daysSinceFailure,
        suspensionDate,
        accountSummary,
        featuresAlreadyLimited: FEATURES_ALREADY_LIMITED,
      };
      emailContent = getDunning3UrgentEmail(data);
      break;
    }

    case 4: {
      const suspensionDate = addDays(
        new Date(sequence.metadata.failedAt),
        14
      ).toISOString();

      const data: Dunning4FinalWarningEmailData = {
        ...baseData,
        daysSinceFailure,
        suspensionDate,
        accountSummary,
        dataRetentionDays: DUNNING_SEQUENCE_CONFIG.dataRetentionDays,
      };
      emailContent = getDunning4FinalWarningEmail(data);
      break;
    }

    case 5: {
      const suspendedAt = new Date().toISOString();
      const dataRetentionEndsAt = addDays(
        new Date(),
        DUNNING_SEQUENCE_CONFIG.dataRetentionDays
      ).toISOString();

      const data: Dunning5SuspendedEmailData = {
        ...baseData,
        suspendedAt,
        accountSummary,
        dataRetentionEndsAt,
        dataRetentionDays: DUNNING_SEQUENCE_CONFIG.dataRetentionDays,
        reactivateUrl: `${baseUrl}/dashboard/settings?tab=billing`,
        exportDataUrl: `${baseUrl}/dashboard/settings/export`,
      };
      emailContent = getDunning5SuspendedEmail(data);
      break;
    }

    default:
      return { success: false, error: `Unknown step: ${stepConfig.step}` };
  }

  try {
    const response = await resend.emails.send({
      from: getFromAddress(),
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      tags: [
        { name: "template", value: stepConfig.templateName },
        { name: "sequence_id", value: sequence.id },
        { name: "sequence_step", value: String(stepConfig.step) },
        { name: "sequence_type", value: "dunning" },
        ...(sequence.organization_id
          ? [{ name: "organization_id", value: sequence.organization_id }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: user.email,
        toName: user.full_name || undefined,
        fromEmail: emailConfig.defaultFromEmail,
        subject: emailContent.subject,
        templateName: stepConfig.templateName,
        organizationId: sequence.organization_id,
        userId: user.id,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    const emailId = await logEmail({
      toEmail: user.email,
      toName: user.full_name || undefined,
      fromEmail: emailConfig.defaultFromEmail,
      subject: emailContent.subject,
      templateName: stepConfig.templateName,
      organizationId: sequence.organization_id,
      userId: user.id,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, emailId: emailId || response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: user.email,
      toName: user.full_name || undefined,
      fromEmail: emailConfig.defaultFromEmail,
      subject: emailContent.subject,
      templateName: stepConfig.templateName,
      organizationId: sequence.organization_id,
      userId: user.id,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

/**
 * Handle payment recovery - exit sequence and reactivate account
 */
async function handlePaymentRecovery(
  sequence: DunningSequenceRecord
): Promise<void> {
  const supabase = createAdminClient();

  // Exit the sequence
  await updateDunningSequenceStatus(
    sequence.id,
    "exited",
    "payment_recovered",
    "payment_success"
  );

  // Reactivate the organization
  await supabase
    .from("organizations")
    .update({
      subscription_status: "active",
      suspended_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sequence.organization_id);

  // Log the recovery for analytics
  console.log(
    `Payment recovered for org ${sequence.organization_id}, sequence ${sequence.id}, step ${sequence.current_step}`
  );
}

/**
 * Update sequence status
 */
async function updateDunningSequenceStatus(
  sequenceId: string,
  status: string,
  exitReason?: string,
  exitMilestone?: string
): Promise<void> {
  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "completed") {
    updateData.completed_at = new Date().toISOString();
  }

  if (exitReason) {
    updateData.exit_reason = exitReason;
    updateData.exited_at = new Date().toISOString();
  }

  if (exitMilestone) {
    updateData.exit_milestone = exitMilestone;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("email_sequences")
    .update(updateData)
    .eq("id", sequenceId);

  if (error) {
    console.error("Failed to update sequence status:", error);
  }
}

/**
 * Update sequence after successful email send
 */
async function updateDunningSequenceAfterSend(
  sequence: DunningSequenceRecord,
  step: number,
  emailId: string,
  templateName: EmailTemplate
): Promise<void> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const stepsCompleted = [
    ...sequence.steps_completed,
    { step, email_id: emailId, sent_at: now, template: templateName },
  ];

  const isComplete = step >= DUNNING_SEQUENCE_CONFIG.totalSteps;
  const nextEmailAt = calculateNextEmailTime(
    sequence.metadata.failedAt,
    step + 1
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("email_sequences")
    .update({
      current_step: step,
      steps_completed: stepsCompleted,
      last_email_at: now,
      next_email_at: nextEmailAt?.toISOString(),
      status: isComplete ? "completed" : "active",
      completed_at: isComplete ? now : null,
      updated_at: now,
    })
    .eq("id", sequence.id);

  if (error) {
    console.error("Failed to update sequence after send:", error);
  }
}

/**
 * Handle payment recovery from Stripe webhook
 * Called when invoice.paid webhook is received
 */
export async function handleInvoicePaidWebhook(
  stripeInvoiceId: string,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Find active dunning sequence for this invoice
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequence, error } = await (supabase.from as any)(
    "email_sequences"
  )
    .select("*")
    .eq("organization_id", organizationId)
    .eq("sequence_type", "dunning")
    .eq("status", "active")
    .single();

  if (error || !sequence) {
    // No active dunning sequence, nothing to do
    return { success: true };
  }

  // Exit the sequence due to payment recovery
  await handlePaymentRecovery(sequence as DunningSequenceRecord);

  return { success: true };
}

/**
 * Get dunning sequence status for an organization
 */
export async function getDunningSequenceStatus(
  organizationId: string
): Promise<{
  hasSequence: boolean;
  sequence?: DunningSequenceRecord;
}> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequence, error } = await (supabase.from as any)(
    "email_sequences"
  )
    .select("*")
    .eq("organization_id", organizationId)
    .eq("sequence_type", "dunning")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !sequence) {
    return { hasSequence: false };
  }

  return { hasSequence: true, sequence: sequence as DunningSequenceRecord };
}

/**
 * Pause a dunning sequence
 */
export async function pauseDunningSequence(
  sequenceId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("email_sequences")
    .update({
      status: "paused",
      updated_at: new Date().toISOString(),
    })
    .eq("id", sequenceId)
    .eq("status", "active");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Resume a paused dunning sequence
 */
export async function resumeDunningSequence(
  sequenceId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("email_sequences")
    .update({
      status: "active",
      next_email_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", sequenceId)
    .eq("status", "paused");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
