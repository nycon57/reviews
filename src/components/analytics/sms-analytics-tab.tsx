"use client";

import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  memo,
} from "react";
import {
  PaperPlaneRightIcon as Send,
  CheckCircleIcon as CheckCircle,
  CursorClickIcon as MousePointerClick,
  StarIcon as Star,
  CurrencyDollarIcon as DollarSign,
  ChartBarIcon as BarChart3,
  CalendarIcon as Calendar,
  ArrowsClockwiseIcon as RefreshCw,
  UsersIcon as Users,
  DownloadIcon as Download,
  ArrowRightIcon as ArrowRight,
  CaretUpDownIcon as ArrowUpDown,
  WarningIcon as AlertTriangle,
  EnvelopeIcon as Mail,
  ChatCircleDotsIcon as MessageCircle,
} from "@phosphor-icons/react";
import {
  BarChart,
  Bar,
  ComposedChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { subDays, subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { getSmsAnalytics, exportSmsAnalyticsCsv } from "@/lib/sms/analytics/actions";
import type {
  SmsAnalyticsData,
  SmsDailyVolume,
  SmsTemplatePerformanceRow,
  SmsLoLeaderboardRow,
  SmsOptOutTrend,
  SmsCostBreakdown,
  SmsTimeHeatmapCell,
  SmsChannelComparison,
} from "@/lib/sms/analytics/types";

// ============================================================================
// Types
// ============================================================================

type DateRange = "7d" | "30d" | "90d" | "this_month" | "last_month" | "all";

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
}

interface Props {
  teamMembers: TeamMember[];
  userRole: "admin" | "manager" | "user";
}

// ============================================================================
// Constants
// ============================================================================

const CHART_COLORS = {
  sent: "#52796f",
  delivered: "#84a98c",
  failed: "#c47c7c",
  clicked: "#6b9080",
  reviewed: "#52796f",
};

const CATEGORY_LABELS: Record<string, string> = {
  review_request: "Review Requests",
  follow_up: "Follow-ups",
  thank_you: "Thank You",
  video_request: "Video Requests",
  custom: "Custom",
};

const CATEGORY_COLORS = ["#52796f", "#84a98c", "#6b9080", "#354f52", "#a4c3b2"];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ============================================================================
// Utility functions
// ============================================================================

function getDateRangeValues(range: DateRange): { startDate?: string; endDate?: string } {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  switch (range) {
    case "7d": startDate = subDays(now, 7); break;
    case "30d": startDate = subDays(now, 30); break;
    case "90d": startDate = subDays(now, 90); break;
    case "this_month": startDate = startOfMonth(now); endDate = endOfMonth(now); break;
    case "last_month": {
      const lastMonth = subMonths(now, 1);
      startDate = startOfMonth(lastMonth);
      endDate = endOfMonth(lastMonth);
      break;
    }
    case "all":
    default:
      return {};
  }

  return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ============================================================================
// Skeleton Components
// ============================================================================

function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-60" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={{ height }} />
      </CardContent>
    </Card>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// KPI Cards
// ============================================================================

const KpiCard = memo(function KpiCard({
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
          <div className={cn("rounded-full p-2.5", iconColor ?? "bg-repwell-teal-300")} aria-hidden="true">
            <Icon className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

function SmsKpiCards({ data }: { data: SmsAnalyticsData }) {
  const { summary } = data;
  return (
    <section aria-labelledby="sms-kpi-heading">
      <h2 id="sms-kpi-heading" className="sr-only">SMS Summary Statistics</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <KpiCard
          title="Total Sent"
          value={formatNumber(summary.totalSent)}
          subtitle="Messages sent"
          icon={Send}
          iconColor="bg-repwell-teal-300"
        />
        <KpiCard
          title="Delivery Rate"
          value={formatPercent(summary.deliveryRate)}
          subtitle={`${formatNumber(summary.totalDelivered)} delivered`}
          icon={CheckCircle}
          iconColor="bg-repwell-sage-200"
        />
        <KpiCard
          title="Click Rate"
          value={formatPercent(summary.clickRate)}
          subtitle={`${formatNumber(summary.totalClicks)} clicks`}
          icon={MousePointerClick}
          iconColor="bg-[#6b9080]"
        />
        <KpiCard
          title="Conversion Rate"
          value={formatPercent(summary.conversionRate)}
          subtitle="Reviews per click"
          icon={Star}
          iconColor="bg-amber-500"
        />
        <KpiCard
          title="Total Cost"
          value={formatCurrency(summary.totalCostCents)}
          subtitle="SMS spend"
          icon={DollarSign}
          iconColor="bg-repwell-teal-400"
        />
        <KpiCard
          title="Cost Per Review"
          value={formatCurrency(summary.costPerReview)}
          subtitle={`${formatNumber(summary.totalReviewsGenerated)} reviews`}
          icon={Star}
          iconColor="bg-repwell-teal-300"
        />
      </div>
    </section>
  );
}

// ============================================================================
// Delivery Funnel
// ============================================================================

function DeliveryFunnel({ data }: { data: SmsAnalyticsData }) {
  const { funnel } = data;
  const stages = [
    { label: "Sent", value: funnel.sent, color: CHART_COLORS.sent },
    { label: "Delivered", value: funnel.delivered, rate: funnel.sentToDelivered, color: CHART_COLORS.delivered },
    { label: "Clicked", value: funnel.clicked, rate: funnel.deliveredToClicked, color: CHART_COLORS.clicked },
    { label: "Reviewed", value: funnel.reviewed, rate: funnel.clickedToReviewed, color: CHART_COLORS.reviewed },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Delivery Funnel</CardTitle>
        <CardDescription>Message journey from send to review</CardDescription>
      </CardHeader>
      <CardContent>
        {funnel.sent === 0 ? (
          <EmptyState message="No messages sent yet" />
        ) : (
          <div className="flex items-center justify-between gap-2">
            {stages.map((stage, i) => (
              <div key={stage.label} className="flex items-center gap-2 flex-1">
                <div className="flex-1 text-center">
                  <div
                    className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${stage.color}20` }}
                  >
                    <span className="text-lg font-bold" style={{ color: stage.color }}>
                      {formatNumber(stage.value)}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{stage.label}</p>
                  {stage.rate !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      {formatPercent(stage.rate)} from previous step
                    </p>
                  )}
                </div>
                {i < stages.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Daily Volume Chart
// ============================================================================

function DailyVolumeChart({ data }: { data: SmsDailyVolume[] }) {
  const chartData = useMemo(
    () => data.map((d) => ({
      ...d,
      date: format(new Date(d.date + "T00:00:00"), "MMM d"),
    })),
    [data]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Daily Volume</CardTitle>
        <CardDescription>Messages sent, delivered, and failed per day</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState message="No daily data available" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
              <Legend />
              <Bar dataKey="sent" name="Sent" fill={CHART_COLORS.sent} stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="delivered" name="Delivered" fill={CHART_COLORS.delivered} stackId="b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="failed" name="Failed" fill={CHART_COLORS.failed} stackId="c" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Template Performance Table
// ============================================================================

type TemplateSortKey = "sends" | "deliveryRate" | "clickRate" | "conversionRate" | "avgCostCents";

function TemplatePerformanceTable({ data }: { data: SmsTemplatePerformanceRow[] }) {
  const [sortKey, setSortKey] = useState<TemplateSortKey>("sends");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return sortAsc ? diff : -diff;
    });
  }, [data, sortKey, sortAsc]);

  const toggleSort = useCallback((key: TemplateSortKey) => {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }, [sortKey]);

  const renderSortHeader = useCallback((label: string, field: TemplateSortKey) => (
    <TableHead key={field}>
      <button
        type="button"
        className="flex items-center gap-1 text-xs font-medium hover:text-foreground transition-colors"
        onClick={() => toggleSort(field)}
      >
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </TableHead>
  ), [toggleSort]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Template Performance</CardTitle>
        <CardDescription>How each template performs across key metrics</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState message="No template data available" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Category</TableHead>
                  {renderSortHeader("Sends", "sends")}
                  {renderSortHeader("Delivery", "deliveryRate")}
                  {renderSortHeader("Click Rate", "clickRate")}
                  {renderSortHeader("Conversion", "conversionRate")}
                  {renderSortHeader("Avg Cost", "avgCostCents")}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((t) => (
                  <TableRow key={t.templateId}>
                    <TableCell className="font-medium">{t.templateName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {CATEGORY_LABELS[t.category] ?? t.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatNumber(t.sends)}</TableCell>
                    <TableCell>{formatPercent(t.deliveryRate)}</TableCell>
                    <TableCell>{formatPercent(t.clickRate)}</TableCell>
                    <TableCell>{formatPercent(t.conversionRate)}</TableCell>
                    <TableCell>{formatCurrency(t.avgCostCents)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// LO Leaderboard
// ============================================================================

function LoLeaderboard({ data }: { data: SmsLoLeaderboardRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">LO Leaderboard</CardTitle>
        <CardDescription>Team member SMS performance ranked by conversion rate</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState message="No team member data available" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>SMS Sent</TableHead>
                  <TableHead>Reviews</TableHead>
                  <TableHead>Conversion</TableHead>
                  <TableHead>Cost/Review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((lo, i) => (
                  <TableRow key={lo.userId}>
                    <TableCell>
                      <span className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                        i === 0 && "bg-amber-100 text-amber-700",
                        i === 1 && "bg-gray-100 text-gray-700",
                        i === 2 && "bg-orange-100 text-orange-700",
                        i > 2 && "text-muted-foreground"
                      )}>
                        {i + 1}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{lo.userName}</TableCell>
                    <TableCell>{formatNumber(lo.smsSent)}</TableCell>
                    <TableCell>{formatNumber(lo.reviewsGenerated)}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "font-medium",
                        lo.conversionRate >= 0.1 && "text-green-600",
                        lo.conversionRate < 0.05 && "text-muted-foreground"
                      )}>
                        {formatPercent(lo.conversionRate)}
                      </span>
                    </TableCell>
                    <TableCell>{formatCurrency(lo.costPerReview)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Opt-out Trend Chart
// ============================================================================

function OptOutTrendChart({ data }: { data: SmsOptOutTrend[] }) {
  const chartData = useMemo(
    () => data.map((d) => ({
      ...d,
      date: format(new Date(d.date + "T00:00:00"), "MMM d"),
      optOutRatePercent: d.optOutRate * 100,
    })),
    [data]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Opt-out Trend</CardTitle>
        <CardDescription>Daily opt-out count and rate over time</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 || data.every((d) => d.optOutCount === 0) ? (
          <EmptyState message="No opt-out data recorded" />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="count" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="rate" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(v: number) => `${v.toFixed(1)}%`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
              <Legend />
              <Bar yAxisId="count" dataKey="optOutCount" name="Opt-outs" fill={CHART_COLORS.failed} />
              <Line yAxisId="rate" type="monotone" dataKey="optOutRatePercent" name="Opt-out Rate %" stroke="#354f52" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Cost Breakdown Pie Chart
// ============================================================================

function CostBreakdownChart({ data }: { data: SmsCostBreakdown[] }) {
  const chartData = useMemo(
    () => data.map((d) => ({
      name: CATEGORY_LABELS[d.category] ?? d.category,
      value: d.costCents,
      count: d.count,
    })),
    [data]
  );

  const totalCost = useMemo(() => data.reduce((s, d) => s + d.costCents, 0), [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cost Breakdown</CardTitle>
        <CardDescription>Spend by message category</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 || totalCost === 0 ? (
          <EmptyState message="No cost data available" />
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 min-w-[160px]">
              {chartData.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-2 text-sm">
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                  />
                  <span className="text-muted-foreground">{entry.name}</span>
                  <span className="ml-auto font-medium">{formatCurrency(entry.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Time-of-Day Heatmap
// ============================================================================

function TimeHeatmap({ data }: { data: SmsTimeHeatmapCell[] }) {
  const maxClicks = useMemo(
    () => Math.max(...data.map((c) => c.clickRate), 0.001),
    [data]
  );

  const getColor = useCallback(
    (clickRate: number): string => {
      if (clickRate === 0) return "hsl(var(--muted))";
      const intensity = clickRate / maxClicks;
      // Teal gradient from light to dark
      const lightness = 90 - intensity * 50;
      return `hsl(160, 30%, ${lightness}%)`;
    },
    [maxClicks]
  );

  // Only show hours 7-22 (business-relevant hours)
  const visibleHours = useMemo(
    () => Array.from({ length: 16 }, (_, i) => i + 7),
    []
  );

  const hasSends = data.some((c) => c.sends > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Send Time Performance</CardTitle>
        <CardDescription>Click rates by day of week and hour (UTC)</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasSends ? (
          <EmptyState message="No send time data available" />
        ) : (
          <div className="overflow-x-auto" role="img" aria-label="Heatmap showing SMS click rates by day of week and hour. Best times are highlighted in darker teal.">
            <div className="min-w-[500px]">
              {/* Hour headers */}
              <div className="flex gap-px mb-1 pl-10">
                {visibleHours.map((h) => (
                  <div key={h} className="flex-1 text-center text-[10px] text-muted-foreground">
                    {h % 3 === 0 ? `${h}:00` : ""}
                  </div>
                ))}
              </div>

              {/* Grid rows */}
              {DAY_LABELS.map((day, dow) => (
                <div key={day} className="flex gap-px mb-px items-center">
                  <div className="w-10 text-xs text-muted-foreground text-right pr-2">{day}</div>
                  {visibleHours.map((hour) => {
                    const cell = data.find((c) => c.dayOfWeek === dow && c.hour === hour);
                    const sends = cell?.sends ?? 0;
                    const clicks = cell?.clicks ?? 0;
                    const rate = cell?.clickRate ?? 0;

                    return (
                      <div
                        key={`${dow}-${hour}`}
                        className="flex-1 aspect-square rounded-sm transition-colors cursor-default"
                        style={{ backgroundColor: getColor(rate), minHeight: 16 }}
                        title={`${day} ${hour}:00 - ${sends} sent, ${clicks} clicks (${formatPercent(rate)})`}
                      />
                    );
                  })}
                </div>
              ))}

              {/* Legend */}
              <div className="flex items-center gap-2 mt-3 pl-10">
                <span className="text-xs text-muted-foreground">Low</span>
                <div className="flex gap-px">
                  {[0, 0.25, 0.5, 0.75, 1].map((v) => (
                    <div
                      key={v}
                      className="h-3 w-6 rounded-sm"
                      style={{ backgroundColor: getColor(v * maxClicks) }}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">High click rate</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Channel Comparison
// ============================================================================

function ChannelComparisonSection({ data }: { data: SmsChannelComparison[] | null }) {
  if (!data || data.length < 2) return null;

  const email = data.find((c) => c.channel === "email");
  const sms = data.find((c) => c.channel === "sms");

  if (!email || !sms) return null;

  const metrics = [
    { label: "Messages Sent", email: formatNumber(email.sent), sms: formatNumber(sms.sent) },
    { label: "Delivery Rate", email: formatPercent(email.deliveryRate), sms: formatPercent(sms.deliveryRate) },
    { label: "Click Rate", email: formatPercent(email.clickRate), sms: formatPercent(sms.clickRate) },
    { label: "Conversion Rate", email: formatPercent(email.conversionRate), sms: formatPercent(sms.conversionRate) },
    { label: "Cost Per Conversion", email: formatCurrency(email.costPerConversion), sms: formatCurrency(sms.costPerConversion) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Channel Comparison</CardTitle>
        <CardDescription>Email vs SMS performance side by side</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    Email
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    SMS
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((m) => (
                <TableRow key={m.label}>
                  <TableCell className="font-medium">{m.label}</TableCell>
                  <TableCell>{m.email}</TableCell>
                  <TableCell>{m.sms}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ============================================================================
// Main SMS Analytics Tab
// ============================================================================

export function SmsAnalyticsTab({ teamMembers, userRole }: Props) {
  const [data, setData] = useState<SmsAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [selectedMember, setSelectedMember] = useState("all");

  const canViewTeamStats = userRole === "admin" || userRole === "manager";

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getDateRangeValues(dateRange);
      const userId = selectedMember !== "all" ? selectedMember : undefined;

      const result = await getSmsAnalytics({ startDate, endDate, userId });
      if (result.success && result.data) {
        setData(result.data);
      } else {
        toast({ title: "Error", description: result.error ?? "Failed to load SMS analytics", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to load SMS analytics", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, selectedMember]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportCsv = useCallback(async () => {
    setIsExporting(true);
    try {
      const { startDate, endDate } = getDateRangeValues(dateRange);
      const userId = selectedMember !== "all" ? selectedMember : undefined;

      const result = await exportSmsAnalyticsCsv({ startDate, endDate, userId });
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `sms-analytics-${format(new Date(), "yyyy-MM-dd")}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast({ title: "Exported", description: "CSV downloaded" });
      }
    } catch {
      toast({ title: "Error", description: "Export failed", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }, [dateRange, selectedMember]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4" role="group" aria-label="SMS analytics filters">
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

            {canViewTeamStats && teamMembers.length > 0 && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger className="w-[200px]" aria-label="Filter by team member">
                    <SelectValue placeholder="All team members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All team members</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>{member.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={isExporting || isLoading}>
                <Download className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Export CSV
              </Button>
              <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading} aria-label="Refresh SMS analytics">
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} aria-hidden="true" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading && !data ? (
        <div className="space-y-6">
          <KpiSkeleton />
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
          <TableSkeleton />
          <TableSkeleton />
        </div>
      ) : data ? (
        <div className="space-y-6">
          <SmsKpiCards data={data} />

          {/* Funnel + Daily Volume */}
          <div className="grid gap-6 lg:grid-cols-2">
            <DeliveryFunnel data={data} />
            <DailyVolumeChart data={data.dailyVolume} />
          </div>

          {/* Template Performance */}
          <TemplatePerformanceTable data={data.templatePerformance} />

          {/* LO Leaderboard */}
          {canViewTeamStats && <LoLeaderboard data={data.loLeaderboard} />}

          {/* Charts row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <OptOutTrendChart data={data.optOutTrend} />
            <CostBreakdownChart data={data.costBreakdown} />
          </div>

          {/* Time Heatmap */}
          <TimeHeatmap data={data.timeHeatmap} />

          {/* Channel Comparison */}
          <ChannelComparisonSection data={data.channelComparison} />
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold">Unable to load analytics</h3>
              <p className="mt-1 text-sm text-muted-foreground">Try refreshing the page</p>
              <Button variant="outline" className="mt-4" onClick={fetchData}>
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
