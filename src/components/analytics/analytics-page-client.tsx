"use client";

import { useState } from "react";
import { ChartBar } from "@phosphor-icons/react";
import { UnifiedAnalyticsDashboard } from "@/components/analytics";
import { AnalyticsTabsWrapper } from "@/components/analytics/analytics-tabs-wrapper";
import { AdminAnalyticsDashboard } from "@/app/(dashboard)/dashboard/admin/analytics/admin-analytics-dashboard";
import { ScopeSelector, type AnalyticsScope } from "./scope-selector";
import type {
  VideoTestimonialFunnelMetrics,
  VideoTestimonialTrendDataPoint,
  UserVideoStats,
} from "@/lib/video-testimonials/analytics-actions";
import type { ResponseAnalytics } from "@/lib/reviews/response-actions";

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
}

interface ReviewSummary {
  totalReviews: number;
  averageRating: number;
  responseRate: number;
  npsScore: number;
}

interface AnalyticsPageClientProps {
  userRole: "admin" | "manager" | "user";
  initialVideoMetrics: VideoTestimonialFunnelMetrics | null;
  initialVideoTrends: VideoTestimonialTrendDataPoint[];
  initialLoStats: UserVideoStats[];
  initialReviewSummary: ReviewSummary;
  initialResponseAnalytics: ResponseAnalytics | null;
  teamMembers: TeamMember[];
}

function getDefaultScope(role: "admin" | "manager" | "user"): AnalyticsScope {
  switch (role) {
    case "admin":
      return "organization";
    case "manager":
      return "team";
    default:
      return "personal";
  }
}

export function AnalyticsPageClient({
  userRole,
  initialVideoMetrics,
  initialVideoTrends,
  initialLoStats,
  initialReviewSummary,
  initialResponseAnalytics,
  teamMembers,
}: AnalyticsPageClientProps) {
  const [scope, setScope] = useState<AnalyticsScope>(
    getDefaultScope(userRole)
  );

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-teal-300/10">
            <ChartBar className="h-5 w-5 text-repwell-teal-300" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Track your performance metrics and insights
            </p>
          </div>
        </div>
        <ScopeSelector
          userRole={userRole}
          value={scope}
          onValueChange={setScope}
        />
      </div>

      {scope === "organization" ? (
        <AnalyticsTabsWrapper teamMembers={teamMembers} userRole={userRole}>
          <AdminAnalyticsDashboard />
        </AnalyticsTabsWrapper>
      ) : (
        <AnalyticsTabsWrapper teamMembers={teamMembers} userRole={userRole}>
          <UnifiedAnalyticsDashboard
            initialVideoMetrics={initialVideoMetrics}
            initialVideoTrends={initialVideoTrends}
            initialLoStats={initialLoStats}
            initialReviewSummary={initialReviewSummary}
            initialResponseAnalytics={initialResponseAnalytics}
            teamMembers={teamMembers}
            userRole={userRole}
          />
        </AnalyticsTabsWrapper>
      )}
    </div>
  );
}
