"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Loader2,
  Mail,
  Send,
  CheckCircle2,
  Eye,
  MousePointerClick,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  RefreshCw,
  Info,
  MailX,
} from "lucide-react";
import {
  getEmailMetrics,
  getEmailTrends,
  getEmailTypePerformance,
  getUnsubscribeMetrics,
  getSequencePerformance,
  exportEmailAnalyticsCSV,
} from "@/lib/email-analytics/actions";
import type {
  EmailMetrics,
  EmailTrendPoint,
  EmailTypePerformance,
  UnsubscribeMetrics,
  SequencePerformance,
  TimePeriod,
} from "@/lib/email-analytics/types";
import { INDUSTRY_BENCHMARKS } from "@/lib/email-analytics/types";

const CHART_COLORS = {
  sent: "hsl(var(--chart-1))",
  delivered: "hsl(var(--chart-2))",
  opened: "hsl(var(--chart-3))",
  clicked: "hsl(var(--chart-4))",
  bounced: "hsl(var(--chart-5))",
};

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function TrendIndicator({ value, suffix = "%" }: { value: number; suffix?: string }) {
  if (value > 0) {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <TrendingUp className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">+{value}{suffix}</span>
      </div>
    );
  }
  if (value < 0) {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <TrendingDown className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">{value}{suffix}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Minus className="h-3.5 w-3.5" />
      <span className="text-xs font-medium">0{suffix}</span>
    </div>
  );
}

function BenchmarkIndicator({ value, benchmark, label }: { value: number; benchmark: number; label: string }) {
  const diff = value - benchmark;
  const isGood = diff >= 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            <div
              className={`h-2 w-2 rounded-full ${isGood ? "bg-green-500" : "bg-amber-500"}`}
            />
            <span className="text-xs text-muted-foreground">
              {isGood ? "Above" : "Below"} benchmark
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Industry benchmark for {label}: {benchmark}%
          </p>
          <p className="text-xs font-medium">
            Your rate: {value}% ({isGood ? "+" : ""}{diff.toFixed(1)}%)
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  change,
  benchmark,
  benchmarkLabel,
  iconBg,
  suffix = "",
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  change?: number;
  benchmark?: number;
  benchmarkLabel?: string;
  iconBg: string;
  suffix?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{title}</p>
              <p className="text-xl font-bold">
                {value}{suffix}
              </p>
              {benchmark !== undefined && benchmarkLabel && (
                <BenchmarkIndicator value={Number(value)} benchmark={benchmark} label={benchmarkLabel} />
              )}
            </div>
          </div>
          {change !== undefined && <TrendIndicator value={change} />}
        </div>
      </CardContent>
    </Card>
  );
}

export function EmailAnalyticsDashboard() {
  const [isPending, startTransition] = useTransition();
  const [period, setPeriod] = useState<TimePeriod>("30d");
  const [metrics, setMetrics] = useState<EmailMetrics | null>(null);
  const [trends, setTrends] = useState<EmailTrendPoint[]>([]);
  const [typePerformance, setTypePerformance] = useState<EmailTypePerformance[]>([]);
  const [unsubscribes, setUnsubscribes] = useState<UnsubscribeMetrics | null>(null);
  const [sequences, setSequences] = useState<SequencePerformance[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const loadData = useCallback(() => {
    startTransition(async () => {
      const [metricsRes, trendsRes, typeRes, unsubRes, seqRes] = await Promise.all([
        getEmailMetrics(period),
        getEmailTrends(period),
        getEmailTypePerformance(period),
        getUnsubscribeMetrics(period),
        getSequencePerformance(),
      ]);

      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }
      if (trendsRes.success && trendsRes.data) {
        setTrends(trendsRes.data);
      }
      if (typeRes.success && typeRes.data) {
        setTypePerformance(typeRes.data);
      }
      if (unsubRes.success && unsubRes.data) {
        setUnsubscribes(unsubRes.data);
      }
      if (seqRes.success && seqRes.data) {
        setSequences(seqRes.data);
      }
    });
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportEmailAnalyticsCSV(period);
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `email-analytics-${period}-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Prepare category breakdown data for pie chart
  const categoryData = typePerformance.reduce((acc, item) => {
    const existing = acc.find((c) => c.name === item.category);
    if (existing) {
      existing.value += item.totalSent;
    } else {
      acc.push({ name: item.category, value: item.totalSent });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Get top performing templates
  const topTemplates = [...typePerformance]
    .sort((a, b) => b.openRate - a.openRate)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={loadData}
            disabled={isPending}
          >
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export CSV
        </Button>
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading analytics...</span>
        </div>
      )}

      {/* Overview Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Emails Sent"
          value={metrics?.totalSent.toLocaleString() || "0"}
          icon={Send}
          change={metrics?.sentChange}
          iconBg="bg-blue-100 text-blue-600"
        />
        <MetricCard
          title="Delivery Rate"
          value={metrics?.deliveryRate || 0}
          icon={CheckCircle2}
          change={metrics?.deliveryRateChange}
          benchmark={INDUSTRY_BENCHMARKS.deliveryRate}
          benchmarkLabel="delivery rate"
          iconBg="bg-green-100 text-green-600"
          suffix="%"
        />
        <MetricCard
          title="Open Rate"
          value={metrics?.openRate || 0}
          icon={Eye}
          change={metrics?.openRateChange}
          benchmark={INDUSTRY_BENCHMARKS.openRate}
          benchmarkLabel="open rate"
          iconBg="bg-purple-100 text-purple-600"
          suffix="%"
        />
        <MetricCard
          title="Click Rate"
          value={metrics?.clickRate || 0}
          icon={MousePointerClick}
          change={metrics?.clickRateChange}
          benchmark={INDUSTRY_BENCHMARKS.clickRate}
          benchmarkLabel="click rate"
          iconBg="bg-amber-100 text-amber-600"
          suffix="%"
        />
        <MetricCard
          title="Bounce Rate"
          value={metrics?.bounceRate || 0}
          icon={AlertTriangle}
          benchmark={INDUSTRY_BENCHMARKS.bounceRate}
          benchmarkLabel="bounce rate"
          iconBg="bg-red-100 text-red-600"
          suffix="%"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Engagement Trends */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Mail className="h-5 w-5 text-primary" />
              Engagement Trends
            </CardTitle>
            <CardDescription>Email performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            {trends.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Mail className="mx-auto mb-3 h-12 w-12 opacity-20" />
                  <p className="text-sm">No email data available</p>
                </div>
              </div>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.sent} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS.sent} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.opened} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS.opened} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      dx={-10}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sent"
                      stroke={CHART_COLORS.sent}
                      fill="url(#colorSent)"
                      strokeWidth={2}
                      name="Sent"
                    />
                    <Area
                      type="monotone"
                      dataKey="opened"
                      stroke={CHART_COLORS.opened}
                      fill="url(#colorOpened)"
                      strokeWidth={2}
                      name="Opened"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Category Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Mail className="h-5 w-5 text-primary" />
              Email Distribution by Category
            </CardTitle>
            <CardDescription>Volume breakdown by email type</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Mail className="mx-auto mb-3 h-12 w-12 opacity-20" />
                  <p className="text-sm">No category data available</p>
                </div>
              </div>
            ) : (
              <div className="flex h-[280px] items-center gap-4">
                <div className="h-full w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => [value.toLocaleString(), "Emails"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {categoryData.slice(0, 6).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Templates */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Top Performing Email Templates
              </CardTitle>
              <CardDescription>Sorted by open rate performance</CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Industry benchmarks: Delivery {INDUSTRY_BENCHMARKS.deliveryRate}%,
                    Open {INDUSTRY_BENCHMARKS.openRate}%,
                    Click {INDUSTRY_BENCHMARKS.clickRate}%
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          {topTemplates.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Mail className="mx-auto mb-3 h-12 w-12 opacity-20" />
                <p className="text-sm">No template data available</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Delivery</TableHead>
                  <TableHead className="text-right">Open Rate</TableHead>
                  <TableHead className="text-right">Click Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topTemplates.map((template) => (
                  <TableRow key={template.templateName}>
                    <TableCell className="font-medium">{template.displayName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{template.totalSent.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          template.deliveryRate >= INDUSTRY_BENCHMARKS.deliveryRate
                            ? "text-green-600"
                            : "text-amber-600"
                        }
                      >
                        {template.deliveryRate}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          template.openRate >= INDUSTRY_BENCHMARKS.openRate
                            ? "text-green-600"
                            : "text-amber-600"
                        }
                      >
                        {template.openRate}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          template.clickRate >= INDUSTRY_BENCHMARKS.clickRate
                            ? "text-green-600"
                            : "text-amber-600"
                        }
                      >
                        {template.clickRate}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Bottom Row: Sequences & Unsubscribes */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sequence Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Mail className="h-5 w-5 text-primary" />
              Sequence Performance
            </CardTitle>
            <CardDescription>Email sequence completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            {sequences.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Mail className="mx-auto mb-3 h-12 w-12 opacity-20" />
                  <p className="text-sm">No sequence data available</p>
                </div>
              </div>
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sequences}
                    layout="vertical"
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="displayName"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      width={120}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [`${value}%`, "Completion Rate"]}
                    />
                    <Bar
                      dataKey="completionRate"
                      fill="hsl(var(--chart-1))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unsubscribe Analysis */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <MailX className="h-5 w-5 text-red-500" />
              Unsubscribe Analysis
            </CardTitle>
            <CardDescription>Unsubscribe reasons and trends</CardDescription>
          </CardHeader>
          <CardContent>
            {!unsubscribes || unsubscribes.total === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-500 opacity-50" />
                  <p className="text-sm">No unsubscribes in this period</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Unsubscribes</p>
                    <p className="text-2xl font-bold">{unsubscribes.total}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Unsubscribe Rate</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{unsubscribes.rate}%</p>
                      <TrendIndicator value={unsubscribes.rateChange} />
                    </div>
                    <BenchmarkIndicator
                      value={unsubscribes.rate}
                      benchmark={INDUSTRY_BENCHMARKS.unsubscribeRate}
                      label="unsubscribe rate"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Reasons</p>
                  {unsubscribes.byReason.slice(0, 4).map((item) => (
                    <div
                      key={item.reason}
                      className="flex items-center justify-between rounded border px-3 py-2"
                    >
                      <span className="text-sm capitalize">{item.reason.replace(/_/g, " ")}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full Template Performance Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Mail className="h-5 w-5 text-primary" />
            All Email Templates Performance
          </CardTitle>
          <CardDescription>Complete breakdown by template type</CardDescription>
        </CardHeader>
        <CardContent>
          {typePerformance.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Mail className="mx-auto mb-3 h-12 w-12 opacity-20" />
                <p className="text-sm">No template data available</p>
              </div>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Sent</TableHead>
                    <TableHead className="text-right">Delivered</TableHead>
                    <TableHead className="text-right">Opened</TableHead>
                    <TableHead className="text-right">Clicked</TableHead>
                    <TableHead className="text-right">Bounced</TableHead>
                    <TableHead className="text-right">Open Rate</TableHead>
                    <TableHead className="text-right">Click Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typePerformance.map((template) => (
                    <TableRow key={template.templateName}>
                      <TableCell className="max-w-[200px] truncate font-medium">
                        {template.displayName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{template.totalSent.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{template.delivered.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{template.opened.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{template.clicked.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{template.bounced.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            template.openRate >= INDUSTRY_BENCHMARKS.openRate
                              ? "text-green-600"
                              : ""
                          }
                        >
                          {template.openRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            template.clickRate >= INDUSTRY_BENCHMARKS.clickRate
                              ? "text-green-600"
                              : ""
                          }
                        >
                          {template.clickRate}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
