"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  TrendUp as TrendingUp,
  TrendDown as TrendingDown,
  Minus,
  Tag,
} from "@phosphor-icons/react";
import type { ThemeFrequency } from "@/lib/ai";
import { THEME_DESCRIPTIONS } from "@/lib/ai";
import { cn } from "@/lib/utils";
import { ChartSkeleton } from "@/components/shared/skeletons";

interface ThemeCloudProps {
  data: ThemeFrequency[];
  isLoading?: boolean;
}

const themeColors: Record<string, string> = {
  communication: "border border-info/20 bg-info/10 text-info hover:bg-info/15",
  process: "border border-chart-4/20 bg-chart-4/10 text-chart-4 hover:bg-chart-4/15",
  service: "border border-success/20 bg-success/10 text-success hover:bg-success/15",
  responsiveness: "border border-warning/20 bg-warning/10 text-warning hover:bg-warning/15",
  professionalism: "border border-chart-1/20 bg-chart-1/10 text-chart-1 hover:bg-chart-1/15",
  knowledge: "border border-chart-3/20 bg-chart-3/10 text-chart-3 hover:bg-chart-3/15",
  rates: "border border-success/20 bg-success/10 text-success hover:bg-success/15",
  closing:
    "border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/15",
  documentation: "border border-warning/20 bg-warning/10 text-warning hover:bg-warning/15",
  timeliness: "border border-chart-2/20 bg-chart-2/10 text-chart-2 hover:bg-chart-2/15",
};

function TrendIcon({ trend }: { trend: "increasing" | "stable" | "decreasing" }) {
  if (trend === "increasing") {
    return <TrendingUp className="h-3 w-3 text-success" />;
  }
  if (trend === "decreasing") {
    return <TrendingDown className="h-3 w-3 text-destructive" />;
  }
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

export function ThemeCloud({ data, isLoading }: ThemeCloudProps) {
  if (isLoading) return <ChartSkeleton />;

  if (data.length === 0) {
    return (
      <Card className="border border-border shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
              <Tag aria-hidden="true" className="h-5 w-5 text-repwell-teal-300" />
            </div>
            <div>
              <CardTitle className="text-lg">Common Themes</CardTitle>
              <CardDescription>Topics mentioned most frequently in reviews</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm font-medium text-heading">No theme data available yet</p>
              <p className="mt-1 text-xs">Themes are extracted from review analysis</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate font sizes based on frequency
  const maxCount = Math.max(...data.map((d) => d.count));
  const getSize = (count: number) => {
    const ratio = count / maxCount;
    if (ratio >= 0.8) return "text-sm font-bold";
    if (ratio >= 0.6) return "text-sm font-semibold";
    if (ratio >= 0.4) return "text-sm font-medium";
    return "text-sm";
  };

  return (
    <Card className="border border-border shadow-soft">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <Tag className="h-5 w-5 text-repwell-teal-300" />
          </div>
          <div>
            <CardTitle className="text-lg">Common Themes</CardTitle>
            <CardDescription>Topics mentioned most frequently in reviews</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {data.map((theme) => (
            <div
              key={theme.theme}
              className={cn(
                "group relative inline-flex cursor-default items-center gap-1 rounded-lg px-3 py-1.5 transition-colors",
                themeColors[theme.theme] || "border border-border bg-muted text-foreground"
              )}
            >
              <span className={getSize(theme.count)} style={{ textTransform: "capitalize" }}>
                {theme.theme}
              </span>
              <span className="text-xs opacity-75">({theme.count})</span>
              <TrendIcon trend={theme.trend} />

              {/* Tooltip on hover */}
              <div className="pointer-events-none absolute -top-12 left-1/2 z-10 -translate-x-1/2 scale-0 rounded-lg bg-popover px-3 py-2 text-xs shadow-lg transition-transform group-hover:scale-100">
                <div className="whitespace-nowrap font-medium">
                  {THEME_DESCRIPTIONS[theme.theme]}
                </div>
                <div className="mt-1 flex gap-2 text-[10px]">
                  <span className="text-success">+{theme.sentimentBreakdown.positive}</span>
                  <span className="text-muted-foreground">{theme.sentimentBreakdown.neutral}</span>
                  <span className="text-destructive">-{theme.sentimentBreakdown.negative}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Theme breakdown list */}
        <div className="mt-6 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Theme Breakdown
          </h4>
          {data.slice(0, 5).map((theme) => {
            return (
              <div key={theme.theme} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">{theme.theme}</span>
                  <span className="text-muted-foreground">{theme.percentage}% of reviews</span>
                </div>
                <div
                  className="flex h-2 overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label={`${theme.theme} sentiment breakdown: ${theme.sentimentBreakdown.positive} positive, ${theme.sentimentBreakdown.neutral} neutral, ${theme.sentimentBreakdown.negative} negative`}
                >
                  <div
                    className="bg-success transition-all"
                    style={{
                      width: `${theme.count > 0 ? (theme.sentimentBreakdown.positive / theme.count) * 100 : 0}%`,
                    }}
                  />
                  <div
                    className="bg-muted-foreground transition-all"
                    style={{
                      width: `${theme.count > 0 ? (theme.sentimentBreakdown.neutral / theme.count) * 100 : 0}%`,
                    }}
                  />
                  <div
                    className="bg-destructive transition-all"
                    style={{
                      width: `${theme.count > 0 ? (theme.sentimentBreakdown.negative / theme.count) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
