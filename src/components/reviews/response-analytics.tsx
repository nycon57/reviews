"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Chats as MessageSquare,
  Clock,
  TrendUp as TrendingUp,
  Sparkle as Sparkles,
  CheckCircle,
  WarningCircle as AlertCircle,
  SpinnerGap as Loader2,
  ChartBar as BarChart3,
} from "@phosphor-icons/react";
import { getResponseAnalytics, type ResponseAnalytics } from "@/lib/reviews/response-actions";

interface ResponseAnalyticsDashboardProps {
  startDate?: string;
  endDate?: string;
}

// Helper functions extracted outside component to prevent recreation on every render
function getResponseTimeLabel(hours: number): string {
  if (hours < 1) return "< 1 hour";
  if (hours < 24) return `${Math.round(hours)} hours`;
  const days = Math.round(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""}`;
}

function getResponseTimeColor(hours: number): string {
  if (hours < 24) return "text-green-600";
  if (hours < 48) return "text-yellow-600";
  return "text-red-600";
}

export function ResponseAnalyticsDashboard({
  startDate,
  endDate,
}: ResponseAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<ResponseAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getResponseAnalytics(startDate, endDate);
    if (result.success && result.data) {
      setAnalytics(result.data);
    } else {
      setError(result.error || "Failed to load analytics");
    }

    setIsLoading(false);
  }, [startDate, endDate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAnalytics();
  }, [loadAnalytics]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Responses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalResponses}</div>
            <p className="text-xs text-muted-foreground">
              Responses sent to customers
            </p>
          </CardContent>
        </Card>

        {/* Response Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.responseRate}%</div>
            <Progress value={analytics.responseRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Of reviews have responses
            </p>
          </CardContent>
        </Card>

        {/* Average Response Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getResponseTimeColor(analytics.averageResponseTimeHours)}`}>
              {getResponseTimeLabel(analytics.averageResponseTimeHours)}
            </div>
            <p className="text-xs text-muted-foreground">
              Time from review to response
            </p>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.pendingApprovals}
              {analytics.pendingApprovals > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Needs attention
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Responses awaiting review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Platform Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Responses by Platform
            </CardTitle>
            <CardDescription>
              Distribution of responses across review sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(analytics.platformBreakdown).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(analytics.platformBreakdown).map(([platform, count]) => {
                  const total = Object.values(analytics.platformBreakdown).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

                  const colors: Record<string, string> = {
                    internal: "bg-blue-500",
                    google: "bg-red-500",
                    zillow: "bg-purple-500",
                    facebook: "bg-indigo-500",
                    yelp: "bg-orange-500",
                  };

                  return (
                    <div key={platform} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize">
                          {platform === "internal" ? "Survey" : platform}
                        </span>
                        <span className="text-muted-foreground">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors[platform] || "bg-gray-500"}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No response data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* AI & Template Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Response Composition
            </CardTitle>
            <CardDescription>
              How responses are being created
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* AI Suggestion Rate */}
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

              {/* Approval Rate */}
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

              {/* Template Usage */}
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-2">Top Templates</p>
                {Object.keys(analytics.templateUsage).length > 0 ? (
                  <div className="space-y-1">
                    {Object.entries(analytics.templateUsage)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 3)
                      .map(([templateId, count]) => (
                        <div
                          key={templateId}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground truncate">
                            Template #{templateId.slice(0, 8)}
                          </span>
                          <Badge variant="secondary">{count} uses</Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No template usage data yet
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
