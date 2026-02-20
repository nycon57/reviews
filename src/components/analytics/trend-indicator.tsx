import {
  TrendUp as TrendingUp,
  TrendDown as TrendingDown,
  Minus,
} from "@phosphor-icons/react";
import type { TrendStats } from "./trend-utils";

export function TrendIndicator({ stats }: { stats: TrendStats }) {
  if (stats.trend === "up") {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <TrendingUp className="h-4 w-4" />
        <span className="text-sm font-medium">+{stats.change}%</span>
      </div>
    );
  }
  if (stats.trend === "down") {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <TrendingDown className="h-4 w-4" />
        <span className="text-sm font-medium">{stats.change}%</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Minus className="h-4 w-4" />
      <span className="text-sm font-medium">Stable</span>
    </div>
  );
}
