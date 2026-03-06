"use client";

import { Code } from "@phosphor-icons/react";
import { WidgetCard } from "./widget-card";
import type { WidgetConfig } from "@/lib/widgets/types";

interface WidgetListProps {
  widgets: WidgetConfig[];
}

export function WidgetList({ widgets }: WidgetListProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Code className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-heading">Widget Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize and embed review widgets on your website
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {widgets.map((widget) => (
          <WidgetCard key={widget.id} widget={widget} />
        ))}
      </div>
    </div>
  );
}
