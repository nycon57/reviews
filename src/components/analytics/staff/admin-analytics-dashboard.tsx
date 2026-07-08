"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  SpinnerGap as Loader2,
  Star,
  Users,
  ChartBar as BarChart3,
  Chats as MessageSquare,
  CalendarDots,
  Warning as AlertTriangle,
  Trophy,
} from "@phosphor-icons/react";
import {
  getTeamMetrics,
  getUserComparison,
  getLeaderboard,
  getLowPerformers,
  getReviewsBySource,
  type TeamMetrics,
  type UserComparison,
  type LeaderboardEntry,
  type ReviewsBySourceEntry,
  type ReviewsBySourceOptions,
} from "@/lib/dashboard";
import {
  CHART_COLORS,
  CHART_TOOLTIP_STYLE,
  TrendIndicator,
} from "@/components/analytics/chart-primitives";
import { getInitials } from "@/lib/utils";

type AdminDateRange = "7d" | "30d" | "90d" | "this_month" | "last_month" | "all";

function getDateRangeValues(range: AdminDateRange): ReviewsBySourceOptions {
  const now = new Date();
  let startDate: Date;
  let endDate = now;

  switch (range) {
    case "7d":
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30d":
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      break;
    case "90d":
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
      break;
    case "this_month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case "last_month":
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case "all":
    default:
      return {};
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

function getPerformanceColor(status: string): string {
  switch (status) {
    case "excellent":
      return "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400";
    case "good":
      return "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400";
    case "needs_attention":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400";
    case "at_risk":
      return "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400";
    default:
      return "bg-muted text-foreground";
  }
}

export function AdminAnalyticsDashboard() {
  const [isPending, startTransition] = useTransition();
  const [metrics, setMetrics] = useState<TeamMetrics | null>(null);
  const [topPerformers, setTopPerformers] = useState<LeaderboardEntry[]>([]);
  const [lowPerformers, setLowPerformers] = useState<UserComparison[]>([]);
  const [allUsers, setAllUsers] = useState<UserComparison[]>([]);
  const [reviewsBySource, setReviewsBySource] = useState<ReviewsBySourceEntry[]>([]);
  const [sourceDateRange, setSourceDateRange] = useState<AdminDateRange>("30d");

  const loadData = useCallback(() => {
    startTransition(async () => {
      const [metricsResult, topResult, lowResult, allResult, sourceResult] = await Promise.all([
        getTeamMetrics(),
        getLeaderboard(5, "reputation"),
        getLowPerformers(),
        getUserComparison(),
        getReviewsBySource(getDateRangeValues(sourceDateRange)),
      ]);

      if (metricsResult.success && metricsResult.data) {
        setMetrics(metricsResult.data);
      }
      if (topResult.success && topResult.data) {
        setTopPerformers(topResult.data);
      }
      if (lowResult.success && lowResult.data) {
        setLowPerformers(lowResult.data);
      }
      if (allResult.success && allResult.data) {
        setAllUsers(allResult.data);
      }
      if (sourceResult.success && sourceResult.data) {
        setReviewsBySource(sourceResult.data);
      }
    });
  }, [sourceDateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate review distribution by performance status
  const performanceDistribution = allUsers.reduce(
    (acc, user) => {
      acc[user.performanceStatus] = (acc[user.performanceStatus] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const pieData = [
    { name: "Excellent", value: performanceDistribution.excellent || 0 },
    { name: "Good", value: performanceDistribution.good || 0 },
    { name: "Needs Attention", value: performanceDistribution.needs_attention || 0 },
    { name: "At Risk", value: performanceDistribution.at_risk || 0 },
  ].filter((d) => d.value > 0);

  const reviewBySource = reviewsBySource.map((entry) => ({
    name: entry.label,
    reviews: entry.count,
  }));

  return (
    <div className="space-y-6">
      {/* Loading indicator */}
      {isPending && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading analytics...</span>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-repwell-teal-300/10">
                  <MessageSquare className="h-5 w-5 text-repwell-teal-300" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Reviews</p>
                  <p className="text-xl font-bold">{metrics?.totalReviews || 0}</p>
                </div>
              </div>
              <TrendIndicator value={metrics?.totalReviewsChange || 0} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-repwell-teal-300/10">
                  <Star className="h-5 w-5 text-repwell-teal-300" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Rating</p>
                  <p className="text-xl font-bold">
                    {metrics?.averageRating?.toFixed(1) || "0.0"}
                  </p>
                </div>
              </div>
              <TrendIndicator value={metrics?.averageRatingChange || 0} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-repwell-teal-300/10">
                  <BarChart3 className="h-5 w-5 text-repwell-teal-300" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Team NPS</p>
                  <p className="text-xl font-bold">{metrics?.teamNPS || 0}</p>
                </div>
              </div>
              <TrendIndicator value={metrics?.teamNPSChange || 0} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-repwell-teal-300/10">
                  <Users className="h-5 w-5 text-repwell-teal-300" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active Members</p>
                  <p className="text-xl font-bold">
                    {metrics?.activeMembers || 0}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{metrics?.totalMembers || 0}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Review Distribution by Source */}
        <div className="lg:col-span-2">
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                    <BarChart3 className="h-5 w-5 text-repwell-teal-300" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Review Distribution by Source</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDots className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={sourceDateRange}
                    onValueChange={(value) => setSourceDateRange(value as AdminDateRange)}
                  >
                    <SelectTrigger className="h-9 w-[150px]" aria-label="Select review source date range">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="this_month">This month</SelectItem>
                      <SelectItem value="last_month">Last month</SelectItem>
                      <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {reviewBySource.length === 0 ? (
                <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No source data for this range</p>
                  </div>
                </div>
              ) : (
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reviewBySource} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="name"
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
                        contentStyle={CHART_TOOLTIP_STYLE}
                        formatter={(value: number) => [value, "Reviews"]}
                      />
                      <Bar
                        dataKey="reviews"
                        fill="hsl(var(--chart-1))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <Trophy className="h-5 w-5 text-repwell-teal-300" />
              </div>
              <CardTitle className="text-lg font-semibold">Top Performers</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {topPerformers.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No data available yet</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {topPerformers.slice(0, 5).map((performer, index) => (
                  <div key={performer.id} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {index + 1}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={performer.photoUrl || undefined} alt={performer.fullName} />
                      <AvatarFallback className="text-xs">
                        {getInitials(performer.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{performer.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {performer.averageRating.toFixed(1)} stars / {performer.totalReviews} reviews
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary content grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team Performance Distribution */}
        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <Users className="h-5 w-5 text-repwell-teal-300" />
              </div>
              <CardTitle className="text-lg font-semibold">Team Performance Distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No performance data available yet</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="h-[180px] w-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                        formatter={(value: number) => [value, "Team Members"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {pieData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                      <span className="ml-auto text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Needs Attention */}
        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <AlertTriangle className="h-5 w-5 text-repwell-teal-300" />
              </div>
              <CardTitle className="text-lg font-semibold">Needs Attention</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {lowPerformers.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">All team members performing well!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {lowPerformers.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.photoUrl || undefined} alt={member.fullName} />
                      <AvatarFallback className="text-xs">
                        {getInitials(member.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.averageRating.toFixed(1)} stars / NPS: {member.npsScore}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={getPerformanceColor(member.performanceStatus)}
                    >
                      {member.performanceStatus === "needs_attention" ? "Attention" : "At Risk"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
