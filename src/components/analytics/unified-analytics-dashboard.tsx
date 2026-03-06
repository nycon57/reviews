"use client";

import { memo } from "react";
import {
  PaperPlaneRight,
  Eye,
  CheckCircle,
  ThumbsUp,
  Globe,
  TrendUp,
  ArrowsClockwise,
  CalendarDots,
  Users,
  ChartBar,
  Star,
  Chats,
  Funnel,
  VideoCamera,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { AnalyticsErrorBoundary } from "./analytics-error-boundary";

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
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: typeof Star;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-teal-300/10" aria-hidden="true">
        <Icon className="h-5 w-5 text-repwell-teal-300" aria-hidden="true" />
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight text-heading">{value}</p>
        <p className="text-xs text-muted-foreground">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
});

// ============================================================================
// Dashboard Content (consumes context)
// ============================================================================

function DashboardContent() {
  const { state, actions } = useAnalytics();

  return (
    <div className="space-y-6">
      {/* Filters */}
      <AnalyticsErrorBoundary fallbackMessage="The filter controls failed to load.">
        <Card className="border border-border shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <Funnel className="h-5 w-5 text-repwell-teal-300" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Filters</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4" role="group" aria-label="Analytics filters">
              <div className="flex items-center gap-2">
                <CalendarDots className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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
                <ChartBar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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
                <ArrowsClockwise className={cn("h-4 w-4", state.isLoading && "animate-spin")} aria-hidden="true" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </AnalyticsErrorBoundary>

      {/* Summary Stats */}
      <AnalyticsErrorBoundary fallbackMessage="The summary statistics failed to load.">
        <section aria-labelledby="summary-stats-heading">
          <h2 id="summary-stats-heading" className="sr-only">Summary Statistics</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <StatCard title="Total Reviews" value={state.reviewSummary.totalReviews} subtitle="All time" icon={Star} />
            <StatCard title="Average Rating" value={state.reviewSummary.averageRating.toFixed(1)} subtitle="Out of 5 stars" icon={Star} />
            <StatCard title="Response Rate" value={`${state.reviewSummary.responseRate}%`} subtitle="Last 30 days" icon={Chats} />
            <StatCard title="NPS Score" value={state.reviewSummary.npsScore} subtitle={state.reviewSummary.npsScore >= 50 ? "Excellent" : state.reviewSummary.npsScore >= 0 ? "Good" : "Needs work"} icon={TrendUp} />
            <StatCard title="Video Requests" value={state.videoMetrics?.sent || 0} subtitle="Total sent" icon={PaperPlaneRight} />
            <StatCard title="Video Conversion" value={`${state.videoMetrics?.overallConversionRate || 0}%`} subtitle="Sent to published" icon={Globe} />
          </div>
        </section>
      </AnalyticsErrorBoundary>

      {/* Review Analytics Section */}
      <AnalyticsErrorBoundary fallbackMessage="The review analytics section failed to load.">
        <section aria-labelledby="review-analytics-heading">
          <h2 id="review-analytics-heading" className="sr-only">Review Analytics</h2>
          <ResponseAnalyticsSection analytics={state.responseAnalytics} />
        </section>
      </AnalyticsErrorBoundary>

      {/* Video Testimonial Section */}
      <AnalyticsErrorBoundary fallbackMessage="The video testimonial analytics section failed to load.">
        <section aria-labelledby="video-analytics-heading">
          {state.videoMetrics ? (
            <Card className="border border-border shadow-soft">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                    <VideoCamera className="h-5 w-5 text-repwell-teal-300" aria-hidden="true" />
                  </div>
                  <div>
                    <CardTitle id="video-analytics-heading">Video Testimonial Analytics</CardTitle>
                    <CardDescription>Track your video testimonial funnel performance</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" role="list" aria-label="Video funnel statistics">
                  <FunnelStageCard label="Sent" value={state.videoMetrics.sent} icon={PaperPlaneRight} description="Total requests sent" />
                  <FunnelStageCard label="Opened" value={state.videoMetrics.opened} icon={Eye} conversionRate={state.videoMetrics.sentToOpenedRate} />
                  <FunnelStageCard label="Completed" value={state.videoMetrics.completed} icon={CheckCircle} conversionRate={state.videoMetrics.openedToCompletedRate} />
                  <FunnelStageCard label="Approved" value={state.videoMetrics.approved} icon={ThumbsUp} conversionRate={state.videoMetrics.completedToApprovedRate} />
                  <FunnelStageCard label="Published" value={state.videoMetrics.published} icon={Globe} conversionRate={state.videoMetrics.approvedToPublishedRate} />
                </div>

                <Card className="border border-border shadow-soft">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                        <TrendUp className="h-5 w-5 text-repwell-teal-300" aria-hidden="true" />
                      </div>
                      <div>
                        <CardTitle>Overall Video Conversion Rate</CardTitle>
                        <CardDescription>From sent request to published testimonial</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-4xl font-bold tracking-tight">{state.videoMetrics.overallConversionRate}%</p>
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
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <ChartBar className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
                  <h3 id="video-analytics-heading" className="mt-4 text-lg font-semibold">No video analytics data</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Start sending video testimonial requests to see analytics</p>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </AnalyticsErrorBoundary>

      {/* Team Performance */}
      {state.canViewTeamStats && (
        <AnalyticsErrorBoundary fallbackMessage="The team performance section failed to load.">
          <section aria-labelledby="team-performance-heading">
            <h2 id="team-performance-heading" className="sr-only">Team Performance</h2>
            <TeamPerformanceTable stats={state.loStats} />
          </section>
        </AnalyticsErrorBoundary>
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
