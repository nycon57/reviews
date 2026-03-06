"use client";

import { memo } from "react";
import {
  Clock,
  TrendUp,
  CheckCircle,
  Chats,
  ChartBar,
  Sparkle,
} from "@phosphor-icons/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ResponseAnalytics } from "@/lib/reviews/response-actions";
import {
  FAST_RESPONSE_TIME_HOURS,
  GOOD_RESPONSE_TIME_HOURS,
  WARNING_RESPONSE_TIME_HOURS,
} from "@/lib/analytics/constants";

/** Format response time in hours to a human-readable label */
export function getResponseTimeLabel(hours: number): string {
  if (hours < FAST_RESPONSE_TIME_HOURS) return "< 1 hour";
  if (hours < GOOD_RESPONSE_TIME_HOURS) return `${Math.round(hours)} hours`;
  const days = Math.round(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""}`;
}

/** Return a Tailwind color class based on response time */
export function getResponseTimeColor(hours: number): string {
  if (hours < GOOD_RESPONSE_TIME_HOURS) return "text-green-600 dark:text-green-400";
  if (hours < WARNING_RESPONSE_TIME_HOURS) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

export const ResponseAnalyticsSection = memo(function ResponseAnalyticsSection({
  analytics,
}: {
  analytics: ResponseAnalytics | null;
}) {
  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No response analytics data available
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Response Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-teal-300/10" aria-hidden="true">
            <Chats className="h-5 w-5 text-repwell-teal-300" />
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight text-heading">{analytics.totalResponses}</p>
            <p className="text-xs text-muted-foreground">Total Responses</p>
            <p className="text-xs text-muted-foreground">Responses sent to customers</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-teal-300/10" aria-hidden="true">
            <TrendUp className="h-5 w-5 text-repwell-teal-300" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-semibold tracking-tight text-heading">{analytics.responseRate}%</p>
            <p className="text-xs text-muted-foreground">Response Rate</p>
            <p className="text-xs text-muted-foreground">Of reviews have responses</p>
            <Progress value={analytics.responseRate} className="mt-2" aria-label="Response rate" aria-valuetext={`${analytics.responseRate}%`} />
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-teal-300/10" aria-hidden="true">
            <Clock className="h-5 w-5 text-repwell-teal-300" />
          </div>
          <div>
            <p className={`text-2xl font-semibold tracking-tight ${getResponseTimeColor(analytics.averageResponseTimeHours)}`}>
              {getResponseTimeLabel(analytics.averageResponseTimeHours)}
            </p>
            <p className="text-xs text-muted-foreground">Avg Response Time</p>
            <p className="text-xs text-muted-foreground">Time from review to response</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-teal-300/10" aria-hidden="true">
            <CheckCircle className="h-5 w-5 text-repwell-teal-300" />
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight text-heading">
              {analytics.pendingApprovals}
              {analytics.pendingApprovals > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">Needs attention</Badge>
              )}
            </p>
            <p className="text-xs text-muted-foreground">Pending Approvals</p>
            <p className="text-xs text-muted-foreground">Responses awaiting review</p>
          </div>
        </div>
      </div>

      {/* Platform and AI Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-border shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <ChartBar className="h-5 w-5 text-repwell-teal-300" />
              </div>
              <div>
                <CardTitle className="text-base">Responses by Platform</CardTitle>
                <CardDescription>Distribution of responses across review sources</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {Object.keys(analytics.platformBreakdown).length > 0 ? (
              <div className="space-y-3" role="img" aria-label="Response distribution by platform">
                {Object.entries(analytics.platformBreakdown).map(([platform, count]) => {
                  const total = Object.values(analytics.platformBreakdown).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  const colors: Record<string, string> = {
                    internal: "bg-blue-500", google: "bg-red-500", zillow: "bg-purple-500",
                    facebook: "bg-indigo-500", yelp: "bg-orange-500",
                  };
                  const displayName = platform === "internal" ? "Survey" : platform;
                  return (
                    <div key={platform} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize">{displayName}</span>
                        <span className="text-muted-foreground">{count} ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors[platform] || "bg-muted-foreground"}`}
                          style={{ width: `${percentage}%` }}
                          role="progressbar"
                          aria-valuenow={percentage}
                          aria-valuemax={100}
                          aria-label={`${displayName}: ${percentage}%`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No response data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <Sparkle className="h-5 w-5 text-repwell-teal-300" />
              </div>
              <div>
                <CardTitle className="text-base">Response Composition</CardTitle>
                <CardDescription>How responses are being created</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Sparkle className="h-4 w-4 text-purple-500" />
                    AI-Suggested Responses
                  </span>
                  <span className="font-medium">{analytics.aiSuggestionRate}%</span>
                </div>
                <Progress value={analytics.aiSuggestionRate} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Approval Rate
                  </span>
                  <span className="font-medium">{analytics.approvalRate}%</span>
                </div>
                <Progress value={analytics.approvalRate} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
