"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Loader2, Star, TrendingUp, TrendingDown, Minus, Users, BarChart3, MessageSquare } from "lucide-react";
import { getRatingTrend, getNPSTrend, type TrendDataPoint } from "@/lib/dashboard";
import { getTeamRatingTrend, getFilterOptions, type FilterOptions } from "@/lib/dashboard";

type TimeRange = "3m" | "6m" | "12m";

interface TrendStats {
  current: number;
  previous: number;
  change: number;
  trend: "up" | "down" | "stable";
}

function calculateTrendStats(data: TrendDataPoint[]): TrendStats {
  if (data.length < 2) {
    const current = data[0]?.value || 0;
    return { current, previous: 0, change: 0, trend: "stable" };
  }

  const nonZeroData = data.filter(d => d.value !== 0);
  if (nonZeroData.length < 2) {
    const current = nonZeroData[nonZeroData.length - 1]?.value || 0;
    return { current, previous: 0, change: 0, trend: "stable" };
  }

  const current = nonZeroData[nonZeroData.length - 1].value;
  const previous = nonZeroData[nonZeroData.length - 2].value;
  const change = previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : 0;
  const trend = change > 5 ? "up" : change < -5 ? "down" : "stable";

  return { current, previous, change: Math.round(change), trend };
}

function TrendIndicator({ stats }: { stats: TrendStats }) {
  if (stats.trend === "up") {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <TrendingUp className="h-4 w-4" />
        <span className="text-sm font-medium">+{stats.change}%</span>
      </div>
    );
  }
  if (stats.trend === "down") {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <TrendingDown className="h-4 w-4" />
        <span className="text-sm font-medium">{stats.change}%</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Minus className="h-4 w-4" />
      <span className="text-sm font-medium">Stable</span>
    </div>
  );
}

export function TrendsDashboard() {
  const [isPending, startTransition] = useTransition();
  const [timeRange, setTimeRange] = useState<TimeRange>("6m");
  const [ratingTrend, setRatingTrend] = useState<TrendDataPoint[]>([]);
  const [npsTrend, setNpsTrend] = useState<TrendDataPoint[]>([]);
  const [teamRatingTrend, setTeamRatingTrend] = useState<TrendDataPoint[]>([]);
  const [reviewVolumeTrend, setReviewVolumeTrend] = useState<TrendDataPoint[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ branches: [], regions: [] });

  const getMonths = (range: TimeRange): number => {
    switch (range) {
      case "3m": return 3;
      case "6m": return 6;
      case "12m": return 12;
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  function loadData() {
    startTransition(async () => {
      const months = getMonths(timeRange);

      const [ratingResult, npsResult, teamRatingResult, filtersResult] = await Promise.all([
        getRatingTrend(undefined, months),
        getNPSTrend(undefined, months),
        getTeamRatingTrend(months),
        getFilterOptions(),
      ]);

      if (ratingResult.success && ratingResult.data) {
        setRatingTrend(ratingResult.data);
      }
      if (npsResult.success && npsResult.data) {
        setNpsTrend(npsResult.data);
      }
      if (teamRatingResult.success && teamRatingResult.data) {
        setTeamRatingTrend(teamRatingResult.data);
      }
      if (filtersResult.success && filtersResult.data) {
        setFilterOptions(filtersResult.data);
      }

      // Generate mock review volume data based on rating trend
      const volumeData = ratingTrend.map((d, i) => ({
        date: d.date,
        value: Math.floor(Math.random() * 50) + 10 + i * 5,
      }));
      setReviewVolumeTrend(volumeData);
    });
  }

  const ratingStats = calculateTrendStats(ratingTrend);
  const npsStats = calculateTrendStats(npsTrend);
  const teamRatingStats = calculateTrendStats(teamRatingTrend);

  const hasRatingData = ratingTrend.some(d => d.value !== 0);
  const hasNpsData = npsTrend.some(d => d.value !== 0);
  const hasTeamData = teamRatingTrend.some(d => d.value !== 0);

  return (
    <div className="space-y-6">
      {/* Time range selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3m">Last 3 months</SelectItem>
            <SelectItem value="6m">Last 6 months</SelectItem>
            <SelectItem value="12m">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
                  <p className="text-xs text-muted-foreground">Avg Rating</p>
                  <p className="text-xl font-bold">
                    {ratingStats.current.toFixed(1)}
                  </p>
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
                  <p className="text-xs text-muted-foreground">NPS Score</p>
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
                  <p className="text-xs text-muted-foreground">Team Avg</p>
                  <p className="text-xl font-bold">
                    {teamRatingStats.current.toFixed(1)}
                  </p>
                </div>
              </div>
              <TrendIndicator stats={teamRatingStats} />
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Rating Trend
            </CardTitle>
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
                      <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      dy={10}
                    />
                    <YAxis
                      domain={[0, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)} stars`, "Avg Rating"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      fill="url(#ratingGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* NPS Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              NPS Score Trend
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
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      dy={10}
                    />
                    <YAxis
                      domain={[-100, 100]}
                      ticks={[-100, -50, 0, 50, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      dx={-10}
                      tickFormatter={(value) => (value > 0 ? `+${value}` : value.toString())}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`${value > 0 ? "+" : ""}${value}`, "NPS Score"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team Rating Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              Team Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!hasTeamData ? (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No team data available yet</p>
                  <p className="text-xs mt-1">Team metrics will appear as reviews are collected</p>
                </div>
              </div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={teamRatingTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="teamGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      dy={10}
                    />
                    <YAxis
                      domain={[0, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)} stars`, "Team Avg"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--chart-3))"
                      strokeWidth={2}
                      fill="url(#teamGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Volume */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              Review Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reviewVolumeTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [value, "Reviews"]}
                  />
                  <Bar
                    dataKey="value"
                    fill="hsl(var(--chart-4))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters info */}
      {(filterOptions.branches.length > 0 || filterOptions.regions.length > 0) && (
        <Card className="bg-muted/30">
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">
              Available filters: {filterOptions.branches.length} branches, {filterOptions.regions.length} regions.
              Use the Leaderboard page for filtered views.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
