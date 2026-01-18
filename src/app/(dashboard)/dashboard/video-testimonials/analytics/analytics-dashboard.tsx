"use client";

import { useState, useCallback, useEffect, useMemo, memo } from "react";
import {
  Send,
  Eye,
  CheckCircle,
  ThumbsUp,
  Globe,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  Users,
  BarChart3,
  ArrowRight,
  XCircle,
  AlertTriangle,
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
} from "recharts";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import type {
  VideoTestimonialFunnelMetrics,
  VideoTestimonialTrendDataPoint,
  LoanOfficerVideoStats,
} from "@/lib/video-testimonials/analytics-actions";
import {
  getVideoTestimonialFunnelMetrics,
  getVideoTestimonialTrends,
  getVideoTestimonialStatsByLoanOfficer,
} from "@/lib/video-testimonials/analytics-actions";

// ============================================================================
// Types
// ============================================================================

interface LoanOfficer {
  id: string;
  fullName: string;
  email: string;
}

interface Props {
  initialMetrics: VideoTestimonialFunnelMetrics | null;
  initialTrends: VideoTestimonialTrendDataPoint[];
  initialLoStats: LoanOfficerVideoStats[];
  loanOfficers: LoanOfficer[];
  userRole: "admin" | "manager" | "loan_officer";
}

type DateRange = "7d" | "30d" | "90d" | "this_month" | "last_month" | "all";
type TrendPeriod = "daily" | "weekly" | "monthly";

// ============================================================================
// Funnel Stage Card Component
// ============================================================================

const FunnelStageCard = memo(function FunnelStageCard({
  label,
  value,
  icon: Icon,
  color,
  conversionRate,
  previousValue,
  description,
}: {
  label: string;
  value: number;
  icon: typeof Send;
  color: string;
  conversionRate?: number;
  previousValue?: number;
  description?: string;
}) {
  const percentChange = previousValue !== undefined && previousValue > 0
    ? Math.round(((value - previousValue) / previousValue) * 100)
    : null;

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold tracking-tight">{value.toLocaleString()}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={cn("rounded-full p-2.5", color)} aria-hidden="true">
            <Icon className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
        </div>
        {conversionRate !== undefined && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Conversion:</span>
            <Badge variant="outline" className="font-mono">
              {conversionRate}%
            </Badge>
          </div>
        )}
        {percentChange !== null && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            {percentChange >= 0 ? (
              <>
                <TrendingUp className="h-3.5 w-3.5 text-repwell-sage-200" aria-hidden="true" />
                <span className="sr-only">Increased by</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-3.5 w-3.5 text-red-600" aria-hidden="true" />
                <span className="sr-only">Decreased by</span>
              </>
            )}
            <span className={percentChange >= 0 ? "text-repwell-sage-200" : "text-red-600"}>
              {percentChange > 0 ? "+" : ""}{percentChange}%
            </span>
            <span className="text-muted-foreground">vs previous period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// ============================================================================
// Funnel Visualization Component
// ============================================================================

const FunnelVisualization = memo(function FunnelVisualization({ metrics }: { metrics: VideoTestimonialFunnelMetrics }) {
  const stages = useMemo(() => [
    { label: "Sent", value: metrics.sent, color: "bg-repwell-teal-300" },
    { label: "Opened", value: metrics.opened, color: "bg-repwell-sage-200" },
    { label: "Completed", value: metrics.completed, color: "bg-primary" },
    { label: "Approved", value: metrics.approved, color: "bg-repwell-sage-200" },
    { label: "Published", value: metrics.published, color: "bg-repwell-teal-400" },
  ], [metrics.sent, metrics.opened, metrics.completed, metrics.approved, metrics.published]);

  const maxValue = Math.max(...stages.map(s => s.value), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Funnel Overview</CardTitle>
        <CardDescription>
          Video testimonial journey from request to publication
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4" role="list" aria-label="Video testimonial funnel stages">
          {stages.map((stage, index) => {
            const percentage = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
            const nextStage = stages[index + 1];
            const conversionToNext = nextStage && stage.value > 0
              ? Math.round((nextStage.value / stage.value) * 100)
              : null;

            return (
              <div key={stage.label} className="space-y-2" role="listitem">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stage.label}</span>
                  <span className="font-mono text-muted-foreground">
                    {stage.value.toLocaleString()}
                  </span>
                </div>
                <div className="relative">
                  <Progress
                    value={percentage}
                    className="h-8"
                    aria-label={`${stage.label} progress: ${stage.value} of ${maxValue}`}
                  />
                  <div
                    className={cn("absolute inset-y-0 left-0 rounded-full", stage.color)}
                    style={{ width: `${percentage}%` }}
                    aria-hidden="true"
                  />
                </div>
                {conversionToNext !== null && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    <span>{conversionToNext}% convert to {nextStage.label}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Additional metrics */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4">
          <div className="flex items-center gap-2 text-sm">
            <XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
            <span className="text-muted-foreground">Expired:</span>
            <span className="font-medium">{metrics.expiredCount}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
            <span className="text-muted-foreground">Cancelled:</span>
            <span className="font-medium">{metrics.cancelledCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// ============================================================================
// Conversion Rate Cards Component
// ============================================================================

const ConversionRateCards = memo(function ConversionRateCards({ metrics }: { metrics: VideoTestimonialFunnelMetrics }) {
  const rates = useMemo(() => [
    {
      label: "Sent to Opened",
      value: metrics.sentToOpenedRate,
      description: "Email open rate",
      target: 60,
    },
    {
      label: "Opened to Completed",
      value: metrics.openedToCompletedRate,
      description: "Video completion rate",
      target: 40,
    },
    {
      label: "Completed to Approved",
      value: metrics.completedToApprovedRate,
      description: "Approval rate",
      target: 80,
    },
    {
      label: "Approved to Published",
      value: metrics.approvedToPublishedRate,
      description: "Publication rate",
      target: 90,
    },
  ], [metrics.sentToOpenedRate, metrics.openedToCompletedRate, metrics.completedToApprovedRate, metrics.approvedToPublishedRate]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list" aria-label="Conversion rates">
      {rates.map((rate) => {
        const isAboveTarget = rate.value >= rate.target;
        return (
          <Card key={rate.label} role="listitem">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {rate.label}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{rate.value}%</span>
                  {isAboveTarget ? (
                    <Badge variant="secondary" className="bg-repwell-sage-200/20 text-repwell-sage-200 border border-repwell-sage-200/30">
                      On track
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 border border-amber-200">
                      Below target
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{rate.description}</p>
                <Progress
                  value={Math.min(rate.value, 100)}
                  className={cn("h-2", isAboveTarget ? "[&>div]:bg-repwell-sage-200" : "[&>div]:bg-amber-500")}
                  aria-label={`${rate.label}: ${rate.value}% of ${rate.target}% target`}
                />
                <p className="text-xs text-muted-foreground">
                  Target: {rate.target}%
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});

// ============================================================================
// Time Metrics Cards Component
// ============================================================================

const TimeMetricsCards = memo(function TimeMetricsCards({ metrics }: { metrics: VideoTestimonialFunnelMetrics }) {
  const formatTime = (hours: number | null) => {
    if (hours === null) return "N/A";
    if (hours < 1) return "< 1 hour";
    if (hours < 24) return `${hours} hours`;
    const days = Math.round(hours / 24);
    return `${days} day${days !== 1 ? "s" : ""}`;
  };

  const timeMetrics = useMemo(() => [
    {
      label: "Avg. Time to Open",
      value: metrics.averageTimeToOpen,
      icon: Eye,
      description: "From sent to first open",
    },
    {
      label: "Avg. Time to Complete",
      value: metrics.averageTimeToComplete,
      icon: CheckCircle,
      description: "From open to video submission",
    },
    {
      label: "Avg. Approval Time",
      value: metrics.averageApprovalTime,
      icon: ThumbsUp,
      description: "From submission to approval",
    },
  ], [metrics.averageTimeToOpen, metrics.averageTimeToComplete, metrics.averageApprovalTime]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" aria-hidden="true" />
          Processing Times
        </CardTitle>
        <CardDescription>Average time between funnel stages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3" role="list" aria-label="Processing time metrics">
          {timeMetrics.map((metric) => (
            <div
              key={metric.label}
              className="flex items-start gap-3 rounded-lg border p-4"
              role="listitem"
            >
              <metric.icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-medium">{metric.label}</p>
                <p className="text-2xl font-bold">{formatTime(metric.value)}</p>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

// ============================================================================
// Trend Chart Component
// ============================================================================

const TrendChart = memo(function TrendChart({
  data,
  period,
}: {
  data: VideoTestimonialTrendDataPoint[];
  period: TrendPeriod;
}) {
  // Format data for chart (memoized)
  const chartData = useMemo(() => data.map((d) => ({
    ...d,
    date: format(
      new Date(d.date),
      period === "monthly" ? "MMM yyyy" : period === "weekly" ? "MMM d" : "MMM d"
    ),
  })), [data, period]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
            Funnel Trends
          </CardTitle>
          <CardDescription>Video testimonial activity over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No trend data available yet</p>
              <p className="text-xs">Create video testimonial requests to see trends</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" aria-hidden="true" />
          Funnel Trends
        </CardTitle>
        <CardDescription>Video testimonial activity over time</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Accessible data table for screen readers */}
        <div className="sr-only">
          <table>
            <caption>Video testimonial trends data</caption>
            <thead>
              <tr>
                <th>Date</th>
                <th>Sent</th>
                <th>Completed</th>
                <th>Published</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((point) => (
                <tr key={point.date}>
                  <td>{point.date}</td>
                  <td>{point.sent}</td>
                  <td>{point.completed}</td>
                  <td>{point.published}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="h-[300px] w-full" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradient-sent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#52796f" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#52796f" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradient-completed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#84a98c" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#84a98c" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradient-published" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#52796f" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#52796f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                labelStyle={{ color: "hsl(var(--popover-foreground))" }}
              />
              <Legend verticalAlign="top" height={36} />
              <Area
                type="monotone"
                dataKey="sent"
                name="Sent"
                stroke="#52796f"
                strokeWidth={2}
                fill="url(#gradient-sent)"
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="completed"
                name="Completed"
                stroke="#84a98c"
                strokeWidth={2}
                fill="url(#gradient-completed)"
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="published"
                name="Published"
                stroke="#52796f"
                strokeWidth={2}
                fill="url(#gradient-published)"
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

// ============================================================================
// Loan Officer Leaderboard Component
// ============================================================================

const LoanOfficerLeaderboard = memo(function LoanOfficerLeaderboard({ stats }: { stats: LoanOfficerVideoStats[] }) {
  if (stats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" aria-hidden="true" />
            Team Performance
          </CardTitle>
          <CardDescription>Video testimonial stats by loan officer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No team data available</p>
              <p className="text-xs">Loan officers will appear here once they have video requests</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" aria-hidden="true" />
          Team Performance
        </CardTitle>
        <CardDescription>Video testimonial stats by loan officer</CardDescription>
      </CardHeader>
      <CardContent>
        <Table aria-label="Team performance statistics by loan officer">
          <caption className="sr-only">
            Video testimonial statistics by loan officer showing requests sent, opened, completed, published, and conversion rates
          </caption>
          <TableHeader>
            <TableRow>
              <TableHead>Loan Officer</TableHead>
              <TableHead className="text-center">Sent</TableHead>
              <TableHead className="text-center">Opened</TableHead>
              <TableHead className="text-center">Completed</TableHead>
              <TableHead className="text-center">Published</TableHead>
              <TableHead className="text-right">Conversion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.slice(0, 10).map((lo, index) => (
              <TableRow key={lo.loanOfficerId}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium" aria-hidden="true">
                      {index + 1}
                    </span>
                    <span className="font-medium">{lo.loanOfficerName}</span>
                    <span className="sr-only">, ranked {index + 1}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">{lo.sent}</TableCell>
                <TableCell className="text-center">{lo.opened}</TableCell>
                <TableCell className="text-center">{lo.completed}</TableCell>
                <TableCell className="text-center">{lo.published}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={lo.conversionRate >= 30 ? "default" : "secondary"}>
                    {lo.conversionRate}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
});

// ============================================================================
// Main Dashboard Component
// ============================================================================

export function VideoTestimonialAnalyticsDashboard({
  initialMetrics,
  initialTrends,
  initialLoStats,
  loanOfficers,
  userRole,
}: Props) {
  const [metrics, setMetrics] = useState<VideoTestimonialFunnelMetrics | null>(initialMetrics);
  const [trends, setTrends] = useState<VideoTestimonialTrendDataPoint[]>(initialTrends);
  const [loStats, setLoStats] = useState<LoanOfficerVideoStats[]>(initialLoStats);
  const [isLoading, setIsLoading] = useState(false);

  // Filter state
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>("daily");
  const [selectedLoanOfficer, setSelectedLoanOfficer] = useState<string>("all");

  const canViewTeamStats = userRole === "admin" || userRole === "manager";

  // Calculate date range
  const getDateRange = useCallback((range: DateRange) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (range) {
      case "7d":
        startDate = subDays(now, 7);
        break;
      case "30d":
        startDate = subDays(now, 30);
        break;
      case "90d":
        startDate = subDays(now, 90);
        break;
      case "this_month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "last_month": {
        const lastMonth = subMonths(now, 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        break;
      }
      case "all":
      default:
        return { startDate: undefined, endDate: undefined };
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }, []);

  // Fetch data with filters
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getDateRange(dateRange);
      const loFilter = selectedLoanOfficer !== "all" ? selectedLoanOfficer : undefined;

      const [metricsResult, trendsResult, loStatsResult] = await Promise.all([
        getVideoTestimonialFunnelMetrics({
          startDate,
          endDate,
          loanOfficerId: loFilter,
        }),
        getVideoTestimonialTrends({
          startDate,
          endDate,
          period: trendPeriod,
          loanOfficerId: loFilter,
        }),
        canViewTeamStats && !loFilter
          ? getVideoTestimonialStatsByLoanOfficer({ startDate, endDate })
          : Promise.resolve({ success: true, data: [] }),
      ]);

      if (metricsResult.success && metricsResult.data) {
        setMetrics(metricsResult.data);
      }
      if (trendsResult.success && trendsResult.data) {
        setTrends(trendsResult.data);
      }
      if (loStatsResult.success && loStatsResult.data) {
        setLoStats(loStatsResult.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, trendPeriod, selectedLoanOfficer, canViewTeamStats, getDateRange]);

  // Fetch data when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
          <h3 className="mt-4 text-lg font-semibold">No analytics data</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Start sending video testimonial requests to see analytics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4" role="group" aria-label="Analytics filters">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
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
              <Select value={trendPeriod} onValueChange={(v) => setTrendPeriod(v as TrendPeriod)}>
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

            {canViewTeamStats && loanOfficers.length > 0 && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Select
                  value={selectedLoanOfficer}
                  onValueChange={setSelectedLoanOfficer}
                >
                  <SelectTrigger className="w-[200px]" aria-label="Filter by loan officer">
                    <SelectValue placeholder="All loan officers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All loan officers</SelectItem>
                    {loanOfficers.map((lo) => (
                      <SelectItem key={lo.id} value={lo.id}>
                        {lo.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={fetchData}
              disabled={isLoading}
              aria-label="Refresh analytics data"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} aria-hidden="true" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" role="list" aria-label="Funnel summary statistics">
        <FunnelStageCard
          label="Sent"
          value={metrics.sent}
          icon={Send}
          color="bg-repwell-teal-300"
          description="Total requests sent"
        />
        <FunnelStageCard
          label="Opened"
          value={metrics.opened}
          icon={Eye}
          color="bg-repwell-sage-200"
          conversionRate={metrics.sentToOpenedRate}
        />
        <FunnelStageCard
          label="Completed"
          value={metrics.completed}
          icon={CheckCircle}
          color="bg-primary"
          conversionRate={metrics.openedToCompletedRate}
        />
        <FunnelStageCard
          label="Approved"
          value={metrics.approved}
          icon={ThumbsUp}
          color="bg-repwell-sage-200"
          conversionRate={metrics.completedToApprovedRate}
        />
        <FunnelStageCard
          label="Published"
          value={metrics.published}
          icon={Globe}
          color="bg-repwell-teal-400"
          conversionRate={metrics.approvedToPublishedRate}
        />
      </div>

      {/* Overall Conversion */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Overall Conversion Rate
              </p>
              <p className="text-4xl font-bold tracking-tight">
                {metrics.overallConversionRate}%
              </p>
              <p className="text-sm text-muted-foreground">
                From sent request to published testimonial
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{metrics.pending}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-[#c47c7c]">{metrics.rejected}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="funnel" className="space-y-6">
        <TabsList>
          <TabsTrigger value="funnel">Funnel Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          {canViewTeamStats && <TabsTrigger value="team">Team Performance</TabsTrigger>}
        </TabsList>

        <TabsContent value="funnel" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <FunnelVisualization metrics={metrics} />
            <TimeMetricsCards metrics={metrics} />
          </div>
          <ConversionRateCards metrics={metrics} />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <TrendChart data={trends} period={trendPeriod} />
        </TabsContent>

        {canViewTeamStats && (
          <TabsContent value="team" className="space-y-6">
            <LoanOfficerLeaderboard stats={loStats} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
