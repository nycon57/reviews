"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartLineUp,
  Star,
  ChatText,
  Clock,
  Smiley,
  EnvelopeSimple,
  ArrowsLeftRight,
  TrendUp,
  TrendDown,
  Minus,
  Sparkle,
} from "@phosphor-icons/react";
import type { LOPerformanceScorecard } from "@/lib/ai";
import { cn } from "@/lib/utils";

interface PerformanceScorecardProps {
  data: LOPerformanceScorecard;
}

function TrendIndicator({
  direction,
  value,
}: {
  direction: "up" | "down" | "stable";
  value?: string;
}) {
  if (direction === "up") {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-green-600">
        <TrendUp className="h-3 w-3" weight="bold" />
        {value}
      </span>
    );
  }
  if (direction === "down") {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-red-600">
        <TrendDown className="h-3 w-3" weight="bold" />
        {value}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
      <Minus className="h-3 w-3" />
      {value || "Stable"}
    </span>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
  trendValue,
}: {
  icon: typeof Star;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
}) {
  return (
    <div className="space-y-1 rounded-lg border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-semibold tabular-nums">{value}</span>
        {trend && <TrendIndicator direction={trend} value={trendValue} />}
      </div>
      {subtext && (
        <p className="text-xs text-muted-foreground">{subtext}</p>
      )}
    </div>
  );
}

export function PerformanceScorecard({ data }: PerformanceScorecardProps) {
  const fallbackBadge = { label: "Unknown", class: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" };
  const sentimentBadge: Record<string, { label: string; class: string }> = {
    improving: { label: "Improving", class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
    stable: { label: "Stable", class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
    declining: { label: "Declining", class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  };

  const sentiment = sentimentBadge[data.sentimentTrajectory] ?? fallbackBadge;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChartLineUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">
              Performance Scorecard
            </CardTitle>
          </div>
          <Badge variant="secondary" className={cn("text-xs", sentiment.class)}>
            Sentiment: {sentiment.label}
          </Badge>
        </div>
        <CardDescription>
          {data.loanOfficerName}&apos;s key performance metrics (90-day window)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key metrics grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            icon={ChartLineUp}
            label="Review Velocity"
            value={`${data.reviewVelocity.current}/mo`}
            trend={data.reviewVelocity.direction}
            trendValue={
              data.reviewVelocity.previous > 0
                ? `${data.reviewVelocity.current > data.reviewVelocity.previous ? "+" : ""}${data.reviewVelocity.current - data.reviewVelocity.previous} vs last`
                : undefined
            }
          />
          <MetricCard
            icon={Star}
            label="Avg Rating"
            value={data.avgRating.current || "N/A"}
            subtext={
              data.avgRating.days60 > 0
                ? `60-day: ${data.avgRating.days60}`
                : undefined
            }
            trend={
              data.avgRating.days30 > data.avgRating.days60
                ? "up"
                : data.avgRating.days30 < data.avgRating.days60
                  ? "down"
                  : "stable"
            }
          />
          <MetricCard
            icon={ChatText}
            label="Response Rate"
            value={`${data.responseRate.rate}%`}
            subtext={`Org avg: ${data.responseRate.orgAverage}%`}
            trend={
              data.responseRate.rate > data.responseRate.orgAverage
                ? "up"
                : data.responseRate.rate < data.responseRate.orgAverage
                  ? "down"
                  : "stable"
            }
          />
          <MetricCard
            icon={Clock}
            label="Avg Response Time"
            value={data.avgResponseTimeHours > 0 ? `${data.avgResponseTimeHours}h` : "N/A"}
          />
          <MetricCard
            icon={EnvelopeSimple}
            label="Survey Completion"
            value={`${data.surveyCompletionRate}%`}
          />
          <MetricCard
            icon={ArrowsLeftRight}
            label="Request-to-Review"
            value={`${data.requestToReviewConversion}%`}
          />
        </div>

        {/* Themes */}
        {(data.topPositiveThemes.length > 0 || data.riskThemes.length > 0) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.topPositiveThemes.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
                  <Smiley className="h-3.5 w-3.5" />
                  Top Strengths
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {data.topPositiveThemes.map((theme) => (
                    <Badge
                      key={theme}
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    >
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {data.riskThemes.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400">
                  <TrendDown className="h-3.5 w-3.5" />
                  Areas to Watch
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {data.riskThemes.map((theme) => (
                    <Badge
                      key={theme}
                      variant="secondary"
                      className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    >
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* NPS */}
        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">NPS Score:</span>
            <span className="font-semibold">{data.npsTrend.current}</span>
            <TrendIndicator
              direction={data.npsTrend.direction}
              value={
                data.npsTrend.previous !== 0
                  ? `vs ${data.npsTrend.previous} last period`
                  : undefined
              }
            />
          </div>
        </div>

        {/* Coaching brief */}
        {data.coachingBrief && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-primary">
              <Sparkle className="h-3.5 w-3.5" />
              AI Coaching Brief
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              {data.coachingBrief}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
