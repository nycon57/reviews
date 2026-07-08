"use client";

import { useState, useTransition, useCallback } from "react";
import Image from "next/image";
import { EnhancedLeaderboard, ProfileCompletionLeaderboard } from "@/components/gamification";
import {
  Crown,
  Medal,
  Trophy,
  Users,
  SpinnerGap as Loader2,
  WarningCircle,
  Star,
  ShieldStar,
  Lightning,
} from "@phosphor-icons/react";
import { getEnhancedLeaderboard } from "@/lib/gamification/actions";
import { getInitials } from "@/lib/utils";
import type { FilterOptions } from "@/lib/dashboard";
import type { EnhancedLeaderboardEntry } from "@/lib/gamification/types";
import type { ProfileCompletionLeaderboardEntry } from "@/lib/gamification/profile-completion-types";

interface LeaderboardDashboardProps {
  initialFilters: FilterOptions;
  initialTopPerformers: EnhancedLeaderboardEntry[];
  initialTopPerformersError: string | null;
  initialLeaderboard: EnhancedLeaderboardEntry[];
  initialLeaderboardError: string | null;
  initialProfileCompletion: ProfileCompletionLeaderboardEntry[];
}

function CompactProfileCompletionLeaderboard({
  initialData,
}: {
  initialData: ProfileCompletionLeaderboardEntry[];
}) {
  return <ProfileCompletionLeaderboard limit={10} showPodium={false} initialData={initialData} />;
}

export function LeaderboardDashboard({
  initialFilters,
  initialTopPerformers,
  initialTopPerformersError,
  initialLeaderboard,
  initialLeaderboardError,
  initialProfileCompletion,
}: LeaderboardDashboardProps) {
  const [isPending, startTransition] = useTransition();
  const [topPerformers, setTopPerformers] = useState<EnhancedLeaderboardEntry[]>(initialTopPerformers);
  const [error, setError] = useState<string | null>(initialTopPerformersError);

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

  const podiumConfig = [
    {
      index: 1,
      order: "order-1 sm:order-1",
      label: "2nd Place",
      avatarSize: "h-14 w-14",
      ringColor: "ring-repwell-sage-200/60",
      bgColor: "bg-repwell-sage-100/20 dark:bg-repwell-teal-300/10",
      textColor: "text-repwell-sage-200",
      icon: <Medal className="h-5 w-5 text-repwell-sage-200" />,
      iconPosition: "absolute -bottom-1 -right-1",
    },
    {
      index: 0,
      order: "order-first sm:order-2",
      label: "1st Place",
      avatarSize: "h-16 w-16",
      ringColor: "ring-yellow-400",
      bgColor: "bg-yellow-50/40",
      textColor: "text-yellow-600",
      icon: <Crown className="h-7 w-7 text-yellow-500" />,
      iconPosition: "absolute -top-3 left-1/2 -translate-x-1/2",
      isFirst: true,
    },
    {
      index: 2,
      order: "order-2 sm:order-3",
      label: "3rd Place",
      avatarSize: "h-14 w-14",
      ringColor: "ring-amber-400/60",
      bgColor: "bg-amber-50/30",
      textColor: "text-amber-600",
      icon: <Trophy className="h-5 w-5 text-amber-600" />,
      iconPosition: "absolute -bottom-1 -right-1",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top 3 performers podium */}
      <div className="grid gap-4 sm:grid-cols-3">
        {podiumConfig.map((config) => {
          const performer = topPerformers[config.index];
          return (
            <div
              key={config.index}
              className={`${config.order} rounded-xl border border-border/50 ${config.isFirst ? "border-yellow-200/50 bg-gradient-to-b from-yellow-50/30 to-transparent" : "bg-card"} shadow-soft p-5`}
            >
              {performer ? (
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-3">
                    <div className={`flex ${config.avatarSize} items-center justify-center rounded-full ${config.bgColor} ring-4 ${config.ringColor}`}>
                      {performer.photoUrl ? (
                        <Image
                          loader={({ src }) => src}
                          unoptimized
                          src={performer.photoUrl}
                          alt={performer.fullName}
                          width={config.isFirst ? 64 : 56}
                          height={config.isFirst ? 64 : 56}
                          className={`${config.avatarSize} rounded-full object-cover`}
                        />
                      ) : (
                        <span className={`${config.isFirst ? "text-xl" : "text-lg"} font-semibold ${config.textColor}`}>
                          {getInitials(performer.fullName)}
                        </span>
                      )}
                    </div>
                    <div className={config.iconPosition}>{config.icon}</div>
                  </div>
                  <p className="font-semibold text-heading truncate max-w-full">{performer.fullName}</p>
                  <p className={`text-xs font-medium ${config.textColor}`}>{config.label}</p>
                  <div className="mt-3 flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">{performer.totalReviews} reviews</span>
                    <span className={`font-bold ${config.isFirst ? "text-yellow-600" : "text-label"}`}>
                      {performer.reputationScore} pts
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center py-4">
                  {isPending ? (
                    <Loader2 className="h-8 w-8 animate-spin text-repwell-teal-300/40" />
                  ) : (
                    <>
                      <div className={`flex ${config.avatarSize} items-center justify-center rounded-full bg-repwell-sage-100/30 dark:bg-repwell-teal-300/10`}>
                        {config.icon}
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">{config.label}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 shrink-0">
              <WarningCircle className="h-5 w-5 text-destructive" />
            </div>
            <p className="flex-1 text-sm font-medium text-destructive">{error}</p>
            <button
              type="button"
              onClick={loadTopPerformers}
              className="text-sm font-medium text-destructive underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Competitors", value: topPerformers.length > 0 ? topPerformers.length : "\u2014", icon: Users, color: "text-repwell-teal-300" },
          { label: "Top Score", value: topPerformers[0]?.reputationScore ?? "\u2014", icon: Crown, color: "text-yellow-500" },
          { label: "Top 3 Badges", value: topPerformers.reduce((sum, p) => sum + p.badges.length, 0) ?? "\u2014", icon: ShieldStar, color: "text-repwell-sage-200" },
          { label: "Top 3 Reviews", value: topPerformers.reduce((sum, p) => sum + p.totalReviews, 0) ?? "\u2014", icon: Star, color: "text-repwell-teal-300" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-soft"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-teal-300/10">
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight text-heading">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full leaderboard */}
      <EnhancedLeaderboard
        filterOptions={initialFilters}
        initialPeriod="monthly"
        initialData={initialLeaderboard}
        initialError={initialLeaderboardError}
      />

      {/* Profile completion leaderboard */}
      <CompactProfileCompletionLeaderboard initialData={initialProfileCompletion} />

      {/* Info card */}
      <div className="rounded-xl border border-dashed border-border/50 bg-repwell-sage-100/10 dark:bg-repwell-teal-300/10 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-repwell-teal-300/10 shrink-0">
            <Lightning className="h-[1.125rem] w-[1.125rem] text-repwell-teal-300" />
          </div>
          <div>
            <h3 className="font-medium text-heading mb-2">How Rankings Work</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li><strong className="text-label">Reputation Score</strong> is calculated from reviews, ratings, and NPS feedback</li>
              <li><strong className="text-label">Rankings</strong> are updated in real-time as new data comes in</li>
              <li><strong className="text-label">Badges</strong> are awarded for achievements like consistent 5-star ratings</li>
              <li>Use filters to compare performance across branches and regions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
