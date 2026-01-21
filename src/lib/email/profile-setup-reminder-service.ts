"use server";

/**
 * Profile & Setup Reminder Sequence Service (S084)
 *
 * Manages reminder emails for users who haven't completed profile or setup steps:
 *
 * Profile Completion Reminders:
 * - Day 3: Missing photo reminder
 * - Day 7: Incomplete bio reminder
 * - Day 14: Final profile reminder with impact stats
 *
 * Setup Completion Reminders:
 * - Day 3: No survey template created
 * - Day 7: No survey sent
 * - Day 5: No Google connected (admins only)
 * - Day 7: No team members invited (admins only)
 *
 * Exit Conditions:
 * - User completes the specific step being reminded about
 * - User unsubscribes
 * - User disables notifications
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, getFromAddress, emailConfig } from "./client";
import type {
  EmailTemplate,
  ProfileReminderPhotoEmailData,
  ProfileReminderBioEmailData,
  ProfileReminderFinalEmailData,
  SetupReminderSurveyTemplateEmailData,
  SetupReminderFirstSurveyEmailData,
  SetupReminderGoogleConnectEmailData,
  SetupReminderInviteTeamEmailData,
} from "./types";
import {
  getProfileReminderPhotoEmail,
  getProfileReminderBioEmail,
  getProfileReminderFinalEmail,
  getSetupReminderSurveyTemplateEmail,
  getSetupReminderFirstSurveyEmail,
  getSetupReminderGoogleConnectEmail,
  getSetupReminderInviteTeamEmail,
} from "./profile-setup-reminder-templates";

// ============================================================================
// Types
// ============================================================================

type ReminderType =
  | "profile_photo"
  | "profile_bio"
  | "profile_final"
  | "setup_survey_template"
  | "setup_first_survey"
  | "setup_google_connect"
  | "setup_invite_team";

interface ReminderScheduleItem {
  reminderType: ReminderType;
  daysSinceSignup: number;
  templateName: EmailTemplate;
  condition: "missing_photo" | "missing_bio" | "missing_profile" | "no_survey_template" | "no_survey_sent" | "no_google" | "no_team";
  role?: "admin" | "any";
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
    template?: string;
    reminder_type?: ReminderType;
  }>;
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
    role: string;
    signupDate: string;
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

interface UserCompletionStatus {
  hasPhoto: boolean;
  hasBio: boolean;
  hasSurveyTemplate: boolean;
  hasSentSurvey: boolean;
  hasGoogleConnected: boolean;
  hasTeamMembers: boolean;
  profileCompletionPercent: number;
  setupCompletionPercent: number;
}

// ============================================================================
// Configuration
// ============================================================================

const REMINDER_SCHEDULE: ReminderScheduleItem[] = [
  // Profile reminders
  {
    reminderType: "profile_photo",
    daysSinceSignup: 3,
    templateName: "profile_reminder_photo",
    condition: "missing_photo",
    role: "any",
  },
  {
    reminderType: "profile_bio",
    daysSinceSignup: 7,
    templateName: "profile_reminder_bio",
    condition: "missing_bio",
    role: "any",
  },
  {
    reminderType: "profile_final",
    daysSinceSignup: 14,
    templateName: "profile_reminder_final",
    condition: "missing_profile",
    role: "any",
  },
  // Setup reminders
  {
    reminderType: "setup_survey_template",
    daysSinceSignup: 3,
    templateName: "setup_reminder_survey_template",
    condition: "no_survey_template",
    role: "any",
  },
  {
    reminderType: "setup_first_survey",
    daysSinceSignup: 7,
    templateName: "setup_reminder_first_survey",
    condition: "no_survey_sent",
    role: "any",
  },
  {
    reminderType: "setup_google_connect",
    daysSinceSignup: 5,
    templateName: "setup_reminder_google_connect",
    condition: "no_google",
    role: "admin",
  },
  {
    reminderType: "setup_invite_team",
    daysSinceSignup: 7,
    templateName: "setup_reminder_invite_team",
    condition: "no_team",
    role: "admin",
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

async function getUserCompletionStatus(
  userId: string,
  organizationId: string,
  role: string
): Promise<UserCompletionStatus> {
  const supabase = createAdminClient();

  // Get user profile data
  const { data: user } = await supabase
    .from("users")
    .select("photo_url, bio")
    .eq("id", userId)
    .single();

  const hasPhoto = !!(user?.photo_url);
  const hasBio = !!(user?.bio && user.bio.trim().length > 0);

  // Check for survey templates
  const { count: templateCount } = await supabase
    .from("survey_templates")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  const hasSurveyTemplate = (templateCount || 0) > 0;

  // Check for sent surveys
  const { count: surveyCount } = await supabase
    .from("surveys")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .in("status", ["sent", "opened", "completed"]);

  const hasSentSurvey = (surveyCount || 0) > 0;

  // Check for Google connection (via google_connections table)
  const { count: googleConnectionCount } = await supabase
    .from("google_connections")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  const hasGoogleConnected = (googleConnectionCount || 0) > 0;

  // Check for team members (other than the user)
  const { count: teamCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  const hasTeamMembers = (teamCount || 0) > 1;

  // Calculate profile completion percentage
  let profileItems = 0;
  let profileComplete = 0;

  profileItems += 1; // Photo
  if (hasPhoto) profileComplete += 1;

  profileItems += 1; // Bio
  if (hasBio) profileComplete += 1;

  const profileCompletionPercent = Math.round((profileComplete / profileItems) * 100);

  // Calculate setup completion percentage
  let setupItems = 2; // Survey template + first survey
  let setupComplete = 0;

  if (hasSurveyTemplate) setupComplete += 1;
  if (hasSentSurvey) setupComplete += 1;

  // Admin-specific items
  if (role === "admin") {
    setupItems += 2; // Google + team
    if (hasGoogleConnected) setupComplete += 1;
    if (hasTeamMembers) setupComplete += 1;
  }

  const setupCompletionPercent = Math.round((setupComplete / setupItems) * 100);

  return {
    hasPhoto,
    hasBio,
    hasSurveyTemplate,
    hasSentSurvey,
    hasGoogleConnected,
    hasTeamMembers,
    profileCompletionPercent,
    setupCompletionPercent,
  };
}

function shouldSendReminder(
  reminder: ReminderScheduleItem,
  status: UserCompletionStatus,
  sentReminders: Set<ReminderType>
): boolean {
  // Already sent this reminder
  if (sentReminders.has(reminder.reminderType)) {
    return false;
  }

  // Check condition
  switch (reminder.condition) {
    case "missing_photo":
      return !status.hasPhoto;
    case "missing_bio":
      return !status.hasBio;
    case "missing_profile":
      return !status.hasPhoto || !status.hasBio;
    case "no_survey_template":
      return !status.hasSurveyTemplate;
    case "no_survey_sent":
      return !status.hasSentSurvey;
    case "no_google":
      return !status.hasGoogleConnected;
    case "no_team":
      return !status.hasTeamMembers;
    default:
      return false;
  }
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Detect users needing profile/setup reminders and start sequences
 * Called by cron job daily
 */
export async function detectUsersAndStartReminderSequences(): Promise<DetectionResult> {
  const supabase = createAdminClient();
  const result: DetectionResult = {
    newSequencesStarted: 0,
    alreadyInSequence: 0,
    errors: [],
  };

  const now = new Date();

  // Find users who signed up at least 3 days ago (minimum for first reminder)
  // and don't already have an active profile-setup-reminder sequence
  const threeDaysAgo = addDays(now, -3);

  const { data: eligibleUsers, error } = await supabase
    .from("users")
    .select(`
      id,
      email,
      full_name,
      organization_id,
      role,
      created_at,
      receive_notifications,
      organizations!inner(name)
    `)
    .lte("created_at", threeDaysAgo.toISOString())
    .eq("is_active", true)
    .eq("receive_notifications", true);

  if (error) {
    result.errors.push(`Failed to fetch eligible users: ${error.message}`);
    return result;
  }

  if (!eligibleUsers || eligibleUsers.length === 0) {
    return result;
  }

  for (const user of eligibleUsers) {
    try {
      // Check if user already has an active profile-setup-reminder sequence
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingSequence } = await (supabase.from as any)("email_sequences")
        .select("id")
        .eq("user_id", user.id)
        .eq("sequence_type", "profile-setup-reminder")
        .in("status", ["active", "paused", "processing"])
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

      // Skip users without organization (shouldn't happen due to !inner join)
      if (!user.organization_id) {
        continue;
      }

      // Get user completion status
      const status = await getUserCompletionStatus(
        user.id,
        user.organization_id,
        user.role
      );

      // Skip if profile and setup are both complete
      if (status.profileCompletionPercent === 100 && status.setupCompletionPercent === 100) {
        continue;
      }

      const org = user.organizations as { name: string };

      // Start the reminder sequence
      const startResult = await startReminderSequence(user.id, {
        firstName: user.full_name?.split(" ")[0] || "there",
        organizationName: org.name,
        role: user.role,
        signupDate: user.created_at || new Date().toISOString(),
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
 * Start a profile/setup reminder sequence for a specific user
 */
export async function startReminderSequence(
  userId: string,
  metadata: {
    firstName: string;
    organizationName: string;
    role: string;
    signupDate: string;
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

  if (user.receive_notifications === false) {
    return { success: false, error: "User has disabled notifications" };
  }

  const now = new Date();

  // Create the sequence record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequence, error: insertError } = await (supabase.from as any)("email_sequences")
    .insert({
      user_id: userId,
      organization_id: user.organization_id,
      sequence_type: "profile-setup-reminder",
      status: "active",
      current_step: 0,
      total_steps: REMINDER_SCHEDULE.length,
      steps_completed: [],
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
 * Process the profile/setup reminder sequence queue
 * Called by cron job every 5 minutes
 */
export async function processReminderSequenceQueue(
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

  const now = new Date().toISOString();

  // Get sequences ready to process
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequences, error } = await (supabase.from as any)("email_sequences")
    .select("*")
    .eq("sequence_type", "profile-setup-reminder")
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

  // Optimistic locking: mark sequences as processing
  const sequenceIds = (sequences as SequenceRecord[]).map(s => s.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lockedSequences, error: lockError } = await (supabase.from as any)("email_sequences")
    .update({
      status: "processing",
      updated_at: new Date().toISOString()
    })
    .in("id", sequenceIds)
    .eq("status", "active")
    .select("id");

  if (lockError) {
    result.errors.push(`Failed to acquire lock: ${lockError.message}`);
    return result;
  }

  const lockedIds = new Set((lockedSequences || []).map((s: { id: string }) => s.id));
  const sequencesToProcess = (sequences as SequenceRecord[]).filter(s => lockedIds.has(s.id));

  if (sequencesToProcess.length === 0) {
    return result;
  }

  for (const sequence of sequencesToProcess) {
    try {
      const processResult = await processSequenceStep(sequence);

      if (processResult.success) {
        if (processResult.action === "sent") {
          result.processed++;
        } else if (processResult.action === "skipped") {
          result.skipped++;
          await resetSequenceToActive(supabase, sequence.id);
        } else if (processResult.action === "exited" || processResult.action === "completed") {
          result.exited++;
        }
      } else {
        result.failed++;
        result.errors.push(
          `Sequence ${sequence.id}: ${processResult.error || "Unknown error"}`
        );
        await resetSequenceToActive(supabase, sequence.id);
      }
    } catch (err) {
      result.failed++;
      result.errors.push(
        `Sequence ${sequence.id}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      await resetSequenceToActive(supabase, sequence.id);
    }
  }

  return result;
}

async function resetSequenceToActive(
  supabase: ReturnType<typeof createAdminClient>,
  sequenceId: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from as any)("email_sequences")
    .update({
      status: "active",
      updated_at: new Date().toISOString()
    })
    .eq("id", sequenceId)
    .eq("status", "processing");
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
    .select("id, email, full_name, receive_notifications, role, organization_id")
    .eq("id", sequence.user_id)
    .single();

  if (userError || !user) {
    return { success: false, error: "User not found" };
  }

  if (user.receive_notifications === false) {
    await updateSequenceStatus(sequence.id, "cancelled", "user_disabled_notifications");
    return { success: true, action: "exited" };
  }

  const unsubscribed = await isEmailUnsubscribed(user.email);
  if (unsubscribed) {
    await updateSequenceStatus(sequence.id, "cancelled", "email_unsubscribed");
    return { success: true, action: "exited" };
  }

  // Skip if user has no organization
  if (!user.organization_id) {
    await updateSequenceStatus(sequence.id, "cancelled", "no_organization");
    return { success: true, action: "exited" };
  }

  // Get current completion status
  const status = await getUserCompletionStatus(
    user.id,
    user.organization_id,
    user.role
  );

  // Check if all items are complete - exit sequence
  if (status.profileCompletionPercent === 100 && status.setupCompletionPercent === 100) {
    await updateSequenceStatus(sequence.id, "exited", "all_steps_completed", "full_completion");
    return { success: true, action: "exited" };
  }

  // Calculate days since signup
  const daysSinceSignup = daysBetween(
    new Date(),
    new Date(sequence.metadata.signupDate)
  );

  // Find which reminders have already been sent
  const sentReminders = new Set<ReminderType>(
    sequence.steps_completed
      .filter(s => s.reminder_type)
      .map(s => s.reminder_type as ReminderType)
  );

  // Find the next applicable reminder
  let reminderToSend: ReminderScheduleItem | null = null;

  for (const reminder of REMINDER_SCHEDULE) {
    // Check if it's time for this reminder
    if (daysSinceSignup < reminder.daysSinceSignup) {
      continue;
    }

    // Check role requirement
    if (reminder.role === "admin" && user.role !== "admin") {
      continue;
    }

    // Check if we should send this reminder
    if (shouldSendReminder(reminder, status, sentReminders)) {
      reminderToSend = reminder;
      break;
    }
  }

  if (!reminderToSend) {
    // No reminder to send right now, check if sequence is complete
    const allSentOrSkipped = REMINDER_SCHEDULE.every(r => {
      if (r.role === "admin" && user.role !== "admin") {
        return true; // Not applicable for this user
      }
      return sentReminders.has(r.reminderType) || !shouldSendReminder(r, status, sentReminders);
    });

    if (allSentOrSkipped) {
      await updateSequenceStatus(sequence.id, "completed");
      return { success: true, action: "completed" };
    }

    // Schedule next check in 1 day
    const nextEmailAt = addDays(new Date(), 1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from as any)("email_sequences")
      .update({
        next_email_at: nextEmailAt.toISOString(),
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sequence.id);

    return { success: true, action: "skipped" };
  }

  // Send the reminder email - we've already checked organization_id is not null above
  const userWithOrg = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    organization_id: user.organization_id!, // Safe due to null check above
  };
  const sendResult = await sendReminderEmail(sequence, userWithOrg, reminderToSend, status);

  if (!sendResult.success) {
    return { success: false, error: sendResult.error };
  }

  // Update sequence after successful send
  await updateSequenceAfterSend(
    sequence,
    sendResult.emailId!,
    reminderToSend
  );

  return { success: true, action: "sent" };
}

/**
 * Send a reminder email
 */
async function sendReminderEmail(
  sequence: SequenceRecord,
  user: { id: string; email: string; full_name: string | null; organization_id: string },
  reminder: ReminderScheduleItem,
  status: UserCompletionStatus
): Promise<{
  success: boolean;
  emailId?: string;
  error?: string;
}> {
  const resend = getResendClient();
  const baseUrl = emailConfig.baseUrl;
  const unsubscribeUrl = `${baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(user.email)}`;
  const dashboardUrl = `${baseUrl}/dashboard`;
  const profileUrl = `${baseUrl}/dashboard/profile`;

  const baseData = {
    toEmail: user.email,
    toName: user.full_name || undefined,
    firstName: sequence.metadata.firstName,
    organizationName: sequence.metadata.organizationName,
    dashboardUrl,
    sequenceId: sequence.id,
    unsubscribeUrl,
    organizationId: sequence.organization_id,
  };

  let emailContent: { subject: string; html: string };

  switch (reminder.reminderType) {
    case "profile_photo": {
      const data: ProfileReminderPhotoEmailData = {
        ...baseData,
        completionPercent: status.profileCompletionPercent,
        uploadPhotoUrl: `${profileUrl}#photo`,
      };
      emailContent = getProfileReminderPhotoEmail(data);
      break;
    }

    case "profile_bio": {
      const data: ProfileReminderBioEmailData = {
        ...baseData,
        completionPercent: status.profileCompletionPercent,
        editProfileUrl: `${profileUrl}#bio`,
      };
      emailContent = getProfileReminderBioEmail(data);
      break;
    }

    case "profile_final": {
      const missingItems: Array<{ label: string; actionUrl: string }> = [];
      if (!status.hasPhoto) {
        missingItems.push({ label: "Add profile photo", actionUrl: `${profileUrl}#photo` });
      }
      if (!status.hasBio) {
        missingItems.push({ label: "Write your bio", actionUrl: `${profileUrl}#bio` });
      }

      const data: ProfileReminderFinalEmailData = {
        ...baseData,
        completionPercent: status.profileCompletionPercent,
        profileUrl,
        missingItems,
      };
      emailContent = getProfileReminderFinalEmail(data);
      break;
    }

    case "setup_survey_template": {
      const data: SetupReminderSurveyTemplateEmailData = {
        ...baseData,
        completionPercent: status.setupCompletionPercent,
        createTemplateUrl: `${baseUrl}/dashboard/surveys/templates/new`,
        setupProgress: status.setupCompletionPercent,
        helpUrl: `${baseUrl}/help/surveys`,
      };
      emailContent = getSetupReminderSurveyTemplateEmail(data);
      break;
    }

    case "setup_first_survey": {
      const data: SetupReminderFirstSurveyEmailData = {
        ...baseData,
        completionPercent: status.setupCompletionPercent,
        sendSurveyUrl: `${baseUrl}/dashboard/surveys/send`,
        setupProgress: status.setupCompletionPercent,
      };
      emailContent = getSetupReminderFirstSurveyEmail(data);
      break;
    }

    case "setup_google_connect": {
      const data: SetupReminderGoogleConnectEmailData = {
        ...baseData,
        completionPercent: status.setupCompletionPercent,
        googleConnectUrl: `${baseUrl}/dashboard/settings/integrations/google`,
        setupProgress: status.setupCompletionPercent,
      };
      emailContent = getSetupReminderGoogleConnectEmail(data);
      break;
    }

    case "setup_invite_team": {
      const data: SetupReminderInviteTeamEmailData = {
        ...baseData,
        completionPercent: status.setupCompletionPercent,
        inviteTeamUrl: `${baseUrl}/dashboard/settings/team/invite`,
        setupProgress: status.setupCompletionPercent,
      };
      emailContent = getSetupReminderInviteTeamEmail(data);
      break;
    }

    default:
      return { success: false, error: `Unknown reminder type: ${reminder.reminderType}` };
  }

  try {
    const response = await resend.emails.send({
      from: getFromAddress(),
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      tags: [
        { name: "template", value: reminder.templateName },
        { name: "sequence_id", value: sequence.id },
        { name: "sequence_type", value: "profile-setup-reminder" },
        { name: "reminder_type", value: reminder.reminderType },
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
        templateName: reminder.templateName,
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
      templateName: reminder.templateName,
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
      templateName: reminder.templateName,
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
  emailId: string,
  reminder: ReminderScheduleItem
): Promise<void> {
  const supabase = createAdminClient();

  const stepsCompleted = [
    ...sequence.steps_completed,
    {
      step: sequence.current_step + 1,
      email_id: emailId,
      sent_at: new Date().toISOString(),
      template: reminder.templateName,
      reminder_type: reminder.reminderType,
    },
  ];

  // Schedule next check in 1 day
  const nextEmailAt = addDays(new Date(), 1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("email_sequences")
    .update({
      current_step: sequence.current_step + 1,
      steps_completed: stepsCompleted,
      last_email_at: new Date().toISOString(),
      next_email_at: nextEmailAt.toISOString(),
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", sequence.id);

  if (error) {
    console.error("Failed to update sequence after send:", error);
  }
}

/**
 * Exit reminder sequences when a user completes a specific step
 * Call this when:
 * - User uploads photo
 * - User completes bio
 * - User creates survey template
 * - User sends first survey
 * - User connects Google
 * - User invites team member
 */
export async function checkAndExitSequenceOnCompletion(
  userId: string
): Promise<{ shouldExit: boolean; exitReason?: string }> {
  const supabase = createAdminClient();

  // Get user data
  const { data: user } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", userId)
    .single();

  if (!user || !user.organization_id) {
    return { shouldExit: false };
  }

  // Get completion status
  const status = await getUserCompletionStatus(userId, user.organization_id, user.role);

  // If fully complete, exit the sequence
  if (status.profileCompletionPercent === 100 && status.setupCompletionPercent === 100) {
    // Find active sequence for this user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sequence } = await (supabase.from as any)("email_sequences")
      .select("id")
      .eq("user_id", userId)
      .eq("sequence_type", "profile-setup-reminder")
      .eq("status", "active")
      .single();

    if (sequence) {
      await updateSequenceStatus(
        sequence.id,
        "exited",
        "all_steps_completed",
        "full_completion"
      );
      return { shouldExit: true, exitReason: "all_steps_completed" };
    }
  }

  return { shouldExit: false };
}

/**
 * Get reminder sequence status for a user
 */
export async function getReminderSequenceStatus(userId: string): Promise<{
  hasSequence: boolean;
  sequence?: SequenceRecord;
}> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequence, error } = await (supabase.from as any)("email_sequences")
    .select("*")
    .eq("user_id", userId)
    .eq("sequence_type", "profile-setup-reminder")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !sequence) {
    return { hasSequence: false };
  }

  return { hasSequence: true, sequence: sequence as SequenceRecord };
}
