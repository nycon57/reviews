"use client";

import {
  Users,
  Star,
  TrendUp as TrendingUp,
  Chats as MessageSquare,
} from "@phosphor-icons/react";
import { StatCard, StatCardGrid } from "@/components/shared";
import type { TeamMetrics } from "@/lib/dashboard";

interface TeamStatsCardsProps {
  metrics: TeamMetrics;
}

export function TeamStatsCards({ metrics }: TeamStatsCardsProps) {
  return (
    <StatCardGrid columns={4}>
      <StatCard
        title="Team Members"
        value={metrics.activeMembers}
        subtitle={`of ${metrics.totalMembers} total`}
        icon={<Users className="h-4 w-4" />}
      />
      <StatCard
        title="Total Reviews"
        value={metrics.totalReviews}
        change={metrics.totalReviewsChange}
        icon={<Star className="h-4 w-4" />}
      />
      <StatCard
        title="Team Avg Rating"
        value={metrics.averageRating.toFixed(1)}
        suffix="/5"
        change={metrics.averageRatingChange}
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <StatCard
        title="Team NPS"
        value={metrics.teamNPS}
        change={metrics.teamNPSChange}
        icon={<MessageSquare className="h-4 w-4" />}
      />
    </StatCardGrid>
  );
}
