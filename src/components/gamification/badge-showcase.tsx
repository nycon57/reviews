"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Award, Lock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BadgeIcon } from "./badge-icon";
import type { BadgeProgress, UserBadge } from "@/lib/gamification/types";
import { getBadgeProgress, getUserBadges } from "@/lib/gamification/actions";

interface BadgeShowcaseProps {
  loanOfficerId?: string;
  showProgress?: boolean;
  maxDisplay?: number;
  className?: string;
}

export function BadgeShowcase({
  loanOfficerId,
  showProgress = true,
  maxDisplay = 12,
  className,
}: BadgeShowcaseProps) {
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadBadges() {
      setIsLoading(true);
      const progressResult = await getBadgeProgress(loanOfficerId);
      if (!cancelled && progressResult.success && progressResult.data) {
        setBadgeProgress(progressResult.data);
      }
      if (!cancelled) {
        setIsLoading(false);
      }
    }

    loadBadges();
    return () => {
      cancelled = true;
    };
  }, [loanOfficerId]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-5 w-5 text-purple-500" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const earned = badgeProgress.filter((bp) => bp.isEarned);
  const inProgress = badgeProgress
    .filter((bp) => !bp.isEarned && bp.percentComplete > 0)
    .slice(0, 3);

  const displayedBadges = showAll ? earned : earned.slice(0, maxDisplay);
  const hasMore = earned.length > maxDisplay;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-5 w-5 text-purple-500" />
            Achievements
          </CardTitle>
          <Badge variant="secondary" className="font-normal">
            {earned.length} / {badgeProgress.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Earned Badges */}
        {earned.length > 0 ? (
          <div>
            <div className="flex flex-wrap gap-2">
              {displayedBadges.map((bp) => (
                <BadgeIcon
                  key={bp.badge.id}
                  badge={bp.badge}
                  size="lg"
                  isEarned={true}
                />
              ))}
            </div>
            {hasMore && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="mt-3 flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Show all {earned.length} badges
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-4 text-muted-foreground">
            <div className="text-center">
              <Lock className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No badges earned yet</p>
              <p className="text-xs">Complete milestones to unlock badges</p>
            </div>
          </div>
        )}

        {/* In Progress */}
        {showProgress && inProgress.length > 0 && (
          <div className="pt-3 border-t space-y-3">
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              In Progress
            </h4>
            {inProgress.map((bp) => (
              <div key={bp.badge.id} className="flex items-center gap-3">
                <BadgeIcon
                  badge={bp.badge}
                  size="sm"
                  isEarned={false}
                  showTooltip={true}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate">
                      {bp.badge.name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {bp.percentComplete}%
                    </span>
                  </div>
                  <Progress value={bp.percentComplete} className="h-1.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for profile headers or cards
interface BadgeRowProps {
  loanOfficerId?: string;
  maxDisplay?: number;
  className?: string;
}

export function BadgeRow({ loanOfficerId, maxDisplay = 5, className }: BadgeRowProps) {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadBadges() {
      const result = await getUserBadges(loanOfficerId);
      if (!cancelled && result.success && result.data) {
        setBadges(result.data);
      }
      if (!cancelled) {
        setIsLoading(false);
      }
    }
    loadBadges();
    return () => {
      cancelled = true;
    };
  }, [loanOfficerId]);

  if (isLoading) {
    return (
      <div className={cn("flex gap-1", className)}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-6 w-6 rounded-full bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (badges.length === 0) {
    return null;
  }

  const displayBadges = badges.slice(0, maxDisplay);
  const moreCount = badges.length - maxDisplay;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {displayBadges.map((ub) => (
        <BadgeIcon
          key={ub.id}
          badge={ub.badge}
          size="sm"
          isEarned={true}
        />
      ))}
      {moreCount > 0 && (
        <span className="text-xs text-muted-foreground ml-1">+{moreCount}</span>
      )}
    </div>
  );
}
