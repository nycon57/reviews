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
import { CHART_TOOLTIP_STYLE } from "@/components/analytics/chart-primitives";
import { ChartSkeleton, IconContainer } from "@/components/shared";

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
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2.5 text-lg font-semibold text-heading">
            <IconContainer size="sm" bg="subtle">
              <Icon className="h-4 w-4 text-repwell-teal-300 dark:text-repwell-sage-200" />
            </IconContainer>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm font-medium text-heading">{config.emptyTitle}</p>
              <p className="text-xs text-label mt-1">{config.emptyDescription}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // For ratings, floor the Y-axis to 1 below the min value (but never below 0)
  // so the line doesn't look like it's dropping to nothing
  const minValue = Math.min(...data.map((d) => d.value));
  const ratingFloor = type === "rating" ? Math.max(0, Math.floor(minValue) - 1) : -100;
  const yAxisDomain =
    type === "rating" ? [ratingFloor, 5] : [-100, 100];
  const ratingTicks = Array.from(
    { length: 5 - ratingFloor + 1 },
    (_, i) => ratingFloor + i
  );
  const yAxisTicks =
    type === "rating" ? ratingTicks : [-100, -50, 0, 50, 100];

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2.5 text-lg font-semibold text-heading">
          <IconContainer size="sm" bg="subtle">
            <Icon className="h-4 w-4 text-repwell-teal-300 dark:text-repwell-sage-200" />
          </IconContainer>
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
                  ...CHART_TOOLTIP_STYLE,
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
