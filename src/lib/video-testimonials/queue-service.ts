"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendVideoTestimonialInvitationEmail,
  sendVideoTestimonialReminderEmail,
} from "@/lib/email";
import { emailConfig } from "@/lib/email/client";
import type {
  VideoTestimonialInvitationEmailData,
  VideoTestimonialReminderEmailData,
} from "@/lib/email/types";

// ============================================================================
// Types
// ============================================================================

export interface VideoTestimonialQueueItem {
  id: string;
  request_id: string;
  organization_id: string;
  type: "initial" | "reminder_3day" | "reminder_7day";
  scheduled_at: string;
  retry_count: number;
}

export interface VideoTestimonialRequestWithDetails {
  id: string;
  token: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  status: string;
  reminder_count: number;
  sent_at: string | null;
  opened_at: string | null;
  submitted_at: string | null;
  expires_at: string | null;
  max_duration_seconds: number;
  prompt_text: string | null;
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

export interface QueueProcessingResult {
  processed: number;
  failed: number;
  skipped: number;
  errors: string[];
}

export interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  cancelled: number;
  byType: {
    initial: number;
    reminder_3day: number;
    reminder_7day: number;
  };
}

// ============================================================================
// Rate Limiting
// ============================================================================

/**
 * Check if organization is within rate limits for sending video testimonial emails
 */
export async function checkVideoTestimonialRateLimit(
  organizationId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = createAdminClient();

  // Count video testimonial emails sent in last hour
  const { count: hourlyCount, error: hourlyError } = await supabase
    .from("email_logs")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .in("template_name", [
      "video_testimonial_invitation",
      "video_testimonial_reminder_3day",
      "video_testimonial_reminder_7day",
    ])
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
    .in("template_name", [
      "video_testimonial_invitation",
      "video_testimonial_reminder_3day",
      "video_testimonial_reminder_7day",
    ])
    .gte("sent_at", today.toISOString());

  if (dailyError) {
    console.error("Error checking daily rate limit:", dailyError);
    return { allowed: false, reason: "Failed to check rate limits" };
  }

  // Default limits (can be customized per organization later)
  const maxPerHour = 50;
  const maxPerDay = 500;

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

// ============================================================================
// Queue Processing Configuration
// ============================================================================

/**
 * Check if queue processing is paused for an organization
 */
export async function isQueuePaused(
  organizationId: string
): Promise<boolean> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("organization_settings")
    .select("value")
    .eq("organization_id", organizationId)
    .eq("key", "video_testimonial_queue_paused")
    .single();

  return data?.value === "true";
}

/**
 * Set queue processing pause state for an organization
 */
export async function setQueuePaused(
  organizationId: string,
  paused: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("organization_settings").upsert(
    {
      organization_id: organizationId,
      key: "video_testimonial_queue_paused",
      value: paused ? "true" : "false",
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "organization_id,key",
    }
  );

  if (error) {
    console.error("Error setting queue paused state:", error);
    return { success: false, error: "Failed to update queue state" };
  }

  return { success: true };
}

// ============================================================================
// Queue Item Processing
// ============================================================================

/**
 * Get video testimonial request details for sending
 */
export async function getVideoTestimonialRequestForSending(
  requestId: string
): Promise<VideoTestimonialRequestWithDetails | null> {
  const supabase = createAdminClient();

  const { data: request, error } = await supabase
    .from("video_testimonial_requests")
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
      opened_at,
      submitted_at,
      expires_at,
      max_duration_seconds,
      prompt_text,
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
    .eq("id", requestId)
    .single();

  if (error || !request) {
    console.error("Failed to get video testimonial request for sending:", error);
    return null;
  }

  const loanOfficer = request.loan_officers as unknown as {
    id: string;
    full_name: string;
    email: string;
    photo_url: string | null;
  };

  const organization = request.organizations as unknown as {
    id: string;
    name: string;
    logo_url: string | null;
  };

  return {
    id: request.id,
    token: request.token,
    customer_name: request.customer_name,
    customer_email: request.customer_email,
    customer_phone: request.customer_phone,
    status: request.status || "pending",
    reminder_count: request.reminder_count || 0,
    sent_at: request.sent_at,
    opened_at: request.opened_at,
    submitted_at: request.submitted_at,
    expires_at: request.expires_at,
    max_duration_seconds: request.max_duration_seconds || 120,
    prompt_text: request.prompt_text,
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

/**
 * Process a single video testimonial queue item
 */
export async function processVideoTestimonialQueueItem(
  item: VideoTestimonialQueueItem
): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
  const supabase = createAdminClient();

  // Check if queue is paused for this organization
  const isPaused = await isQueuePaused(item.organization_id);
  if (isPaused) {
    return { success: false, skipped: true, error: "Queue is paused" };
  }

  // Mark item as processing
  await supabase
    .from("video_testimonial_queue")
    .update({ status: "processing" })
    .eq("id", item.id);

  // Check rate limits
  const rateCheck = await checkVideoTestimonialRateLimit(item.organization_id);
  if (!rateCheck.allowed) {
    // Reschedule for later due to rate limiting
    await supabase
      .from("video_testimonial_queue")
      .update({
        status: "pending",
        scheduled_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      })
      .eq("id", item.id);

    return { success: false, error: rateCheck.reason };
  }

  // Get request details
  const request = await getVideoTestimonialRequestForSending(item.request_id);
  if (!request) {
    await supabase
      .from("video_testimonial_queue")
      .update({
        status: "failed",
        error_message: "Request not found",
        processed_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    return { success: false, error: "Request not found" };
  }

  // Check if request is already completed, cancelled, or expired
  if (request.submitted_at || request.status === "submitted") {
    await supabase
      .from("video_testimonial_queue")
      .update({
        status: "cancelled",
        error_message: "Video already submitted",
        processed_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    // Cancel other pending queue items for this request
    await supabase
      .from("video_testimonial_queue")
      .update({ status: "cancelled" })
      .eq("request_id", item.request_id)
      .eq("status", "pending");

    return { success: true };
  }

  if (request.status === "cancelled") {
    await supabase
      .from("video_testimonial_queue")
      .update({
        status: "cancelled",
        error_message: "Request was cancelled",
        processed_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    return { success: true };
  }

  if (request.expires_at && new Date(request.expires_at) < new Date()) {
    await supabase
      .from("video_testimonial_queue")
      .update({
        status: "cancelled",
        error_message: "Request expired",
        processed_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    // Update request status to expired
    await supabase
      .from("video_testimonial_requests")
      .update({ status: "expired" })
      .eq("id", item.request_id);

    return { success: true };
  }

  // For reminders, check if request has already been opened (no need to remind)
  if (item.type !== "initial" && request.opened_at) {
    await supabase
      .from("video_testimonial_queue")
      .update({
        status: "cancelled",
        error_message: "Customer already opened the request",
        processed_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    return { success: true };
  }

  const requestUrl = `${emailConfig.baseUrl}/video-testimonial/${request.token}`;

  // Send email based on type
  let result: { success: boolean; error?: string };

  if (item.type === "initial") {
    const emailData: VideoTestimonialInvitationEmailData = {
      toEmail: request.customer_email,
      customerName: request.customer_name,
      loanOfficerName: request.loan_officer.full_name,
      loanOfficerPhotoUrl: request.loan_officer.photo_url || undefined,
      organizationName: request.organization.name,
      organizationLogoUrl: request.organization.logo_url || undefined,
      requestUrl,
      maxDurationSeconds: request.max_duration_seconds,
      promptText: request.prompt_text || undefined,
      organizationId: request.organization.id,
      loanOfficerId: request.loan_officer.id,
      requestId: request.id,
    };

    result = await sendVideoTestimonialInvitationEmail(emailData);

    if (result.success) {
      // Update request status to sent
      await supabase
        .from("video_testimonial_requests")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", request.id);
    }
  } else {
    // Reminder email
    const reminderNumber = item.type === "reminder_3day" ? 1 : 2;

    const emailData: VideoTestimonialReminderEmailData = {
      toEmail: request.customer_email,
      customerName: request.customer_name,
      loanOfficerName: request.loan_officer.full_name,
      organizationName: request.organization.name,
      requestUrl,
      reminderNumber: reminderNumber as 1 | 2,
      organizationId: request.organization.id,
      loanOfficerId: request.loan_officer.id,
      requestId: request.id,
    };

    result = await sendVideoTestimonialReminderEmail(emailData);

    if (result.success) {
      // Update request reminder count
      await supabase
        .from("video_testimonial_requests")
        .update({
          reminder_count: request.reminder_count + 1,
          last_reminder_at: new Date().toISOString(),
        })
        .eq("id", request.id);
    }
  }

  // Update queue item status
  if (result.success) {
    await supabase
      .from("video_testimonial_queue")
      .update({
        status: "sent",
        processed_at: new Date().toISOString(),
      })
      .eq("id", item.id);
  } else {
    // Increment retry count and potentially reschedule
    const newRetryCount = item.retry_count + 1;
    const maxRetries = 3;

    if (newRetryCount < maxRetries) {
      // Reschedule with exponential backoff
      const backoffMinutes = Math.pow(2, newRetryCount) * 5;
      await supabase
        .from("video_testimonial_queue")
        .update({
          status: "pending",
          retry_count: newRetryCount,
          error_message: result.error,
          scheduled_at: new Date(
            Date.now() + backoffMinutes * 60 * 1000
          ).toISOString(),
        })
        .eq("id", item.id);
    } else {
      // Max retries reached, mark as failed
      await supabase
        .from("video_testimonial_queue")
        .update({
          status: "failed",
          retry_count: newRetryCount,
          error_message: result.error,
          processed_at: new Date().toISOString(),
        })
        .eq("id", item.id);
    }
  }

  return result;
}

// ============================================================================
// Queue Processing
// ============================================================================

/**
 * Get pending video testimonial queue items ready to process
 */
export async function getPendingVideoTestimonialQueueItems(
  limit: number = 50
): Promise<VideoTestimonialQueueItem[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("video_testimonial_queue")
    .select("id, request_id, organization_id, type, scheduled_at, retry_count")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .lt("retry_count", 3)
    .order("priority", { ascending: false })
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Error fetching pending video testimonial queue items:", error);
    return [];
  }

  return (data || []).map((item) => ({
    id: item.id,
    request_id: item.request_id,
    organization_id: item.organization_id,
    type: item.type as VideoTestimonialQueueItem["type"],
    scheduled_at: item.scheduled_at,
    retry_count: item.retry_count || 0,
  }));
}

/**
 * Process the video testimonial distribution queue
 * Called by cron job
 */
export async function processVideoTestimonialQueue(
  batchSize: number = 50
): Promise<QueueProcessingResult> {
  const items = await getPendingVideoTestimonialQueueItems(batchSize);
  const results: QueueProcessingResult = {
    processed: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  for (const item of items) {
    try {
      const result = await processVideoTestimonialQueueItem(item);

      if (result.skipped) {
        results.skipped++;
      } else if (result.success) {
        results.processed++;
      } else {
        results.failed++;
        if (result.error) {
          results.errors.push(`${item.request_id}: ${result.error}`);
        }
      }
    } catch (error) {
      results.failed++;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      results.errors.push(`${item.request_id}: ${errorMessage}`);
    }
  }

  return results;
}

// ============================================================================
// Queue Statistics
// ============================================================================

/**
 * Get video testimonial queue statistics for an organization
 */
export async function getVideoTestimonialQueueStats(
  organizationId: string,
  startDate?: Date,
  endDate?: Date
): Promise<QueueStats> {
  const supabase = createAdminClient();

  let query = supabase
    .from("video_testimonial_queue")
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
    console.error("Error fetching video testimonial queue stats:", error);
    return {
      total: 0,
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
      cancelled: 0,
      byType: { initial: 0, reminder_3day: 0, reminder_7day: 0 },
    };
  }

  const stats: QueueStats = {
    total: data.length,
    pending: 0,
    processing: 0,
    sent: 0,
    failed: 0,
    cancelled: 0,
    byType: { initial: 0, reminder_3day: 0, reminder_7day: 0 },
  };

  for (const item of data) {
    switch (item.status) {
      case "pending":
        stats.pending++;
        break;
      case "processing":
        stats.processing++;
        break;
      case "sent":
        stats.sent++;
        break;
      case "failed":
        stats.failed++;
        break;
      case "cancelled":
        stats.cancelled++;
        break;
    }

    switch (item.type) {
      case "initial":
        stats.byType.initial++;
        break;
      case "reminder_3day":
        stats.byType.reminder_3day++;
        break;
      case "reminder_7day":
        stats.byType.reminder_7day++;
        break;
    }
  }

  return stats;
}

/**
 * Cancel pending queue items for a video testimonial request
 */
export async function cancelPendingVideoTestimonialQueueItems(
  requestId: string
): Promise<{ cancelled: number }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("video_testimonial_queue")
    .update({
      status: "cancelled",
      processed_at: new Date().toISOString(),
    })
    .eq("request_id", requestId)
    .eq("status", "pending")
    .select("id");

  if (error) {
    console.error("Error cancelling video testimonial queue items:", error);
    return { cancelled: 0 };
  }

  return { cancelled: data?.length ?? 0 };
}
