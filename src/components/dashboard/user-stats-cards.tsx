"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  StarIcon as Star,
  TrendUpIcon as TrendingUp,
  ChatsIcon as MessageSquare,
  UsersIcon as Users,
  ArrowUpRightIcon as ArrowUpRight,
  ArrowDownRightIcon as ArrowDownRight,
} from "@phosphor-icons/react";
import { cardHover, cardTap, staggerContainer, fadeInUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { IconContainer } from "@/components/shared";
import type { DashboardMetrics } from "@/lib/dashboard";

interface StatsCardsProps {
  metrics: DashboardMetrics;
}

export function UserStatsCards({ metrics }: StatsCardsProps) {
  const stats = [
    {
      title: "Total Reviews",
      value: metrics.totalReviews.toString(),
      change: metrics.totalReviewsChange,
      icon: Star,
      format: "number",
    },
    {
      title: "Average Rating",
      value: metrics.averageRating.toFixed(1),
      change: metrics.averageRatingChange,
      icon: TrendingUp,
      suffix: "/5",
      format: "decimal",
    },
    {
      title: "Response Rate",
      value: `${metrics.responseRate}%`,
      change: metrics.responseRateChange,
      icon: MessageSquare,
      format: "percent",
    },
    {
      title: "NPS Score",
      value: metrics.npsScore.toString(),
      change: metrics.npsScoreChange,
      icon: Users,
      format: "number",
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isPositive = stat.change > 0;
        const isNegative = stat.change < 0;

        return (
          <motion.div key={stat.title} variants={fadeInUp}>
            <motion.div
              whileHover={cardHover}
              whileTap={cardTap}
              className="h-full hover:shadow-md transition-shadow duration-200"
            >
              <Card className="h-full border-border hover:border-repwell-teal-300/30 transition-colors duration-200">
                <CardContent className="p-6">
                  {/* Header with title and icon */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-body-sm font-medium text-label">
                      {stat.title}
                    </span>
                    <IconContainer size="md" bg="soft">
                      <Icon className="h-5 w-5 text-repwell-teal-300 dark:text-repwell-sage-200" />
                    </IconContainer>
                  </div>

                  {/* Value */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-heading tracking-tight">
                      {stat.value}
                    </span>
                    {stat.suffix && (
                      <span className="text-lg font-normal text-label">
                        {stat.suffix}
                      </span>
                    )}
                  </div>

                  {/* Change indicator */}
                  {stat.change !== 0 && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <div
                        className={cn(
                          "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                          isPositive && "bg-success/10 text-success",
                          isNegative && "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                        )}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {isPositive ? "+" : ""}
                        {stat.change}%
                      </div>
                      <span className="text-xs text-label">vs last month</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
