"use client";

import {
  Star,
  Trophy,
  Medal,
  Crown,
  Shield,
  Heart,
  Fire,
  TrendUp,
  ThumbsUp,
  EnvelopeSimple,
  type IconProps,
} from "@phosphor-icons/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Badge, BadgeTier } from "@/lib/gamification/types";

interface BadgeIconProps {
  badge: Badge;
  size?: "sm" | "md" | "lg" | "xl";
  showTooltip?: boolean;
  isEarned?: boolean;
  className?: string;
}

type PhosphorIcon = React.ComponentType<IconProps>;

const iconMap: Record<string, PhosphorIcon> = {
  star: Star,
  trophy: Trophy,
  medal: Medal,
  award: Medal,
  crown: Crown,
  shield: Shield,
  heart: Heart,
  flame: Fire,
  "trending-up": TrendUp,
  "thumbs-up": ThumbsUp,
  "mail-check": EnvelopeSimple,
};

const tierColors: Record<BadgeTier, { bg: string; border: string; icon: string }> = {
  bronze: {
    bg: "bg-gradient-to-br from-amber-100 to-amber-200",
    border: "border-amber-400/50",
    icon: "text-amber-700",
  },
  silver: {
    bg: "bg-gradient-to-br from-gray-100 to-gray-200",
    border: "border-gray-400/50",
    icon: "text-gray-600",
  },
  gold: {
    bg: "bg-gradient-to-br from-yellow-100 to-yellow-200",
    border: "border-yellow-400/50",
    icon: "text-yellow-600",
  },
  platinum: {
    bg: "bg-gradient-to-br from-purple-100 to-blue-100",
    border: "border-purple-400/50",
    icon: "text-purple-600",
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
  const Icon = iconMap[badge.icon] || Medal;
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
      <Icon size={sizeClasses.iconSize} weight="fill" className={colors.icon} />
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
            <div className="text-xs text-amber-600 mt-1">Not yet earned</div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
