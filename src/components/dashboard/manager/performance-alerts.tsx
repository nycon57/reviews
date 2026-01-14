"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle, TrendingDown, Star, ChevronRight } from "lucide-react";
import type { LoanOfficerComparison } from "@/lib/dashboard";

interface PerformanceAlertsProps {
  data: LoanOfficerComparison[];
}

export function PerformanceAlerts({ data }: PerformanceAlertsProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAlertReason = (lo: LoanOfficerComparison) => {
    const reasons: string[] = [];

    if (lo.averageRating < 3.5) {
      reasons.push(`Rating below 3.5 (${lo.averageRating.toFixed(1)})`);
    }
    if (lo.npsScore < 0) {
      reasons.push(`Negative NPS (${lo.npsScore})`);
    }
    if (lo.totalReviews < 5) {
      reasons.push(`Low review count (${lo.totalReviews})`);
    }
    if (lo.responseRate < 30) {
      reasons.push(`Low response rate (${lo.responseRate}%)`);
    }

    return reasons.length > 0 ? reasons.join(", ") : "Performance metrics need improvement";
  };

  // Filter to only show at_risk first, then needs_attention
  const sortedData = [...data].sort((a, b) => {
    if (a.performanceStatus === "at_risk" && b.performanceStatus !== "at_risk") return -1;
    if (a.performanceStatus !== "at_risk" && b.performanceStatus === "at_risk") return 1;
    return 0;
  });

  if (data.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <TrendingDown className="h-5 w-5" />
            Performance Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <span>All team members are performing well</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 dark:border-amber-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-5 w-5" />
          Performance Alerts
          <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-normal text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
            {data.length} member{data.length !== 1 ? "s" : ""}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedData.slice(0, 5).map((lo) => (
          <div
            key={lo.id}
            className={`rounded-lg border p-3 ${
              lo.performanceStatus === "at_risk"
                ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20"
                : "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20"
            }`}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={lo.photoUrl || undefined} alt={lo.fullName} />
                <AvatarFallback>{getInitials(lo.fullName)}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate">{lo.fullName}</span>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {lo.averageRating.toFixed(1)}
                  </div>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {getAlertReason(lo)}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{lo.totalReviews} reviews</span>
                    <span>NPS: {lo.npsScore}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" asChild>
                    <Link href={`/dashboard/team/${lo.id}`}>
                      View
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {data.length > 5 && (
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/dashboard/manager?filter=needs_attention">
              View all {data.length} members needing attention
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
