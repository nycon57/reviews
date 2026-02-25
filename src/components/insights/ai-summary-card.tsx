"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkle as Sparkles,
  CheckCircle,
  WarningCircle as AlertCircle,
  Calendar,
} from "@phosphor-icons/react";
import type { AIInsightsSummary } from "@/lib/ai";

interface AISummaryCardProps {
  summary: AIInsightsSummary | null;
}

export function AISummaryCard({ summary }: AISummaryCardProps) {
  if (!summary) {
    return (
      <Card className="border border-dashed border-border shadow-soft">
        <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
              <Sparkles className="h-5 w-5 text-repwell-teal-300" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Summary</CardTitle>
              <CardDescription>AI-generated monthly performance summary</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <Sparkles className="h-7 w-7 text-repwell-teal-300" />
              </div>
              <p className="text-sm font-medium text-repwell-teal-500">No summary available yet</p>
              <p className="mt-1 text-xs">Collect more reviews to generate insights</p>
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
    <Card className="border border-border shadow-soft">
      <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <Sparkles className="h-5 w-5 text-repwell-teal-300" />
          </div>
          <div>
            <CardTitle className="text-lg">AI Summary</CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              {formatDate(summary.periodStart)} - {formatDate(summary.periodEnd)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main summary */}
        <p className="text-sm leading-relaxed text-foreground">
          {summary.summary}
        </p>

        {/* Highlights */}
        {summary.highlights.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-green-700">
              <CheckCircle className="h-3.5 w-3.5" />
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
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
              <AlertCircle className="h-3.5 w-3.5" />
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
