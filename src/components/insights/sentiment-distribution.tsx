"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  SmileyWink as SmilePlus,
  SmileyNervous as Meh,
  SmileyMeh as Frown,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface SentimentDistributionProps {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

export function SentimentDistribution({
  positive,
  neutral,
  negative,
  total,
}: SentimentDistributionProps) {
  const positivePercent = total > 0 ? Math.round((positive / total) * 100) : 0;
  const neutralPercent = total > 0 ? Math.round((neutral / total) * 100) : 0;
  const negativePercent = total > 0 ? Math.round((negative / total) * 100) : 0;

  if (total === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Sentiment Distribution</CardTitle>
          <CardDescription>Overall breakdown of review sentiment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[150px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No sentiment data available</p>
              <p className="text-xs">Reviews need analysis to show distribution</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Sentiment Distribution</CardTitle>
        <CardDescription>Overall breakdown of {total} analyzed reviews</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual bar */}
        <div className="flex h-6 overflow-hidden rounded-full">
          {positivePercent > 0 && (
            <div
              className="flex items-center justify-center bg-green-500 transition-all"
              style={{ width: `${positivePercent}%` }}
            >
              {positivePercent >= 10 && (
                <span className="text-xs font-medium text-white">{positivePercent}%</span>
              )}
            </div>
          )}
          {neutralPercent > 0 && (
            <div
              className="flex items-center justify-center bg-gray-400 transition-all"
              style={{ width: `${neutralPercent}%` }}
            >
              {neutralPercent >= 10 && (
                <span className="text-xs font-medium text-white">{neutralPercent}%</span>
              )}
            </div>
          )}
          {negativePercent > 0 && (
            <div
              className="flex items-center justify-center bg-red-500 transition-all"
              style={{ width: `${negativePercent}%` }}
            >
              {negativePercent >= 10 && (
                <span className="text-xs font-medium text-white">{negativePercent}%</span>
              )}
            </div>
          )}
        </div>

        {/* Legend with counts */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <SmilePlus className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{positive}</span>
            </div>
            <p className="text-sm font-medium text-green-700">Positive</p>
            <p className="text-xs text-muted-foreground">{positivePercent}%</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Meh className="h-5 w-5 text-gray-500" />
              <span className="text-2xl font-bold text-gray-600">{neutral}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Neutral</p>
            <p className="text-xs text-muted-foreground">{neutralPercent}%</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Frown className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{negative}</span>
            </div>
            <p className="text-sm font-medium text-red-700">Negative</p>
            <p className="text-xs text-muted-foreground">{negativePercent}%</p>
          </div>
        </div>

        {/* Health indicator */}
        <div className={cn(
          "rounded-lg p-3 text-sm",
          positivePercent >= 70 && "bg-green-50 text-green-800",
          positivePercent >= 50 && positivePercent < 70 && "bg-amber-50 text-amber-800",
          positivePercent < 50 && "bg-red-50 text-red-800"
        )}>
          {positivePercent >= 70 && (
            <p>Your sentiment score is excellent. Most customers have a positive experience.</p>
          )}
          {positivePercent >= 50 && positivePercent < 70 && (
            <p>Your sentiment score is good. There may be opportunities to improve customer experience.</p>
          )}
          {positivePercent < 50 && (
            <p>Your sentiment score needs attention. Review negative feedback for improvement areas.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
