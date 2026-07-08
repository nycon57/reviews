"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { queueClipRender } from "@/lib/share-studio/service";
import { getCelebrationThreshold } from "./public-actions";
import { z } from "zod";
import type { Json, Database } from "@/types/database.types";
import { sendInitialVideoTestimonialEmailImmediately } from "./queue-service";
import { findOrCreateContact } from "@/lib/contacts/actions";
import { IMMEDIATE_SEND_THRESHOLD } from "./types";

// Status type from database enum
type VideoTestimonialRequestStatus =
  Database["public"]["Enums"]["video_testimonial_request_status"];

// ============================================================================
// Types
// ============================================================================

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface VideoTestimonialRequest {
  id: string;
  token: string;
  organizationId: string;
  loanOfficerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  transactionId: string | null;
  transactionType: string | null;
  transactionDate: string | null;
  maxDurationSeconds: number;
  promptText: string | null;
  status: string;
  sentAt: string | null;
  openedAt: string | null;
  submittedAt: string | null;
  expiresAt: string | null;
  reminderCount: number;
  source: string;
  createdAt: string;
  requestUrl: string;
}

export interface CreateVideoTestimonialRequestResult {
  requestId: string;
  token: string;
  requestUrl: string;
  status: "created" | "queued" | "sent" | "failed";
  queueItemId?: string;
  message?: string;
}

export interface BulkCreateResult {
  successful: CreateVideoTestimonialRequestResult[];
  failed: Array<{ input: unknown; error: string }>;
  totalCreated: number;
  totalFailed: number;
}

export interface VideoTestimonialQueueItem {
  id: string;
  requestId: string;
  type: string;
  scheduledAt: string;
  processedAt: string | null;
  status: string;
  retryCount: number;
  errorMessage: string | null;
  customerName: string;
  customerEmail: string;
  loanOfficerName?: string;
}

// ============================================================================
// Validation Schemas
// ============================================================================

const createVideoTestimonialRequestSchema = z.object({
  loanOfficerId: z.string().uuid("Invalid loan officer ID"),
  customerName: z.string().min(1, "Customer name is required").max(200),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().optional(),
  transactionId: z.string().optional(),
  transactionType: z.string().optional(),
  transactionDate: z.string().optional(),
  maxDurationSeconds: z.number().min(30).max(300).optional().default(120),
  promptText: z.string().max(1000).optional(),
  sendImmediately: z.boolean().optional().default(true),
  scheduledAt: z.string().optional(),
});

export type CreateVideoTestimonialRequestInput = z.infer<
  typeof createVideoTestimonialRequestSchema
>;

const bulkCreateSchema = z.object({
  requests: z
    .array(createVideoTestimonialRequestSchema)
    .min(1, "At least one request is required")
    .max(100, "Maximum 100 requests per batch"),
});

export type BulkCreateInput = z.infer<typeof bulkCreateSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

function getRequestUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://repwell.ai";
  return `${baseUrl}/video-testimonial/${token}`;
}

/**
 * Sanitize search input to prevent PostgREST filter injection
 * Escapes special characters that could be used to inject additional filter conditions
 */
function sanitizeSearchInput(input: string): string {
  // Escape PostgREST special characters: % (wildcard), . (operator separator),
  // , (filter separator), ( and ) (grouping), : (value separator)
  // Also escape backslash to prevent escape sequence injection
  return input
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/\./g, "\\.")
    .replace(/,/g, "\\,")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/:/g, "\\:");
}

async function checkOrganizationVideoTestimonialAccess(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const { data: org, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", organizationId)
    .single();

  if (error || !org) {
    return { allowed: false, reason: "Organization not found" };
  }

  // TODO: Add subscription tier check when implementing paid tiers
  return { allowed: true };
}

async function createAuditLogEntry(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  params: {
    organizationId: string;
    userId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    // Cast to any as organization_audit_logs table is not in generated types yet
    await (supabase as unknown as { from: (table: string) => { insert: (data: Record<string, unknown>) => Promise<unknown> } })
      .from("organization_audit_logs")
      .insert({
        organization_id: params.organizationId,
        user_id: params.userId,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        metadata: params.metadata as Json,
        created_at: new Date().toISOString(),
      });
  } catch (error) {
    // Log but don't fail the main operation
    console.error("Failed to create audit log entry:", error);
  }
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Create a single video testimonial request
 * - Validates input with Zod
 * - Checks organization access
 * - Creates request with auto-generated token
 * - Queues initial email and schedules reminders
 * - Creates audit log entry
 */
export async function createVideoTestimonialRequest(
  input: CreateVideoTestimonialRequestInput
): Promise<ActionResult<CreateVideoTestimonialRequestResult>> {
  console.error("=== [VideoTestimonial] createVideoTestimonialRequest START ===");
  console.error("[VideoTestimonial] Input:", JSON.stringify(input, null, 2));

  try {
    // Validate input
    const validated = createVideoTestimonialRequestSchema.safeParse(input);
    console.error("[VideoTestimonial] Validation result:", validated.success);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Validation failed",
      };
    }

    const supabase = createAdminClient();

    // Check authentication
    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Check organization video testimonial access
    const accessCheck = await checkOrganizationVideoTestimonialAccess(
      supabase,
      userData.organization_id
    );
    if (!accessCheck.allowed) {
      return {
        success: false,
        error: accessCheck.reason || "Video testimonials not available",
      };
    }

    // Verify target user belongs to same organization
    const { data: targetUser, error: targetUserError } = await supabase
      .from("users")
      .select("id, organization_id, full_name")
      .eq("id", validated.data.loanOfficerId)
      .single();

    if (targetUserError || !targetUser) {
      return { success: false, error: "User not found" };
    }

    if (targetUser.organization_id !== userData.organization_id) {
      return { success: false, error: "User not in your organization" };
    }

    // Check for existing pending request for same customer/LO
    const { data: existingRequest } = await supabase
      .from("video_testimonial_requests")
      .select("id, status")
      .eq("organization_id", userData.organization_id)
      .eq("user_id", validated.data.loanOfficerId)
      .eq("customer_email", validated.data.customerEmail)
      .in("status", ["pending", "queued", "sent", "opened", "recording"])
      .limit(1)
      .single();

    if (existingRequest) {
      return {
        success: false,
        error: "A video testimonial request already exists for this customer",
      };
    }

    // Calculate scheduled time
    const now = new Date();
    const requestedTime = validated.data.scheduledAt
      ? new Date(validated.data.scheduledAt)
      : now;
    const scheduledAt = requestedTime > now ? requestedTime : now;

    // Calculate expiration (14 days from scheduled send)
    const expiresAt = new Date(scheduledAt);
    expiresAt.setDate(expiresAt.getDate() + 14);
    const nowIso = new Date().toISOString();
    const initialStatus = validated.data.sendImmediately ? "pending" : "queued";

    // Resolve (or create) the Contact for this acquisition request (ADR 0004).
    // Owner = the professional the request is for; inline name/email/phone stay
    // on the request as the immutable Send-Time Snapshot. Resilient: a contacts
    // hiccup must not block the send — suppression is enforced at send time.
    let contactId: string | null = null;
    try {
      const contact = await findOrCreateContact(
        userData.organization_id,
        {
          email: validated.data.customerEmail,
          name: validated.data.customerName,
          phone: validated.data.customerPhone || null,
        },
        validated.data.loanOfficerId,
        "video_testimonial"
      );
      contactId = contact.id;
    } catch (contactError) {
      console.error(
        "createVideoTestimonialRequest: contact resolution failed",
        contactError
      );
    }

    // Create the video testimonial request. Untyped admin client because
    // contact_id is a new column not yet in the generated types.
    const { data: request, error: requestError } = await createUntypedAdminClient()
      .from("video_testimonial_requests")
      .insert({
        organization_id: userData.organization_id,
        user_id: validated.data.loanOfficerId,
        contact_id: contactId,
        created_by: user.id,
        customer_name: validated.data.customerName,
        customer_email: validated.data.customerEmail,
        customer_phone: validated.data.customerPhone || null,
        transaction_id: validated.data.transactionId || null,
        transaction_type: validated.data.transactionType || null,
        transaction_date: validated.data.transactionDate || null,
        max_duration_seconds: validated.data.maxDurationSeconds,
        prompt_text: validated.data.promptText || null,
        status: initialStatus,
        expires_at: expiresAt.toISOString(),
        source: "manual",
        last_transition_at: nowIso,
        last_transition_source: "dashboard_create",
        last_transition_reason: validated.data.sendImmediately
          ? "Request created for immediate send"
          : "Request created and queued for scheduled send",
        source_metadata: {
          created_by: user.id,
          send_immediately: validated.data.sendImmediately,
          created_via: "dashboard",
        } as Json,
      })
      .select("id, token")
      .single();

    if (requestError || !request) {
      console.error("Failed to create video testimonial request:", requestError);
      return { success: false, error: "Failed to create request" };
    }

    const adminSupabase = createAdminClient();
    let emailStatus: "sent" | "queued" | "created" = "created";
    let emailError: string | undefined;

    console.error("[VideoTestimonial] Request created, processing email", {
      requestId: request.id,
      sendImmediately: validated.data.sendImmediately,
    });

    // Send initial email immediately or queue based on sendImmediately flag
    if (validated.data.sendImmediately) {
      // Send immediately for better UX on single requests
      console.error("[VideoTestimonial] Calling sendInitialVideoTestimonialEmailImmediately");
      const sendResult = await sendInitialVideoTestimonialEmailImmediately(request.id);
      console.error("[VideoTestimonial] Immediate send result", sendResult);
      if (sendResult.success) {
        emailStatus = "sent";
      } else {
        emailError = sendResult.error;
        console.error("[VideoTestimonial] Immediate send failed, falling back to queue", { emailError });
        // Fall back to queueing if immediate send fails
        const { error: queueError } = await supabase
          .from("video_testimonial_queue")
          .insert({
            organization_id: userData.organization_id,
            request_id: request.id,
            type: "initial",
            scheduled_at: new Date().toISOString(),
            priority: 10,
            status: "pending",
          });
        if (!queueError) {
          emailStatus = "queued";
          await supabase
            .from("video_testimonial_requests")
            .update({
              status: "queued",
              last_transition_at: new Date().toISOString(),
              last_transition_source: "queue_fallback",
              last_transition_reason: "Immediate send failed; request queued",
            } as Record<string, unknown>)
            .eq("id", request.id)
            .eq("status", "pending");
        }
        console.error("[VideoTestimonial] Queue fallback result", { queueError: queueError?.message, emailStatus });
      }
    } else {
      // Queue for scheduled delivery
      const { error: queueError } = await supabase
        .from("video_testimonial_queue")
        .insert({
          organization_id: userData.organization_id,
          request_id: request.id,
          type: "initial",
          scheduled_at: scheduledAt.toISOString(),
          priority: 1,
          status: "pending",
        });
      if (!queueError) {
        emailStatus = "queued";
        await supabase
          .from("video_testimonial_requests")
          .update({
            status: "queued",
            last_transition_at: new Date().toISOString(),
            last_transition_source: "queue_schedule",
            last_transition_reason: "Request queued for scheduled delivery",
          } as Record<string, unknown>)
          .eq("id", request.id);
      }
    }

    // Schedule 3-day and 7-day reminders using database function
    await adminSupabase.rpc("schedule_video_testimonial_reminders", {
      p_request_id: request.id,
      p_organization_id: userData.organization_id,
      p_send_3day: true,
      p_send_7day: true,
    });

    // Create audit log entry
    await createAuditLogEntry(adminSupabase, {
      organizationId: userData.organization_id,
      userId: user.id,
      action: "video_testimonial_request_created",
      resourceType: "video_testimonial_request",
      resourceId: request.id,
      metadata: {
        customer_email: validated.data.customerEmail,
        customer_name: validated.data.customerName,
        user_id: validated.data.loanOfficerId,
        professional_name: targetUser.full_name,
        scheduled_at: scheduledAt.toISOString(),
        send_immediately: validated.data.sendImmediately,
        email_status: emailStatus,
      },
    });

    revalidatePath("/dashboard/video-testimonials");

    const requestUrl = getRequestUrl(request.token);

    return {
      success: true,
      data: {
        requestId: request.id,
        token: request.token,
        requestUrl,
        status: emailStatus,
        message: emailStatus === "sent"
          ? "Request created and email sent"
          : emailStatus === "queued"
          ? validated.data.sendImmediately
            ? `Email queued (${emailError || "will retry"})`
            : `Request scheduled for ${scheduledAt.toISOString()}`
          : "Request created",
      },
    };
  } catch (error) {
    console.error("Error creating video testimonial request:", error);
    return { success: false, error: "Failed to create video testimonial request" };
  }
}

/**
 * Create multiple video testimonial requests in bulk
 * - Validates all inputs
 * - Creates requests individually to handle partial failures
 * - For batches > IMMEDIATE_SEND_THRESHOLD, queues emails instead of sending immediately
 * - Returns detailed results for each request
 */
export async function createBulkVideoTestimonialRequests(
  input: BulkCreateInput
): Promise<ActionResult<BulkCreateResult>> {
  try {
    // Validate bulk input
    const validated = bulkCreateSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Validation failed",
      };
    }

    const supabase = createAdminClient();

    // Check authentication
    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Check organization video testimonial access once
    const accessCheck = await checkOrganizationVideoTestimonialAccess(
      supabase,
      userData.organization_id
    );
    if (!accessCheck.allowed) {
      return {
        success: false,
        error: accessCheck.reason || "Video testimonials not available",
      };
    }

    const results: BulkCreateResult = {
      successful: [],
      failed: [],
      totalCreated: 0,
      totalFailed: 0,
    };

    // Determine if we should use queueing (bulk > threshold avoids HTTP timeout)
    const useBulkQueueing = validated.data.requests.length > IMMEDIATE_SEND_THRESHOLD;

    // Process each request individually
    for (const requestInput of validated.data.requests) {
      // For large batches, force queueing to avoid HTTP timeout
      const inputWithQueueOverride = useBulkQueueing
        ? { ...requestInput, sendImmediately: false }
        : requestInput;

      const result = await createVideoTestimonialRequest(inputWithQueueOverride);

      if (result.success && result.data) {
        results.successful.push(result.data);
        results.totalCreated++;
      } else {
        results.failed.push({
          input: requestInput,
          error: result.error || "Unknown error",
        });
        results.totalFailed++;
      }
    }

    // Create bulk audit log entry
    const adminSupabase = createAdminClient();
    await createAuditLogEntry(adminSupabase, {
      organizationId: userData.organization_id,
      userId: user.id,
      action: "video_testimonial_bulk_request_created",
      resourceType: "video_testimonial_request",
      resourceId: "bulk",
      metadata: {
        total_requested: validated.data.requests.length,
        total_created: results.totalCreated,
        total_failed: results.totalFailed,
        request_ids: results.successful.map((r) => r.requestId),
      },
    });

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    console.error("Error creating bulk video testimonial requests:", error);
    return { success: false, error: "Failed to create bulk requests" };
  }
}

/**
 * Get video testimonial requests with filtering and pagination
 */
export async function getVideoTestimonialRequests(params?: {
  status?: string;
  loanOfficerId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<
  ActionResult<{
    requests: VideoTestimonialRequest[];
    total: number;
  }>
> {
  try {
    const supabase = createAdminClient();

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 25;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("video_testimonial_requests")
      .select(
        `
        id,
        token,
        organization_id,
        user_id,
        customer_name,
        customer_email,
        customer_phone,
        transaction_id,
        transaction_type,
        transaction_date,
        max_duration_seconds,
        prompt_text,
        status,
        sent_at,
        opened_at,
        submitted_at,
        expires_at,
        reminder_count,
        source,
        created_at
      `,
        { count: "exact" }
      )
      .eq("organization_id", userData.organization_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    // Apply filters
    if (params?.status) {
      query = query.eq("status", params.status as VideoTestimonialRequestStatus);
    }

    if (params?.loanOfficerId) {
      query = query.eq("user_id", params.loanOfficerId);
    }

    if (params?.search) {
      // Sanitize search input to prevent PostgREST filter injection
      const sanitized = sanitizeSearchInput(params.search);
      query = query.or(
        `customer_name.ilike.%${sanitized}%,customer_email.ilike.%${sanitized}%`
      );
    }

    // Role-based filtering: users see only their own requests
    if (userData.role === "user") {
      const { data: userRecord } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      if (userRecord) {
        query = query.eq("user_id", userRecord.id);
      } else {
        // Security: If no user record found, return empty results
        // to prevent unauthorized access to organization data
        return {
          success: true,
          data: {
            requests: [],
            total: 0,
          },
        };
      }
    }

    const { data, count, error } = await query;

    if (error) {
      console.error("Error fetching video testimonial requests:", error);
      return { success: false, error: error.message };
    }

    const requests: VideoTestimonialRequest[] = (data || []).map((req) => ({
      id: req.id,
      token: req.token,
      organizationId: req.organization_id,
      loanOfficerId: req.user_id,
      customerName: req.customer_name,
      customerEmail: req.customer_email,
      customerPhone: req.customer_phone,
      transactionId: req.transaction_id,
      transactionType: req.transaction_type,
      transactionDate: req.transaction_date,
      maxDurationSeconds: req.max_duration_seconds || 120,
      promptText: req.prompt_text,
      status: req.status,
      sentAt: req.sent_at,
      openedAt: req.opened_at,
      submittedAt: req.submitted_at,
      expiresAt: req.expires_at,
      reminderCount: req.reminder_count || 0,
      source: req.source || "manual",
      createdAt: req.created_at,
      requestUrl: getRequestUrl(req.token),
    }));

    return {
      success: true,
      data: {
        requests,
        total: count ?? 0,
      },
    };
  } catch (error) {
    console.error("Error fetching video testimonial requests:", error);
    return { success: false, error: "Failed to fetch requests" };
  }
}

/**
 * Get aggregate stats for video testimonial requests
 */
export interface VideoRequestStats {
  total: number;
  pending: number;
  sent: number;
  completed: number;
  expired: number;
}

export async function getVideoTestimonialRequestStats(params?: {
  loanOfficerId?: string;
}): Promise<ActionResult<VideoRequestStats>> {
  try {
    const supabase = createAdminClient();

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Build base query for the organization
    let query = supabase
      .from("video_testimonial_requests")
      .select("status", { count: "exact", head: false })
      .eq("organization_id", userData.organization_id);

    // Filter by user if specified or if user has role "user"
    if (params?.loanOfficerId) {
      query = query.eq("user_id", params.loanOfficerId);
    } else if (userData.role === "user") {
      query = query.eq("user_id", user.id);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error("Error fetching video request stats:", error);
      return { success: false, error: "Failed to fetch stats" };
    }

    // Count by status
    const stats: VideoRequestStats = {
      total: requests?.length ?? 0,
      pending: 0,
      sent: 0,
      completed: 0,
      expired: 0,
    };

    for (const req of requests ?? []) {
      switch (req.status) {
        case "pending":
        case "queued":
          stats.pending++;
          break;
        case "sent":
        case "opened":
        case "recording":
          stats.sent++;
          break;
        case "submitted":
        case "completed":
          stats.completed++;
          break;
        case "expired":
        case "cancelled":
          stats.expired++;
          break;
      }
    }

    return { success: true, data: stats };
  } catch (error) {
    console.error("Error fetching video testimonial request stats:", error);
    return { success: false, error: "Failed to fetch stats" };
  }
}

/**
 * Get a single video testimonial request by ID
 */
export async function getVideoTestimonialRequest(
  requestId: string
): Promise<ActionResult<VideoTestimonialRequest>> {
  try {
    const supabase = createAdminClient();

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    const { data: req, error } = await supabase
      .from("video_testimonial_requests")
      .select("*")
      .eq("id", requestId)
      .eq("organization_id", userData.organization_id)
      .single();

    if (error || !req) {
      return { success: false, error: "Request not found" };
    }

    const request: VideoTestimonialRequest = {
      id: req.id,
      token: req.token,
      organizationId: req.organization_id,
      loanOfficerId: req.user_id,
      customerName: req.customer_name,
      customerEmail: req.customer_email,
      customerPhone: req.customer_phone,
      transactionId: req.transaction_id,
      transactionType: req.transaction_type,
      transactionDate: req.transaction_date,
      maxDurationSeconds: req.max_duration_seconds || 120,
      promptText: req.prompt_text,
      status: req.status,
      sentAt: req.sent_at,
      openedAt: req.opened_at,
      submittedAt: req.submitted_at,
      expiresAt: req.expires_at,
      reminderCount: req.reminder_count || 0,
      source: req.source || "manual",
      createdAt: req.created_at,
      requestUrl: getRequestUrl(req.token),
    };

    return { success: true, data: request };
  } catch (error) {
    console.error("Error fetching video testimonial request:", error);
    return { success: false, error: "Failed to fetch request" };
  }
}

/**
 * Cancel a video testimonial request
 * - Updates status to cancelled
 * - Cancels pending queue items
 * - Creates audit log entry
 */
export async function cancelVideoTestimonialRequest(
  requestId: string
): Promise<ActionResult> {
  try {
    const supabase = createAdminClient();

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Only managers and admins can cancel requests
    if (!["admin", "manager"].includes(userData.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Get the request to verify ownership
    const { data: request, error: requestError } = await supabase
      .from("video_testimonial_requests")
      .select("id, status, customer_email, customer_name")
      .eq("id", requestId)
      .eq("organization_id", userData.organization_id)
      .single();

    if (requestError || !request) {
      return { success: false, error: "Request not found" };
    }

    if (["submitted", "cancelled", "expired"].includes(request.status)) {
      return { success: false, error: `Cannot cancel request with status: ${request.status}` };
    }

    const adminSupabase = createAdminClient();

    // Update request status
    const { error: updateError } = await adminSupabase
      .from("video_testimonial_requests")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      return { success: false, error: "Failed to cancel request" };
    }

    // Cancel pending queue items
    await adminSupabase
      .from("video_testimonial_queue")
      .update({ status: "cancelled" })
      .eq("request_id", requestId)
      .eq("status", "pending");

    // Create audit log entry
    await createAuditLogEntry(adminSupabase, {
      organizationId: userData.organization_id,
      userId: user.id,
      action: "video_testimonial_request_cancelled",
      resourceType: "video_testimonial_request",
      resourceId: requestId,
      metadata: {
        customer_email: request.customer_email,
        customer_name: request.customer_name,
        previous_status: request.status,
      },
    });

    revalidatePath("/dashboard/video-testimonials");

    return { success: true };
  } catch (error) {
    console.error("Error cancelling video testimonial request:", error);
    return { success: false, error: "Failed to cancel request" };
  }
}

/**
 * Resend a video testimonial request invitation
 * - Sends email immediately for better UX
 * - Falls back to queueing if immediate send fails
 * - Increments reminder count
 * - Creates audit log entry
 */
export async function resendVideoTestimonialRequest(
  requestId: string
): Promise<ActionResult<{ emailStatus: "sent" | "queued" }>> {
  console.error("=== [VideoTestimonial] resendVideoTestimonialRequest START ===", { requestId });

  try {
    const supabase = createAdminClient();

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Only managers and admins can resend requests
    if (!["admin", "manager"].includes(userData.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Get the request
    const { data: request, error: requestError } = await supabase
      .from("video_testimonial_requests")
      .select("id, status, reminder_count, customer_email, customer_name, expires_at")
      .eq("id", requestId)
      .eq("organization_id", userData.organization_id)
      .single();

    if (requestError || !request) {
      return { success: false, error: "Request not found" };
    }

    console.error("[VideoTestimonial] Resend request found", {
      requestId,
      status: request.status,
      customerEmail: request.customer_email,
    });

    // Check if request can be resent
    if (["submitted", "cancelled"].includes(request.status)) {
      return { success: false, error: `Cannot resend request with status: ${request.status}` };
    }

    // Check if expired
    if (request.expires_at && new Date(request.expires_at) < new Date()) {
      return { success: false, error: "Request has expired" };
    }

    const adminSupabase = createAdminClient();
    let emailStatus: "sent" | "queued" = "queued";

    // Try to send immediately first
    console.error("[VideoTestimonial] Attempting immediate send for resend");
    const sendResult = await sendInitialVideoTestimonialEmailImmediately(requestId);
    console.error("[VideoTestimonial] Resend immediate send result", sendResult);

    if (sendResult.success) {
      emailStatus = "sent";
    } else {
      // Fall back to queueing if immediate send fails
      console.error("[VideoTestimonial] Immediate send failed, falling back to queue", { error: sendResult.error });

      // Cancel any existing pending queue items for this request
      await adminSupabase
        .from("video_testimonial_queue")
        .update({ status: "cancelled" })
        .eq("request_id", requestId)
        .eq("status", "pending");

      // Create new queue entry
      const { error: queueError } = await adminSupabase
        .from("video_testimonial_queue")
        .insert({
          organization_id: userData.organization_id,
          request_id: requestId,
          type: "initial",
          scheduled_at: new Date().toISOString(),
          priority: 10,
          status: "pending",
          retry_count: 0,
          error_message: null,
        });

      if (queueError) {
        console.error("Failed to queue resend:", queueError);
        return { success: false, error: "Failed to queue resend" };
      }
    }

    // Update reminder count
    await adminSupabase
      .from("video_testimonial_requests")
      .update({
        reminder_count: (request.reminder_count || 0) + 1,
        last_reminder_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    // Create audit log entry
    await createAuditLogEntry(adminSupabase, {
      organizationId: userData.organization_id,
      userId: user.id,
      action: "video_testimonial_request_resent",
      resourceType: "video_testimonial_request",
      resourceId: requestId,
      metadata: {
        customer_email: request.customer_email,
        customer_name: request.customer_name,
        reminder_count: (request.reminder_count || 0) + 1,
      },
    });

    revalidatePath("/dashboard/video-testimonials");

    console.error("[VideoTestimonial] Resend completed successfully", { emailStatus });

    return {
      success: true,
      data: { emailStatus },
    };
  } catch (error) {
    console.error("Error resending video testimonial request:", error);
    return { success: false, error: "Failed to resend request" };
  }
}

/**
 * Get video testimonial queue items for the organization
 */
export async function getVideoTestimonialQueue(params?: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<ActionResult<{ items: VideoTestimonialQueueItem[]; total: number }>> {
  try {
    const supabase = createAdminClient();

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Only managers and admins can view queue
    if (!["admin", "manager"].includes(userData.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 25;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("video_testimonial_queue")
      .select(
        `
        id,
        request_id,
        type,
        scheduled_at,
        processed_at,
        status,
        retry_count,
        error_message,
        video_testimonial_requests!inner (
          customer_name,
          customer_email
        )
      `,
        { count: "exact" }
      )
      .eq("organization_id", userData.organization_id)
      .order("scheduled_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (params?.status) {
      query = query.eq("status", params.status);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error("Error fetching video testimonial queue:", error);
      return { success: false, error: error.message };
    }

    const items: VideoTestimonialQueueItem[] = (data || []).map((item) => {
      const request = item.video_testimonial_requests as unknown as {
        customer_name: string;
        customer_email: string;
      };

      return {
        id: item.id,
        requestId: item.request_id,
        type: item.type,
        scheduledAt: item.scheduled_at,
        processedAt: item.processed_at,
        status: item.status || "pending",
        retryCount: item.retry_count || 0,
        errorMessage: item.error_message,
        customerName: request.customer_name,
        customerEmail: request.customer_email,
        loanOfficerName: undefined,
      };
    });

    return {
      success: true,
      data: {
        items,
        total: count ?? 0,
      },
    };
  } catch (error) {
    console.error("Error fetching video testimonial queue:", error);
    return { success: false, error: "Failed to fetch queue" };
  }
}

/**
 * Get users available for video testimonial requests
 */
export async function getUsersForVideoRequests(): Promise<
  ActionResult<Array<{ id: string; fullName: string; email: string }>>
> {
  try {
    const supabase = createAdminClient();

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email")
      .eq("organization_id", userData.organization_id)
      .eq("is_active", true)
      .order("full_name", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    const users = (data || []).map((user) => ({
      id: user.id,
      fullName: user.full_name || "Unknown",
      email: user.email,
    }));

    return { success: true, data: users };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}

/** @deprecated Use getUsersForVideoRequests instead */
export const getLoanOfficersForVideoRequests = getUsersForVideoRequests;

// ============================================================================
// Video Response Types (for Video Library)
// ============================================================================

type VideoTestimonialApprovalStatus =
  Database["public"]["Enums"]["video_testimonial_approval_status"];

export interface VideoTestimonialResponse {
  id: string;
  requestId: string;
  organizationId: string;
  loanOfficerId: string;
  videoUrl: string;
  videoPath: string;
  videoPreviewUrl?: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  fileSizeBytes: number | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  transcription: string | null;
  transcriptionStatus: string | null;
  aiGeneratedText: string | null;
  aiGenerationStatus: string | null;
  keyPhrases: string[] | null;
  sentimentScore: number | null;
  sentimentLabel: string | null;
  customerRating: number | null;
  quarantined: boolean;
  approvalStatus: VideoTestimonialApprovalStatus;
  approvedAt: string | null;
  rejectionReason: string | null;
  managerNotes: string | null;
  changesRequestedAt: string | null;
  publishedAt: string | null;
  publishedPlatforms: string[] | null;
  submittedAt: string;
  createdAt: string;
  // Joined data
  customerName: string;
  customerEmail: string;
  loanOfficerName?: string;
  loanOfficerUserId?: string;
}

export interface VideoLibraryStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  published: number;
  averageDuration: number;
  totalDuration: number;
}

// ============================================================================
// Video Response Server Actions
// ============================================================================

/**
 * Get video testimonial responses (submitted videos) with filtering and pagination
 */
export async function getVideoTestimonialResponses(params?: {
  approvalStatus?: string;
  loanOfficerId?: string;
  transcriptionStatus?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<
  ActionResult<{
    responses: VideoTestimonialResponse[];
    total: number;
    stats: VideoLibraryStats;
  }>
> {
  try {
    const supabase = createAdminClient();

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 24;
    const offset = (page - 1) * pageSize;

    // Build query for responses
    let query = supabase
      .from("video_testimonial_responses")
      .select(
        `
        id,
        request_id,
        organization_id,
        user_id,
        video_url,
        video_path,
        thumbnail_url,
        duration_seconds,
        file_size_bytes,
        mime_type,
        width,
        height,
        transcription,
        transcription_status,
        ai_generated_text,
        ai_generation_status,
        key_phrases,
        sentiment_score,
        sentiment_label,
        customer_rating,
        quarantined,
        approval_status,
        approved_at,
        rejection_reason,
        manager_notes,
        changes_requested_at,
        published_at,
        published_platforms,
        submitted_at,
        created_at,
        video_testimonial_requests!inner (
          customer_name,
          customer_email
        )
      `,
        { count: "exact" }
      )
      .eq("organization_id", userData.organization_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    // Apply filters
    if (params?.approvalStatus) {
      query = query.eq(
        "approval_status",
        params.approvalStatus as VideoTestimonialApprovalStatus
      );
    }

    if (params?.loanOfficerId) {
      query = query.eq("user_id", params.loanOfficerId);
    }

    if (params?.transcriptionStatus) {
      query = query.eq("transcription_status", params.transcriptionStatus);
    }

    // Search filter by customer name (via joined video_testimonial_requests)
    if (params?.search) {
      // Sanitize search input to prevent PostgREST filter injection
      const sanitized = sanitizeSearchInput(params.search);
      query = query.ilike(
        "video_testimonial_requests.customer_name",
        `%${sanitized}%`
      );
    }

    // Role-based filtering: users see only their own responses
    let userIdForFilter: string | null = null;
    if (userData.role === "user") {
      const { data: userRecord } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      if (userRecord) {
        userIdForFilter = userRecord.id;
        query = query.eq("user_id", userRecord.id);
      } else {
        return {
          success: true,
          data: {
            responses: [],
            total: 0,
            stats: {
              total: 0,
              pending: 0,
              approved: 0,
              rejected: 0,
              published: 0,
              averageDuration: 0,
              totalDuration: 0,
            },
          },
        };
      }
    }

    const { data, count, error } = await query;

    if (error) {
      console.error("Error fetching video testimonial responses:", error);
      return { success: false, error: error.message };
    }

    // Fetch stats with same filters as main query (respects role-based access)
    let statsQuery = supabase
      .from("video_testimonial_responses")
      .select("approval_status, duration_seconds")
      .eq("organization_id", userData.organization_id);

    // Apply user filter to stats for regular users
    if (userIdForFilter) {
      statsQuery = statsQuery.eq("user_id", userIdForFilter);
    }

    const { data: allResponses } = await statsQuery;

    // Calculate all stats in a single pass for efficiency
    const stats = (allResponses || []).reduce<VideoLibraryStats>(
      (acc, r) => {
        acc.total++;
        acc.totalDuration += r.duration_seconds || 0;
        switch (r.approval_status) {
          case "pending": acc.pending++; break;
          case "changes_requested": acc.pending++; break; // Count changes_requested as pending
          case "approved": acc.approved++; break;
          case "rejected": acc.rejected++; break;
          case "published": acc.published++; break;
        }
        return acc;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0, published: 0, totalDuration: 0, averageDuration: 0 }
    );
    stats.averageDuration =
      stats.total > 0 ? Math.round(stats.totalDuration / stats.total) : 0;

    const responses: VideoTestimonialResponse[] = await Promise.all(
      (data || []).map(async (res) => {
        const request = res.video_testimonial_requests as unknown as {
          customer_name: string;
          customer_email: string;
        };
        let videoPreviewUrl: string | null = null;
        if (res.video_path) {
          const { data: signedPreview } = await supabase.storage
            .from("video-testimonials")
            .createSignedUrl(res.video_path.replace(/^\/+/, ""), 3600);
          videoPreviewUrl = signedPreview?.signedUrl ?? null;
        }

        return {
          id: res.id,
          requestId: res.request_id,
          organizationId: res.organization_id,
          loanOfficerId: res.user_id,
          videoUrl: res.video_url,
          videoPath: res.video_path,
          videoPreviewUrl,
          thumbnailUrl: res.thumbnail_url,
          durationSeconds: res.duration_seconds,
          fileSizeBytes: res.file_size_bytes,
          mimeType: res.mime_type,
          width: res.width,
          height: res.height,
          transcription: res.transcription,
          transcriptionStatus: res.transcription_status,
          aiGeneratedText: res.ai_generated_text,
          aiGenerationStatus: res.ai_generation_status,
          keyPhrases: res.key_phrases,
          sentimentScore: res.sentiment_score,
          sentimentLabel: res.sentiment_label,
          customerRating: res.customer_rating,
          quarantined: res.quarantined ?? false,
          approvalStatus: res.approval_status,
          approvedAt: res.approved_at,
          rejectionReason: res.rejection_reason,
          managerNotes: res.manager_notes,
          changesRequestedAt: res.changes_requested_at,
          publishedAt: res.published_at,
          publishedPlatforms: res.published_platforms,
          submittedAt: res.submitted_at,
          createdAt: res.created_at,
          customerName: request.customer_name,
          customerEmail: request.customer_email,
          loanOfficerName: undefined,
          loanOfficerUserId: res.user_id,
        };
      })
    );

    return {
      success: true,
      data: {
        responses,
        total: count ?? 0,
        stats,
      },
    };
  } catch (error) {
    console.error("Error fetching video testimonial responses:", error);
    return { success: false, error: "Failed to fetch video responses" };
  }
}

/**
 * Get a single video testimonial response by ID
 * - Enforces role-based access (users can only access their own videos)
 */
export async function getVideoTestimonialResponse(
  responseId: string
): Promise<ActionResult<VideoTestimonialResponse>> {
  try {
    const supabase = createAdminClient();

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Build query with organization filter
    let query = supabase
      .from("video_testimonial_responses")
      .select(
        `
        *,
        video_testimonial_requests!inner (
          customer_name,
          customer_email
        )
      `
      )
      .eq("id", responseId)
      .eq("organization_id", userData.organization_id);

    // Role-based access: users can only access their own videos
    if (userData.role === "user") {
      const { data: userRecord } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!userRecord) {
        return { success: false, error: "User profile not found" };
      }

      query = query.eq("user_id", userRecord.id);
    }

    const { data: res, error } = await query.single();

    if (error || !res) {
      return { success: false, error: "Video not found" };
    }

    const request = res.video_testimonial_requests as unknown as {
      customer_name: string;
      customer_email: string;
    };

    const response: VideoTestimonialResponse = {
      id: res.id,
      requestId: res.request_id,
      organizationId: res.organization_id,
      loanOfficerId: res.user_id,
      videoUrl: res.video_url,
      videoPath: res.video_path,
      thumbnailUrl: res.thumbnail_url,
      durationSeconds: res.duration_seconds,
      fileSizeBytes: res.file_size_bytes,
      mimeType: res.mime_type,
      width: res.width,
      height: res.height,
      transcription: res.transcription,
      transcriptionStatus: res.transcription_status,
      aiGeneratedText: res.ai_generated_text,
      aiGenerationStatus: res.ai_generation_status,
      keyPhrases: res.key_phrases,
      sentimentScore: res.sentiment_score,
      sentimentLabel: res.sentiment_label,
      customerRating: res.customer_rating,
      quarantined: res.quarantined ?? false,
      approvalStatus: res.approval_status,
      approvedAt: res.approved_at,
      rejectionReason: res.rejection_reason,
      managerNotes: res.manager_notes,
      changesRequestedAt: res.changes_requested_at,
      publishedAt: res.published_at,
      publishedPlatforms: res.published_platforms,
      submittedAt: res.submitted_at,
      createdAt: res.created_at,
      customerName: request.customer_name,
      customerEmail: request.customer_email,
      loanOfficerName: undefined,
      loanOfficerUserId: res.user_id,
    };

    return { success: true, data: response };
  } catch (error) {
    console.error("Error fetching video testimonial response:", error);
    return { success: false, error: "Failed to fetch video" };
  }
}

/**
 * Update video testimonial response approval status
 * Supports approve, reject, request_changes, and publish actions
 */
export async function updateVideoApprovalStatus(
  responseId: string,
  action: "approve" | "reject" | "request_changes" | "publish",
  options?: {
    reason?: string;
    managerNotes?: string;
    editedAiText?: string;
  }
): Promise<ActionResult> {
  try {
    // Input validation for text fields
    const MAX_REASON_LENGTH = 2000;
    const MAX_NOTES_LENGTH = 2000;
    const MAX_AI_TEXT_LENGTH = 5000;

    if (options?.reason && options.reason.length > MAX_REASON_LENGTH) {
      return { success: false, error: `Rejection reason cannot exceed ${MAX_REASON_LENGTH} characters` };
    }
    if (options?.managerNotes && options.managerNotes.length > MAX_NOTES_LENGTH) {
      return { success: false, error: `Manager notes cannot exceed ${MAX_NOTES_LENGTH} characters` };
    }
    if (options?.editedAiText && options.editedAiText.length > MAX_AI_TEXT_LENGTH) {
      return { success: false, error: `AI text cannot exceed ${MAX_AI_TEXT_LENGTH} characters` };
    }

    const supabase = createAdminClient();

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role, full_name")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Only managers and admins can change approval status
    if (!["admin", "manager"].includes(userData.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Verify the response belongs to the organization and get user info
    const { data: existing, error: existingError } = await supabase
      .from("video_testimonial_responses")
      .select(`
        id,
        approval_status,
        user_id,
        review_id,
        quarantined,
        approved_at,
        customer_rating,
        video_testimonial_requests!inner(customer_name)
      `)
      .eq("id", responseId)
      .eq("organization_id", userData.organization_id)
      .single();

    if (existingError || !existing) {
      return { success: false, error: "Video not found" };
    }

    const adminSupabase = createAdminClient();
    const now = new Date().toISOString();

    let newStatus: VideoTestimonialApprovalStatus;
    const updateData: Record<string, unknown> = {
      updated_at: now,
    };

    switch (action) {
      case "approve":
        newStatus = "approved";
        if (existing.approval_status === "approved") {
          return { success: true };
        }
        updateData.approval_status = newStatus;
        updateData.approved_at = now;
        updateData.approved_by = user.id;
        updateData.rejection_reason = null;
        updateData.manager_notes = options?.managerNotes || null;
        updateData.published_at = null;
        // Approving a quarantined (low path) response lifts the quarantine
        if (existing.quarantined) {
          updateData.quarantined = false;
        }
        if (options?.editedAiText) {
          updateData.ai_generated_text = options.editedAiText;
        }
        break;
      case "reject":
        newStatus = "rejected";
        if (existing.approval_status === "rejected") {
          return { success: true };
        }
        updateData.approval_status = newStatus;
        updateData.rejection_reason = options?.reason || null;
        updateData.manager_notes = options?.managerNotes || null;
        updateData.published_at = null;
        break;
      case "request_changes":
        newStatus = "changes_requested";
        if (existing.approval_status === "published") {
          return { success: false, error: `Cannot request changes for video with status "${existing.approval_status}"` };
        }
        updateData.approval_status = newStatus;
        updateData.manager_notes = options?.managerNotes || options?.reason || null;
        updateData.changes_requested_at = now;
        updateData.changes_requested_by = user.id;
        break;
      case "publish":
        if (existing.approval_status === "published") {
          return { success: true };
        }
        newStatus = "published";
        updateData.approval_status = newStatus;
        updateData.approved_at = existing.approved_at || now;
        updateData.approved_by = user.id;
        updateData.rejection_reason = null;
        updateData.manager_notes = options?.managerNotes || null;
        updateData.quarantined = false;
        updateData.published_at = now;
        break;
      default:
        return { success: false, error: "Invalid action" };
    }

    const { error: updateError } = await adminSupabase
      .from("video_testimonial_responses")
      .update(updateData)
      .eq("id", responseId);

    if (updateError) {
      console.error("Error updating video approval status:", updateError);
      return { success: false, error: "Failed to update status" };
    }

    // Video lifecycle is decoupled from the canonical review (publish
    // inversion): the review publishes via machine screening, and video
    // approve/publish only gates VIDEO surfaces. Only a video rejection
    // still pulls the linked review down.
    if (existing.review_id) {
      if (action === "reject") {
        const { error: reviewSyncError } = await adminSupabase
          .from("reviews")
          .update({
            status: "rejected",
            rejection_reason: `Video testimonial rejected: ${options?.reason || "No reason provided"}`,
            is_published: false,
            published_at: null,
            updated_at: now,
          })
          .eq("id", existing.review_id);

        if (reviewSyncError) {
          console.error(
            "Unified review: failed to sync review rejection for video testimonial:",
            reviewSyncError
          );
        }
      } else if (options?.editedAiText) {
        // Published review text is immutable — only quarantined (pending)
        // reviews accept edited AI text.
        const { error: textSyncError } = await adminSupabase
          .from("reviews")
          .update({ text: options.editedAiText, updated_at: now })
          .eq("id", existing.review_id)
          .eq("status", "pending");

        if (textSyncError) {
          console.error(
            "Unified review: failed to sync edited AI text for video testimonial:",
            textSyncError
          );
        }
      }
    }

    // Asset Kit auto-generation (CONTEXT.md § Asset Generation): approving a
    // video at or above the org's celebration threshold queues the default
    // 9:16 Clip. Idempotent, so re-approvals don't re-render. Below-threshold
    // approvals stay manual via the asset creator.
    if (action === "approve" || action === "publish") {
      const customerRating =
        typeof existing.customer_rating === "number" ? existing.customer_rating : null;
      const organizationId = userData.organization_id;
      const actorUserId = user.id;

      after(async () => {
        try {
          const threshold = await getCelebrationThreshold(organizationId);
          if (customerRating === null || customerRating < threshold) return;

          await queueClipRender({
            organizationId,
            videoResponseId: responseId,
            actorUserId,
            options: { format: "9:16" },
            idempotent: true,
          });
        } catch (err) {
          console.error("Asset kit: failed to queue clip render on approval", {
            responseId,
            organizationId,
            error: err,
          });
        }
      });
    }

    // Create audit log entry
    await createAuditLogEntry(adminSupabase, {
      organizationId: userData.organization_id,
      userId: user.id,
      action: `video_testimonial_${action}`,
      resourceType: "video_testimonial_response",
      resourceId: responseId,
      metadata: {
        previous_status: existing.approval_status,
        new_status: newStatus,
        reason: options?.reason,
        manager_notes: options?.managerNotes,
        ai_text_edited: !!options?.editedAiText,
      },
    });

    // Send notification to user for relevant actions
    const request = existing.video_testimonial_requests as unknown as { customer_name: string };

    if (existing.user_id && ["approve", "reject", "request_changes"].includes(action)) {
      const notificationTitles: Record<string, string> = {
        approve: "Video Testimonial Approved",
        reject: "Video Testimonial Rejected",
        request_changes: "Changes Requested for Video Testimonial",
      };
      const notificationTitle = notificationTitles[action];

      const notificationMessages: Record<string, string> = {
        approve: `Your video testimonial from ${request.customer_name} has been approved by ${userData.full_name || "a manager"}.`,
        reject: `Your video testimonial from ${request.customer_name} has been rejected. ${options?.reason ? `Reason: ${options.reason}` : ""}`,
        request_changes: `Changes have been requested for the video testimonial from ${request.customer_name}. ${options?.managerNotes ? `Notes: ${options.managerNotes}` : ""}`,
      };
      const notificationMessage = notificationMessages[action];

      // Create in-app notification (don't block on failure)
      try {
        await (adminSupabase as unknown as { from: (table: string) => { insert: (data: Record<string, unknown>) => Promise<unknown> } })
          .from("notifications")
          .insert({
            user_id: existing.user_id,
            organization_id: userData.organization_id,
            type: action === "approve" ? "review_approved" : action === "reject" ? "review_rejected" : "system",
            title: notificationTitle,
            message: notificationMessage,
            action_url: `/dashboard/video-testimonials/library?id=${responseId}`,
            metadata: {
              video_response_id: responseId,
              action,
              manager_name: userData.full_name,
              customer_name: request.customer_name,
            },
          });
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
      }
    }

    revalidatePath("/dashboard/video-testimonials/library");
    revalidatePath("/dashboard/video-testimonials/approval");

    return { success: true };
  } catch (error) {
    console.error("Error updating video approval status:", error);
    return { success: false, error: "Failed to update status" };
  }
}

/**
 * Delete a video testimonial response
 */
export async function deleteVideoTestimonialResponse(
  responseId: string
): Promise<ActionResult> {
  try {
    const supabase = createAdminClient();

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Only admins can delete videos
    if (userData.role !== "admin") {
      return { success: false, error: "Only admins can delete videos" };
    }

    // Get the response to get the video path
    const { data: response, error: responseError } = await supabase
      .from("video_testimonial_responses")
      .select("id, video_path, review_id")
      .eq("id", responseId)
      .eq("organization_id", userData.organization_id)
      .single();

    if (responseError || !response) {
      return { success: false, error: "Video not found" };
    }

    const adminSupabase = createAdminClient();

    // Delete from storage
    if (response.video_path) {
      await adminSupabase.storage
        .from("video-testimonials")
        .remove([response.video_path]);
    }

    // Delete the database record
    const { error: deleteError } = await adminSupabase
      .from("video_testimonial_responses")
      .delete()
      .eq("id", responseId);

    if (deleteError) {
      console.error("Error deleting video testimonial response:", deleteError);
      return { success: false, error: "Failed to delete video" };
    }

    // Unified review model (ADR 0002): the function hard-deletes the video,
    // so hard-delete the canonical review with it. Legacy rows have no link.
    if (response.review_id) {
      const { error: reviewDeleteError } = await adminSupabase
        .from("reviews")
        .delete()
        .eq("id", response.review_id);

      if (reviewDeleteError) {
        console.error(
          "Unified review: failed to delete review linked to video testimonial:",
          reviewDeleteError
        );
      }
    }

    // Create audit log entry
    await createAuditLogEntry(adminSupabase, {
      organizationId: userData.organization_id,
      userId: user.id,
      action: "video_testimonial_deleted",
      resourceType: "video_testimonial_response",
      resourceId: responseId,
      metadata: {},
    });

    revalidatePath("/dashboard/video-testimonials/library");

    return { success: true };
  } catch (error) {
    console.error("Error deleting video testimonial response:", error);
    return { success: false, error: "Failed to delete video" };
  }
}

/**
 * Get signed URL for video playback
 * - Validates video exists in database and belongs to user's organization
 * - Enforces role-based access (users can only access their own videos)
 * - Prevents path traversal attacks
 */
export async function getVideoSignedUrl(
  videoPath: string
): Promise<ActionResult<{ signedUrl: string }>> {
  try {
    const supabase = createAdminClient();

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Sanitize path: remove leading slashes and reject path traversal
    const sanitizedPath = videoPath.replace(/^\/+/, "");
    if (sanitizedPath.includes("..") || sanitizedPath.includes("//")) {
      return { success: false, error: "Invalid video path" };
    }

    // Verify the video exists in database and belongs to the organization
    const { data: video, error: videoError } = await supabase
      .from("video_testimonial_responses")
      .select("id, video_path, user_id")
      .eq("video_path", sanitizedPath)
      .eq("organization_id", userData.organization_id)
      .single();

    if (videoError || !video) {
      return { success: false, error: "Video not found" };
    }

    // Role-based access: users can only access their own videos
    if (userData.role === "user") {
      if (video.user_id !== user.id) {
        return { success: false, error: "Access denied" };
      }
    }

    const { data, error } = await supabase.storage
      .from("video-testimonials")
      .createSignedUrl(sanitizedPath, 3600); // 1 hour expiry

    if (error || !data) {
      console.error("Error creating signed URL:", error);
      return { success: false, error: "Failed to create video URL" };
    }

    return { success: true, data: { signedUrl: data.signedUrl } };
  } catch (error) {
    console.error("Error getting signed URL:", error);
    return { success: false, error: "Failed to get video URL" };
  }
}

// ============================================================================
// Approval Workflow Server Actions
// ============================================================================

/**
 * Update AI-generated text for a video testimonial (manager editing)
 * - Validates permissions (admin/manager only)
 * - Creates audit log entry
 */
export async function updateVideoAIText(
  responseId: string,
  aiText: string
): Promise<ActionResult> {
  try {
    // Input validation
    const MAX_AI_TEXT_LENGTH = 5000;
    if (aiText.length > MAX_AI_TEXT_LENGTH) {
      return { success: false, error: `AI text cannot exceed ${MAX_AI_TEXT_LENGTH} characters` };
    }

    const supabase = createAdminClient();

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Only managers and admins can edit AI text
    if (!["admin", "manager"].includes(userData.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Verify the response belongs to the organization
    const { data: existing, error: existingError } = await supabase
      .from("video_testimonial_responses")
      .select("id, ai_generated_text, review_id")
      .eq("id", responseId)
      .eq("organization_id", userData.organization_id)
      .single();

    if (existingError || !existing) {
      return { success: false, error: "Video not found" };
    }

    const adminSupabase = createAdminClient();

    const { error: updateError } = await adminSupabase
      .from("video_testimonial_responses")
      .update({
        ai_generated_text: aiText,
        updated_at: new Date().toISOString(),
      })
      .eq("id", responseId);

    if (updateError) {
      console.error("Error updating AI text:", updateError);
      return { success: false, error: "Failed to update AI text" };
    }

    // Unified review model (ADR 0002): keep the canonical review text in
    // sync — but only while the review is quarantined (pending). Published
    // review text is immutable.
    if (existing.review_id) {
      const { error: reviewSyncError } = await adminSupabase
        .from("reviews")
        .update({
          text: aiText,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.review_id)
        .eq("status", "pending");

      if (reviewSyncError) {
        console.error(
          "Unified review: failed to sync review text for video testimonial:",
          reviewSyncError
        );
      }
    }

    // Create audit log entry
    await createAuditLogEntry(adminSupabase, {
      organizationId: userData.organization_id,
      userId: user.id,
      action: "video_testimonial_ai_text_edited",
      resourceType: "video_testimonial_response",
      resourceId: responseId,
      metadata: {
        previous_text_length: existing.ai_generated_text?.length || 0,
        new_text_length: aiText.length,
      },
    });

    revalidatePath("/dashboard/video-testimonials/library");
    revalidatePath("/dashboard/video-testimonials/approval");

    return { success: true };
  } catch (error) {
    console.error("Error updating AI text:", error);
    return { success: false, error: "Failed to update AI text" };
  }
}

/**
 * Bulk update video testimonial approval statuses
 * - Processes multiple videos with the same action
 * - Returns detailed results for each video
 */
export async function bulkUpdateVideoApprovalStatus(
  responseIds: string[],
  action: "approve" | "reject" | "request_changes",
  options?: {
    reason?: string;
    managerNotes?: string;
  }
): Promise<ActionResult<{
  successful: string[];
  failed: Array<{ id: string; error: string }>;
}>> {
  try {
    if (responseIds.length === 0) {
      return { success: false, error: "No videos selected" };
    }

    if (responseIds.length > 50) {
      return { success: false, error: "Maximum 50 videos per bulk operation" };
    }

    const supabase = createAdminClient();

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Only managers and admins can bulk update
    if (!["admin", "manager"].includes(userData.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    const results: { successful: string[]; failed: Array<{ id: string; error: string }> } = {
      successful: [],
      failed: [],
    };

    // Process each video
    for (const responseId of responseIds) {
      const result = await updateVideoApprovalStatus(responseId, action, options);
      if (result.success) {
        results.successful.push(responseId);
      } else {
        results.failed.push({ id: responseId, error: result.error || "Unknown error" });
      }
    }

    // Create bulk audit log entry
    const adminSupabase = createAdminClient();
    await createAuditLogEntry(adminSupabase, {
      organizationId: userData.organization_id,
      userId: user.id,
      action: `video_testimonial_bulk_${action}`,
      resourceType: "video_testimonial_response",
      resourceId: "bulk",
      metadata: {
        action,
        total_requested: responseIds.length,
        successful_count: results.successful.length,
        failed_count: results.failed.length,
        successful_ids: results.successful,
        failed_ids: results.failed.map((f) => f.id),
      },
    });

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    console.error("Error in bulk update:", error);
    return { success: false, error: "Failed to process bulk update" };
  }
}

/**
 * Get videos pending approval (for approval queue)
 * - Returns only pending and changes_requested videos
 * - Optimized for approval workflow
 */
export async function getVideosPendingApproval(params?: {
  page?: number;
  pageSize?: number;
  loanOfficerId?: string;
  search?: string;
}): Promise<
  ActionResult<{
    responses: VideoTestimonialResponse[];
    total: number;
    stats: { pending: number; changesRequested: number };
  }>
> {
  try {
    const supabase = createAdminClient();

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Only managers and admins can access approval queue
    if (!["admin", "manager"].includes(userData.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 24;
    const offset = (page - 1) * pageSize;

    // Build query for pending/changes_requested responses
    let query = supabase
      .from("video_testimonial_responses")
      .select(
        `
        id,
        request_id,
        organization_id,
        user_id,
        video_url,
        video_path,
        thumbnail_url,
        duration_seconds,
        file_size_bytes,
        mime_type,
        width,
        height,
        transcription,
        transcription_status,
        ai_generated_text,
        ai_generation_status,
        key_phrases,
        sentiment_score,
        sentiment_label,
        customer_rating,
        quarantined,
        approval_status,
        approved_at,
        rejection_reason,
        manager_notes,
        changes_requested_at,
        published_at,
        published_platforms,
        submitted_at,
        created_at,
        video_testimonial_requests!inner (
          customer_name,
          customer_email
        )
      `,
        { count: "exact" }
      )
      .eq("organization_id", userData.organization_id)
      .in("approval_status", ["pending", "changes_requested"])
      .order("submitted_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    // Apply filters
    if (params?.loanOfficerId) {
      query = query.eq("user_id", params.loanOfficerId);
    }

    if (params?.search) {
      // Sanitize search input to prevent PostgREST filter injection
      const sanitized = sanitizeSearchInput(params.search);
      query = query.ilike(
        "video_testimonial_requests.customer_name",
        `%${sanitized}%`
      );
    }

    const { data, count, error } = await query;

    if (error) {
      console.error("Error fetching pending videos:", error);
      return { success: false, error: error.message };
    }

    // Get stats
    const { data: statsData } = await supabase
      .from("video_testimonial_responses")
      .select("approval_status")
      .eq("organization_id", userData.organization_id)
      .in("approval_status", ["pending", "changes_requested"]);

    const stats = { pending: 0, changesRequested: 0 };
    (statsData || []).forEach((r) => {
      if (r.approval_status === "pending") stats.pending++;
      if (r.approval_status === "changes_requested") stats.changesRequested++;
    });

    const responses: VideoTestimonialResponse[] = (data || []).map((res) => {
      const request = res.video_testimonial_requests as unknown as {
        customer_name: string;
        customer_email: string;
      };

      return {
        id: res.id,
        requestId: res.request_id,
        organizationId: res.organization_id,
        loanOfficerId: res.user_id,
        videoUrl: res.video_url,
        videoPath: res.video_path,
        thumbnailUrl: res.thumbnail_url,
        durationSeconds: res.duration_seconds,
        fileSizeBytes: res.file_size_bytes,
        mimeType: res.mime_type,
        width: res.width,
        height: res.height,
        transcription: res.transcription,
        transcriptionStatus: res.transcription_status,
        aiGeneratedText: res.ai_generated_text,
        aiGenerationStatus: res.ai_generation_status,
        keyPhrases: res.key_phrases,
        sentimentScore: res.sentiment_score,
        sentimentLabel: res.sentiment_label,
        customerRating: res.customer_rating,
        quarantined: res.quarantined ?? false,
        approvalStatus: res.approval_status,
        approvedAt: res.approved_at,
        rejectionReason: res.rejection_reason,
        managerNotes: res.manager_notes,
        changesRequestedAt: res.changes_requested_at,
        publishedAt: res.published_at,
        publishedPlatforms: res.published_platforms,
        submittedAt: res.submitted_at,
        createdAt: res.created_at,
        customerName: request.customer_name,
        customerEmail: request.customer_email,
        loanOfficerName: undefined,
        loanOfficerUserId: res.user_id,
      };
    });

    return {
      success: true,
      data: {
        responses,
        total: count ?? 0,
        stats,
      },
    };
  } catch (error) {
    console.error("Error fetching pending videos:", error);
    return { success: false, error: "Failed to fetch pending videos" };
  }
}

// ============================================================================
// Queue Management Server Actions
// ============================================================================

export interface QueueStatus {
  isPaused: boolean;
  stats: {
    total: number;
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    cancelled: number;
  };
}

/**
 * Get video testimonial queue status for the organization
 * - Returns pause state and queue statistics
 */
export async function getVideoTestimonialQueueStatus(): Promise<
  ActionResult<QueueStatus>
> {
  try {
    const supabase = createAdminClient();

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Only managers and admins can view queue status
    if (!["admin", "manager"].includes(userData.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    const adminSupabase = createAdminClient();

    // Check if queue is paused
    // Note: organization_settings table doesn't exist, using organizations.settings instead
    const { data: orgData } = await adminSupabase
      .from("organizations")
      .select("settings")
      .eq("id", userData.organization_id)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settings = (orgData?.settings || {}) as Record<string, any>;
    const isPaused = settings.video_testimonial_queue_paused === true;

    // Get queue statistics
    const { data: queueData } = await adminSupabase
      .from("video_testimonial_queue")
      .select("status")
      .eq("organization_id", userData.organization_id);

    const stats = (queueData || []).reduce(
      (acc, item) => {
        acc.total++;
        if (item.status === "pending") acc.pending++;
        else if (item.status === "processing") acc.processing++;
        else if (item.status === "sent") acc.sent++;
        else if (item.status === "failed") acc.failed++;
        else if (item.status === "cancelled") acc.cancelled++;
        return acc;
      },
      { total: 0, pending: 0, processing: 0, sent: 0, failed: 0, cancelled: 0 }
    );

    return {
      success: true,
      data: {
        isPaused,
        stats,
      },
    };
  } catch (error) {
    console.error("Error fetching queue status:", error);
    return { success: false, error: "Failed to fetch queue status" };
  }
}

/**
 * Internal helper to set queue pause state
 */
async function setQueuePauseState(paused: boolean): Promise<ActionResult> {
  const action = paused ? "pause" : "resume";

  try {
    const supabase = createAdminClient();

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    if (userData.role !== "admin") {
      return { success: false, error: `Only admins can ${action} the queue` };
    }

    const adminSupabase = createAdminClient();

    // Fetch current settings
    const { data: orgData } = await adminSupabase
      .from("organizations")
      .select("settings")
      .eq("id", userData.organization_id)
      .single();

    const currentSettings = (orgData?.settings || {}) as Record<string, unknown>;
    const newSettings = {
      ...currentSettings,
      video_testimonial_queue_paused: paused,
    };

    const { error: updateError } = await adminSupabase
      .from("organizations")
      .update({ settings: newSettings })
      .eq("id", userData.organization_id);

    if (updateError) {
      console.error(`Error ${action}ing queue:`, updateError);
      return { success: false, error: `Failed to ${action} queue` };
    }

    await createAuditLogEntry(adminSupabase, {
      organizationId: userData.organization_id,
      userId: user.id,
      action: paused ? "video_testimonial_queue_paused" : "video_testimonial_queue_resumed",
      resourceType: "organization_settings",
      resourceId: userData.organization_id,
      metadata: {},
    });

    revalidatePath("/dashboard/video-testimonials");

    return { success: true };
  } catch (error) {
    console.error(`Error ${action}ing queue:`, error);
    return { success: false, error: `Failed to ${action} queue` };
  }
}

/**
 * Pause the video testimonial queue for the organization
 * - Prevents new emails from being sent until resumed
 */
export async function pauseVideoTestimonialQueue(): Promise<ActionResult> {
  return setQueuePauseState(true);
}

/**
 * Resume the video testimonial queue for the organization
 * - Allows pending emails to be processed again
 */
export async function resumeVideoTestimonialQueue(): Promise<ActionResult> {
  return setQueuePauseState(false);
}

/**
 * Retry failed queue items for the organization
 * - Resets failed items to pending for re-processing
 */
export async function retryFailedVideoTestimonialQueueItems(): Promise<
  ActionResult<{ retried: number }>
> {
  try {
    const supabase = createAdminClient();

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Only admins can retry failed items
    if (userData.role !== "admin") {
      return { success: false, error: "Only admins can retry failed items" };
    }

    const adminSupabase = createAdminClient();

    // Reset failed items to pending
    const { data: retriedItems, error: updateError } = await adminSupabase
      .from("video_testimonial_queue")
      .update({
        status: "pending",
        retry_count: 0,
        error_message: null,
        scheduled_at: new Date().toISOString(),
      })
      .eq("organization_id", userData.organization_id)
      .eq("status", "failed")
      .select("id");

    if (updateError) {
      console.error("Error retrying failed items:", updateError);
      return { success: false, error: "Failed to retry items" };
    }

    const retriedCount = retriedItems?.length ?? 0;

    // Create audit log entry
    await createAuditLogEntry(adminSupabase, {
      organizationId: userData.organization_id,
      userId: user.id,
      action: "video_testimonial_queue_retry",
      resourceType: "video_testimonial_queue",
      resourceId: "bulk",
      metadata: {
        retried_count: retriedCount,
      },
    });

    revalidatePath("/dashboard/video-testimonials");

    return {
      success: true,
      data: { retried: retriedCount },
    };
  } catch (error) {
    console.error("Error retrying failed items:", error);
    return { success: false, error: "Failed to retry items" };
  }
}
