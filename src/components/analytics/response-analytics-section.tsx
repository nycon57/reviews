"use client";

import { memo } from "react";
import {
  ClockIcon as Clock,
  TrendUpIcon as TrendingUp,
  CheckCircleIcon as CheckCircle,
  ChatsIcon as MessageSquare,
  ChartBarIcon as BarChart3,
  SparkleIcon as Sparkles,
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
  if (hours < GOOD_RESPONSE_TIME_HOURS) return "text-green-600";
  if (hours < WARNING_RESPONSE_TIME_HOURS) return "text-yellow-600";
  return "text-red-600";
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalResponses}</div>
            <p className="text-xs text-muted-foreground">Responses sent to customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.responseRate}%</div>
            <Progress value={analytics.responseRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Of reviews have responses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getResponseTimeColor(analytics.averageResponseTimeHours)}`}>
              {getResponseTimeLabel(analytics.averageResponseTimeHours)}
            </div>
            <p className="text-xs text-muted-foreground">Time from review to response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.pendingApprovals}
              {analytics.pendingApprovals > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">Needs attention</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Responses awaiting review</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform and AI Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Responses by Platform
            </CardTitle>
            <CardDescription>Distribution of responses across review sources</CardDescription>
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
                          className={`h-full ${colors[platform] || "bg-gray-500"}`}
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Response Composition
            </CardTitle>
            <CardDescription>How responses are being created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
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
