"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import type { Database } from "@/types/database.types";
import type { ActionResult } from "./types";

type WidgetEventType = Database["public"]["Enums"]["widget_event_type"];

// ── Types ──────────────────────────────────────────────────────────────

export interface WidgetAnalyticsSummary {
  totalImpressions: number;
  totalClicks: number;
  clickThroughRate: number;
  writeReviewClicks: number;
  uniquePageUrls: number;
}

export interface DailyMetric {
  date: string;
  impressions: number;
  clicks: number;
}

export interface WidgetTableRow {
  widgetId: string;
  widgetConfigId: string;
  name: string;
  widgetType: string;
  impressions: number;
  clicks: number;
  ctr: number;
  topReferrer: string | null;
  status: string;
}

export interface WidgetDetailAnalytics {
  daily: DailyMetric[];
  eventBreakdown: { eventType: string; count: number }[];
  topPageUrls: { url: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
  geographicBreakdown: { ipHash: string; count: number }[];
}

// ── Helpers ────────────────────────────────────────────────────────────

interface AuthedContext {
  userId: string;
  organizationId: string;
}

async function getAuthedContext(): Promise<ActionResult<AuthedContext>> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();
  const { data: userData, error } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (error || !userData?.organization_id) {
    return { success: false, error: "Organization not found" };
  }

  if (userData.role !== "admin" && userData.role !== "manager") {
    return { success: false, error: "Insufficient permissions" };
  }

  return {
    success: true,
    data: { userId: user.id, organizationId: userData.organization_id },
  };
}

function getDateRange(range: string): { start: string; end: string } {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case "7d":
      start.setDate(end.getDate() - 7);
      break;
    case "90d":
      start.setDate(end.getDate() - 90);
      break;
    case "30d":
    default:
      start.setDate(end.getDate() - 30);
      break;
  }

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

const CLICK_EVENTS: WidgetEventType[] = [
  "click_review",
  "click_cta",
  "click_write_review",
  "banner_click",
];

// ── Dashboard Summary ──────────────────────────────────────────────────

export async function getWidgetAnalyticsSummary(
  dateRange: string = "30d",
  customStart?: string,
  customEnd?: string
): Promise<ActionResult<WidgetAnalyticsSummary>> {
  try {
    const ctx = await getAuthedContext();
    if (!ctx.success) return ctx;

    const { start, end } =
      customStart && customEnd
        ? { start: customStart, end: customEnd }
        : getDateRange(dateRange);

    const supabase = createAdminClient();

    // Get all widget_ids for this organization
    const { data: widgets, error: wErr } = await supabase
      .from("widget_configs")
      .select("widget_id")
      .eq("organization_id", ctx.data.organizationId);

    if (wErr || !widgets || widgets.length === 0) {
      return {
        success: true,
        data: {
          totalImpressions: 0,
          totalClicks: 0,
          clickThroughRate: 0,
          writeReviewClicks: 0,
          uniquePageUrls: 0,
        },
      };
    }

    const widgetIds = widgets.map((w) => w.widget_id);

    // Aggregate events using separate queries for clarity
    const { count: totalImpressions } = await supabase
      .from("widget_events")
      .select("id", { count: "exact", head: true })
      .in("widget_id", widgetIds)
      .eq("event_type", "impression")
      .gte("created_at", `${start}T00:00:00Z`)
      .lte("created_at", `${end}T23:59:59Z`);

    const { count: totalClicks } = await supabase
      .from("widget_events")
      .select("id", { count: "exact", head: true })
      .in("widget_id", widgetIds)
      .in("event_type", CLICK_EVENTS)
      .gte("created_at", `${start}T00:00:00Z`)
      .lte("created_at", `${end}T23:59:59Z`);

    const { count: writeReviewClicks } = await supabase
      .from("widget_events")
      .select("id", { count: "exact", head: true })
      .in("widget_id", widgetIds)
      .eq("event_type", "click_write_review")
      .gte("created_at", `${start}T00:00:00Z`)
      .lte("created_at", `${end}T23:59:59Z`);

    // Unique page URLs - fetch distinct values
    const { data: pageUrlData } = await supabase
      .from("widget_events")
      .select("page_url")
      .in("widget_id", widgetIds)
      .not("page_url", "is", null)
      .gte("created_at", `${start}T00:00:00Z`)
      .lte("created_at", `${end}T23:59:59Z`);

    const uniqueUrls = new Set(pageUrlData?.map((r) => r.page_url) ?? []);

    const imp = totalImpressions ?? 0;
    const clk = totalClicks ?? 0;
    const ctr = imp > 0 ? (clk / imp) * 100 : 0;

    return {
      success: true,
      data: {
        totalImpressions: imp,
        totalClicks: clk,
        clickThroughRate: Math.round(ctr * 100) / 100,
        writeReviewClicks: writeReviewClicks ?? 0,
        uniquePageUrls: uniqueUrls.size,
      },
    };
  } catch (err) {
    console.error("getWidgetAnalyticsSummary error:", err);
    return { success: false, error: "Failed to load analytics summary" };
  }
}

// ── Daily Impressions & Clicks ─────────────────────────────────────────

export async function getWidgetDailyMetrics(
  dateRange: string = "30d",
  customStart?: string,
  customEnd?: string
): Promise<ActionResult<DailyMetric[]>> {
  try {
    const ctx = await getAuthedContext();
    if (!ctx.success) return ctx;

    const { start, end } =
      customStart && customEnd
        ? { start: customStart, end: customEnd }
        : getDateRange(dateRange);

    const supabase = createAdminClient();

    const { data: widgets } = await supabase
      .from("widget_configs")
      .select("widget_id")
      .eq("organization_id", ctx.data.organizationId);

    if (!widgets || widgets.length === 0) {
      return { success: true, data: [] };
    }

    const widgetIds = widgets.map((w) => w.widget_id);

    // Fetch all events in range and aggregate client-side by date
    // This is more efficient than N separate date queries
    const { data: events, error } = await supabase
      .from("widget_events")
      .select("event_type, created_at")
      .in("widget_id", widgetIds)
      .gte("created_at", `${start}T00:00:00Z`)
      .lte("created_at", `${end}T23:59:59Z`)
      .order("created_at", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    // Group by date
    const dayMap = new Map<string, { impressions: number; clicks: number }>();

    // Pre-fill all dates in range
    const current = new Date(start);
    const endDate = new Date(end);
    while (current <= endDate) {
      dayMap.set(current.toISOString().slice(0, 10), {
        impressions: 0,
        clicks: 0,
      });
      current.setDate(current.getDate() + 1);
    }

    for (const event of events ?? []) {
      const day = event.created_at.slice(0, 10);
      const entry = dayMap.get(day) ?? { impressions: 0, clicks: 0 };
      if (event.event_type === "impression") {
        entry.impressions++;
      } else if (CLICK_EVENTS.includes(event.event_type)) {
        entry.clicks++;
      }
      dayMap.set(day, entry);
    }

    const metrics: DailyMetric[] = [];
    for (const [date, counts] of dayMap) {
      metrics.push({ date, ...counts });
    }

    return { success: true, data: metrics };
  } catch (err) {
    console.error("getWidgetDailyMetrics error:", err);
    return { success: false, error: "Failed to load daily metrics" };
  }
}

// ── Per-Widget Table ───────────────────────────────────────────────────

export async function getWidgetTableData(
  dateRange: string = "30d",
  customStart?: string,
  customEnd?: string
): Promise<ActionResult<WidgetTableRow[]>> {
  try {
    const ctx = await getAuthedContext();
    if (!ctx.success) return ctx;

    const { start, end } =
      customStart && customEnd
        ? { start: customStart, end: customEnd }
        : getDateRange(dateRange);

    const supabase = createAdminClient();

    // Fetch widgets for org
    const { data: widgets, error: wErr } = await supabase
      .from("widget_configs")
      .select("id, widget_id, name, widget_type, status")
      .eq("organization_id", ctx.data.organizationId)
      .is("parent_widget_id", null);

    if (wErr || !widgets) {
      return { success: false, error: "Failed to load widgets" };
    }

    if (widgets.length === 0) {
      return { success: true, data: [] };
    }

    const widgetIds = widgets.map((w) => w.widget_id);

    // Fetch all events for all org widgets in range
    const { data: events, error: eErr } = await supabase
      .from("widget_events")
      .select("widget_id, event_type, referrer")
      .in("widget_id", widgetIds)
      .gte("created_at", `${start}T00:00:00Z`)
      .lte("created_at", `${end}T23:59:59Z`);

    if (eErr) {
      return { success: false, error: eErr.message };
    }

    // Aggregate per widget
    const statsMap = new Map<
      string,
      {
        impressions: number;
        clicks: number;
        referrerCounts: Map<string, number>;
      }
    >();

    for (const event of events ?? []) {
      const entry = statsMap.get(event.widget_id) ?? {
        impressions: 0,
        clicks: 0,
        referrerCounts: new Map(),
      };

      if (event.event_type === "impression") {
        entry.impressions++;
      } else if (CLICK_EVENTS.includes(event.event_type)) {
        entry.clicks++;
      }

      if (event.referrer) {
        const count = entry.referrerCounts.get(event.referrer) ?? 0;
        entry.referrerCounts.set(event.referrer, count + 1);
      }

      statsMap.set(event.widget_id, entry);
    }

    const rows: WidgetTableRow[] = widgets.map((w) => {
      const stats = statsMap.get(w.widget_id);
      const impressions = stats?.impressions ?? 0;
      const clicks = stats?.clicks ?? 0;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

      let topReferrer: string | null = null;
      if (stats?.referrerCounts.size) {
        let maxCount = 0;
        for (const [ref, count] of stats.referrerCounts) {
          if (count > maxCount) {
            maxCount = count;
            topReferrer = ref;
          }
        }
      }

      return {
        widgetId: w.widget_id,
        widgetConfigId: w.id,
        name: w.name,
        widgetType: w.widget_type,
        impressions,
        clicks,
        ctr: Math.round(ctr * 100) / 100,
        topReferrer,
        status: w.status,
      };
    });

    // Sort by impressions descending by default
    rows.sort((a, b) => b.impressions - a.impressions);

    return { success: true, data: rows };
  } catch (err) {
    console.error("getWidgetTableData error:", err);
    return { success: false, error: "Failed to load widget table data" };
  }
}

// ── Widget Detail Analytics ────────────────────────────────────────────

export async function getWidgetDetailAnalytics(
  widgetId: string,
  dateRange: string = "30d",
  customStart?: string,
  customEnd?: string
): Promise<ActionResult<WidgetDetailAnalytics>> {
  try {
    const ctx = await getAuthedContext();
    if (!ctx.success) return ctx;

    const { start, end } =
      customStart && customEnd
        ? { start: customStart, end: customEnd }
        : getDateRange(dateRange);

    const supabase = createAdminClient();

    // Verify widget belongs to org
    const { data: widget, error: wErr } = await supabase
      .from("widget_configs")
      .select("widget_id")
      .eq("widget_id", widgetId)
      .eq("organization_id", ctx.data.organizationId)
      .maybeSingle();

    if (wErr || !widget) {
      return { success: false, error: "Widget not found" };
    }

    // Fetch all events for this widget in range
    const { data: events, error: eErr } = await supabase
      .from("widget_events")
      .select("event_type, page_url, referrer, ip_hash, created_at")
      .eq("widget_id", widgetId)
      .gte("created_at", `${start}T00:00:00Z`)
      .lte("created_at", `${end}T23:59:59Z`)
      .order("created_at", { ascending: true });

    if (eErr) {
      return { success: false, error: eErr.message };
    }

    // Daily metrics
    const dayMap = new Map<string, { impressions: number; clicks: number }>();
    const current = new Date(start);
    const endDate = new Date(end);
    while (current <= endDate) {
      dayMap.set(current.toISOString().slice(0, 10), {
        impressions: 0,
        clicks: 0,
      });
      current.setDate(current.getDate() + 1);
    }

    // Event type breakdown
    const eventCounts = new Map<string, number>();

    // Page URL counts
    const urlCounts = new Map<string, number>();

    // Referrer counts
    const refCounts = new Map<string, number>();

    // IP hash counts (geographic proxy)
    const ipHashCounts = new Map<string, number>();

    for (const event of events ?? []) {
      const day = event.created_at.slice(0, 10);
      const entry = dayMap.get(day) ?? { impressions: 0, clicks: 0 };

      if (event.event_type === "impression") {
        entry.impressions++;
      } else if (CLICK_EVENTS.includes(event.event_type)) {
        entry.clicks++;
      }
      dayMap.set(day, entry);

      // Event type
      const ec = eventCounts.get(event.event_type) ?? 0;
      eventCounts.set(event.event_type, ec + 1);

      // Page URL
      if (event.page_url) {
        const uc = urlCounts.get(event.page_url) ?? 0;
        urlCounts.set(event.page_url, uc + 1);
      }

      // Referrer
      if (event.referrer) {
        const rc = refCounts.get(event.referrer) ?? 0;
        refCounts.set(event.referrer, rc + 1);
      }

      // IP hash (geographic proxy)
      if (event.ip_hash) {
        const ic = ipHashCounts.get(event.ip_hash) ?? 0;
        ipHashCounts.set(event.ip_hash, ic + 1);
      }
    }

    const daily: DailyMetric[] = Array.from(dayMap, ([date, counts]) => ({
      date,
      ...counts,
    }));

    const eventBreakdown = Array.from(eventCounts, ([eventType, count]) => ({
      eventType,
      count,
    })).sort((a, b) => b.count - a.count);

    const topPageUrls = Array.from(urlCounts, ([url, count]) => ({
      url,
      count,
    }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topReferrers = Array.from(refCounts, ([referrer, count]) => ({
      referrer,
      count,
    }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const geographicBreakdown = Array.from(
      ipHashCounts,
      ([ipHash, count]) => ({ ipHash, count })
    )
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      success: true,
      data: {
        daily,
        eventBreakdown,
        topPageUrls,
        topReferrers,
        geographicBreakdown,
      },
    };
  } catch (err) {
    console.error("getWidgetDetailAnalytics error:", err);
    return { success: false, error: "Failed to load widget detail analytics" };
  }
}

// ── CSV Export Data ────────────────────────────────────────────────────

export async function getWidgetAnalyticsCsvData(
  dateRange: string = "30d",
  customStart?: string,
  customEnd?: string
): Promise<ActionResult<string>> {
  const result = await getWidgetTableData(dateRange, customStart, customEnd);
  if (!result.success) return result;

  const header = "Widget Name,Type,Impressions,Clicks,CTR (%),Top Referrer,Status";
  const rows = result.data.map((r) =>
    [
      `"${r.name.replace(/"/g, '""')}"`,
      r.widgetType,
      r.impressions,
      r.clicks,
      r.ctr.toFixed(2),
      r.topReferrer ? `"${r.topReferrer.replace(/"/g, '""')}"` : "",
      r.status,
    ].join(",")
  );

  return { success: true, data: [header, ...rows].join("\n") };
}
