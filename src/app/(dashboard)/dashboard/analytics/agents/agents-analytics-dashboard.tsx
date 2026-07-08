"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartBar,
  Clock,
  GlobeHemisphereWest,
  Key,
  LinkSimple,
  PlugsConnected,
  Robot,
  WarningCircle,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CHART_COLORS,
  CHART_TOOLTIP_STYLE,
  TrendIndicator,
} from "@/components/analytics/chart-primitives";
import type {
  AgentAnalyticsDashboardData,
  ApiEndpointMetric,
  RankedMetric,
} from "@/lib/agents/analytics";

interface AgentsAnalyticsDashboardProps {
  data: AgentAnalyticsDashboardData;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function formatMs(value: number | null): string {
  if (value === null) {
    return "No data";
  }

  return `${formatNumber(value)} ms`;
}

function formatDayLabel(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

function shorten(value: string, maxLength = 44): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}...`;
}

function categoryBadgeClass(category: string): string {
  switch (category) {
    case "search":
      return "border-repwell-teal-300/30 bg-repwell-teal-300/10 text-repwell-teal-400";
    case "llm":
      return "border-repwell-sage-200/40 bg-repwell-sage-100/40 text-repwell-teal-500";
    case "agent":
      return "border-blue-300/40 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  trendPercent,
  valueHref,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trendPercent?: number;
  valueHref?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex min-h-[96px] items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {valueHref ? (
              <Link
                href={valueHref}
                className="block text-2xl font-bold text-heading transition-colors hover:text-repwell-teal-300"
              >
                {value}
              </Link>
            ) : (
              <p className="text-2xl font-bold text-heading">{value}</p>
            )}
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-repwell-teal-300/10 text-repwell-teal-300">
            {icon}
          </div>
        </div>
        {typeof trendPercent === "number" && (
          <div className="mt-3 flex items-center gap-2">
            <TrendIndicator value={trendPercent} />
            <span className="text-xs text-muted-foreground">vs previous 7 days</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyPanel({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-border/60 bg-repwell-sage-100/10 p-8 text-center dark:bg-repwell-teal-300/5">
      <div className="max-w-sm space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-repwell-sage-100 to-repwell-teal-300/10 text-repwell-teal-300">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-heading">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

function RankedList({
  items,
  emptyTitle,
  emptyDescription,
  valueLabel = "visits",
}: {
  items: RankedMetric[];
  emptyTitle: string;
  emptyDescription: string;
  valueLabel?: string;
}) {
  if (items.length === 0) {
    return (
      <EmptyPanel
        icon={<ChartBar className="h-7 w-7" weight="duotone" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-heading" title={item.label}>
                {shorten(item.secondary ?? item.label)}
              </p>
              {item.secondary && item.secondary !== item.label && (
                <p className="truncate text-xs text-muted-foreground" title={item.label}>
                  {shorten(item.label, 56)}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-heading">{formatNumber(item.value)}</p>
              <p className="text-xs text-muted-foreground">{valueLabel}</p>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-repwell-teal-300"
              style={{ width: `${Math.max(4, (item.value / maxValue) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EndpointList({ items }: { items: ApiEndpointMetric[] }) {
  if (items.length === 0) {
    return (
      <EmptyPanel
        icon={<PlugsConnected className="h-7 w-7" weight="duotone" />}
        title="No API usage yet"
        description="Public API requests will appear here once agents or integrations call v2 endpoints."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-border/60 bg-background/70 p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="shrink-0 text-[10px] uppercase">
                  {item.secondary || "GET"}
                </Badge>
                <p className="truncate text-sm font-medium text-heading" title={item.label}>
                  {item.label}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{formatMs(item.averageResponseMs)} avg</span>
                <span>{formatPercent(item.errorRate)} error rate</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-heading">{formatNumber(item.value)}</p>
              <p className="text-xs text-muted-foreground">requests</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AgentsAnalyticsDashboard({ data }: AgentsAnalyticsDashboardProps) {
  const hasAgentTraffic = data.agentTraffic.total30d > 0;
  const hasApiUsage = data.apiUsage.total30d > 0;
  const categoryPieData = data.agentTraffic.categoryBreakdown.map((item) => ({
    name: item.label,
    value: item.value,
  }));

  return (
    <div className="space-y-6">
      {!hasAgentTraffic && !hasApiUsage && (
        <EmptyPanel
          icon={<Robot className="h-7 w-7" weight="duotone" />}
          title="No agent traffic or API usage yet"
          description="This page is ready. Bot visits and v2 API requests will populate automatically once public pages or API endpoints receive traffic."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Agent visits"
          value={formatNumber(data.agentTraffic.total7d.value)}
          subtitle="Last 7 days"
          icon={<Robot className="h-5 w-5" weight="duotone" />}
          trendPercent={data.agentTraffic.total7d.trendPercent}
        />
        <SummaryCard
          title="API requests"
          value={formatNumber(data.apiUsage.total7d.value)}
          subtitle="Last 7 days"
          icon={<PlugsConnected className="h-5 w-5" weight="duotone" />}
          trendPercent={data.apiUsage.total7d.trendPercent}
        />
        <SummaryCard
          title="Active API keys"
          value={formatNumber(data.apiUsage.uniqueApiKeys7d)}
          subtitle="Keyed requests in the last 7 days"
          icon={<Key className="h-5 w-5" weight="duotone" />}
        />
        <SummaryCard
          title="Most queried professional"
          value={
            data.apiUsage.mostQueriedProfessional
              ? shorten(data.apiUsage.mostQueriedProfessional.label, 18)
              : "None yet"
          }
          subtitle={
            data.apiUsage.mostQueriedProfessional
              ? `${formatNumber(data.apiUsage.mostQueriedProfessional.count)} v2 requests`
              : "No professional detail traffic"
          }
          icon={<LinkSimple className="h-5 w-5" weight="duotone" />}
          valueHref={data.apiUsage.mostQueriedProfessional?.secondary}
        />
      </div>

      <section className="space-y-4" aria-labelledby="agent-traffic-heading">
        <div>
          <h2 id="agent-traffic-heading" className="text-lg font-semibold text-heading">
            Agent Traffic
          </h2>
          <p className="text-sm text-muted-foreground">
            Bot and agent visits detected on public profile and directory pages.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Visits by Category</CardTitle>
              <CardDescription>Daily visits over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {!hasAgentTraffic ? (
                <EmptyPanel
                  icon={<GlobeHemisphereWest className="h-7 w-7" weight="duotone" />}
                  title="No agent visits detected"
                  description="Search crawlers, LLM crawlers, and user-triggered agents will show here after they visit public pages."
                />
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data.agentTraffic.timeSeries}
                      margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
                    >
                      <CartesianGrid
                        stroke="hsl(var(--border))"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDayLabel}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        dy={10}
                      />
                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        dx={-10}
                      />
                      <Tooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                        labelFormatter={(value) => formatDayLabel(String(value))}
                      />
                      <Area
                        type="monotone"
                        dataKey="search"
                        stackId="1"
                        stroke={CHART_COLORS[0]}
                        fill={CHART_COLORS[0]}
                        fillOpacity={0.25}
                      />
                      <Area
                        type="monotone"
                        dataKey="llm"
                        stackId="1"
                        stroke={CHART_COLORS[1]}
                        fill={CHART_COLORS[1]}
                        fillOpacity={0.25}
                      />
                      <Area
                        type="monotone"
                        dataKey="agent"
                        stackId="1"
                        stroke={CHART_COLORS[2]}
                        fill={CHART_COLORS[2]}
                        fillOpacity={0.25}
                      />
                      <Area
                        type="monotone"
                        dataKey="unknown"
                        stackId="1"
                        stroke={CHART_COLORS[3]}
                        fill={CHART_COLORS[3]}
                        fillOpacity={0.18}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>Total visits by bot category</CardDescription>
            </CardHeader>
            <CardContent>
              {!hasAgentTraffic ? (
                <EmptyPanel
                  icon={<ChartBar className="h-7 w-7" weight="duotone" />}
                  title="No category data"
                  description="Categories appear as soon as traffic is logged."
                />
              ) : (
                <div className="space-y-4">
                  <div className="h-[190px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryPieData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={52}
                          outerRadius={82}
                          paddingAngle={3}
                        >
                          {categoryPieData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.agentTraffic.categoryBreakdown.map((item) => (
                      <Badge
                        key={item.label}
                        variant="outline"
                        className={categoryBadgeClass(item.label)}
                      >
                        {item.label}: {formatNumber(item.value)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Bots</CardTitle>
              <CardDescription>Top 10 bot names by visit count</CardDescription>
            </CardHeader>
            <CardContent>
              <RankedList
                items={data.agentTraffic.topBots}
                emptyTitle="No bots detected"
                emptyDescription="Known crawler and agent user agents will appear here."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Visited Pages</CardTitle>
              <CardDescription>Public pages with the most agent traffic</CardDescription>
            </CardHeader>
            <CardContent>
              <RankedList
                items={data.agentTraffic.topPages}
                emptyTitle="No page traffic"
                emptyDescription="Profile and directory page visits will appear here."
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="api-usage-heading">
        <div>
          <h2 id="api-usage-heading" className="text-lg font-semibold text-heading">
            API Usage
          </h2>
          <p className="text-sm text-muted-foreground">
            Public API v2 requests by tier, endpoint, latency, and key activity.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Requests by Tier</CardTitle>
              <CardDescription>Open and keyed traffic over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {!hasApiUsage ? (
                <EmptyPanel
                  icon={<PlugsConnected className="h-7 w-7" weight="duotone" />}
                  title="No API usage yet"
                  description="The v2 API usage chart will populate when open or keyed requests are logged."
                />
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.apiUsage.timeSeries}
                      margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
                    >
                      <CartesianGrid
                        stroke="hsl(var(--border))"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDayLabel}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        dy={10}
                      />
                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        dx={-10}
                      />
                      <Tooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                        labelFormatter={(value) => formatDayLabel(String(value))}
                      />
                      <Bar dataKey="open" stackId="tier" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="keyed" stackId="tier" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Health Snapshot</CardTitle>
              <CardDescription>Response time and error rate across v2 logs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border/60 bg-background/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg response</p>
                    <p className="mt-1 text-2xl font-bold text-heading">
                      {formatMs(data.apiUsage.averageResponseMs)}
                    </p>
                  </div>
                  <Clock className="h-5 w-5 text-repwell-teal-300" />
                </div>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Error rate</p>
                    <p className="mt-1 text-2xl font-bold text-heading">
                      {formatPercent(data.apiUsage.errorRate)}
                    </p>
                  </div>
                  <WarningCircle className="h-5 w-5 text-repwell-teal-300" />
                </div>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">30d total</p>
                    <p className="mt-1 text-2xl font-bold text-heading">
                      {formatNumber(data.apiUsage.total30d)}
                    </p>
                  </div>
                  <ChartBar className="h-5 w-5 text-repwell-teal-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Endpoints</CardTitle>
              <CardDescription>Requests, latency, and error rate by endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              <EndpointList items={data.apiUsage.topEndpoints} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage by API Key</CardTitle>
              <CardDescription>Open tier and keyed tier activity</CardDescription>
            </CardHeader>
            <CardContent>
              <RankedList
                items={data.apiUsage.usageByApiKey}
                emptyTitle="No API key activity"
                emptyDescription="Keyed v2 requests and open tier traffic will appear here."
                valueLabel="requests"
              />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
