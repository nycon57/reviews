"use client";

import { useState, useCallback, useTransition, useMemo, useRef } from "react";
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
  MagnifyingGlass as Search,
  MapPin,
  Star,
  SlidersHorizontal,
  X,
  Users,
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  Crosshair,
  Info,
} from "@phosphor-icons/react";
import { DirectoryCard } from "./directory-card";
import { DirectoryMapView } from "./directory-map-view";
import { MessageModal } from "@/app/pro/[slug]/components/message-modal";
import {
  searchProfessionals,
  type DirectoryProfessional,
  type DirectorySearchResult,
  type SearchFilters,
  type MapBounds,
} from "@/lib/directory/actions";
import type { IndustryType } from "@/lib/industry/types";

interface DirectorySearchProps {
  initialResults: DirectoryProfessional[];
  initialCount: number;
  availableStates: { value: string; label: string }[];
  /** Pre-filter by industry (for industry-specific directory pages) */
  industryFilter?: IndustryType;
}

export function DirectorySearch({
  initialResults,
  initialCount,
  availableStates,
  industryFilter,
}: DirectorySearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Core state
  const [results, setResults] = useState<DirectoryProfessional[]>(initialResults);
  const [totalCount, setTotalCount] = useState(initialCount);
  // Nearby fallback state
  const [isNearbyFallback, setIsNearbyFallback] = useState(false);
  const [searchCenter, setSearchCenter] = useState<DirectorySearchResult["searchCenter"]>();
  // Form state
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [state, setState] = useState(searchParams.get("state") || "");
  const [minRating, setMinRating] = useState(searchParams.get("rating") || "");
  const [radius, setRadius] = useState(searchParams.get("radius") || "50");
  const [sortBy, setSortBy] = useState<"rating" | "reviews" | "name">(
    (searchParams.get("sort") as "rating" | "reviews" | "name") || "rating"
  );
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));

  // Message modal state
  const [messageProfessional, setMessageProfessional] = useState<{ id: string; name: string } | null>(null);

  // Map interaction state
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [hasUserMovedMap, setHasUserMovedMap] = useState(false);
  const [isSearchingArea, setIsSearchingArea] = useState(false);
  const initialBoundsRef = useRef<MapBounds | null>(null);

  // Hover sync state
  const [hoveredProfessionalId, setHoveredProfessionalId] = useState<string | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const pageSize = 20;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Client-side filter professionals by current map bounds for instant feedback.
  // Professionals WITHOUT coordinates are always kept — they just won't appear on the map.
  const filteredByBounds = useMemo(() => {
    if (!mapBounds) return results;
    return results.filter((prof) => {
      // Keep professionals with no coordinates (e.g. individual users without branch)
      if (prof.latitude == null || prof.longitude == null) return true;
      return (
        prof.latitude >= mapBounds.south &&
        prof.latitude <= mapBounds.north &&
        prof.longitude >= mapBounds.west &&
        prof.longitude <= mapBounds.east
      );
    });
  }, [results, mapBounds]);

  // Build current filters object
  const getCurrentFilters = useCallback((): SearchFilters => {
    return {
      query: query || undefined,
      city: city || undefined,
      state: state || undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      radius: radius ? parseInt(radius, 10) : 50,
      sortBy,
      sortOrder: "desc",
      industry: industryFilter,
    };
  }, [query, city, state, minRating, radius, sortBy, industryFilter]);

  // Update URL with current filters
  const updateURL = useCallback(
    (filters: SearchFilters, newPage: number) => {
      const params = new URLSearchParams();

      if (filters.query) params.set("q", filters.query);
      if (filters.city) params.set("city", filters.city);
      if (filters.state) params.set("state", filters.state);
      if (filters.minRating) params.set("rating", filters.minRating.toString());
      if (filters.radius && filters.radius !== 50) params.set("radius", filters.radius.toString());
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
        const result = await searchProfessionals(filters, searchPage, pageSize);
        if (result.success && result.data) {
          setResults(result.data.professionals);
          setTotalCount(result.data.totalCount);
          setIsNearbyFallback(result.data.isNearbyFallback ?? false);
          setSearchCenter(result.data.searchCenter);
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
      setHasUserMovedMap(false); // Reset map moved state on new search
      performSearch(filters, 1);
      updateURL(filters, 1);
    },
    [getCurrentFilters, performSearch, updateURL]
  );

  // Handle filter changes
  const handleFilterChange = useCallback(
    (key: keyof SearchFilters | "radius", value: string) => {
      const filters = getCurrentFilters();

      if (key === "query") setQuery(value);
      if (key === "city") setCity(value);
      if (key === "state") setState(value);
      if (key === "minRating") setMinRating(value);
      if (key === "radius") setRadius(value);
      if (key === "sortBy") setSortBy(value as "rating" | "reviews" | "name");

      const newFilters = {
        ...filters,
        [key]: key === "radius" ? (value ? parseInt(value, 10) : 50) : (value || undefined),
      };
      setPage(1);
      setHasUserMovedMap(false);
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
      // Scroll to top of list, not page
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    },
    [getCurrentFilters, performSearch, updateURL]
  );

  // Handle map bounds change
  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    // Store initial bounds if not set
    if (!initialBoundsRef.current) {
      initialBoundsRef.current = bounds;
    }

    setMapBounds(bounds);

    // Check if user has significantly moved the map from initial position
    if (initialBoundsRef.current) {
      const threshold = 0.01; // Small threshold for detecting intentional movement
      const hasMoved =
        Math.abs(bounds.north - initialBoundsRef.current.north) > threshold ||
        Math.abs(bounds.south - initialBoundsRef.current.south) > threshold ||
        Math.abs(bounds.east - initialBoundsRef.current.east) > threshold ||
        Math.abs(bounds.west - initialBoundsRef.current.west) > threshold;

      if (hasMoved) {
        setHasUserMovedMap(true);
      }
    }
  }, []);

  // Handle "Search this area" button click
  const handleSearchThisArea = useCallback(async () => {
    if (!mapBounds) return;

    setIsSearchingArea(true);
    const filters = { ...getCurrentFilters(), bounds: mapBounds };

    const result = await searchProfessionals(filters, 1, pageSize);
    if (result.success && result.data) {
      setResults(result.data.professionals);
      setTotalCount(result.data.totalCount);
      setPage(1);
    }

    setHasUserMovedMap(false);
    setIsSearchingArea(false);
    // Update initial bounds to current position
    initialBoundsRef.current = mapBounds;
  }, [mapBounds, getCurrentFilters]);

  // Handle marker click - scroll list to that card
  const handleSelectProfessional = useCallback((id: string) => {
    setSelectedProfessionalId(id);

    // Find and scroll to the card in the list
    const cardElement = document.getElementById(`directory-card-${id}`);
    if (cardElement && listRef.current) {
      cardElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setQuery("");
    setCity("");
    setState("");
    setMinRating("");
    setRadius("50");
    setSortBy("rating");
    setPage(1);
    setHasUserMovedMap(false);
    setIsNearbyFallback(false);
    setSearchCenter(undefined);

    performSearch({}, 1);
    router.push(pathname, { scroll: false });
  }, [pathname, router, performSearch]);

  // Check if any filters are active
  const hasActiveFilters = query || city || state || minRating;

  // Professionals to display in the list (client-side filtered by bounds)
  const displayedProfessionals = filteredByBounds;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Side: Filters + Results List */}
      <div className="w-full lg:w-[420px] xl:w-[480px] flex flex-col">
        {/* Search & Filters */}
        <Card className="flex-shrink-0">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="space-y-3">
              {/* Main Search Row */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" disabled={isPending} size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {/* Location Row */}
              <div className="flex gap-2">
                <div className="relative flex-1">
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
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {availableStates.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Row */}
              <div className="flex gap-2">
                <Select
                  value={minRating || "any"}
                  onValueChange={(v) => handleFilterChange("minRating", v === "any" ? "" : v)}
                >
                  <SelectTrigger className="flex-1 text-left">
                    <Star className="mr-2 h-4 w-4 text-yellow-400" />
                    <SelectValue placeholder="Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Rating</SelectItem>
                    <SelectItem value="4.5">4.5+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                    <SelectItem value="3.5">3.5+</SelectItem>
                  </SelectContent>
                </Select>

                {city && (
                  <Select
                    value={radius}
                    onValueChange={(v) => handleFilterChange("radius", v)}
                  >
                    <SelectTrigger className="w-24 text-left">
                      <Crosshair className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Radius" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 mi</SelectItem>
                      <SelectItem value="25">25 mi</SelectItem>
                      <SelectItem value="50">50 mi</SelectItem>
                      <SelectItem value="100">100 mi</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Select
                  value={sortBy}
                  onValueChange={(v) => handleFilterChange("sortBy", v)}
                >
                  <SelectTrigger className="flex-1 text-left">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Top Rated</SelectItem>
                    <SelectItem value="reviews">Most Reviews</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t">
                  {query && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      {query}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleFilterChange("query", "")}
                      />
                    </Badge>
                  )}
                  {city && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      {city}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleFilterChange("city", "")}
                      />
                    </Badge>
                  )}
                  {state && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      {state}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleFilterChange("state", "")}
                      />
                    </Badge>
                  )}
                  {minRating && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      {minRating}+★
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleFilterChange("minRating", "")}
                      />
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 text-xs px-1.5"
                    onClick={clearFilters}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {isPending ? (
                "Searching..."
              ) : (
                <>
                  <span className="font-medium text-foreground">
                    {displayedProfessionals.length}
                  </span>
                  {displayedProfessionals.length !== totalCount && (
                    <span className="text-muted-foreground/70"> of {totalCount}</span>
                  )}
                  {" "}professionals
                </>
              )}
            </span>
          </div>
          {totalPages > 1 && (
            <span className="text-xs text-muted-foreground">
              {page}/{totalPages}
            </span>
          )}
        </div>

        {/* Nearby fallback banner */}
        {isNearbyFallback && !isPending && (
          <div className="flex items-start gap-2 rounded-lg border border-repwell-teal-300/30 bg-repwell-teal-300/5 px-3 py-2.5 mb-3">
            <Info className="h-4 w-4 text-repwell-teal-300 shrink-0 mt-0.5" />
            <p className="text-xs text-repwell-teal-400 leading-relaxed">
              No exact match for <span className="font-semibold">{city}</span>.
              {" "}Showing nearest results
              {radius ? ` within ${radius} miles` : ""}.
            </p>
            <button
              onClick={() => setIsNearbyFallback(false)}
              className="shrink-0 ml-auto"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5 text-repwell-teal-300 hover:text-repwell-teal-400" />
            </button>
          </div>
        )}

        {/* Scrollable Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto lg:max-h-[calc(100vh-280px)] space-y-3 pr-1"
        >
          {isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : displayedProfessionals.length > 0 ? (
            <div className="space-y-3">
              {displayedProfessionals.map((professional) => (
                <div
                  key={professional.id}
                  id={`directory-card-${professional.id}`}
                  onMouseEnter={() => setHoveredProfessionalId(professional.id)}
                  onMouseLeave={() => setHoveredProfessionalId(null)}
                  className={`transition-all duration-200 ${
                    selectedProfessionalId === professional.id
                      ? "ring-2 ring-repwell-teal-300 rounded-lg"
                      : ""
                  }`}
                >
                  <DirectoryCard
                    professional={professional}
                    variant="list"
                    isHovered={hoveredProfessionalId === professional.id}
                    onMessage={() => setMessageProfessional({ id: professional.id, name: professional.full_name })}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-3 text-base font-medium">No professionals found</h3>
                <p className="mt-1 text-sm text-muted-foreground text-center">
                  Try adjusting filters or search area
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" className="mt-3" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {!isPending && totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 py-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
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
                      className="w-8 h-8 p-0"
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
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Sticky Map */}
      <div className="flex-1 lg:sticky lg:top-4 lg:self-start">
        <DirectoryMapView
          professionals={results}
          onBoundsChange={handleBoundsChange}
          onSearchThisArea={handleSearchThisArea}
          showSearchButton={hasUserMovedMap}
          isSearchingArea={isSearchingArea}
          onSelectProfessional={handleSelectProfessional}
          selectedProfessionalId={selectedProfessionalId}
          hoveredProfessionalId={hoveredProfessionalId}
          heightClass="h-[400px] lg:h-[calc(100vh-120px)]"
          searchCenter={searchCenter}
        />
      </div>

      {/* Message Modal */}
      <MessageModal
        open={messageProfessional !== null}
        onOpenChange={(open) => {
          if (!open) setMessageProfessional(null);
        }}
        professionalId={messageProfessional?.id ?? ""}
        professionalName={messageProfessional?.name ?? ""}
      />
    </div>
  );
}
