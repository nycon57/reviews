"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Crown,
  Medal,
  Trophy,
  Target,
  Star,
  Users,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { getProfileCompletionLeaderboard } from "@/lib/gamification/profile-completion-actions";
import type { ProfileCompletionLeaderboardEntry } from "@/lib/gamification/profile-completion-types";

interface ProfileCompletionLeaderboardProps {
  limit?: number;
  className?: string;
  showPodium?: boolean;
}

export function ProfileCompletionLeaderboard({
  limit = 10,
  className,
  showPodium = true,
}: ProfileCompletionLeaderboardProps) {
  const [entries, setEntries] = useState<ProfileCompletionLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const result = await getProfileCompletionLeaderboard(limit);
      if (result.success && result.data) {
        setEntries(result.data);
      }
      setIsLoading(false);
    }
    loadData();
  }, [limit]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-repwell-teal-300" />
            Profile Completion Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-2 w-full bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-repwell-teal-300" />
            Profile Completion Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No loan officers found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topThree = entries.slice(0, 3);
  const restOfList = entries.slice(3);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-repwell-teal-300" />
          Profile Completion Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Podium for top 3 */}
        {showPodium && topThree.length >= 1 && (
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Second Place */}
            {topThree[1] && (
              <div className="order-1 sm:order-1">
                <PodiumCard entry={topThree[1]} getInitials={getInitials} />
              </div>
            )}

            {/* First Place */}
            {topThree[0] && (
              <div className="order-first sm:order-2">
                <PodiumCard
                  entry={topThree[0]}
                  getInitials={getInitials}
                  isWinner
                />
              </div>
            )}

            {/* Third Place */}
            {topThree[2] && (
              <div className="order-2 sm:order-3">
                <PodiumCard entry={topThree[2]} getInitials={getInitials} />
              </div>
            )}
          </div>
        )}

        {/* Rest of leaderboard table */}
        {restOfList.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Loan Officer</TableHead>
                  <TableHead className="w-24 text-right">Points</TableHead>
                  <TableHead className="w-32 text-right">Search Rank</TableHead>
                  <TableHead className="w-32">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restOfList.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">#{entry.rank}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {entry.photoUrl && (
                            <AvatarImage src={entry.photoUrl} alt={entry.fullName} />
                          )}
                          <AvatarFallback className="text-xs">
                            {getInitials(entry.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{entry.fullName}</p>
                          {entry.branch && (
                            <p className="text-xs text-muted-foreground">
                              {entry.branch}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">{entry.earnedPoints}</span>
                      <span className="text-muted-foreground text-xs">
                        /{entry.totalPoints}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="font-medium">{entry.searchRankScore}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={entry.percentage}
                          className={cn(
                            "h-2 flex-1",
                            entry.percentage >= 80
                              ? "[&>div]:bg-green-500"
                              : entry.percentage >= 50
                                ? "[&>div]:bg-yellow-500"
                                : "[&>div]:bg-orange-500"
                          )}
                        />
                        <span className="text-xs font-medium w-8">
                          {entry.percentage}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Info card */}
        <div className="rounded-lg border border-dashed bg-muted/30 p-4">
          <h4 className="font-medium text-sm mb-2">How Profile Scores Work</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>
              <strong>Points</strong> are earned by completing profile fields
            </li>
            <li>
              <strong>Search Rank</strong> (0-850) combines profile completion with reviews and engagement
            </li>
            <li>
              Higher scores improve visibility in search results and client matching
            </li>
            <li>
              Connect external platforms like Google Business and Zillow for bonus points
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// Podium Card Component
function PodiumCard({
  entry,
  getInitials,
  isWinner = false,
}: {
  entry: ProfileCompletionLeaderboardEntry;
  getInitials: (name: string) => string;
  isWinner?: boolean;
}) {
  const rankIcon =
    entry.rank === 1 ? (
      <Crown className="h-6 w-6 text-yellow-500" />
    ) : entry.rank === 2 ? (
      <Medal className="h-5 w-5 text-gray-400" />
    ) : (
      <Trophy className="h-5 w-5 text-amber-600" />
    );

  const rankLabel =
    entry.rank === 1
      ? "1st Place"
      : entry.rank === 2
        ? "2nd Place"
        : "3rd Place";

  const cardBorder = isWinner
    ? "border-yellow-200 bg-gradient-to-b from-yellow-50/50 to-transparent"
    : "";

  return (
    <Card className={cn("transition-all hover:shadow-md", cardBorder)}>
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3">
            <Avatar
              className={cn(
                isWinner ? "h-16 w-16" : "h-14 w-14",
                "ring-4",
                entry.rank === 1
                  ? "ring-yellow-400"
                  : entry.rank === 2
                    ? "ring-gray-300"
                    : "ring-amber-400"
              )}
            >
              {entry.photoUrl && (
                <AvatarImage src={entry.photoUrl} alt={entry.fullName} />
              )}
              <AvatarFallback
                className={cn(
                  isWinner ? "text-xl" : "text-lg",
                  entry.rank === 1
                    ? "bg-yellow-100 text-yellow-700"
                    : entry.rank === 2
                      ? "bg-gray-100 text-gray-700"
                      : "bg-amber-100 text-amber-700"
                )}
              >
                {getInitials(entry.fullName)}
              </AvatarFallback>
            </Avatar>
            {isWinner && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                {rankIcon}
              </div>
            )}
            {!isWinner && (
              <div className="absolute -bottom-1 -right-1">{rankIcon}</div>
            )}
          </div>

          <p className="font-semibold truncate max-w-full">{entry.fullName}</p>
          <p
            className={cn(
              "text-xs font-medium",
              entry.rank === 1
                ? "text-yellow-600"
                : "text-muted-foreground"
            )}
          >
            {rankLabel}
          </p>

          <div className="mt-3 w-full space-y-2">
            <Progress
              value={entry.percentage}
              className={cn(
                "h-2",
                entry.percentage >= 80
                  ? "[&>div]:bg-green-500"
                  : entry.percentage >= 50
                    ? "[&>div]:bg-yellow-500"
                    : "[&>div]:bg-orange-500"
              )}
            />
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{entry.earnedPoints} pts</span>
              <span className="font-bold">{entry.percentage}%</span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1 text-sm">
            <Star className="h-3.5 w-3.5 text-yellow-500" />
            <span className="font-medium">{entry.searchRankScore}</span>
            <span className="text-xs text-muted-foreground">rank</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact Leaderboard for Dashboard Sidebar
interface CompactProfileLeaderboardProps {
  limit?: number;
  className?: string;
}

export function CompactProfileLeaderboard({
  limit = 5,
  className,
}: CompactProfileLeaderboardProps) {
  const [entries, setEntries] = useState<ProfileCompletionLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const result = await getProfileCompletionLeaderboard(limit);
      if (result.success && result.data) {
        setEntries(result.data);
      }
      setIsLoading(false);
    }
    loadData();
  }, [limit]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Profile Leaders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 h-4 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-repwell-teal-300" />
          Profile Leaders
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.slice(0, limit).map((entry) => (
            <div key={entry.id} className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-8 w-8">
                  {entry.photoUrl && (
                    <AvatarImage src={entry.photoUrl} alt={entry.fullName} />
                  )}
                  <AvatarFallback className="text-xs">
                    {getInitials(entry.fullName)}
                  </AvatarFallback>
                </Avatar>
                {entry.rank <= 3 && (
                  <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-background flex items-center justify-center">
                    {entry.rank === 1 ? (
                      <Crown className="h-3 w-3 text-yellow-500" />
                    ) : entry.rank === 2 ? (
                      <Medal className="h-3 w-3 text-gray-400" />
                    ) : (
                      <Trophy className="h-3 w-3 text-amber-600" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{entry.fullName}</p>
                <div className="flex items-center gap-2">
                  <Progress value={entry.percentage} className="h-1 flex-1" />
                  <span className="text-xs text-muted-foreground w-8">
                    {entry.percentage}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
