"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ErrorBar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ABTestResult, WinningMetric } from "@/lib/email-ab-testing/types";

interface ABTestResultsChartProps {
  results: ABTestResult[];
  metric: WinningMetric;
  winnerVariant: string | null;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
];

export function ABTestResultsChart({
  results,
  metric,
  winnerVariant,
}: ABTestResultsChartProps) {
  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Variant Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No results data available yet
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for the chart
  const chartData = results.map((result, index) => {
    const rate =
      metric === "open_rate" ? result.openRate * 100 : result.clickRate * 100;

    // Calculate error bars based on confidence interval if available
    const ciLower =
      result.confidenceIntervalLower !== null
        ? result.confidenceIntervalLower * 100
        : rate - 5;
    const ciUpper =
      result.confidenceIntervalUpper !== null
        ? result.confidenceIntervalUpper * 100
        : rate + 5;

    return {
      name: `Variant ${result.variant}`,
      variant: result.variant,
      rate: Number(rate.toFixed(2)),
      errorLower: rate - ciLower,
      errorUpper: ciUpper - rate,
      fill:
        result.variant === winnerVariant
          ? "hsl(var(--chart-2))"
          : CHART_COLORS[index % CHART_COLORS.length],
      isWinner: result.variant === winnerVariant,
    };
  });

  const metricLabel = metric === "open_rate" ? "Open Rate" : "Click Rate";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{metricLabel} by Variant</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-muted-foreground"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              label={{
                value: `${metricLabel} (%)`,
                angle: -90,
                position: "insideLeft",
                fill: "hsl(var(--muted-foreground))",
              }}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              domain={[0, "auto"]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                      <p className="font-semibold">{data.name}</p>
                      <p className="text-sm">
                        {metricLabel}: {data.rate.toFixed(2)}%
                      </p>
                      {data.isWinner && (
                        <p className="text-sm text-green-600 font-medium">
                          Winner
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar
              dataKey="rate"
              name={metricLabel}
              radius={[4, 4, 0, 0]}
              maxBarSize={80}
            >
              {chartData.map((entry) => (
                <rect key={entry.variant} fill={entry.fill} />
              ))}
              <ErrorBar
                dataKey="errorUpper"
                width={4}
                strokeWidth={2}
                stroke="hsl(var(--muted-foreground))"
                direction="y"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface MetricsComparisonChartProps {
  results: ABTestResult[];
  winnerVariant: string | null;
}

export function MetricsComparisonChart({
  results,
  winnerVariant,
}: MetricsComparisonChartProps) {
  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Metrics Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No results data available yet
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data showing all metrics for each variant
  const chartData = results.map((result) => ({
    name: `Variant ${result.variant}`,
    variant: result.variant,
    "Delivery Rate": Number((result.deliveryRate * 100).toFixed(2)),
    "Open Rate": Number((result.openRate * 100).toFixed(2)),
    "Click Rate": Number((result.clickRate * 100).toFixed(2)),
    "Click-to-Open": Number((result.clickToOpenRate * 100).toFixed(2)),
    isWinner: result.variant === winnerVariant,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Metrics Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              label={{
                value: "Rate (%)",
                angle: -90,
                position: "insideLeft",
                fill: "hsl(var(--muted-foreground))",
              }}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                      <p className="font-semibold mb-2">{label}</p>
                      {payload.map((entry) => (
                        <p key={entry.name} className="text-sm">
                          {entry.name}: {entry.value}%
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar
              dataKey="Delivery Rate"
              fill="hsl(var(--chart-1))"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="Open Rate"
              fill="hsl(var(--chart-2))"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="Click Rate"
              fill="hsl(var(--chart-3))"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="Click-to-Open"
              fill="hsl(var(--chart-4))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
