"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import type { TrendDataPoint } from "@/lib/dashboard";

interface TrendChartProps {
  data: TrendDataPoint[];
  title: string;
  color?: string;
  type?: "rating" | "nps";
}

export function LOTrendChart({
  data,
  title,
  color = "hsl(var(--primary))",
  type = "rating",
}: TrendChartProps) {
  // Don't render chart if no data
  const hasData = data.some((d) => d.value !== 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No data available yet</p>
              <p className="text-xs">Start collecting reviews to see trends</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const yAxisDomain =
    type === "rating" ? [0, 5] : [-100, 100];
  const yAxisTicks =
    type === "rating" ? [1, 2, 3, 4, 5] : [-100, -50, 0, 50, 100];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={color}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={color}
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
                domain={yAxisDomain}
                ticks={yAxisTicks}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                dx={-10}
                tickFormatter={(value) =>
                  type === "nps" ? `${value > 0 ? "+" : ""}${value}` : value.toString()
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                formatter={(value: number) => [
                  type === "rating"
                    ? `${value.toFixed(1)} stars`
                    : `${value > 0 ? "+" : ""}${value}`,
                  type === "rating" ? "Average Rating" : "NPS Score",
                ]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#gradient-${type})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
