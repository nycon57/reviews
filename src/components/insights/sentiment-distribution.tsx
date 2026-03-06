"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  SmileyWink as SmilePlus,
  SmileyNervous as Meh,
  SmileyMeh as Frown,
  ChartPie,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  EXCELLENT_SENTIMENT_PERCENT,
  GOOD_SENTIMENT_PERCENT,
  SENTIMENT_BAR_LABEL_MIN_PERCENT,
} from "@/lib/analytics/constants";

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
  const negativePercent = total > 0 ? 100 - positivePercent - neutralPercent : 0;

  if (total === 0) {
    return (
      <Card className="border border-border shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
              <ChartPie className="h-5 w-5 text-repwell-teal-300" />
            </div>
            <div>
              <CardTitle className="text-lg">Sentiment Distribution</CardTitle>
              <CardDescription>Overall breakdown of review sentiment</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-[150px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm font-medium text-heading">No sentiment data available</p>
              <p className="mt-1 text-xs">Reviews need analysis to show distribution</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border shadow-soft">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <ChartPie className="h-5 w-5 text-repwell-teal-300" />
          </div>
          <div>
            <CardTitle className="text-lg">Sentiment Distribution</CardTitle>
            <CardDescription>Overall breakdown of {total} analyzed reviews</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual bar */}
        <div className="flex h-6 overflow-hidden rounded-full" role="img" aria-label={`${positivePercent}% positive, ${neutralPercent}% neutral, ${negativePercent}% negative`}>
          {positivePercent > 0 && (
            <div
              className="flex items-center justify-center bg-green-500 transition-all"
              style={{ width: `${positivePercent}%` }}
              role="progressbar"
              aria-valuenow={positivePercent}
              aria-valuemax={100}
              aria-label={`Positive: ${positivePercent}%`}
            >
              {positivePercent >= SENTIMENT_BAR_LABEL_MIN_PERCENT && (
                <span className="text-xs font-medium text-white">{positivePercent}%</span>
              )}
            </div>
          )}
          {neutralPercent > 0 && (
            <div
              className="flex items-center justify-center bg-muted-foreground transition-all"
              style={{ width: `${neutralPercent}%` }}
              role="progressbar"
              aria-valuenow={neutralPercent}
              aria-valuemax={100}
              aria-label={`Neutral: ${neutralPercent}%`}
            >
              {neutralPercent >= SENTIMENT_BAR_LABEL_MIN_PERCENT && (
                <span className="text-xs font-medium text-white">{neutralPercent}%</span>
              )}
            </div>
          )}
          {negativePercent > 0 && (
            <div
              className="flex items-center justify-center bg-red-500 transition-all"
              style={{ width: `${negativePercent}%` }}
              role="progressbar"
              aria-valuenow={negativePercent}
              aria-valuemax={100}
              aria-label={`Negative: ${negativePercent}%`}
            >
              {negativePercent >= SENTIMENT_BAR_LABEL_MIN_PERCENT && (
                <span className="text-xs font-medium text-white">{negativePercent}%</span>
              )}
            </div>
          )}
        </div>

        {/* Legend with counts */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <SmilePlus className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">{positive}</span>
            </div>
            <p className="text-sm font-medium text-green-700 dark:text-green-400">Positive</p>
            <p className="text-xs text-muted-foreground">{positivePercent}%</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Meh className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold text-muted-foreground">{neutral}</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Neutral</p>
            <p className="text-xs text-muted-foreground">{neutralPercent}%</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Frown className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">{negative}</span>
            </div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">Negative</p>
            <p className="text-xs text-muted-foreground">{negativePercent}%</p>
          </div>
        </div>

        {/* Health indicator */}
        <div className={cn(
          "rounded-lg p-3 text-sm",
          positivePercent >= EXCELLENT_SENTIMENT_PERCENT
            ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-400"
            : positivePercent >= GOOD_SENTIMENT_PERCENT
              ? "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
              : "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-400"
        )}>
          {positivePercent >= EXCELLENT_SENTIMENT_PERCENT ? (
            <p>Your sentiment score is excellent. Most customers have a positive experience.</p>
          ) : positivePercent >= GOOD_SENTIMENT_PERCENT ? (
            <p>Your sentiment score is good. There may be opportunities to improve customer experience.</p>
          ) : (
            <p>Your sentiment score needs attention. Review negative feedback for improvement areas.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
