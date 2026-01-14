"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import type { SentimentTrendPoint } from "@/lib/ai";

interface SentimentTrendChartProps {
  data: SentimentTrendPoint[];
}

export function SentimentTrendChart({ data }: SentimentTrendChartProps) {
  const hasData = data.some((d) => d.totalReviews > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Sentiment Trend</CardTitle>
          <CardDescription>Track how customer sentiment changes over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[280px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No sentiment data available yet</p>
              <p className="text-xs">Reviews need sentiment analysis to display trends</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Sentiment Trend</CardTitle>
        <CardDescription>Track how customer sentiment changes over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradientPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientNeutral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(220, 9%, 46%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(220, 9%, 46%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
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
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
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
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={8}
              />
              <Area
                type="monotone"
                dataKey="positiveCount"
                name="Positive"
                stroke="hsl(142, 76%, 36%)"
                strokeWidth={2}
                fill="url(#gradientPositive)"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="neutralCount"
                name="Neutral"
                stroke="hsl(220, 9%, 46%)"
                strokeWidth={2}
                fill="url(#gradientNeutral)"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="negativeCount"
                name="Negative"
                stroke="hsl(0, 84%, 60%)"
                strokeWidth={2}
                fill="url(#gradientNegative)"
                stackId="1"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
