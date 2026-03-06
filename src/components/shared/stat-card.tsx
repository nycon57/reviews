"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  suffix?: string;
  icon?: React.ReactNode;
  change?: number;
  changePeriod?: string;
  subtitle?: string;
  isLoading?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  suffix,
  icon,
  change,
  changePeriod = "vs last period",
  subtitle,
  isLoading,
  className,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-repwell-teal-300/10">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold tracking-tight text-heading">
                {typeof value === "number" ? value.toLocaleString() : value}
              </span>
              {suffix && (
                <span className="text-base font-normal text-muted-foreground">
                  {suffix}
                </span>
              )}
              {change !== undefined && change !== 0 && (
                <span
                  className={cn(
                    "flex items-center text-xs font-medium",
                    change > 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {change > 0 ? (
                    <ArrowUpRight className="mr-0.5 h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="mr-0.5 h-3 w-3" />
                  )}
                  {change > 0 ? "+" : ""}
                  {change}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {change !== undefined && change !== 0 && changePeriod && (
              <p className="text-xs text-muted-foreground">{changePeriod}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const GRID_COLS: Record<number, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
  6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-6",
};

export interface StatCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export function StatCardGrid({
  children,
  columns = 4,
  className,
}: StatCardGridProps) {
  return (
    <div className={cn("grid gap-4", GRID_COLS[columns], className)}>
      {children}
    </div>
  );
}
