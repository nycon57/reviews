"use server";

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";

interface ActionResult<T = void> {
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

// ── Types ─────────────────────────────────────────────────────────────

export interface TemplatePerformanceMetrics {
  template_id: string;
  total_sends: number;
  delivered_count: number;
  delivery_rate: number;
  click_count: number;
  click_rate: number;
  conversion_count: number;
  conversion_rate: number;
  last_used_at: string | null;
}

export interface DailyTrend {
  date: string;
  sends: number;
  delivered: number;
  clicks: number;
}

// ── Actions ───────────────────────────────────────────────────────────

/**
 * Get performance metrics for a single template.
 * Aggregates from sms_messages and sms_short_links.
 */
export async function getTemplatePerformance(
  templateId: string
): Promise<ActionResult<TemplatePerformanceMetrics>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createUntypedAdminClient();

  // Get message stats for this template
  const { data: messages, error: msgError } = await supabase
    .from("sms_messages")
    .select("id, status, short_link_id, sent_at")
    .eq("organization_id", context.organization_id)
    .eq("template_id", templateId)
    .eq("direction", "outbound");

  if (msgError) {
    return { success: false, error: `Failed to load metrics: ${msgError.message}` };
  }

  const allMessages = messages ?? [];
  const totalSends = allMessages.length;
  const deliveredCount = allMessages.filter((m) => m.status === "delivered").length;

  // Get click data from short links
  const shortLinkIds = allMessages
    .map((m) => m.short_link_id)
    .filter(Boolean) as string[];

  let clickCount = 0;
  if (shortLinkIds.length > 0) {
    const { data: linkData } = await supabase
      .from("sms_short_links")
      .select("click_count")
      .in("id", shortLinkIds)
      .gt("click_count", 0);

    clickCount = (linkData ?? []).reduce(
      (sum, link) => sum + ((link.click_count as number) || 0),
      0
    );
  }

  // Conversion tracking requires event correlation (e.g. source_message_id on reviews).
  // Until that column exists, report 0 to avoid showing misleading data.
  const conversionCount = 0;

  const lastUsedAt = allMessages.reduce<string | null>((latest, m) => {
    if (!m.sent_at) return latest;
    return !latest || m.sent_at > latest ? m.sent_at : latest;
  }, null);

  return {
    success: true,
    data: {
      template_id: templateId,
      total_sends: totalSends,
      delivered_count: deliveredCount,
      delivery_rate: totalSends > 0 ? deliveredCount / totalSends : 0,
      click_count: clickCount,
      click_rate: deliveredCount > 0 ? clickCount / deliveredCount : 0,
      conversion_count: conversionCount,
      conversion_rate: clickCount > 0 ? conversionCount / clickCount : 0,
      last_used_at: lastUsedAt,
    },
  };
}

/**
 * Get 30-day daily trend data for a template.
 */
export async function getTemplateTrend(
  templateId: string
): Promise<ActionResult<DailyTrend[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createUntypedAdminClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from("sms_messages")
    .select("status, sent_at, short_link_id")
    .eq("organization_id", context.organization_id)
    .eq("template_id", templateId)
    .eq("direction", "outbound")
    .gte("sent_at", thirtyDaysAgo.toISOString());

  if (error) {
    return { success: false, error: `Failed to load trend: ${error.message}` };
  }

  // Aggregate by day
  const dayMap = new Map<string, DailyTrend>();
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, { date: key, sends: 0, delivered: 0, clicks: 0 });
  }

  for (const msg of data ?? []) {
    if (!msg.sent_at) continue;
    const day = msg.sent_at.slice(0, 10);
    const entry = dayMap.get(day);
    if (entry) {
      entry.sends++;
      if (msg.status === "delivered") entry.delivered++;
    }
  }

  return {
    success: true,
    data: Array.from(dayMap.values()),
  };
}

/**
 * Get performance metrics for all active templates in an org (summary view).
 */
export async function getAllTemplatePerformance(): Promise<
  ActionResult<Record<string, { sends: number; click_rate: number; last_used: string | null }>>
> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createUntypedAdminClient();

  // Get all messages grouped by template
  const { data, error } = await supabase
    .from("sms_messages")
    .select("template_id, status, short_link_id, sent_at")
    .eq("organization_id", context.organization_id)
    .eq("direction", "outbound")
    .not("template_id", "is", null);

  if (error) {
    return { success: false, error: `Failed to load metrics: ${error.message}` };
  }

  const metrics: Record<string, { sends: number; delivered: number; shortLinkIds: string[]; last_used: string | null }> = {};

  for (const msg of data ?? []) {
    const tid = msg.template_id as string;
    if (!metrics[tid]) {
      metrics[tid] = { sends: 0, delivered: 0, shortLinkIds: [], last_used: null };
    }
    metrics[tid].sends++;
    if (msg.status === "delivered") metrics[tid].delivered++;
    if (msg.short_link_id) metrics[tid].shortLinkIds.push(msg.short_link_id as string);
    if (msg.sent_at && (!metrics[tid].last_used || msg.sent_at > metrics[tid].last_used)) {
      metrics[tid].last_used = msg.sent_at;
    }
  }

  // Batch-fetch click counts for all short links
  const allLinkIds = Object.values(metrics).flatMap((m) => m.shortLinkIds);
  const clicksByLink = new Map<string, number>();

  if (allLinkIds.length > 0) {
    const { data: linkData } = await supabase
      .from("sms_short_links")
      .select("id, click_count")
      .in("id", allLinkIds)
      .gt("click_count", 0);

    for (const link of linkData ?? []) {
      clicksByLink.set(link.id as string, (link.click_count as number) || 0);
    }
  }

  // Build result
  const result: Record<string, { sends: number; click_rate: number; last_used: string | null }> = {};
  for (const [tid, m] of Object.entries(metrics)) {
    const clicks = m.shortLinkIds.reduce(
      (sum, id) => sum + (clicksByLink.get(id) ?? 0),
      0
    );
    result[tid] = {
      sends: m.sends,
      click_rate: m.delivered > 0 ? clicks / m.delivered : 0,
      last_used: m.last_used,
    };
  }

  return { success: true, data: result };
}
