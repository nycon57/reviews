"use client";

import { memo, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import type { DailyMetric } from "@/lib/widgets/analytics-actions";

// Design system color tokens (from tailwind.config.ts)
const REPWELL_TEAL_300 = "#52796f";
const REPWELL_SAGE_200 = "#84a98c";

interface ImpressionsChartProps {
  data: DailyMetric[];
  isLoading: boolean;
}

export const ImpressionsChart = memo(function ImpressionsChart({
  data,
  isLoading,
}: ImpressionsChartProps) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        label: format(new Date(d.date), "MMM d"),
      })),
    [data]
  );

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Impressions & Clicks</CardTitle>
          <CardDescription>Daily widget performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            <p className="text-sm">No data available for this period</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg">Impressions & Clicks</CardTitle>
        <CardDescription>Daily widget performance over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="sr-only">
          <table>
            <caption>Daily impressions and clicks</caption>
            <thead>
              <tr>
                <th>Date</th>
                <th>Impressions</th>
                <th>Clicks</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((point) => (
                <tr key={point.date}>
                  <td>{point.label}</td>
                  <td>{point.impressions}</td>
                  <td>{point.clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="h-[300px] w-full" role="img" aria-label="Impressions over time chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="gradient-impressions"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={REPWELL_TEAL_300} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={REPWELL_TEAL_300} stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="gradient-clicks"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={REPWELL_SAGE_200} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={REPWELL_SAGE_200} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 12,
                  fill: "hsl(var(--muted-foreground))",
                }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 12,
                  fill: "hsl(var(--muted-foreground))",
                }}
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
                dataKey="impressions"
                name="Impressions"
                stroke={REPWELL_TEAL_300}
                strokeWidth={2}
                fill="url(#gradient-impressions)"
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="clicks"
                name="Clicks"
                stroke={REPWELL_SAGE_200}
                strokeWidth={2}
                fill="url(#gradient-clicks)"
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
