"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  Medal,
  Certificate,
  Star,
} from "@phosphor-icons/react";
import type { LeaderboardEntry } from "@/lib/dashboard";

interface PerformanceLeaderboardProps {
  data: LeaderboardEntry[];
  title?: string;
}

export function PerformanceLeaderboard({
  data,
  title = "Top Performers",
}: PerformanceLeaderboardProps) {
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
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-muted-foreground" />;
      case 3:
        return <Certificate className="h-5 w-5 text-amber-600" />;
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
        return "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-transparent";
      case 2:
        return "bg-muted";
      case 3:
        return "bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-transparent";
      default:
        return "";
    }
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No leaderboard data available</p>
              <p className="text-xs">Team members will appear here once they have reviews</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {data.map((entry) => (
          <Link
            key={entry.id}
            href={`/dashboard/analytics/member/${entry.id}`}
            className={`flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent ${getRankBackground(entry.rank)}`}
          >
            {/* Rank */}
            <div className="flex w-8 items-center justify-center">
              {getRankIcon(entry.rank)}
            </div>

            {/* Avatar */}
            <Avatar className="h-10 w-10">
              <AvatarImage src={entry.photoUrl || undefined} alt={entry.fullName} />
              <AvatarFallback>{getInitials(entry.fullName)}</AvatarFallback>
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
              </div>
            </div>

            {/* Score */}
            <div className="text-right">
              <div className="font-semibold">{entry.reputationScore}</div>
              <div className="text-xs text-muted-foreground">points</div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
