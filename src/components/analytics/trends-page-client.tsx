"use client";

import { useState } from "react";
import { TrendUp } from "@phosphor-icons/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendsDashboard } from "@/app/(dashboard)/dashboard/analytics/trends/trends-dashboard";
import { AdminTrendsDashboard } from "@/components/analytics/staff/admin-trends-dashboard";
import { ScopeSelector, type AnalyticsScope } from "./scope-selector";

export type TimeRange = "3m" | "6m" | "12m" | "24m";

interface TrendsPageClientProps {
  userRole: "admin" | "manager" | "user";
}

function getDefaultScope(role: "admin" | "manager" | "user"): AnalyticsScope {
  switch (role) {
    case "admin":
      return "organization";
    case "manager":
      return "team";
    default:
      return "personal";
  }
}

export function TrendsPageClient({ userRole }: TrendsPageClientProps) {
  const [scope, setScope] = useState<AnalyticsScope>(
    getDefaultScope(userRole)
  );
  const [timeRange, setTimeRange] = useState<TimeRange>("6m");

  const isAdminScope = scope === "organization" && userRole === "admin";

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-teal-300/10">
            <TrendUp className="h-5 w-5 text-repwell-teal-300" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Trends</h1>
            <p className="text-muted-foreground">
              Monitor performance trends and patterns over time
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {userRole !== "user" && (
            <ScopeSelector
              userRole={userRole}
              value={scope}
              onValueChange={setScope}
            />
          )}
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">Last 3 months</SelectItem>
              <SelectItem value="6m">Last 6 months</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
              <SelectItem value="24m">Last 24 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isAdminScope ? (
        <AdminTrendsDashboard timeRange={timeRange} />
      ) : (
        <TrendsDashboard scope={scope} timeRange={timeRange} />
      )}
    </div>
  );
}
