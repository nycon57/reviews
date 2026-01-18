import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getVideoTestimonialFunnelMetrics,
  getVideoTestimonialTrends,
  getVideoTestimonialStatsByLoanOfficer,
} from "@/lib/video-testimonials/analytics-actions";
import { getLoanOfficersForVideoRequests } from "@/lib/video-testimonials/actions";
import { VideoTestimonialAnalyticsDashboard } from "./analytics-dashboard";

export const metadata = {
  title: "Video Testimonial Analytics | RepWell",
  description: "Track video testimonial funnel metrics, conversion rates, and trends",
};

export default async function VideoTestimonialAnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user role
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = (userData?.role || "loan_officer") as "admin" | "manager" | "loan_officer";

  // Fetch initial data in parallel
  const [metricsResult, trendsResult, loStatsResult, loResult] = await Promise.all([
    getVideoTestimonialFunnelMetrics(),
    getVideoTestimonialTrends({ period: "daily" }),
    userRole !== "loan_officer" ? getVideoTestimonialStatsByLoanOfficer() : Promise.resolve({ success: true, data: [] }),
    userRole !== "loan_officer" ? getLoanOfficersForVideoRequests() : Promise.resolve({ success: true, data: [] }),
  ]);

  const metrics = metricsResult.success && metricsResult.data ? metricsResult.data : null;
  const trends = trendsResult.success && trendsResult.data ? trendsResult.data : [];
  const loStats = loStatsResult.success && loStatsResult.data ? loStatsResult.data : [];
  const loanOfficers = loResult.success && loResult.data ? loResult.data : [];

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-repwell-teal-500">
          Video Testimonial Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Track your video testimonial funnel performance, conversion rates, and trends over time
        </p>
      </div>

      <VideoTestimonialAnalyticsDashboard
        initialMetrics={metrics}
        initialTrends={trends}
        initialLoStats={loStats}
        loanOfficers={loanOfficers}
        userRole={userRole}
      />
    </div>
  );
}
