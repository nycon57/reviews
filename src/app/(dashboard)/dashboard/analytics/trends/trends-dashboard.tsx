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
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";
import {
  SpinnerGap as Loader2,
  Star,
  ChartBar as BarChart3,
  Chats as MessageSquare,
} from "@phosphor-icons/react";
import {
  getRatingTrend,
  getNPSTrend,
  getReviewVolumeTrend,
  getTeamRatingTrend,
  getTeamNPSTrend,
  getTeamReviewVolumeTrend,
  type TrendDataPoint,
} from "@/lib/dashboard";
import {
  CHART_TOOLTIP_STYLE,
  TrendIndicator,
} from "@/components/analytics/chart-primitives";
import { calculateTrendStats } from "@/components/analytics/trend-utils";
import type { AnalyticsScope } from "@/components/analytics/scope-selector";
import type { TimeRange } from "@/components/analytics/trends-page-client";

interface TrendsDashboardProps {
  scope: AnalyticsScope;
  timeRange: TimeRange;
}

export function TrendsDashboard({ scope, timeRange }: TrendsDashboardProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ratingTrend, setRatingTrend] = useState<TrendDataPoint[]>([]);
  const [npsTrend, setNpsTrend] = useState<TrendDataPoint[]>([]);
  const [reviewVolumeTrend, setReviewVolumeTrend] = useState<TrendDataPoint[]>([]);

  const isTeamScope = scope === "team";

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

    const [ratingResult, npsResult, volumeResult] = await Promise.all([
      isTeamScope ? getTeamRatingTrend(months) : getRatingTrend(undefined, months),
      isTeamScope ? getTeamNPSTrend(months) : getNPSTrend(undefined, months),
      isTeamScope ? getTeamReviewVolumeTrend(months) : getReviewVolumeTrend(undefined, months),
    ]);

    if (ratingResult.success && ratingResult.data) {
      setRatingTrend(ratingResult.data);
    }
    if (npsResult.success && npsResult.data) {
      setNpsTrend(npsResult.data);
    }
    if (volumeResult.success && volumeResult.data) {
      setReviewVolumeTrend(volumeResult.data);
    }
  }, [timeRange, isTeamScope]);

  useEffect(() => {
    startTransition(async () => {
      setError(null);
      try {
        await loadData();
      } catch (e) {
        console.error("Failed to load trends data:", e);
        setError("Failed to load trends data. Please try again.");
      }
    });
  }, [loadData]);

  const ratingStats = calculateTrendStats(ratingTrend);
  const npsStats = calculateTrendStats(npsTrend);

  const hasRatingData = ratingTrend.some(d => d.value !== 0);
  const hasNpsData = npsTrend.some(d => d.value !== 0);
  const hasVolumeData = reviewVolumeTrend.some(d => d.value !== 0);

  return (
    <div className="space-y-6">
      {/* Loading indicator */}
      {isPending && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-card/80 px-4 py-2.5 text-muted-foreground shadow-soft backdrop-blur-sm">
          <Loader2 className="h-4 w-4 animate-spin text-repwell-teal-300" />
          <span className="text-sm font-medium">Updating trends...</span>
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
                    console.error("Failed to load trends data:", e);
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-xl border-border/50 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                  <Star className="h-5 w-5 text-repwell-teal-300" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {isTeamScope ? "Team Avg Rating" : "Avg Rating"}
                  </p>
                  <p className="text-xl font-bold">
                    {ratingStats.current.toFixed(1)}
                  </p>
                </div>
              </div>
              <TrendIndicator stats={ratingStats} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/50 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-repwell-sage-200/10">
                  <BarChart3 className="h-5 w-5 text-repwell-sage-200" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {isTeamScope ? "Team NPS" : "NPS Score"}
                  </p>
                  <p className="text-xl font-bold">{npsStats.current}</p>
                </div>
              </div>
              <TrendIndicator stats={npsStats} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/50 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-repwell-teal-400/10">
                  <MessageSquare className="h-5 w-5 text-label" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reviews</p>
                  <p className="text-xl font-bold">
                    {reviewVolumeTrend.reduce((sum, d) => sum + d.value, 0)}
                  </p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rating Trend */}
        <Card className="rounded-xl border-border/50 shadow-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <Star className="h-5 w-5 text-repwell-teal-300" />
              </div>
              <CardTitle className="text-lg font-semibold">
                {isTeamScope ? "Team Avg Rating Over Time" : "Avg Rating Over Time"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {!hasRatingData ? (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Star className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No rating data available yet</p>
                  <p className="text-xs mt-1">Start collecting reviews to see trends</p>
                </div>
              </div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ratingTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="user-ratingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                    <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dx={-10} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => [`${value.toFixed(1)} stars`, isTeamScope ? "Team Avg" : "Avg Rating"]} />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#user-ratingGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* NPS Trend */}
        <Card className="rounded-xl border-border/50 shadow-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <BarChart3 className="h-5 w-5 text-repwell-teal-300" />
              </div>
              <CardTitle className="text-lg font-semibold">
                {isTeamScope ? "Team NPS Trend" : "NPS Score Trend"}
              </CardTitle>
            </div>
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
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => [`${value > 0 ? "+" : ""}${value}`, "NPS Score"]} />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ fill: "hsl(var(--chart-2))", r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Volume */}
      <Card className="rounded-xl border-border/50 shadow-soft">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
              <MessageSquare className="h-5 w-5 text-repwell-teal-300" />
            </div>
            <CardTitle className="text-lg font-semibold">Review Volume</CardTitle>
          </div>
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
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => [value, "Reviews"]} />
                  <Bar dataKey="value" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
