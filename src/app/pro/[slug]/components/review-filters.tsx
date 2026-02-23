"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  MagnifyingGlass,
  X,
  Check,
  CaretUpDown,
} from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ReviewFilters {
  search: string;
  rating: number | null;
  sources: string[];
  dateRange: DateRange | undefined;
  sort: "newest" | "oldest" | "highest" | "lowest";
}

interface ReviewFiltersProps {
  filters: ReviewFilters;
  onFiltersChange: (filters: ReviewFilters) => void;
  sources: string[];
  className?: string;
}

const RATING_OPTIONS = [
  { value: "all", label: "All Ratings" },
  { value: "5", label: "5 Stars" },
  { value: "4", label: "4+ Stars" },
  { value: "3", label: "3+ Stars" },
  { value: "2", label: "2+ Stars" },
  { value: "1", label: "1+ Stars" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
];

function formatSourceLabel(source: string) {
  return source.charAt(0).toUpperCase() + source.slice(1);
}

export function ReviewFiltersBar({
  filters,
  onFiltersChange,
  sources,
  className,
}: ReviewFiltersProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const handleSearchChange = useCallback(
    (value: string) => {
      onFiltersChange({ ...filters, search: value });
    },
    [filters, onFiltersChange]
  );

  const handleRatingChange = useCallback(
    (value: string) => {
      const rating = value === "all" ? null : parseInt(value);
      onFiltersChange({ ...filters, rating });
    },
    [filters, onFiltersChange]
  );

  const handleSourceToggle = useCallback(
    (source: string) => {
      const current = filters.sources;
      const next = current.includes(source)
        ? current.filter((s) => s !== source)
        : [...current, source];
      onFiltersChange({ ...filters, sources: next });
    },
    [filters, onFiltersChange]
  );

  const handleDateRangeChange = useCallback(
    (range: DateRange | undefined) => {
      onFiltersChange({ ...filters, dateRange: range });
    },
    [filters, onFiltersChange]
  );

  const handleSortChange = useCallback(
    (value: string) => {
      onFiltersChange({ ...filters, sort: value as ReviewFilters["sort"] });
    },
    [filters, onFiltersChange]
  );

  const clearFilters = useCallback(() => {
    onFiltersChange({
      search: "",
      rating: null,
      sources: [],
      dateRange: undefined,
      sort: "newest",
    });
  }, [onFiltersChange]);

  const hasActiveFilters =
    filters.search ||
    filters.rating !== null ||
    filters.sources.length > 0 ||
    filters.dateRange?.from;

  // Date range label
  const dateLabel = filters.dateRange?.from
    ? filters.dateRange.to
      ? `${format(filters.dateRange.from, "MMM d")} - ${format(filters.dateRange.to, "MMM d")}`
      : format(filters.dateRange.from, "MMM d, yyyy")
    : "Date Range";

  // Source trigger label
  const sourceLabel =
    filters.sources.length === 0
      ? "Source"
      : filters.sources.length === 1
        ? formatSourceLabel(filters.sources[0])
        : `${filters.sources.length} Sources`;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search reviews..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Inline Filters Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Rating */}
        <Select
          value={filters.rating?.toString() || "all"}
          onValueChange={handleRatingChange}
        >
          <SelectTrigger className="h-8 w-auto gap-1 text-xs px-2.5 [&>svg:last-child]:hidden">
            <SelectValue placeholder="Rating" />
            <CaretUpDown className="h-3 w-3 shrink-0 opacity-50" />
          </SelectTrigger>
          <SelectContent>
            {RATING_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex h-8 w-auto items-center gap-1 rounded-md border border-input bg-background px-2.5 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                filters.dateRange?.from ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {dateLabel}
              <CaretUpDown className="h-3 w-3 shrink-0 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={filters.dateRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={1}
              disabled={{ after: new Date() }}
            />
            {filters.dateRange?.from && (
              <div className="border-t px-3 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs w-full"
                  onClick={() => handleDateRangeChange(undefined)}
                >
                  Clear dates
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Source Multi-Select */}
        {sources.length > 0 && (
          <Popover open={sourcesOpen} onOpenChange={setSourcesOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-8 w-auto items-center gap-1 rounded-md border border-input bg-background px-2.5 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  filters.sources.length > 0 ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {sourceLabel}
                <CaretUpDown className="h-3 w-3 shrink-0 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-2" align="start">
              <div className="space-y-1">
                {sources.map((source) => {
                  const checked = filters.sources.includes(source);
                  return (
                    <button
                      key={source}
                      type="button"
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                      onClick={() => handleSourceToggle(source)}
                    >
                      <Checkbox checked={checked} className="pointer-events-none" />
                      <span className="flex-1 text-left">{formatSourceLabel(source)}</span>
                      {checked && <Check className="h-3.5 w-3.5 text-repwell-teal-400" />}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Sort */}
        <Select value={filters.sort} onValueChange={handleSortChange}>
          <SelectTrigger className="h-8 w-auto gap-1 text-xs px-2.5 [&>svg:last-child]:hidden">
            <SelectValue placeholder="Sort" />
            <CaretUpDown className="h-3 w-3 shrink-0 opacity-50" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.rating !== null && (
            <Badge variant="secondary" className="gap-1 text-xs h-6">
              {filters.rating === 5 ? "5 Stars" : `${filters.rating}+ Stars`}
              <button
                onClick={() => onFiltersChange({ ...filters, rating: null })}
                className="ml-0.5 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.dateRange?.from && (
            <Badge variant="secondary" className="gap-1 text-xs h-6">
              {dateLabel}
              <button
                onClick={() => onFiltersChange({ ...filters, dateRange: undefined })}
                className="ml-0.5 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.sources.map((source) => (
            <Badge key={source} variant="secondary" className="gap-1 text-xs h-6">
              {formatSourceLabel(source)}
              <button
                onClick={() => handleSourceToggle(source)}
                className="ml-0.5 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.search && (
            <Badge variant="secondary" className="gap-1 text-xs h-6">
              &quot;{filters.search}&quot;
              <button
                onClick={() => onFiltersChange({ ...filters, search: "" })}
                className="ml-0.5 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 px-2 text-xs text-muted-foreground"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
