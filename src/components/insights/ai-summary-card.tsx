"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import type { AIInsightsSummary } from "@/lib/ai";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface AISummaryCardProps {
  summary: AIInsightsSummary | null;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
}

export function AISummaryCard({ summary, onRefresh, isLoading }: AISummaryCardProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  };

  if (!summary) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">AI Summary</CardTitle>
            </div>
          </div>
          <CardDescription>AI-generated monthly performance summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Sparkles className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No summary available yet</p>
              <p className="text-xs">Collect more reviews to generate insights</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">AI Summary</CardTitle>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
            >
              <RefreshCw className={cn("mr-1 h-3 w-3", (refreshing || isLoading) && "animate-spin")} />
              Refresh
            </Button>
          )}
        </div>
        <CardDescription className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3" />
          {formatDate(summary.periodStart)} - {formatDate(summary.periodEnd)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main summary */}
        <p className="text-sm leading-relaxed text-foreground">
          {summary.summary}
        </p>

        {/* Highlights */}
        {summary.highlights.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-sm font-medium text-green-700">
              <CheckCircle className="h-4 w-4" />
              Highlights
            </h4>
            <ul className="space-y-1.5">
              {summary.highlights.map((highlight, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas for improvement */}
        {summary.areasOfImprovement.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-sm font-medium text-amber-700">
              <AlertCircle className="h-4 w-4" />
              Areas for Improvement
            </h4>
            <ul className="space-y-1.5">
              {summary.areasOfImprovement.map((area, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                  {area}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Generation timestamp */}
        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span>Generated {formatDate(summary.generatedAt)}</span>
          <Badge variant="secondary" className="text-[10px]">
            AI Powered
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
