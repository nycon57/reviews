/**
 * Welcome Sequence Service
 *
 * Manages the 5-email welcome sequence for new users:
 * - Starts sequence on signup
 * - Processes queue to send scheduled emails
 * - Handles conditional branching (skip completed actions)
 * - Manages A/B test variant assignments
 * - Exits sequence when activation milestone reached
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
  Welcome1AccessEmailData,
  Welcome2ProfileEmailData,
  Welcome3FirstActionEmailData,
  Welcome4SocialProofEmailData,
  Welcome5MetricsEmailData,
} from "./types";
import {
  getWelcome1AccessEmail,
  getWelcome2ProfileEmail,
  getWelcome3FirstActionEmail,
  getWelcome4SocialProofEmail,
  getWelcome5MetricsEmail,
} from "./welcome-templates";

// ============================================================================
// Types
// ============================================================================

interface WelcomeSequenceConfig {
  totalSteps: 5;
  schedule: {
    step: number;
    delayDays: number;
    templateName: EmailTemplate;
    canSkip: boolean;
    skipCondition?: string;
  }[];
  exitMilestone: string;
}

interface SequenceRecord {
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
    /** Absent on rows written before the template name was recorded. */
    template?: string;
    variant?: string;
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
    firstName: string;
    organizationName: string;
    role: "admin" | "manager" | "user";
  };
  started_at: string;
  completed_at?: string;
}

interface UserOnboardingStatus {
  profile_completed: boolean;
  bio_added: boolean;
  phone_added: boolean;
  first_survey_sent: boolean;
  first_video_requested: boolean;
  first_review_received: boolean;
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

const WELCOME_SEQUENCE_CONFIG: WelcomeSequenceConfig = {
  totalSteps: 5,
  schedule: [
    {
      step: 1,
      delayDays: 0, // Immediate
      templateName: "welcome_1_access",
      canSkip: false,
    },
    {
      step: 2,
      delayDays: 1,
      templateName: "welcome_2_profile",
      canSkip: true,
      skipCondition: "profile_completed",
    },
    {
      step: 3,
      delayDays: 3,
      templateName: "welcome_3_first_action",
      canSkip: true,
      skipCondition: "first_survey_sent",
    },
    {
      step: 4,
      delayDays: 5,
      templateName: "welcome_4_social_proof",
      canSkip: false,
    },
    {
      step: 5,
      delayDays: 7,
      templateName: "welcome_5_metrics",
      canSkip: false,
    },
  ],
  exitMilestone: "first_survey_sent",
};

// Default success story for Email 4
const DEFAULT_SUCCESS_STORY = {
  companyName: "Horizon Mortgage",
  personName: "Sarah Chen",
  personTitle: "Branch Manager",
  quote:
    "RepWell transformed how we collect and showcase reviews. Our team went from struggling to get 2-3 reviews a month to consistently receiving 15-20 high-quality testimonials. The automated follow-ups do the heavy lifting.",
  metric: "600%",
  metricLabel: "increase in monthly reviews",
};

// ============================================================================
// Helper Functions
// ============================================================================

function assignABTestVariant(): "A" | "B" {
  return Math.random() < 0.5 ? "A" : "B";
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
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

async function getUserOnboardingStatus(userId: string): Promise<UserOnboardingStatus | null> {
  const supabase = createAdminClient();

  // Type assertion needed until types are regenerated after migration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("get_user_onboarding_status", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Failed to get user onboarding status:", error);
    return null;
  }

  return data as UserOnboardingStatus;
}

async function getUserProfileCompletionData(userId: string): Promise<{
  percent: number;
  missingFields: string[];
}> {
  const supabase = createAdminClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("full_name, photo_url, bio, phone, title")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return { percent: 0, missingFields: ["Profile data unavailable"] };
  }

  const fields = [
    { name: "Full name", value: user.full_name },
    { name: "Profile photo", value: user.photo_url },
    { name: "Bio", value: user.bio },
    { name: "Phone number", value: user.phone },
    { name: "Job title", value: user.title },
  ];

  const completedFields = fields.filter((f) => f.value && f.value.trim() !== "");
  const missingFields = fields.filter((f) => !f.value || f.value.trim() === "").map((f) => f.name);

  const percent = Math.round((completedFields.length / fields.length) * 100);

  return { percent, missingFields };
}

async function getUserMetrics(userId: string): Promise<{
  averageRating?: number;
  reviewCount?: number;
  npsScore?: number;
  responseRate?: number;
}> {
  const supabase = createAdminClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("average_rating, total_reviews, nps_score")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return {};
  }

  return {
    averageRating: user.average_rating || undefined,
    reviewCount: user.total_reviews || undefined,
    npsScore: user.nps_score || undefined,
  };
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Start a welcome sequence for a new user
 */
export async function startWelcomeSequence(userId: string): Promise<{
  success: boolean;
  sequenceId?: string;
  error?: string;
}> {
  const supabase = createAdminClient();

  // Get user data
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
    .eq("id", userId)
    .single();

  if (userError || !user) {
    return {
      success: false,
      error: `User not found: ${userError?.message || "Unknown error"}`,
    };
  }

  // Check if user wants notifications
  if (user.receive_notifications === false) {
    return { success: false, error: "User has disabled notifications" };
  }

  // Check for existing active sequence
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingSequence } = await (supabase.from as any)("email_sequences")
    .select("id")
    .eq("user_id", userId)
    .eq("sequence_type", "welcome")
    .in("status", ["active", "paused"])
    .single();

  if (existingSequence) {
    return {
      success: false,
      error: "User already has an active welcome sequence",
    };
  }

  // Assign A/B test variants for emails 1 and 3
  const abTestAssignments: Record<string, "A" | "B"> = {
    email_1: assignABTestVariant(),
    email_3: assignABTestVariant(),
  };

  // Calculate first email send time (immediate for welcome)
  const now = new Date();

  // Create the sequence record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequence, error: insertError } = await (supabase.from as any)("email_sequences")
    .insert({
      user_id: userId,
      organization_id: user.organization_id,
      sequence_type: "welcome",
      status: "active",
      current_step: 0,
      total_steps: WELCOME_SEQUENCE_CONFIG.totalSteps,
      steps_completed: [],
      ab_test_assignments: abTestAssignments,
      skipped_steps: [],
      next_email_at: now.toISOString(),
      metadata: {
        firstName: user.full_name?.split(" ")[0] || "there",
        organizationName: (user.organizations as { name: string }).name,
        role: user.role,
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
 * Process the welcome sequence queue
 * Called by cron job every 5 minutes
 */
export async function processWelcomeSequenceQueue(
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
    .eq("sequence_type", "welcome")
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
  for (const sequence of sequences as SequenceRecord[]) {
    try {
      const processResult = await processSequenceStep(sequence, emailTypeSendResolver);

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
        result.errors.push(`Sequence ${sequence.id}: ${processResult.error || "Unknown error"}`);
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
 * Process a single sequence step
 */
async function processSequenceStep(
  sequence: SequenceRecord,
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
    await updateSequenceStatus(sequence.id, "cancelled", "user_disabled_notifications");
    return { success: true, action: "exited" };
  }

  // Check if email is unsubscribed
  const unsubscribed = await isEmailUnsubscribed(user.email);
  if (unsubscribed) {
    await updateSequenceStatus(sequence.id, "cancelled", "email_unsubscribed");
    return { success: true, action: "exited" };
  }

  // Check for activation milestone (exit condition)
  const onboardingStatus = await getUserOnboardingStatus(sequence.user_id);
  if (
    onboardingStatus &&
    onboardingStatus[WELCOME_SEQUENCE_CONFIG.exitMilestone as keyof UserOnboardingStatus]
  ) {
    await updateSequenceStatus(
      sequence.id,
      "exited",
      "activation_milestone_reached",
      WELCOME_SEQUENCE_CONFIG.exitMilestone
    );
    return { success: true, action: "exited" };
  }

  // Determine next step
  const nextStep = sequence.current_step + 1;

  if (nextStep > WELCOME_SEQUENCE_CONFIG.totalSteps) {
    // Sequence complete
    await updateSequenceStatus(sequence.id, "completed");
    return { success: true, action: "completed" };
  }

  const stepConfig = WELCOME_SEQUENCE_CONFIG.schedule.find((s) => s.step === nextStep);

  if (!stepConfig) {
    return { success: false, error: `Invalid step: ${nextStep}` };
  }

  // Check if step should be skipped
  if (stepConfig.canSkip && stepConfig.skipCondition && onboardingStatus) {
    const shouldSkip = onboardingStatus[stepConfig.skipCondition as keyof UserOnboardingStatus];

    if (shouldSkip) {
      // Skip this step and move to next
      await skipSequenceStep(sequence, nextStep, stepConfig.skipCondition);

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

      return processSequenceStep(updatedSequence, emailTypeSendResolver);
    }
  }

  // Send the email
  const sendResult = await sendWelcomeEmail(sequence, user, stepConfig, emailTypeSendResolver);

  if (!sendResult.success) {
    return { success: false, error: sendResult.error };
  }

  // Update sequence after successful send
  await updateSequenceAfterSend(
    sequence,
    nextStep,
    sendResult.emailId!,
    stepConfig.templateName,
    sendResult.variant
  );

  return { success: true, action: "sent" };
}

/**
 * Send a welcome email
 */
async function sendWelcomeEmail(
  sequence: SequenceRecord,
  user: { id: string; email: string; full_name: string | null },
  stepConfig: WelcomeSequenceConfig["schedule"][number],
  emailTypeSendResolver: EmailTypeSendResolver
): Promise<{
  success: boolean;
  emailId?: string;
  variant?: string;
  error?: string;
}> {
  const baseUrl = emailConfig.baseUrl;
  // Use token-based unsubscribe URL for better privacy
  const unsubscribeUrl = await getUnsubscribeUrl(user.id, user.email);
  const dashboardUrl = `${baseUrl}/dashboard`;

  const baseData = {
    toEmail: user.email,
    toName: user.full_name || undefined,
    firstName: sequence.metadata.firstName,
    organizationName: sequence.metadata.organizationName,
    role: sequence.metadata.role,
    dashboardUrl,
    sequenceId: sequence.id,
    unsubscribeUrl,
    organizationId: sequence.organization_id,
  };

  let emailContent: { subject: string; html: string };
  let variant: string | undefined;

  switch (stepConfig.step) {
    case 1: {
      variant = sequence.ab_test_assignments.email_1;
      const data: Welcome1AccessEmailData = {
        ...baseData,
        loginUrl: `${baseUrl}/login`,
        settingsUrl: `${baseUrl}/dashboard/settings`,
      };
      emailContent = getWelcome1AccessEmail(data, variant as "A" | "B");
      break;
    }

    case 2: {
      const profileData = await getUserProfileCompletionData(user.id);
      const data: Welcome2ProfileEmailData = {
        ...baseData,
        profileUrl: `${baseUrl}/dashboard/settings/profile`,
        profileCompletionPercent: profileData.percent,
        missingFields: profileData.missingFields,
      };
      emailContent = getWelcome2ProfileEmail(data);
      break;
    }

    case 3: {
      variant = sequence.ab_test_assignments.email_3;
      const data: Welcome3FirstActionEmailData = {
        ...baseData,
        createSurveyUrl: `${baseUrl}/dashboard/surveys/new`,
        requestVideoUrl: `${baseUrl}/dashboard/video-testimonials/request`,
        hasCompletedAction: false,
      };
      emailContent = getWelcome3FirstActionEmail(data, variant as "A" | "B");
      break;
    }

    case 4: {
      const data: Welcome4SocialProofEmailData = {
        ...baseData,
        successStory: DEFAULT_SUCCESS_STORY,
        viewMoreStoriesUrl: `${baseUrl}/customers`,
      };
      emailContent = getWelcome4SocialProofEmail(data);
      break;
    }

    case 5: {
      const metrics = await getUserMetrics(user.id);
      const data: Welcome5MetricsEmailData = {
        ...baseData,
        sampleMetrics: metrics,
        analyticsUrl: `${baseUrl}/dashboard/analytics`,
        upgradeUrl: `${baseUrl}/dashboard/organization?tab=billing`,
      };
      emailContent = getWelcome5MetricsEmail(data);
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
      idempotencyKey: `welcome-sequence-${sequence.id}-step-${stepConfig.step}`,
      userId: user.id,
      isTransactional: true,
      organizationId: sequence.organization_id,
      emailType: stepConfig.templateName,
      emailTypeSendResolver,
      tags: [
        { name: "template", value: stepConfig.templateName },
        { name: "sequence_id", value: sequence.id },
        { name: "sequence_step", value: String(stepConfig.step) },
        ...(variant ? [{ name: "ab_variant", value: variant }] : []),
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

    return { success: true, emailId: emailId || result.messageId, variant };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

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
async function updateSequenceStatus(
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
async function skipSequenceStep(
  sequence: SequenceRecord,
  step: number,
  reason: string
): Promise<void> {
  const supabase = createAdminClient();

  const skippedSteps = [
    ...sequence.skipped_steps,
    {
      step,
      reason,
      skipped_at: new Date().toISOString(),
    },
  ];

  // Calculate next email time using relative delay between steps
  const currentStepConfig = WELCOME_SEQUENCE_CONFIG.schedule.find((s) => s.step === step);
  const nextStepConfig = WELCOME_SEQUENCE_CONFIG.schedule.find((s) => s.step === step + 1);

  // Calculate relative delay: next step's absolute delay minus current step's absolute delay
  const nextEmailAt =
    nextStepConfig && currentStepConfig
      ? addDays(new Date(), nextStepConfig.delayDays - currentStepConfig.delayDays)
      : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("email_sequences")
    .update({
      current_step: step,
      skipped_steps: skippedSteps,
      next_email_at: nextEmailAt?.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", sequence.id);

  if (error) {
    console.error("Failed to skip sequence step:", error);
  }
}

/**
 * Update sequence after successful email send
 */
async function updateSequenceAfterSend(
  sequence: SequenceRecord,
  step: number,
  emailId: string,
  templateName: EmailTemplate,
  variant?: string
): Promise<void> {
  const supabase = createAdminClient();

  const completedStep: (typeof sequence.steps_completed)[number] = {
    step,
    email_id: emailId,
    sent_at: new Date().toISOString(),
    template: templateName,
  };
  if (variant) {
    completedStep.variant = variant;
  }

  const stepsCompleted = [...sequence.steps_completed, completedStep];

  // Calculate next email time using relative delay between steps
  const currentStepConfig = WELCOME_SEQUENCE_CONFIG.schedule.find((s) => s.step === step);
  const nextStepConfig = WELCOME_SEQUENCE_CONFIG.schedule.find((s) => s.step === step + 1);

  const isComplete = step >= WELCOME_SEQUENCE_CONFIG.totalSteps;
  // Calculate relative delay: next step's absolute delay minus current step's absolute delay
  const nextEmailAt =
    nextStepConfig && currentStepConfig
      ? addDays(new Date(), nextStepConfig.delayDays - currentStepConfig.delayDays)
      : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("email_sequences")
    .update({
      current_step: step,
      steps_completed: stepsCompleted,
      last_email_at: new Date().toISOString(),
      next_email_at: nextEmailAt?.toISOString(),
      status: isComplete ? "completed" : "active",
      completed_at: isComplete ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sequence.id);

  if (error) {
    console.error("Failed to update sequence after send:", error);
  }
}

/**
 * Pause a welcome sequence
 */
export async function pauseWelcomeSequence(
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
 * Resume a paused welcome sequence
 */
export async function resumeWelcomeSequence(
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
 * Get welcome sequence status for a user
 */
export async function getWelcomeSequenceStatus(userId: string): Promise<{
  hasSequence: boolean;
  sequence?: SequenceRecord;
}> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequence, error } = await (supabase.from as any)("email_sequences")
    .select("*")
    .eq("user_id", userId)
    .eq("sequence_type", "welcome")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !sequence) {
    return { hasSequence: false };
  }

  return { hasSequence: true, sequence: sequence as SequenceRecord };
}
