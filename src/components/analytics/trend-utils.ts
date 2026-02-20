import type { TrendDataPoint } from "@/lib/dashboard";

export interface TrendStats {
  current: number;
  previous: number;
  change: number;
  trend: "up" | "down" | "stable";
}

export function calculateTrendStats(data: TrendDataPoint[]): TrendStats {
  if (data.length < 2) {
    const current = data[data.length - 1]?.value || 0;
    return { current, previous: 0, change: 0, trend: "stable" };
  }

  const nonZeroData = data.filter((d) => d.value !== 0);
  if (nonZeroData.length < 2) {
    const current = nonZeroData[nonZeroData.length - 1]?.value || 0;
    return { current, previous: 0, change: 0, trend: "stable" };
  }

  const current = nonZeroData[nonZeroData.length - 1].value;
  const previous = nonZeroData[nonZeroData.length - 2].value;
  const change =
    previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : 0;
  const trend = change > 5 ? "up" : change < -5 ? "down" : "stable";

  return { current, previous, change: Math.round(change), trend };
}
