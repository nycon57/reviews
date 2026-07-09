"use client";

import { memo, useMemo } from "react";
import { ChartBar } from "@phosphor-icons/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
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
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from "@/components/analytics/chart-primitives";
import type { VideoTestimonialTrendDataPoint } from "@/lib/video-testimonials/analytics-actions";
import type { TrendPeriod } from "./analytics-context";

const TREND_CHART_COLORS = {
  sent: CHART_COLORS[0],
  completed: CHART_COLORS[1],
  published: CHART_COLORS[3],
} as const;

export const TrendChart = memo(function TrendChart({
  data,
  period,
}: {
  data: VideoTestimonialTrendDataPoint[];
  period: TrendPeriod;
}) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        originalDate: d.date,
        date: format(new Date(d.date), period === "monthly" ? "MMM yyyy" : "MMM d"),
      })),
    [data, period]
  );

  if (chartData.length === 0) {
    return (
      <Card className="border border-border shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
              <ChartBar className="h-5 w-5 text-repwell-teal-300" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-lg">Video Trends</CardTitle>
              <CardDescription>Video testimonial activity over time</CardDescription>
            </div>
          </div>
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
    <Card className="border border-border shadow-soft">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <ChartBar className="h-5 w-5 text-repwell-teal-300" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-lg">Video Trends</CardTitle>
            <CardDescription>Video testimonial activity over time</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
                <tr key={point.originalDate}>
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
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradient-sent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TREND_CHART_COLORS.sent} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={TREND_CHART_COLORS.sent} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradient-completed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TREND_CHART_COLORS.completed} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={TREND_CHART_COLORS.completed} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradient-published" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TREND_CHART_COLORS.published} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={TREND_CHART_COLORS.published} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
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
                  ...CHART_TOOLTIP_STYLE,
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                labelStyle={{ color: "hsl(var(--popover-foreground))" }}
              />
              <Legend verticalAlign="top" height={36} />
              <Area
                type="monotone"
                dataKey="sent"
                name="Sent"
                stroke={TREND_CHART_COLORS.sent}
                strokeWidth={2}
                fill="url(#gradient-sent)"
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="completed"
                name="Completed"
                stroke={TREND_CHART_COLORS.completed}
                strokeWidth={2}
                fill="url(#gradient-completed)"
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="published"
                name="Published"
                stroke={TREND_CHART_COLORS.published}
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
