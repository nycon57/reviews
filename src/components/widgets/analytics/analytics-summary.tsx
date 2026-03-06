"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye,
  MousePointerClick,
  Percent,
  PenLine,
  Globe,
} from "lucide-react";
import type { WidgetAnalyticsSummary } from "@/lib/widgets/analytics-actions";

interface AnalyticsSummaryProps {
  data: WidgetAnalyticsSummary | null;
  isLoading: boolean;
}

const CARDS = [
  {
    key: "totalImpressions" as const,
    label: "Total Impressions",
    icon: Eye,
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "totalClicks" as const,
    label: "Total Clicks",
    icon: MousePointerClick,
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "clickThroughRate" as const,
    label: "Click-Through Rate",
    icon: Percent,
    format: (v: number) => `${v.toFixed(2)}%`,
  },
  {
    key: "writeReviewClicks" as const,
    label: "Write Review Clicks",
    icon: PenLine,
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "uniquePageUrls" as const,
    label: "Unique Pages",
    icon: Globe,
    format: (v: number) => v.toLocaleString(),
  },
] as const;

export const AnalyticsSummary = memo(function AnalyticsSummary({
  data,
  isLoading,
}: AnalyticsSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {CARDS.map((card) => (
          <Card key={card.key} className="border-border">
            <CardContent className="p-5">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {CARDS.map((card) => {
        const Icon = card.icon;
        const value = data?.[card.key] ?? 0;
        return (
          <Card
            key={card.key}
            className="border-border bg-card hover:shadow-md transition-shadow duration-200"
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 flex items-center justify-center text-repwell-teal-300">
                  <Icon size={16} />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {card.label}
                </span>
              </div>
              <p className="text-2xl font-bold text-heading tracking-tight">
                {card.format(value)}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});
