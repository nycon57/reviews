"use client";

import { House } from "@phosphor-icons/react";
import { IconContainer } from "@/components/shared";

interface DashboardHeaderProps {
  userName?: string | null;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const firstName = userName?.split(" ")[0] || "there";

  return (
    <div className="flex items-center gap-3">
      <IconContainer size="lg" bg="subtle">
        <House className="h-6 w-6 text-repwell-teal-300 dark:text-repwell-sage-200" />
      </IconContainer>
      <div>
        <h1 className="font-display text-heading-lg font-bold leading-tight tracking-tight text-heading">
          Hello, {firstName}
        </h1>
        <p className="text-sm leading-snug text-label">
          Here&apos;s an overview of your performance.
        </p>
      </div>
    </div>
  );
}
