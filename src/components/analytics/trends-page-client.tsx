"use client";

import { useState } from "react";
import { TrendsDashboard } from "@/app/(dashboard)/dashboard/analytics/trends/trends-dashboard";
import { AdminTrendsDashboard } from "@/app/(dashboard)/dashboard/admin/trends/admin-trends-dashboard";
import { ScopeSelector, type AnalyticsScope } from "./scope-selector";

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

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trends</h1>
          <p className="text-muted-foreground">
            Monitor performance trends and patterns over time
          </p>
        </div>
        {userRole !== "user" && (
          <ScopeSelector
            userRole={userRole}
            value={scope}
            onValueChange={setScope}
          />
        )}
      </div>

      {scope === "organization" ? (
        <AdminTrendsDashboard />
      ) : (
        <TrendsDashboard />
      )}
    </div>
  );
}
