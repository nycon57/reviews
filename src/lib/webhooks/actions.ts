"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { getNextRetryTime, shouldRetry, categorizeError, DEFAULT_RETRY_CONFIG } from "./retry";

export interface WebhookLog {
  id: string;
  eventType: string;
  status: string;
  payload: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  errorMessage: string | null;
  surveyId: string | null;
  processingTimeMs: number | null;
  createdAt: string;
  webhookConfigName: string | null;
}

export interface WebhookLogFilters {
  status?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  webhookConfigId?: string;
  search?: string;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface WebhookStats {
  total: number;
  processed: number;
  failed: number;
  received: number;
  ignored: number;
  byEventType: Record<string, number>;
  avgProcessingTimeMs: number;
  successRate: number;
}

// Database row type for webhook logs query
interface WebhookLogRow {
  id: string;
  event_type: string;
  status: string | null;
  payload: unknown;
  ip_address: unknown;
  user_agent: string | null;
  error_message: string | null;
  survey_id: string | null;
  processing_time_ms: number | null;
  created_at: string | null;
  webhook_configs: { name: string } | null;
}

// Map database row to WebhookLog interface
function mapRowToWebhookLog(row: WebhookLogRow): WebhookLog {
  return {
    id: row.id,
    eventType: row.event_type,
    status: row.status || "unknown",
    payload: row.payload as Record<string, unknown> | null,
    ipAddress: (row.ip_address as string) || null,
    userAgent: row.user_agent,
    errorMessage: row.error_message,
    surveyId: row.survey_id,
    processingTimeMs: row.processing_time_ms,
    createdAt: row.created_at || "",
    webhookConfigName: row.webhook_configs?.name || null,
  };
}

// Common admin authorization check
export async function requireAdminAccess(): Promise<
  { success: true; organizationId: string; userId: string } | { success: false; error: string }
> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (userError || !userData?.organization_id) {
    return { success: false, error: "Organization not found" };
  }

  if (userData.role !== "admin") {
    return { success: false, error: "Admin access required" };
  }

  return {
    success: true,
    organizationId: userData.organization_id,
    userId: userData.id,
  };
}

// Get webhook logs with advanced filtering
export async function getWebhookLogs(
  filters?: WebhookLogFilters,
  page: number = 1,
  pageSize: number = 25
): Promise<ActionResult<{ logs: WebhookLog[]; total: number }>> {
  try {
    const auth = await requireAdminAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    const supabase = createAdminClient();
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("webhook_logs")
      .select(
        `
        id,
        event_type,
        status,
        payload,
        ip_address,
        user_agent,
        error_message,
        survey_id,
        processing_time_ms,
        created_at,
        webhook_configs (
          name
        )
      `,
        { count: "exact" }
      )
      .eq("organization_id", auth.organizationId)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.eventType) {
      query = query.eq("event_type", filters.eventType);
    }
    if (filters?.webhookConfigId) {
      query = query.eq("webhook_config_id", filters.webhookConfigId);
    }
    if (filters?.startDate) {
      query = query.gte("created_at", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("created_at", filters.endDate);
    }

    const { data, count, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const logs = (data || []).map(mapRowToWebhookLog);

    return {
      success: true,
      data: { logs, total: count ?? 0 },
    };
  } catch (error) {
    console.error("Error fetching webhook logs:", error);
    return { success: false, error: "Failed to fetch webhook logs" };
  }
}

// Get webhook statistics
export async function getWebhookStats(
  startDate?: string,
  endDate?: string
): Promise<ActionResult<WebhookStats>> {
  try {
    const auth = await requireAdminAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    const supabase = createAdminClient();

    let query = supabase
      .from("webhook_logs")
      .select("status, event_type, processing_time_ms")
      .eq("organization_id", auth.organizationId);

    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const stats: WebhookStats = {
      total: data?.length ?? 0,
      processed: 0,
      failed: 0,
      received: 0,
      ignored: 0,
      byEventType: {},
      avgProcessingTimeMs: 0,
      successRate: 0,
    };

    let totalProcessingTime = 0;
    let processedWithTime = 0;

    for (const log of data || []) {
      switch (log.status) {
        case "processed":
          stats.processed++;
          break;
        case "failed":
          stats.failed++;
          break;
        case "received":
          stats.received++;
          break;
        case "ignored":
          stats.ignored++;
          break;
      }

      if (log.event_type) {
        stats.byEventType[log.event_type] = (stats.byEventType[log.event_type] || 0) + 1;
      }

      if (log.processing_time_ms !== null) {
        totalProcessingTime += log.processing_time_ms;
        processedWithTime++;
      }
    }

    if (processedWithTime > 0) {
      stats.avgProcessingTimeMs = Math.round(totalProcessingTime / processedWithTime);
    }

    if (stats.total > 0) {
      stats.successRate = Math.round((stats.processed / stats.total) * 100);
    }

    return { success: true, data: stats };
  } catch (error) {
    console.error("Error fetching webhook stats:", error);
    return { success: false, error: "Failed to fetch webhook statistics" };
  }
}

// Get a single webhook log with full details
export async function getWebhookLogDetail(logId: string): Promise<ActionResult<WebhookLog>> {
  try {
    const auth = await requireAdminAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("webhook_logs")
      .select(
        `
        id,
        event_type,
        status,
        payload,
        ip_address,
        user_agent,
        error_message,
        survey_id,
        processing_time_ms,
        created_at,
        webhook_configs (
          name
        )
      `
      )
      .eq("id", logId)
      .eq("organization_id", auth.organizationId)
      .single();

    if (error) {
      return { success: false, error: "Webhook log not found" };
    }

    return {
      success: true,
      data: mapRowToWebhookLog(data),
    };
  } catch (error) {
    console.error("Error fetching webhook log detail:", error);
    return { success: false, error: "Failed to fetch webhook log" };
  }
}

// Retry a failed webhook (for queue items)
export async function retryFailedQueueItem(
  queueItemId: string
): Promise<ActionResult<{ scheduledAt: string }>> {
  try {
    const auth = await requireAdminAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    const supabase = createAdminClient();

    const { data: queueItem, error: queueError } = await supabase
      .from("survey_distribution_queue")
      .select("id, status, retry_count, error_message, organization_id")
      .eq("id", queueItemId)
      .single();

    if (queueError || !queueItem) {
      return { success: false, error: "Queue item not found" };
    }

    if (queueItem.organization_id !== auth.organizationId) {
      return { success: false, error: "Queue item not in your organization" };
    }

    if (queueItem.status !== "failed") {
      return { success: false, error: "Can only retry failed items" };
    }

    const currentRetryCount = queueItem.retry_count || 0;

    if (queueItem.error_message) {
      const category = categorizeError(queueItem.error_message);
      if (category === "permanent") {
        return {
          success: false,
          error: "Cannot retry: permanent error. Please fix the issue and create a new request.",
        };
      }
    }

    if (!shouldRetry(currentRetryCount + 1, DEFAULT_RETRY_CONFIG)) {
      return {
        success: false,
        error: `Maximum retries (${DEFAULT_RETRY_CONFIG.maxRetries}) exceeded`,
      };
    }

    const nextRetryTime = getNextRetryTime(currentRetryCount + 1, DEFAULT_RETRY_CONFIG);

    const adminSupabase = createAdminClient();
    const { error: updateError } = await adminSupabase
      .from("survey_distribution_queue")
      .update({
        status: "pending",
        scheduled_at: nextRetryTime.toISOString(),
        retry_count: currentRetryCount + 1,
        error_message: null,
      })
      .eq("id", queueItemId);

    if (updateError) {
      return { success: false, error: "Failed to schedule retry" };
    }

    return {
      success: true,
      data: { scheduledAt: nextRetryTime.toISOString() },
    };
  } catch (error) {
    console.error("Error retrying queue item:", error);
    return { success: false, error: "Failed to retry queue item" };
  }
}

// Get unique event types for filtering
export async function getWebhookEventTypes(): Promise<ActionResult<string[]>> {
  try {
    const auth = await requireAdminAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("webhook_logs")
      .select("event_type")
      .eq("organization_id", auth.organizationId)
      .not("event_type", "is", null);

    if (error) {
      return { success: false, error: error.message };
    }

    const eventTypes = [...new Set((data || []).map((log) => log.event_type))];

    return { success: true, data: eventTypes.filter(Boolean) as string[] };
  } catch (error) {
    console.error("Error fetching event types:", error);
    return { success: false, error: "Failed to fetch event types" };
  }
}

// Schedule automatic retry for failed queue item with exponential backoff
export async function scheduleRetryWithBackoff(
  queueItemId: string,
  errorMessage: string
): Promise<void> {
  const auth = await requireAdminAccess();
  if (!auth.success) return;

  const adminSupabase = createAdminClient();

  // Get current retry count
  const { data: queueItem } = await adminSupabase
    .from("survey_distribution_queue")
    .select("retry_count, organization_id")
    .eq("id", queueItemId)
    .single();

  if (!queueItem) {
    return;
  }

  if (queueItem.organization_id !== auth.organizationId) {
    return;
  }

  const currentRetryCount = queueItem.retry_count || 0;
  const nextRetryNumber = currentRetryCount + 1;

  // Check if we should retry
  const category = categorizeError(errorMessage);
  if (category === "permanent") {
    // Mark as permanently failed
    await adminSupabase
      .from("survey_distribution_queue")
      .update({
        status: "failed",
        error_message: `Permanent error: ${errorMessage}`,
        processed_at: new Date().toISOString(),
        retry_count: nextRetryNumber,
      })
      .eq("id", queueItemId);
    return;
  }

  if (!shouldRetry(nextRetryNumber, DEFAULT_RETRY_CONFIG)) {
    // Max retries exceeded
    await adminSupabase
      .from("survey_distribution_queue")
      .update({
        status: "failed",
        error_message: `Max retries exceeded. Last error: ${errorMessage}`,
        processed_at: new Date().toISOString(),
        retry_count: nextRetryNumber,
      })
      .eq("id", queueItemId);
    return;
  }

  // Schedule retry with exponential backoff
  const nextRetryTime = getNextRetryTime(nextRetryNumber, DEFAULT_RETRY_CONFIG);

  await adminSupabase
    .from("survey_distribution_queue")
    .update({
      status: "pending",
      scheduled_at: nextRetryTime.toISOString(),
      error_message: errorMessage,
      retry_count: nextRetryNumber,
    })
    .eq("id", queueItemId);
}
