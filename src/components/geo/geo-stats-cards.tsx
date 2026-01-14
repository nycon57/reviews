"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  MessageSquare,
  Quote,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GEODashboardSummary } from "@/lib/geo/types";

interface GeoStatsCardsProps {
  summary: GEODashboardSummary | null;
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  isLoading?: boolean;
}

function StatCard({ title, value, change, icon, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = change && change > 0
    ? TrendingUp
    : change && change < 0
      ? TrendingDown
      : Minus;

  const trendColor = change && change > 0
    ? "text-green-600"
    : change && change < 0
      ? "text-red-600"
      : "text-gray-500";

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {change !== undefined && (
              <p className={cn("flex items-center text-sm", trendColor)}>
                <TrendIcon className="mr-1 h-4 w-4" />
                {change > 0 ? '+' : ''}{change}
                <span className="ml-1 text-muted-foreground">vs last period</span>
              </p>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-3">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function GeoStatsCards({ summary, isLoading }: GeoStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Visibility Score"
        value={summary?.overallScore ?? '-'}
        change={summary?.scoreChange}
        icon={<Eye className="h-5 w-5 text-primary" />}
        isLoading={isLoading}
      />
      <StatCard
        title="AI Mentions"
        value={summary?.totalMentions ?? '-'}
        change={summary?.mentionsChange}
        icon={<MessageSquare className="h-5 w-5 text-primary" />}
        isLoading={isLoading}
      />
      <StatCard
        title="Citations"
        value={summary?.totalCitations ?? '-'}
        change={summary?.citationsChange}
        icon={<Quote className="h-5 w-5 text-primary" />}
        isLoading={isLoading}
      />
      <StatCard
        title="Pending Optimizations"
        value={summary?.pendingSuggestions ?? '-'}
        icon={<Lightbulb className="h-5 w-5 text-primary" />}
        isLoading={isLoading}
      />
    </div>
  );
}
