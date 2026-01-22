"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/reviews/types";
import type {
  EmailMetrics,
  EmailTrendPoint,
  EmailTypePerformance,
  UnsubscribeMetrics,
  SequencePerformance,
  TimePeriod,
} from "./types";
import { getTemplateDisplayName, getTemplateCategory } from "./types";

// ============================================================================
// Validation Schemas
// ============================================================================

const timePeriodSchema = z.enum(["7d", "30d", "90d", "all"]);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sanitize a value for CSV export to prevent formula injection.
 * Values starting with =, +, -, @, tab, or carriage return can be
 * interpreted as formulas in spreadsheet applications.
 */
function sanitizeCSVValue(value: string | null | undefined): string {
  if (!value) return "";
  const str = String(value);
  // If the value starts with a potentially dangerous character, prefix with a single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

// Get admin context - requires admin role
async function getAdminContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData || userData.role !== "admin") {
    return null;
  }

  return {
    userId: userData.id,
    organizationId: userData.organization_id!,
    role: userData.role,
  };
}

// Helper to get date range from period
function getDateRange(period: TimePeriod): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "90d":
      start.setDate(start.getDate() - 90);
      break;
    case "all":
      start.setFullYear(start.getFullYear() - 5);
      break;
  }

  return { start, end };
}

// Get previous period for comparison
function getPreviousPeriod(period: TimePeriod): { start: Date; end: Date } {
  const { start, end } = getDateRange(period);
  const duration = end.getTime() - start.getTime();

  return {
    start: new Date(start.getTime() - duration),
    end: new Date(end.getTime() - duration),
  };
}

/**
 * Get email overview metrics
 */
export async function getEmailMetrics(
  period: TimePeriod = "30d"
): Promise<ActionResult<EmailMetrics>> {
  // Validate input
  const validatedPeriod = timePeriodSchema.safeParse(period);
  if (!validatedPeriod.success) {
    return { success: false, error: "Invalid time period parameter" };
  }

  const context = await getAdminContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin access required" };
  }

  const supabase = await createClient();
  const { start, end } = getDateRange(period);
  const previous = getPreviousPeriod(period);

  // Get current period stats
  const { data: currentEmails, error: currentError } = await supabase
    .from("email_logs")
    .select("status")
    .eq("organization_id", context.organizationId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  if (currentError) {
    console.error("Error fetching email metrics:", currentError);
    return { success: false, error: "Failed to fetch email metrics" };
  }

  // Get previous period stats
  const { data: previousEmails } = await supabase
    .from("email_logs")
    .select("status")
    .eq("organization_id", context.organizationId)
    .gte("created_at", previous.start.toISOString())
    .lte("created_at", previous.end.toISOString());

  // Calculate current metrics
  const emails = currentEmails || [];
  const totalSent = emails.filter(
    (e) => e.status !== "queued" && e.status !== "failed"
  ).length;
  const totalDelivered = emails.filter(
    (e) => e.status === "delivered" || e.status === "opened" || e.status === "clicked"
  ).length;
  const totalOpened = emails.filter(
    (e) => e.status === "opened" || e.status === "clicked"
  ).length;
  const totalClicked = emails.filter((e) => e.status === "clicked").length;
  const totalBounced = emails.filter((e) => e.status === "bounced").length;
  const totalFailed = emails.filter((e) => e.status === "failed").length;

  const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
  const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
  const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
  const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;

  // Calculate previous period metrics for comparison
  const prevEmails = previousEmails || [];
  const prevSent = prevEmails.filter(
    (e) => e.status !== "queued" && e.status !== "failed"
  ).length;
  const prevDelivered = prevEmails.filter(
    (e) => e.status === "delivered" || e.status === "opened" || e.status === "clicked"
  ).length;
  const prevOpened = prevEmails.filter(
    (e) => e.status === "opened" || e.status === "clicked"
  ).length;

  const prevDeliveryRate = prevSent > 0 ? (prevDelivered / prevSent) * 100 : 0;
  const prevOpenRate = prevDelivered > 0 ? (prevOpened / prevDelivered) * 100 : 0;
  const prevClickRate =
    prevOpened > 0
      ? (prevEmails.filter((e) => e.status === "clicked").length / prevOpened) * 100
      : 0;

  // Calculate changes
  const sentChange =
    prevSent > 0 ? Math.round(((totalSent - prevSent) / prevSent) * 100) : 0;
  const deliveryRateChange = Number((deliveryRate - prevDeliveryRate).toFixed(1));
  const openRateChange = Number((openRate - prevOpenRate).toFixed(1));
  const clickRateChange = Number((clickRate - prevClickRate).toFixed(1));

  return {
    success: true,
    data: {
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      totalBounced,
      totalFailed,
      deliveryRate: Number(deliveryRate.toFixed(1)),
      openRate: Number(openRate.toFixed(1)),
      clickRate: Number(clickRate.toFixed(1)),
      bounceRate: Number(bounceRate.toFixed(1)),
      sentChange,
      deliveryRateChange,
      openRateChange,
      clickRateChange,
    },
  };
}

/**
 * Get email trends over time
 */
export async function getEmailTrends(
  period: TimePeriod = "30d"
): Promise<ActionResult<EmailTrendPoint[]>> {
  // Validate input
  const validatedPeriod = timePeriodSchema.safeParse(period);
  if (!validatedPeriod.success) {
    return { success: false, error: "Invalid time period parameter" };
  }

  const context = await getAdminContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin access required" };
  }

  const supabase = await createClient();
  const { start, end } = getDateRange(period);

  const { data: emails, error } = await supabase
    .from("email_logs")
    .select("status, created_at")
    .eq("organization_id", context.organizationId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching email trends:", error);
    return { success: false, error: "Failed to fetch email trends" };
  }

  // Group by day
  const dailyData = new Map<
    string,
    { sent: number; delivered: number; opened: number; clicked: number; bounced: number }
  >();

  for (const email of emails || []) {
    if (!email.created_at) continue;

    const date = new Date(email.created_at);
    const dateKey = date.toISOString().split("T")[0];

    if (!dailyData.has(dateKey)) {
      dailyData.set(dateKey, { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 });
    }

    const entry = dailyData.get(dateKey)!;

    if (email.status !== "queued" && email.status !== "failed") {
      entry.sent += 1;
    }
    if (
      email.status === "delivered" ||
      email.status === "opened" ||
      email.status === "clicked"
    ) {
      entry.delivered += 1;
    }
    if (email.status === "opened" || email.status === "clicked") {
      entry.opened += 1;
    }
    if (email.status === "clicked") {
      entry.clicked += 1;
    }
    if (email.status === "bounced") {
      entry.bounced += 1;
    }
  }

  // Fill in missing days
  const trends: EmailTrendPoint[] = [];
  const currentDate = new Date(start);

  while (currentDate <= end) {
    const dateKey = currentDate.toISOString().split("T")[0];
    const data = dailyData.get(dateKey) || {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
    };

    trends.push({
      date: currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      ...data,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return { success: true, data: trends };
}

/**
 * Get performance breakdown by email type
 */
export async function getEmailTypePerformance(
  period: TimePeriod = "30d"
): Promise<ActionResult<EmailTypePerformance[]>> {
  // Validate input
  const validatedPeriod = timePeriodSchema.safeParse(period);
  if (!validatedPeriod.success) {
    return { success: false, error: "Invalid time period parameter" };
  }

  const context = await getAdminContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin access required" };
  }

  const supabase = await createClient();
  const { start, end } = getDateRange(period);

  const { data: emails, error } = await supabase
    .from("email_logs")
    .select("template_name, status")
    .eq("organization_id", context.organizationId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  if (error) {
    console.error("Error fetching email type performance:", error);
    return { success: false, error: "Failed to fetch email type performance" };
  }

  // Group by template
  const templateData = new Map<
    string,
    { sent: number; delivered: number; opened: number; clicked: number; bounced: number }
  >();

  for (const email of emails || []) {
    const template = email.template_name || "unknown";

    if (!templateData.has(template)) {
      templateData.set(template, { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 });
    }

    const entry = templateData.get(template)!;

    if (email.status !== "queued" && email.status !== "failed") {
      entry.sent += 1;
    }
    if (
      email.status === "delivered" ||
      email.status === "opened" ||
      email.status === "clicked"
    ) {
      entry.delivered += 1;
    }
    if (email.status === "opened" || email.status === "clicked") {
      entry.opened += 1;
    }
    if (email.status === "clicked") {
      entry.clicked += 1;
    }
    if (email.status === "bounced") {
      entry.bounced += 1;
    }
  }

  // Convert to array and calculate rates
  const performance: EmailTypePerformance[] = Array.from(templateData.entries())
    .map(([templateName, data]) => ({
      templateName,
      displayName: getTemplateDisplayName(templateName),
      category: getTemplateCategory(templateName),
      totalSent: data.sent,
      delivered: data.delivered,
      opened: data.opened,
      clicked: data.clicked,
      bounced: data.bounced,
      deliveryRate: data.sent > 0 ? Number(((data.delivered / data.sent) * 100).toFixed(1)) : 0,
      openRate:
        data.delivered > 0 ? Number(((data.opened / data.delivered) * 100).toFixed(1)) : 0,
      clickRate: data.opened > 0 ? Number(((data.clicked / data.opened) * 100).toFixed(1)) : 0,
    }))
    .filter((p) => p.totalSent > 0)
    .sort((a, b) => b.totalSent - a.totalSent);

  return { success: true, data: performance };
}

/**
 * Get unsubscribe metrics
 */
export async function getUnsubscribeMetrics(
  period: TimePeriod = "30d"
): Promise<ActionResult<UnsubscribeMetrics>> {
  // Validate input
  const validatedPeriod = timePeriodSchema.safeParse(period);
  if (!validatedPeriod.success) {
    return { success: false, error: "Invalid time period parameter" };
  }

  const context = await getAdminContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin access required" };
  }

  const supabase = await createClient();
  const { start, end } = getDateRange(period);
  const previous = getPreviousPeriod(period);

  // Get current period unsubscribes
  const { data: currentUnsubs, error: currentError } = await supabase
    .from("email_unsubscribes")
    .select("reason, unsubscribed_at")
    .eq("organization_id", context.organizationId)
    .gte("unsubscribed_at", start.toISOString())
    .lte("unsubscribed_at", end.toISOString());

  if (currentError) {
    console.error("Error fetching unsubscribe metrics:", currentError);
    return { success: false, error: "Failed to fetch unsubscribe metrics" };
  }

  // Get previous period unsubscribes
  const { data: prevUnsubs } = await supabase
    .from("email_unsubscribes")
    .select("id")
    .eq("organization_id", context.organizationId)
    .gte("unsubscribed_at", previous.start.toISOString())
    .lte("unsubscribed_at", previous.end.toISOString());

  // Get total emails sent for rate calculation (current period)
  const { data: totalEmails } = await supabase
    .from("email_logs")
    .select("id")
    .eq("organization_id", context.organizationId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .not("status", "in", "(queued,failed)");

  // Get previous period email count for rate comparison
  const { data: prevTotalEmails } = await supabase
    .from("email_logs")
    .select("id")
    .eq("organization_id", context.organizationId)
    .gte("created_at", previous.start.toISOString())
    .lte("created_at", previous.end.toISOString())
    .not("status", "in", "(queued,failed)");

  const unsubs = currentUnsubs || [];
  const total = unsubs.length;
  const emailCount = totalEmails?.length || 0;
  const prevEmailCount = prevTotalEmails?.length || 0;

  // Group by reason
  const byReason = new Map<string, number>();
  for (const unsub of unsubs) {
    const reason = unsub.reason || "unknown";
    byReason.set(reason, (byReason.get(reason) || 0) + 1);
  }

  // Calculate rates (current and previous)
  const rate = emailCount > 0 ? Number(((total / emailCount) * 100).toFixed(2)) : 0;
  const prevUnsubCount = prevUnsubs?.length || 0;
  const prevRate = prevEmailCount > 0 ? (prevUnsubCount / prevEmailCount) * 100 : 0;
  // Calculate the actual rate change (difference in percentage points)
  const rateChange = Number((rate - prevRate).toFixed(2));

  return {
    success: true,
    data: {
      total,
      byReason: Array.from(byReason.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count),
      rate,
      rateChange,
    },
  };
}

/**
 * Get sequence performance metrics
 */
export async function getSequencePerformance(): Promise<ActionResult<SequencePerformance[]>> {
  const context = await getAdminContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin access required" };
  }

  const supabase = await createClient();

  // Note: email_sequences table exists based on migration 20240101000043
  // Using type assertion since types may not be regenerated
  type SequenceRow = {
    sequence_type: string;
    status: string;
    current_step: number;
    total_steps: number;
    steps_completed: Array<{
      step: number;
      sent_at?: string;
      delivered_at?: string;
      opened_at?: string;
      clicked_at?: string;
    }>;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequences, error } = await (supabase as any)
    .from("email_sequences")
    .select("sequence_type, status, current_step, total_steps, steps_completed")
    .eq("organization_id", context.organizationId) as {
    data: SequenceRow[] | null;
    error: Error | null;
  };

  if (error) {
    console.error("Error fetching sequence performance:", error);
    return { success: false, error: "Failed to fetch sequence performance" };
  }

  // Group by sequence type
  const typeData = new Map<
    string,
    {
      total: number;
      completed: number;
      cancelled: number;
      stepsSum: number;
      funnel: Map<number, { sent: number; delivered: number; opened: number; clicked: number }>;
    }
  >();

  for (const seq of sequences || []) {
    const seqType = seq.sequence_type || "unknown";

    if (!typeData.has(seqType)) {
      typeData.set(seqType, {
        total: 0,
        completed: 0,
        cancelled: 0,
        stepsSum: 0,
        funnel: new Map(),
      });
    }

    const entry = typeData.get(seqType)!;
    entry.total += 1;
    entry.stepsSum += seq.current_step || 0;

    if (seq.status === "completed") {
      entry.completed += 1;
    } else if (seq.status === "cancelled") {
      entry.cancelled += 1;
    }

    // Process funnel data from steps_completed
    const steps = seq.steps_completed || [];
    for (const step of steps) {
      if (!entry.funnel.has(step.step)) {
        entry.funnel.set(step.step, { sent: 0, delivered: 0, opened: 0, clicked: 0 });
      }
      const funnelStep = entry.funnel.get(step.step)!;
      if (step.sent_at) funnelStep.sent += 1;
      if (step.delivered_at) funnelStep.delivered += 1;
      if (step.opened_at) funnelStep.opened += 1;
      if (step.clicked_at) funnelStep.clicked += 1;
    }
  }

  // Sequence type display names
  const displayNames: Record<string, string> = {
    welcome: "Welcome Sequence",
    onboarding: "Onboarding",
    win_back: "Win-back",
    feature_announcement: "Feature Announcement",
    milestone: "Milestone",
  };

  // Convert to array
  const performance: SequencePerformance[] = Array.from(typeData.entries()).map(
    ([seqType, data]) => {
      // Build funnel steps
      const funnelSteps = Array.from(data.funnel.entries())
        .sort(([a], [b]) => a - b)
        .map(([step, stats], index, arr) => {
          const prevSent = index > 0 ? arr[index - 1][1].sent : stats.sent;
          return {
            step,
            name: `Step ${step}`,
            sent: stats.sent,
            delivered: stats.delivered,
            opened: stats.opened,
            clicked: stats.clicked,
            dropoffRate:
              prevSent > 0 ? Number((((prevSent - stats.sent) / prevSent) * 100).toFixed(1)) : 0,
          };
        });

      return {
        sequenceType: seqType,
        displayName: displayNames[seqType] || getTemplateDisplayName(seqType),
        totalStarted: data.total,
        totalCompleted: data.completed,
        totalCancelled: data.cancelled,
        completionRate:
          data.total > 0 ? Number(((data.completed / data.total) * 100).toFixed(1)) : 0,
        averageStepsCompleted:
          data.total > 0 ? Number((data.stepsSum / data.total).toFixed(1)) : 0,
        funnel: funnelSteps,
      };
    }
  );

  return { success: true, data: performance };
}

/**
 * Export email analytics data to CSV format
 */
export async function exportEmailAnalyticsCSV(
  period: TimePeriod = "30d"
): Promise<ActionResult<string>> {
  // Validate input
  const validatedPeriod = timePeriodSchema.safeParse(period);
  if (!validatedPeriod.success) {
    return { success: false, error: "Invalid time period parameter" };
  }

  const context = await getAdminContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin access required" };
  }

  const supabase = await createClient();
  const { start, end } = getDateRange(period);

  // Fetch detailed email logs
  const { data: emails, error } = await supabase
    .from("email_logs")
    .select(
      "id, to_email, subject, template_name, status, sent_at, delivered_at, opened_at, clicked_at, created_at"
    )
    .eq("organization_id", context.organizationId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error exporting email analytics:", error);
    return { success: false, error: "Failed to export email analytics" };
  }

  // Build CSV with sanitized values to prevent formula injection
  const headers = [
    "ID",
    "Recipient",
    "Subject",
    "Template",
    "Category",
    "Status",
    "Sent At",
    "Delivered At",
    "Opened At",
    "Clicked At",
    "Created At",
  ];

  const rows = (emails || []).map((email) => [
    sanitizeCSVValue(email.id),
    sanitizeCSVValue(email.to_email),
    `"${sanitizeCSVValue(email.subject).replace(/"/g, '""')}"`,
    sanitizeCSVValue(email.template_name),
    sanitizeCSVValue(getTemplateCategory(email.template_name || "")),
    sanitizeCSVValue(email.status),
    email.sent_at || "",
    email.delivered_at || "",
    email.opened_at || "",
    email.clicked_at || "",
    email.created_at || "",
  ]);

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  return { success: true, data: csv };
}
