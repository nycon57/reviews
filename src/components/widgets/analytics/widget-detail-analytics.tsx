"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ExternalLink, MapPin } from "lucide-react";
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
import type { WidgetDetailAnalytics as DetailData } from "@/lib/widgets/analytics-actions";

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
            <h2 className="text-lg font-semibold text-repwell-teal-500">
              {widgetName ?? widgetId}
            </h2>
            <p className="text-xs text-muted-foreground">
              Detailed performance analytics
            </p>
          </div>
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
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
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
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
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
                        className="text-xs text-repwell-teal-300 hover:text-repwell-teal-400 truncate flex items-center gap-1 max-w-[80%]"
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
                      <span className="text-xs text-repwell-teal-400 truncate max-w-[80%]">
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
                  Unique visitors by IP hash
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
                      {item.ipHash.slice(0, 8)}...
                    </span>
                    <span className="text-xs font-medium tabular-nums text-repwell-teal-500">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
);
