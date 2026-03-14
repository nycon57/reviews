"use client";

import { useState, useCallback, useEffect, useMemo, useTransition } from "react";
import { CalendarBlank } from "@phosphor-icons/react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFilteredReviewCount } from "@/lib/widgets/actions";
import { SwitchField } from "./shared-fields";
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
  const [maxReviewsInput, setMaxReviewsInput] = useState(String(filters.maxReviews ?? 50));
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
          featuredOnly: filters.featuredOnly,
        },
      });
      if (result.success) {
        setMatchCount(result.data.count);
      }
    });
  }, [entityType, entityId, filters.minRating, filters.dateRange, filters.featuredOnly]);

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
        <Label className="text-xs text-muted-foreground">Minimum Rating</Label>
        <Select
          value={String(filters.minRating ?? 1)}
          onValueChange={(v) => update("minRating", Number(v))}
        >
          <SelectTrigger className="h-8 text-xs mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} {n === 1 ? "star" : "stars"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Max Reviews</Label>
        <input
          type="number"
          min={1}
          max={100}
          value={maxReviewsInput}
          onChange={(e) => {
            setMaxReviewsInput(e.target.value);
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v) && v >= 1 && v <= 100) update("maxReviews", v);
          }}
          onBlur={() => {
            const v = parseInt(maxReviewsInput, 10);
            if (isNaN(v) || v < 1) {
              setMaxReviewsInput(String(filters.maxReviews ?? 50));
            } else if (v > 100) {
              setMaxReviewsInput("100");
              update("maxReviews", 100);
            }
          }}
          className="mt-1 flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
            <SelectItem value="featured">Featured First</SelectItem>
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


      <div className="border-t border-border pt-4">
        <Label className="text-sm font-semibold text-heading mb-3 block">
          Date Range
        </Label>
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
          <SelectTrigger className="h-8 text-xs">
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
        {(dateRange.preset === "custom" || (!dateRange.preset && (dateRange.start || dateRange.end))) && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 justify-start text-xs font-normal ${!dateRange.start ? "text-muted-foreground" : ""}`}
                >
                  <CalendarBlank className="mr-1.5 size-3.5" />
                  {dateRange.start ? format(new Date(dateRange.start), "MMM d, yyyy") : "Start"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.start ? new Date(dateRange.start) : undefined}
                  onSelect={(date) =>
                    update("dateRange", {
                      ...dateRange,
                      preset: "custom",
                      start: date ? format(date, "yyyy-MM-dd") : undefined,
                    })
                  }
                  disabled={(date) =>
                    dateRange.end ? date > new Date(dateRange.end) : false
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 justify-start text-xs font-normal ${!dateRange.end ? "text-muted-foreground" : ""}`}
                >
                  <CalendarBlank className="mr-1.5 size-3.5" />
                  {dateRange.end ? format(new Date(dateRange.end), "MMM d, yyyy") : "End"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.end ? new Date(dateRange.end) : undefined}
                  onSelect={(date) =>
                    update("dateRange", {
                      ...dateRange,
                      preset: "custom",
                      end: date ? format(date, "yyyy-MM-dd") : undefined,
                    })
                  }
                  disabled={(date) =>
                    dateRange.start ? date < new Date(dateRange.start) : false
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

    </div>
  );
}
