"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trophy,
  Medal,
  Star,
  TrendUp as TrendingUp,
  TrendDown as TrendingDown,
  Minus,
  DownloadSimple as Download,
  Funnel as Filter,
  Crown,
  WarningCircle,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type {
  EnhancedLeaderboardEntry,
  LeaderboardPeriod,
} from "@/lib/gamification/types";
import { getEnhancedLeaderboard } from "@/lib/gamification/actions";
import { getInitials } from "@/lib/utils";
import type { FilterOptions } from "@/lib/dashboard";

interface EnhancedLeaderboardProps {
  filterOptions: FilterOptions;
  initialPeriod?: LeaderboardPeriod;
}

export function EnhancedLeaderboard({
  filterOptions,
  initialPeriod = "monthly",
}: EnhancedLeaderboardProps) {
  const [data, setData] = useState<EnhancedLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<LeaderboardPeriod>(initialPeriod);
  const [branch, setBranch] = useState<string>("all");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadLeaderboard() {
      setIsLoading(true);
      setError(null);
      const result = await getEnhancedLeaderboard({
        period,
        branch: branch !== "all" ? branch : undefined,
        limit: 20,
      });
      if (!cancelled) {
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to load leaderboard");
        }
        setIsLoading(false);
      }
    }
    loadLeaderboard();
    return () => {
      cancelled = true;
    };
  }, [period, branch, retryCount]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-repwell-sage-200" />;
      case 3:
        return <Trophy className="h-5 w-5 text-amber-600" />;
      default:
        return (
          <span className="flex h-5 w-5 items-center justify-center text-sm font-semibold text-muted-foreground">
            {rank}
          </span>
        );
    }
  };

  const getRankBackground = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-50/60 dark:from-yellow-950/20 to-transparent border-l-4 border-l-yellow-400";
      case 2:
        return "bg-gradient-to-r from-repwell-sage-100/20 dark:from-repwell-teal-300/5 to-transparent border-l-4 border-l-repwell-sage-200";
      case 3:
        return "bg-gradient-to-r from-amber-50/40 dark:from-amber-950/20 to-transparent border-l-4 border-l-amber-500";
      default:
        return "border-l-4 border-l-transparent";
    }
  };

  const getRankChangeIcon = (change: number) => {
    if (change > 0) {
      return (
        <div className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
          <TrendingUp className="h-3 w-3" />
          <span className="text-xs font-medium">+{change}</span>
        </div>
      );
    }
    if (change < 0) {
      return (
        <div className="flex items-center gap-0.5 text-red-600 dark:text-red-400">
          <TrendingDown className="h-3 w-3" />
          <span className="text-xs font-medium">{change}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-0.5 text-muted-foreground">
        <Minus className="h-3 w-3" />
      </div>
    );
  };

  const exportLeaderboard = () => {
    const csv = [
      ["Rank", "Name", "Reviews", "Rating", "NPS", "Reputation Score"].join(
        ","
      ),
      ...data.map((entry) =>
        [
          entry.rank,
          `"${entry.fullName}"`,
          entry.totalReviews,
          entry.averageRating.toFixed(1),
          entry.npsScore,
          entry.reputationScore,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leaderboard-${period}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const periodTabs: { value: LeaderboardPeriod; label: string }[] = [
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
    { value: "all_time", label: "All Time" },
  ];

  const renderLeaderboardContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3 p-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg p-3 animate-pulse"
            >
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
              <div className="h-8 w-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex h-[300px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-destructive/10 to-destructive/5">
              <WarningCircle className="h-7 w-7 text-destructive" />
            </div>
            <p className="text-sm font-medium text-destructive">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                setRetryCount((c) => c + 1);
              }}
              className="mt-2 text-xs font-medium text-repwell-teal-300 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="relative flex flex-col items-center justify-center py-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-repwell-sage-100/40 via-repwell-sage-200/20 to-repwell-teal-300/10 dark:from-repwell-teal-300/10 dark:via-repwell-teal-300/5 dark:to-transparent" />
          <div className="relative">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-repwell-sage-100 to-repwell-sage-200/50 dark:from-repwell-teal-300/15 dark:to-repwell-teal-300/5">
              <Trophy className="h-7 w-7 text-label" />
            </div>
            <p className="font-medium text-heading-accent">No leaderboard data available</p>
            <p className="mt-1 text-sm text-repwell-teal-300">
              Team members will appear here once they have reviews
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {data.map((entry) => (
          <Link
            key={entry.id}
            href={`/dashboard/team/${entry.id}`}
            className={`flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-repwell-sage-100/20 dark:hover:bg-repwell-teal-300/10 ${getRankBackground(entry.rank)}`}
          >
            {/* Rank */}
            <div className="flex w-10 flex-col items-center justify-center">
              {getRankIcon(entry.rank)}
              {entry.previousRank !== null && (
                <div className="mt-0.5">{getRankChangeIcon(entry.rankChange)}</div>
              )}
            </div>

            {/* Avatar */}
            <Avatar className="h-10 w-10 ring-2 ring-background">
              <AvatarImage
                src={entry.photoUrl || undefined}
                alt={entry.fullName}
              />
              <AvatarFallback className="text-xs font-medium bg-repwell-teal-300/10 text-label">
                {getInitials(entry.fullName)}
              </AvatarFallback>
            </Avatar>

            {/* Name and stats */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-heading-accent truncate">{entry.fullName}</div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{entry.totalReviews} reviews</span>
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {entry.averageRating.toFixed(1)}
                </span>
                {entry.badges.length > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Trophy className="h-3 w-3 text-repwell-sage-200" />
                    {entry.badges.length}
                  </span>
                )}
              </div>
            </div>

            {/* Score */}
            <div className="text-right">
              <div className="font-bold text-lg text-heading-accent">{entry.reputationScore}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                points
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  const hasFilters = filterOptions.branches.length > 0;

  return (
    <Card className="overflow-hidden border border-border/50 shadow-soft rounded-xl">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-sage-100/40 dark:bg-repwell-teal-300/15">
              <Trophy className="h-5 w-5 text-repwell-teal-300 dark:text-repwell-sage-200" />
            </div>
            <CardTitle className="text-lg text-heading-accent">Team Leaderboard</CardTitle>
          </div>

          <div className="flex items-center gap-2">
            {hasFilters && (
              <div className="flex items-center gap-2">
                {filterOptions.branches.length > 0 && (
                  <Select value={branch} onValueChange={setBranch}>
                    <SelectTrigger className="w-[130px] h-8 text-xs">
                      <Filter className="h-3 w-3 mr-1" />
                      <SelectValue placeholder="Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {filterOptions.branches.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={exportLeaderboard}
              disabled={data.length === 0}
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Period tabs */}
      <div className="px-6 border-b border-border/50">
        <div className="flex gap-0">
          {periodTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setPeriod(tab.value)}
              className={cn(
                "relative px-4 py-3 text-sm font-medium transition-colors duration-200",
                "border-b-2",
                period === tab.value
                  ? "text-repwell-teal-300 border-repwell-teal-300"
                  : "text-muted-foreground hover:text-repwell-teal-400 dark:hover:text-repwell-sage-100/80 border-transparent"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <CardContent className="p-0">
        <div className="px-2 py-3">{renderLeaderboardContent()}</div>
      </CardContent>

      {/* Period indicator */}
      <div className="px-6 py-3 border-t border-border/50 bg-repwell-sage-100/10 dark:bg-repwell-teal-300/5 text-xs text-muted-foreground text-center">
        Rank changes compared to previous {period === "all_time" ? "snapshot" : period.replace("_", " ")}. Rankings reflect overall reputation.
        {branch !== "all" && (
          <span>
            {" "}
            &middot; Filtered by{" "}
            <Badge variant="outline" className="mx-1 border-repwell-teal-300/30 text-label">{branch}</Badge>
          </span>
        )}
      </div>
    </Card>
  );
}
