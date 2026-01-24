"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Medal as Award,
  TrendUp as TrendingUp,
  TrendDown as TrendingDown,
  Minus,
  Crown,
  Target,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { BadgeIcon } from "./badge-icon";
import type { GamificationStats } from "@/lib/gamification/types";
import { getGamificationStats } from "@/lib/gamification/actions";

interface GamificationStatsCardProps {
  loanOfficerId?: string;
  className?: string;
}

export function GamificationStatsCard({
  loanOfficerId,
  className,
}: GamificationStatsCardProps) {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setIsLoading(true);
      const result = await getGamificationStats(loanOfficerId);
      if (result.success && result.data) {
        setStats(result.data);
      }
      setIsLoading(false);
    }
    loadStats();
  }, [loanOfficerId]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2 text-center">
                <div className="h-10 w-10 rounded-full bg-muted mx-auto animate-pulse" />
                <div className="h-4 w-16 bg-muted rounded mx-auto animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-repwell-sage-100 to-repwell-teal-300/10">
              <Trophy className="h-7 w-7 text-repwell-teal-300" />
            </div>
            <p className="text-sm font-medium text-repwell-teal-500">Start earning achievements</p>
            <p className="mt-1 max-w-[260px] text-xs text-repwell-teal-400">
              Complete surveys and collect reviews to unlock badges, climb the leaderboard, and boost your reputation score.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRankBadgeColor = (rank: number | null) => {
    if (!rank) return "bg-muted";
    if (rank === 1) return "bg-yellow-500";
    if (rank <= 3) return "bg-gray-400";
    if (rank <= 10) return "bg-amber-600";
    return "bg-muted";
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Reputation Score */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                {stats.reputationScore}
              </div>
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              Reputation
              {getTrendIcon(stats.reputationTrend)}
            </div>
          </div>

          {/* Rank */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div
                className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md",
                  getRankBadgeColor(stats.currentRank)
                )}
              >
                {stats.currentRank === 1 ? (
                  <Crown className="h-6 w-6" />
                ) : (
                  `#${stats.currentRank || "-"}`
                )}
              </div>
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              Team Rank
              {stats.rankChange !== 0 && (
                <Badge
                  variant={stats.rankChange > 0 ? "default" : "destructive"}
                  className="text-[10px] h-4 px-1"
                >
                  {stats.rankChange > 0 ? `+${stats.rankChange}` : stats.rankChange}
                </Badge>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <div className="text-sm font-semibold">
              {stats.earnedBadges} / {stats.totalBadges}
            </div>
            <div className="text-xs text-muted-foreground">Badges Earned</div>
          </div>

          {/* Next Badge Progress */}
          <div className="text-center">
            {stats.nextBadgeProgress ? (
              <>
                <div className="flex items-center justify-center mb-2">
                  <BadgeIcon
                    badge={stats.nextBadgeProgress.badge}
                    size="lg"
                    isEarned={false}
                    showTooltip={false}
                  />
                </div>
                <div className="text-xs text-muted-foreground mb-1">
                  {stats.nextBadgeProgress.percentComplete}% to{" "}
                  <span className="font-medium text-foreground">
                    {stats.nextBadgeProgress.badge.name}
                  </span>
                </div>
                <Progress
                  value={stats.nextBadgeProgress.percentComplete}
                  className="h-1.5 w-20 mx-auto"
                />
              </>
            ) : (
              <>
                <div className="flex items-center justify-center mb-2">
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Target className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">All badges earned!</div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact Stats Widget
interface GamificationWidgetProps {
  loanOfficerId?: string;
  className?: string;
}

export function GamificationWidget({
  loanOfficerId,
  className,
}: GamificationWidgetProps) {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const result = await getGamificationStats(loanOfficerId);
      if (result.success && result.data) {
        setStats(result.data);
      }
      setIsLoading(false);
    }
    loadStats();
  }, [loanOfficerId]);

  if (isLoading || !stats) {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        <div className="h-8 w-20 bg-muted rounded animate-pulse" />
        <div className="h-8 w-20 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-4 text-sm", className)}>
      <div className="flex items-center gap-1.5">
        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
          {stats.reputationScore}
        </div>
        <span className="text-muted-foreground">score</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Trophy className="h-4 w-4 text-yellow-500" />
        <span className="font-medium">#{stats.currentRank || "-"}</span>
        {stats.rankChange !== 0 && (
          <span
            className={cn(
              "text-xs",
              stats.rankChange > 0 ? "text-green-600" : "text-red-600"
            )}
          >
            ({stats.rankChange > 0 ? "+" : ""}
            {stats.rankChange})
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <Award className="h-4 w-4 text-purple-500" />
        <span>
          {stats.earnedBadges}/{stats.totalBadges}
        </span>
      </div>
    </div>
  );
}
