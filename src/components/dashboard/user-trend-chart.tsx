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
import {
  Star,
  Users,
} from "@phosphor-icons/react";
import type { TrendDataPoint } from "@/lib/dashboard";
import { ChartSkeleton } from "@/components/shared/skeletons";

interface TrendChartProps {
  data: TrendDataPoint[];
  title: string;
  color?: string;
  type?: "rating" | "nps";
  isLoading?: boolean;
}

const chartConfig = {
  rating: {
    icon: Star,
    emptyTitle: "No rating data yet",
    emptyDescription: "Your rating trends will appear once you collect reviews",
  },
  nps: {
    icon: Users,
    emptyTitle: "No NPS data yet",
    emptyDescription: "Send surveys to start tracking your NPS score",
  },
};

export function UserTrendChart({
  data,
  title,
  color = "hsl(var(--primary))",
  type = "rating",
  isLoading,
}: TrendChartProps) {
  if (isLoading) return <ChartSkeleton />;

  const config = chartConfig[type];
  const Icon = config.icon;

  // Don't render chart if no data
  const hasData = data.some((d) => d.value !== 0);

  if (!hasData) {
    return (
      <Card className="shadow-soft">
        <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2.5 text-lg font-semibold text-repwell-teal-500">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-repwell-teal-300/10">
              <Icon className="h-4 w-4 text-repwell-teal-300" />
            </div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm font-medium text-repwell-teal-500">{config.emptyTitle}</p>
              <p className="text-xs text-repwell-teal-400 mt-1">{config.emptyDescription}</p>
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
    <Card className="shadow-soft">
      <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50 pb-4">
        <CardTitle className="flex items-center gap-2.5 text-lg font-semibold text-repwell-teal-500">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <Icon className="h-4 w-4 text-repwell-teal-300" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
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
