"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { AISearchPlatform } from "@/lib/geo/types";
import { AI_PLATFORM_INFO, getScoreColor } from "@/lib/geo/types";

interface PlatformBreakdownProps {
  platformScores: Record<AISearchPlatform, number> | null;
  isLoading?: boolean;
}

export function PlatformBreakdown({ platformScores, isLoading }: PlatformBreakdownProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Platform Visibility</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!platformScores) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Platform Visibility</CardTitle>
          </div>
          <CardDescription>Your visibility score across AI search platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Globe className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No platform data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const platforms = Object.entries(platformScores)
    .map(([platform, score]) => ({
      platform: platform as AISearchPlatform,
      score,
      info: AI_PLATFORM_INFO[platform as AISearchPlatform],
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Platform Visibility</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {platforms.length} Platforms
          </Badge>
        </div>
        <CardDescription>Your visibility score across AI search platforms</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {platforms.map(({ platform, score, info }) => (
          <div key={platform} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("h-3 w-3 rounded-full", info.color)} />
                <span className="text-sm font-medium">{info.name}</span>
              </div>
              <span className={cn("text-sm font-semibold", getScoreColor(score))}>
                {score}
              </span>
            </div>
            <Progress value={score} className="h-2" />
          </div>
        ))}

        {/* Legend */}
        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground">
            These scores estimate your likelihood of being cited or mentioned when users ask relevant questions on each platform.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
