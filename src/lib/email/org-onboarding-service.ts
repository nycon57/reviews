"use server";

/**
 * Organization Onboarding Sequence Service
 *
 * Manages the 6-email onboarding sequence for organization admins:
 * - Starts sequence when organization is created
 * - Processes queue to send scheduled emails
 * - Handles conditional branching (skip billing if subscribed, skip integration if connected)
 * - Tracks org setup completion percentage
 * - Exits sequence when activation milestone reached (first survey sent)
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getFromAddress, emailConfig } from "./client";
import { getUnsubscribeUrl, sendWithReliability } from "./send-utils";
import {
  createEmailTypeSendResolver,
  type EmailTypeSendResolver,
} from "@/lib/email-ab-testing/overrides";
import type {
  EmailTemplate,
  OrgOnboarding1WelcomeEmailData,
  OrgOnboarding2BrandingEmailData,
  OrgOnboarding3TeamEmailData,
  OrgOnboarding4IntegrationsEmailData,
  OrgOnboarding5BillingEmailData,
  OrgOnboarding6AdvancedEmailData,
  OrgOnboardingStatus,
} from "./types";
import {
  getOrgOnboarding1WelcomeEmail,
  getOrgOnboarding2BrandingEmail,
  getOrgOnboarding3TeamEmail,
  getOrgOnboarding4IntegrationsEmail,
  getOrgOnboarding5BillingEmail,
  getOrgOnboarding6AdvancedEmail,
} from "./org-onboarding-templates";

// ============================================================================
// Types
// ============================================================================

interface OrgOnboardingSequenceConfig {
  totalSteps: 6;
  schedule: {
    step: number;
    delayDays: number;
    templateName: EmailTemplate;
    canSkip: boolean;
    skipCondition?: keyof OrgOnboardingStatus;
  }[];
  exitMilestone: keyof OrgOnboardingStatus;
}

interface OrgSequenceRecord {
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
  ab_test_assignments: Record<string, "A" | "B">;
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
    adminName: string;
    organizationName: string;
  };
  started_at: string;
  completed_at?: string;
}

interface QueueProcessResult {
  processed: number;
  failed: number;
  skipped: number;
  exited: number;
  errors: string[];
}

// ============================================================================
// Configuration
// ============================================================================

const ORG_ONBOARDING_SEQUENCE_CONFIG: OrgOnboardingSequenceConfig = {
  totalSteps: 6,
  schedule: [
    {
      step: 1,
      delayDays: 0, // Immediate
      templateName: "org_onboarding_1_welcome",
      canSkip: false,
    },
    {
      step: 2,
      delayDays: 1,
      templateName: "org_onboarding_2_branding",
      canSkip: true,
      skipCondition: "branding_configured",
    },
    {
      step: 3,
      delayDays: 2,
      templateName: "org_onboarding_3_team",
      canSkip: true,
      skipCondition: "team_invited",
    },
    {
      step: 4,
      delayDays: 4,
      templateName: "org_onboarding_4_integrations",
      canSkip: true,
      skipCondition: "google_connected",
    },
    {
      step: 5,
      delayDays: 6,
      templateName: "org_onboarding_5_billing",
      canSkip: true,
      skipCondition: "billing_setup",
    },
    {
      step: 6,
      delayDays: 10,
      templateName: "org_onboarding_6_advanced",
      canSkip: false,
    },
  ],
  exitMilestone: "first_survey_sent",
};

// ============================================================================
// Helper Functions
// ============================================================================

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calculate the next email time based on sequence start and step configuration.
 * Uses absolute delay from sequence start to prevent timing drift.
 */
function calculateNextEmailTime(
  sequenceStartedAt: string,
  nextStep: number
): Date | null {
  const nextStepConfig = ORG_ONBOARDING_SEQUENCE_CONFIG.schedule.find(
    (s) => s.step === nextStep
  );
  if (!nextStepConfig) return null;

  const sequenceStartTime = new Date(sequenceStartedAt);
  return addDays(sequenceStartTime, nextStepConfig.delayDays);
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
  abTestId?: string;
  abTestVariant?: string;
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
      ab_test_id: params.abTestId ?? null,
      ab_test_variant: params.abTestVariant ?? null,
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
 * Get organization onboarding status (branding, team, integrations, billing)
 */
async function getOrgOnboardingStatus(
  organizationId: string
): Promise<OrgOnboardingStatus | null> {
  const supabase = createAdminClient();

  // Get organization data
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .single();

  if (orgError || !org) {
    console.error("Failed to get organization:", orgError);
    return null;
  }

  // Check if branding is configured (logo or custom color set)
  const brandingConfigured = !!(org.logo_url || org.primary_color !== "#52796f");

  // Check if team has been invited (at least one non-admin user)
  const { count: teamCount, error: teamError } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .neq("role", "admin");

  if (teamError) {
    console.error("Failed to get team count:", teamError);
  }

  const teamInvited = (teamCount || 0) > 0;

  // Check if Google is connected (check google_connections table)
  const { data: googleConnection } = await supabase
    .from("google_connections")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .limit(1);

  const googleConnected = !!(googleConnection && googleConnection.length > 0);

  // Check if billing is set up (has active subscription)
  const billingSetup = org.subscription_status === "active";

  // Check if first survey has been sent
  const { data: surveys } = await supabase
    .from("surveys")
    .select("id")
    .eq("organization_id", organizationId)
    .in("status", ["sent", "opened", "completed"])
    .limit(1);

  const firstSurveySent = !!(surveys && surveys.length > 0);

  return {
    branding_configured: brandingConfigured,
    team_invited: teamInvited,
    google_connected: googleConnected,
    billing_setup: billingSetup,
    first_survey_sent: firstSurveySent,
  };
}

/**
 * Calculate org setup completion percentage
 */
function calculateSetupProgress(status: OrgOnboardingStatus): number {
  const items = [
    status.branding_configured,
    status.team_invited,
    status.google_connected,
    status.billing_setup,
    status.first_survey_sent,
  ];

  const completed = items.filter(Boolean).length;
  return Math.round((completed / items.length) * 100);
}

/**
 * Get team count for organization
 */
async function getTeamCount(organizationId: string): Promise<number> {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Failed to get team count:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Get trial days remaining
 */
async function getTrialDaysRemaining(
  organizationId: string
): Promise<{ trialEndsAt?: string; daysRemaining?: number }> {
  const supabase = createAdminClient();

  const { data: org, error } = await supabase
    .from("organizations")
    .select("trial_ends_at")
    .eq("id", organizationId)
    .single();

  if (error || !org?.trial_ends_at) {
    return {};
  }

  const trialEndsAt = new Date(org.trial_ends_at);
  const now = new Date();
  const daysRemaining = Math.max(
    0,
    Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    trialEndsAt: org.trial_ends_at,
    daysRemaining,
  };
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Start an org onboarding sequence for an organization admin
 */
export async function startOrgOnboardingSequence(
  organizationId: string,
  adminUserId: string
): Promise<{
  success: boolean;
  sequenceId?: string;
  error?: string;
}> {
  const supabase = createAdminClient();

  // Get admin user data
  const { data: user, error: userError } = await supabase
    .from("users")
    .select(
      `
      id,
      email,
      full_name,
      role,
      organization_id,
      receive_notifications,
      organizations!inner(name)
    `
    )
    .eq("id", adminUserId)
    .eq("organization_id", organizationId)
    .single();

  if (userError || !user) {
    return {
      success: false,
      error: `Admin user not found: ${userError?.message || "Unknown error"}`,
    };
  }

  // Verify user is admin
  if (user.role !== "admin") {
    return { success: false, error: "User must be an admin to receive org onboarding" };
  }

  // Check if user wants notifications
  if (user.receive_notifications === false) {
    return { success: false, error: "User has disabled notifications" };
  }

  // Check for existing active sequence (use user_id to match UNIQUE constraint on (user_id, sequence_type))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingSequence } = await (supabase.from as any)("email_sequences")
    .select("id")
    .eq("user_id", adminUserId)
    .eq("sequence_type", "onboarding")
    .in("status", ["active", "paused"])
    .single();

  if (existingSequence) {
    return {
      success: false,
      error: "Organization already has an active onboarding sequence",
    };
  }

  // Calculate first email send time (immediate for welcome)
  const now = new Date();

  // Create the sequence record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequence, error: insertError } = await (supabase.from as any)("email_sequences")
    .insert({
      user_id: adminUserId,
      organization_id: organizationId,
      sequence_type: "onboarding",
      status: "active",
      current_step: 0,
      total_steps: ORG_ONBOARDING_SEQUENCE_CONFIG.totalSteps,
      steps_completed: [],
      ab_test_assignments: {},
      skipped_steps: [],
      next_email_at: now.toISOString(),
      metadata: {
        adminName: user.full_name?.split(" ")[0] || "there",
        organizationName: (user.organizations as { name: string }).name,
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

  return { success: true, sequenceId: sequence.id };
}

/**
 * Process the org onboarding sequence queue
 * Called by cron job every 5 minutes
 */
export async function processOrgOnboardingSequenceQueue(
  batchSize: number = 50
): Promise<QueueProcessResult> {
  const supabase = createAdminClient();
  const result: QueueProcessResult = {
    processed: 0,
    failed: 0,
    skipped: 0,
    exited: 0,
    errors: [],
  };

  // Get sequences ready to send
  const now = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequences, error } = await (supabase.from as any)("email_sequences")
    .select("*")
    .eq("sequence_type", "onboarding")
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

  const emailTypeSendResolver = createEmailTypeSendResolver();

  // Process each sequence
  for (const sequence of sequences as OrgSequenceRecord[]) {
    try {
      const processResult = await processOrgSequenceStep(
        sequence,
        emailTypeSendResolver
      );

      if (processResult.success) {
        if (processResult.action === "sent") {
          result.processed++;
        } else if (processResult.action === "skipped") {
          result.skipped++;
        } else if (processResult.action === "exited") {
          result.exited++;
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
 * Process a single org onboarding sequence step
 */
async function processOrgSequenceStep(
  sequence: OrgSequenceRecord,
  emailTypeSendResolver: EmailTypeSendResolver
): Promise<{
  success: boolean;
  action?: "sent" | "skipped" | "exited" | "completed";
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
    await updateOrgSequenceStatus(sequence.id, "cancelled", "user_disabled_notifications");
    return { success: true, action: "exited" };
  }

  // Check if email is unsubscribed
  const unsubscribed = await isEmailUnsubscribed(user.email);
  if (unsubscribed) {
    await updateOrgSequenceStatus(sequence.id, "cancelled", "email_unsubscribed");
    return { success: true, action: "exited" };
  }

  // Get organization onboarding status
  const onboardingStatus = await getOrgOnboardingStatus(sequence.organization_id);
  if (!onboardingStatus) {
    return { success: false, error: "Failed to get org onboarding status" };
  }

  // Check for completion milestone (exit condition)
  if (onboardingStatus[ORG_ONBOARDING_SEQUENCE_CONFIG.exitMilestone]) {
    await updateOrgSequenceStatus(
      sequence.id,
      "exited",
      "activation_milestone_reached",
      ORG_ONBOARDING_SEQUENCE_CONFIG.exitMilestone
    );
    return { success: true, action: "exited" };
  }

  // Determine next step
  const nextStep = sequence.current_step + 1;

  if (nextStep > ORG_ONBOARDING_SEQUENCE_CONFIG.totalSteps) {
    // Sequence complete
    await updateOrgSequenceStatus(sequence.id, "completed");
    return { success: true, action: "completed" };
  }

  const stepConfig = ORG_ONBOARDING_SEQUENCE_CONFIG.schedule.find(
    (s) => s.step === nextStep
  );

  if (!stepConfig) {
    return { success: false, error: `Invalid step: ${nextStep}` };
  }

  // Check if step should be skipped
  if (stepConfig.canSkip && stepConfig.skipCondition && onboardingStatus) {
    const shouldSkip = onboardingStatus[stepConfig.skipCondition];

    if (shouldSkip) {
      // Skip this step and move to next
      await skipOrgSequenceStep(sequence, nextStep, stepConfig.skipCondition);

      // Recursively process next step
      const updatedSequence = {
        ...sequence,
        current_step: nextStep,
        skipped_steps: [
          ...sequence.skipped_steps,
          {
            step: nextStep,
            reason: stepConfig.skipCondition,
            skipped_at: new Date().toISOString(),
          },
        ],
      };

      return processOrgSequenceStep(updatedSequence, emailTypeSendResolver);
    }
  }

  // Send the email
  const sendResult = await sendOrgOnboardingEmail(
    sequence,
    user,
    stepConfig,
    onboardingStatus,
    emailTypeSendResolver
  );

  if (!sendResult.success) {
    return { success: false, error: sendResult.error };
  }

  // Update sequence after successful send
  await updateOrgSequenceAfterSend(
    sequence,
    nextStep,
    sendResult.emailId!,
    stepConfig.templateName
  );

  return { success: true, action: "sent" };
}

/**
 * Send an org onboarding email
 */
async function sendOrgOnboardingEmail(
  sequence: OrgSequenceRecord,
  user: { id: string; email: string; full_name: string | null },
  stepConfig: OrgOnboardingSequenceConfig["schedule"][number],
  onboardingStatus: OrgOnboardingStatus,
  emailTypeSendResolver: EmailTypeSendResolver
): Promise<{
  success: boolean;
  emailId?: string;
  error?: string;
}> {
  const baseUrl = emailConfig.baseUrl;
  // Use token-based unsubscribe URL for better privacy
  const unsubscribeUrl = await getUnsubscribeUrl(user.id, user.email);
  const dashboardUrl = `${baseUrl}/dashboard`;
  const setupProgress = calculateSetupProgress(onboardingStatus);

  const baseData = {
    toEmail: user.email,
    toName: user.full_name || undefined,
    adminName: sequence.metadata.adminName,
    organizationName: sequence.metadata.organizationName,
    dashboardUrl,
    sequenceId: sequence.id,
    unsubscribeUrl,
    organizationId: sequence.organization_id,
    setupProgress,
  };

  let emailContent: { subject: string; html: string };

  switch (stepConfig.step) {
    case 1: {
      const data: OrgOnboarding1WelcomeEmailData = {
        ...baseData,
        loginUrl: `${baseUrl}/login`,
        settingsUrl: `${baseUrl}/dashboard/settings`,
        helpCenterUrl: `${baseUrl}/help`,
      };
      emailContent = getOrgOnboarding1WelcomeEmail(data);
      break;
    }

    case 2: {
      const data: OrgOnboarding2BrandingEmailData = {
        ...baseData,
        brandingUrl: `${baseUrl}/dashboard/settings/branding`,
        surveyPreviewUrl: `${baseUrl}/dashboard/surveys/preview`,
        hasLogo: onboardingStatus.branding_configured,
        hasCustomColor: onboardingStatus.branding_configured,
      };
      emailContent = getOrgOnboarding2BrandingEmail(data);
      break;
    }

    case 3: {
      const teamCount = await getTeamCount(sequence.organization_id);
      const data: OrgOnboarding3TeamEmailData = {
        ...baseData,
        teamUrl: `${baseUrl}/dashboard/settings/team`,
        inviteUrl: `${baseUrl}/dashboard/settings/team/invite`,
        teamCount,
      };
      emailContent = getOrgOnboarding3TeamEmail(data);
      break;
    }

    case 4: {
      const data: OrgOnboarding4IntegrationsEmailData = {
        ...baseData,
        integrationsUrl: `${baseUrl}/dashboard/organization?tab=integrations`,
        googleConnectUrl: `${baseUrl}/dashboard/organization?tab=integrations`,
        hasGoogleConnected: onboardingStatus.google_connected,
      };
      emailContent = getOrgOnboarding4IntegrationsEmail(data);
      break;
    }

    case 5: {
      const trialInfo = await getTrialDaysRemaining(sequence.organization_id);
      const supabase = createAdminClient();
      const { data: org } = await supabase
        .from("organizations")
        .select("subscription_tier")
        .eq("id", sequence.organization_id)
        .single();

      const data: OrgOnboarding5BillingEmailData = {
        ...baseData,
        billingUrl: `${baseUrl}/dashboard/organization?tab=billing`,
        pricingUrl: `${baseUrl}/pricing`,
        currentPlan: org?.subscription_tier || "Free Trial",
        trialEndsAt: trialInfo.trialEndsAt,
        daysRemaining: trialInfo.daysRemaining,
      };
      emailContent = getOrgOnboarding5BillingEmail(data);
      break;
    }

    case 6: {
      const data: OrgOnboarding6AdvancedEmailData = {
        ...baseData,
        leaderboardsUrl: `${baseUrl}/dashboard/analytics/leaderboard`,
        reportsUrl: `${baseUrl}/dashboard/reports`,
        automationUrl: `${baseUrl}/dashboard/settings`,
        analyticsUrl: `${baseUrl}/dashboard/analytics`,
      };
      emailContent = getOrgOnboarding6AdvancedEmail(data);
      break;
    }

    default:
      return { success: false, error: `Unknown step: ${stepConfig.step}` };
  }

  try {
    const result = await sendWithReliability({
      from: getFromAddress(),
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      idempotencyKey: `org-onboarding-sequence-${sequence.id}-step-${stepConfig.step}`,
      userId: user.id,
      isTransactional: true,
      organizationId: sequence.organization_id,
      emailType: stepConfig.templateName,
      emailTypeSendResolver,
      tags: [
        { name: "template", value: stepConfig.templateName },
        { name: "sequence_id", value: sequence.id },
        { name: "sequence_step", value: String(stepConfig.step) },
        { name: "sequence_type", value: "org_onboarding" },
        ...(sequence.organization_id
          ? [{ name: "organization_id", value: sequence.organization_id }]
          : []),
      ],
    });

    if (!result.success) {
      await logEmail({
        toEmail: user.email,
        toName: user.full_name || undefined,
        fromEmail: emailConfig.defaultFromEmail,
        subject: result.effectiveSubject ?? emailContent.subject,
        templateName: stepConfig.templateName,
        organizationId: sequence.organization_id,
        userId: user.id,
        status: "failed",
        errorMessage: result.error,
        abTestId: result.abTestId,
        abTestVariant: result.abTestVariant,
      });

      return { success: false, error: result.error };
    }

    const emailId = await logEmail({
      toEmail: user.email,
      toName: user.full_name || undefined,
      fromEmail: emailConfig.defaultFromEmail,
      subject: result.effectiveSubject ?? emailContent.subject,
      templateName: stepConfig.templateName,
      organizationId: sequence.organization_id,
      userId: user.id,
      resendMessageId: result.messageId,
      status: "sent",
      abTestId: result.abTestId,
      abTestVariant: result.abTestVariant,
    });

    return { success: true, emailId: emailId || result.messageId };
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
 * Update sequence status
 */
async function updateOrgSequenceStatus(
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
 * Skip a sequence step
 */
async function skipOrgSequenceStep(
  sequence: OrgSequenceRecord,
  step: number,
  reason: string
): Promise<void> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const skippedSteps = [
    ...sequence.skipped_steps,
    { step, reason, skipped_at: now },
  ];

  const nextEmailAt = calculateNextEmailTime(sequence.started_at, step + 1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("email_sequences")
    .update({
      current_step: step,
      skipped_steps: skippedSteps,
      next_email_at: nextEmailAt?.toISOString(),
      updated_at: now,
    })
    .eq("id", sequence.id);

  if (error) {
    console.error("Failed to skip sequence step:", error);
  }
}

/**
 * Update sequence after successful email send
 */
async function updateOrgSequenceAfterSend(
  sequence: OrgSequenceRecord,
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

  const isComplete = step >= ORG_ONBOARDING_SEQUENCE_CONFIG.totalSteps;
  const nextEmailAt = calculateNextEmailTime(sequence.started_at, step + 1);

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
 * Pause an org onboarding sequence
 */
export async function pauseOrgOnboardingSequence(
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
 * Resume a paused org onboarding sequence
 */
export async function resumeOrgOnboardingSequence(
  sequenceId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("email_sequences")
    .update({
      status: "active",
      next_email_at: new Date().toISOString(), // Send next email soon
      updated_at: new Date().toISOString(),
    })
    .eq("id", sequenceId)
    .eq("status", "paused");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get org onboarding sequence status for an organization
 */
export async function getOrgOnboardingSequenceStatus(organizationId: string): Promise<{
  hasSequence: boolean;
  sequence?: OrgSequenceRecord;
}> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequence, error } = await (supabase.from as any)("email_sequences")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("sequence_type", "onboarding")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !sequence) {
    return { hasSequence: false };
  }

  return { hasSequence: true, sequence: sequence as OrgSequenceRecord };
}

/**
 * Get org setup completion percentage
 */
export async function getOrgSetupProgress(organizationId: string): Promise<{
  percent: number;
  status: OrgOnboardingStatus;
} | null> {
  const status = await getOrgOnboardingStatus(organizationId);
  if (!status) return null;

  return {
    percent: calculateSetupProgress(status),
    status,
  };
}
