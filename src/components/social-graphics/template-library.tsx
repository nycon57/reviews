"use client";

import { useState, useMemo } from "react";
import { getAllTemplateMetadata } from "@/lib/social-graphics/templates";
import type { TemplateId, TemplateMetadata } from "@/lib/social-graphics/types";
import { TemplatePreviewCard } from "./template-preview-card";
import { cn } from "@/lib/utils";

interface TemplateLibraryProps {
  onSelectTemplate: (templateId: TemplateId) => void;
  selectedTemplateId?: TemplateId | null;
}

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "review", label: "Reviews" },
  { id: "stats", label: "Stats" },
  { id: "team", label: "Team" },
  { id: "seasonal", label: "Seasonal" },
] as const;

export function TemplateLibrary({
  onSelectTemplate,
  selectedTemplateId,
}: TemplateLibraryProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const allTemplates = useMemo(() => getAllTemplateMetadata(), []);

  const filtered = useMemo(() => {
    if (categoryFilter === "all") return allTemplates;
    return allTemplates.filter((t) => t.category === categoryFilter);
  }, [allTemplates, categoryFilter]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Template Library
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose a template to get started
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategoryFilter(cat.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              categoryFilter === cat.id
                ? "bg-repwell-teal-300 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((meta: TemplateMetadata) => (
          <TemplatePreviewCard
            key={meta.id}
            metadata={meta}
            selected={selectedTemplateId === meta.id}
            onSelect={(id) => onSelectTemplate(id as TemplateId)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No templates in this category
          </p>
        </div>
      )}
    </div>
  );
}
