"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EnhancedLeaderboard, ProfileCompletionLeaderboard } from "@/components/gamification";
import {
  Crown,
  Medal,
  Trophy,
  Users,
  SpinnerGap as Loader2,
  WarningCircle,
} from "@phosphor-icons/react";
import { getEnhancedLeaderboard } from "@/lib/gamification/actions";
import { getInitials } from "@/lib/utils";
import type { FilterOptions } from "@/lib/dashboard";
import type { EnhancedLeaderboardEntry } from "@/lib/gamification/types";

interface LeaderboardDashboardProps {
  initialFilters: FilterOptions;
}

export function LeaderboardDashboard({ initialFilters }: LeaderboardDashboardProps) {
  const [isPending, startTransition] = useTransition();
  const [topPerformers, setTopPerformers] = useState<EnhancedLeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadTopPerformers = useCallback(() => {
    startTransition(async () => {
      const result = await getEnhancedLeaderboard({
        period: "monthly",
        limit: 3,
      });
      if (result.success && result.data) {
        setTopPerformers(result.data);
        setError(null);
      } else {
        setError(result.error || "Failed to load leaderboard data");
      }
    });
  }, []);

  useEffect(() => {
    loadTopPerformers();
  }, [loadTopPerformers]);

  return (
    <div className="space-y-6">
      {/* Top 3 performers podium */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Second place */}
        <Card className="order-1 sm:order-1">
          <CardContent className="p-4">
            {topPerformers[1] ? (
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 ring-4 ring-gray-300">
                    {topPerformers[1].photoUrl ? (
                      <img
                        src={topPerformers[1].photoUrl}
                        alt={topPerformers[1].fullName}
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-gray-600">
                        {getInitials(topPerformers[1].fullName)}
                      </span>
                    )}
                  </div>
                  <Medal className="absolute -bottom-1 -right-1 h-6 w-6 text-gray-400" />
                </div>
                <p className="font-semibold truncate max-w-full">{topPerformers[1].fullName}</p>
                <p className="text-xs text-muted-foreground">2nd Place</p>
                <div className="mt-2 flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{topPerformers[1].totalReviews} reviews</span>
                  <span className="font-bold">{topPerformers[1].reputationScore} pts</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center py-4">
                {isPending ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <Medal className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">2nd Place</p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* First place */}
        <Card className="order-first sm:order-2 border-yellow-200 bg-gradient-to-b from-yellow-50/50 to-transparent">
          <CardContent className="p-4">
            {topPerformers[0] ? (
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 ring-4 ring-yellow-400">
                    {topPerformers[0].photoUrl ? (
                      <img
                        src={topPerformers[0].photoUrl}
                        alt={topPerformers[0].fullName}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-semibold text-yellow-700">
                        {getInitials(topPerformers[0].fullName)}
                      </span>
                    )}
                  </div>
                  <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 h-7 w-7 text-yellow-500" />
                </div>
                <p className="font-semibold truncate max-w-full">{topPerformers[0].fullName}</p>
                <p className="text-xs text-yellow-600 font-medium">1st Place</p>
                <div className="mt-2 flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{topPerformers[0].totalReviews} reviews</span>
                  <span className="font-bold text-yellow-600">{topPerformers[0].reputationScore} pts</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center py-4">
                {isPending ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <Crown className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">1st Place</p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Third place */}
        <Card className="order-2 sm:order-3">
          <CardContent className="p-4">
            {topPerformers[2] ? (
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 ring-4 ring-amber-500">
                    {topPerformers[2].photoUrl ? (
                      <img
                        src={topPerformers[2].photoUrl}
                        alt={topPerformers[2].fullName}
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-amber-700">
                        {getInitials(topPerformers[2].fullName)}
                      </span>
                    )}
                  </div>
                  <Trophy className="absolute -bottom-1 -right-1 h-6 w-6 text-amber-600" />
                </div>
                <p className="font-semibold truncate max-w-full">{topPerformers[2].fullName}</p>
                <p className="text-xs text-muted-foreground">3rd Place</p>
                <div className="mt-2 flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{topPerformers[2].totalReviews} reviews</span>
                  <span className="font-bold">{topPerformers[2].reputationScore} pts</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center py-4">
                {isPending ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <Trophy className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">3rd Place</p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <WarningCircle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">{error}</p>
              </div>
              <button
                onClick={loadTopPerformers}
                className="text-sm font-medium text-destructive underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{topPerformers.length > 0 ? topPerformers.length : "-"}</p>
                <p className="text-xs text-muted-foreground">Podium</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                <Crown className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {topPerformers[0]?.reputationScore || "-"}
                </p>
                <p className="text-xs text-muted-foreground">Top Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Trophy className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {topPerformers.reduce((sum, p) => sum + p.badges.length, 0) || "-"}
                </p>
                <p className="text-xs text-muted-foreground">Top 3 Badges</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Medal className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {topPerformers.reduce((sum, p) => sum + p.totalReviews, 0) || "-"}
                </p>
                <p className="text-xs text-muted-foreground">Top 3 Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full leaderboard */}
      <EnhancedLeaderboard filterOptions={initialFilters} initialPeriod="monthly" />

      {/* Profile completion leaderboard */}
      <ProfileCompletionLeaderboard limit={10} showPodium={false} />

      {/* Info card */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-4 px-6">
          <h3 className="font-medium mb-2">How Rankings Work</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Reputation Score</strong> is calculated from reviews, ratings, and NPS feedback</li>
            <li>• <strong>Rankings</strong> are updated in real-time as new data comes in</li>
            <li>• <strong>Badges</strong> are awarded for achievements like consistent 5-star ratings</li>
            <li>• Use filters to compare performance across branches and regions</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
