'use client';

import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import {
  Star,
  Target,
} from "@phosphor-icons/react";
import { cn } from '@/lib/utils';
import { getProfileCompletionScore } from '@/lib/gamification/profile-completion-actions';
import type { ProfileCompletionScore } from '@/lib/gamification/profile-completion-types';

interface ProfileBannerProps {
  loanOfficerId?: string;
  className?: string;
}

export function ProfileBanner({ loanOfficerId, className }: ProfileBannerProps) {
  const [data, setData] = useState<ProfileCompletionScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const result = await getProfileCompletionScore(loanOfficerId);
      if (result.success && result.data) {
        setData(result.data);
      }
      setIsLoading(false);
    }
    loadData();
  }, [loanOfficerId]);

  if (isLoading) {
    return (
      <div
        className={cn(
          'rounded-lg border border-border bg-gradient-to-r from-repwell-sage-100/30 to-repwell-teal-300/10 p-4',
          className
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-2 w-full max-w-xs bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Hide banner if profile is 100% complete
  if (data.percentage === 100) {
    return null;
  }

  /** Smooth hue: 0% → red (0°), 100% → green (120°) */
  const hue = Math.round((Math.min(data.percentage, 100) / 100) * 120);
  const fillColor = `hsl(${hue} 65% 45%)`;

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  const nextAction = data.nextActions[0];

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-gradient-to-r from-repwell-sage-100/30 to-repwell-teal-300/10 p-4 hover:shadow-soft transition-shadow',
        className
      )}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Score Circle */}
          <div
            className="h-12 w-12 shrink-0 rounded-full flex items-center justify-center bg-card border-2 shadow-sm"
            style={{ borderColor: fillColor }}
          >
            <span className={cn('text-sm font-bold', getScoreColor(data.percentage))}>
              {data.percentage}%
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-repwell-teal-400 dark:text-repwell-sage-100/80" />
              <span className="text-sm font-medium text-heading-accent">
                Profile Completion
              </span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 text-yellow-500" />
                <span>{data.searchRankScore}/850 rank</span>
              </div>
            </div>
            <Progress
              value={data.percentage}
              className="h-2 max-w-xs"
              indicatorClassName="!bg-[var(--progress-fill)]"
              indicatorStyle={{ "--progress-fill": fillColor } as React.CSSProperties}
            />
            {nextAction && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                Next: {nextAction.field.label} (+{nextAction.impact} pts)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
