"use client";

import type { TemplateMetadata } from "@/lib/social-graphics/types";
import { cn } from "@/lib/utils";

interface TemplatePreviewCardProps {
  metadata: TemplateMetadata;
  selected?: boolean;
  onSelect: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  review: "bg-repwell-teal-300/10 text-repwell-teal-300",
  stats: "bg-amber-500/10 text-amber-600",
  team: "bg-blue-500/10 text-blue-600",
  seasonal: "bg-rose-500/10 text-rose-600",
};

const categoryIcons: Record<string, string> = {
  review: "\u2b50",
  stats: "\ud83d\udcca",
  team: "\ud83d\udc65",
  seasonal: "\ud83c\udf89",
};

export function TemplatePreviewCard({
  metadata,
  selected,
  onSelect,
}: TemplatePreviewCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(metadata.id)}
      className={cn(
        "group relative flex flex-col rounded-xl border text-left transition-all",
        "hover:border-repwell-teal-300 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2",
        selected
          ? "border-repwell-teal-300 ring-2 ring-repwell-teal-300/20 shadow-md"
          : "border-border"
      )}
    >
      {/* Thumbnail */}
      <div
        className="flex h-32 items-center justify-center rounded-t-xl"
        style={{ backgroundColor: metadata.previewBgColor }}
      >
        <span className="text-4xl opacity-80">
          {categoryIcons[metadata.category]}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground leading-tight">
            {metadata.name}
          </h3>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
              categoryColors[metadata.category]
            )}
          >
            {metadata.category}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {metadata.description}
        </p>
        {metadata.minReviews > 0 && (
          <p className="text-[10px] text-muted-foreground/70">
            Requires {metadata.minReviews} review
            {metadata.minReviews > 1 ? "s" : ""}
            {metadata.requiresLoanOfficer ? " + LO data" : ""}
          </p>
        )}
      </div>

      {/* Selected indicator */}
      {selected && (
        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-repwell-teal-300 text-white">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 6L5 9L10 3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </button>
  );
}
