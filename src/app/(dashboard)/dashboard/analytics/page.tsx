import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import {
  getVideoTestimonialFunnelMetrics,
  getVideoTestimonialTrends,
  getVideoTestimonialStatsByUser,
} from "@/lib/video-testimonials/analytics-actions";
import { getUsersForVideoRequests } from "@/lib/video-testimonials/actions";
import { getResponseAnalytics } from "@/lib/reviews/response-actions";
import { UnifiedAnalyticsDashboard } from "@/components/analytics";
import { AnalyticsTabsWrapper } from "@/components/analytics/analytics-tabs-wrapper";

export const metadata = {
  title: "Analytics | RepWell",
  description: "Track your performance metrics and insights",
};

export default async function AnalyticsPage() {
  const user = await unifiedGetUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = createAdminClient();

  // Get user role and organization info
  const { data: userData } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  const userRole = (userData?.role || "user") as "admin" | "manager" | "user";
  const organizationId = userData?.organization_id;

  if (!organizationId) {
    redirect("/login");
  }

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

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Track your performance metrics and insights
        </p>
      </div>

      <AnalyticsTabsWrapper teamMembers={users} userRole={userRole}>
        <UnifiedAnalyticsDashboard
          initialVideoMetrics={videoMetrics}
          initialVideoTrends={videoTrends}
          initialLoStats={userStats}
          initialReviewSummary={reviewSummary}
          initialResponseAnalytics={responseAnalytics}
          teamMembers={users}
          userRole={userRole}
        />
      </AnalyticsTabsWrapper>
    </div>
  );
}
