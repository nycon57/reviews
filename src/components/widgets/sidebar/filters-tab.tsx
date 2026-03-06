"use client";

import { useState, useCallback, useEffect, useMemo, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFilteredReviewCount } from "@/lib/widgets/actions";
import { SwitchField, ChipInput } from "./shared-fields";
import type { WidgetConfigJson } from "@/lib/widgets/schemas";
import type { WidgetEntityType } from "@/lib/widgets/types";

interface FiltersTabProps {
  config: WidgetConfigJson;
  entityType: WidgetEntityType;
  entityId: string | null;
  onConfigChange: (config: Partial<WidgetConfigJson>) => void;
}

export function FiltersTab({ config, entityType, entityId, onConfigChange }: FiltersTabProps) {
  const filters = config.filters ?? {};
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [isCountLoading, startCountTransition] = useTransition();

  const update = (field: string, value: unknown) => {
    onConfigChange({ filters: { ...filters, [field]: value } });
  };

  // Fetch matching review count whenever filters change
  const fetchCount = useCallback(() => {
    startCountTransition(async () => {
      const result = await getFilteredReviewCount({
        entityType,
        entityId,
        filters: {
          minRating: filters.minRating,
          dateRange: filters.dateRange,
          sources: filters.sources,
          featuredOnly: filters.featuredOnly,
          keywords: filters.keywords,
          loanTypes: filters.loanTypes,
        },
      });
      if (result.success) {
        setMatchCount(result.data.count);
      }
    });
  }, [entityType, entityId, filters.minRating, filters.dateRange, filters.sources, filters.featuredOnly, filters.keywords, filters.loanTypes]);

  // Re-fetch count when filters change
  const filtersKey = useMemo(
    () => JSON.stringify({ entityType, entityId, filters }),
    [entityType, entityId, filters]
  );
  useEffect(() => { fetchCount(); }, [filtersKey, fetchCount]);

  const dateRange = filters.dateRange ?? {};

  return (
    <div className="space-y-4">
      {/* Matching review count banner */}
      <div className="flex items-center justify-between rounded-md border border-repwell-sage-200/50 bg-repwell-sage-100/20 dark:bg-repwell-teal-300/10 px-3 py-2">
        <span className="text-xs font-medium text-label">
          Matching reviews
        </span>
        <span className="text-sm font-semibold text-heading tabular-nums">
          {isCountLoading ? (
            <span className="inline-block w-6 h-4 bg-repwell-sage-200/40 rounded animate-pulse" />
          ) : (
            matchCount ?? "\u2014"
          )}
        </span>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">
          Minimum Rating ({filters.minRating ?? 1} stars)
        </Label>
        <Slider
          value={[filters.minRating ?? 1]}
          onValueChange={([v]) => update("minRating", v)}
          min={1}
          max={5}
          step={1}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">
          Max Reviews ({filters.maxReviews ?? 50})
        </Label>
        <Slider
          value={[filters.maxReviews ?? 50]}
          onValueChange={([v]) => update("maxReviews", v)}
          min={1}
          max={100}
          step={1}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Sort Order</Label>
        <Select
          value={filters.sortOrder ?? "newest"}
          onValueChange={(v) => update("sortOrder", v)}
        >
          <SelectTrigger className="h-8 text-xs mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="highest">Highest Rated</SelectItem>
            <SelectItem value="lowest">Lowest Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <SwitchField
        label="Featured Only"
        checked={filters.featuredOnly === true}
        onChange={(v) => update("featuredOnly", v)}
      />

      <div>
        <Label className="text-xs text-muted-foreground">Sources</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {["google", "zillow", "internal", "facebook"].map((source) => {
            const isActive = !filters.sources || filters.sources.includes(source);
            return (
              <button
                key={source}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  const current = filters.sources ?? ["google", "zillow", "internal", "facebook"];
                  if (isActive) {
                    if (current.length <= 1) return;
                    update("sources", current.filter((s) => s !== source));
                  } else {
                    update("sources", [...current, source]);
                  }
                }}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors capitalize ${
                  isActive
                    ? "bg-repwell-teal-300 text-white border-repwell-teal-300"
                    : "bg-card text-muted-foreground border-border hover:border-repwell-sage-200"
                }`}
              >
                {source === "internal" ? "RepWell" : source.charAt(0).toUpperCase() + source.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <Label className="text-sm font-semibold text-heading mb-3 block">
          Date Range
        </Label>
        <div className="mb-3">
          <Label className="text-xs text-muted-foreground">Preset</Label>
          <Select
            value={dateRange.preset ?? "all_time"}
            onValueChange={(v) => {
              if (v === "custom") {
                update("dateRange", { ...dateRange, preset: "custom" });
              } else {
                update("dateRange", { preset: v, start: undefined, end: undefined });
              }
            }}
          >
            <SelectTrigger className="h-8 text-xs mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_time">All Time</SelectItem>
              <SelectItem value="last_30d">Last 30 Days</SelectItem>
              <SelectItem value="last_90d">Last 90 Days</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(dateRange.preset === "custom" || (!dateRange.preset && (dateRange.start || dateRange.end))) && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input
                type="date"
                value={dateRange.start ?? ""}
                onChange={(e) =>
                  update("dateRange", { ...dateRange, preset: "custom", start: e.target.value || undefined })
                }
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input
                type="date"
                value={dateRange.end ?? ""}
                onChange={(e) =>
                  update("dateRange", { ...dateRange, preset: "custom", end: e.target.value || undefined })
                }
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border pt-4">
        <Label className="text-xs text-muted-foreground mb-2 block">Keywords</Label>
        <ChipInput
          values={filters.keywords ?? []}
          onChange={(v) => update("keywords", v)}
          placeholder="Add keyword\u2026"
        />
      </div>

      <div className="border-t border-border pt-4">
        <Label className="text-xs text-muted-foreground">Loan Types</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {["Purchase", "Refinance", "VA", "FHA", "Jumbo", "USDA", "Conventional"].map((loanType) => {
            const currentTypes = filters.loanTypes ?? [];
            const isActive = currentTypes.includes(loanType);
            return (
              <button
                key={loanType}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  if (isActive) {
                    update("loanTypes", currentTypes.filter((t) => t !== loanType));
                  } else {
                    update("loanTypes", [...currentTypes, loanType]);
                  }
                }}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors capitalize ${
                  isActive
                    ? "bg-repwell-teal-300 text-white border-repwell-teal-300"
                    : "bg-card text-muted-foreground border-border hover:border-repwell-sage-200"
                }`}
              >
                {loanType}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
