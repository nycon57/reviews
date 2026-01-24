"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  User,
  Briefcase,
  Link,
  ShareNetwork as Share2,
  CheckCircle as CheckCircle2,
  Circle,
  CaretDown as ChevronDown,
  CaretRight as ChevronRight,
  Sparkle as Sparkles,
  Trophy,
  Medal,
  Crown,
  Link as Link2,
  TrendUp as TrendingUp,
  Target,
  Lightning as Zap,
  Star,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { getProfileCompletionScore } from "@/lib/gamification/profile-completion-actions";
import type {
  ProfileCompletionScore,
  SectionCompletionStatus,
} from "@/lib/gamification/profile-completion-types";

// Icon mapping for sections
const sectionIcons: Record<string, React.ElementType> = {
  User,
  Briefcase,
  Link,
  Share2,
};

// Icon mapping for milestones
const milestoneIcons: Record<string, React.ElementType> = {
  Sparkles,
  Trophy,
  Medal,
  Crown,
  Link2,
};

interface ProfileCompletionCardProps {
  loanOfficerId?: string;
  className?: string;
  showSections?: boolean;
  showMilestones?: boolean;
  showTips?: boolean;
}

export function ProfileCompletionCard({
  loanOfficerId,
  className,
  showSections = true,
  showMilestones = true,
  showTips = true,
}: ProfileCompletionCardProps) {
  const [data, setData] = useState<ProfileCompletionScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const result = await getProfileCompletionScore(loanOfficerId);
      if (result.success && result.data) {
        setData(result.data);
      }
      setIsLoading(false);
    }
    loadData();
  }, [loanOfficerId]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-2 w-full bg-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-orange-600";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getSearchRankLabel = (score: number) => {
    if (score >= 750) return { label: "Excellent", color: "text-green-600" };
    if (score >= 600) return { label: "Good", color: "text-blue-600" };
    if (score >= 400) return { label: "Fair", color: "text-yellow-600" };
    return { label: "Needs Work", color: "text-orange-600" };
  };

  const searchRank = getSearchRankLabel(data.searchRankScore);
  const earnedMilestones = data.milestones.filter((m) => m.achieved);
  const nextMilestone = data.milestones.find((m) => !m.achieved);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-repwell-teal-300" />
            <span className="text-lg">Profile Score</span>
          </div>
          {data.rank && (
            <Badge variant="outline" className="font-normal">
              Rank #{data.rank}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Score Display */}
        <div className="flex items-start gap-4">
          {/* Circular Score */}
          <div className="relative">
            <div
              className={cn(
                "h-20 w-20 rounded-full flex items-center justify-center",
                "bg-gradient-to-br from-repwell-teal-300/20 to-repwell-teal-500/20",
                "border-4",
                data.percentage >= 80
                  ? "border-green-500"
                  : data.percentage >= 50
                    ? "border-yellow-500"
                    : "border-orange-500"
              )}
            >
              <div className="text-center">
                <div className={cn("text-2xl font-bold", getScoreColor(data.percentage))}>
                  {data.percentage}%
                </div>
              </div>
            </div>
            {data.percentage === 100 && (
              <div className="absolute -top-1 -right-1">
                <Crown className="h-6 w-6 text-yellow-500" />
              </div>
            )}
          </div>

          {/* Score Details */}
          <div className="flex-1 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {data.earnedPoints}
              </span>
              <span className="text-sm text-muted-foreground">
                / {data.totalPoints} points
              </span>
            </div>

            <Progress
              value={data.percentage}
              className={cn("h-2", getProgressColor(data.percentage))}
            />

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">{data.searchRankScore}</span>
                <span className="text-muted-foreground">/ 850</span>
              </div>
              <span className={cn("font-medium", searchRank.color)}>
                {searchRank.label}
              </span>
            </div>
          </div>
        </div>

        {/* Milestones Progress */}
        {showMilestones && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Milestones</span>
              <span className="text-muted-foreground">
                {earnedMilestones.length} / {data.milestones.length} achieved
              </span>
            </div>
            <div className="flex gap-1">
              {data.milestones.map((milestone) => {
                const Icon = milestoneIcons[milestone.icon] || Sparkles;
                return (
                  <TooltipProvider key={milestone.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex-1 h-8 rounded-md flex items-center justify-center transition-colors",
                            milestone.achieved
                              ? "bg-repwell-teal-300/20 text-repwell-teal-300"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-center">
                          <p className="font-medium">{milestone.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {milestone.description}
                          </p>
                          <p className="text-xs mt-1">
                            {milestone.achieved ? (
                              <span className="text-green-600">+{milestone.bonusPoints} bonus points earned!</span>
                            ) : (
                              <span>+{milestone.bonusPoints} bonus points</span>
                            )}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
            {nextMilestone && (
              <p className="text-xs text-muted-foreground">
                Next: <span className="font-medium">{nextMilestone.name}</span> at{" "}
                {nextMilestone.threshold}% completion
              </p>
            )}
          </div>
        )}

        {/* Section Breakdown */}
        {showSections && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Profile Sections</h4>
            <div className="space-y-1.5">
              {data.sections.map((section) => (
                <SectionRow
                  key={section.section.id}
                  section={section}
                  isExpanded={expandedSections.has(section.section.id)}
                  onToggle={() => toggleSection(section.section.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quick Tips */}
        {showTips && data.nextActions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <h4 className="text-sm font-medium">Quick Wins</h4>
            </div>
            <div className="space-y-1.5">
              {data.nextActions.slice(0, 3).map((tip) => (
                <div
                  key={tip.field.id}
                  className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp
                      className={cn(
                        "h-4 w-4",
                        tip.priority === "high"
                          ? "text-green-500"
                          : tip.priority === "medium"
                            ? "text-yellow-500"
                            : "text-muted-foreground"
                      )}
                    />
                    <span className="text-sm">{tip.field.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    +{tip.impact} pts
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href="/dashboard/profile">
                Complete Profile
                <ChevronRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Section Row Component
function SectionRow({
  section,
  isExpanded,
  onToggle,
}: {
  section: SectionCompletionStatus;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = sectionIcons[section.section.icon] || User;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50 transition-colors">
          <div
            className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center",
              section.completed
                ? "bg-green-100 text-green-600"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{section.section.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {section.earnedPoints}/{section.maxPoints} pts
                </span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
            <Progress value={section.percentage} className="h-1.5 mt-1" />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-11 mr-3 pb-2 space-y-1">
          {section.fields.map((fieldStatus) => (
            <div
              key={fieldStatus.field.id}
              className="flex items-center justify-between text-sm py-1"
            >
              <div className="flex items-center gap-2">
                {fieldStatus.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    fieldStatus.completed
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  )}
                >
                  {fieldStatus.field.label}
                </span>
              </div>
              <span
                className={cn(
                  "text-xs",
                  fieldStatus.completed ? "text-green-600" : "text-muted-foreground"
                )}
              >
                {fieldStatus.completed ? "+" : ""}
                {fieldStatus.field.points} pts
              </span>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Compact Widget Version
interface ProfileCompletionWidgetProps {
  loanOfficerId?: string;
  className?: string;
}

export function ProfileCompletionWidget({
  loanOfficerId,
  className,
}: ProfileCompletionWidgetProps) {
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

  if (isLoading || !data) {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        <div className="h-8 w-20 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 text-sm", className)}>
      <div className="flex items-center gap-1.5">
        <div
          className={cn(
            "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
            data.percentage >= 80
              ? "bg-green-500 text-white"
              : data.percentage >= 50
                ? "bg-yellow-500 text-white"
                : "bg-orange-500 text-white"
          )}
        >
          {data.percentage}
        </div>
        <span className="text-muted-foreground">profile</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Star className="h-4 w-4 text-yellow-500" />
        <span className="font-medium">{data.searchRankScore}</span>
        <span className="text-xs text-muted-foreground">rank</span>
      </div>
    </div>
  );
}
