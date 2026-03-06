"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface StatusBadgeEntry {
  label: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
  icon?: React.ReactNode;
}

export interface StatusBadgeProps {
  status: string;
  config: Record<string, StatusBadgeEntry>;
  className?: string;
}

export function StatusBadge({ status, config, className }: StatusBadgeProps) {
  const entry = config[status];
  if (!entry) return null;

  return (
    <Badge
      variant={entry.variant ?? "outline"}
      className={cn("gap-1", entry.className, className)}
    >
      {entry.icon}
      {entry.label}
    </Badge>
  );
}
