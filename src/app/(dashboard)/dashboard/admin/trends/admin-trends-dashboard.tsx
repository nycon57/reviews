"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts";
import {
  SpinnerGap as Loader2,
  Star,
  Users,
  ChartBar as BarChart3,
  Chats as MessageSquare,
} from "@phosphor-icons/react";
import {
  getTeamMetrics,
  getTeamRatingTrend,
  getTeamNPSTrend,
  getReviewVolumeTrend,
  type TeamMetrics,
  type TrendDataPoint,
} from "@/lib/dashboard";
import { calculateTrendStats } from "@/components/analytics/trend-utils";
import { TrendIndicator } from "@/components/analytics/trend-indicator";
import type { TimeRange } from "@/components/analytics/trends-page-client";

interface AdminTrendsDashboardProps {
  timeRange: TimeRange;
}

export function AdminTrendsDashboard({ timeRange }: AdminTrendsDashboardProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<TeamMetrics | null>(null);
  const [ratingTrend, setRatingTrend] = useState<TrendDataPoint[]>([]);
  const [npsTrend, setNpsTrend] = useState<TrendDataPoint[]>([]);
  const [reviewVolumeTrend, setReviewVolumeTrend] = useState<TrendDataPoint[]>([]);

  const getMonths = (range: TimeRange): number => {
    switch (range) {
      case "3m": return 3;
      case "6m": return 6;
      case "12m": return 12;
      case "24m": return 24;
    }
  };

  const loadData = useCallback(async () => {
    const months = getMonths(timeRange);

    const [metricsResult, ratingResult, npsResult, volumeResult] = await Promise.all([
      getTeamMetrics(),
      getTeamRatingTrend(months),
      getTeamNPSTrend(months),
      getReviewVolumeTrend(undefined, months),
    ]);

    if (metricsResult.success && metricsResult.data) {
      setMetrics(metricsResult.data);
    }
    if (ratingResult.success && ratingResult.data) {
      setRatingTrend(ratingResult.data);
    }
    if (npsResult.success && npsResult.data) {
      setNpsTrend(npsResult.data);
    }
    if (volumeResult.success && volumeResult.data) {
      setReviewVolumeTrend(volumeResult.data);
    }
  }, [timeRange]);

  useEffect(() => {
    startTransition(async () => {
      setError(null);
      try {
        await loadData();
      } catch (e) {
        console.error("Failed to load admin trends data:", e);
        setError("Failed to load trends data. Please try again.");
      }
    });
  }, [loadData]);

  const ratingStats = calculateTrendStats(ratingTrend);
  const npsStats = calculateTrendStats(npsTrend);

  const hasRatingData = ratingTrend.some((d) => d.value !== 0);
  const hasNpsData = npsTrend.some((d) => d.value !== 0);
  const hasVolumeData = reviewVolumeTrend.some((d) => d.value !== 0);

  return (
    <div className="space-y-6">
      {/* Loading indicator */}
      {isPending && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading trends...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center justify-between p-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  try {
                    await loadData();
                  } catch (e) {
                    console.error("Failed to load admin trends data:", e);
                    setError("Failed to load trends data. Please try again.");
                  }
                });
              }}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-100">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Team Avg Rating</p>
                  <p className="text-xl font-bold">{ratingStats.current.toFixed(1)}</p>
                </div>
              </div>
              <TrendIndicator stats={ratingStats} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Team NPS</p>
                  <p className="text-xl font-bold">{npsStats.current}</p>
                </div>
              </div>
              <TrendIndicator stats={npsStats} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active LOs</p>
                  <p className="text-xl font-bold">{metrics?.activeMembers || 0}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                of {metrics?.totalMembers || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Reviews</p>
                  <p className="text-xl font-bold">
                    {reviewVolumeTrend.reduce((sum, d) => sum + d.value, 0)}
                  </p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">Period total</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team Rating Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Team Rating Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!hasRatingData ? (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Star className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No rating data available yet</p>
                  <p className="text-xs mt-1">Team reviews will appear here</p>
                </div>
              </div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ratingTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="admin-ratingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                    <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dx={-10} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(value: number) => [`${value.toFixed(1)} stars`, "Team Avg"]} />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#admin-ratingGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team NPS Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Team NPS Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!hasNpsData ? (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No NPS data available yet</p>
                  <p className="text-xs mt-1">NPS scores will appear after survey responses</p>
                </div>
              </div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={npsTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                    <YAxis domain={[-100, 100]} ticks={[-100, -50, 0, 50, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dx={-10} tickFormatter={(value) => (value > 0 ? `+${value}` : value.toString())} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(value: number) => [`${value > 0 ? "+" : ""}${value}`, "Team NPS"]} />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ fill: "hsl(var(--chart-2))", r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Review Volume */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              Review Volume by Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!hasVolumeData ? (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No review data available yet</p>
                  <p className="text-xs mt-1">Review volume will appear as reviews are collected</p>
                </div>
              </div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reviewVolumeTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dx={-10} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(value: number) => [value, "Reviews"]} />
                    <Bar dataKey="value" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Rate Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              Response Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[250px] items-center justify-center">
              <div className="text-center">
                <div className="relative mx-auto h-32 w-32">
                  <svg className="h-full w-full" viewBox="0 0 100 100">
                    <circle
                      className="stroke-muted"
                      strokeWidth="8"
                      fill="transparent"
                      r="42"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="stroke-primary"
                      strokeWidth="8"
                      strokeLinecap="round"
                      fill="transparent"
                      r="42"
                      cx="50"
                      cy="50"
                      strokeDasharray={`${(metrics?.averageResponseRate || 0) * 2.64} 264`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {metrics?.averageResponseRate || 0}%
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Average survey response rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
