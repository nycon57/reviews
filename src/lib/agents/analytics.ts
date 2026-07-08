import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database.types";
import type { BotCategory } from "./detection";

type AgentTrafficLogRow = Pick<
  Tables<"agent_traffic_logs">,
  "page_path" | "bot_name" | "bot_category" | "created_at"
>;

type ApiUsageLogRow = Pick<
  Tables<"api_usage_logs">,
  | "endpoint"
  | "method"
  | "tier"
  | "api_key_id"
  | "response_status"
  | "response_time_ms"
  | "created_at"
>;

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

const PAGE_SIZE = 1000;
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

function isOnOrAfter(rowDate: string, boundary: Date): boolean {
  return new Date(rowDate).getTime() >= boundary.getTime();
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

function createSummaryMetric(
  rows: Array<{ created_at: string }>,
  now: Date
): SummaryCardMetric {
  const currentBoundary = new Date(now);
  currentBoundary.setUTCDate(currentBoundary.getUTCDate() - 7);
  const previousBoundary = new Date(now);
  previousBoundary.setUTCDate(previousBoundary.getUTCDate() - 14);

  const current = rows.filter((row) => isOnOrAfter(row.created_at, currentBoundary)).length;
  const previous = rows.filter((row) => {
    const createdAt = new Date(row.created_at).getTime();
    return (
      createdAt >= previousBoundary.getTime() &&
      createdAt < currentBoundary.getTime()
    );
  }).length;

  return {
    value: current,
    previousValue: previous,
    trendPercent: calculateTrendPercent(current, previous),
  };
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

function getAverage(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getErrorRate(rows: ApiUsageLogRow[]): number {
  if (rows.length === 0) {
    return 0;
  }

  const errors = rows.filter((row) => (row.response_status ?? 0) >= 400).length;
  return roundPercent((errors / rows.length) * 100);
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

async function fetchAgentTrafficRows(
  supabase: ReturnType<typeof createAdminClient>,
  sinceIso: string
): Promise<AgentTrafficLogRow[]> {
  const rows: AgentTrafficLogRow[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("agent_traffic_logs")
      .select("page_path, bot_name, bot_category, created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw new Error(error.message);
    }

    rows.push(...((data ?? []) as AgentTrafficLogRow[]));

    if ((data?.length ?? 0) < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return rows;
}

async function fetchApiUsageRows(
  supabase: ReturnType<typeof createAdminClient>,
  sinceIso: string
): Promise<ApiUsageLogRow[]> {
  const rows: ApiUsageLogRow[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("api_usage_logs")
      .select(
        "endpoint, method, tier, api_key_id, response_status, response_time_ms, created_at"
      )
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw new Error(error.message);
    }

    rows.push(...((data ?? []) as ApiUsageLogRow[]));

    if ((data?.length ?? 0) < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return rows;
}

function buildAgentTimeSeries(rows: AgentTrafficLogRow[], dayKeys: string[]): AgentTrafficDay[] {
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

  for (const row of rows) {
    const day = byDay.get(toDateKey(row.created_at));
    if (!day) {
      continue;
    }

    const category = AGENT_CATEGORIES.includes(row.bot_category as AgentChartCategory)
      ? (row.bot_category as AgentChartCategory)
      : "unknown";
    day[category] += 1;
  }

  return dayKeys.map((date) => byDay.get(date)!);
}

function buildApiTimeSeries(rows: ApiUsageLogRow[], dayKeys: string[]): ApiUsageDay[] {
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

  for (const row of rows) {
    const day = byDay.get(toDateKey(row.created_at));
    if (!day) {
      continue;
    }

    const tier = API_TIERS.includes(row.tier as ApiTier)
      ? (row.tier as ApiTier)
      : "open";
    day[tier] += 1;
  }

  return dayKeys.map((date) => byDay.get(date)!);
}

function buildEndpointMetrics(rows: ApiUsageLogRow[]): ApiEndpointMetric[] {
  const byEndpoint = new Map<
    string,
    { count: number; responseTimes: number[]; errorCount: number; methods: Set<string> }
  >();

  for (const row of rows) {
    const entry =
      byEndpoint.get(row.endpoint) ??
      { count: 0, responseTimes: [], errorCount: 0, methods: new Set<string>() };
    entry.count += 1;
    entry.methods.add(row.method);

    if (typeof row.response_time_ms === "number") {
      entry.responseTimes.push(row.response_time_ms);
    }

    if ((row.response_status ?? 0) >= 400) {
      entry.errorCount += 1;
    }

    byEndpoint.set(row.endpoint, entry);
  }

  return Array.from(byEndpoint.entries())
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([endpoint, entry]) => ({
      label: endpoint,
      value: entry.count,
      secondary: Array.from(entry.methods).sort().join(", "),
      averageResponseMs: getAverage(entry.responseTimes),
      errorRate: roundPercent((entry.errorCount / entry.count) * 100),
    }));
}

function buildMostQueriedProfessional(
  rows: ApiUsageLogRow[]
): MostQueriedProfessionalMetric | null {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const professionalId = getProfessionalIdFromEndpoint(row.endpoint);
    if (professionalId) {
      incrementMap(counts, professionalId);
    }
  }

  const [top] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

  if (!top) {
    return null;
  }

  return {
    label: top[0],
    count: top[1],
  };
}

export async function getAgentAnalyticsDashboardData(
  now = new Date()
): Promise<AgentAnalyticsDashboardData> {
  const supabase = createAdminClient();
  const dayKeys = getLastDayKeys(30, now);
  const sinceIso = `${dayKeys[0]}T00:00:00.000Z`;

  const [agentRows, apiRows] = await Promise.all([
    fetchAgentTrafficRows(supabase, sinceIso),
    fetchApiUsageRows(supabase, sinceIso),
  ]);

  const botCounts = new Map<string, number>();
  const pageCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();

  for (const row of agentRows) {
    incrementMap(botCounts, row.bot_name);
    incrementMap(pageCounts, row.page_path);
    incrementMap(
      categoryCounts,
      AGENT_CATEGORIES.includes(row.bot_category as AgentChartCategory)
        ? row.bot_category
        : "unknown"
    );
  }

  const responseTimes = apiRows
    .map((row) => row.response_time_ms)
    .filter((value): value is number => typeof value === "number");
  const usageByApiKeyCounts = new Map<string, number>();

  for (const row of apiRows) {
    incrementMap(usageByApiKeyCounts, row.api_key_id ?? "open-tier");
  }

  const current7dBoundary = new Date(now);
  current7dBoundary.setUTCDate(current7dBoundary.getUTCDate() - 7);
  const apiRows7d = apiRows.filter((row) => isOnOrAfter(row.created_at, current7dBoundary));
  const uniqueApiKeys7d = new Set(
    apiRows7d
      .map((row) => row.api_key_id)
      .filter((apiKeyId): apiKeyId is string => Boolean(apiKeyId))
  ).size;

  return {
    generatedAt: now.toISOString(),
    agentTraffic: {
      total30d: agentRows.length,
      total7d: createSummaryMetric(agentRows, now),
      timeSeries: buildAgentTimeSeries(agentRows, dayKeys),
      topBots: toRankedMetrics(botCounts, 10),
      categoryBreakdown: toRankedMetrics(categoryCounts, 10),
      topPages: toRankedMetrics(pageCounts, 10),
    },
    apiUsage: {
      total30d: apiRows.length,
      total7d: createSummaryMetric(apiRows, now),
      uniqueApiKeys7d,
      timeSeries: buildApiTimeSeries(apiRows, dayKeys),
      topEndpoints: buildEndpointMetrics(apiRows),
      averageResponseMs: getAverage(responseTimes),
      errorRate: getErrorRate(apiRows),
      usageByApiKey: toRankedMetrics(usageByApiKeyCounts, 10, formatApiKeyLabel),
      mostQueriedProfessional: buildMostQueriedProfessional(apiRows),
    },
  };
}
