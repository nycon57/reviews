"use client";

import { useTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  X,
  Clock,
  ArrowRight,
  Sparkle,
  ChatText,
  EnvelopeSimple,
  Warning,
  Trophy,
  TrendUp,
  Lightning,
  UserCircle,
  PaperPlaneRight,
} from "@phosphor-icons/react";
import type { UserTask } from "@/lib/tasks";
import { completeTask, dismissTask, snoozeTask } from "@/lib/tasks";

interface TaskCardProps {
  task: UserTask;
}

const priorityConfig = {
  high: {
    badge: "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400",
    label: "Urgent",
    border: "border-red-200 bg-red-50/50 dark:border-red-800/60 dark:bg-red-950/20",
    icon: "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400",
  },
  medium: {
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400",
    label: "Important",
    border: "border-amber-200 bg-amber-50/50 dark:border-amber-800/60 dark:bg-amber-950/20",
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
  },
  low: {
    badge: "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400",
    label: "FYI",
    border: "border-green-200 bg-green-50/50 dark:border-green-800/60 dark:bg-green-950/20",
    icon: "bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400",
  },
};

const taskIcons: Record<string, typeof Lightning> = {
  respond_review: ChatText,
  pending_responses: EnvelopeSimple,
  incomplete_profile: UserCircle,
  no_recent_requests: PaperPlaneRight,
  survey_velocity_decline: TrendUp,
  negative_theme_spike: Warning,
  rating_improvement: Trophy,
};

const SNOOZE_OPTIONS = [
  { label: "1 day", hours: 24 as const },
  { label: "3 days", hours: 72 as const },
  { label: "1 week", hours: 168 as const },
];

export function TaskCard({ task }: TaskCardProps) {
  const [isPending, startTransition] = useTransition();
  const config = priorityConfig[task.priority];
  const Icon = taskIcons[task.taskType] || Lightning;

  const handleComplete = () => {
    startTransition(() => {
      completeTask(task.id);
    });
  };

  const handleDismiss = () => {
    startTransition(() => {
      dismissTask(task.id);
    });
  };

  const handleSnooze = (hours: 24 | 72 | 168) => {
    startTransition(() => {
      snoozeTask(task.id, hours);
    });
  };

  const content = (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border p-3 transition-all duration-150",
        config.border,
        task.actionUrl && "hover:border-repwell-teal-300/40",
        isPending && "opacity-50 pointer-events-none"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
          config.icon
        )}
      >
        <Icon className="h-4 w-4" weight="bold" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-heading">{task.title}</span>
          <Badge variant="secondary" className={cn("text-[10px]", config.badge)}>
            {config.label}
          </Badge>
          {task.source === "ai" && (
            <Sparkle className="h-3.5 w-3.5 text-repwell-teal-300" weight="fill" />
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
          {task.description}
        </p>

        {/* Actions */}
        {task.status === "pending" && (
          <div className="mt-2 flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-green-700 hover:text-green-800 hover:bg-green-100/50 dark:text-green-400 dark:hover:bg-green-950/30"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleComplete();
              }}
            >
              <Check className="mr-1 h-3.5 w-3.5" weight="bold" />
              Done
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDismiss();
              }}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Dismiss
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <Clock className="mr-1 h-3.5 w-3.5" />
                  Snooze
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {SNOOZE_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.hours}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSnooze(opt.hours);
                    }}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Completed/dismissed indicator */}
        {task.status === "completed" && (
          <div className="mt-1.5 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <Check className="h-3 w-3" weight="bold" />
            Completed
          </div>
        )}
        {task.status === "dismissed" && (
          <div className="mt-1.5 text-xs text-muted-foreground">
            Dismissed
          </div>
        )}
      </div>

      {/* Arrow for linked tasks */}
      {task.actionUrl && task.status === "pending" && (
        <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      )}
    </div>
  );

  if (task.actionUrl && task.status === "pending") {
    return (
      <Link href={task.actionUrl} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
