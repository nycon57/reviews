"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendUp as TrendingUp,
  TrendDown as TrendingDown,
  Minus,
  ChartBar as BarChart3,
  Target,
  Medal as Award,
} from "@phosphor-icons/react";
import type { IndustryBenchmark } from "@/lib/ai";
import { cn } from "@/lib/utils";

interface BenchmarksCardProps {
  data: IndustryBenchmark[];
}

function TrendBadge({ trend }: { trend: "above" | "at" | "below" }) {
  if (trend === "above") {
    return (
      <Badge className="bg-green-100 text-green-800">
        <TrendingUp className="mr-1 h-3 w-3" />
        Above Average
      </Badge>
    );
  }
  if (trend === "below") {
    return (
      <Badge className="bg-red-100 text-red-800">
        <TrendingDown className="mr-1 h-3 w-3" />
        Below Average
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-100 text-gray-800">
      <Minus className="mr-1 h-3 w-3" />
      At Average
    </Badge>
  );
}

export function BenchmarksCard({ data }: BenchmarksCardProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Industry Benchmarks</CardTitle>
          </div>
          <CardDescription>How you compare to industry standards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No benchmark data available</p>
              <p className="text-xs">Collect more reviews for comparison</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">Industry Benchmarks</CardTitle>
        </div>
        <CardDescription>How you compare to mortgage industry standards</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.map((benchmark, index) => (
          <div key={index} className="space-y-3">
            {/* Metric header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{benchmark.metric}</h4>
                <TrendBadge trend={benchmark.trend} />
              </div>
              <span className="text-2xl font-bold tabular-nums">
                {typeof benchmark.yourValue === 'number' && benchmark.yourValue % 1 !== 0
                  ? benchmark.yourValue.toFixed(1)
                  : benchmark.yourValue}
              </span>
            </div>

            {/* Comparison bar */}
            <div className="relative">
              <div className="flex h-8 overflow-hidden rounded-lg bg-muted">
                {/* Your position indicator */}
                <div
                  className="absolute top-0 h-full w-1 bg-primary shadow-sm transition-all"
                  style={{ left: `${Math.min(benchmark.percentile, 100)}%` }}
                >
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium">
                    You
                  </div>
                </div>

                {/* Marker zones */}
                <div className="flex h-full w-full items-center px-2">
                  {/* Industry average marker */}
                  <div
                    className="absolute flex flex-col items-center"
                    style={{ left: "50%" }}
                  >
                    <div className="h-8 w-0.5 bg-gray-400/50" />
                    <Target className="mt-1 h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Avg: {benchmark.industryAverage}</span>
                  </div>

                  {/* Top performers marker */}
                  <div
                    className="absolute flex flex-col items-center"
                    style={{ left: "85%" }}
                  >
                    <div className="h-8 w-0.5 bg-green-400/50" />
                    <Award className="mt-1 h-3 w-3 text-green-600" />
                    <span className="text-[10px] text-green-600">Top: {benchmark.topPerformers}</span>
                  </div>
                </div>
              </div>

              {/* Gradient background */}
              <div
                className="absolute inset-0 rounded-lg pointer-events-none"
                style={{
                  background: "linear-gradient(to right, hsl(0, 84%, 60%, 0.15), hsl(45, 93%, 47%, 0.15), hsl(142, 76%, 36%, 0.15))",
                }}
              />
            </div>

            {/* Percentile indicator */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                You&apos;re in the{" "}
                <span className={cn(
                  "font-semibold",
                  benchmark.percentile >= 75 && "text-green-600",
                  benchmark.percentile >= 50 && benchmark.percentile < 75 && "text-amber-600",
                  benchmark.percentile < 50 && "text-red-600"
                )}>
                  {benchmark.percentile}th percentile
                </span>
              </span>
              <span className="text-xs">
                Industry avg: {benchmark.industryAverage} | Top: {benchmark.topPerformers}
              </span>
            </div>
          </div>
        ))}

        {/* Footer note */}
        <p className="text-xs text-muted-foreground border-t pt-3">
          Benchmarks based on mortgage industry data. Your metrics are compared against aggregate performance of similar professionals.
        </p>
      </CardContent>
    </Card>
  );
}
