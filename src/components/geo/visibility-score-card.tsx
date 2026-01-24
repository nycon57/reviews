"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendUp as TrendingUp,
  TrendDown as TrendingDown,
  Minus,
  Eye,
  Lightning as Zap,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { AIVisibilityScore } from "@/lib/geo/types";
import { getScoreColor, getScoreLabel } from "@/lib/geo/types";

interface VisibilityScoreCardProps {
  score: AIVisibilityScore | null;
  isLoading?: boolean;
}

export function VisibilityScoreCard({ score, isLoading }: VisibilityScoreCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">AI Visibility Score</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-[280px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!score) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">AI Visibility Score</CardTitle>
          </div>
          <CardDescription>How visible are you to AI search engines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Eye className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No visibility data available</p>
              <p className="text-xs">Complete your profile to get your score</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = score.scoreChange && score.scoreChange > 0
    ? TrendingUp
    : score.scoreChange && score.scoreChange < 0
      ? TrendingDown
      : Minus;

  const trendColor = score.scoreChange && score.scoreChange > 0
    ? "text-green-600"
    : score.scoreChange && score.scoreChange < 0
      ? "text-red-600"
      : "text-gray-500";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">AI Visibility Score</CardTitle>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            <Zap className="mr-1 h-3 w-3" />
            GEO
          </Badge>
        </div>
        <CardDescription>How visible are you to AI search engines</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Score Display */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className={cn("text-5xl font-bold", getScoreColor(score.overallScore))}>
                {score.overallScore}
              </span>
              <span className="text-lg text-muted-foreground">/100</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  score.overallScore >= 80 && "border-green-500 text-green-700",
                  score.overallScore >= 60 && score.overallScore < 80 && "border-yellow-500 text-yellow-700",
                  score.overallScore >= 40 && score.overallScore < 60 && "border-orange-500 text-orange-700",
                  score.overallScore < 40 && "border-red-500 text-red-700"
                )}
              >
                {getScoreLabel(score.overallScore)}
              </Badge>
              {score.scoreChange !== null && (
                <span className={cn("flex items-center text-sm", trendColor)}>
                  <TrendIcon className="mr-0.5 h-3 w-3" />
                  {Math.abs(score.scoreChange)}
                </span>
              )}
            </div>
          </div>

          {/* Score Ring Visualization */}
          <div className="relative h-24 w-24">
            <svg className="h-24 w-24 -rotate-90 transform">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/20"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * score.overallScore) / 100}
                strokeLinecap="round"
                className={cn(
                  "transition-all duration-500",
                  score.overallScore >= 80 && "text-green-500",
                  score.overallScore >= 60 && score.overallScore < 80 && "text-yellow-500",
                  score.overallScore >= 40 && score.overallScore < 60 && "text-orange-500",
                  score.overallScore < 40 && "text-red-500"
                )}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Eye className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Score Breakdown</h4>

          {Object.entries(score.breakdown).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="capitalize text-muted-foreground">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className={cn("font-medium", getScoreColor(value))}>
                  {value}%
                </span>
              </div>
              <Progress value={value} className="h-1.5" />
            </div>
          ))}
        </div>

        {/* Last Updated */}
        <div className="border-t pt-3 text-xs text-muted-foreground">
          Last calculated: {new Date(score.calculatedAt).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
