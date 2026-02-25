"use client";

import { SealCheck } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TierBadgeProps {
  isEnterprise: boolean;
  isPro: boolean;
  size?: "sm" | "md";
}

const sizeConfig = {
  sm: { icon: "h-4 w-4", text: "text-[10px] px-1.5 py-0" },
  md: { icon: "h-5 w-5", text: "text-xs px-2 py-0.5" },
};

export function TierBadge({ isEnterprise, isPro, size = "sm" }: TierBadgeProps) {
  const cfg = sizeConfig[size];

  if (isEnterprise) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <SealCheck
              weight="fill"
              aria-label="Verified Enterprise"
              className={cn(cfg.icon, "text-repwell-teal-300 shrink-0")}
            />
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Verified Enterprise</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isPro) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className={cn(
                cfg.text,
                "font-semibold bg-repwell-sage-100 text-repwell-teal-400 shrink-0"
              )}
            >
              Pro
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Pro Member</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
}
