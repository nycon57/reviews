"use server";

/**
 * Trial Ending Sequence Service
 *
 * Manages the 5-email conversion sequence for trial users approaching trial end:
 * - Starts sequence 7 days before trial ends
 * - Processes queue to send scheduled emails
 * - Handles A/B testing for urgency vs value messaging
 * - Tracks usage stats and generates personalized content
 * - Includes special offer capability for high-value prospects
 * - Exits sequence when user upgrades or trial fully expires
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, getFromAddress, emailConfig } from "./client";
import type {
  EmailTemplate,
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
import {
  getTrialEnding1AccomplishmentsEmail,
  getTrialEnding2FeatureComparisonEmail,
  getTrialEnding3FinalReminderEmail,
  getTrialEnding4GracePeriodEmail,
  getTrialEnding5WinbackEmail,
} from "./trial-ending-templates";

// ============================================================================
// Types
// ============================================================================

interface TrialEndingSequenceConfig {
  totalSteps: 5;
  schedule: {
    step: number;
    daysBeforeTrialEnd: number; // Negative = after trial ends
    templateName: EmailTemplate;
    canSkip: boolean;
    skipCondition?: "has_upgraded" | "has_cancelled";
  }[];
  exitCondition: "has_upgraded" | "trial_fully_expired";
  gracePeriodDays: number;
}

interface TrialSequenceRecord {
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
    variant?: string;
  }>;
  ab_test_assignments: Record<string, "A" | "B" | "urgency" | "value">;
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
    trialEndsAt: string;
    isHighValueProspect?: boolean;
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

const TRIAL_ENDING_SEQUENCE_CONFIG: TrialEndingSequenceConfig = {
  totalSteps: 5,
  schedule: [
    {
      step: 1,
      daysBeforeTrialEnd: 7,
      templateName: "trial_ending_1_accomplishments",
      canSkip: false,
    },
    {
      step: 2,
      daysBeforeTrialEnd: 3,
      templateName: "trial_ending_2_feature_comparison",
      canSkip: true,
      skipCondition: "has_upgraded",
    },
    {
      step: 3,
      daysBeforeTrialEnd: 1,
      templateName: "trial_ending_3_final_reminder",
      canSkip: true,
      skipCondition: "has_upgraded",
    },
    {
      step: 4,
      daysBeforeTrialEnd: 0, // Day of trial end
      templateName: "trial_ending_4_grace_period",
      canSkip: true,
      skipCondition: "has_upgraded",
    },
    {
      step: 5,
      daysBeforeTrialEnd: -3, // 3 days after trial end
      templateName: "trial_ending_5_winback",
      canSkip: true,
      skipCondition: "has_upgraded",
    },
  ],
  exitCondition: "has_upgraded",
  gracePeriodDays: 7,
};

// Feature comparison data
const FEATURE_COMPARISON_DATA: TrialFeatureComparison[] = [
  {
    featureName: "Review Collection",
    description: "Collect reviews via surveys and direct requests",
    includedInFree: true,
    includedInPaid: true,
    userHasUsed: false,
  },
  {
    featureName: "Review Dashboard",
    description: "View and manage all your reviews in one place",
    includedInFree: true,
    includedInPaid: true,
    userHasUsed: false,
  },
  {
    featureName: "Team Members",
    description: "Add unlimited team members",
    includedInFree: false,
    includedInPaid: true,
    userHasUsed: false,
  },
  {
    featureName: "Video Testimonials",
    description: "Request and manage video testimonials",
    includedInFree: false,
    includedInPaid: true,
    userHasUsed: false,
  },
  {
    featureName: "Google Business Integration",
    description: "Sync reviews with Google Business Profile",
    includedInFree: false,
    includedInPaid: true,
    userHasUsed: false,
  },
  {
    featureName: "Advanced Analytics",
    description: "Detailed insights and performance reports",
    includedInFree: false,
    includedInPaid: true,
    userHasUsed: false,
  },
  {
    featureName: "Leaderboards",
    description: "Team competition and gamification",
    includedInFree: false,
    includedInPaid: true,
    userHasUsed: false,
  },
  {
    featureName: "Custom Branding",
    description: "White-label surveys with your branding",
    includedInFree: false,
    includedInPaid: true,
    userHasUsed: false,
  },
];

// Default pricing info
const DEFAULT_PRICING: TrialPricingInfo = {
  planName: "Pro",
  monthlyPrice: 99,
  annualPrice: 948,
  annualDiscount: 20,
  features: [
    "Unlimited team members",
    "Video testimonials",
    "Google Business integration",
    "Advanced analytics & reports",
  ],
};

// ============================================================================
// Helper Functions
// ============================================================================

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function calculateNextEmailTime(
  trialEndsAt: string,
  nextStep: number
): Date | null {
  const nextStepConfig = TRIAL_ENDING_SEQUENCE_CONFIG.schedule.find(
    (s) => s.step === nextStep
  );
  if (!nextStepConfig) return null;

  const trialEndDate = new Date(trialEndsAt);
  return addDays(trialEndDate, -nextStepConfig.daysBeforeTrialEnd);
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
 * Get usage statistics for the trial period
 */
async function getTrialUsageStats(
  organizationId: string
): Promise<TrialUsageStats> {
  const supabase = createAdminClient();

  // Get review count and average rating
  const { data: reviews, error: reviewError } = await supabase
    .from("reviews")
    .select("rating")
    .eq("organization_id", organizationId);

  const totalReviews = reviews?.length || 0;
  const averageRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : null;

  if (reviewError) {
    console.error("Error fetching reviews:", reviewError);
  }

  // Get surveys sent
  const { count: surveysSent } = await supabase
    .from("surveys")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .in("status", ["sent", "opened", "completed"]);

  // Get survey response rate
  const { count: surveyResponses } = await supabase
    .from("survey_responses")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  const surveyResponseRate =
    surveysSent && surveysSent > 0
      ? Math.round(((surveyResponses || 0) / surveysSent) * 100)
      : 0;

  // Get video testimonials
  const { count: videoTestimonials } = await supabase
    .from("video_testimonial_responses")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  // Get team members
  const { count: teamMembers } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  // Check Google connection
  const { data: googleConnection } = await supabase
    .from("google_connections")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .limit(1);

  // Check custom branding
  const { data: org } = await supabase
    .from("organizations")
    .select("logo_url, primary_color")
    .eq("id", organizationId)
    .single();

  const customBrandingConfigured = !!(
    org?.logo_url || (org?.primary_color && org.primary_color !== "#52796f")
  );

  return {
    totalReviews,
    averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
    surveysSent: surveysSent || 0,
    surveyResponseRate,
    videoTestimonials: videoTestimonials || 0,
    teamMembersAdded: (teamMembers || 1) - 1, // Exclude the admin
    googleConnected: !!(googleConnection && googleConnection.length > 0),
    customBrandingConfigured,
  };
}

/**
 * Check if user has upgraded from trial
 */
async function hasUserUpgraded(organizationId: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("subscription_status, subscription_tier")
    .eq("id", organizationId)
    .single();

  return (
    org?.subscription_status === "active" &&
    org?.subscription_tier !== "free" &&
    org?.subscription_tier !== "trial"
  );
}

/**
 * Get trial information for an organization
 */
async function getTrialInfo(
  organizationId: string
): Promise<{
  trialEndsAt: string | null;
  daysRemaining: number;
  isInGracePeriod: boolean;
  gracePeriodEndsAt: string | null;
} | null> {
  const supabase = createAdminClient();

  const { data: org, error } = await supabase
    .from("organizations")
    .select("trial_ends_at, subscription_status")
    .eq("id", organizationId)
    .single();

  if (error || !org?.trial_ends_at) {
    return null;
  }

  const trialEndsAt = new Date(org.trial_ends_at);
  const now = new Date();
  const daysRemaining = Math.ceil(
    (trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Grace period is after trial ends
  const gracePeriodEndsAt = addDays(
    trialEndsAt,
    TRIAL_ENDING_SEQUENCE_CONFIG.gracePeriodDays
  );
  const isInGracePeriod = daysRemaining < 0 && now < gracePeriodEndsAt;

  return {
    trialEndsAt: org.trial_ends_at,
    daysRemaining,
    isInGracePeriod,
    gracePeriodEndsAt: isInGracePeriod
      ? gracePeriodEndsAt.toISOString()
      : null,
  };
}

/**
 * Determine if user is a high-value prospect based on usage
 */
function isHighValueProspect(stats: TrialUsageStats): boolean {
  // High value if they have significant engagement
  return (
    stats.totalReviews >= 5 ||
    stats.surveysSent >= 10 ||
    stats.videoTestimonials >= 1 ||
    stats.teamMembersAdded >= 2 ||
    stats.googleConnected
  );
}

/**
 * Generate a special offer for high-value prospects
 */
function generateSpecialOffer(
  isHighValue: boolean,
  daysSinceTrialEnd: number = 0
): TrialSpecialOffer | undefined {
  if (!isHighValue && daysSinceTrialEnd < 3) {
    return undefined;
  }

  // More generous offers for higher value / longer time since trial
  if (isHighValue) {
    return {
      offerType: "discount",
      discountPercent: 30,
      expiresAt: addDays(new Date(), 7).toISOString(),
      offerCode: "COMEBACK30",
    };
  }

  if (daysSinceTrialEnd >= 3) {
    return {
      offerType: "discount",
      discountPercent: 20,
      expiresAt: addDays(new Date(), 5).toISOString(),
      offerCode: "TRYAGAIN20",
    };
  }

  return undefined;
}

/**
 * Get feature comparison with user's actual usage
 */
async function getFeatureComparisonWithUsage(
  stats: TrialUsageStats
): Promise<TrialFeatureComparison[]> {
  return FEATURE_COMPARISON_DATA.map((feature) => {
    let userHasUsed = false;

    switch (feature.featureName) {
      case "Review Collection":
        userHasUsed = stats.totalReviews > 0 || stats.surveysSent > 0;
        break;
      case "Review Dashboard":
        userHasUsed = stats.totalReviews > 0;
        break;
      case "Team Members":
        userHasUsed = stats.teamMembersAdded > 0;
        break;
      case "Video Testimonials":
        userHasUsed = stats.videoTestimonials > 0;
        break;
      case "Google Business Integration":
        userHasUsed = stats.googleConnected;
        break;
      case "Custom Branding":
        userHasUsed = stats.customBrandingConfigured;
        break;
      default:
        userHasUsed = false;
    }

    return { ...feature, userHasUsed };
  });
}

/**
 * Assign A/B test variant for email 3
 */
function assignABTestVariant(): "urgency" | "value" {
  return Math.random() < 0.5 ? "urgency" : "value";
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Start a trial ending sequence for an organization
 */
export async function startTrialEndingSequence(
  organizationId: string,
  adminUserId: string
): Promise<{
  success: boolean;
  sequenceId?: string;
  error?: string;
}> {
  const supabase = createAdminClient();

  // Get admin user and org data
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
      organizations!inner(name, trial_ends_at, subscription_status)
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

  const org = user.organizations as {
    name: string;
    trial_ends_at: string | null;
    subscription_status: string;
  };

  // Verify user is admin
  if (user.role !== "admin") {
    return {
      success: false,
      error: "User must be an admin to receive trial ending sequence",
    };
  }

  // Check if organization is on trial
  if (!org.trial_ends_at) {
    return { success: false, error: "Organization is not on a trial" };
  }

  // Check if already upgraded
  if (org.subscription_status === "active") {
    return { success: false, error: "Organization has already upgraded" };
  }

  // Check if user wants notifications
  if (user.receive_notifications === false) {
    return { success: false, error: "User has disabled notifications" };
  }

  // Check for existing active sequence
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingSequence } = await (supabase.from as any)(
    "email_sequences"
  )
    .select("id")
    .eq("user_id", adminUserId)
    .eq("sequence_type", "trial_ending")
    .in("status", ["active", "paused"])
    .single();

  if (existingSequence) {
    return {
      success: false,
      error: "User already has an active trial ending sequence",
    };
  }

  // Calculate first email send time (7 days before trial end)
  const trialEndsAt = new Date(org.trial_ends_at);
  const firstEmailTime = addDays(trialEndsAt, -7);

  // Get usage stats to determine if high value
  const usageStats = await getTrialUsageStats(organizationId);
  const highValue = isHighValueProspect(usageStats);

  // Create the sequence record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequence, error: insertError } = await (supabase.from as any)(
    "email_sequences"
  )
    .insert({
      user_id: adminUserId,
      organization_id: organizationId,
      sequence_type: "trial_ending",
      status: "active",
      current_step: 0,
      total_steps: TRIAL_ENDING_SEQUENCE_CONFIG.totalSteps,
      steps_completed: [],
      ab_test_assignments: {
        email_3: assignABTestVariant(),
      },
      skipped_steps: [],
      next_email_at: firstEmailTime.toISOString(),
      metadata: {
        firstName: user.full_name?.split(" ")[0] || "there",
        organizationName: org.name,
        trialEndsAt: org.trial_ends_at,
        isHighValueProspect: highValue,
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
 * Process the trial ending sequence queue
 * Called by cron job every hour
 */
export async function processTrialEndingSequenceQueue(
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
  const { data: sequences, error } = await (supabase.from as any)(
    "email_sequences"
  )
    .select("*")
    .eq("sequence_type", "trial_ending")
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
  for (const sequence of sequences as TrialSequenceRecord[]) {
    try {
      const processResult = await processTrialSequenceStep(sequence);

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
 * Process a single trial ending sequence step
 */
async function processTrialSequenceStep(sequence: TrialSequenceRecord): Promise<{
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
    await updateTrialSequenceStatus(
      sequence.id,
      "cancelled",
      "user_disabled_notifications"
    );
    return { success: true, action: "exited" };
  }

  // Check if email is unsubscribed
  const unsubscribed = await isEmailUnsubscribed(user.email);
  if (unsubscribed) {
    await updateTrialSequenceStatus(
      sequence.id,
      "cancelled",
      "email_unsubscribed"
    );
    return { success: true, action: "exited" };
  }

  // Check if user has upgraded (exit condition)
  const upgraded = await hasUserUpgraded(sequence.organization_id);
  if (upgraded) {
    await updateTrialSequenceStatus(
      sequence.id,
      "exited",
      "user_upgraded",
      "has_upgraded"
    );
    return { success: true, action: "exited" };
  }

  // Get trial info
  const trialInfo = await getTrialInfo(sequence.organization_id);
  if (!trialInfo) {
    return { success: false, error: "Failed to get trial info" };
  }

  // Check if trial has fully expired (past grace period)
  const gracePeriodEnd = addDays(
    new Date(sequence.metadata.trialEndsAt),
    TRIAL_ENDING_SEQUENCE_CONFIG.gracePeriodDays
  );
  if (new Date() > gracePeriodEnd) {
    await updateTrialSequenceStatus(
      sequence.id,
      "completed",
      "trial_fully_expired"
    );
    return { success: true, action: "completed" };
  }

  // Determine next step
  const nextStep = sequence.current_step + 1;

  if (nextStep > TRIAL_ENDING_SEQUENCE_CONFIG.totalSteps) {
    // Sequence complete
    await updateTrialSequenceStatus(sequence.id, "completed");
    return { success: true, action: "completed" };
  }

  const stepConfig = TRIAL_ENDING_SEQUENCE_CONFIG.schedule.find(
    (s) => s.step === nextStep
  );

  if (!stepConfig) {
    return { success: false, error: `Invalid step: ${nextStep}` };
  }

  // Check if step should be skipped (user upgraded)
  if (stepConfig.canSkip && stepConfig.skipCondition === "has_upgraded") {
    if (upgraded) {
      await skipTrialSequenceStep(sequence, nextStep, "has_upgraded");

      // Recursively process next step
      const updatedSequence = {
        ...sequence,
        current_step: nextStep,
        skipped_steps: [
          ...sequence.skipped_steps,
          {
            step: nextStep,
            reason: "has_upgraded",
            skipped_at: new Date().toISOString(),
          },
        ],
      };

      return processTrialSequenceStep(updatedSequence);
    }
  }

  // Get usage stats
  const usageStats = await getTrialUsageStats(sequence.organization_id);

  // Send the email
  const sendResult = await sendTrialEndingEmail(
    sequence,
    user,
    stepConfig,
    trialInfo,
    usageStats
  );

  if (!sendResult.success) {
    return { success: false, error: sendResult.error };
  }

  // Update sequence after successful send
  await updateTrialSequenceAfterSend(
    sequence,
    nextStep,
    sendResult.emailId!,
    stepConfig.templateName,
    sendResult.variant
  );

  return { success: true, action: "sent" };
}

/**
 * Send a trial ending email
 */
async function sendTrialEndingEmail(
  sequence: TrialSequenceRecord,
  user: { id: string; email: string; full_name: string | null },
  stepConfig: TrialEndingSequenceConfig["schedule"][number],
  trialInfo: {
    trialEndsAt: string | null;
    daysRemaining: number;
    isInGracePeriod: boolean;
    gracePeriodEndsAt: string | null;
  },
  usageStats: TrialUsageStats
): Promise<{
  success: boolean;
  emailId?: string;
  error?: string;
  variant?: string;
}> {
  const resend = getResendClient();
  const baseUrl = emailConfig.baseUrl;
  const unsubscribeUrl = `${baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(user.email)}`;
  const dashboardUrl = `${baseUrl}/dashboard`;
  const upgradeUrl = `${baseUrl}/dashboard/settings/billing/upgrade`;
  const pricingUrl = `${baseUrl}/pricing`;

  const baseData = {
    toEmail: user.email,
    toName: user.full_name || undefined,
    firstName: sequence.metadata.firstName,
    organizationName: sequence.metadata.organizationName,
    dashboardUrl,
    sequenceId: sequence.id,
    unsubscribeUrl,
    organizationId: sequence.organization_id,
    trialEndsAt: sequence.metadata.trialEndsAt,
    daysRemaining: Math.max(0, trialInfo.daysRemaining),
    upgradeUrl,
    pricingUrl,
  };

  let emailContent: { subject: string; html: string };
  let variant: string | undefined;

  switch (stepConfig.step) {
    case 1: {
      const data: TrialEnding1AccomplishmentsEmailData = {
        ...baseData,
        usageStats,
        topAccomplishment:
          usageStats.totalReviews > 0
            ? `Collected ${usageStats.totalReviews} reviews with an average rating of ${usageStats.averageRating?.toFixed(1) || "N/A"}`
            : usageStats.surveysSent > 0
              ? `Sent ${usageStats.surveysSent} surveys to gather customer feedback`
              : undefined,
        roiEstimate:
          usageStats.totalReviews > 0
            ? {
                timeSaved: `${Math.round(usageStats.totalReviews * 5)} minutes`,
                reputationImpact: `+${usageStats.totalReviews} reviews added`,
              }
            : undefined,
      };
      emailContent = getTrialEnding1AccomplishmentsEmail(data);
      break;
    }

    case 2: {
      const featureComparison = await getFeatureComparisonWithUsage(usageStats);
      const featuresUsed = featureComparison.filter((f) => f.userHasUsed);
      const featuresAtRisk = featuresUsed
        .filter((f) => !f.includedInFree)
        .map((f) => f.featureName);

      const data: TrialEnding2FeatureComparisonEmailData = {
        ...baseData,
        featureComparison,
        featuresUsedCount: featuresUsed.length,
        featuresAtRisk,
        pricing: DEFAULT_PRICING,
      };
      emailContent = getTrialEnding2FeatureComparisonEmail(data);
      break;
    }

    case 3: {
      const messageVariant =
        sequence.ab_test_assignments.email_3 || assignABTestVariant();
      variant = messageVariant;

      const data: TrialEnding3FinalReminderEmailData = {
        ...baseData,
        usageStats,
        pricing: DEFAULT_PRICING,
        specialOffer: generateSpecialOffer(
          sequence.metadata.isHighValueProspect || false
        ),
        messageVariant: messageVariant as "urgency" | "value",
      };
      emailContent = getTrialEnding3FinalReminderEmail(data);
      break;
    }

    case 4: {
      const gracePeriodEndsAt = addDays(
        new Date(sequence.metadata.trialEndsAt),
        TRIAL_ENDING_SEQUENCE_CONFIG.gracePeriodDays
      ).toISOString();

      const data: TrialEnding4GracePeriodEmailData = {
        ...baseData,
        gracePeriodDays: TRIAL_ENDING_SEQUENCE_CONFIG.gracePeriodDays,
        gracePeriodEndsAt,
        usageStats,
        accountStatus: "grace_period",
        restrictedFeatures: [
          "Adding new team members",
          "Creating new survey templates",
          "Video testimonial requests",
        ],
      };
      emailContent = getTrialEnding4GracePeriodEmail(data);
      break;
    }

    case 5: {
      const daysSinceTrialEnded = Math.abs(trialInfo.daysRemaining);

      const data: TrialEnding5WinbackEmailData = {
        ...baseData,
        daysSinceTrialEnded,
        usageStats,
        specialOffer: generateSpecialOffer(
          sequence.metadata.isHighValueProspect || false,
          daysSinceTrialEnded
        ) || {
          offerType: "discount",
          discountPercent: 20,
          expiresAt: addDays(new Date(), 5).toISOString(),
          offerCode: "WINBACK20",
        },
        isHighValueProspect: sequence.metadata.isHighValueProspect || false,
        competitorMention: sequence.metadata.isHighValueProspect
          ? "RepWell offers the best value for mortgage review management. See how we compare to Experience.com and Birdeye."
          : undefined,
      };
      emailContent = getTrialEnding5WinbackEmail(data);
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
        { name: "sequence_type", value: "trial_ending" },
        ...(variant ? [{ name: "ab_variant", value: variant }] : []),
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

    return { success: true, emailId: emailId || response.data?.id, variant };
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
async function updateTrialSequenceStatus(
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
async function skipTrialSequenceStep(
  sequence: TrialSequenceRecord,
  step: number,
  reason: string
): Promise<void> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const skippedSteps = [
    ...sequence.skipped_steps,
    { step, reason, skipped_at: now },
  ];

  const nextEmailAt = calculateNextEmailTime(
    sequence.metadata.trialEndsAt,
    step + 1
  );

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
async function updateTrialSequenceAfterSend(
  sequence: TrialSequenceRecord,
  step: number,
  emailId: string,
  templateName: EmailTemplate,
  variant?: string
): Promise<void> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const stepsCompleted = [
    ...sequence.steps_completed,
    { step, email_id: emailId, sent_at: now, template: templateName, variant },
  ];

  const isComplete = step >= TRIAL_ENDING_SEQUENCE_CONFIG.totalSteps;
  const nextEmailAt = calculateNextEmailTime(
    sequence.metadata.trialEndsAt,
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
 * Pause a trial ending sequence
 */
export async function pauseTrialEndingSequence(
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
 * Resume a paused trial ending sequence
 */
export async function resumeTrialEndingSequence(
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
 * Get trial ending sequence status for an organization
 */
export async function getTrialEndingSequenceStatus(
  organizationId: string
): Promise<{
  hasSequence: boolean;
  sequence?: TrialSequenceRecord;
}> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequence, error } = await (supabase.from as any)(
    "email_sequences"
  )
    .select("*")
    .eq("organization_id", organizationId)
    .eq("sequence_type", "trial_ending")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !sequence) {
    return { hasSequence: false };
  }

  return { hasSequence: true, sequence: sequence as TrialSequenceRecord };
}

/**
 * Check and start trial ending sequences for organizations approaching trial end
 * Called by daily cron job
 */
export async function checkAndStartTrialEndingSequences(): Promise<{
  started: number;
  errors: string[];
}> {
  const supabase = createAdminClient();
  const result = { started: 0, errors: [] as string[] };

  // Find organizations with trial ending in 7 days that don't have a sequence
  const sevenDaysFromNow = addDays(new Date(), 7);
  const eightDaysFromNow = addDays(new Date(), 8);

  const { data: orgs, error } = await supabase
    .from("organizations")
    .select(
      `
      id,
      trial_ends_at,
      subscription_status,
      users!inner(id, role)
    `
    )
    .gte("trial_ends_at", sevenDaysFromNow.toISOString())
    .lt("trial_ends_at", eightDaysFromNow.toISOString())
    .eq("subscription_status", "trial")
    .eq("users.role", "admin");

  if (error) {
    result.errors.push(`Failed to fetch organizations: ${error.message}`);
    return result;
  }

  if (!orgs || orgs.length === 0) {
    return result;
  }

  for (const org of orgs) {
    // Check if sequence already exists
    const { hasSequence } = await getTrialEndingSequenceStatus(org.id);

    if (hasSequence) {
      continue;
    }

    // Get admin user
    const users = org.users as Array<{ id: string; role: string }>;
    const adminUser = users.find((u) => u.role === "admin");

    if (!adminUser) {
      result.errors.push(`No admin found for org ${org.id}`);
      continue;
    }

    // Start sequence
    const startResult = await startTrialEndingSequence(org.id, adminUser.id);

    if (startResult.success) {
      result.started++;
    } else {
      result.errors.push(`Org ${org.id}: ${startResult.error}`);
    }
  }

  return result;
}
