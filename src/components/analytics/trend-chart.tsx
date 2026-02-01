"use client";

import { memo, useMemo } from "react";
import { ChartBarIcon as BarChart3 } from "@phosphor-icons/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import type { VideoTestimonialTrendDataPoint } from "@/lib/video-testimonials/analytics-actions";
import type { TrendPeriod } from "./analytics-context";

export const TrendChart = memo(function TrendChart({
  data,
  period,
}: {
  data: VideoTestimonialTrendDataPoint[];
  period: TrendPeriod;
}) {
  const chartData = useMemo(() => data.map((d) => ({
    ...d,
    originalDate: d.date,
    date: format(
      new Date(d.date),
      period === "monthly" ? "MMM yyyy" : "MMM d"
    ),
  })), [data, period]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
            Video Trends
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
          Video Trends
        </CardTitle>
        <CardDescription>Video testimonial activity over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="sr-only">
          <table>
            <caption>Video testimonial trends data</caption>
            <thead>
              <tr><th>Date</th><th>Sent</th><th>Completed</th><th>Published</th></tr>
            </thead>
            <tbody>
              {chartData.map((point) => (
                <tr key={point.originalDate}>
                  <td>{point.date}</td><td>{point.sent}</td><td>{point.completed}</td><td>{point.published}</td>
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dx={-10} />
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
              <Area type="monotone" dataKey="sent" name="Sent" stroke="#52796f" strokeWidth={2} fill="url(#gradient-sent)" connectNulls />
              <Area type="monotone" dataKey="completed" name="Completed" stroke="#84a98c" strokeWidth={2} fill="url(#gradient-completed)" connectNulls />
              <Area type="monotone" dataKey="published" name="Published" stroke="#52796f" strokeWidth={2} fill="url(#gradient-published)" connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
