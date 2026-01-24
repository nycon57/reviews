"use server";

/**
 * Role-Based Feature Onboarding Sequence Service
 *
 * Manages feature discovery email sequences tailored to each role:
 * - Loan Officer: 7 emails over 30 days
 * - Manager: 6 emails over 30 days
 * - Admin: 5 emails over 30 days
 *
 * Features:
 * - Weekly pacing to avoid fatigue
 * - Skips emails for features already used
 * - Tracks sequence progress in email_sequences table
 * - Respects unsubscribe status
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, getFromAddress, emailConfig } from "./client";
import type { EmailTemplate, RoleOnboardingFeatureStatus } from "./types";
import {
  getRoleOnboardingLO1DashboardEmail,
  getRoleOnboardingLO2SurveysEmail,
  getRoleOnboardingLO3SharingEmail,
  getRoleOnboardingLO4RespondingEmail,
  getRoleOnboardingLO5VideoEmail,
  getRoleOnboardingLO6MobileEmail,
  getRoleOnboardingLO7GoogleEmail,
  getRoleOnboardingMgr1TeamDashboardEmail,
  getRoleOnboardingMgr2ApprovalsEmail,
  getRoleOnboardingMgr3LeaderboardsEmail,
  getRoleOnboardingMgr4ReportsEmail,
  getRoleOnboardingMgr5CoachingEmail,
  getRoleOnboardingMgr6AnalyticsEmail,
  getRoleOnboardingAdmin1SettingsEmail,
  getRoleOnboardingAdmin2UsersEmail,
  getRoleOnboardingAdmin3IntegrationsEmail,
  getRoleOnboardingAdmin4BillingEmail,
  getRoleOnboardingAdmin5ComplianceEmail,
} from "./role-onboarding-templates";

// ============================================================================
// Types
// ============================================================================

type UserRole = "admin" | "manager" | "user";

interface RoleSequenceConfig {
  totalSteps: number;
  schedule: {
    step: number;
    delayDays: number;
    templateName: EmailTemplate;
    canSkip: boolean;
    skipCondition?: keyof RoleOnboardingFeatureStatus;
  }[];
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
  }>;
  skipped_steps: Array<{
    step: number;
    reason: string;
    skipped_at: string;
  }>;
  next_email_at?: string;
  last_email_at?: string;
  metadata: {
    firstName: string;
    organizationName: string;
    role: UserRole;
  };
  started_at: string;
  completed_at?: string;
}

interface QueueProcessResult {
  processed: number;
  failed: number;
  skipped: number;
  completed: number;
  errors: string[];
}

// ============================================================================
// Configuration
// ============================================================================

// Loan Officer sequence: 7 emails over 30 days (weekly pacing)
const LOAN_OFFICER_SEQUENCE_CONFIG: RoleSequenceConfig = {
  totalSteps: 7,
  schedule: [
    {
      step: 1,
      delayDays: 0,
      templateName: "role_onboarding_lo_1_dashboard",
      canSkip: false,
    },
    {
      step: 2,
      delayDays: 7,
      templateName: "role_onboarding_lo_2_surveys",
      canSkip: true,
      skipCondition: "has_sent_survey",
    },
    {
      step: 3,
      delayDays: 14,
      templateName: "role_onboarding_lo_3_sharing",
      canSkip: true,
      skipCondition: "has_shared_review",
    },
    {
      step: 4,
      delayDays: 18,
      templateName: "role_onboarding_lo_4_responding",
      canSkip: true,
      skipCondition: "has_responded_to_review",
    },
    {
      step: 5,
      delayDays: 21,
      templateName: "role_onboarding_lo_5_video",
      canSkip: true,
      skipCondition: "has_requested_video",
    },
    {
      step: 6,
      delayDays: 25,
      templateName: "role_onboarding_lo_6_mobile",
      canSkip: true,
      skipCondition: "has_used_mobile",
    },
    {
      step: 7,
      delayDays: 30,
      templateName: "role_onboarding_lo_7_google",
      canSkip: true,
      skipCondition: "has_connected_google",
    },
  ],
};

// Manager sequence: 6 emails over 30 days
const MANAGER_SEQUENCE_CONFIG: RoleSequenceConfig = {
  totalSteps: 6,
  schedule: [
    {
      step: 1,
      delayDays: 0,
      templateName: "role_onboarding_mgr_1_team_dashboard",
      canSkip: false,
    },
    {
      step: 2,
      delayDays: 7,
      templateName: "role_onboarding_mgr_2_approvals",
      canSkip: true,
      skipCondition: "has_approved_review",
    },
    {
      step: 3,
      delayDays: 12,
      templateName: "role_onboarding_mgr_3_leaderboards",
      canSkip: true,
      skipCondition: "has_viewed_leaderboard",
    },
    {
      step: 4,
      delayDays: 18,
      templateName: "role_onboarding_mgr_4_reports",
      canSkip: true,
      skipCondition: "has_generated_report",
    },
    {
      step: 5,
      delayDays: 23,
      templateName: "role_onboarding_mgr_5_coaching",
      canSkip: false,
    },
    {
      step: 6,
      delayDays: 30,
      templateName: "role_onboarding_mgr_6_analytics",
      canSkip: true,
      skipCondition: "has_used_advanced_analytics",
    },
  ],
};

// Admin sequence: 5 emails over 30 days
const ADMIN_SEQUENCE_CONFIG: RoleSequenceConfig = {
  totalSteps: 5,
  schedule: [
    {
      step: 1,
      delayDays: 0,
      templateName: "role_onboarding_admin_1_settings",
      canSkip: false,
    },
    {
      step: 2,
      delayDays: 7,
      templateName: "role_onboarding_admin_2_users",
      canSkip: true,
      skipCondition: "has_invited_user",
    },
    {
      step: 3,
      delayDays: 14,
      templateName: "role_onboarding_admin_3_integrations",
      canSkip: true,
      skipCondition: "has_configured_integrations",
    },
    {
      step: 4,
      delayDays: 21,
      templateName: "role_onboarding_admin_4_billing",
      canSkip: true,
      skipCondition: "has_configured_billing",
    },
    {
      step: 5,
      delayDays: 30,
      templateName: "role_onboarding_admin_5_compliance",
      canSkip: false,
    },
  ],
};

function getSequenceConfig(role: UserRole): RoleSequenceConfig {
  switch (role) {
    case "user":
      return LOAN_OFFICER_SEQUENCE_CONFIG;
    case "manager":
      return MANAGER_SEQUENCE_CONFIG;
    case "admin":
      return ADMIN_SEQUENCE_CONFIG;
    default:
      return LOAN_OFFICER_SEQUENCE_CONFIG;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

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

async function getRoleOnboardingFeatureStatus(
  userId: string,
  role: UserRole
): Promise<RoleOnboardingFeatureStatus> {
  const supabase = createAdminClient();

  // Default status - all features unused
  const defaultStatus: RoleOnboardingFeatureStatus = {
    has_sent_survey: false,
    has_shared_review: false,
    has_responded_to_review: false,
    has_requested_video: false,
    has_used_mobile: false,
    has_connected_google: false,
    has_approved_review: false,
    has_viewed_leaderboard: false,
    has_generated_report: false,
    has_used_advanced_analytics: false,
    has_invited_user: false,
    has_configured_integrations: false,
    has_configured_billing: false,
  };

  // Get user's organization
  const { data: user } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", userId)
    .single();

  if (!user?.organization_id) {
    return defaultStatus;
  }

  // Check for sent surveys
  const { count: surveyCount } = await supabase
    .from("surveys")
    .select("id", { count: "exact", head: true })
    .eq("created_by", userId);

  defaultStatus.has_sent_survey = (surveyCount || 0) > 0;

  // Check for video requests
  const { count: videoCount } = await supabase
    .from("video_testimonial_requests")
    .select("id", { count: "exact", head: true })
    .eq("created_by", userId);

  defaultStatus.has_requested_video = (videoCount || 0) > 0;

  // Check for review responses
  const { count: responseCount } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", user.organization_id)
    .not("response_text", "is", null);

  defaultStatus.has_responded_to_review = (responseCount || 0) > 0;

  // Check Google connection for organization
  const { data: googleConnections } = await supabase
    .from("google_connections")
    .select("id")
    .eq("organization_id", user.organization_id)
    .eq("is_active", true)
    .limit(1);

  defaultStatus.has_connected_google = (googleConnections?.length || 0) > 0;

  // Manager-specific checks
  if (role === "manager") {
    // Check for approved reviews
    const { count: approvedCount } = await supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", user.organization_id)
      .eq("status", "approved");

    defaultStatus.has_approved_review = (approvedCount || 0) > 0;
  }

  // Admin-specific checks
  if (role === "admin") {
    // Check for invited users
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: inviteCount } = await (supabase as any)
      .from("organization_invitations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", user.organization_id);

    defaultStatus.has_invited_user = (inviteCount || 0) > 0;

    // Check for integrations (Google connections)
    const { count: integrationCount } = await supabase
      .from("google_connections")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", user.organization_id)
      .eq("is_active", true);

    defaultStatus.has_configured_integrations = (integrationCount || 0) > 0;

    // Check billing (assuming org has subscription)
    const { data: org } = await supabase
      .from("organizations")
      .select("subscription_status")
      .eq("id", user.organization_id)
      .single();

    defaultStatus.has_configured_billing = org?.subscription_status === "active";
  }

  return defaultStatus;
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Start a role-based feature onboarding sequence for a user
 */
export async function startRoleOnboardingSequence(userId: string): Promise<{
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

  // Validate role
  const role = user.role as UserRole;
  if (!["admin", "manager", "user"].includes(role)) {
    return { success: false, error: `Invalid role: ${role}` };
  }

  // Check for existing active sequence
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingSequence } = await (supabase.from as any)("email_sequences")
    .select("id")
    .eq("user_id", userId)
    .eq("sequence_type", "role_onboarding")
    .in("status", ["active", "paused"])
    .single();

  if (existingSequence) {
    return {
      success: false,
      error: "User already has an active role onboarding sequence",
    };
  }

  const config = getSequenceConfig(role);
  const now = new Date();

  // Create the sequence record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequence, error: insertError } = await (supabase.from as any)("email_sequences")
    .insert({
      user_id: userId,
      organization_id: user.organization_id,
      sequence_type: "role_onboarding",
      status: "active",
      current_step: 0,
      total_steps: config.totalSteps,
      steps_completed: [],
      skipped_steps: [],
      next_email_at: now.toISOString(),
      metadata: {
        firstName: user.full_name?.split(" ")[0] || "there",
        organizationName: (user.organizations as { name: string }).name,
        role: role,
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
 * Process the role onboarding sequence queue
 * Called by cron job (recommended: every hour)
 */
export async function processRoleOnboardingSequenceQueue(
  batchSize: number = 50
): Promise<QueueProcessResult> {
  const supabase = createAdminClient();
  const result: QueueProcessResult = {
    processed: 0,
    failed: 0,
    skipped: 0,
    completed: 0,
    errors: [],
  };

  // Get sequences ready to send
  const now = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequences, error } = await (supabase.from as any)("email_sequences")
    .select("*")
    .eq("sequence_type", "role_onboarding")
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
  for (const sequence of sequences as SequenceRecord[]) {
    try {
      const processResult = await processSequenceStep(sequence);

      if (processResult.success) {
        if (processResult.action === "sent") {
          result.processed++;
        } else if (processResult.action === "skipped") {
          result.skipped++;
        } else if (processResult.action === "completed") {
          result.completed++;
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
 * Process a single sequence step
 */
async function processSequenceStep(sequence: SequenceRecord): Promise<{
  success: boolean;
  action?: "sent" | "skipped" | "completed" | "cancelled";
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
    return { success: true, action: "cancelled" };
  }

  // Check if email is unsubscribed
  const unsubscribed = await isEmailUnsubscribed(user.email);
  if (unsubscribed) {
    await updateSequenceStatus(sequence.id, "cancelled", "email_unsubscribed");
    return { success: true, action: "cancelled" };
  }

  const config = getSequenceConfig(sequence.metadata.role);
  const nextStep = sequence.current_step + 1;

  if (nextStep > config.totalSteps) {
    // Sequence complete
    await updateSequenceStatus(sequence.id, "completed");
    return { success: true, action: "completed" };
  }

  const stepConfig = config.schedule.find((s) => s.step === nextStep);

  if (!stepConfig) {
    return { success: false, error: `Invalid step: ${nextStep}` };
  }

  // Check if step should be skipped based on feature usage
  if (stepConfig.canSkip && stepConfig.skipCondition) {
    const featureStatus = await getRoleOnboardingFeatureStatus(
      sequence.user_id,
      sequence.metadata.role
    );

    if (featureStatus[stepConfig.skipCondition]) {
      // Skip this step and schedule next
      await skipSequenceStep(sequence, nextStep, stepConfig.skipCondition, config);

      // Check if we need to process the next step immediately
      const nextNextStep = nextStep + 1;
      if (nextNextStep <= config.totalSteps) {
        // Continue processing recursively
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
        return processSequenceStep(updatedSequence);
      } else {
        // All steps completed or skipped
        await updateSequenceStatus(sequence.id, "completed");
        return { success: true, action: "completed" };
      }
    }
  }

  // Send the email
  const sendResult = await sendRoleOnboardingEmail(sequence, user, stepConfig, config);

  if (!sendResult.success) {
    return { success: false, error: sendResult.error };
  }

  // Update sequence after successful send
  await updateSequenceAfterSend(sequence, nextStep, sendResult.emailId!, config);

  return { success: true, action: "sent" };
}

/**
 * Send a role onboarding email
 */
async function sendRoleOnboardingEmail(
  sequence: SequenceRecord,
  user: { id: string; email: string; full_name: string | null },
  stepConfig: RoleSequenceConfig["schedule"][number],
  config: RoleSequenceConfig
): Promise<{
  success: boolean;
  emailId?: string;
  error?: string;
}> {
  const resend = getResendClient();
  const baseUrl = emailConfig.baseUrl;
  const unsubscribeUrl = `${baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(user.email)}`;
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
    currentStep: stepConfig.step,
    totalSteps: config.totalSteps,
  };

  let emailContent: { subject: string; html: string };

  // Generate email based on template
  switch (stepConfig.templateName) {
    // Loan Officer emails
    case "role_onboarding_lo_1_dashboard":
      emailContent = getRoleOnboardingLO1DashboardEmail({
        ...baseData,
        dashboardTourUrl: `${baseUrl}/dashboard?tour=true`,
        metricsUrl: `${baseUrl}/dashboard/analytics`,
      });
      break;

    case "role_onboarding_lo_2_surveys":
      emailContent = getRoleOnboardingLO2SurveysEmail({
        ...baseData,
        createSurveyUrl: `${baseUrl}/dashboard/surveys/new`,
        surveyTemplatesUrl: `${baseUrl}/dashboard/surveys/templates`,
        hasSentSurvey: false,
      });
      break;

    case "role_onboarding_lo_3_sharing":
      emailContent = getRoleOnboardingLO3SharingEmail({
        ...baseData,
        reviewsUrl: `${baseUrl}/dashboard/reviews`,
        shareSettingsUrl: `${baseUrl}/dashboard/settings/sharing`,
        testimonialsUrl: `${baseUrl}/dashboard/testimonials`,
        hasSharedReview: false,
      });
      break;

    case "role_onboarding_lo_4_responding":
      emailContent = getRoleOnboardingLO4RespondingEmail({
        ...baseData,
        reviewsUrl: `${baseUrl}/dashboard/reviews`,
        responseTemplatesUrl: `${baseUrl}/dashboard/settings/response-templates`,
        hasRespondedToReview: false,
      });
      break;

    case "role_onboarding_lo_5_video":
      emailContent = getRoleOnboardingLO5VideoEmail({
        ...baseData,
        videoRequestUrl: `${baseUrl}/dashboard/video-testimonials/request`,
        videoGalleryUrl: `${baseUrl}/dashboard/video-testimonials`,
        hasRequestedVideo: false,
      });
      break;

    case "role_onboarding_lo_6_mobile":
      emailContent = getRoleOnboardingLO6MobileEmail({
        ...baseData,
        appStoreUrl: "https://apps.apple.com/app/repwell",
        playStoreUrl: "https://play.google.com/store/apps/details?id=com.repwell.app",
        mobileGuideUrl: `${baseUrl}/help/mobile-app`,
        hasUsedMobile: false,
      });
      break;

    case "role_onboarding_lo_7_google":
      emailContent = getRoleOnboardingLO7GoogleEmail({
        ...baseData,
        googleConnectUrl: `${baseUrl}/dashboard/integrations/google`,
        googleReviewsUrl: `${baseUrl}/dashboard/reviews?source=google`,
        businessListingUrl: `${baseUrl}/dashboard/listings`,
        hasConnectedGoogle: false,
      });
      break;

    // Manager emails
    case "role_onboarding_mgr_1_team_dashboard":
      emailContent = getRoleOnboardingMgr1TeamDashboardEmail({
        ...baseData,
        teamDashboardUrl: `${baseUrl}/dashboard/team`,
        teamMembersUrl: `${baseUrl}/dashboard/settings/team`,
        teamSize: 0,
      });
      break;

    case "role_onboarding_mgr_2_approvals":
      emailContent = getRoleOnboardingMgr2ApprovalsEmail({
        ...baseData,
        approvalQueueUrl: `${baseUrl}/dashboard/reviews/pending`,
        approvalSettingsUrl: `${baseUrl}/dashboard/settings/approvals`,
        pendingApprovalCount: 0,
        hasApprovedReview: false,
      });
      break;

    case "role_onboarding_mgr_3_leaderboards":
      emailContent = getRoleOnboardingMgr3LeaderboardsEmail({
        ...baseData,
        leaderboardUrl: `${baseUrl}/dashboard/leaderboard`,
        gamificationSettingsUrl: `${baseUrl}/dashboard/settings/gamification`,
        hasViewedLeaderboard: false,
      });
      break;

    case "role_onboarding_mgr_4_reports":
      emailContent = getRoleOnboardingMgr4ReportsEmail({
        ...baseData,
        reportsUrl: `${baseUrl}/dashboard/reports`,
        scheduledReportsUrl: `${baseUrl}/dashboard/settings/scheduled-reports`,
        exportUrl: `${baseUrl}/dashboard/reports/export`,
        hasGeneratedReport: false,
      });
      break;

    case "role_onboarding_mgr_5_coaching":
      emailContent = getRoleOnboardingMgr5CoachingEmail({
        ...baseData,
        teamAnalyticsUrl: `${baseUrl}/dashboard/analytics/team`,
        performanceTipsUrl: `${baseUrl}/help/coaching-tips`,
      });
      break;

    case "role_onboarding_mgr_6_analytics":
      emailContent = getRoleOnboardingMgr6AnalyticsEmail({
        ...baseData,
        advancedAnalyticsUrl: `${baseUrl}/dashboard/analytics/advanced`,
        trendsUrl: `${baseUrl}/dashboard/analytics/trends`,
        benchmarksUrl: `${baseUrl}/dashboard/analytics/benchmarks`,
        hasUsedAdvancedAnalytics: false,
      });
      break;

    // Admin emails
    case "role_onboarding_admin_1_settings":
      emailContent = getRoleOnboardingAdmin1SettingsEmail({
        ...baseData,
        settingsUrl: `${baseUrl}/dashboard/settings`,
        brandingUrl: `${baseUrl}/dashboard/settings/branding`,
        notificationsUrl: `${baseUrl}/dashboard/settings/notifications`,
        setupProgress: 0,
      });
      break;

    case "role_onboarding_admin_2_users":
      emailContent = getRoleOnboardingAdmin2UsersEmail({
        ...baseData,
        usersUrl: `${baseUrl}/dashboard/settings/team`,
        inviteUrl: `${baseUrl}/dashboard/settings/team/invite`,
        rolesUrl: `${baseUrl}/dashboard/settings/roles`,
        teamCount: 0,
        hasInvitedUser: false,
      });
      break;

    case "role_onboarding_admin_3_integrations":
      emailContent = getRoleOnboardingAdmin3IntegrationsEmail({
        ...baseData,
        integrationsUrl: `${baseUrl}/dashboard/integrations`,
        googleConnectUrl: `${baseUrl}/dashboard/integrations/google`,
        crmConnectUrl: `${baseUrl}/dashboard/integrations/crm`,
        webhooksUrl: `${baseUrl}/dashboard/settings/webhooks`,
        connectedIntegrationsCount: 0,
      });
      break;

    case "role_onboarding_admin_4_billing":
      emailContent = getRoleOnboardingAdmin4BillingEmail({
        ...baseData,
        billingUrl: `${baseUrl}/dashboard/settings/billing`,
        plansUrl: `${baseUrl}/pricing`,
        invoicesUrl: `${baseUrl}/dashboard/settings/billing/invoices`,
        currentPlan: "Free Trial",
        billingConfigured: false,
      });
      break;

    case "role_onboarding_admin_5_compliance":
      emailContent = getRoleOnboardingAdmin5ComplianceEmail({
        ...baseData,
        auditLogUrl: `${baseUrl}/dashboard/settings/audit-log`,
        complianceSettingsUrl: `${baseUrl}/dashboard/settings/compliance`,
        dataExportUrl: `${baseUrl}/dashboard/settings/data-export`,
        securitySettingsUrl: `${baseUrl}/dashboard/settings/security`,
      });
      break;

    default:
      return { success: false, error: `Unknown template: ${stepConfig.templateName}` };
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
        { name: "role", value: sequence.metadata.role },
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
  exitReason?: string
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
  reason: string,
  config: RoleSequenceConfig
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

  // Calculate next email time
  const currentStepConfig = config.schedule.find((s) => s.step === step);
  const nextStepConfig = config.schedule.find((s) => s.step === step + 1);

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
  config: RoleSequenceConfig
): Promise<void> {
  const supabase = createAdminClient();

  const stepsCompleted = [
    ...sequence.steps_completed,
    {
      step,
      email_id: emailId,
      sent_at: new Date().toISOString(),
    },
  ];

  // Calculate next email time
  const currentStepConfig = config.schedule.find((s) => s.step === step);
  const nextStepConfig = config.schedule.find((s) => s.step === step + 1);

  const isComplete = step >= config.totalSteps;
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
 * Pause a role onboarding sequence
 */
export async function pauseRoleOnboardingSequence(
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
 * Resume a paused role onboarding sequence
 */
export async function resumeRoleOnboardingSequence(
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

/**
 * Get role onboarding sequence status for a user
 */
export async function getRoleOnboardingSequenceStatus(userId: string): Promise<{
  hasSequence: boolean;
  sequence?: SequenceRecord;
}> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequence, error } = await (supabase.from as any)("email_sequences")
    .select("*")
    .eq("user_id", userId)
    .eq("sequence_type", "role_onboarding")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !sequence) {
    return { hasSequence: false };
  }

  return { hasSequence: true, sequence: sequence as SequenceRecord };
}
