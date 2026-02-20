"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartBar } from "@phosphor-icons/react";

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

export function CompetitorPagesAnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>A/B Test Analytics</CardTitle>
          <CardDescription>
            Real-time A/B performance tracking for competitor comparison pages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-3">
            <ChartBar className="h-10 w-10 opacity-30" />
            <p className="text-sm font-medium">Analytics integration in progress</p>
            <p className="text-xs max-w-sm">
              Real visitor data and conversion tracking will appear here once the analytics pipeline is connected.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
