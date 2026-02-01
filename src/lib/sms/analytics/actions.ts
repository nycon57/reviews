"use server";

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import type {
  SmsAnalyticsData,
  SmsAnalyticsSummary,
  SmsDeliveryFunnel,
  SmsDailyVolume,
  SmsTemplatePerformanceRow,
  SmsLoLeaderboardRow,
  SmsOptOutTrend,
  SmsCostBreakdown,
  SmsTimeHeatmapCell,
  SmsChannelComparison,
} from "./types";

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function getUserContext() {
  const user = await unifiedGetUser();
  if (!user) return null;

  const supabase = createUntypedAdminClient();
  const { data } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  return data as { id: string; organization_id: string; role: string } | null;
}

// ── Main analytics fetch ────────────────────────────────────────────

export async function getSmsAnalytics(params?: {
  startDate?: string;
  endDate?: string;
  userId?: string;
}): Promise<ActionResult<SmsAnalyticsData>> {
  const context = await getUserContext();
  if (!context) return { success: false, error: "Unauthorized" };

  const orgId = context.organization_id;
  const { startDate, endDate, userId } = params ?? {};

  // Fetch total clicks once and share across summary + funnel
  const totalClicks = await fetchTotalClicks(orgId, startDate, endDate, userId);

  const [
    summary,
    funnel,
    dailyVolume,
    templatePerformance,
    loLeaderboard,
    optOutTrend,
    costBreakdown,
    timeHeatmap,
    channelComparison,
  ] = await Promise.all([
    fetchSummary(orgId, startDate, endDate, userId, totalClicks),
    fetchFunnel(orgId, startDate, endDate, userId, totalClicks),
    fetchDailyVolume(orgId, startDate, endDate, userId),
    fetchTemplatePerformance(orgId, startDate, endDate, userId),
    context.role !== "user"
      ? fetchLoLeaderboard(orgId, startDate, endDate)
      : Promise.resolve([]),
    fetchOptOutTrend(orgId, startDate, endDate),
    fetchCostBreakdown(orgId, startDate, endDate, userId),
    fetchTimeHeatmap(orgId, startDate, endDate, userId),
    fetchChannelComparison(orgId, startDate, endDate, userId, totalClicks),
  ]);

  return {
    success: true,
    data: {
      summary,
      funnel,
      dailyVolume,
      templatePerformance,
      loLeaderboard,
      optOutTrend,
      costBreakdown,
      timeHeatmap,
      channelComparison,
    },
  };
}

// ── Summary KPIs ────────────────────────────────────────────────────

async function fetchSummary(
  orgId: string,
  startDate?: string,
  endDate?: string,
  userId?: string,
  precomputedClicks?: number
): Promise<SmsAnalyticsSummary> {
  const supabase = createUntypedAdminClient();

  let query = supabase
    .from("sms_daily_stats")
    .select("sent, delivered, failed, total_cost_cents, reviews_generated, opted_out")
    .eq("organization_id", orgId);

  if (startDate) query = query.gte("date", startDate.slice(0, 10));
  if (endDate) query = query.lte("date", endDate.slice(0, 10));
  if (userId) query = query.eq("loan_officer_id", userId);

  const { data } = await query;
  const rows = data ?? [];

  const totalSent = rows.reduce((s, r) => s + ((r.sent as number) ?? 0), 0);
  const totalDelivered = rows.reduce((s, r) => s + ((r.delivered as number) ?? 0), 0);
  const totalFailed = rows.reduce((s, r) => s + ((r.failed as number) ?? 0), 0);
  const totalCostCents = rows.reduce((s, r) => s + ((r.total_cost_cents as number) ?? 0), 0);
  const totalReviewsGenerated = rows.reduce((s, r) => s + ((r.reviews_generated as number) ?? 0), 0);

  const totalClicks = precomputedClicks ?? 0;

  const deliveryRate = totalSent > 0 ? totalDelivered / totalSent : 0;
  const clickRate = totalDelivered > 0 ? totalClicks / totalDelivered : 0;
  const conversionRate = totalClicks > 0 ? totalReviewsGenerated / totalClicks : 0;
  const costPerReview = totalReviewsGenerated > 0 ? totalCostCents / totalReviewsGenerated : 0;

  return {
    totalSent,
    totalDelivered,
    totalFailed,
    totalClicks,
    totalReviewsGenerated,
    totalCostCents,
    deliveryRate,
    clickRate,
    conversionRate,
    costPerReview,
  };
}

// ── Delivery funnel ─────────────────────────────────────────────────

async function fetchFunnel(
  orgId: string,
  startDate?: string,
  endDate?: string,
  userId?: string,
  precomputedClicks?: number
): Promise<SmsDeliveryFunnel> {
  const supabase = createUntypedAdminClient();

  let query = supabase
    .from("sms_daily_stats")
    .select("sent, delivered, reviews_generated")
    .eq("organization_id", orgId);

  if (startDate) query = query.gte("date", startDate.slice(0, 10));
  if (endDate) query = query.lte("date", endDate.slice(0, 10));
  if (userId) query = query.eq("loan_officer_id", userId);

  const { data } = await query;
  const rows = data ?? [];

  const sent = rows.reduce((s, r) => s + ((r.sent as number) ?? 0), 0);
  const delivered = rows.reduce((s, r) => s + ((r.delivered as number) ?? 0), 0);
  const reviewed = rows.reduce((s, r) => s + ((r.reviews_generated as number) ?? 0), 0);
  const clicked = precomputedClicks ?? 0;

  return {
    sent,
    delivered,
    clicked,
    reviewed,
    sentToDelivered: sent > 0 ? delivered / sent : 0,
    deliveredToClicked: delivered > 0 ? clicked / delivered : 0,
    clickedToReviewed: clicked > 0 ? reviewed / clicked : 0,
  };
}

// ── Daily volume ────────────────────────────────────────────────────

async function fetchDailyVolume(
  orgId: string,
  startDate?: string,
  endDate?: string,
  userId?: string
): Promise<SmsDailyVolume[]> {
  const supabase = createUntypedAdminClient();

  let query = supabase
    .from("sms_daily_stats")
    .select("date, sent, delivered, failed")
    .eq("organization_id", orgId)
    .order("date", { ascending: true });

  if (startDate) query = query.gte("date", startDate.slice(0, 10));
  if (endDate) query = query.lte("date", endDate.slice(0, 10));
  if (userId) query = query.eq("loan_officer_id", userId);

  const { data } = await query;

  // Aggregate by date (multiple LOs may have entries per date)
  const dayMap = new Map<string, SmsDailyVolume>();
  for (const row of data ?? []) {
    const d = row.date as string;
    const existing = dayMap.get(d) ?? { date: d, sent: 0, delivered: 0, failed: 0, clicked: 0 };
    existing.sent += (row.sent as number) ?? 0;
    existing.delivered += (row.delivered as number) ?? 0;
    existing.failed += (row.failed as number) ?? 0;
    dayMap.set(d, existing);
  }

  return Array.from(dayMap.values());
}

// ── Template performance ────────────────────────────────────────────

async function fetchTemplatePerformance(
  orgId: string,
  startDate?: string,
  endDate?: string,
  userId?: string
): Promise<SmsTemplatePerformanceRow[]> {
  const supabase = createUntypedAdminClient();

  // Get templates
  const { data: templates } = await supabase
    .from("sms_templates")
    .select("id, name, category")
    .eq("organization_id", orgId)
    .eq("status", "active");

  if (!templates?.length) return [];

  // Get messages for date range
  let msgQuery = supabase
    .from("sms_messages")
    .select("template_id, status, cost_cents, short_link_id")
    .eq("organization_id", orgId)
    .eq("direction", "outbound")
    .not("template_id", "is", null);

  if (startDate) msgQuery = msgQuery.gte("sent_at", startDate);
  if (endDate) msgQuery = msgQuery.lte("sent_at", endDate);
  if (userId) msgQuery = msgQuery.eq("loan_officer_id", userId);

  const { data: messages } = await msgQuery;

  // Aggregate by template
  const templateMap = new Map<string, {
    sends: number;
    delivered: number;
    totalCost: number;
    shortLinkIds: string[];
  }>();

  for (const msg of messages ?? []) {
    const tid = msg.template_id as string;
    const entry = templateMap.get(tid) ?? { sends: 0, delivered: 0, totalCost: 0, shortLinkIds: [] };
    entry.sends++;
    if (msg.status === "delivered") entry.delivered++;
    entry.totalCost += (msg.cost_cents as number) ?? 0;
    if (msg.short_link_id) entry.shortLinkIds.push(msg.short_link_id as string);
    templateMap.set(tid, entry);
  }

  // Get click counts
  const allLinkIds = Array.from(templateMap.values()).flatMap((m) => m.shortLinkIds);
  const clicksByLink = new Map<string, number>();

  if (allLinkIds.length > 0) {
    const { data: linkData } = await supabase
      .from("sms_short_links")
      .select("id, click_count")
      .in("id", allLinkIds)
      .gt("click_count", 0);

    for (const link of linkData ?? []) {
      clicksByLink.set(link.id as string, (link.click_count as number) ?? 0);
    }
  }

  return templates.map((t) => {
    const stats = templateMap.get(t.id as string);
    if (!stats) {
      return {
        templateId: t.id as string,
        templateName: t.name as string,
        category: t.category as string,
        sends: 0,
        deliveryRate: 0,
        clickRate: 0,
        conversionRate: 0,
        avgCostCents: 0,
      };
    }

    const clicks = stats.shortLinkIds.reduce(
      (sum, id) => sum + (clicksByLink.get(id) ?? 0), 0
    );

    return {
      templateId: t.id as string,
      templateName: t.name as string,
      category: t.category as string,
      sends: stats.sends,
      deliveryRate: stats.sends > 0 ? stats.delivered / stats.sends : 0,
      clickRate: stats.delivered > 0 ? clicks / stats.delivered : 0,
      conversionRate: 0, // needs event correlation
      avgCostCents: stats.sends > 0 ? stats.totalCost / stats.sends : 0,
    };
  }).sort((a, b) => b.sends - a.sends);
}

// ── LO Leaderboard ──────────────────────────────────────────────────

async function fetchLoLeaderboard(
  orgId: string,
  startDate?: string,
  endDate?: string
): Promise<SmsLoLeaderboardRow[]> {
  const supabase = createUntypedAdminClient();

  let query = supabase
    .from("sms_daily_stats")
    .select("loan_officer_id, sent, delivered, total_cost_cents, reviews_generated")
    .eq("organization_id", orgId)
    .not("loan_officer_id", "is", null);

  if (startDate) query = query.gte("date", startDate.slice(0, 10));
  if (endDate) query = query.lte("date", endDate.slice(0, 10));

  const { data } = await query;

  // Aggregate by LO
  const loMap = new Map<string, {
    sent: number;
    reviews: number;
    costCents: number;
  }>();

  for (const row of data ?? []) {
    const loId = row.loan_officer_id as string;
    const entry = loMap.get(loId) ?? { sent: 0, reviews: 0, costCents: 0 };
    entry.sent += (row.sent as number) ?? 0;
    entry.reviews += (row.reviews_generated as number) ?? 0;
    entry.costCents += (row.total_cost_cents as number) ?? 0;
    loMap.set(loId, entry);
  }

  if (loMap.size === 0) return [];

  // Get LO names
  const loIds = Array.from(loMap.keys());
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name")
    .in("id", loIds);

  const nameMap = new Map<string, string>();
  for (const u of users ?? []) {
    nameMap.set(u.id as string, (u.full_name as string) || "Unknown");
  }

  return Array.from(loMap.entries())
    .map(([id, stats]) => ({
      userId: id,
      userName: nameMap.get(id) ?? "Unknown",
      smsSent: stats.sent,
      reviewsGenerated: stats.reviews,
      conversionRate: stats.sent > 0 ? stats.reviews / stats.sent : 0,
      costPerReview: stats.reviews > 0 ? stats.costCents / stats.reviews : 0,
    }))
    .sort((a, b) => b.conversionRate - a.conversionRate);
}

// ── Opt-out trend ───────────────────────────────────────────────────

async function fetchOptOutTrend(
  orgId: string,
  startDate?: string,
  endDate?: string
): Promise<SmsOptOutTrend[]> {
  const supabase = createUntypedAdminClient();

  let query = supabase
    .from("sms_daily_stats")
    .select("date, sent, opted_out")
    .eq("organization_id", orgId)
    .order("date", { ascending: true });

  if (startDate) query = query.gte("date", startDate.slice(0, 10));
  if (endDate) query = query.lte("date", endDate.slice(0, 10));

  const { data } = await query;

  const dayMap = new Map<string, { sent: number; optedOut: number }>();
  for (const row of data ?? []) {
    const d = row.date as string;
    const entry = dayMap.get(d) ?? { sent: 0, optedOut: 0 };
    entry.sent += (row.sent as number) ?? 0;
    entry.optedOut += (row.opted_out as number) ?? 0;
    dayMap.set(d, entry);
  }

  return Array.from(dayMap.entries()).map(([date, stats]) => ({
    date,
    optOutCount: stats.optedOut,
    optOutRate: stats.sent > 0 ? stats.optedOut / stats.sent : 0,
  }));
}

// ── Cost breakdown by category ──────────────────────────────────────

async function fetchCostBreakdown(
  orgId: string,
  startDate?: string,
  endDate?: string,
  userId?: string
): Promise<SmsCostBreakdown[]> {
  const supabase = createUntypedAdminClient();

  let query = supabase
    .from("sms_messages")
    .select("template_id, cost_cents")
    .eq("organization_id", orgId)
    .eq("direction", "outbound");

  if (startDate) query = query.gte("sent_at", startDate);
  if (endDate) query = query.lte("sent_at", endDate);
  if (userId) query = query.eq("loan_officer_id", userId);

  const { data: messages } = await query;

  // Get template categories
  const templateIds = [...new Set(
    (messages ?? []).map((m) => m.template_id as string).filter(Boolean)
  )];

  const categoryMap = new Map<string, string>();
  if (templateIds.length > 0) {
    const { data: templates } = await supabase
      .from("sms_templates")
      .select("id, category")
      .in("id", templateIds);

    for (const t of templates ?? []) {
      categoryMap.set(t.id as string, t.category as string);
    }
  }

  // Aggregate by category
  const costMap = new Map<string, { costCents: number; count: number }>();
  for (const msg of messages ?? []) {
    const category = msg.template_id
      ? (categoryMap.get(msg.template_id as string) ?? "custom")
      : "custom";
    const entry = costMap.get(category) ?? { costCents: 0, count: 0 };
    entry.costCents += (msg.cost_cents as number) ?? 0;
    entry.count++;
    costMap.set(category, entry);
  }

  return Array.from(costMap.entries()).map(([category, stats]) => ({
    category,
    costCents: stats.costCents,
    count: stats.count,
  }));
}

// ── Time-of-day heatmap ─────────────────────────────────────────────

async function fetchTimeHeatmap(
  orgId: string,
  startDate?: string,
  endDate?: string,
  userId?: string
): Promise<SmsTimeHeatmapCell[]> {
  const supabase = createUntypedAdminClient();

  let query = supabase
    .from("sms_messages")
    .select("sent_at, short_link_id, status")
    .eq("organization_id", orgId)
    .eq("direction", "outbound")
    .not("sent_at", "is", null)
    .limit(10000);

  if (startDate) query = query.gte("sent_at", startDate);
  if (endDate) query = query.lte("sent_at", endDate);
  if (userId) query = query.eq("loan_officer_id", userId);

  const { data: messages } = await query;

  // Get click data
  const shortLinkIds = (messages ?? [])
    .map((m) => m.short_link_id as string)
    .filter(Boolean);

  const clickedLinks = new Set<string>();
  if (shortLinkIds.length > 0) {
    const { data: links } = await supabase
      .from("sms_short_links")
      .select("id")
      .in("id", shortLinkIds)
      .gt("click_count", 0);

    for (const l of links ?? []) {
      clickedLinks.add(l.id as string);
    }
  }

  // Build 7x24 grid
  const grid = new Map<string, { sends: number; clicks: number }>();

  for (const msg of messages ?? []) {
    const sentAt = new Date(msg.sent_at as string);
    const hour = sentAt.getUTCHours();
    const dow = sentAt.getUTCDay();
    const key = `${dow}-${hour}`;
    const entry = grid.get(key) ?? { sends: 0, clicks: 0 };
    entry.sends++;
    if (msg.short_link_id && clickedLinks.has(msg.short_link_id as string)) {
      entry.clicks++;
    }
    grid.set(key, entry);
  }

  const cells: SmsTimeHeatmapCell[] = [];
  for (let dow = 0; dow < 7; dow++) {
    for (let hour = 0; hour < 24; hour++) {
      const entry = grid.get(`${dow}-${hour}`) ?? { sends: 0, clicks: 0 };
      cells.push({
        hour,
        dayOfWeek: dow,
        sends: entry.sends,
        clicks: entry.clicks,
        clickRate: entry.sends > 0 ? entry.clicks / entry.sends : 0,
      });
    }
  }

  return cells;
}

// ── Channel comparison ──────────────────────────────────────────────

async function fetchChannelComparison(
  orgId: string,
  startDate?: string,
  endDate?: string,
  userId?: string,
  precomputedClicks?: number
): Promise<SmsChannelComparison[] | null> {
  const supabase = createUntypedAdminClient();

  // Get SMS stats
  let smsQuery = supabase
    .from("sms_daily_stats")
    .select("sent, delivered, total_cost_cents, reviews_generated")
    .eq("organization_id", orgId);

  if (startDate) smsQuery = smsQuery.gte("date", startDate.slice(0, 10));
  if (endDate) smsQuery = smsQuery.lte("date", endDate.slice(0, 10));
  if (userId) smsQuery = smsQuery.eq("loan_officer_id", userId);

  const { data: smsData } = await smsQuery;

  const smsSent = (smsData ?? []).reduce((s, r) => s + ((r.sent as number) ?? 0), 0);
  const smsDelivered = (smsData ?? []).reduce((s, r) => s + ((r.delivered as number) ?? 0), 0);
  const smsCost = (smsData ?? []).reduce((s, r) => s + ((r.total_cost_cents as number) ?? 0), 0);
  const smsReviews = (smsData ?? []).reduce((s, r) => s + ((r.reviews_generated as number) ?? 0), 0);
  const smsClicks = precomputedClicks ?? 0;

  // Get email stats (from surveys table as proxy)
  let emailQuery = supabase
    .from("surveys")
    .select("id, status", { count: "exact" })
    .eq("organization_id", orgId)
    .eq("distribution_method", "email");

  if (startDate) emailQuery = emailQuery.gte("created_at", startDate);
  if (endDate) emailQuery = emailQuery.lte("created_at", endDate);
  if (userId) emailQuery = emailQuery.eq("loan_officer_id", userId);

  const { count: emailSent } = await emailQuery;

  // If no email data, return null (no comparison)
  if (!emailSent || emailSent === 0) {
    if (smsSent === 0) return null;
    // Return SMS only
    return [{
      channel: "sms",
      sent: smsSent,
      deliveryRate: smsSent > 0 ? smsDelivered / smsSent : 0,
      clickRate: smsDelivered > 0 ? smsClicks / smsDelivered : 0,
      conversionRate: smsSent > 0 ? smsReviews / smsSent : 0,
      costPerConversion: smsReviews > 0 ? smsCost / smsReviews : 0,
    }];
  }

  // Get email completion stats
  let completedQuery = supabase
    .from("surveys")
    .select("id", { count: "exact" })
    .eq("organization_id", orgId)
    .eq("distribution_method", "email")
    .eq("status", "completed");

  if (startDate) completedQuery = completedQuery.gte("created_at", startDate);
  if (endDate) completedQuery = completedQuery.lte("created_at", endDate);
  if (userId) completedQuery = completedQuery.eq("loan_officer_id", userId);

  const { count: emailCompleted } = await completedQuery;

  return [
    {
      channel: "email",
      sent: emailSent,
      deliveryRate: 0.95, // Email delivery rate is typically high; would need bounce tracking
      clickRate: emailSent > 0 ? (emailCompleted ?? 0) / emailSent : 0,
      conversionRate: emailSent > 0 ? (emailCompleted ?? 0) / emailSent : 0,
      costPerConversion: 0, // Email cost is negligible
    },
    {
      channel: "sms",
      sent: smsSent,
      deliveryRate: smsSent > 0 ? smsDelivered / smsSent : 0,
      clickRate: smsDelivered > 0 ? smsClicks / smsDelivered : 0,
      conversionRate: smsSent > 0 ? smsReviews / smsSent : 0,
      costPerConversion: smsReviews > 0 ? smsCost / smsReviews : 0,
    },
  ];
}

// ── Helpers ─────────────────────────────────────────────────────────

async function fetchTotalClicks(
  orgId: string,
  startDate?: string,
  endDate?: string,
  userId?: string
): Promise<number> {
  const supabase = createUntypedAdminClient();

  let msgQuery = supabase
    .from("sms_messages")
    .select("short_link_id")
    .eq("organization_id", orgId)
    .eq("direction", "outbound")
    .not("short_link_id", "is", null);

  if (startDate) msgQuery = msgQuery.gte("sent_at", startDate);
  if (endDate) msgQuery = msgQuery.lte("sent_at", endDate);
  if (userId) msgQuery = msgQuery.eq("loan_officer_id", userId);

  const { data: messages } = await msgQuery;
  const linkIds = [...new Set((messages ?? []).map((m) => m.short_link_id as string))];

  if (linkIds.length === 0) return 0;

  const { data: links } = await supabase
    .from("sms_short_links")
    .select("click_count")
    .in("id", linkIds)
    .gt("click_count", 0);

  return (links ?? []).reduce((sum, l) => sum + ((l.click_count as number) ?? 0), 0);
}

// ── CSV Export ──────────────────────────────────────────────────────

/** Escape a string for CSV: quote it and neutralize formula-injection characters. */
function csvEscape(value: string): string {
  // Prevent CSV formula injection: prefix dangerous first chars with a single quote
  let safe = value;
  if (/^[=+\-@\t\r]/.test(safe)) {
    safe = `'${safe}`;
  }
  // Escape embedded double quotes and wrap in quotes
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function exportSmsAnalyticsCsv(params?: {
  startDate?: string;
  endDate?: string;
  userId?: string;
}): Promise<ActionResult<string>> {
  const result = await getSmsAnalytics(params);
  if (!result.success || !result.data) {
    return { success: false, error: result.error ?? "Failed to load data" };
  }

  const { summary, dailyVolume, templatePerformance, loLeaderboard } = result.data;

  const lines: string[] = [];

  // Summary section
  lines.push("SMS Analytics Summary");
  lines.push("Metric,Value");
  lines.push(`Total Sent,${summary.totalSent}`);
  lines.push(`Total Delivered,${summary.totalDelivered}`);
  lines.push(`Delivery Rate,${(summary.deliveryRate * 100).toFixed(1)}%`);
  lines.push(`Click Rate,${(summary.clickRate * 100).toFixed(1)}%`);
  lines.push(`Conversion Rate,${(summary.conversionRate * 100).toFixed(1)}%`);
  lines.push(`Total Cost,$${(summary.totalCostCents / 100).toFixed(2)}`);
  lines.push(`Cost Per Review,$${(summary.costPerReview / 100).toFixed(2)}`);
  lines.push("");

  // Daily volume
  lines.push("Daily Volume");
  lines.push("Date,Sent,Delivered,Failed,Clicked");
  for (const d of dailyVolume) {
    lines.push(`${d.date},${d.sent},${d.delivered},${d.failed},${d.clicked}`);
  }
  lines.push("");

  // Template performance
  lines.push("Template Performance");
  lines.push("Template,Category,Sends,Delivery Rate,Click Rate,Avg Cost");
  for (const t of templatePerformance) {
    lines.push(
      `${csvEscape(t.templateName)},${csvEscape(t.category)},${t.sends},` +
      `${(t.deliveryRate * 100).toFixed(1)}%,${(t.clickRate * 100).toFixed(1)}%,` +
      `$${(t.avgCostCents / 100).toFixed(2)}`
    );
  }
  lines.push("");

  // LO Leaderboard
  if (loLeaderboard.length > 0) {
    lines.push("LO Leaderboard");
    lines.push("Name,SMS Sent,Reviews Generated,Conversion Rate,Cost Per Review");
    for (const lo of loLeaderboard) {
      lines.push(
        `${csvEscape(lo.userName)},${lo.smsSent},${lo.reviewsGenerated},` +
        `${(lo.conversionRate * 100).toFixed(1)}%,$${(lo.costPerReview / 100).toFixed(2)}`
      );
    }
  }

  return { success: true, data: lines.join("\n") };
}
