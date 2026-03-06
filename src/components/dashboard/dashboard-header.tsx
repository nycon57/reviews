"use client";

import { House } from "@phosphor-icons/react";

interface DashboardHeaderProps {
  userName?: string | null;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const firstName = userName?.split(" ")[0] || "there";

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
        <House className="h-6 w-6 text-repwell-teal-300" />
      </div>
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
