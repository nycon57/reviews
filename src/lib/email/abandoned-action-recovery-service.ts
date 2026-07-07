"use server";

/**
 * Abandoned Action Recovery Service (S093)
 *
 * Recovers users who started but didn't complete key actions:
 *
 * Timing:
 * - Email 1: 1 hour after abandonment (gentle reminder)
 * - Email 2: 24 hours after abandonment (more urgency)
 *
 * Action types:
 * - survey_creation: Started creating a survey template
 * - survey_send: Selected employees but didn't send
 * - video_request: Started video testimonial request
 * - billing_upgrade: Visited pricing/upgrade page
 * - profile_completion: Started editing profile
 * - integration_setup: Started OAuth/integration setup
 *
 * Status flow:
 * 1. 'started' - Action initiated
 * 2. 'abandoned' - After email 1 sent (1 hour mark)
 * 3. 'recovered' - User completed action after receiving emails
 * 4. 'completed' - User completed action before emails sent
 * 5. 'expired' - 7 days passed without completion
 */

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getResendClient, getFromAddress, emailConfig } from "./client";
import type {
  EmailTemplate,
  AbandonedActionType,
  AbandonedSurveyCreationEmailData,
  AbandonedSurveySendEmailData,
  AbandonedVideoRequestEmailData,
  AbandonedBillingUpgradeEmailData,
  AbandonedProfileCompletionEmailData,
  AbandonedIntegrationSetupEmailData,
  AbandonedActionRecord,
} from "./types";
import { getAbandonedActionRecoveryEmail } from "./abandoned-action-recovery-templates";
import type { Json } from "@/types/database.types";

// ============================================================================
// Types
// ============================================================================

interface QueueProcessResult {
  processed: number;
  failed: number;
  skipped: number;
  errors: string[];
}

interface ActionTrackingResult {
  success: boolean;
  actionId?: string;
  error?: string;
}

interface ActionReadyForEmail {
  action_id: string;
  user_id: string;
  organization_id: string;
  action_type: AbandonedActionType;
  context: Record<string, unknown>;
  resume_url: string | null;
  started_at: string;
}

// ============================================================================
// Context Validation Helpers (Runtime Type Safety)
// ============================================================================

/**
 * Safely extracts a string from context, returning undefined if not a valid string
 */
function safeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

/**
 * Safely extracts a number from context, converting strings if valid
 */
function safeNumber(value: unknown, defaultValue: number = 0): number {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Safely extracts an integer from context with bounds checking
 */
function safeInteger(
  value: unknown,
  defaultValue: number = 0,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER
): number {
  const num = safeNumber(value, defaultValue);
  return Math.max(min, Math.min(max, Math.floor(num)));
}

/**
 * Safely extracts a string array from context
 */
function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

/**
 * Safely extracts special offer object from context
 */
function safeSpecialOffer(
  value: unknown
): { discountPercent?: number; validUntil?: string } | undefined {
  if (!value || typeof value !== "object" || value === null) {
    return undefined;
  }
  const obj = value as Record<string, unknown>;
  const result: { discountPercent?: number; validUntil?: string } = {};

  if (typeof obj.discountPercent === "number" && !Number.isNaN(obj.discountPercent)) {
    result.discountPercent = Math.max(0, Math.min(100, obj.discountPercent));
  }
  if (typeof obj.validUntil === "string") {
    result.validUntil = obj.validUntil;
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function isEmailUnsubscribed(email: string): Promise<boolean> {
  const supabase = createUntypedAdminClient();
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
  const supabase = createUntypedAdminClient();

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
      user_id: params.userId,
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

function getEmailTemplateNameForAction(
  actionType: AbandonedActionType,
  emailNumber: 1 | 2
): EmailTemplate {
  const templateMap: Record<AbandonedActionType, [EmailTemplate, EmailTemplate]> = {
    survey_creation: ["abandoned_survey_creation_1", "abandoned_survey_creation_2"],
    survey_send: ["abandoned_survey_send_1", "abandoned_survey_send_2"],
    video_request: ["abandoned_video_request_1", "abandoned_video_request_2"],
    billing_upgrade: ["abandoned_billing_upgrade_1", "abandoned_billing_upgrade_2"],
    profile_completion: ["abandoned_profile_completion_1", "abandoned_profile_completion_2"],
    integration_setup: ["abandoned_integration_setup_1", "abandoned_integration_setup_2"],
  };

  return templateMap[actionType][emailNumber - 1];
}

// ============================================================================
// Action Tracking Functions (called by client code)
// ============================================================================

/**
 * Track when a user starts an action that can be recovered
 * Call this when user begins one of the tracked actions
 */
export async function trackActionStarted(
  userId: string,
  organizationId: string,
  actionType: AbandonedActionType,
  context: Record<string, unknown> = {},
  resumeUrl?: string
): Promise<ActionTrackingResult> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase.rpc("track_action_started", {
    p_user_id: userId,
    p_organization_id: organizationId,
    p_action_type: actionType,
    p_context: context as Json,
    p_resume_url: resumeUrl,
  });

  if (error) {
    return {
      success: false,
      error: `Failed to track action start: ${error.message}`,
    };
  }

  return { success: true, actionId: data };
}

/**
 * Track when a user completes an action
 * Call this when user successfully finishes an action
 */
export async function trackActionCompleted(
  userId: string,
  actionType: AbandonedActionType
): Promise<ActionTrackingResult> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase.rpc("track_action_completed", {
    p_user_id: userId,
    p_action_type: actionType,
  });

  if (error) {
    return {
      success: false,
      error: `Failed to track action completion: ${error.message}`,
    };
  }

  return { success: data === true, actionId: undefined };
}

/**
 * Update action context with additional details
 * Call this when user progresses through a multi-step action
 */
export async function updateActionContext(
  userId: string,
  actionType: AbandonedActionType,
  contextUpdate: Record<string, unknown>
): Promise<ActionTrackingResult> {
  const supabase = createUntypedAdminClient();

  // Find the active action
  const { data: action, error: findError } = await supabase
    .from("abandoned_actions")
    .select("id, context")
    .eq("user_id", userId)
    .eq("action_type", actionType)
    .in("status", ["started", "abandoned"])
    .single();

  if (findError || !action) {
    return {
      success: false,
      error: "No active action found to update",
    };
  }

  // Merge context
  const updatedContext = {
    ...(action.context as Record<string, unknown>),
    ...contextUpdate,
  };

  const { error: updateError } = await supabase
    .from("abandoned_actions")
    .update({
      context: updatedContext as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", action.id);

  if (updateError) {
    return {
      success: false,
      error: `Failed to update context: ${updateError.message}`,
    };
  }

  return { success: true, actionId: action.id };
}

// ============================================================================
// Recovery Email Processing Functions (called by cron job)
// ============================================================================

/**
 * Process recovery email queue for a specific email number
 * Called by cron job every 5 minutes
 */
async function processRecoveryEmailQueue(
  emailNumber: 1 | 2,
  batchSize: number = 50
): Promise<QueueProcessResult> {
  const supabase = createUntypedAdminClient();
  const result: QueueProcessResult = {
    processed: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  const rpcName = emailNumber === 1
    ? "get_actions_for_recovery_email_1"
    : "get_actions_for_recovery_email_2";

  const { data: actions, error } = await supabase.rpc(rpcName, {
    p_batch_size: batchSize,
  });

  if (error) {
    result.errors.push(`Failed to fetch actions for email ${emailNumber}: ${error.message}`);
    return result;
  }

  if (!actions || actions.length === 0) {
    return result;
  }

  for (const action of actions as ActionReadyForEmail[]) {
    try {
      const sendResult = await sendRecoveryEmail(action, emailNumber);

      if (sendResult.success) {
        result.processed++;
      } else if (sendResult.skipped) {
        result.skipped++;
      } else {
        result.failed++;
        result.errors.push(`Action ${action.action_id}: ${sendResult.error}`);
      }
    } catch (err) {
      result.failed++;
      result.errors.push(
        `Action ${action.action_id}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return result;
}

/**
 * Process recovery email queue for email 1 (1 hour after start)
 * Called by cron job every 5 minutes
 */
export async function processRecoveryEmail1Queue(
  batchSize: number = 50
): Promise<QueueProcessResult> {
  return processRecoveryEmailQueue(1, batchSize);
}

/**
 * Process recovery email queue for email 2 (24 hours after start)
 * Called by cron job every 5 minutes
 */
export async function processRecoveryEmail2Queue(
  batchSize: number = 50
): Promise<QueueProcessResult> {
  return processRecoveryEmailQueue(2, batchSize);
}

/**
 * Expire old abandoned actions (7 days without completion)
 * Called by cron job daily
 */
export async function expireOldAbandonedActions(): Promise<number> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase.rpc("expire_old_abandoned_actions");

  if (error) {
    console.error("Failed to expire old abandoned actions:", error);
    return 0;
  }

  return data || 0;
}

// ============================================================================
// Internal Email Sending
// ============================================================================

async function sendRecoveryEmail(
  action: ActionReadyForEmail,
  emailNumber: 1 | 2
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  const supabase = createUntypedAdminClient();
  const resend = getResendClient();

  // Get user data
  const { data: user, error: userError } = await supabase
    .from("users")
    .select(`
      id,
      email,
      full_name,
      receive_notifications,
      organization_id,
      organizations!inner(name)
    `)
    .eq("id", action.user_id)
    .single();

  if (userError || !user) {
    return { success: false, error: "User not found" };
  }

  // Check notification preferences
  if (user.receive_notifications === false) {
    return { success: false, skipped: true, error: "User disabled notifications" };
  }

  // Check unsubscribe status
  const unsubscribed = await isEmailUnsubscribed(user.email);
  if (unsubscribed) {
    return { success: false, skipped: true, error: "Email unsubscribed" };
  }

  // Build email data
  const baseUrl = emailConfig.baseUrl;
  const unsubscribeUrl = `${baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(user.email)}`;
  const dashboardUrl = `${baseUrl}/dashboard`;
  const resumeUrl = action.resume_url || dashboardUrl;
  const orgs = user.organizations as { name: string }[] | null;
  const org = orgs?.[0] || { name: "Your Organization" };
  const firstName = user.full_name?.split(" ")[0] || "there";
  const context = action.context || {};

  const baseEmailData = {
    toEmail: user.email,
    toName: user.full_name || undefined,
    firstName,
    organizationName: org.name,
    dashboardUrl,
    resumeUrl,
    unsubscribeUrl,
    actionStartedAt: action.started_at,
    emailNumber,
    organizationId: action.organization_id,
  };

  let emailData:
    | AbandonedSurveyCreationEmailData
    | AbandonedSurveySendEmailData
    | AbandonedVideoRequestEmailData
    | AbandonedBillingUpgradeEmailData
    | AbandonedProfileCompletionEmailData
    | AbandonedIntegrationSetupEmailData;

  // Build email data with runtime-validated context values
  switch (action.action_type) {
    case "survey_creation":
      emailData = {
        ...baseEmailData,
        templateName: safeString(context.template_name),
        lastStep: safeString(context.step),
        lastFieldEdited: safeString(context.last_field),
        createSurveyUrl: `${baseUrl}/dashboard/surveys/templates/new`,
      };
      break;

    case "survey_send":
      emailData = {
        ...baseEmailData,
        employeesSelected: safeInteger(context.contacts_selected, 0, 0, 10000),
        templateName: safeString(context.template_name),
        sendSurveyUrl: `${baseUrl}/dashboard/reviews?tab=requests`,
      };
      break;

    case "video_request":
      emailData = {
        ...baseEmailData,
        customerName: safeString(context.customer_name),
        requestStep: safeString(context.step),
        createRequestUrl: `${baseUrl}/dashboard/video-testimonials/request`,
      };
      break;

    case "billing_upgrade":
      emailData = {
        ...baseEmailData,
        targetPlan: safeString(context.target_plan),
        currentPlan: safeString(context.current_plan),
        pricingUrl: `${baseUrl}/pricing`,
        upgradeUrl: `${baseUrl}/dashboard/settings?tab=billing`,
        featuresHighlight: safeStringArray(context.features_highlight),
        specialOffer: safeSpecialOffer(context.special_offer),
      };
      break;

    case "profile_completion":
      emailData = {
        ...baseEmailData,
        completionPercent: safeInteger(context.completion_percent, 0, 0, 100),
        fieldsIncomplete: safeStringArray(context.fields_incomplete),
        profileUrl: `${baseUrl}/dashboard/profile`,
      };
      break;

    case "integration_setup": {
      const integrationType = safeString(context.integration_type) || "unknown";
      emailData = {
        ...baseEmailData,
        integrationType,
        integrationDisplayName:
          getIntegrationDisplayName(integrationType) || "Integration",
        oauthStep: safeString(context.oauth_step),
        integrationsUrl: `${baseUrl}/dashboard/settings/integrations`,
        setupGuideUrl: safeString(context.setup_guide_url),
        integrationBenefits: safeStringArray(context.benefits),
      };
      break;
    }
  }

  // Generate email content
  const templateName = getEmailTemplateNameForAction(action.action_type, emailNumber);
  let emailContent: { subject: string; html: string };

  try {
    emailContent = getAbandonedActionRecoveryEmail(
      action.action_type,
      emailNumber,
      emailData
    );
  } catch (err) {
    return {
      success: false,
      error: `Failed to generate email: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }

  // Send email via Resend
  try {
    const response = await resend.emails.send({
      from: getFromAddress(),
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      tags: [
        { name: "template", value: templateName },
        { name: "action_type", value: action.action_type },
        { name: "email_number", value: String(emailNumber) },
        { name: "action_id", value: action.action_id },
        ...(action.organization_id
          ? [{ name: "organization_id", value: action.organization_id }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: user.email,
        toName: user.full_name || undefined,
        fromEmail: emailConfig.defaultFromEmail,
        subject: emailContent.subject,
        templateName,
        organizationId: action.organization_id,
        userId: user.id,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    // Log successful email
    const emailId = await logEmail({
      toEmail: user.email,
      toName: user.full_name || undefined,
      fromEmail: emailConfig.defaultFromEmail,
      subject: emailContent.subject,
      templateName,
      organizationId: action.organization_id,
      userId: user.id,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    // Update abandoned action record
    await updateActionAfterEmailSent(action.action_id, emailNumber, emailId);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: user.email,
      toName: user.full_name || undefined,
      fromEmail: emailConfig.defaultFromEmail,
      subject: emailContent.subject,
      templateName,
      organizationId: action.organization_id,
      userId: user.id,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

async function updateActionAfterEmailSent(
  actionId: string,
  emailNumber: 1 | 2,
  emailId: string | null
): Promise<void> {
  const supabase = createUntypedAdminClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (emailNumber === 1) {
    updateData.recovery_email_1_sent_at = new Date().toISOString();
    updateData.recovery_email_1_id = emailId;
    // Mark as abandoned after first email
    updateData.status = "abandoned";
    updateData.abandoned_at = new Date().toISOString();
  } else {
    updateData.recovery_email_2_sent_at = new Date().toISOString();
    updateData.recovery_email_2_id = emailId;
  }

  const { error } = await supabase
    .from("abandoned_actions")
    .update(updateData)
    .eq("id", actionId);

  if (error) {
    console.error("Failed to update abandoned action after email:", error);
  }
}

function getIntegrationDisplayName(integrationType: string): string {
  const displayNames: Record<string, string> = {
    google: "Google Business Profile",
    zillow: "Zillow",
    facebook: "Facebook",
    linkedin: "LinkedIn",
    crm: "CRM",
    los: "LOS",
    slack: "Slack",
    teams: "Microsoft Teams",
  };

  return displayNames[integrationType] || integrationType;
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get abandoned action record for a user
 */
export async function getAbandonedAction(
  userId: string,
  actionType: AbandonedActionType
): Promise<AbandonedActionRecord | null> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("abandoned_actions")
    .select("*")
    .eq("user_id", userId)
    .eq("action_type", actionType)
    .in("status", ["started", "abandoned"])
    .single();

  if (error || !data) {
    return null;
  }

  return data as AbandonedActionRecord;
}

/**
 * Get all active abandoned actions for a user
 */
export async function getUserAbandonedActions(
  userId: string
): Promise<AbandonedActionRecord[]> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("abandoned_actions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["started", "abandoned"])
    .order("started_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as AbandonedActionRecord[];
}

/**
 * Get abandoned action statistics for an organization
 */
export async function getAbandonedActionStats(organizationId: string): Promise<{
  totalStarted: number;
  totalCompleted: number;
  totalRecovered: number;
  totalExpired: number;
  recoveryRate: number;
  byActionType: Record<
    AbandonedActionType,
    { started: number; completed: number; recovered: number }
  >;
}> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("abandoned_actions")
    .select("action_type, status")
    .eq("organization_id", organizationId);

  if (error || !data) {
    return {
      totalStarted: 0,
      totalCompleted: 0,
      totalRecovered: 0,
      totalExpired: 0,
      recoveryRate: 0,
      byActionType: {} as Record<
        AbandonedActionType,
        { started: number; completed: number; recovered: number }
      >,
    };
  }

  const stats = {
    totalStarted: 0,
    totalCompleted: 0,
    totalRecovered: 0,
    totalExpired: 0,
    recoveryRate: 0,
    byActionType: {} as Record<
      AbandonedActionType,
      { started: number; completed: number; recovered: number }
    >,
  };

  const actionTypes: AbandonedActionType[] = [
    "survey_creation",
    "survey_send",
    "video_request",
    "billing_upgrade",
    "profile_completion",
    "integration_setup",
  ];

  // Initialize byActionType
  for (const type of actionTypes) {
    stats.byActionType[type] = { started: 0, completed: 0, recovered: 0 };
  }

  // Count stats
  for (const action of data) {
    const actionType = action.action_type as AbandonedActionType;

    stats.totalStarted++;
    stats.byActionType[actionType].started++;

    if (action.status === "completed") {
      stats.totalCompleted++;
      stats.byActionType[actionType].completed++;
    } else if (action.status === "recovered") {
      stats.totalRecovered++;
      stats.byActionType[actionType].recovered++;
    } else if (action.status === "expired") {
      stats.totalExpired++;
    }
  }

  // Calculate recovery rate (completed + recovered) / total
  const successfulOutcomes = stats.totalCompleted + stats.totalRecovered;
  stats.recoveryRate =
    stats.totalStarted > 0
      ? Math.round((successfulOutcomes / stats.totalStarted) * 100)
      : 0;

  return stats;
}
