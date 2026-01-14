"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Star,
  TrendingUp,
  MessageSquare,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { DashboardMetrics } from "@/lib/dashboard";

interface StatsCardsProps {
  metrics: DashboardMetrics;
}

export function LOStatsCards({ metrics }: StatsCardsProps) {
  const stats = [
    {
      title: "Total Reviews",
      value: metrics.totalReviews.toString(),
      change: metrics.totalReviewsChange,
      icon: <Star className="h-4 w-4" />,
      format: "number",
    },
    {
      title: "Average Rating",
      value: metrics.averageRating.toFixed(1),
      change: metrics.averageRatingChange,
      icon: <TrendingUp className="h-4 w-4" />,
      suffix: "/5",
      format: "decimal",
    },
    {
      title: "Response Rate",
      value: `${metrics.responseRate}%`,
      change: metrics.responseRateChange,
      icon: <MessageSquare className="h-4 w-4" />,
      format: "percent",
    },
    {
      title: "NPS Score",
      value: metrics.npsScore.toString(),
      change: metrics.npsScoreChange,
      icon: <Users className="h-4 w-4" />,
      format: "number",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </span>
              <span className="text-muted-foreground">{stat.icon}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {stat.value}
                {stat.suffix && (
                  <span className="text-base font-normal text-muted-foreground">
                    {stat.suffix}
                  </span>
                )}
              </span>
              {stat.change !== 0 && (
                <span
                  className={`flex items-center text-xs font-medium ${
                    stat.change > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.change > 0 ? (
                    <ArrowUpRight className="mr-0.5 h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="mr-0.5 h-3 w-3" />
                  )}
                  {stat.change > 0 ? "+" : ""}
                  {stat.change}%
                </span>
              )}
            </div>
            {/* Subtle gradient background indicator */}
            <div
              className={`absolute bottom-0 left-0 h-1 w-full ${
                stat.change > 0
                  ? "bg-gradient-to-r from-green-500/20 to-green-500/40"
                  : stat.change < 0
                    ? "bg-gradient-to-r from-red-500/20 to-red-500/40"
                    : "bg-gradient-to-r from-primary/10 to-primary/20"
              }`}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
