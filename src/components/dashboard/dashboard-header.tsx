"use client";

import { Button } from "@/components/ui/button";
import { PaperPlaneRight as Send, House } from "@phosphor-icons/react";

interface DashboardHeaderProps {
  userName?: string | null;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const firstName = userName?.split(" ")[0] || "there";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
          <House className="h-5 w-5 text-repwell-teal-300" />
        </div>
        <div>
          <h1 className="text-heading-lg font-bold tracking-tight text-repwell-teal-500">
            Hello, {firstName}
          </h1>
          <p className="text-body-base text-repwell-teal-400 mt-1">
            Here&apos;s an overview of your performance.
          </p>
        </div>
      </div>
      <Button variant="default" asChild>
        <a href="/dashboard/distribution">
          <Send className="mr-2 h-4 w-4" />
          Send Survey
        </a>
      </Button>
    </div>
  );
}
