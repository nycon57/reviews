"use client";

import { memo } from "react";
import {
  PaperPlaneRightIcon as Send,
  EyeIcon as Eye,
  CheckCircleIcon as CheckCircle,
  ThumbsUpIcon as ThumbsUp,
  GlobeIcon as Globe,
  TrendUpIcon as TrendingUp,
  ArrowsClockwiseIcon as RefreshCw,
  CalendarIcon as Calendar,
  UsersIcon as Users,
  ChartBarIcon as BarChart3,
  StarIcon as Star,
  ChatsIcon as MessageSquare,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  VideoTestimonialFunnelMetrics,
  VideoTestimonialTrendDataPoint,
  UserVideoStats,
} from "@/lib/video-testimonials/analytics-actions";
import type { ResponseAnalytics } from "@/lib/reviews/response-actions";
import {
  AnalyticsProvider,
  useAnalytics,
  type DateRange,
  type TrendPeriod,
} from "./analytics-context";
import { FunnelStageCard, FunnelVisualization, ConversionRateCards, TimeMetricsCards } from "./funnel-chart";
import { TrendChart } from "./trend-chart";
import { ResponseAnalyticsSection } from "./response-analytics-section";
import { TeamPerformanceTable } from "./user-stats-table";

// ============================================================================
// Types
// ============================================================================

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

interface Props {
  initialVideoMetrics: VideoTestimonialFunnelMetrics | null;
  initialVideoTrends: VideoTestimonialTrendDataPoint[];
  initialLoStats: UserVideoStats[];
  initialReviewSummary: ReviewSummary;
  initialResponseAnalytics: ResponseAnalytics | null;
  teamMembers: TeamMember[];
  userRole: "admin" | "manager" | "user";
}

// ============================================================================
// Stat Card Component
// ============================================================================

const StatCard = memo(function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: typeof Star;
  iconColor?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={cn("rounded-full p-2.5", iconColor || "bg-repwell-teal-300")} aria-hidden="true">
            <Icon className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// ============================================================================
// Dashboard Content (consumes context)
// ============================================================================

function DashboardContent() {
  const { state, actions } = useAnalytics();

  return (
    <div className="space-y-8">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4" role="group" aria-label="Analytics filters">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Select value={state.dateRange} onValueChange={(v) => actions.setDateRange(v as DateRange)}>
                <SelectTrigger className="w-[150px]" aria-label="Select date range">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="this_month">This month</SelectItem>
                  <SelectItem value="last_month">Last month</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Select value={state.trendPeriod} onValueChange={(v) => actions.setTrendPeriod(v as TrendPeriod)}>
                <SelectTrigger className="w-[130px]" aria-label="Select trend period">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {state.canViewTeamStats && state.teamMembers.length > 0 && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Select value={state.selectedMember} onValueChange={actions.setSelectedMember}>
                  <SelectTrigger className="w-[200px]" aria-label="Filter by team member">
                    <SelectValue placeholder="All team members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All team members</SelectItem>
                    {state.teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>{member.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button variant="outline" size="icon" onClick={actions.fetchData} disabled={state.isLoading} aria-label="Refresh analytics data">
              <RefreshCw className={cn("h-4 w-4", state.isLoading && "animate-spin")} aria-hidden="true" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <section aria-labelledby="summary-stats-heading">
        <h2 id="summary-stats-heading" className="sr-only">Summary Statistics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <StatCard title="Total Reviews" value={state.reviewSummary.totalReviews} subtitle="All time" icon={Star} iconColor="bg-amber-500" />
          <StatCard title="Average Rating" value={state.reviewSummary.averageRating.toFixed(1)} subtitle="Out of 5 stars" icon={Star} iconColor="bg-repwell-sage-200" />
          <StatCard title="Response Rate" value={`${state.reviewSummary.responseRate}%`} subtitle="Last 30 days" icon={MessageSquare} iconColor="bg-repwell-teal-300" />
          <StatCard title="NPS Score" value={state.reviewSummary.npsScore} subtitle={state.reviewSummary.npsScore >= 50 ? "Excellent" : state.reviewSummary.npsScore >= 0 ? "Good" : "Needs work"} icon={TrendingUp} iconColor="bg-primary" />
          <StatCard title="Video Requests" value={state.videoMetrics?.sent || 0} subtitle="Total sent" icon={Send} iconColor="bg-repwell-teal-300" />
          <StatCard title="Video Conversion" value={`${state.videoMetrics?.overallConversionRate || 0}%`} subtitle="Sent to published" icon={Globe} iconColor="bg-repwell-teal-400" />
        </div>
      </section>

      {/* Review Analytics Section */}
      <section aria-labelledby="review-analytics-heading">
        <div className="mb-4">
          <h2 id="review-analytics-heading" className="text-lg font-semibold">Review Analytics</h2>
          <p className="text-sm text-muted-foreground">Track your review response performance and engagement</p>
        </div>
        <ResponseAnalyticsSection analytics={state.responseAnalytics} />
      </section>

      {/* Video Testimonial Section */}
      <section aria-labelledby="video-analytics-heading">
        <div className="mb-4">
          <h2 id="video-analytics-heading" className="text-lg font-semibold">Video Testimonial Analytics</h2>
          <p className="text-sm text-muted-foreground">Track your video testimonial funnel performance</p>
        </div>

        {state.videoMetrics ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" role="list" aria-label="Video funnel statistics">
              <FunnelStageCard label="Sent" value={state.videoMetrics.sent} icon={Send} color="bg-repwell-teal-300" description="Total requests sent" />
              <FunnelStageCard label="Opened" value={state.videoMetrics.opened} icon={Eye} color="bg-repwell-sage-200" conversionRate={state.videoMetrics.sentToOpenedRate} />
              <FunnelStageCard label="Completed" value={state.videoMetrics.completed} icon={CheckCircle} color="bg-primary" conversionRate={state.videoMetrics.openedToCompletedRate} />
              <FunnelStageCard label="Approved" value={state.videoMetrics.approved} icon={ThumbsUp} color="bg-repwell-sage-200" conversionRate={state.videoMetrics.completedToApprovedRate} />
              <FunnelStageCard label="Published" value={state.videoMetrics.published} icon={Globe} color="bg-repwell-teal-400" conversionRate={state.videoMetrics.approvedToPublishedRate} />
            </div>

            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Overall Video Conversion Rate</p>
                    <p className="text-4xl font-bold tracking-tight">{state.videoMetrics.overallConversionRate}%</p>
                    <p className="text-sm text-muted-foreground">From sent request to published testimonial</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Pending Review</p>
                      <p className="text-2xl font-bold">{state.videoMetrics.pending}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Rejected</p>
                      <p className="text-2xl font-bold text-[#c47c7c]">{state.videoMetrics.rejected}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <FunnelVisualization metrics={state.videoMetrics} />
              <TimeMetricsCards metrics={state.videoMetrics} />
            </div>

            <ConversionRateCards metrics={state.videoMetrics} />
            <TrendChart data={state.videoTrends} period={state.trendPeriod} />
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-semibold">No video analytics data</h3>
                <p className="mt-1 text-sm text-muted-foreground">Start sending video testimonial requests to see analytics</p>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Team Performance */}
      {state.canViewTeamStats && (
        <section aria-labelledby="team-performance-heading">
          <div className="mb-4">
            <h2 id="team-performance-heading" className="text-lg font-semibold">Team Performance</h2>
            <p className="text-sm text-muted-foreground">Video testimonial performance by team member</p>
          </div>
          <TeamPerformanceTable stats={state.loStats} />
        </section>
      )}
    </div>
  );
}

// ============================================================================
// Main Export (wraps with provider)
// ============================================================================

export function UnifiedAnalyticsDashboard(props: Props) {
  return (
    <AnalyticsProvider
      initialVideoMetrics={props.initialVideoMetrics}
      initialVideoTrends={props.initialVideoTrends}
      initialLoStats={props.initialLoStats}
      initialReviewSummary={props.initialReviewSummary}
      initialResponseAnalytics={props.initialResponseAnalytics}
      teamMembers={props.teamMembers}
      userRole={props.userRole}
    >
      <DashboardContent />
    </AnalyticsProvider>
  );
}
