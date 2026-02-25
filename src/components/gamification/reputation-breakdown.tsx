"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  TrendUp as TrendingUp,
  Target,
  ChartBar as BarChart3,
  Info,
  CaretRight as ChevronRight,
  PaperPlaneRight as Send,
} from "@phosphor-icons/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ReputationBreakdown, ImprovementTip } from "@/lib/gamification/types";
import { getReputationBreakdown, getImprovementTips } from "@/lib/gamification/actions";

interface ReputationBreakdownCardProps {
  loanOfficerId?: string;
  className?: string;
}

const componentLabels = {
  nps: { label: "NPS Score", description: "Net Promoter Score (-100 to 100)" },
  csat: { label: "Customer Satisfaction", description: "% of satisfied customers" },
  responseRate: { label: "Response Rate", description: "% of surveys completed" },
  reviewVolume: { label: "Review Volume", description: "Total reviews collected" },
  averageRating: { label: "Average Rating", description: "Average star rating (1-5)" },
};

function RepBreakdownHeader() {
  return (
    <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50 pb-4">
      <CardTitle className="flex items-center gap-2.5 text-lg font-semibold text-repwell-teal-500">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-repwell-teal-300/10">
          <BarChart3 className="h-4 w-4 text-repwell-teal-300" />
        </div>
        Reputation Breakdown
      </CardTitle>
    </CardHeader>
  );
}

export function ReputationBreakdownCard({
  loanOfficerId,
  className,
}: ReputationBreakdownCardProps) {
  const [breakdown, setBreakdown] = useState<ReputationBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBreakdown() {
      setIsLoading(true);
      const result = await getReputationBreakdown(loanOfficerId);
      if (result.success && result.data) {
        setBreakdown(result.data);
      }
      setIsLoading(false);
    }
    loadBreakdown();
  }, [loanOfficerId]);

  if (isLoading) {
    return (
      <Card className={cn("shadow-soft", className)}>
        <RepBreakdownHeader />
        <CardContent className="pt-4">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-2 w-full bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!breakdown) {
    return (
      <Card className={cn("shadow-soft", className)}>
        <RepBreakdownHeader />
        <CardContent className="pt-4">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-repwell-sage-100/50 to-repwell-teal-300/10">
              <BarChart3 className="h-8 w-8 text-repwell-teal-300" />
            </div>
            <p className="text-sm font-medium text-repwell-teal-500">Build your reputation score</p>
            <p className="mt-1 max-w-[280px] text-xs text-repwell-teal-400">
              Your reputation score is calculated from NPS, customer satisfaction, response rates, and reviews. Start collecting feedback to see your breakdown.
            </p>
            <Button variant="default" size="sm" className="mt-4" asChild>
              <a href="/dashboard/requests">
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Send Survey
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const components = [
    {
      key: "nps" as const,
      ...componentLabels.nps,
      value: breakdown.components.nps.score,
      displayValue: `${breakdown.components.nps.score > 0 ? "+" : ""}${breakdown.components.nps.score}`,
      normalized: breakdown.components.nps.normalized,
      weight: breakdown.components.nps.weight,
      contribution: breakdown.components.nps.contribution,
    },
    {
      key: "csat" as const,
      ...componentLabels.csat,
      value: breakdown.components.csat.score,
      displayValue: `${breakdown.components.csat.score}%`,
      normalized: breakdown.components.csat.score,
      weight: breakdown.components.csat.weight,
      contribution: breakdown.components.csat.contribution,
    },
    {
      key: "responseRate" as const,
      ...componentLabels.responseRate,
      value: breakdown.components.responseRate.score,
      displayValue: `${breakdown.components.responseRate.score}%`,
      normalized: breakdown.components.responseRate.score,
      weight: breakdown.components.responseRate.weight,
      contribution: breakdown.components.responseRate.contribution,
    },
    {
      key: "reviewVolume" as const,
      ...componentLabels.reviewVolume,
      value: breakdown.components.reviewVolume.count,
      displayValue: breakdown.components.reviewVolume.count.toString(),
      normalized: breakdown.components.reviewVolume.normalized,
      weight: breakdown.components.reviewVolume.weight,
      contribution: breakdown.components.reviewVolume.contribution,
    },
    {
      key: "averageRating" as const,
      ...componentLabels.averageRating,
      value: breakdown.components.averageRating.rating,
      displayValue: breakdown.components.averageRating.rating.toFixed(1),
      normalized: breakdown.components.averageRating.normalized,
      weight: breakdown.components.averageRating.weight,
      contribution: breakdown.components.averageRating.contribution,
    },
  ];

  return (
    <Card className={cn("shadow-soft", className)}>
      <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold text-repwell-teal-500">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <BarChart3 className="h-4 w-4 text-repwell-teal-300" />
              </div>
              Reputation Breakdown
            </CardTitle>
            <CardDescription className="mt-1.5 ml-[42px]">
              How your score of {breakdown.totalScore} is calculated
            </CardDescription>
          </div>
          <div className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-repwell-teal-300 to-repwell-teal-500 text-white font-bold text-xl shadow-lg">
            {breakdown.totalScore}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {components.map((component) => (
          <div key={component.key} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 cursor-help">
                      <span className="font-medium text-repwell-teal-500">{component.label}</span>
                      <Info className="h-3 w-3 text-repwell-teal-300" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{component.description}</p>
                    <p className="text-muted-foreground">Weight: {Math.round(component.weight * 100)}%</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex items-center gap-2">
                <span className="text-repwell-teal-400">{component.displayValue}</span>
                <Badge variant="secondary" className="text-xs font-normal">
                  +{component.contribution} pts
                </Badge>
              </div>
            </div>
            <Progress
              value={component.normalized}
              className="h-2"
            />
          </div>
        ))}

        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-xs text-repwell-teal-400">
            <span>Total from all components</span>
            <span className="font-medium">
              {components.reduce((sum, c) => sum + c.contribution, 0)} / 100 points
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Improvement Tips Component
interface ImprovementTipsProps {
  loanOfficerId?: string;
  className?: string;
}

const areaIcons = {
  nps: TrendingUp,
  csat: Target,
  response_rate: BarChart3,
  review_volume: BarChart3,
  rating: Target,
};

const impactColors = {
  high: "bg-red-500/10 text-red-600 border-red-200",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  low: "bg-blue-500/10 text-blue-600 border-blue-200",
};

export function ImprovementTipsCard({
  loanOfficerId,
  className,
}: ImprovementTipsProps) {
  const [tips, setTips] = useState<ImprovementTip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTips() {
      setIsLoading(true);
      const result = await getImprovementTips(loanOfficerId);
      if (result.success && result.data) {
        setTips(result.data);
      }
      setIsLoading(false);
    }
    loadTips();
  }, [loanOfficerId]);

  if (isLoading) {
    return (
      <Card className={cn("shadow-soft", className)}>
        <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2.5 text-lg font-semibold text-repwell-teal-500">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-repwell-teal-300/10">
              <Target className="h-4 w-4 text-repwell-teal-300" />
            </div>
            Improvement Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tips.length === 0) {
    return (
      <Card className={cn("shadow-soft", className)}>
        <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2.5 text-lg font-semibold text-repwell-teal-500">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-repwell-teal-300/10">
              <Target className="h-4 w-4 text-repwell-teal-300" />
            </div>
            Improvement Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-3">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-sm font-medium text-repwell-teal-500">Great job!</p>
            <p className="text-xs text-repwell-teal-400 max-w-[200px]">
              You&apos;re performing well across all metrics. Keep up the excellent work!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("shadow-soft", className)}>
      <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50 pb-4">
        <CardTitle className="flex items-center gap-2.5 text-lg font-semibold text-repwell-teal-500">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <Target className="h-4 w-4 text-repwell-teal-300" />
          </div>
          Improvement Tips
        </CardTitle>
        <CardDescription className="ml-[42px]">
          Focus on these areas to boost your reputation score
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {tips.map((tip, index) => {
          const Icon = areaIcons[tip.area];
          return (
            <div
              key={index}
              className={cn(
                "p-3 rounded-lg border",
                impactColors[tip.impact]
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{tip.title}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] uppercase tracking-wider",
                        tip.impact === "high" && "border-red-300 text-red-600",
                        tip.impact === "medium" && "border-yellow-300 text-yellow-600",
                        tip.impact === "low" && "border-blue-300 text-blue-600"
                      )}
                    >
                      {tip.impact} impact
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tip.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-muted-foreground">
                      Current: <span className="font-medium text-foreground">
                        {typeof tip.currentValue === "number" && tip.currentValue % 1 !== 0
                          ? tip.currentValue.toFixed(1)
                          : tip.currentValue}
                      </span>
                    </span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Target: <span className="font-medium text-foreground">{tip.targetValue}</span>
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      +{tip.potentialGain} pts
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
