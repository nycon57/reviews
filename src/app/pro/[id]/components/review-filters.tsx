"use client";

import { useState, useCallback } from "react";
import { MagnifyingGlass, Star, FunnelSimple, X } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  source: string | null;
  sort: "newest" | "oldest" | "highest" | "lowest";
}

interface ReviewFiltersProps {
  filters: ReviewFilters;
  onFiltersChange: (filters: ReviewFilters) => void;
  sources: string[];
  totalCount: number;
  filteredCount: number;
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

export function ReviewFiltersBar({
  filters,
  onFiltersChange,
  sources,
  totalCount,
  filteredCount,
  className,
}: ReviewFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  const handleSourceChange = useCallback(
    (value: string) => {
      const source = value === "all" ? null : value;
      onFiltersChange({ ...filters, source });
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
      source: null,
      sort: "newest",
    });
  }, [onFiltersChange]);

  const hasActiveFilters =
    filters.search || filters.rating !== null || filters.source !== null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search reviews..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(isExpanded && "bg-repwell-sage-100")}
        >
          <FunnelSimple className="h-4 w-4" />
        </Button>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="flex flex-wrap gap-3">
          <Select
            value={filters.rating?.toString() || "all"}
            onValueChange={handleRatingChange}
          >
            <SelectTrigger className="w-[140px]">
              <Star className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              {RATING_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {sources.length > 1 && (
            <Select
              value={filters.source || "all"}
              onValueChange={handleSourceChange}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source.charAt(0).toUpperCase() + source.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={filters.sort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort" />
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
      )}

      {/* Active Filters & Count */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {hasActiveFilters && (
            <>
              {filters.rating !== null && (
                <Badge variant="secondary" className="gap-1">
                  {filters.rating === 5 ? "5 Stars" : `${filters.rating}+ Stars`}
                  <button
                    onClick={() => onFiltersChange({ ...filters, rating: null })}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.source && (
                <Badge variant="secondary" className="gap-1">
                  {filters.source}
                  <button
                    onClick={() => onFiltersChange({ ...filters, source: null })}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.search && (
                <Badge variant="secondary" className="gap-1">
                  &quot;{filters.search}&quot;
                  <button
                    onClick={() => onFiltersChange({ ...filters, search: "" })}
                    className="ml-1 hover:text-destructive"
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
            </>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {filteredCount === totalCount
            ? `${totalCount} reviews`
            : `Showing ${filteredCount} of ${totalCount} reviews`}
        </p>
      </div>
    </div>
  );
}
