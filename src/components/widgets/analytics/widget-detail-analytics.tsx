"use client";

import { memo, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  MapPin,
  Play,
  CheckCircle2,
  Clock,
  ArrowDownRight,
  MousePointerClick,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type {
  WidgetDetailAnalytics as DetailData,
  EnhancedAnalytics,
} from "@/lib/widgets/analytics-actions";
import { CHART_TOOLTIP_STYLE } from "@/components/analytics/chart-primitives";
import { getWidgetEventLevelCsvData } from "@/lib/widgets/analytics-actions";
import { useToast } from "@/hooks/use-toast";

const EVENT_COLORS: Record<string, string> = {
  impression: "#52796f",
  click_review: "#84a98c",
  click_cta: "#7c9eb8",
  click_write_review: "#cad2c5",
  video_play: "#d4a574",
  scroll_depth: "#354f52",
  banner_dismiss: "#c47c7c",
  banner_click: "#2f3e46",
  carousel_navigate: "#6b8f7b",
  filter_change: "#a3b8a0",
};

const EVENT_LABELS: Record<string, string> = {
  impression: "Impressions",
  click_review: "Review Clicks",
  click_cta: "CTA Clicks",
  click_write_review: "Write Review",
  video_play: "Video Plays",
  scroll_depth: "Scroll Depth",
  banner_dismiss: "Banner Dismiss",
  banner_click: "Banner Clicks",
  carousel_navigate: "Carousel Nav",
  filter_change: "Filter Changes",
};

interface WidgetDetailAnalyticsProps {
  widgetId: string;
  widgetName?: string;
  dateRange: string;
  customStart?: string;
  customEnd?: string;
  onBack: () => void;
}

export const WidgetDetailAnalyticsPanel = memo(
  function WidgetDetailAnalyticsPanel({
    widgetId,
    widgetName,
    dateRange,
    customStart,
    customEnd,
    onBack,
  }: WidgetDetailAnalyticsProps) {
    const [data, setData] = useState<DetailData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExporting, startExport] = useTransition();
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ range: dateRange });
        if (customStart) params.set("start", customStart);
        if (customEnd) params.set("end", customEnd);

        const res = await fetch(
          `/api/dashboard/widgets/${widgetId}/analytics?${params}`
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to fetch analytics");
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load analytics"
        );
      } finally {
        setIsLoading(false);
      }
    }, [widgetId, dateRange, customStart, customEnd]);

    // Initial fetch
    useEffect(() => {
      fetchData();
    }, [fetchData]);

    // Polling every 60s
    useEffect(() => {
      const interval = setInterval(fetchData, 60_000);
      return () => clearInterval(interval);
    }, [fetchData]);

    const handleEventExport = useCallback(() => {
      startExport(async () => {
        const result = await getWidgetEventLevelCsvData(
          widgetId,
          dateRange,
          customStart,
          customEnd
        );
        if (!result.success) {
          toast({ title: "Export failed", description: result.error, variant: "destructive" });
          return;
        }
        const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `widget-events-${widgetId}-${dateRange}.csv`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast({ title: "Export complete", description: "Event-level CSV downloaded." });
      });
    }, [widgetId, dateRange, customStart, customEnd, toast]);

    const chartData = useMemo(
      () =>
        (data?.daily ?? []).map((d) => ({
          ...d,
          label: format(new Date(d.date), "MMM d"),
        })),
      [data?.daily]
    );

    const pieData = useMemo(
      () =>
        (data?.eventBreakdown ?? []).map((e) => ({
          name: EVENT_LABELS[e.eventType] ?? e.eventType,
          value: e.count,
          color: EVENT_COLORS[e.eventType] ?? "#84a98c",
        })),
      [data?.eventBreakdown]
    );

    if (isLoading && !data) {
      return (
        <div className="space-y-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft size={14} /> Back to overview
          </Button>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[400px] rounded-xl" />
            <Skeleton className="h-[400px] rounded-xl" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[300px] rounded-xl" />
            <Skeleton className="h-[300px] rounded-xl" />
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="space-y-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft size={14} /> Back to overview
          </Button>
          <Card className="border-border">
            <CardContent className="py-16 text-center text-muted-foreground">
              <p className="text-sm">{error}</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft size={14} /> Back
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-heading">
                {widgetName ?? widgetId}
              </h2>
              <p className="text-xs text-muted-foreground">
                Detailed performance analytics
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEventExport}
            disabled={isExporting}
            className="gap-2"
          >
            <Download size={14} />
            {isExporting ? "Exporting\u2026" : "Export Events CSV"}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Daily chart */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Daily Performance</CardTitle>
              <CardDescription>Impressions and clicks over time</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
                  No data for this period
                </div>
              ) : (
                <>
                  <div className="h-[250px] w-full" aria-hidden="true">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="detail-grad-imp"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#52796f"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#52796f"
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="detail-grad-clk"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#84a98c"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#84a98c"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 11,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 11,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                          dx={-10}
                        />
                        <Tooltip
                          contentStyle={{
                            ...CHART_TOOLTIP_STYLE,
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Area
                          type="monotone"
                          dataKey="impressions"
                          name="Impressions"
                          stroke="#52796f"
                          strokeWidth={2}
                          fill="url(#detail-grad-imp)"
                          connectNulls
                        />
                        <Area
                          type="monotone"
                          dataKey="clicks"
                          name="Clicks"
                          stroke="#84a98c"
                          strokeWidth={2}
                          fill="url(#detail-grad-clk)"
                          connectNulls
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <table className="sr-only">
                    <caption>Daily impressions and clicks</caption>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Impressions</th>
                        <th>Clicks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((d) => (
                        <tr key={d.date}>
                          <td>{d.label}</td>
                          <td>{d.impressions}</td>
                          <td>{d.clicks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </CardContent>
          </Card>

          {/* Event type pie chart */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Event Breakdown</CardTitle>
              <CardDescription>Distribution by event type</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
                  No events recorded
                </div>
              ) : (
                <>
                  <div className="h-[250px] w-full" aria-hidden="true">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            ...CHART_TOOLTIP_STYLE,
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value: string) => (
                            <span className="text-xs text-muted-foreground">
                              {value}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <table className="sr-only">
                    <caption>Event type breakdown</caption>
                    <thead>
                      <tr>
                        <th>Event Type</th>
                        <th>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pieData.map((entry) => (
                        <tr key={entry.name}>
                          <td>{entry.name}</td>
                          <td>{entry.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top page URLs */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Top Pages</CardTitle>
              <CardDescription>Pages where this widget appears</CardDescription>
            </CardHeader>
            <CardContent>
              {!data?.topPageUrls?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No page data available
                </p>
              ) : (
                <div className="space-y-2">
                  {data.topPageUrls.map((item) => (
                    <div
                      key={item.url}
                      className="flex items-center justify-between gap-3 py-2 border-b border-border-subtle last:border-0"
                    >
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-repwell-teal-300 hover:text-repwell-teal-400 dark:hover:text-muted-foreground truncate flex items-center gap-1 max-w-[80%]"
                      >
                        {item.url}
                        <ExternalLink size={10} className="flex-shrink-0" />
                      </a>
                      <span className="text-xs font-medium tabular-nums text-muted-foreground">
                        {item.count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top referrers */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Top Referrers</CardTitle>
              <CardDescription>
                Where your widget traffic comes from
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!data?.topReferrers?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No referrer data available
                </p>
              ) : (
                <div className="space-y-2">
                  {data.topReferrers.map((item) => (
                    <div
                      key={item.referrer}
                      className="flex items-center justify-between gap-3 py-2 border-b border-border-subtle last:border-0"
                    >
                      <span className="text-xs text-label truncate max-w-[80%]">
                        {item.referrer}
                      </span>
                      <span className="text-xs font-medium tabular-nums text-muted-foreground">
                        {item.count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Geographic breakdown */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-repwell-teal-300" />
              <div>
                <CardTitle className="text-base">
                  Geographic Breakdown
                </CardTitle>
                <CardDescription>
                  Unique visitor distribution
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!data?.geographicBreakdown?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No geographic data available yet
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {data.geographicBreakdown.map((item) => (
                  <div
                    key={item.ipHash}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
                  >
                    <span
                      className="text-xs text-muted-foreground font-mono truncate max-w-[70%]"
                      title={item.ipHash}
                    >
                      {item.ipHash.slice(0, 8)}&hellip;
                    </span>
                    <span className="text-xs font-medium tabular-nums text-heading">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Analytics Sections */}
        {data?.enhanced && <EnhancedAnalyticsSection enhanced={data.enhanced} />}
      </div>
    );
  }
);

// ── Enhanced Analytics Sub-components ─────────────────────────────────

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function EnhancedAnalyticsSection({ enhanced }: { enhanced: EnhancedAnalytics }) {
  const hasScrollData = enhanced.scrollDepth.some((d) => d.visitors > 0);
  const hasVideoData = enhanced.video.totalPlays > 0;
  const hasConversionData = enhanced.conversions.impressions > 0;

  if (!hasScrollData && !hasVideoData && !hasConversionData) return null;

  return (
    <>
      {hasScrollData && <ScrollDepthHeatmap data={enhanced.scrollDepth} />}
      {hasVideoData && <VideoAnalyticsCard data={enhanced.video} />}
      {hasConversionData && <ConversionFunnelCard data={enhanced.conversions} />}
    </>
  );
}

function ScrollDepthHeatmap({ data }: { data: EnhancedAnalytics["scrollDepth"] }) {
  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ArrowDownRight size={16} className="text-repwell-teal-300" />
          <div>
            <CardTitle className="text-base">Scroll Depth</CardTitle>
            <CardDescription>
              Percentage of visitors reaching each depth threshold
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.threshold} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">
                  {item.threshold}%
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {item.visitors.toLocaleString()} visitors ({item.percentage}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor:
                      item.threshold <= 25
                        ? "#84a98c"
                        : item.threshold <= 50
                          ? "#52796f"
                          : item.threshold <= 75
                            ? "#354f52"
                            : "#2f3e46",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        {/* Accessible table for SR */}
        <table className="sr-only">
          <caption>Scroll depth breakdown</caption>
          <thead>
            <tr>
              <th>Threshold</th>
              <th>Visitors</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.threshold}>
                <td>{item.threshold}%</td>
                <td>{item.visitors}</td>
                <td>{item.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function VideoAnalyticsCard({ data }: { data: EnhancedAnalytics["video"] }) {
  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Play size={16} className="text-repwell-teal-300" />
          <div>
            <CardTitle className="text-base">Video Analytics</CardTitle>
            <CardDescription>
              Play rate, completion rate, and watch duration
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="rounded-lg border border-border p-4 text-center">
            <Play size={14} className="mx-auto mb-1.5 text-repwell-teal-300" />
            <div className="text-xl font-semibold tabular-nums text-foreground">
              {data.playRate}%
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Play Rate</div>
            <div className="text-[10px] text-muted-foreground">
              {data.totalPlays.toLocaleString()} / {data.totalImpressions.toLocaleString()}
            </div>
          </div>
          <div className="rounded-lg border border-border p-4 text-center">
            <CheckCircle2 size={14} className="mx-auto mb-1.5 text-repwell-teal-300" />
            <div className="text-xl font-semibold tabular-nums text-foreground">
              {data.completionRate}%
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Completion Rate
            </div>
            <div className="text-[10px] text-muted-foreground">
              {data.totalCompletes.toLocaleString()} / {data.totalPlays.toLocaleString()}
            </div>
          </div>
          <div className="rounded-lg border border-border p-4 text-center">
            <Clock size={14} className="mx-auto mb-1.5 text-repwell-teal-300" />
            <div className="text-xl font-semibold tabular-nums text-foreground">
              {formatDuration(data.averageWatchDuration)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Avg Watch Time
            </div>
          </div>
        </div>

        {/* Video milestones */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">
            Viewer Milestones
          </h4>
          <div className="space-y-2">
            {data.milestones.map((m) => {
              const pct =
                data.totalPlays > 0
                  ? Math.round((m.count / data.totalPlays) * 100)
                  : 0;
              return (
                <div key={m.milestone} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">
                      {m.milestone}% watched
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {m.count.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-repwell-teal-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ConversionFunnelCard({
  data,
}: {
  data: EnhancedAnalytics["conversions"];
}) {
  const steps = [
    {
      label: "Impressions",
      value: data.impressions,
      icon: Target,
    },
    {
      label: "Clicks",
      value: data.clicks,
      rate: data.impressionToClickRate,
      icon: MousePointerClick,
    },
    {
      label: "Conversions",
      value: data.conversions,
      rate: data.clickToConversionRate,
      icon: CheckCircle2,
    },
  ];

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target size={16} className="text-repwell-teal-300" />
          <div>
            <CardTitle className="text-base">Conversion Funnel</CardTitle>
            <CardDescription>
              Impressions to clicks to conversions with drop-off rates
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-stretch gap-2 sm:gap-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex items-center gap-2 sm:gap-4 flex-1">
                <div className="flex-1 rounded-lg border border-border p-3 sm:p-4 text-center">
                  <Icon
                    size={14}
                    className="mx-auto mb-1.5 text-repwell-teal-300"
                  />
                  <div className="text-lg font-semibold tabular-nums text-foreground">
                    {step.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {step.label}
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="text-sm font-semibold tabular-nums text-foreground">
              {data.impressionToClickRate}%
            </div>
            <div className="text-[10px] text-muted-foreground">
              Impression → Click
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="text-sm font-semibold tabular-nums text-foreground">
              {data.clickToConversionRate}%
            </div>
            <div className="text-[10px] text-muted-foreground">
              Click → Conversion
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="text-sm font-semibold tabular-nums text-foreground">
              {data.overallConversionRate}%
            </div>
            <div className="text-[10px] text-muted-foreground">
              Overall Conversion
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
