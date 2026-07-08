"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  TrendUp as TrendingUp,
  TrendDown as TrendingDown,
  Minus,
  Users,
  ChartBar as BarChart3,
  Chats as MessageSquare,
  Warning as AlertTriangle,
  Trophy,
} from "@phosphor-icons/react";
import {
  getTeamMetrics,
  getUserComparison,
  getLeaderboard,
  getLowPerformers,
  type TeamMetrics,
  type UserComparison,
  type LeaderboardEntry,
} from "@/lib/dashboard";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function TrendIndicator({ value, suffix = "%" }: { value: number; suffix?: string }) {
  if (value > 0) {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <TrendingUp className="h-4 w-4" />
        <span className="text-sm font-medium">+{value}{suffix}</span>
      </div>
    );
  }
  if (value < 0) {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <TrendingDown className="h-4 w-4" />
        <span className="text-sm font-medium">{value}{suffix}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Minus className="h-4 w-4" />
      <span className="text-sm font-medium">0{suffix}</span>
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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

  const loadData = () => {
    startTransition(async () => {
      const [metricsResult, topResult, lowResult, allResult] = await Promise.all([
        getTeamMetrics(),
        getLeaderboard(5, "reputation"),
        getLowPerformers(),
        getUserComparison(),
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
    });
  };

  useEffect(() => {
    loadData();
  }, []);

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

  // Calculate review volume by source (mock data based on actual reviews)
  const reviewBySource = [
    { name: "Google", reviews: Math.floor((metrics?.totalReviews || 0) * 0.45) },
    { name: "Internal", reviews: Math.floor((metrics?.totalReviews || 0) * 0.30) },
    { name: "Zillow", reviews: Math.floor((metrics?.totalReviews || 0) * 0.15) },
    { name: "Facebook", reviews: Math.floor((metrics?.totalReviews || 0) * 0.10) },
  ];

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
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                  <BarChart3 className="h-5 w-5 text-repwell-teal-300" />
                </div>
                <CardTitle className="text-lg font-semibold">Review Distribution by Source</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
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
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
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
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
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
