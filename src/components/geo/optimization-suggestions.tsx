"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  ArrowRight,
  CheckCircle,
  Warning as AlertTriangle,
  WarningCircle as AlertCircle,
  TrendUp as TrendingUp,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { OptimizationSuggestion } from "@/lib/geo/types";

interface OptimizationSuggestionsProps {
  suggestions: OptimizationSuggestion[];
  isLoading?: boolean;
  onImplement?: (suggestionId: string) => void;
  onDismiss?: (suggestionId: string) => void;
}

export function OptimizationSuggestions({
  suggestions,
  isLoading,
  onImplement,
  onDismiss,
}: OptimizationSuggestionsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Optimization Suggestions</CardTitle>
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

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Optimization Suggestions</CardTitle>
          </div>
          <CardDescription>AI-powered recommendations to improve your visibility</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
              <p className="text-sm font-medium text-green-700">All optimizations complete!</p>
              <p className="text-xs">Your profile is well-optimized for AI search</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Optimization Suggestions</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {pendingSuggestions.length} pending
          </Badge>
        </div>
        <CardDescription>AI-powered recommendations to improve your visibility</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingSuggestions.slice(0, 5).map((suggestion) => (
          <div
            key={suggestion.id}
            className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {getPriorityIcon(suggestion.priority)}
                  <h4 className="font-medium">{suggestion.title}</h4>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px]", getPriorityBadgeClass(suggestion.priority))}
                  >
                    {suggestion.priority}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground">
                  {suggestion.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    +{suggestion.estimatedImpact} points
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {suggestion.category}
                  </Badge>
                  <span className="text-muted-foreground">
                    {suggestion.estimatedEffort} effort
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {onImplement && (
                  <Button
                    size="sm"
                    onClick={() => onImplement(suggestion.id)}
                    className="whitespace-nowrap"
                  >
                    Fix Now
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                )}
                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDismiss(suggestion.id)}
                    className="text-xs text-muted-foreground"
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        {pendingSuggestions.length > 5 && (
          <div className="text-center">
            <Button variant="outline" size="sm">
              View All {pendingSuggestions.length} Suggestions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
