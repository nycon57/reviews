"use client";

import type { ReactNode } from "react";

interface BaseSidebarPanelProps {
  title: string;
  children: ReactNode;
}

export function BaseSidebarPanel({ title, children }: BaseSidebarPanelProps) {
  return (
    <div className="p-4">
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-col gap-5 mb-6">{children}</div>
    </div>
  );
}
