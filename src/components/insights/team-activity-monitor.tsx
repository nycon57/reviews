"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UsersThree,
  Warning,
  WarningCircle,
  CheckCircle,
  Clock,
  ChatText,
  EnvelopeSimple,
  TrendDown,
} from "@phosphor-icons/react";
import type { TeamActivityMonitor, LOActivityStatus } from "@/lib/ai";
import { cn } from "@/lib/utils";

interface TeamActivityMonitorProps {
  data: TeamActivityMonitor;
}

const statusConfig = {
  active: {
    label: "Active",
    class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle,
  },
  slowing: {
    label: "Slowing",
    class: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    icon: Clock,
  },
  inactive: {
    label: "Inactive",
    class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: WarningCircle,
  },
};

const defaultStatus = {
  label: "Unknown",
  class: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  icon: Clock,
};

function LORow({ member }: { member: LOActivityStatus }) {
  const status = statusConfig[member.activityStatus] ?? defaultStatus;
  const StatusIcon = status.icon;
  const hasCriticalAlerts = member.alerts.some((a) => a.severity === "critical");

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        hasCriticalAlerts && "border-red-200 dark:border-red-900/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusIcon
              className={cn(
                "h-4 w-4 flex-shrink-0",
                member.activityStatus === "active" && "text-green-600",
                member.activityStatus === "slowing" && "text-amber-600",
                member.activityStatus === "inactive" && "text-red-600"
              )}
            />
            <span className="truncate text-sm font-medium">
              {member.userName}
            </span>
            <Badge variant="secondary" className={cn("text-[10px]", status.class)}>
              {status.label}
            </Badge>
          </div>

          {/* Key metrics row */}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {member.unrespondedReviewCount > 0 && (
              <span className="flex items-center gap-1">
                <ChatText className="h-3 w-3" />
                {member.unrespondedReviewCount} unresponded
              </span>
            )}
            <span className="flex items-center gap-1">
              <EnvelopeSimple className="h-3 w-3" />
              {member.reviewRequestsThisWeek} requests/wk
            </span>
            {member.avgResponseTimeHours > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {member.avgResponseTimeHours}h avg response
              </span>
            )}
            {member.ratingTrend.avg30Day > 0 && (
              <span className="flex items-center gap-1">
                {member.ratingTrend.avg30Day < member.ratingTrend.avg60Day ? (
                  <TrendDown className="h-3 w-3 text-red-500" />
                ) : null}
                {member.ratingTrend.avg30Day} avg rating
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {member.alerts.length > 0 && (
        <div className="mt-2 space-y-1">
          {member.alerts.map((alert, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-1.5 rounded px-2 py-1 text-xs",
                alert.severity === "critical"
                  ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
              )}
            >
              {alert.severity === "critical" ? (
                <WarningCircle className="h-3 w-3 flex-shrink-0" weight="fill" />
              ) : (
                <Warning className="h-3 w-3 flex-shrink-0" />
              )}
              {alert.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TeamActivityMonitorCard({ data }: TeamActivityMonitorProps) {
  if (data.teamMembers.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <UsersThree className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">
              Team Activity Monitor
            </CardTitle>
          </div>
          <CardDescription>No team members found</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersThree className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">
              Team Activity Monitor
            </CardTitle>
          </div>
          <div className="flex gap-1.5">
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            >
              {data.orgMetrics.activeCount} active
            </Badge>
            {data.orgMetrics.slowingCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
              >
                {data.orgMetrics.slowingCount} slowing
              </Badge>
            )}
            {data.orgMetrics.inactiveCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              >
                {data.orgMetrics.inactiveCount} inactive
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          Org avg: {data.orgMetrics.avgResponseTimeHours}h response time |{" "}
          {data.orgMetrics.avgRequestsPerWeek} requests/week
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.teamMembers.map((member) => (
          <LORow key={member.userId} member={member} />
        ))}
      </CardContent>
    </Card>
  );
}
