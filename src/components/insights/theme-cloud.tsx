"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ThemeFrequency } from "@/lib/ai";
import { THEME_DESCRIPTIONS } from "@/lib/ai";
import { cn } from "@/lib/utils";

interface ThemeCloudProps {
  data: ThemeFrequency[];
}

const themeColors: Record<string, string> = {
  communication: "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
  process: "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
  service: "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300",
  responsiveness: "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
  professionalism: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300",
  knowledge: "bg-cyan-100 text-cyan-800 hover:bg-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300",
  rates: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
  closing: "bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-300",
  documentation: "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300",
  timeliness: "bg-teal-100 text-teal-800 hover:bg-teal-200 dark:bg-teal-900/30 dark:text-teal-300",
};

function TrendIcon({ trend }: { trend: "increasing" | "stable" | "decreasing" }) {
  if (trend === "increasing") {
    return <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />;
  }
  if (trend === "decreasing") {
    return <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />;
  }
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

export function ThemeCloud({ data }: ThemeCloudProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Common Themes</CardTitle>
          <CardDescription>Topics mentioned most frequently in reviews</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No theme data available yet</p>
              <p className="text-xs">Themes are extracted from review analysis</p>
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
    if (ratio >= 0.8) return "text-xl font-bold";
    if (ratio >= 0.6) return "text-lg font-semibold";
    if (ratio >= 0.4) return "text-base font-medium";
    return "text-sm";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Common Themes</CardTitle>
        <CardDescription>Topics mentioned most frequently in reviews</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {data.map((theme) => (
            <div
              key={theme.theme}
              className={cn(
                "group relative inline-flex cursor-default items-center gap-1 rounded-lg px-3 py-1.5 transition-colors",
                themeColors[theme.theme] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
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
                  <span className="text-green-600 dark:text-green-400">+{theme.sentimentBreakdown.positive}</span>
                  <span className="text-muted-foreground">{theme.sentimentBreakdown.neutral}</span>
                  <span className="text-red-600 dark:text-red-400">-{theme.sentimentBreakdown.negative}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Theme breakdown list */}
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Theme Breakdown</h4>
          {data.slice(0, 5).map((theme) => {
            return (
              <div key={theme.theme} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">{theme.theme}</span>
                  <span className="text-muted-foreground">{theme.percentage}% of reviews</span>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="bg-green-500 transition-all"
                    style={{ width: `${(theme.sentimentBreakdown.positive / theme.count) * 100}%` }}
                  />
                  <div
                    className="bg-gray-400 transition-all"
                    style={{ width: `${(theme.sentimentBreakdown.neutral / theme.count) * 100}%` }}
                  />
                  <div
                    className="bg-red-500 transition-all"
                    style={{ width: `${(theme.sentimentBreakdown.negative / theme.count) * 100}%` }}
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
