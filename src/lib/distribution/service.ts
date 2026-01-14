"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendSurveyInvitationEmail,
  sendSurveyReminderEmail,
} from "@/lib/email";
import { emailConfig } from "@/lib/email/client";
import type {
  SurveyInvitationEmailData,
  SurveyReminderEmailData,
} from "@/lib/email/types";

export interface QueueItem {
  id: string;
  survey_id: string;
  organization_id: string;
  type: "initial" | "reminder_3day" | "reminder_7day";
  scheduled_at: string;
}

export interface SurveyWithDetails {
  id: string;
  token: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  status: string;
  reminder_count: number;
  sent_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  transaction_type: string | null;
  loan_officer: {
    id: string;
    full_name: string;
    email: string;
    photo_url: string | null;
  };
  organization: {
    id: string;
    name: string;
    logo_url: string | null;
  };
}

// Check if organization is within rate limits
export async function checkRateLimit(
  organizationId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = createAdminClient();

  // Count emails sent in last hour
  const { count: hourlyCount, error: hourlyError } = await supabase
    .from("email_logs")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("sent_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

  if (hourlyError) {
    console.error("Error checking hourly rate limit:", hourlyError);
    return { allowed: false, reason: "Failed to check rate limits" };
  }

  // Count emails sent today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: dailyCount, error: dailyError } = await supabase
    .from("email_logs")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("sent_at", today.toISOString());

  if (dailyError) {
    console.error("Error checking daily rate limit:", dailyError);
    return { allowed: false, reason: "Failed to check rate limits" };
  }

  // Check custom limits for organization
  const { data: rateLimit } = await supabase
    .from("distribution_rate_limits")
    .select("max_emails_per_hour, max_emails_per_day")
    .eq("organization_id", organizationId)
    .lte("window_start", new Date().toISOString())
    .gt("window_end", new Date().toISOString())
    .limit(1)
    .single();

  const maxPerHour = rateLimit?.max_emails_per_hour ?? 100;
  const maxPerDay = rateLimit?.max_emails_per_day ?? 1000;

  if ((hourlyCount ?? 0) >= maxPerHour) {
    return {
      allowed: false,
      reason: `Hourly limit reached (${hourlyCount}/${maxPerHour})`,
    };
  }

  if ((dailyCount ?? 0) >= maxPerDay) {
    return {
      allowed: false,
      reason: `Daily limit reached (${dailyCount}/${maxPerDay})`,
    };
  }

  return { allowed: true };
}

// Get survey details for sending
export async function getSurveyForSending(
  surveyId: string
): Promise<SurveyWithDetails | null> {
  const supabase = createAdminClient();

  const { data: survey, error } = await supabase
    .from("surveys")
    .select(
      `
      id,
      token,
      customer_name,
      customer_email,
      customer_phone,
      status,
      reminder_count,
      sent_at,
      completed_at,
      expires_at,
      transaction_type,
      loan_officers!inner (
        id,
        full_name,
        email,
        photo_url
      ),
      organizations!inner (
        id,
        name,
        logo_url
      )
    `
    )
    .eq("id", surveyId)
    .single();

  if (error || !survey) {
    console.error("Failed to get survey for sending:", error);
    return null;
  }

  const loanOfficer = survey.loan_officers as unknown as {
    id: string;
    full_name: string;
    email: string;
    photo_url: string | null;
  };

  const organization = survey.organizations as unknown as {
    id: string;
    name: string;
    logo_url: string | null;
  };

  return {
    id: survey.id,
    token: survey.token,
    customer_name: survey.customer_name,
    customer_email: survey.customer_email,
    customer_phone: survey.customer_phone,
    status: survey.status || "pending",
    reminder_count: survey.reminder_count || 0,
    sent_at: survey.sent_at,
    completed_at: survey.completed_at,
    expires_at: survey.expires_at,
    transaction_type: survey.transaction_type,
    loan_officer: {
      id: loanOfficer.id,
      full_name: loanOfficer.full_name,
      email: loanOfficer.email,
      photo_url: loanOfficer.photo_url,
    },
    organization: {
      id: organization.id,
      name: organization.name,
      logo_url: organization.logo_url,
    },
  };
}

// Process a single queue item
export async function processQueueItem(
  item: QueueItem
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Mark item as processing
  await supabase
    .from("survey_distribution_queue")
    .update({ status: "processing" })
    .eq("id", item.id);

  // Check rate limits
  const rateCheck = await checkRateLimit(item.organization_id);
  if (!rateCheck.allowed) {
    await supabase
      .from("survey_distribution_queue")
      .update({
        status: "pending",
        scheduled_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // Retry in 5 minutes
      })
      .eq("id", item.id);

    return { success: false, error: rateCheck.reason };
  }

  // Get survey details
  const survey = await getSurveyForSending(item.survey_id);
  if (!survey) {
    await supabase
      .from("survey_distribution_queue")
      .update({
        status: "failed",
        error_message: "Survey not found",
        processed_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    return { success: false, error: "Survey not found" };
  }

  // Check if survey is already completed or expired
  if (survey.completed_at || survey.status === "completed") {
    await supabase
      .from("survey_distribution_queue")
      .update({
        status: "cancelled",
        error_message: "Survey already completed",
        processed_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    // Also cancel any pending reminders
    await supabase
      .from("survey_distribution_queue")
      .update({ status: "cancelled" })
      .eq("survey_id", item.survey_id)
      .eq("status", "pending");

    return { success: true };
  }

  if (
    survey.expires_at &&
    new Date(survey.expires_at) < new Date()
  ) {
    await supabase
      .from("survey_distribution_queue")
      .update({
        status: "cancelled",
        error_message: "Survey expired",
        processed_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    return { success: true };
  }

  const surveyUrl = `${emailConfig.baseUrl}/survey/${survey.token}`;

  // Send email based on type
  let result: { success: boolean; error?: string };

  if (item.type === "initial") {
    const emailData: SurveyInvitationEmailData = {
      toEmail: survey.customer_email,
      customerName: survey.customer_name,
      loanOfficerName: survey.loan_officer.full_name,
      loanOfficerPhotoUrl: survey.loan_officer.photo_url || undefined,
      organizationName: survey.organization.name,
      organizationLogoUrl: survey.organization.logo_url || undefined,
      surveyUrl,
      transactionType: survey.transaction_type || undefined,
      organizationId: survey.organization.id,
      loanOfficerId: survey.loan_officer.id,
      surveyId: survey.id,
    };

    result = await sendSurveyInvitationEmail(emailData);

    if (result.success) {
      // Update survey status
      await supabase
        .from("surveys")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", survey.id);

      // Schedule reminders
      await scheduleReminders(survey.id, survey.organization.id);
    }
  } else {
    // Reminder email
    const reminderNumber = item.type === "reminder_3day" ? 1 : 2;

    const emailData: SurveyReminderEmailData = {
      toEmail: survey.customer_email,
      customerName: survey.customer_name,
      loanOfficerName: survey.loan_officer.full_name,
      organizationName: survey.organization.name,
      surveyUrl,
      reminderNumber: reminderNumber as 1 | 2,
      organizationId: survey.organization.id,
      loanOfficerId: survey.loan_officer.id,
      surveyId: survey.id,
    };

    result = await sendSurveyReminderEmail(emailData);

    if (result.success) {
      // Update survey reminder count
      await supabase
        .from("surveys")
        .update({
          reminder_count: survey.reminder_count + 1,
          last_reminder_at: new Date().toISOString(),
        })
        .eq("id", survey.id);
    }
  }

  // Update queue item status
  await supabase
    .from("survey_distribution_queue")
    .update({
      status: result.success ? "sent" : "failed",
      error_message: result.error,
      processed_at: new Date().toISOString(),
      retry_count: result.success
        ? undefined
        : (await supabase
            .from("survey_distribution_queue")
            .select("retry_count")
            .eq("id", item.id)
            .single()
            .then((r) => (r.data?.retry_count ?? 0) + 1)),
    })
    .eq("id", item.id);

  return result;
}

// Schedule reminder emails for a survey
export async function scheduleReminders(
  surveyId: string,
  organizationId: string,
  send3Day: boolean = true,
  send7Day: boolean = true
): Promise<void> {
  const supabase = createAdminClient();

  const now = new Date();

  if (send3Day) {
    // Check if reminder already exists
    const { count: existing3Day } = await supabase
      .from("survey_distribution_queue")
      .select("*", { count: "exact", head: true })
      .eq("survey_id", surveyId)
      .eq("type", "reminder_3day");

    if (!existing3Day || existing3Day === 0) {
      const reminder3Day = new Date(now);
      reminder3Day.setDate(reminder3Day.getDate() + 3);

      await supabase.from("survey_distribution_queue").insert({
        organization_id: organizationId,
        survey_id: surveyId,
        type: "reminder_3day",
        scheduled_at: reminder3Day.toISOString(),
        priority: -1,
      });
    }
  }

  if (send7Day) {
    // Check if reminder already exists
    const { count: existing7Day } = await supabase
      .from("survey_distribution_queue")
      .select("*", { count: "exact", head: true })
      .eq("survey_id", surveyId)
      .eq("type", "reminder_7day");

    if (!existing7Day || existing7Day === 0) {
      const reminder7Day = new Date(now);
      reminder7Day.setDate(reminder7Day.getDate() + 7);

      await supabase.from("survey_distribution_queue").insert({
        organization_id: organizationId,
        survey_id: surveyId,
        type: "reminder_7day",
        scheduled_at: reminder7Day.toISOString(),
        priority: -2,
      });
    }
  }
}

// Get pending queue items ready to process
export async function getPendingQueueItems(
  limit: number = 50
): Promise<QueueItem[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("survey_distribution_queue")
    .select("id, survey_id, organization_id, type, scheduled_at")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .lt("retry_count", 3)
    .order("priority", { ascending: false })
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Error fetching pending queue items:", error);
    return [];
  }

  return (data || []).map((item) => ({
    id: item.id,
    survey_id: item.survey_id,
    organization_id: item.organization_id,
    type: item.type as QueueItem["type"],
    scheduled_at: item.scheduled_at,
  }));
}

// Process the distribution queue (called by cron job or API)
export async function processDistributionQueue(
  batchSize: number = 50
): Promise<{ processed: number; failed: number; errors: string[] }> {
  const items = await getPendingQueueItems(batchSize);
  const results = { processed: 0, failed: 0, errors: [] as string[] };

  for (const item of items) {
    try {
      const result = await processQueueItem(item);

      if (result.success) {
        results.processed++;
      } else {
        results.failed++;
        if (result.error) {
          results.errors.push(`${item.survey_id}: ${result.error}`);
        }
      }
    } catch (error) {
      results.failed++;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      results.errors.push(`${item.survey_id}: ${errorMessage}`);
    }
  }

  return results;
}

// Cancel pending distributions for a survey
export async function cancelPendingDistributions(
  surveyId: string
): Promise<{ cancelled: number }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("survey_distribution_queue")
    .update({
      status: "cancelled",
      processed_at: new Date().toISOString(),
    })
    .eq("survey_id", surveyId)
    .eq("status", "pending")
    .select("id");

  if (error) {
    console.error("Error cancelling distributions:", error);
    return { cancelled: 0 };
  }

  return { cancelled: data?.length ?? 0 };
}

// Get distribution statistics for an organization
export async function getDistributionStats(
  organizationId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  total: number;
  sent: number;
  pending: number;
  failed: number;
  cancelled: number;
  byType: { initial: number; reminder_3day: number; reminder_7day: number };
}> {
  const supabase = createAdminClient();

  let query = supabase
    .from("survey_distribution_queue")
    .select("status, type")
    .eq("organization_id", organizationId);

  if (startDate) {
    query = query.gte("created_at", startDate.toISOString());
  }
  if (endDate) {
    query = query.lte("created_at", endDate.toISOString());
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Error fetching distribution stats:", error);
    return {
      total: 0,
      sent: 0,
      pending: 0,
      failed: 0,
      cancelled: 0,
      byType: { initial: 0, reminder_3day: 0, reminder_7day: 0 },
    };
  }

  const stats = {
    total: data.length,
    sent: 0,
    pending: 0,
    failed: 0,
    cancelled: 0,
    byType: { initial: 0, reminder_3day: 0, reminder_7day: 0 },
  };

  for (const item of data) {
    if (item.status === "sent") stats.sent++;
    else if (item.status === "pending" || item.status === "processing")
      stats.pending++;
    else if (item.status === "failed") stats.failed++;
    else if (item.status === "cancelled") stats.cancelled++;

    if (item.type === "initial") stats.byType.initial++;
    else if (item.type === "reminder_3day") stats.byType.reminder_3day++;
    else if (item.type === "reminder_7day") stats.byType.reminder_7day++;
  }

  return stats;
}
