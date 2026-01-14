'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  getAccuracyScoreColor,
  getAccuracyScoreLabel,
  type AccuracyScoreBreakdown,
} from '@/lib/listings/types';

interface AccuracyScoreCardProps {
  score: number;
  previousScore?: number;
  breakdown?: AccuracyScoreBreakdown;
  lastChecked?: string;
}

export function AccuracyScoreCard({
  score,
  previousScore,
  breakdown,
  lastChecked,
}: AccuracyScoreCardProps) {
  const change = previousScore !== undefined ? score - previousScore : 0;
  const label = getAccuracyScoreLabel(score);
  const colorClass = getAccuracyScoreColor(score);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center justify-between">
          <span>Accuracy Score</span>
          {score >= 80 ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : score < 50 ? (
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Score */}
        <div className="flex items-end gap-3">
          <span className={`text-4xl font-bold ${colorClass}`}>{score}</span>
          <span className="text-muted-foreground text-lg pb-1">/100</span>
          {change !== 0 && (
            <div
              className={`flex items-center gap-1 text-sm pb-1 ${
                change > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {change > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{change > 0 ? '+' : ''}{change}</span>
            </div>
          )}
          {change === 0 && previousScore !== undefined && (
            <div className="flex items-center gap-1 text-sm pb-1 text-muted-foreground">
              <Minus className="h-4 w-4" />
              <span>No change</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <Progress value={score} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{label}</span>
            {lastChecked && (
              <span>Last checked: {new Date(lastChecked).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Breakdown */}
        {breakdown && (
          <div className="pt-2 border-t space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Score Breakdown
            </p>
            <div className="grid gap-2">
              <ScoreBreakdownItem
                label="NAP Completeness"
                value={breakdown.napCompleteness}
                weight={20}
              />
              <ScoreBreakdownItem
                label="Directory Coverage"
                value={breakdown.directoryCoverage}
                weight={25}
              />
              <ScoreBreakdownItem
                label="NAP Consistency"
                value={breakdown.napConsistency}
                weight={30}
              />
              <ScoreBreakdownItem
                label="Update Freshness"
                value={breakdown.updateFreshness}
                weight={15}
              />
              <ScoreBreakdownItem
                label="Photo Quality"
                value={breakdown.photoQuality}
                weight={10}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreBreakdownItem({
  label,
  value,
  weight,
}: {
  label: string;
  value: number;
  weight: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-1.5 py-0">
            {weight}%
          </Badge>
          <span className="font-medium">{value}</span>
        </div>
      </div>
      <Progress value={value} className="h-1" />
    </div>
  );
}
