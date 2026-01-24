"use client";

import { useState, useEffect, useCallback, useRef, startTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  RecognitionAnalytics,
  AnalyticsPeriod,
  ANALYTICS_PERIODS,
} from "@/types/recognition.types";
import { getRecognitionAnalytics } from "@/lib/recognition/actions";
import {
  Users,
  Medal as Award,
  TrendUp as TrendingUp,
  Gift,
  Target,
  SpinnerGap as Loader2,
} from "@phosphor-icons/react";
import { BADGE_ICONS } from "./constants";

interface RecognitionAnalyticsDashboardProps {
  initialAnalytics?: RecognitionAnalytics;
}

export function RecognitionAnalyticsDashboard({
  initialAnalytics,
}: RecognitionAnalyticsDashboardProps) {
  const [period, setPeriod] = useState<AnalyticsPeriod>("month");
  const [analytics, setAnalytics] = useState<RecognitionAnalytics | null>(
    initialAnalytics || null
  );
  const [isLoading, setIsLoading] = useState(!initialAnalytics);
  const lastPeriodRef = useRef<AnalyticsPeriod | null>(initialAnalytics ? "month" : null);

  const loadAnalytics = useCallback(async (selectedPeriod: AnalyticsPeriod) => {
    setIsLoading(true);
    const result = await getRecognitionAnalytics(selectedPeriod);
    if (result.success && result.data) {
      const data = result.data;
      startTransition(() => {
        setAnalytics(data);
      });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Only load if period changed from what we last loaded
    if (lastPeriodRef.current !== period) {
      lastPeriodRef.current = period;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Fetch analytics when period changes
      loadAnalytics(period);
    }
  }, [period, loadAnalytics]);

  if (isLoading && !analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Unable to load analytics data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as AnalyticsPeriod)}>
        <TabsList>
          {ANALYTICS_PERIODS.map((p) => (
            <TabsTrigger key={p.value} value={p.value}>
              {p.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Recognitions
                </CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.totalRecognitions}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.totalPoints} total points awarded
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Givers
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.uniqueGivers}
                </div>
                <p className="text-xs text-muted-foreground">
                  employees giving recognition
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Recipients
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.uniqueRecipients}
                </div>
                <p className="text-xs text-muted-foreground">
                  employees recognized
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Participation Rate
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.participationRate}%
                </div>
                <Progress
                  value={analytics.participationRate}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>

          {/* Leaderboards */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Givers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Recognition Givers</CardTitle>
                <CardDescription>
                  Employees who give the most recognition
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.topGivers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No data available for this period
                  </p>
                ) : (
                  <div className="space-y-4">
                    {analytics.topGivers.map((giver, index) => (
                      <div
                        key={giver.userId}
                        className="flex items-center gap-4"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                          {index + 1}
                        </div>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={giver.avatarUrl} />
                          <AvatarFallback>
                            {giver.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {giver.name}
                          </p>
                        </div>
                        <Badge variant="secondary">{giver.count} given</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Recipients */}
            <Card>
              <CardHeader>
                <CardTitle>Most Recognized Employees</CardTitle>
                <CardDescription>
                  Employees who received the most recognition
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.topRecipients.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No data available for this period
                  </p>
                ) : (
                  <div className="space-y-4">
                    {analytics.topRecipients.map((recipient, index) => (
                      <div
                        key={recipient.userId}
                        className="flex items-center gap-4"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                          {index + 1}
                        </div>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={recipient.avatarUrl} />
                          <AvatarFallback>
                            {recipient.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {recipient.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {recipient.points} points
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {recipient.count} received
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Most Used Badges</CardTitle>
              <CardDescription>
                Popular badges used for recognition
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topBadges.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No badge data available for this period
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {analytics.topBadges.map((badge) => {
                    const Icon = BADGE_ICONS[badge.icon] || Award;
                    return (
                      <div
                        key={badge.badgeId}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full"
                          style={{
                            backgroundColor: badge.color
                              ? `${badge.color}20`
                              : undefined,
                            color: badge.color || undefined,
                          }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {badge.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {badge.count} times used
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
