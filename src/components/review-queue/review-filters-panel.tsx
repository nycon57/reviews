"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  MagnifyingGlass as Search,
  DownloadSimple as Download,
  Calendar as CalendarIcon,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatReviewSource } from "@/lib/reviews/source-labels";
import { REVIEW_STATUS_FILTER_LABELS } from "@/components/reviews/review-status-badge";
import { useReviewQueue } from "./review-queue-context";

export function ReviewFiltersPanel() {
  const { state, actions } = useReviewQueue();

  // Derive available sources from the user's actual review data
  const availableSources = state.aggregatedStats?.bySource
    ? Object.keys(state.aggregatedStats.bySource).filter((s) => state.aggregatedStats!.bySource[s] > 0)
    : [];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={actions.handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reviews by text, customer name..."
            value={state.filters.searchQuery}
            onChange={(e) => actions.dispatch({ type: "SET_SEARCH", value: e.target.value })}
            className={cn("pl-10", state.filters.searchQuery && "pr-9")}
          />
          {state.filters.searchQuery && (
            <button
              type="button"
              onClick={() => {
                actions.dispatch({ type: "SET_SEARCH", value: "" });
                actions.handleFilterChange();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" disabled={state.isPending}>
          Search
        </Button>
      </form>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={state.filters.statusFilter}
          onValueChange={(v) => { actions.dispatch({ type: "SET_STATUS", value: v }); actions.handleFilterChange(); }}
        >
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">{REVIEW_STATUS_FILTER_LABELS.pending}</SelectItem>
            <SelectItem value="approved">{REVIEW_STATUS_FILTER_LABELS.approved}</SelectItem>
            <SelectItem value="rejected">{REVIEW_STATUS_FILTER_LABELS.rejected}</SelectItem>
            <SelectItem value="archived">{REVIEW_STATUS_FILTER_LABELS.archived}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={state.filters.sourceFilter}
          onValueChange={(v) => { actions.dispatch({ type: "SET_SOURCE", value: v }); actions.handleFilterChange(); }}
        >
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {availableSources.map((source) => (
              <SelectItem key={source} value={source}>
                {formatReviewSource(source)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={state.filters.featuredFilter}
          onValueChange={(v) => { actions.dispatch({ type: "SET_FEATURED", value: v }); actions.handleFilterChange(); }}
        >
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Featured" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reviews</SelectItem>
            <SelectItem value="yes">Featured</SelectItem>
            <SelectItem value="no">Not Featured</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 w-[220px] justify-start text-left font-normal",
                !state.filters.dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
              {state.filters.dateRange?.from ? (
                state.filters.dateRange.to ? (
                  <>
                    {format(state.filters.dateRange.from, "LLL dd")} &ndash; {format(state.filters.dateRange.to, "LLL dd")}
                  </>
                ) : (
                  format(state.filters.dateRange.from, "LLL dd, y")
                )
              ) : (
                "Date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={state.filters.dateRange?.from}
              selected={state.filters.dateRange}
              onSelect={(range) => {
                actions.dispatch({ type: "SET_DATE_RANGE", value: range });
                if (range?.from && range?.to) {
                  actions.handleFilterChange();
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {state.hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-9" onClick={actions.clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}

        <div className="ml-auto">
          <Button variant="outline" size="sm" className="h-9" onClick={actions.handleExport} disabled={state.isPending}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}
