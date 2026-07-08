import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";
import type { BotCategory } from "./detection";

export type AgentChartCategory = BotCategory;
export type ApiTier = "open" | "keyed";

export interface AgentTrafficDay {
  date: string;
  search: number;
  llm: number;
  agent: number;
  unknown: number;
}

export interface ApiUsageDay {
  date: string;
  open: number;
  keyed: number;
}

export interface RankedMetric {
  label: string;
  value: number;
  secondary?: string;
}

export interface ApiEndpointMetric extends RankedMetric {
  averageResponseMs: number | null;
  errorRate: number;
}

export interface SummaryCardMetric {
  value: number;
  previousValue: number;
  trendPercent: number;
}

export interface MostQueriedProfessionalMetric {
  label: string;
  count: number;
  secondary: string;
}

export interface AgentAnalyticsDashboardData {
  generatedAt: string;
  agentTraffic: {
    total30d: number;
    total7d: SummaryCardMetric;
    timeSeries: AgentTrafficDay[];
    topBots: RankedMetric[];
    categoryBreakdown: RankedMetric[];
    topPages: RankedMetric[];
  };
  apiUsage: {
    total30d: number;
    total7d: SummaryCardMetric;
    uniqueApiKeys7d: number;
    timeSeries: ApiUsageDay[];
    topEndpoints: ApiEndpointMetric[];
    averageResponseMs: number | null;
    errorRate: number;
    usageByApiKey: RankedMetric[];
    mostQueriedProfessional: MostQueriedProfessionalMetric | null;
  };
}

const AGENT_CATEGORIES: AgentChartCategory[] = [
  "search",
  "llm",
  "agent",
  "unknown",
];
const API_TIERS: ApiTier[] = ["open", "keyed"];

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toDateKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

function getLastDayKeys(days: number, now: Date): string[] {
  const today = startOfUtcDay(now);
  const firstDay = addUtcDays(today, -(days - 1));

  return Array.from({ length: days }, (_, index) =>
    toDateKey(addUtcDays(firstDay, index))
  );
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

function calculateTrendPercent(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return roundPercent(((current - previous) / previous) * 100);
}

function incrementMap(map: Map<string, number>, key: string, amount = 1): void {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function toRankedMetrics(
  counts: Map<string, number>,
  limit: number,
  secondary?: (label: string) => string | undefined
): RankedMetric[] {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, value]) => ({
      label,
      value,
      secondary: secondary?.(label),
    }));
}

function getProfessionalIdFromEndpoint(endpoint: string): string | null {
  const match = endpoint.match(/(?:\/api)?\/v2\/professionals\/([^/?#]+)/i);
  if (!match?.[1]) {
    return null;
  }

  return decodeURIComponent(match[1]);
}

function formatApiKeyLabel(apiKeyId: string): string {
  if (apiKeyId === "open-tier") {
    return "Open tier";
  }

  return `Key ${apiKeyId.slice(0, 8)}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const record = asRecord(item);
    return record ? [record] : [];
  });
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getRpcPayload(value: Json | null): Record<string, unknown> {
  return asRecord(value) ?? {};
}

function createSummaryMetricFromDaily(
  valuesByDay: Map<string, number>,
  dayKeys: string[]
): SummaryCardMetric {
  const currentKeys = dayKeys.slice(-7);
  const previousKeys = dayKeys.slice(-14, -7);
  const current = currentKeys.reduce((sum, day) => sum + (valuesByDay.get(day) ?? 0), 0);
  const previous = previousKeys.reduce((sum, day) => sum + (valuesByDay.get(day) ?? 0), 0);

  return {
    value: current,
    previousValue: previous,
    trendPercent: calculateTrendPercent(current, previous),
  };
}

function buildAgentTimeSeries(
  dailyRows: Record<string, unknown>[],
  dayKeys: string[]
): AgentTrafficDay[] {
  const byDay = new Map<string, AgentTrafficDay>(
    dayKeys.map((date) => [
      date,
      {
        date,
        search: 0,
        llm: 0,
        agent: 0,
        unknown: 0,
      },
    ])
  );

  for (const row of dailyRows) {
    const rawDay = asString(row.day);
    if (!rawDay) continue;

    const day = byDay.get(toDateKey(rawDay));
    if (!day) {
      continue;
    }

    const rawCategory = asString(row.bot_category);
    const category = AGENT_CATEGORIES.includes(rawCategory as AgentChartCategory)
      ? (rawCategory as AgentChartCategory)
      : "unknown";
    day[category] += asNumber(row.visits);
  }

  return dayKeys.map((date) => byDay.get(date)!);
}

function buildApiTimeSeries(
  dailyRows: Record<string, unknown>[],
  dayKeys: string[]
): ApiUsageDay[] {
  const byDay = new Map<string, ApiUsageDay>(
    dayKeys.map((date) => [
      date,
      {
        date,
        open: 0,
        keyed: 0,
      },
    ])
  );

  for (const row of dailyRows) {
    const rawDay = asString(row.day);
    if (!rawDay) continue;

    const day = byDay.get(toDateKey(rawDay));
    if (!day) {
      continue;
    }

    const rawTier = asString(row.tier);
    const tier = API_TIERS.includes(rawTier as ApiTier)
      ? (rawTier as ApiTier)
      : "open";
    day[tier] += asNumber(row.requests);
  }

  return dayKeys.map((date) => byDay.get(date)!);
}

function sumDaily(rows: Record<string, unknown>[], valueKey: "visits" | "requests"): number {
  return rows.reduce((sum, row) => sum + asNumber(row[valueKey]), 0);
}

function totalByDay(
  rows: Record<string, unknown>[],
  valueKey: "visits" | "requests"
): Map<string, number> {
  const totals = new Map<string, number>();

  for (const row of rows) {
    const day = asString(row.day);
    if (!day) continue;
    incrementMap(totals, toDateKey(day), asNumber(row[valueKey]));
  }

  return totals;
}

function rankedFromRows(
  rows: Record<string, unknown>[],
  labelKeys: string[],
  valueKey: "visits" | "requests"
): RankedMetric[] {
  return rows
    .map((row) => {
      const label =
        labelKeys.map((key) => asString(row[key])).find((value) => value !== null) ??
        "Unknown";
      return {
        label,
        value: asNumber(row[valueKey]),
      };
    })
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, 10);
}

function buildEndpointMetrics(rows: Record<string, unknown>[]): ApiEndpointMetric[] {
  return rows
    .map((row) => {
      const endpoint = asString(row.endpoint) ?? "Unknown";
      const requests = asNumber(row.requests);
      const errorRate = asNullableNumber(row.error_rate);
      const errorCount = asNullableNumber(row.error_count);

      return {
        label: endpoint,
        value: requests,
        averageResponseMs: asNullableNumber(row.avg_response_ms),
        errorRate:
          errorRate ??
          (errorCount !== null && requests > 0
            ? roundPercent((errorCount / requests) * 100)
            : 0),
      };
    })
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, 10);
}

function getTopProfessionalQuery(
  endpoints: ApiEndpointMetric[]
): { id: string; count: number } | null {
  const counts = new Map<string, number>();

  for (const endpoint of endpoints) {
    const professionalId = getProfessionalIdFromEndpoint(endpoint.label);
    if (professionalId) {
      incrementMap(counts, professionalId, endpoint.value);
    }
  }

  const [top] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

  if (!top) {
    return null;
  }

  return {
    id: top[0],
    count: top[1],
  };
}

async function resolveMostQueriedProfessional(
  supabase: ReturnType<typeof createAdminClient>,
  endpoints: ApiEndpointMetric[]
): Promise<MostQueriedProfessionalMetric | null> {
  const top = getTopProfessionalQuery(endpoints);
  if (!top) {
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("full_name, slug")
    .eq("id", top.id)
    .maybeSingle();

  const row = !error ? asRecord(data) : null;
  const fullName = asString(row?.full_name);
  const slug = asString(row?.slug);

  return {
    label: fullName ?? top.id,
    count: top.count,
    secondary: `/pro/${slug ?? top.id}`,
  };
}

export async function getAgentAnalyticsDashboardData(
  now = new Date()
): Promise<AgentAnalyticsDashboardData> {
  const supabase = createAdminClient();
  const dayKeys = getLastDayKeys(30, now);

  const [trafficResult, usageResult] = await Promise.all([
    supabase.rpc("agent_traffic_summary", { p_days: 30 }),
    supabase.rpc("api_usage_summary", { p_days: 30 }),
  ]);

  if (trafficResult.error) {
    throw new Error(trafficResult.error.message);
  }
  if (usageResult.error) {
    throw new Error(usageResult.error.message);
  }

  const trafficSummary = getRpcPayload(trafficResult.data);
  const usageSummary = getRpcPayload(usageResult.data);
  const trafficDaily = asArray(trafficSummary.daily);
  const usageDaily = asArray(usageSummary.daily);
  const usageTotals = asRecord(usageSummary.totals) ?? {};
  const topEndpoints = buildEndpointMetrics(asArray(usageSummary.top_endpoints));
  const mostQueriedProfessional = await resolveMostQueriedProfessional(
    supabase,
    topEndpoints
  );
  const trafficTotalByDay = totalByDay(trafficDaily, "visits");
  const usageTotalByDay = totalByDay(usageDaily, "requests");
  const totalRequests =
    asNullableNumber(usageTotals.total_requests) ?? sumDaily(usageDaily, "requests");
  const errorCount = asNumber(usageTotals.error_count);

  return {
    generatedAt: now.toISOString(),
    agentTraffic: {
      total30d:
        asNullableNumber(trafficSummary.total_visits) ?? sumDaily(trafficDaily, "visits"),
      total7d: createSummaryMetricFromDaily(trafficTotalByDay, dayKeys),
      timeSeries: buildAgentTimeSeries(trafficDaily, dayKeys),
      topBots: rankedFromRows(asArray(trafficSummary.top_bots), ["bot_name", "bot"], "visits"),
      categoryBreakdown: rankedFromRows(
        asArray(trafficSummary.category_totals),
        ["bot_category", "category"],
        "visits"
      ),
      topPages: rankedFromRows(
        asArray(trafficSummary.top_pages),
        ["page_path", "page", "path"],
        "visits"
      ),
    },
    apiUsage: {
      total30d: totalRequests,
      total7d: createSummaryMetricFromDaily(usageTotalByDay, dayKeys),
      uniqueApiKeys7d: asNumber(usageTotals.distinct_keys),
      timeSeries: buildApiTimeSeries(usageDaily, dayKeys),
      topEndpoints,
      averageResponseMs: asNullableNumber(usageTotals.avg_response_ms),
      errorRate: totalRequests > 0 ? roundPercent((errorCount / totalRequests) * 100) : 0,
      usageByApiKey: toRankedMetrics(
        new Map(
          asArray(usageSummary.by_key).map((row) => [
            asString(row.api_key_id) ?? "open-tier",
            asNumber(row.requests),
          ])
        ),
        10,
        formatApiKeyLabel
      ),
      mostQueriedProfessional,
    },
  };
}
