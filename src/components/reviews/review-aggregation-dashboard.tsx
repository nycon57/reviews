"use client";

import { useState, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Star,
  Search,
  Filter,
  RefreshCcw,
  Download,
  MoreHorizontal,
  Archive,
  Flag,
  ExternalLink,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Eye,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type {
  AggregatedReview,
  AggregatedReviewFilters,
  ReviewAggregationStats,
} from "@/lib/reviews/types";
import {
  getAggregatedReviews,
  bulkArchiveReviews,
  bulkToggleFeatured,
  exportReviews,
} from "@/lib/reviews/aggregation-actions";
import { ReviewDetailModal } from "./review-detail-modal";

interface ReviewAggregationDashboardProps {
  initialReviews: AggregatedReview[];
  initialTotal: number;
  initialStats: ReviewAggregationStats;
  loanOfficers: { id: string; fullName: string }[];
}

export function ReviewAggregationDashboard({
  initialReviews,
  initialTotal,
  initialStats,
  loanOfficers,
}: ReviewAggregationDashboardProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [total, setTotal] = useState(initialTotal);
  const [stats] = useState(initialStats);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [loanOfficerFilter, setLoanOfficerFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [page, setPage] = useState(1);
  const limit = 20;

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal
  const [selectedReview, setSelectedReview] = useState<AggregatedReview | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Show advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const buildFilters = useCallback((): AggregatedReviewFilters => {
    return {
      status: statusFilter === "all" ? "all" : (statusFilter as AggregatedReviewFilters["status"]),
      source: sourceFilter === "all" ? "all" : (sourceFilter as AggregatedReviewFilters["source"]),
      loanOfficerId: loanOfficerFilter === "all" ? undefined : loanOfficerFilter,
      search: searchQuery || undefined,
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      page,
      limit,
    };
  }, [statusFilter, sourceFilter, loanOfficerFilter, searchQuery, startDate, endDate, page]);

  const refreshReviews = useCallback(() => {
    startTransition(async () => {
      const result = await getAggregatedReviews(buildFilters());
      if (result.success && result.data) {
        setReviews(result.data.reviews);
        setTotal(result.data.total);
      }
    });
  }, [buildFilters]);

  const handleFilterChange = useCallback(() => {
    setPage(1);
    setSelectedIds(new Set());
    startTransition(async () => {
      const filters = buildFilters();
      filters.page = 1;
      const result = await getAggregatedReviews(filters);
      if (result.success && result.data) {
        setReviews(result.data.reviews);
        setTotal(result.data.total);
      }
    });
  }, [buildFilters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange();
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedIds(new Set());
    startTransition(async () => {
      const filters = buildFilters();
      filters.page = newPage;
      const result = await getAggregatedReviews(filters);
      if (result.success && result.data) {
        setReviews(result.data.reviews);
        setTotal(result.data.total);
      }
    });
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === reviews.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reviews.map((r) => r.id)));
    }
  };

  const handleBulkArchive = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    startTransition(async () => {
      const result = await bulkArchiveReviews(ids);
      if (result.success) {
        setSelectedIds(new Set());
        refreshReviews();
      }
    });
  };

  const handleBulkFeature = async (featured: boolean) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    startTransition(async () => {
      const result = await bulkToggleFeatured(ids, featured);
      if (result.success) {
        setSelectedIds(new Set());
        refreshReviews();
      }
    });
  };

  const handleExport = async () => {
    startTransition(async () => {
      const result = await exportReviews(buildFilters());
      if (result.success && result.data) {
        // Convert to CSV
        const headers = [
          "ID",
          "Source",
          "Rating",
          "Customer Name",
          "Review Text",
          "Loan Officer",
          "Status",
          "Review Date",
          "Response",
          "Sentiment",
        ];
        const csvRows = [headers.join(",")];

        for (const row of result.data) {
          const values = [
            row.id,
            row.source,
            row.rating.toString(),
            `"${(row.customerName || "").replace(/"/g, '""')}"`,
            `"${(row.text || "").replace(/"/g, '""')}"`,
            `"${row.loanOfficerName.replace(/"/g, '""')}"`,
            row.status,
            row.reviewDate,
            `"${(row.responseText || "").replace(/"/g, '""')}"`,
            row.sentimentLabel || "",
          ];
          csvRows.push(values.join(","));
        }

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `reviews-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  const openReviewDetail = (review: AggregatedReview) => {
    setSelectedReview(review);
    setDetailModalOpen(true);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setSourceFilter("all");
    setLoanOfficerFilter("all");
    setSearchQuery("");
    setStartDate(undefined);
    setEndDate(undefined);
    setPage(1);
    setSelectedIds(new Set());
    startTransition(async () => {
      const result = await getAggregatedReviews({ page: 1, limit });
      if (result.success && result.data) {
        setReviews(result.data.reviews);
        setTotal(result.data.total);
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status: AggregatedReview["status"]) => {
    const variants = {
      pending: "border-yellow-500 text-yellow-600 bg-yellow-50",
      approved: "border-green-500 text-green-600 bg-green-50",
      rejected: "border-red-500 text-red-600 bg-red-50",
      archived: "border-gray-400 text-gray-500 bg-gray-50",
    };
    return (
      <Badge variant="outline" className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      internal: "bg-blue-100 text-blue-700",
      google: "bg-red-100 text-red-700",
      zillow: "bg-purple-100 text-purple-700",
      facebook: "bg-indigo-100 text-indigo-700",
      yelp: "bg-orange-100 text-orange-700",
    };
    return (
      <Badge className={colors[source] || "bg-gray-100 text-gray-700"}>
        {source === "internal" ? "Survey" : source.charAt(0).toUpperCase() + source.slice(1)}
      </Badge>
    );
  };

  const totalPages = Math.ceil(total / limit);
  const hasActiveFilters =
    statusFilter !== "all" ||
    sourceFilter !== "all" ||
    loanOfficerFilter !== "all" ||
    searchQuery ||
    startDate ||
    endDate;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              {stats.averageRating}
            </div>
            <p className="text-sm text-muted-foreground">Avg Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.bySource.internal || 0}
            </div>
            <p className="text-sm text-muted-foreground">From Surveys</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">
              {stats.bySource.google || 0}
            </div>
            <p className="text-sm text-muted-foreground">From Google</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.withResponse}
            </div>
            <p className="text-sm text-muted-foreground">With Response</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">
              {stats.featuredCount}
            </div>
            <p className="text-sm text-muted-foreground">Featured</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews by text, customer name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={isPending}>
                Search
              </Button>
            </form>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                Filters:
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); handleFilterChange(); }}>
                <SelectTrigger className="w-[130px]">
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

              <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); handleFilterChange(); }}>
                <SelectTrigger className="w-[130px]">
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

              <Select value={loanOfficerFilter} onValueChange={(v) => { setLoanOfficerFilter(v); handleFilterChange(); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Loan Officer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Loan Officers</SelectItem>
                  {loanOfficers.map((lo) => (
                    <SelectItem key={lo.id} value={lo.id}>
                      {lo.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                {showAdvancedFilters ? "Hide" : "More"} Filters
              </Button>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}

              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={refreshReviews} disabled={isPending}>
                  <RefreshCcw className={cn("h-4 w-4", isPending && "animate-spin")} />
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport} disabled={isPending}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="flex flex-wrap gap-4 pt-4 border-t">
                <div className="space-y-1">
                  <Label className="text-sm">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[180px] justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => { setStartDate(date); handleFilterChange(); }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[180px] justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => { setEndDate(date); handleFilterChange(); }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.size} review{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <Button size="sm" variant="outline" onClick={() => handleBulkFeature(true)}>
            <Flag className="h-4 w-4 mr-1" />
            Feature
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkFeature(false)}>
            Unfeature
          </Button>
          <Button size="sm" variant="outline" onClick={handleBulkArchive}>
            <Archive className="h-4 w-4 mr-1" />
            Archive
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
            Cancel
          </Button>
        </div>
      )}

      {/* Reviews List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Reviews ({total})
            </CardTitle>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedIds.size === reviews.length && reviews.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <Label htmlFor="select-all" className="text-sm cursor-pointer">
                  Select all
                </Label>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No reviews found</p>
              <p className="text-sm text-muted-foreground/70">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex gap-4 p-4 transition-colors hover:bg-muted/50 cursor-pointer"
                  onClick={() => openReviewDetail(review)}
                >
                  <div
                    className="flex items-start pt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedIds.has(review.id)}
                      onCheckedChange={() => toggleSelection(review.id)}
                    />
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                    {review.customerName
                      ? review.customerName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "?"}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {review.customerName || "Anonymous"}
                          </span>
                          {review.featured && (
                            <Flag className="h-3 w-3 text-amber-500 fill-amber-500" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {review.loanOfficer?.fullName}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "fill-muted text-muted"
                              }`}
                            />
                          ))}
                        </div>
                        {getStatusBadge(review.status)}
                        {getSourceBadge(review.source)}
                      </div>
                    </div>
                    {review.text ? (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {review.text}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground/60 italic">
                        No written review provided
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatDate(review.reviewDate)}</span>
                        {review.responseText && (
                          <span className="flex items-center gap-1 text-green-600">
                            <MessageSquare className="h-3 w-3" />
                            Responded
                          </span>
                        )}
                        {review.sentimentLabel && (
                          <Badge variant="outline" className="text-xs">
                            {review.sentimentLabel}
                          </Badge>
                        )}
                      </div>
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openReviewDetail(review)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {review.sourceUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                          >
                            <a
                              href={review.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openReviewDetail(review)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Flag className="mr-2 h-4 w-4" />
                              {review.featured ? "Unfeature" : "Feature"}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total} reviews
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || isPending}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || isPending}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Review Detail Modal */}
      <ReviewDetailModal
        review={selectedReview}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onUpdate={refreshReviews}
      />
    </div>
  );
}
