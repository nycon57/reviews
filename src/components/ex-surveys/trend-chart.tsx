"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Line,
  LineChart,
  Legend,
} from "recharts";
import type { TrendDataPoint } from "@/lib/ex-surveys/actions";
import { format } from "date-fns";
import { CHART_TOOLTIP_STYLE } from "@/components/analytics/chart-primitives";

interface EXTrendChartProps {
  data: TrendDataPoint[];
  title?: string;
  description?: string;
}

export function EXTrendChart({
  data,
  title = "eNPS Trend",
  description = "Employee Net Promoter Score over time",
}: EXTrendChartProps) {
  // Format data for chart
  const chartData = data.map((d) => ({
    ...d,
    date: format(new Date(d.date), "MMM yyyy"),
    enps: d.enpsScore ?? null,
    engagement: d.engagementScore ?? null,
    responseRate: d.responseRate ?? null,
  }));

  const hasData = chartData.some((d) => d.enps !== null);

  if (!hasData) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No trend data available yet</p>
              <p className="text-xs">Complete surveys to see trends over time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradient-enps" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
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
                domain={[-100, 100]}
                ticks={[-100, -50, 0, 50, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                dx={-10}
                tickFormatter={(value) => `${value > 0 ? "+" : ""}${value}`}
              />
              <Tooltip
                contentStyle={{
                  ...CHART_TOOLTIP_STYLE,
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                formatter={(value: number, name: string) => {
                  if (name === "enps") {
                    return [`${value > 0 ? "+" : ""}${value}`, "eNPS Score"];
                  }
                  return [value, name];
                }}
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload;
                  return item?.surveyName || label;
                }}
              />
              <Area
                type="monotone"
                dataKey="enps"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#gradient-enps)"
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface EXMultiMetricChartProps {
  data: TrendDataPoint[];
  title?: string;
  description?: string;
}

export function EXMultiMetricChart({
  data,
  title = "Employee Experience Trends",
  description = "Track key metrics over time",
}: EXMultiMetricChartProps) {
  // Format data for chart
  const chartData = data.map((d) => ({
    ...d,
    date: format(new Date(d.date), "MMM yy"),
    enps: d.enpsScore ?? null,
    engagement: d.engagementScore ?? null,
    responseRate: d.responseRate ?? null,
  }));

  const hasData = chartData.some(
    (d) => d.enps !== null || d.engagement !== null || d.responseRate !== null
  );

  if (!hasData) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No trend data available yet</p>
              <p className="text-xs">Complete surveys to see trends over time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: -10, bottom: 5 }}
            >
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
                yAxisId="left"
                domain={[-100, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                dx={-10}
                tickFormatter={(value) => `${value}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  ...CHART_TOOLTIP_STYLE,
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                formatter={(value: number, name: string) => {
                  if (name === "enps") {
                    return [`${value > 0 ? "+" : ""}${value}`, "eNPS"];
                  }
                  if (name === "engagement") {
                    return [`${value}%`, "Engagement"];
                  }
                  if (name === "responseRate") {
                    return [`${value.toFixed(1)}%`, "Response Rate"];
                  }
                  return [value, name];
                }}
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload;
                  return item?.surveyName || label;
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => {
                  if (value === "enps") return "eNPS Score";
                  if (value === "engagement") return "Engagement";
                  if (value === "responseRate") return "Response Rate";
                  return value;
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="enps"
                stroke="hsl(221.2, 83.2%, 53.3%)"
                strokeWidth={2}
                dot={{ fill: "hsl(221.2, 83.2%, 53.3%)", r: 4 }}
                connectNulls
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="engagement"
                stroke="hsl(142.1, 76.2%, 36.3%)"
                strokeWidth={2}
                dot={{ fill: "hsl(142.1, 76.2%, 36.3%)", r: 4 }}
                connectNulls
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="responseRate"
                stroke="hsl(262.1, 83.3%, 57.8%)"
                strokeWidth={2}
                dot={{ fill: "hsl(262.1, 83.3%, 57.8%)", r: 4 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
