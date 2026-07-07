"use client";

import { createElement } from "react";
import { Medal } from "@phosphor-icons/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getIconOrDefault } from "@/lib/icons/registry";
import type { Badge, BadgeTier } from "@/lib/gamification/types";

interface BadgeIconProps {
  badge: Badge;
  size?: "sm" | "md" | "lg" | "xl";
  showTooltip?: boolean;
  isEarned?: boolean;
  className?: string;
}

const tierColors: Record<BadgeTier, { bg: string; border: string; icon: string }> = {
  bronze: {
    bg: "bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-800 dark:to-amber-700",
    border: "border-amber-400/50",
    icon: "text-amber-700 dark:text-amber-300",
  },
  silver: {
    bg: "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600",
    border: "border-gray-400/50 dark:border-gray-500/50",
    icon: "text-muted-foreground",
  },
  gold: {
    bg: "bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-800 dark:to-yellow-700",
    border: "border-yellow-400/50",
    icon: "text-yellow-600 dark:text-yellow-300",
  },
  platinum: {
    bg: "bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-800 dark:to-blue-800",
    border: "border-purple-400/50",
    icon: "text-purple-600 dark:text-purple-300",
  },
};

const sizeConfig = {
  sm: {
    container: "h-6 w-6",
    iconSize: 12,
  },
  md: {
    container: "h-8 w-8",
    iconSize: 16,
  },
  lg: {
    container: "h-10 w-10",
    iconSize: 20,
  },
  xl: {
    container: "h-14 w-14",
    iconSize: 28,
  },
};

export function BadgeIcon({
  badge,
  size = "md",
  showTooltip = true,
  isEarned = true,
  className,
}: BadgeIconProps) {
  const iconComponent = getIconOrDefault(badge.icon, Medal);
  const tier = badge.tier || "bronze";
  const colors = tierColors[tier];
  const sizeClasses = sizeConfig[size];

  const badgeElement = (
    <div
      className={cn(
        "relative rounded-full flex items-center justify-center border-2 shadow-sm transition-all",
        colors.bg,
        colors.border,
        sizeClasses.container,
        isEarned
          ? "opacity-100"
          : "opacity-40 grayscale",
        isEarned && "hover:scale-110 hover:shadow-md",
        className
      )}
    >
      {createElement(iconComponent, {
        size: sizeClasses.iconSize,
        weight: "fill",
        className: colors.icon,
      })}
      {tier === "platinum" && isEarned && (
        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 opacity-30 blur-sm -z-10" />
      )}
    </div>
  );

  if (!showTooltip) {
    return badgeElement;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badgeElement}</TooltipTrigger>
        <TooltipContent className="max-w-[200px]">
          <div className="text-sm font-medium">{badge.name}</div>
          <div className="text-xs text-muted-foreground">{badge.description}</div>
          {!isEarned && (
            <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">Not yet earned</div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
