import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAccessContext, hasProAccess } from "@/lib/access";
import {
  getVideoTestimonialFunnelMetrics,
  getVideoTestimonialTrends,
  getVideoTestimonialStatsByUser,
} from "@/lib/video-testimonials/analytics-actions";
import { getUsersForVideoRequests } from "@/lib/video-testimonials/actions";
import { getResponseAnalytics } from "@/lib/reviews/response-actions";
import { AnalyticsPageClient } from "@/components/analytics/analytics-page-client";
import { RequestFunnelCard } from "@/components/analytics/request-funnel-card";
import { ChannelEffectivenessCard, PerformanceScorecard } from "@/components/insights";
import { getChannelEffectiveness, getLOPerformanceScorecard } from "@/lib/ai";
import { getRequestFunnelRollup } from "@/lib/analytics/request-funnel";
import { CardSkeleton } from "@/components/shared";

export const metadata = {
  title: "Analytics | RepWell",
  description: "Track your performance metrics and insights",
};

async function PerformanceScorecardSection({ userId }: { userId: string }) {
  const result = await getLOPerformanceScorecard(userId);

  if (!result.success || !result.data) {
    return null;
  }

  return <PerformanceScorecard data={result.data} />;
}

async function ChannelEffectivenessSection({ userId }: { userId?: string }) {
  const result = await getChannelEffectiveness(userId);

  if (!result.success || !result.data) {
    return null;
  }

  return <ChannelEffectivenessCard data={result.data} />;
}

async function RequestFunnelSection() {
  const rollup = await getRequestFunnelRollup(30);
  return <RequestFunnelCard initialRollup={rollup} />;
}

export default async function AnalyticsPage() {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");

  const userRole = ctx.role;
  const organizationId = ctx.organizationId;

  const supabase = createAdminClient();

  // Fetch review summary data
  const { data: reviewsData, count: totalReviews } = await supabase
    .from("reviews")
    .select("rating", { count: "exact" })
    .eq("organization_id", organizationId)
    .eq("status", "approved");

  // Calculate review metrics
  const ratings = reviewsData?.map(r => r.rating).filter((r): r is number => r !== null) || [];
  const averageRating = ratings.length > 0
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : 0;

  // Calculate NPS (simplified - based on ratings where 9-10 = promoters, 7-8 = passive, 1-6 = detractors)
  // Mapping 5-star scale: 5 = promoter, 4 = passive, 1-3 = detractor
  const promoters = ratings.filter(r => r === 5).length;
  const detractors = ratings.filter(r => r <= 3).length;
  const npsScore = ratings.length > 0
    ? Math.round(((promoters - detractors) / ratings.length) * 100)
    : 0;

  // Fetch all data in parallel
  const [
    videoMetricsResult,
    videoTrendsResult,
    userStatsResult,
    usersResult,
    responseAnalyticsResult,
  ] = await Promise.all([
    getVideoTestimonialFunnelMetrics(),
    getVideoTestimonialTrends({ period: "daily" }),
    userRole !== "user"
      ? getVideoTestimonialStatsByUser()
      : Promise.resolve({ success: true, data: [] }),
    userRole !== "user"
      ? getUsersForVideoRequests()
      : Promise.resolve({ success: true, data: [] }),
    getResponseAnalytics(),
  ]);

  const videoMetrics = videoMetricsResult.success && videoMetricsResult.data ? videoMetricsResult.data : null;
  const videoTrends = videoTrendsResult.success && videoTrendsResult.data ? videoTrendsResult.data : [];
  const userStats = userStatsResult.success && userStatsResult.data ? userStatsResult.data : [];
  const users = usersResult.success && usersResult.data ? usersResult.data : [];
  const responseAnalytics = responseAnalyticsResult.success && responseAnalyticsResult.data
    ? responseAnalyticsResult.data
    : null;

  // Calculate response rate from response analytics if available
  const responseRate = responseAnalytics?.responseRate || 0;

  const reviewSummary = {
    totalReviews: totalReviews || 0,
    averageRating: Math.round(averageRating * 10) / 10,
    responseRate: Math.round(responseRate * 10) / 10,
    npsScore,
  };

  const isPro = hasProAccess(ctx);
  const channelUserId = userRole === "user" ? ctx.userId : undefined;

  return (
    <>
      <AnalyticsPageClient
        userRole={userRole}
        userId={ctx.userId}
        initialVideoMetrics={videoMetrics}
        initialVideoTrends={videoTrends}
        initialLoStats={userStats}
        initialReviewSummary={reviewSummary}
        initialResponseAnalytics={responseAnalytics}
        teamMembers={users}
      />
      <div className="mt-6">
        <Suspense fallback={<CardSkeleton className="h-[350px]" />}>
          <RequestFunnelSection />
        </Suspense>
      </div>
      {isPro && (
        <div className="mt-6">
          <Suspense fallback={<CardSkeleton className="h-[350px]" />}>
            <PerformanceScorecardSection userId={ctx.userId} />
          </Suspense>
        </div>
      )}
      {isPro && (
        <div className="mt-6">
          <Suspense fallback={<CardSkeleton className="h-[400px]" />}>
            <ChannelEffectivenessSection userId={channelUserId} />
          </Suspense>
        </div>
      )}
    </>
  );
}
