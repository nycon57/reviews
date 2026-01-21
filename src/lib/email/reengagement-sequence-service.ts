"use server";

/**
 * Re-engagement Sequence Service
 *
 * Manages the 4-email re-engagement sequence for inactive users:
 * - Detects users who haven't logged in for 7, 14, 30, 45 days
 * - Sends personalized win-back emails
 * - Exits sequence when user logs back in
 * - Different messaging for paid vs free users
 * - Includes metrics they're missing (reviews received while away)
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, getFromAddress, emailConfig } from "./client";
import type {
  EmailTemplate,
  Reengagement1MissYouEmailData,
  Reengagement2WhatsNewEmailData,
  Reengagement3LastChanceEmailData,
  Reengagement4FinalEmailData,
} from "./types";
import {
  getReengagement1MissYouEmail,
  getReengagement2WhatsNewEmail,
  getReengagement3LastChanceEmail,
  getReengagement4FinalEmail,
} from "./reengagement-templates";

// ============================================================================
// Types
// ============================================================================

interface ReengagementSequenceConfig {
  totalSteps: 4;
  schedule: {
    step: number;
    daysInactive: number;
    templateName: EmailTemplate;
  }[];
  exitOnLogin: true;
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
    template?: string; // Optional for backwards compatibility with existing records
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
    isPaidUser: boolean;
    lastActiveAt: string;
    sequenceStartedAt: string;
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

interface DetectionResult {
  newSequencesStarted: number;
  alreadyInSequence: number;
  errors: string[];
}

// ============================================================================
// Configuration
// ============================================================================

const REENGAGEMENT_SEQUENCE_CONFIG: ReengagementSequenceConfig = {
  totalSteps: 4,
  schedule: [
    {
      step: 1,
      daysInactive: 7,
      templateName: "reengagement_1_miss_you",
    },
    {
      step: 2,
      daysInactive: 14,
      templateName: "reengagement_2_whats_new",
    },
    {
      step: 3,
      daysInactive: 30,
      templateName: "reengagement_3_last_chance",
    },
    {
      step: 4,
      daysInactive: 45,
      templateName: "reengagement_4_final",
    },
  ],
  exitOnLogin: true,
};

// Default features to highlight in "What's New" email
const DEFAULT_NEW_FEATURES = [
  {
    title: "AI-Powered Response Suggestions",
    description: "Get smart response suggestions for your reviews with one click",
    icon: "🤖",
  },
  {
    title: "Video Testimonials",
    description: "Collect and showcase authentic video reviews from your clients",
    icon: "🎬",
  },
  {
    title: "Weekly Performance Reports",
    description: "Stay on top of your reputation with automated weekly summaries",
    icon: "📊",
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
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

async function getMissedReviewsCount(
  userId: string,
  sinceDate: string
): Promise<number> {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("loan_officer_id", userId)
    .gte("created_at", sinceDate);

  if (error) {
    console.error("Failed to get missed reviews count:", error);
    return 0;
  }

  return count || 0;
}

async function getUserMetrics(userId: string): Promise<{
  totalReviews?: number;
  averageRating?: number;
  pendingResponses?: number;
}> {
  const supabase = createAdminClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("total_reviews, average_rating")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return {};
  }

  // Get pending response count
  const { count: pendingCount } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("loan_officer_id", userId)
    .is("response", null)
    .gte("rating", 1);

  return {
    totalReviews: user.total_reviews || undefined,
    averageRating: user.average_rating || undefined,
    pendingResponses: pendingCount || undefined,
  };
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Detect inactive users and start re-engagement sequences
 * Called by cron job daily
 */
export async function detectInactiveUsersAndStartSequences(): Promise<DetectionResult> {
  const supabase = createAdminClient();
  const result: DetectionResult = {
    newSequencesStarted: 0,
    alreadyInSequence: 0,
    errors: [],
  };

  const now = new Date();
  const sevenDaysAgo = addDays(now, -7);

  // Find users who haven't logged in for at least 7 days
  // and don't already have an active re-engagement sequence
  const { data: inactiveUsers, error } = await supabase
    .from("users")
    .select(`
      id,
      email,
      full_name,
      organization_id,
      last_login_at,
      receive_notifications,
      organizations!inner(name, subscription_status)
    `)
    .not("last_login_at", "is", null)
    .lte("last_login_at", sevenDaysAgo.toISOString())
    .eq("is_active", true)
    .eq("receive_notifications", true);

  if (error) {
    result.errors.push(`Failed to fetch inactive users: ${error.message}`);
    return result;
  }

  if (!inactiveUsers || inactiveUsers.length === 0) {
    return result;
  }

  // Process each inactive user
  for (const user of inactiveUsers) {
    try {
      // Check if user already has an active re-engagement sequence
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingSequence } = await (supabase.from as any)("email_sequences")
        .select("id")
        .eq("user_id", user.id)
        .eq("sequence_type", "re-engagement")
        .in("status", ["active", "paused"])
        .single();

      if (existingSequence) {
        result.alreadyInSequence++;
        continue;
      }

      // Check if email is unsubscribed
      const unsubscribed = await isEmailUnsubscribed(user.email);
      if (unsubscribed) {
        continue;
      }

      // Calculate days inactive
      const daysInactive = daysBetween(
        new Date(),
        new Date(user.last_login_at!)
      );

      // Only start sequence for users inactive 7+ days
      if (daysInactive < 7) {
        continue;
      }

      // Determine if paid user
      const org = user.organizations as { name: string; subscription_status: string };
      const isPaidUser = org.subscription_status === "active";

      // Start the re-engagement sequence
      const startResult = await startReengagementSequence(user.id, {
        firstName: user.full_name?.split(" ")[0] || "there",
        organizationName: org.name,
        isPaidUser,
        lastActiveAt: user.last_login_at!,
        daysInactive,
      });

      if (startResult.success) {
        result.newSequencesStarted++;
      } else {
        result.errors.push(`User ${user.id}: ${startResult.error}`);
      }
    } catch (err) {
      result.errors.push(
        `User ${user.id}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return result;
}

/**
 * Start a re-engagement sequence for a specific user
 */
export async function startReengagementSequence(
  userId: string,
  metadata: {
    firstName: string;
    organizationName: string;
    isPaidUser: boolean;
    lastActiveAt: string;
    daysInactive: number;
  }
): Promise<{
  success: boolean;
  sequenceId?: string;
  error?: string;
}> {
  const supabase = createAdminClient();

  // Get user data
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email, organization_id, receive_notifications")
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

  // Determine which step to start at based on days inactive
  let startStep = 1;
  for (const step of REENGAGEMENT_SEQUENCE_CONFIG.schedule) {
    if (metadata.daysInactive >= step.daysInactive) {
      startStep = step.step;
    }
  }

  // Calculate next email time (immediate for first email)
  const now = new Date();

  // Create the sequence record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequence, error: insertError } = await (supabase.from as any)("email_sequences")
    .insert({
      user_id: userId,
      organization_id: user.organization_id,
      sequence_type: "re-engagement",
      status: "active",
      current_step: startStep - 1, // Will be incremented when first email is sent
      total_steps: REENGAGEMENT_SEQUENCE_CONFIG.totalSteps,
      steps_completed: [],
      ab_test_assignments: {},
      skipped_steps: [],
      next_email_at: now.toISOString(),
      metadata: {
        ...metadata,
        sequenceStartedAt: now.toISOString(),
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
 * Process the re-engagement sequence queue
 * Called by cron job every 5 minutes
 * Uses optimistic locking to prevent duplicate email sends from concurrent runs
 */
export async function processReengagementSequenceQueue(
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
    .eq("sequence_type", "re-engagement")
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

  // OPTIMISTIC LOCKING: Immediately mark fetched sequences as "processing"
  // This prevents concurrent cron job instances from processing the same sequences
  const sequenceIds = (sequences as SequenceRecord[]).map(s => s.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lockedSequences, error: lockError } = await (supabase.from as any)("email_sequences")
    .update({
      status: "processing",
      updated_at: new Date().toISOString()
    })
    .in("id", sequenceIds)
    .eq("status", "active") // Only lock if still active (optimistic lock check)
    .select("id");

  if (lockError) {
    result.errors.push(`Failed to acquire lock: ${lockError.message}`);
    return result;
  }

  // Filter sequences to only process those we successfully locked
  const lockedIds = new Set((lockedSequences || []).map((s: { id: string }) => s.id));
  const sequencesToProcess = (sequences as SequenceRecord[]).filter(s => lockedIds.has(s.id));

  if (sequencesToProcess.length === 0) {
    // All sequences were already taken by another process
    return result;
  }

  // Process each sequence that we successfully locked
  for (const sequence of sequencesToProcess) {
    try {
      const processResult = await processSequenceStep(sequence);

      if (processResult.success) {
        if (processResult.action === "sent") {
          result.processed++;
          // Note: updateSequenceAfterSend already sets status back to "active" or "completed"
        } else if (processResult.action === "skipped") {
          result.skipped++;
          // Reset status back to "active" for skipped sequences (next_email_at already updated)
          await resetSequenceToActive(supabase, sequence.id);
        } else if (processResult.action === "exited" || processResult.action === "completed") {
          result.exited++;
          // No reset needed - status is already set to terminal state
        }
      } else {
        result.failed++;
        result.errors.push(
          `Sequence ${sequence.id}: ${processResult.error || "Unknown error"}`
        );
        // Reset status back to "active" so it can be retried
        await resetSequenceToActive(supabase, sequence.id);
      }
    } catch (err) {
      result.failed++;
      result.errors.push(
        `Sequence ${sequence.id}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      // Reset status back to "active" so it can be retried
      await resetSequenceToActive(supabase, sequence.id);
    }
  }

  return result;
}

/**
 * Helper to reset a sequence status back to "active" after processing lock
 */
async function resetSequenceToActive(supabase: ReturnType<typeof createAdminClient>, sequenceId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from as any)("email_sequences")
    .update({
      status: "active",
      updated_at: new Date().toISOString()
    })
    .eq("id", sequenceId)
    .eq("status", "processing"); // Only reset if still in processing state
}

/**
 * Process a single sequence step
 */
async function processSequenceStep(sequence: SequenceRecord): Promise<{
  success: boolean;
  action?: "sent" | "skipped" | "exited" | "completed";
  error?: string;
}> {
  const supabase = createAdminClient();

  // Get user data
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email, full_name, receive_notifications, last_login_at")
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

  // Check if user has logged back in since sequence started (EXIT CONDITION)
  const lastLoginAt = user.last_login_at ? new Date(user.last_login_at) : null;
  const sequenceStartedAt = new Date(sequence.metadata.sequenceStartedAt);

  if (lastLoginAt && lastLoginAt > sequenceStartedAt) {
    await updateSequenceStatus(sequence.id, "exited", "user_returned", "login_after_sequence_start");
    return { success: true, action: "exited" };
  }

  // Determine next step
  const nextStep = sequence.current_step + 1;

  if (nextStep > REENGAGEMENT_SEQUENCE_CONFIG.totalSteps) {
    // Sequence complete
    await updateSequenceStatus(sequence.id, "completed");
    return { success: true, action: "completed" };
  }

  const stepConfig = REENGAGEMENT_SEQUENCE_CONFIG.schedule.find(
    (s) => s.step === nextStep
  );

  if (!stepConfig) {
    return { success: false, error: `Invalid step: ${nextStep}` };
  }

  // Check if user has been inactive long enough for this step
  const daysInactive = daysBetween(
    new Date(),
    new Date(sequence.metadata.lastActiveAt)
  );

  if (daysInactive < stepConfig.daysInactive) {
    // Not time yet for this step, schedule for later
    const daysUntilStep = stepConfig.daysInactive - daysInactive;
    const nextEmailAt = addDays(new Date(), daysUntilStep);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from as any)("email_sequences")
      .update({
        next_email_at: nextEmailAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", sequence.id);

    return { success: true, action: "skipped" };
  }

  // Send the email
  const sendResult = await sendReengagementEmail(sequence, user, stepConfig);

  if (!sendResult.success) {
    return { success: false, error: sendResult.error };
  }

  // Update sequence after successful send
  await updateSequenceAfterSend(
    sequence,
    nextStep,
    sendResult.emailId!,
    stepConfig.templateName
  );

  return { success: true, action: "sent" };
}

/**
 * Send a re-engagement email
 */
async function sendReengagementEmail(
  sequence: SequenceRecord,
  user: { id: string; email: string; full_name: string | null },
  stepConfig: ReengagementSequenceConfig["schedule"][number]
): Promise<{
  success: boolean;
  emailId?: string;
  error?: string;
}> {
  const resend = getResendClient();
  const baseUrl = emailConfig.baseUrl;
  const unsubscribeUrl = `${baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(user.email)}`;
  const dashboardUrl = `${baseUrl}/dashboard`;
  const staySubscribedUrl = `${baseUrl}/api/email/stay-subscribed?email=${encodeURIComponent(user.email)}&sequence=${sequence.id}`;

  const daysInactive = daysBetween(
    new Date(),
    new Date(sequence.metadata.lastActiveAt)
  );

  // Get missed reviews count
  const missedReviewsCount = await getMissedReviewsCount(
    user.id,
    sequence.metadata.lastActiveAt
  );

  const baseData = {
    toEmail: user.email,
    toName: user.full_name || undefined,
    firstName: sequence.metadata.firstName,
    organizationName: sequence.metadata.organizationName,
    dashboardUrl,
    sequenceId: sequence.id,
    unsubscribeUrl,
    organizationId: sequence.organization_id,
    isPaidUser: sequence.metadata.isPaidUser,
    daysInactive,
    lastActiveDate: sequence.metadata.lastActiveAt,
  };

  let emailContent: { subject: string; html: string };

  switch (stepConfig.step) {
    case 1: {
      const data: Reengagement1MissYouEmailData = {
        ...baseData,
        valueReminder: sequence.metadata.isPaidUser
          ? "Your premium reputation dashboard and analytics are waiting"
          : "Your reviews dashboard is ready for you",
        quickActionUrl: dashboardUrl,
      };
      emailContent = getReengagement1MissYouEmail(data);
      break;
    }

    case 2: {
      const data: Reengagement2WhatsNewEmailData = {
        ...baseData,
        newFeatures: DEFAULT_NEW_FEATURES,
        missedReviewsCount,
        viewUpdatesUrl: `${baseUrl}/dashboard/whats-new`,
      };
      emailContent = getReengagement2WhatsNewEmail(data);
      break;
    }

    case 3: {
      const metrics = await getUserMetrics(user.id);
      const data: Reengagement3LastChanceEmailData = {
        ...baseData,
        missedReviewsCount,
        missedMetrics: metrics,
        incentiveMessage: sequence.metadata.isPaidUser
          ? "Your premium features are still available and waiting for you"
          : undefined,
        urgencyMessage: missedReviewsCount > 0
          ? `You have ${missedReviewsCount} review${missedReviewsCount === 1 ? "" : "s"} that could use your response. Your clients are waiting to hear from you.`
          : "Your online reputation needs attention. Come back and see how you're doing.",
      };
      emailContent = getReengagement3LastChanceEmail(data);
      break;
    }

    case 4: {
      const data: Reengagement4FinalEmailData = {
        ...baseData,
        missedReviewsCount,
        staySubscribedUrl,
        feedbackUrl: `${baseUrl}/feedback?source=reengagement`,
      };
      emailContent = getReengagement4FinalEmail(data);
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
        { name: "sequence_type", value: "re-engagement" },
        { name: "days_inactive", value: String(daysInactive) },
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
 * Update sequence after successful email send
 */
async function updateSequenceAfterSend(
  sequence: SequenceRecord,
  step: number,
  emailId: string,
  templateName: EmailTemplate
): Promise<void> {
  const supabase = createAdminClient();

  const stepsCompleted = [
    ...sequence.steps_completed,
    {
      step,
      email_id: emailId,
      sent_at: new Date().toISOString(),
      template: templateName,
    },
  ];

  // Calculate next email time based on next step's days inactive requirement
  const currentStepConfig = REENGAGEMENT_SEQUENCE_CONFIG.schedule.find(
    (s) => s.step === step
  );
  const nextStepConfig = REENGAGEMENT_SEQUENCE_CONFIG.schedule.find(
    (s) => s.step === step + 1
  );

  const isComplete = step >= REENGAGEMENT_SEQUENCE_CONFIG.totalSteps;

  let nextEmailAt: Date | null = null;
  if (nextStepConfig && currentStepConfig) {
    // Calculate days until next step based on user's last active date
    const daysUntilNextStep = nextStepConfig.daysInactive - currentStepConfig.daysInactive;
    nextEmailAt = addDays(new Date(), daysUntilNextStep);
  }

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
 * Exit all active re-engagement sequences for a user (called on login)
 */
export async function exitReengagementSequencesOnLogin(
  userId: string
): Promise<{ exitedCount: number; error?: string }> {
  const supabase = createAdminClient();

  // Find all active re-engagement sequences for this user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequences, error: fetchError } = await (supabase.from as any)("email_sequences")
    .select("id")
    .eq("user_id", userId)
    .eq("sequence_type", "re-engagement")
    .eq("status", "active");

  if (fetchError) {
    return { exitedCount: 0, error: fetchError.message };
  }

  if (!sequences || sequences.length === 0) {
    return { exitedCount: 0 };
  }

  // Update all sequences to exited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase.from as any)("email_sequences")
    .update({
      status: "exited",
      exit_reason: "user_returned",
      exit_milestone: "login",
      exited_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("sequence_type", "re-engagement")
    .eq("status", "active");

  if (updateError) {
    return { exitedCount: 0, error: updateError.message };
  }

  return { exitedCount: sequences.length };
}

/**
 * Get re-engagement sequence status for a user
 */
export async function getReengagementSequenceStatus(userId: string): Promise<{
  hasSequence: boolean;
  sequence?: SequenceRecord;
}> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequence, error } = await (supabase.from as any)("email_sequences")
    .select("*")
    .eq("user_id", userId)
    .eq("sequence_type", "re-engagement")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !sequence) {
    return { hasSequence: false };
  }

  return { hasSequence: true, sequence: sequence as SequenceRecord };
}
