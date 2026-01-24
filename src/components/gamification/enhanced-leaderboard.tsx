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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Medal,
  Medal as Award,
  Star,
  TrendUp as TrendingUp,
  TrendDown as TrendingDown,
  Minus,
  DownloadSimple as Download,
  Funnel as Filter,
  Crown,
} from "@phosphor-icons/react";
import type {
  EnhancedLeaderboardEntry,
  LeaderboardPeriod,
} from "@/lib/gamification/types";
import { getEnhancedLeaderboard } from "@/lib/gamification/actions";
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
  const [period, setPeriod] = useState<LeaderboardPeriod>(initialPeriod);
  const [branch, setBranch] = useState<string>("all");
  const [region, setRegion] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    async function loadLeaderboard() {
      setIsLoading(true);
      const result = await getEnhancedLeaderboard({
        period,
        branch: branch !== "all" ? branch : undefined,
        region: region !== "all" ? region : undefined,
        limit: 20,
      });
      if (!cancelled) {
        if (result.success && result.data) {
          setData(result.data);
        }
        setIsLoading(false);
      }
    }
    loadLeaderboard();
    return () => {
      cancelled = true;
    };
  }, [period, branch, region]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
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
        return "bg-gradient-to-r from-yellow-50 to-yellow-100/50 border-l-4 border-l-yellow-400";
      case 2:
        return "bg-gradient-to-r from-gray-50 to-gray-100/50 border-l-4 border-l-gray-400";
      case 3:
        return "bg-gradient-to-r from-amber-50 to-amber-100/50 border-l-4 border-l-amber-600";
      default:
        return "border-l-4 border-l-transparent";
    }
  };

  const getRankChangeIcon = (change: number) => {
    if (change > 0) {
      return (
        <div className="flex items-center gap-0.5 text-green-600">
          <TrendingUp className="h-3 w-3" />
          <span className="text-xs font-medium">+{change}</span>
        </div>
      );
    }
    if (change < 0) {
      return (
        <div className="flex items-center gap-0.5 text-red-600">
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

  const getPeriodLabel = (p: LeaderboardPeriod) => {
    switch (p) {
      case "monthly":
        return "This Month";
      case "quarterly":
        return "This Quarter";
      case "yearly":
        return "This Year";
      case "all_time":
        return "All Time";
    }
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
    a.click();
    URL.revokeObjectURL(url);
  };

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

    if (data.length === 0) {
      return (
        <div className="flex h-[300px] items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No leaderboard data available</p>
            <p className="text-xs mt-1">
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
            className={`flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-accent/50 ${getRankBackground(entry.rank)}`}
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
              <AvatarFallback className="text-xs font-medium">
                {getInitials(entry.fullName)}
              </AvatarFallback>
            </Avatar>

            {/* Name and stats */}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{entry.fullName}</div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{entry.totalReviews} reviews</span>
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {entry.averageRating.toFixed(1)}
                </span>
                {entry.badges.length > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Award className="h-3 w-3 text-purple-500" />
                    {entry.badges.length}
                  </span>
                )}
              </div>
            </div>

            {/* Score */}
            <div className="text-right">
              <div className="font-bold text-lg">{entry.reputationScore}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                points
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  const hasFilters = filterOptions.branches.length > 0 || filterOptions.regions.length > 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Team Leaderboard
          </CardTitle>

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

                {filterOptions.regions.length > 0 && (
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger className="w-[130px] h-8 text-xs">
                      <SelectValue placeholder="Region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      {filterOptions.regions.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
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

      <Tabs
        value={period}
        onValueChange={(v) => setPeriod(v as LeaderboardPeriod)}
        className="w-full"
      >
        <div className="px-6 border-b">
          <TabsList className="h-10 w-full justify-start rounded-none border-none bg-transparent p-0">
            <TabsTrigger
              value="monthly"
              className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Monthly
            </TabsTrigger>
            <TabsTrigger
              value="quarterly"
              className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Quarterly
            </TabsTrigger>
            <TabsTrigger
              value="yearly"
              className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Yearly
            </TabsTrigger>
            <TabsTrigger
              value="all_time"
              className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              All Time
            </TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="p-0">
          <TabsContent value={period} className="m-0">
            <div className="px-2 py-3">{renderLeaderboardContent()}</div>
          </TabsContent>
        </CardContent>
      </Tabs>

      {/* Period indicator */}
      <div className="px-6 py-3 border-t bg-muted/30 text-xs text-muted-foreground text-center">
        Showing rankings for {getPeriodLabel(period).toLowerCase()}
        {(branch !== "all" || region !== "all") && (
          <span>
            {" "}
            &middot; Filtered by{" "}
            {branch !== "all" && <Badge variant="outline" className="mx-1">{branch}</Badge>}
            {region !== "all" && <Badge variant="outline" className="mx-1">{region}</Badge>}
          </span>
        )}
      </div>
    </Card>
  );
}
