"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Star, Award, TrendingUp, Trophy, Target } from "lucide-react";
import type { RecognitionAnalytics } from "@/types/recognition.types";
import { BADGE_ICONS } from "./constants";

interface RecognitionAnalyticsCardProps {
  analytics: RecognitionAnalytics;
  periodLabel?: string;
}

export function RecognitionAnalyticsCard({
  analytics,
  periodLabel = "This Month",
}: RecognitionAnalyticsCardProps) {
  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recognitions</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalRecognitions}</div>
            <p className="text-xs text-muted-foreground">{periodLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Awarded</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalPoints}</div>
            <p className="text-xs text-muted-foreground">{periodLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participation</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.participationRate}%</div>
            <Progress value={analytics.participationRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Givers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.uniqueGivers}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.uniqueRecipients} recipients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers & Badges */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top Givers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Top Givers
            </CardTitle>
            <CardDescription>Most recognitions sent</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topGivers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.topGivers.map((user, index) => (
                  <div key={user.userId} className="flex items-center gap-3">
                    <span className="w-5 text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                    </div>
                    <Badge variant="secondary">{user.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Recipients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4" />
              Top Recipients
            </CardTitle>
            <CardDescription>Most recognized team members</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topRecipients.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.topRecipients.map((user, index) => (
                  <div key={user.userId} className="flex items-center gap-3">
                    <span className="w-5 text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                    </div>
                    <Badge variant="secondary">{user.points} pts</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4" />
              Popular Badges
            </CardTitle>
            <CardDescription>Most awarded badges</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topBadges.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.topBadges.slice(0, 5).map((badge, index) => {
                  const Icon = BADGE_ICONS[badge.icon] || Award;
                  return (
                    <div key={badge.badgeId} className="flex items-center gap-3">
                      <span className="w-5 text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${badge.color}20` }}
                      >
                        <Icon className="h-4 w-4" style={{ color: badge.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{badge.name}</p>
                      </div>
                      <Badge variant="secondary">{badge.count}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
