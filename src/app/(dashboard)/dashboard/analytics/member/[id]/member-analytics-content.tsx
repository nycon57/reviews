"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Star,
  ChartLine as TrendUp,
  ChartLineDown as TrendDown,
  Minus,
  Envelope as Mail,
  CalendarDots as Calendar,
  Medal as Award,
  ChartBar as BarChart,
  ArrowSquareOut as ExternalLink,
  Users,
} from "@phosphor-icons/react";
import {
  getMemberAnalytics,
  type MemberAnalytics,
} from "@/lib/analytics/member-analytics-actions";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MemberAnalyticsContentProps {
  memberId: string;
}

const ROLE_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  admin: { label: "Admin", variant: "default" },
  manager: { label: "Manager", variant: "secondary" },
  user: { label: "User", variant: "outline" },
};

export function MemberAnalyticsContent({ memberId }: MemberAnalyticsContentProps) {
  const [analytics, setAnalytics] = useState<MemberAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadAnalytics() {
      const result = await getMemberAnalytics(memberId);
      if (result.success && result.data) {
        setAnalytics(result.data);
      } else {
        setError(result.error || "Failed to load analytics");
      }
      setLoading(false);
    }

    loadAnalytics();
  }, [memberId]);

  if (loading) {
    return <AnalyticsLoadingSkeleton />;
  }

  if (error || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <p className="text-muted-foreground">{error || "No data available"}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  const { member, metrics, trends, comparison } = analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Go back to analytics"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.avatarUrl || undefined} />
              <AvatarFallback>
                {member.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{member.fullName}</h1>
                <Badge variant={ROLE_LABELS[member.role]?.variant || "outline"}>
                  {ROLE_LABELS[member.role]?.label || member.role}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {member.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        {member.slug && (
          <Link href={`/pro/${member.slug}`}>
            <Button variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Public Profile
            </Button>
          </Link>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Average Rating"
          value={metrics.averageRating.toFixed(1)}
          icon={<Star className="h-5 w-5 text-repwell-teal-300" />}
          subtitle={
            <ComparisonBadge
              value={comparison.ratingDiff}
              label="vs team avg"
                          />
          }
        />
        <MetricCard
          title="Total Reviews"
          value={metrics.totalReviews.toString()}
          icon={<BarChart className="h-5 w-5 text-repwell-teal-300" />}
          subtitle={
            <ComparisonBadge
              value={comparison.reviewsDiff}
              label="vs team avg"
            />
          }
        />
        <MetricCard
          title="NPS Score"
          value={metrics.npsScore !== null ? metrics.npsScore.toString() : "N/A"}
          icon={<TrendUp className="h-5 w-5 text-repwell-teal-300" />}
          subtitle={
            comparison.npsDiff !== null ? (
              <ComparisonBadge
                value={comparison.npsDiff}
                label="vs team avg"
              />
            ) : (
              <span className="text-xs text-muted-foreground">No comparison data</span>
            )
          }
        />
        <MetricCard
          title="Response Rate"
          value={`${metrics.responseRate}%`}
          icon={<Mail className="h-5 w-5 text-repwell-teal-300" />}
          subtitle={
            <span className="text-xs text-muted-foreground">
              {metrics.surveysCompleted} of {metrics.surveysSent} surveys
            </span>
          }
        />
      </div>

      {/* Recognition and Surveys */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-border shadow-soft">
          <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <Award className="h-5 w-5 text-repwell-teal-300" />
              </div>
              <div>
                <CardTitle>Recognition</CardTitle>
                <CardDescription>Recognition activity for this team member</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-3xl font-bold text-amber-600">{metrics.recognitionReceived}</p>
                <p className="text-sm text-muted-foreground">Received</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{metrics.recognitionGiven}</p>
                <p className="text-sm text-muted-foreground">Given</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-soft">
          <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <Mail className="h-5 w-5 text-repwell-teal-300" />
              </div>
              <div>
                <CardTitle>Survey Activity</CardTitle>
                <CardDescription>Survey distribution and completion stats</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Surveys Sent</span>
                <span className="font-medium">{metrics.surveysSent}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Surveys Completed</span>
                <span className="font-medium">{metrics.surveysCompleted}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Response Rate</span>
                  <span className="font-medium">{metrics.responseRate}%</span>
                </div>
                <Progress value={metrics.responseRate} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Trends */}
      {trends.reviewsTrend.length > 0 && (
        <Card className="border border-border shadow-soft">
          <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <BarChart className="h-5 w-5 text-repwell-teal-300" />
              </div>
              <div>
                <CardTitle>Reviews Over Time (Last 30 Days)</CardTitle>
                <CardDescription>Daily review count trend</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends.reviewsTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number) => [value, "Reviews"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Comparison */}
      <Card className="border border-border shadow-soft">
        <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
              <Users className="h-5 w-5 text-repwell-teal-300" />
            </div>
            <div>
              <CardTitle>Team Comparison</CardTitle>
              <CardDescription>How this member compares to the team average</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <ComparisonItem
              label="Average Rating"
              memberValue={metrics.averageRating.toFixed(1)}
              teamValue={comparison.teamAverageRating.toFixed(1)}
              diff={comparison.ratingDiff}
            />
            <ComparisonItem
              label="Total Reviews"
              memberValue={metrics.totalReviews.toString()}
              teamValue={comparison.teamAverageReviews.toString()}
              diff={comparison.reviewsDiff}
            />
            {metrics.npsScore !== null && comparison.teamAverageNps !== null && (
              <ComparisonItem
                label="NPS Score"
                memberValue={metrics.npsScore.toString()}
                teamValue={comparison.teamAverageNps.toString()}
                diff={comparison.npsDiff || 0}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper components
function MetricCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-teal-300/10">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight text-repwell-teal-500">{value}</p>
        <p className="text-xs text-muted-foreground">{title}</p>
        {subtitle}
      </div>
    </div>
  );
}

function ComparisonBadge({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const Icon = value > 0 ? TrendUp : value < 0 ? TrendDown : Minus;
  const color = value > 0 ? "text-green-600" : value < 0 ? "text-red-600" : "text-muted-foreground";

  return (
    <span className={`flex items-center gap-1 text-xs ${color}`}>
      <Icon className="h-3 w-3" />
      {value > 0 ? "+" : ""}{value} {label}
    </span>
  );
}

function ComparisonItem({
  label,
  memberValue,
  teamValue,
  diff,
}: {
  label: string;
  memberValue: string;
  teamValue: string;
  diff: number;
}) {
  const isPositive = diff > 0;
  const isNeutral = diff === 0;

  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-end gap-2">
        <p className="text-2xl font-bold">{memberValue}</p>
        <p className="text-sm text-muted-foreground mb-1">vs {teamValue} team avg</p>
      </div>
      <div className={`mt-1 flex items-center gap-1 text-sm ${isNeutral ? "text-muted-foreground" : isPositive ? "text-green-600" : "text-red-600"}`}>
        {isNeutral ? <Minus className="h-4 w-4" /> : isPositive ? <TrendUp className="h-4 w-4" /> : <TrendDown className="h-4 w-4" />}
        <span>
          {diff > 0 ? "+" : ""}{diff} {isNeutral ? "at" : isPositive ? "above" : "below"} average
        </span>
      </div>
    </div>
  );
}

function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
