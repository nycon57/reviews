import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  sendVideoTestimonialInvitationEmail,
  sendVideoTestimonialReminderEmail,
} from "@/lib/email";
import { emailConfig } from "@/lib/email/client";
import type {
  VideoTestimonialInvitationEmailData,
  VideoTestimonialReminderEmailData,
} from "@/lib/email/types";
import { guardAcquisitionSend } from "@/lib/contacts/send-guard";
import { resolveContactUnsubscribeUrl } from "@/lib/contacts/tokens";

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
  contact_id: string | null;
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
// Constants
// ============================================================================

const VIDEO_TESTIMONIAL_EMAIL_TEMPLATES = [
  "video_testimonial_invitation",
  "video_testimonial_reminder_3day",
  "video_testimonial_reminder_7day",
] as const;

const RATE_LIMITS = {
  maxPerHour: 50,
  maxPerDay: 500,
} as const;

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
    .in("template_name", VIDEO_TESTIMONIAL_EMAIL_TEMPLATES)
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
    .in("template_name", VIDEO_TESTIMONIAL_EMAIL_TEMPLATES)
    .gte("sent_at", today.toISOString());

  if (dailyError) {
    console.error("Error checking daily rate limit:", dailyError);
    return { allowed: false, reason: "Failed to check rate limits" };
  }

  if ((hourlyCount ?? 0) >= RATE_LIMITS.maxPerHour) {
    return {
      allowed: false,
      reason: `Hourly limit reached (${hourlyCount}/${RATE_LIMITS.maxPerHour})`,
    };
  }

  if ((dailyCount ?? 0) >= RATE_LIMITS.maxPerDay) {
    return {
      allowed: false,
      reason: `Daily limit reached (${dailyCount}/${RATE_LIMITS.maxPerDay})`,
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
    .from("organizations")
    .select("settings")
    .eq("id", organizationId)
    .single();

  const settings = (data?.settings || {}) as Record<string, unknown>;
  return settings.video_testimonial_queue_paused === true;
}

/**
 * Set queue processing pause state for an organization
 */
export async function setQueuePaused(
  organizationId: string,
  paused: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Fetch current settings
  const { data: orgData } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", organizationId)
    .single();

  const currentSettings = (orgData?.settings || {}) as Record<string, unknown>;
  const newSettings = {
    ...currentSettings,
    video_testimonial_queue_paused: paused,
  };

  const { error } = await supabase
    .from("organizations")
    .update({ settings: newSettings })
    .eq("id", organizationId);

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
 * Helper to cancel a queue item with a given reason
 */
async function cancelQueueItem(
  itemId: string,
  errorMessage: string
): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("video_testimonial_queue")
    .update({
      status: "cancelled",
      error_message: errorMessage,
      processed_at: new Date().toISOString(),
    })
    .eq("id", itemId);
}

/**
 * Get video testimonial request details for sending
 */
export async function getVideoTestimonialRequestForSending(
  requestId: string
): Promise<VideoTestimonialRequestWithDetails | null> {
  // Untyped client: contact_id is a new column not yet in the generated types.
  const supabase = createUntypedAdminClient();

  // Fetch request + organization (no user_id FK exists, so query user separately)
  const { data: request, error } = await supabase
    .from("video_testimonial_requests")
    .select(
      `
      id,
      token,
      contact_id,
      user_id,
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

  // Fetch loan officer separately (user_id has no FK constraint)
  const { data: loanOfficer, error: userError } = await supabase
    .from("users")
    .select("id, full_name, email, photo_url")
    .eq("id", request.user_id)
    .single();

  if (userError || !loanOfficer) {
    console.error("Failed to get loan officer for video testimonial request:", userError);
    return null;
  }

  const organization = request.organizations as unknown as {
    id: string;
    name: string;
    logo_url: string | null;
  };

  return {
    id: request.id,
    token: request.token,
    contact_id: (request.contact_id as string | null) ?? null,
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
      full_name: loanOfficer.full_name ?? "",
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

  // Atomically claim the item (compare-and-swap to prevent race conditions)
  // Only update if status is still "pending" to avoid duplicate processing
  const { data: claimedItem, error: claimError } = await supabase
    .from("video_testimonial_queue")
    .update({ status: "processing" })
    .eq("id", item.id)
    .eq("status", "pending")
    .select("id")
    .single();

  // If no row was returned, another worker already claimed this item
  if (claimError || !claimedItem) {
    return { success: false, skipped: true, error: "Item already being processed" };
  }

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
    await cancelQueueItem(item.id, "Video already submitted");
    // Cancel other pending queue items for this request
    await supabase
      .from("video_testimonial_queue")
      .update({ status: "cancelled" })
      .eq("request_id", item.request_id)
      .eq("status", "pending");
    return { success: true };
  }

  if (request.status === "cancelled") {
    await cancelQueueItem(item.id, "Request was cancelled");
    return { success: true };
  }

  if (request.expires_at && new Date(request.expires_at) < new Date()) {
    await cancelQueueItem(item.id, "Request expired");
    // Update request status to expired
    const now = new Date().toISOString();
    await supabase
      .from("video_testimonial_requests")
      .update({
        status: "expired",
        last_transition_at: now,
        last_transition_source: "queue_expiry",
        last_transition_reason: "Queue worker detected expired request",
      } as Record<string, unknown>)
      .eq("id", item.request_id);
    return { success: true };
  }

  // For reminders, suppress once user has opened or started recording.
  if (item.type !== "initial" && (request.opened_at || request.status === "recording")) {
    await cancelQueueItem(item.id, "Customer already opened or started recording");
    return { success: true };
  }

  // Send-time suppression gate (ADR 0004): one check covers the invitation and
  // both reminders since all video sends flow through here. A suppressed send is
  // cancelled (not retried) and recorded via guardAcquisitionSend.
  const sendKind = item.type === "initial" ? "video_invitation" : "video_reminder";
  const suppressed = await guardAcquisitionSend({
    organizationId: request.organization.id,
    email: request.customer_email,
    channel: "email",
    sendKind,
    contactId: request.contact_id,
    sourceTable: "video_testimonial_queue",
    sourceId: item.id,
  });
  if (suppressed) {
    await cancelQueueItem(item.id, "Suppressed: recipient unsubscribed (email)");
    // Suppression is org-wide and durable — cancel any pending items too.
    await supabase
      .from("video_testimonial_queue")
      .update({ status: "cancelled" })
      .eq("request_id", item.request_id)
      .eq("status", "pending");
    return { success: true };
  }

  // Contact-scoped unsubscribe link for the acquisition email footer (ADR 0004).
  const contactUnsubscribeUrl = request.contact_id
    ? (await resolveContactUnsubscribeUrl(request.contact_id)) ?? undefined
    : undefined;

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
      unsubscribeUrl: contactUnsubscribeUrl,
    };

    result = await sendVideoTestimonialInvitationEmail(emailData);

    if (result.success) {
      // Update request status to sent
      const now = new Date().toISOString();
      await supabase
        .from("video_testimonial_requests")
        .update({
          status: "sent",
          sent_at: now,
          last_transition_at: now,
          last_transition_source: "queue_send",
          last_transition_reason: "Initial invitation sent",
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
      unsubscribeUrl: contactUnsubscribeUrl,
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
// Immediate Email Sending (for single/small batch requests)
// ============================================================================

/**
 * Send initial video testimonial invitation email immediately (bypassing queue)
 * Use for single requests or small batches (≤ IMMEDIATE_SEND_THRESHOLD)
 *
 * @param requestId - The video testimonial request ID
 * @returns Result with success status and optional error
 */
export async function sendInitialVideoTestimonialEmailImmediately(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  console.error("[VideoTestimonial] sendInitialVideoTestimonialEmailImmediately called", { requestId });

  const supabase = createAdminClient();

  // Get request details
  const request = await getVideoTestimonialRequestForSending(requestId);
  if (!request) {
    console.error("[VideoTestimonial] Request not found", { requestId });
    return { success: false, error: "Request not found" };
  }

  console.error("[VideoTestimonial] Request found", {
    requestId,
    customerEmail: request.customer_email,
    customerName: request.customer_name,
    status: request.status,
    sent_at: request.sent_at,
  });

  // Check if already sent
  if (request.sent_at || request.status === "sent") {
    console.error("[VideoTestimonial] Already sent, skipping", { requestId });
    return { success: true }; // Already sent, not an error
  }

  // Check if cancelled or expired
  if (request.status === "cancelled") {
    console.error("[VideoTestimonial] Request cancelled", { requestId });
    return { success: false, error: "Request was cancelled" };
  }

  if (request.expires_at && new Date(request.expires_at) < new Date()) {
    console.error("[VideoTestimonial] Request expired", { requestId });
    const now = new Date().toISOString();
    await supabase
      .from("video_testimonial_requests")
      .update({
        status: "expired",
        last_transition_at: now,
        last_transition_source: "immediate_send",
        last_transition_reason: "Request expired before send",
      } as Record<string, unknown>)
      .eq("id", requestId);
    return { success: false, error: "Request expired" };
  }

  // Send-time suppression gate (ADR 0004). A suppressed immediate send cancels
  // the request (and any scheduled reminders) and records the skip — it never
  // silently drops.
  const suppressed = await guardAcquisitionSend({
    organizationId: request.organization.id,
    email: request.customer_email,
    channel: "email",
    sendKind: "video_invitation",
    contactId: request.contact_id,
    sourceTable: "video_testimonial_requests",
    sourceId: request.id,
  });
  if (suppressed) {
    const nowIso = new Date().toISOString();
    await supabase
      .from("video_testimonial_requests")
      .update({
        status: "cancelled",
        last_transition_at: nowIso,
        last_transition_source: "immediate_send",
        last_transition_reason: "Suppressed: recipient unsubscribed (email)",
      } as Record<string, unknown>)
      .eq("id", requestId);
    await supabase
      .from("video_testimonial_queue")
      .update({ status: "cancelled" })
      .eq("request_id", requestId)
      .eq("status", "pending");
    return { success: true };
  }

  const contactUnsubscribeUrl = request.contact_id
    ? (await resolveContactUnsubscribeUrl(request.contact_id)) ?? undefined
    : undefined;

  const requestUrl = `${emailConfig.baseUrl}/video-testimonial/${request.token}`;

  // Send the email
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
    unsubscribeUrl: contactUnsubscribeUrl,
  };

  console.error("[VideoTestimonial] Sending email", {
    toEmail: emailData.toEmail,
    customerName: emailData.customerName,
    requestUrl: emailData.requestUrl,
  });

  const result = await sendVideoTestimonialInvitationEmail(emailData);

  console.error("[VideoTestimonial] Email send result", {
    requestId,
    success: result.success,
    error: result.error,
  });

  if (result.success) {
    // Update request status to sent
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("video_testimonial_requests")
      .update({
        status: "sent",
        sent_at: now,
        last_transition_at: now,
        last_transition_source: "immediate_send",
        last_transition_reason: "Initial invitation sent immediately",
      })
      .eq("id", requestId);

    console.error("[VideoTestimonial] Status updated to sent", {
      requestId,
      updateError: updateError?.message,
    });
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

  return data.reduce<QueueStats>(
    (stats, item) => {
      // Count by status
      if (item.status === "pending") stats.pending++;
      else if (item.status === "processing") stats.processing++;
      else if (item.status === "sent") stats.sent++;
      else if (item.status === "failed") stats.failed++;
      else if (item.status === "cancelled") stats.cancelled++;

      // Count by type
      if (item.type === "initial") stats.byType.initial++;
      else if (item.type === "reminder_3day") stats.byType.reminder_3day++;
      else if (item.type === "reminder_7day") stats.byType.reminder_7day++;

      return stats;
    },
    {
      total: data.length,
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
      cancelled: 0,
      byType: { initial: 0, reminder_3day: 0, reminder_7day: 0 },
    }
  );
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
