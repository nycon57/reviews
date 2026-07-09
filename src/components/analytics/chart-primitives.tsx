"use client";

import type { CSSProperties } from "react";
import {
  Minus,
  TrendDown as TrendingDown,
  TrendUp as TrendingUp,
} from "@phosphor-icons/react";
import type { TrendStats } from "./trend-utils";

export const CHART_TOOLTIP_STYLE: CSSProperties = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--popover-foreground))",
};

export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
] as const;

export const PIE_COLORS = CHART_COLORS;

type SimpleTrendIndicatorProps = {
  value: number;
  suffix?: string;
  size?: "sm" | "md";
};

type StatsTrendIndicatorProps = {
  stats: TrendStats;
};

type DirectionTrendIndicatorProps = {
  direction: "up" | "down" | "stable";
  value?: string;
};

export type TrendIndicatorProps =
  | SimpleTrendIndicatorProps
  | StatsTrendIndicatorProps
  | DirectionTrendIndicatorProps;

function isStatsTrendProps(
  props: TrendIndicatorProps
): props is StatsTrendIndicatorProps {
  return "stats" in props;
}

function isDirectionTrendProps(
  props: TrendIndicatorProps
): props is DirectionTrendIndicatorProps {
  return "direction" in props;
}

export function TrendIndicator(props: TrendIndicatorProps) {
  if (isStatsTrendProps(props)) {
    const { stats } = props;

    if (stats.trend === "up") {
      return (
        <div className="flex items-center gap-1 text-green-700">
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

  if (isDirectionTrendProps(props)) {
    if (props.direction === "up") {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs text-green-700 dark:text-green-400">
          <TrendingUp className="h-3 w-3" weight="bold" />
          {props.value}
        </span>
      );
    }

    if (props.direction === "down") {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs text-red-600 dark:text-red-400">
          <TrendingDown className="h-3 w-3" weight="bold" />
          {props.value}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        {props.value || "Stable"}
      </span>
    );
  }

  const { value, suffix = "%", size = "md" } = props;
  const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const textClass = size === "sm" ? "text-xs font-medium" : "text-sm font-medium";

  if (value > 0) {
    return (
      <div className="flex items-center gap-1 text-green-700">
        <TrendingUp className={iconClass} />
        <span className={textClass}>+{value}{suffix}</span>
      </div>
    );
  }

  if (value < 0) {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <TrendingDown className={iconClass} />
        <span className={textClass}>{value}{suffix}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Minus className={iconClass} />
      <span className={textClass}>0{suffix}</span>
    </div>
  );
}
