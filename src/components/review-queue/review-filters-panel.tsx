"use client";

import { Card, CardContent } from "@/components/ui/card";
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
  Funnel as Filter,
  X,
  ArrowCounterClockwise as RefreshCcw,
  MagnifyingGlass as Search,
  DownloadSimple as Download,
  Calendar as CalendarIcon,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useReviewQueue } from "./review-queue-context";

export function ReviewFiltersPanel() {
  const { state, actions } = useReviewQueue();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <form onSubmit={actions.handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reviews by text, customer name..."
                value={state.filters.searchQuery}
                onChange={(e) => actions.dispatch({ type: "SET_SEARCH", value: e.target.value })}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={state.isPending}>
              Search
            </Button>
          </form>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filters
            </div>

            <Select
              value={state.filters.statusFilter}
              onValueChange={(v) => { actions.dispatch({ type: "SET_STATUS", value: v }); actions.handleFilterChange(); }}
            >
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
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
                <SelectItem value="internal">Survey</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="zillow">Zillow</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="yelp">Yelp</SelectItem>
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

            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={actions.refreshReviews} disabled={state.isPending}>
                <RefreshCcw className={cn("h-4 w-4", state.isPending && "animate-spin")} />
              </Button>
              <Button variant="outline" size="sm" className="h-9" onClick={actions.handleExport} disabled={state.isPending}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
