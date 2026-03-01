"use client";

import { useState } from "react";
import { LayoutGrid } from "lucide-react";
import { Code } from "@phosphor-icons/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WidgetCard } from "./widget-card";
import type { WidgetConfig } from "@/lib/widgets/types";
import { WIDGET_TYPE_LABELS } from "@/lib/widgets/constants";

interface WidgetListProps {
  widgets: WidgetConfig[];
}

export function WidgetList({ widgets }: WidgetListProps) {
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredWidgets = widgets.filter((w) => {
    if (typeFilter !== "all" && w.widget_type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Code className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-repwell-teal-500">Widget Templates</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Customize and embed review widgets on your website
            </p>
          </div>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="lo_review">{WIDGET_TYPE_LABELS.lo_review}</SelectItem>
            <SelectItem value="branch_review">{WIDGET_TYPE_LABELS.branch_review}</SelectItem>
            <SelectItem value="company_review">{WIDGET_TYPE_LABELS.company_review}</SelectItem>
            <SelectItem value="review_carousel">{WIDGET_TYPE_LABELS.review_carousel}</SelectItem>
            <SelectItem value="star_rating_badge">{WIDGET_TYPE_LABELS.star_rating_badge}</SelectItem>
            <SelectItem value="video_testimonial">{WIDGET_TYPE_LABELS.video_testimonial}</SelectItem>
            <SelectItem value="review_wall">{WIDGET_TYPE_LABELS.review_wall}</SelectItem>
            <SelectItem value="nps_score_badge">{WIDGET_TYPE_LABELS.nps_score_badge}</SelectItem>
            <SelectItem value="social_proof_banner">{WIDGET_TYPE_LABELS.social_proof_banner}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {filteredWidgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-xl bg-repwell-sage-100/50 flex items-center justify-center mb-4">
            <LayoutGrid size={24} className="text-repwell-teal-300" />
          </div>
          <h3 className="text-base font-semibold text-repwell-teal-500 mb-1">
            No widgets match your filter
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Try selecting a different widget type.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredWidgets.map((widget) => (
            <WidgetCard key={widget.id} widget={widget} />
          ))}
        </div>
      )}
    </div>
  );
}
