"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MapPin,
  Star,
  SlidersHorizontal,
  X,
  Users,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
} from "lucide-react";
import { DirectoryCard } from "./directory-card";
import { DirectoryMapView } from "./directory-map-view";
import {
  searchLoanOfficers,
  type DirectoryLoanOfficer,
  type SearchFilters,
} from "@/lib/directory/actions";

interface DirectorySearchProps {
  initialResults: DirectoryLoanOfficer[];
  initialCount: number;
  availableStates: { value: string; label: string }[];
}

export function DirectorySearch({
  initialResults,
  initialCount,
  availableStates,
}: DirectorySearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // State
  const [results, setResults] = useState<DirectoryLoanOfficer[]>(initialResults);
  const [totalCount, setTotalCount] = useState(initialCount);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Form state
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [state, setState] = useState(searchParams.get("state") || "");
  const [minRating, setMinRating] = useState(searchParams.get("rating") || "");
  const [sortBy, setSortBy] = useState<"rating" | "reviews" | "name">(
    (searchParams.get("sort") as "rating" | "reviews" | "name") || "rating"
  );
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));

  const pageSize = 20;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Build current filters object
  const getCurrentFilters = useCallback((): SearchFilters => {
    return {
      query: query || undefined,
      city: city || undefined,
      state: state || undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      sortBy,
      sortOrder: "desc",
    };
  }, [query, city, state, minRating, sortBy]);

  // Update URL with current filters
  const updateURL = useCallback(
    (filters: SearchFilters, newPage: number) => {
      const params = new URLSearchParams();

      if (filters.query) params.set("q", filters.query);
      if (filters.city) params.set("city", filters.city);
      if (filters.state) params.set("state", filters.state);
      if (filters.minRating) params.set("rating", filters.minRating.toString());
      if (filters.sortBy && filters.sortBy !== "rating") {
        params.set("sort", filters.sortBy);
      }
      if (newPage > 1) params.set("page", newPage.toString());

      const newURL = params.toString() ? `${pathname}?${params}` : pathname;
      router.push(newURL, { scroll: false });
    },
    [pathname, router]
  );

  // Perform search
  const performSearch = useCallback(
    async (filters: SearchFilters, searchPage: number) => {
      startTransition(async () => {
        const result = await searchLoanOfficers(filters, searchPage, pageSize);
        if (result.success && result.data) {
          setResults(result.data.loanOfficers);
          setTotalCount(result.data.totalCount);
        }
      });
    },
    []
  );

  // Handle search form submission
  const handleSearch = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const filters = getCurrentFilters();
      setPage(1);
      performSearch(filters, 1);
      updateURL(filters, 1);
    },
    [getCurrentFilters, performSearch, updateURL]
  );

  // Handle filter changes
  const handleFilterChange = useCallback(
    (key: keyof SearchFilters, value: string) => {
      const filters = getCurrentFilters();

      if (key === "state") setState(value);
      if (key === "minRating") setMinRating(value);
      if (key === "sortBy") setSortBy(value as "rating" | "reviews" | "name");

      const newFilters = { ...filters, [key]: value || undefined };
      setPage(1);
      performSearch(newFilters, 1);
      updateURL(newFilters, 1);
    },
    [getCurrentFilters, performSearch, updateURL]
  );

  // Handle pagination
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      const filters = getCurrentFilters();
      performSearch(filters, newPage);
      updateURL(filters, newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [getCurrentFilters, performSearch, updateURL]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setQuery("");
    setCity("");
    setState("");
    setMinRating("");
    setSortBy("rating");
    setPage(1);

    performSearch({}, 1);
    router.push(pathname, { scroll: false });
  }, [pathname, router, performSearch]);

  // Check if any filters are active
  const hasActiveFilters = query || city || state || minRating;

  return (
    <div className="space-y-6">
      {/* Map View - Always visible at top */}
      <DirectoryMapView loanOfficers={results} />

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Main Search Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or specialty..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Location Inputs */}
              <div className="flex gap-2 flex-1 sm:flex-none">
                <div className="relative flex-1 sm:w-40">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={state || "all"}
                  onValueChange={(v) => handleFilterChange("state", v === "all" ? "" : v)}
                >
                  <SelectTrigger className="w-32 sm:w-40">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {availableStates.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Button */}
              <Button type="submit" disabled={isPending}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Rating Filter */}
              <Select
                value={minRating || "any"}
                onValueChange={(v) => handleFilterChange("minRating", v === "any" ? "" : v)}
              >
                <SelectTrigger className="w-36">
                  <Star className="mr-2 h-4 w-4 text-yellow-400" />
                  <SelectValue placeholder="Any Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Rating</SelectItem>
                  <SelectItem value="4.5">4.5+ Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="3.5">3.5+ Stars</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select
                value={sortBy}
                onValueChange={(v) => handleFilterChange("sortBy", v)}
              >
                <SelectTrigger className="w-40">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="reviews">Most Reviews</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {query && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {query}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => {
                        setQuery("");
                        handleSearch();
                      }}
                    />
                  </Badge>
                )}
                {city && (
                  <Badge variant="secondary" className="gap-1">
                    City: {city}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => {
                        setCity("");
                        handleSearch();
                      }}
                    />
                  </Badge>
                )}
                {state && (
                  <Badge variant="secondary" className="gap-1">
                    State: {state}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleFilterChange("state", "")}
                    />
                  </Badge>
                )}
                {minRating && (
                  <Badge variant="secondary" className="gap-1">
                    {minRating}+ Stars
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleFilterChange("minRating", "")}
                    />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={clearFilters}
                >
                  Clear all
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {isPending ? (
              "Searching..."
            ) : (
              <>
                <span className="font-medium text-foreground">{totalCount}</span>{" "}
                loan {totalCount === 1 ? "officer" : "officers"} found
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {totalPages > 1 && (
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
          )}
          {/* View Toggle */}
          <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`
                inline-flex items-center justify-center rounded-md px-2.5 py-1.5
                text-sm font-medium transition-all duration-200
                ${viewMode === "grid"
                  ? "bg-white text-repwell-teal-500 shadow-sm"
                  : "text-repwell-teal-400 hover:text-repwell-teal-500"
                }
              `}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`
                inline-flex items-center justify-center rounded-md px-2.5 py-1.5
                text-sm font-medium transition-all duration-200
                ${viewMode === "list"
                  ? "bg-white text-repwell-teal-500 shadow-sm"
                  : "text-repwell-teal-400 hover:text-repwell-teal-500"
                }
              `}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {isPending ? (
        <div className={
          viewMode === "grid"
            ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            : "flex flex-col gap-4"
        }>
          {Array.from({ length: viewMode === "grid" ? 6 : 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className={viewMode === "list" ? "p-4 sm:p-5" : "p-5"}>
                <div className="flex items-start gap-4">
                  <Skeleton className={viewMode === "list" ? "h-14 w-14 rounded-full" : "h-16 w-16 rounded-full"} />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  {viewMode === "list" && (
                    <Skeleton className="h-9 w-24 hidden sm:block" />
                  )}
                </div>
                {viewMode === "grid" && (
                  <>
                    <Skeleton className="mt-4 h-4 w-40" />
                    <Skeleton className="mt-3 h-12 w-full" />
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className={
          viewMode === "grid"
            ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            : "flex flex-col gap-4"
        }>
          {results.map((lo) => (
            <DirectoryCard key={lo.id} loanOfficer={lo} variant={viewMode} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No loan officers found</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
              Try adjusting your search criteria or clearing some filters to see more results.
            </p>
            {hasActiveFilters && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear all filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {!isPending && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => handlePageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="sm"
                  className="w-9"
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
