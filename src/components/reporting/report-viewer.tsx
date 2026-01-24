"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  TrendUp as TrendingUp,
  TrendDown as TrendingDown,
  Minus,
  Star,
  Users,
  Chats as MessageSquare,
  ChartBar as BarChart3,
} from "@phosphor-icons/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import type { GeneratedReport, TeamComparisonRow } from "@/lib/reporting/types";

interface ReportViewerProps {
  report: GeneratedReport;
  className?: string;
}

const _COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ef4444"];

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  suffix = "",
  description,
}: {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ElementType;
  suffix?: string;
  description?: string;
}) {
  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === "number" ? value.toLocaleString() : value}
          {suffix}
        </div>
        {(change !== undefined || description) && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            {getTrendIcon()}
            {change !== undefined && (
              <span className={cn(change > 0 ? "text-green-500" : change < 0 ? "text-red-500" : "")}>
                {change > 0 ? "+" : ""}
                {change.toFixed(1)}
                {suffix} vs prev period
              </span>
            )}
            {!change && description && <span>{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    excellent: "bg-green-100 text-green-700",
    good: "bg-blue-100 text-blue-700",
    needs_attention: "bg-yellow-100 text-yellow-700",
    at_risk: "bg-red-100 text-red-700",
  };

  return (
    <Badge className={cn("font-medium capitalize", colors[status] || colors.good)}>
      {status.replace("_", " ")}
    </Badge>
  );
}

export function ReportViewer({ report, className }: ReportViewerProps) {
  const { executiveSummary, npsBreakdown, csatMetrics, teamComparison, trends } = report;

  // Prepare chart data
  const npsDistributionData = npsBreakdown
    ? [
        { name: "Promoters", value: npsBreakdown.promoters, color: "#10b981" },
        { name: "Passives", value: npsBreakdown.passives, color: "#6366f1" },
        { name: "Detractors", value: npsBreakdown.detractors, color: "#ef4444" },
      ]
    : [];

  const csatDistributionData = csatMetrics
    ? [
        { name: "Satisfied", value: csatMetrics.satisfiedCount, color: "#10b981" },
        { name: "Neutral", value: csatMetrics.neutralCount, color: "#f59e0b" },
        { name: "Dissatisfied", value: csatMetrics.dissatisfiedCount, color: "#ef4444" },
      ]
    : [];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{report.templateName}</h2>
          <p className="text-muted-foreground">
            {executiveSummary.periodLabel}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Generated: {format(report.generatedAt, "MMM d, yyyy 'at' h:mm a")}
        </p>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title="Total Reviews"
          value={executiveSummary.totalReviews}
          change={executiveSummary.comparisonPeriod?.reviewsChange}
          icon={MessageSquare}
        />
        <MetricCard
          title="Average Rating"
          value={executiveSummary.averageRating.toFixed(1)}
          change={executiveSummary.comparisonPeriod?.ratingChange}
          icon={Star}
        />
        <MetricCard
          title="NPS Score"
          value={executiveSummary.npsScore}
          change={executiveSummary.comparisonPeriod?.npsChange}
          icon={TrendingUp}
        />
        <MetricCard
          title="CSAT Score"
          value={executiveSummary.csatScore}
          suffix="%"
          change={executiveSummary.comparisonPeriod?.csatChange}
          icon={BarChart3}
        />
        <MetricCard
          title="Response Rate"
          value={executiveSummary.responseRate.toFixed(1)}
          suffix="%"
          icon={Users}
          description="Survey completion"
        />
        <MetricCard
          title="Monthly Velocity"
          value={executiveSummary.reviewVelocity.toFixed(1)}
          icon={TrendingUp}
          description="Reviews per month"
        />
      </div>

      {/* NPS & CSAT Breakdown */}
      {(npsBreakdown || csatMetrics) && (
        <div className="grid gap-6 md:grid-cols-2">
          {npsBreakdown && (
            <Card>
              <CardHeader>
                <CardTitle>NPS Breakdown</CardTitle>
                <CardDescription>
                  Net Promoter Score distribution ({npsBreakdown.totalResponses} responses)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="h-40 w-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={npsDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {npsDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                        <span className="text-sm">Promoters (9-10)</span>
                      </div>
                      <span className="font-medium">{npsBreakdown.promoterPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-indigo-500" />
                        <span className="text-sm">Passives (7-8)</span>
                      </div>
                      <span className="font-medium">{npsBreakdown.passivePercentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500" />
                        <span className="text-sm">Detractors (0-6)</span>
                      </div>
                      <span className="font-medium">{npsBreakdown.detractorPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {csatMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Satisfaction</CardTitle>
                <CardDescription>
                  Rating distribution ({csatMetrics.totalResponses} responses)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="h-40 w-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={csatDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {csatDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                        <span className="text-sm">Satisfied (4-5)</span>
                      </div>
                      <span className="font-medium">{csatMetrics.satisfiedPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-yellow-500" />
                        <span className="text-sm">Neutral (3)</span>
                      </div>
                      <span className="font-medium">{csatMetrics.neutralPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500" />
                        <span className="text-sm">Dissatisfied (1-2)</span>
                      </div>
                      <span className="font-medium">{csatMetrics.dissatisfiedPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <span className="text-lg font-semibold">Average: </span>
                  <span className="text-2xl font-bold">{csatMetrics.averageRating.toFixed(2)}</span>
                  <span className="text-muted-foreground"> / 5.0</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Trend Charts */}
      {trends && (trends.nps.length > 0 || trends.reviews.length > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          {trends.nps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>NPS Trend</CardTitle>
                <CardDescription>Net Promoter Score over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends.nps}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis domain={[-100, 100]} className="text-xs" />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={{ fill: "#6366f1" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {trends.reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Review Volume</CardTitle>
                <CardDescription>Number of reviews over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trends.reviews}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Team Comparison Table */}
      {teamComparison && teamComparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>
              Performance comparison across {teamComparison.length} team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-right">Reviews</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead className="text-right">NPS</TableHead>
                  <TableHead className="text-right">Response</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamComparison.map((member: TeamComparisonRow) => (
                  <TableRow key={member.loanOfficerId}>
                    <TableCell className="font-medium">{member.rank}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.photoUrl || undefined} />
                          <AvatarFallback>
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{member.branch || "—"}</TableCell>
                    <TableCell className="text-right">{member.totalReviews}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {member.averageRating.toFixed(1)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{member.npsScore}</TableCell>
                    <TableCell className="text-right">{member.responseRate.toFixed(0)}%</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={member.reputationScore} className="w-16" />
                        <span className="w-8 text-sm">{member.reputationScore}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={member.performanceStatus} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
