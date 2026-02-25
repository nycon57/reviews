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
  high: { badge: "bg-red-100 text-red-800", label: "Urgent" },
  medium: { badge: "bg-amber-100 text-amber-800", label: "Important" },
  low: { badge: "bg-green-100 text-green-800", label: "FYI" },
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
      <Card className="border border-green-200/60 bg-green-50/30 shadow-soft">
        <CardHeader className="bg-gradient-to-r from-green-50/50 to-transparent border-b border-green-200/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100/50">
              <Lightning className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Action Items</CardTitle>
              <CardDescription>You&apos;re all caught up! No actions needed right now.</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border border-border shadow-soft">
      <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50">
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
        {data.map((action) => {
          const defaultConfig = { badge: "bg-gray-100 text-gray-800", label: "Info" };
          const config = priorityConfig[action.priority] ?? defaultConfig;
          const Icon = actionIcons[action.actionType] || Lightning;

          const content = (
            <div
              className={cn(
                "group flex items-start gap-3 rounded-lg border p-3 transition-colors",
                action.priority === "high" && "border-red-200 bg-red-50/50",
                action.priority === "medium" && "border-amber-200 bg-amber-50/50",
                action.priority === "low" && "border-green-200 bg-green-50/50",
                action.actionUrl && "hover:border-primary/50 cursor-pointer"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                  action.priority === "high" && "bg-red-100 text-red-600",
                  action.priority === "medium" && "bg-amber-100 text-amber-600",
                  action.priority === "low" && "bg-green-100 text-green-600"
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
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {action.description}
                </p>
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
      </CardContent>
    </Card>
  );
}
