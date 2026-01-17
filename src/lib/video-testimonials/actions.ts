"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import type { Json, Database } from "@/types/database.types";

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
  status: "created" | "queued" | "failed";
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
  loanOfficerName: string;
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.repwell.com";
  return `${baseUrl}/video-testimonial/${token}`;
}

async function checkOrganizationVideoTestimonialAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Check organization subscription/settings for video testimonial access
  const { data: org, error } = await supabase
    .from("organizations")
    .select("settings, subscription_tier")
    .eq("id", organizationId)
    .single();

  if (error || !org) {
    return { allowed: false, reason: "Organization not found" };
  }

  // For now, allow all organizations - in production, check subscription tier
  // const settings = org.settings as Record<string, unknown> | null;
  // const hasVideoAccess = settings?.video_testimonials_enabled !== false;
  // const tierAllowed = ["pro", "enterprise"].includes(org.subscription_tier || "");

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
  try {
    // Validate input
    const validated = createVideoTestimonialRequestSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Validation failed",
      };
    }

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
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

    // Verify loan officer belongs to same organization
    const { data: loanOfficer, error: loError } = await supabase
      .from("loan_officers")
      .select("id, organization_id, full_name")
      .eq("id", validated.data.loanOfficerId)
      .single();

    if (loError || !loanOfficer) {
      return { success: false, error: "Loan officer not found" };
    }

    if (loanOfficer.organization_id !== userData.organization_id) {
      return { success: false, error: "Loan officer not in your organization" };
    }

    // Check for existing pending request for same customer/LO
    const { data: existingRequest } = await supabase
      .from("video_testimonial_requests")
      .select("id, status")
      .eq("organization_id", userData.organization_id)
      .eq("loan_officer_id", validated.data.loanOfficerId)
      .eq("customer_email", validated.data.customerEmail)
      .in("status", ["pending", "sent", "opened", "recording"])
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

    // Create the video testimonial request
    const { data: request, error: requestError } = await supabase
      .from("video_testimonial_requests")
      .insert({
        organization_id: userData.organization_id,
        loan_officer_id: validated.data.loanOfficerId,
        created_by: user.id,
        customer_name: validated.data.customerName,
        customer_email: validated.data.customerEmail,
        customer_phone: validated.data.customerPhone || null,
        transaction_id: validated.data.transactionId || null,
        transaction_type: validated.data.transactionType || null,
        transaction_date: validated.data.transactionDate || null,
        max_duration_seconds: validated.data.maxDurationSeconds,
        prompt_text: validated.data.promptText || null,
        status: "pending",
        expires_at: expiresAt.toISOString(),
        source: "manual",
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

    // Add to queue for initial email
    const { data: queueItem, error: queueError } = await supabase
      .from("video_testimonial_queue")
      .insert({
        organization_id: userData.organization_id,
        request_id: request.id,
        type: "initial",
        scheduled_at: scheduledAt.toISOString(),
        priority: validated.data.sendImmediately ? 10 : 1,
        status: "pending",
      })
      .select("id")
      .single();

    if (queueError) {
      console.error("Failed to queue video testimonial request:", queueError);
      // Don't fail - request was created, queue can be retried
    }

    // Schedule 3-day and 7-day reminders using database function
    const adminSupabase = createAdminClient();
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
        loan_officer_id: validated.data.loanOfficerId,
        loan_officer_name: loanOfficer.full_name,
        scheduled_at: scheduledAt.toISOString(),
        send_immediately: validated.data.sendImmediately,
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
        status: queueItem ? "queued" : "created",
        queueItemId: queueItem?.id,
        message: validated.data.sendImmediately
          ? "Request created and queued for immediate delivery"
          : `Request scheduled for ${scheduledAt.toISOString()}`,
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

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
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

    // Process each request individually
    for (const requestInput of validated.data.requests) {
      const result = await createVideoTestimonialRequest(requestInput);

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
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
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
        loan_officer_id,
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
      query = query.eq("loan_officer_id", params.loanOfficerId);
    }

    if (params?.search) {
      query = query.or(
        `customer_name.ilike.%${params.search}%,customer_email.ilike.%${params.search}%`
      );
    }

    // Role-based filtering: loan officers see only their own requests
    if (userData.role === "loan_officer") {
      const { data: loData } = await supabase
        .from("loan_officers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (loData) {
        query = query.eq("loan_officer_id", loData.id);
      } else {
        // Security: If no loan officer record found, return empty results
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
      loanOfficerId: req.loan_officer_id,
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
 * Get a single video testimonial request by ID
 */
export async function getVideoTestimonialRequest(
  requestId: string
): Promise<ActionResult<VideoTestimonialRequest>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
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
      loanOfficerId: req.loan_officer_id,
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
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
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
 * - Creates new queue entry for immediate send
 * - Increments reminder count
 * - Creates audit log entry
 */
export async function resendVideoTestimonialRequest(
  requestId: string
): Promise<ActionResult<{ queueItemId: string }>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
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

    // Check if request can be resent
    if (["submitted", "cancelled"].includes(request.status)) {
      return { success: false, error: `Cannot resend request with status: ${request.status}` };
    }

    // Check if expired
    if (request.expires_at && new Date(request.expires_at) < new Date()) {
      return { success: false, error: "Request has expired" };
    }

    const adminSupabase = createAdminClient();

    // Create new queue entry for immediate resend
    const { data: queueItem, error: queueError } = await adminSupabase
      .from("video_testimonial_queue")
      .insert({
        organization_id: userData.organization_id,
        request_id: requestId,
        type: `reminder_manual_${(request.reminder_count || 0) + 1}`,
        scheduled_at: new Date().toISOString(),
        priority: 10,
        status: "pending",
      })
      .select("id")
      .single();

    if (queueError) {
      console.error("Failed to queue resend:", queueError);
      return { success: false, error: "Failed to queue resend" };
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

    return {
      success: true,
      data: { queueItemId: queueItem.id },
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
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
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
          customer_email,
          loan_officers!inner (
            full_name
          )
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
        loan_officers: { full_name: string };
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
        loanOfficerName: request.loan_officers.full_name,
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
 * Get loan officers available for video testimonial requests
 */
export async function getLoanOfficersForVideoRequests(): Promise<
  ActionResult<Array<{ id: string; fullName: string; email: string }>>
> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
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
      .from("loan_officers")
      .select("id, full_name, email")
      .eq("organization_id", userData.organization_id)
      .eq("is_active", true)
      .order("full_name", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    const loanOfficers = (data || []).map((lo) => ({
      id: lo.id,
      fullName: lo.full_name,
      email: lo.email,
    }));

    return { success: true, data: loanOfficers };
  } catch (error) {
    console.error("Error fetching loan officers:", error);
    return { success: false, error: "Failed to fetch loan officers" };
  }
}
