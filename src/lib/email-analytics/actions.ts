"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/reviews/types";
import type {
  EmailMetrics,
  EmailTrendPoint,
  EmailTypePerformance,
  UnsubscribeMetrics,
  SequencePerformance,
  ABTestResult,
  TimePeriod,
} from "./types";
import { getTemplateDisplayName, getTemplateCategory } from "./types";

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

  // Get total emails sent for rate calculation
  const { data: totalEmails } = await supabase
    .from("email_logs")
    .select("id")
    .eq("organization_id", context.organizationId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .not("status", "in", "(queued,failed)");

  const unsubs = currentUnsubs || [];
  const total = unsubs.length;
  const emailCount = totalEmails?.length || 0;

  // Group by reason
  const byReason = new Map<string, number>();
  for (const unsub of unsubs) {
    const reason = unsub.reason || "unknown";
    byReason.set(reason, (byReason.get(reason) || 0) + 1);
  }

  const rate = emailCount > 0 ? Number(((total / emailCount) * 100).toFixed(2)) : 0;
  const prevTotal = prevUnsubs?.length || 0;
  const rateChange =
    prevTotal > 0 ? Number((((total - prevTotal) / prevTotal) * 100).toFixed(1)) : 0;

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
 * Get A/B test results (from email sequences)
 */
export async function getABTestResults(): Promise<ActionResult<ABTestResult[]>> {
  const context = await getAdminContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin access required" };
  }

  const supabase = await createClient();

  // Query email sequences with A/B test data
  type ABSequenceRow = {
    sequence_type: string;
    ab_test_assignments: Record<string, string>;
    steps_completed: Array<{
      step: number;
      variant?: string;
      sent_at?: string;
      opened_at?: string;
      clicked_at?: string;
    }>;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequences, error } = await (supabase as any)
    .from("email_sequences")
    .select("sequence_type, ab_test_assignments, steps_completed")
    .eq("organization_id", context.organizationId)
    .not("ab_test_assignments", "is", null) as {
    data: ABSequenceRow[] | null;
    error: Error | null;
  };

  if (error) {
    console.error("Error fetching A/B test results:", error);
    return { success: false, error: "Failed to fetch A/B test results" };
  }

  // Aggregate by sequence type and step
  const testData = new Map<
    string,
    Map<
      number,
      {
        A: { sent: number; opened: number; clicked: number };
        B: { sent: number; opened: number; clicked: number };
      }
    >
  >();

  for (const seq of sequences || []) {
    const seqType = seq.sequence_type || "unknown";

    if (!testData.has(seqType)) {
      testData.set(seqType, new Map());
    }

    const seqData = testData.get(seqType)!;
    const steps = seq.steps_completed || [];

    for (const step of steps) {
      if (!step.variant) continue;

      if (!seqData.has(step.step)) {
        seqData.set(step.step, {
          A: { sent: 0, opened: 0, clicked: 0 },
          B: { sent: 0, opened: 0, clicked: 0 },
        });
      }

      const stepData = seqData.get(step.step)!;
      const variant = step.variant === "B" ? "B" : "A";

      if (step.sent_at) stepData[variant].sent += 1;
      if (step.opened_at) stepData[variant].opened += 1;
      if (step.clicked_at) stepData[variant].clicked += 1;
    }
  }

  // Convert to array and calculate stats
  const results: ABTestResult[] = [];

  for (const [seqType, steps] of testData) {
    for (const [step, data] of steps) {
      const aOpenRate =
        data.A.sent > 0 ? Number(((data.A.opened / data.A.sent) * 100).toFixed(1)) : 0;
      const bOpenRate =
        data.B.sent > 0 ? Number(((data.B.opened / data.B.sent) * 100).toFixed(1)) : 0;
      const aClickRate =
        data.A.opened > 0 ? Number(((data.A.clicked / data.A.opened) * 100).toFixed(1)) : 0;
      const bClickRate =
        data.B.opened > 0 ? Number(((data.B.clicked / data.B.opened) * 100).toFixed(1)) : 0;

      // Determine winner based on open rate (primary metric)
      let winner: "A" | "B" | "tie" = "tie";
      const diff = Math.abs(aOpenRate - bOpenRate);
      if (diff > 2) {
        winner = aOpenRate > bOpenRate ? "A" : "B";
      }

      // Simple confidence calculation based on sample size and difference
      const totalSamples = data.A.sent + data.B.sent;
      const confidence = Math.min(
        95,
        Math.round(50 + (diff * 3) + (totalSamples / 100) * 10)
      );

      results.push({
        sequenceType: seqType,
        step,
        variantA: {
          sent: data.A.sent,
          opened: data.A.opened,
          clicked: data.A.clicked,
          openRate: aOpenRate,
          clickRate: aClickRate,
        },
        variantB: {
          sent: data.B.sent,
          opened: data.B.opened,
          clicked: data.B.clicked,
          openRate: bOpenRate,
          clickRate: bClickRate,
        },
        winner,
        confidence,
      });
    }
  }

  return { success: true, data: results };
}

/**
 * Export email analytics data to CSV format
 */
export async function exportEmailAnalyticsCSV(
  period: TimePeriod = "30d"
): Promise<ActionResult<string>> {
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

  // Build CSV
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
    email.id,
    email.to_email,
    `"${(email.subject || "").replace(/"/g, '""')}"`,
    email.template_name || "",
    getTemplateCategory(email.template_name || ""),
    email.status,
    email.sent_at || "",
    email.delivered_at || "",
    email.opened_at || "",
    email.clicked_at || "",
    email.created_at,
  ]);

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  return { success: true, data: csv };
}
