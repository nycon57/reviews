"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lightning,
  ChatText,
  EnvelopeSimple,
  Warning,
  Trophy,
  TrendUp,
  ArrowRight,
} from "@phosphor-icons/react";
import type { SmartActionItem } from "@/lib/ai";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SmartActionsCardProps {
  data: SmartActionItem[];
}

const priorityConfig = {
  high: { badge: "border-destructive/20 bg-destructive/10 text-destructive", label: "Urgent" },
  medium: { badge: "border-warning/20 bg-warning/10 text-warning", label: "Important" },
  low: { badge: "border-success/20 bg-success/10 text-success", label: "FYI" },
};

const actionIcons: Record<string, typeof Lightning> = {
  respond_review: ChatText,
  pending_responses: EnvelopeSimple,
  send_requests: EnvelopeSimple,
  theme_alert: Warning,
  milestone: Trophy,
  improvement: TrendUp,
};

export function SmartActionsCard({ data }: SmartActionsCardProps) {
  if (data.length === 0) {
    return (
      <Card className="border border-success/20 bg-success/5 shadow-soft">
        <CardHeader variant="accent-green">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
              <Lightning className="h-5 w-5 text-success" />
            </div>
            <div>
              <CardTitle className="text-lg">Action Items</CardTitle>
              <CardDescription>
                You&apos;re all caught up! No actions needed right now.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border border-border shadow-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
              <Lightning className="h-5 w-5 text-repwell-teal-300" />
            </div>
            <div>
              <CardTitle className="text-lg">Action Items</CardTitle>
              <CardDescription>Prioritized tasks to improve your performance</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {data.length} item{data.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.slice(0, 3).map((action) => {
          const defaultConfig = { badge: "bg-muted text-foreground", label: "Info" };
          const config = priorityConfig[action.priority] ?? defaultConfig;
          const Icon = actionIcons[action.actionType] || Lightning;

          const content = (
            <div
              className={cn(
                "group flex items-start gap-3 rounded-lg border p-3 transition-colors",
                action.priority === "high" && "border-destructive/20 bg-destructive/5",
                action.priority === "medium" && "border-warning/20 bg-warning/5",
                action.priority === "low" && "border-success/20 bg-success/5",
                action.actionUrl && "cursor-pointer hover:border-primary/50"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                  action.priority === "high" && "bg-destructive/10 text-destructive",
                  action.priority === "medium" && "bg-warning/10 text-warning",
                  action.priority === "low" && "bg-success/10 text-success"
                )}
              >
                <Icon className="h-4 w-4" weight="bold" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{action.title}</span>
                  <Badge variant="secondary" className={cn("text-[10px]", config.badge)}>
                    {config.label}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{action.description}</p>
              </div>
              {action.actionUrl && (
                <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              )}
            </div>
          );

          if (action.actionUrl) {
            return (
              <Link key={action.id} href={action.actionUrl} className="block">
                {content}
              </Link>
            );
          }

          return <div key={action.id}>{content}</div>;
        })}

        {/* Link to full tasks page */}
        <Link
          href="/dashboard/tasks"
          className="flex items-center justify-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-xs font-medium text-repwell-teal-300 transition-colors hover:border-repwell-teal-300/30 hover:bg-repwell-teal-300/5"
        >
          View all tasks
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
