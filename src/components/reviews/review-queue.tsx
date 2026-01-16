"use client";

import { useState, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Star,
  Filter,
  Check,
  X,
  Edit2,
  MoreHorizontal,
  RefreshCcw,
  AlertCircle,
  Search,
  Download,
  Archive,
  Flag,
  ExternalLink,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Eye,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Review, AggregatedReview, AggregatedReviewFilters, ReviewAggregationStats } from "@/lib/reviews/types";
import {
  approveReview,
  rejectReview,
  updateReviewText,
  bulkApproveReviews,
  bulkRejectReviews,
  revertToPending,
} from "@/lib/reviews/actions";
import {
  getAggregatedReviews,
  bulkArchiveReviews,
  bulkToggleFeatured,
  exportReviews,
  toggleReviewFeatured,
  archiveReview,
  getReviewAggregationStats,
} from "@/lib/reviews/aggregation-actions";
import { ReviewDetailModal } from "./review-detail-modal";

interface ReviewQueueProps {
  initialReviews: Review[];
  initialTotal: number;
  loanOfficers: { id: string; fullName: string }[];
  initialStats: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  initialAggregatedStats?: ReviewAggregationStats;
}

export function ReviewQueue({
  initialReviews,
  initialTotal,
  loanOfficers,
  initialStats,
  initialAggregatedStats,
}: ReviewQueueProps) {
  const [reviews, setReviews] = useState<(Review | AggregatedReview)[]>(initialReviews);
  const [total, setTotal] = useState(initialTotal);
  const [stats, setStats] = useState(initialStats);
  const [aggregatedStats, setAggregatedStats] = useState<ReviewAggregationStats | null>(initialAggregatedStats || null);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loanOfficerFilter, setLoanOfficerFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [page, setPage] = useState(1);
  const limit = 20;

  // UI State
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dialogs
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editedText, setEditedText] = useState("");
  const [rejectingReview, setRejectingReview] = useState<Review | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [bulkRejectDialogOpen, setBulkRejectDialogOpen] = useState(false);
  const [bulkRejectionReason, setBulkRejectionReason] = useState("");

  // Detail modal (for non-pending reviews)
  const [selectedReview, setSelectedReview] = useState<AggregatedReview | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Mode detection - pending status = moderation mode
  const isPendingMode = statusFilter === "pending";
  const totalPages = Math.ceil(total / limit);
  const hasActiveFilters =
    statusFilter !== "all" ||
    sourceFilter !== "all" ||
    loanOfficerFilter !== "all" ||
    searchQuery ||
    startDate ||
    endDate;

  // Build filters for the aggregated reviews API
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
      // Also refresh stats
      const statsResult = await getReviewAggregationStats();
      if (statsResult.success && statsResult.data) {
        setAggregatedStats(statsResult.data);
      }
    });
  }, [buildFilters]);

  // Handle filter changes with page reset
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

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange();
  };

  // Handle page change
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

  // Clear all filters
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

  // Export reviews to CSV
  const handleExport = async () => {
    startTransition(async () => {
      const result = await exportReviews(buildFilters());
      if (result.success && result.data) {
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

  const handleApprove = async (review: Review, publish: boolean = true) => {
    startTransition(async () => {
      const result = await approveReview({
        reviewId: review.id,
        editedText: editingReview?.id === review.id ? editedText : undefined,
        publish,
      });

      if (result.success) {
        setEditingReview(null);
        refreshReviews();
        setStats((prev) => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          approved: prev.approved + 1,
        }));
      }
    });
  };

  const handleReject = async () => {
    if (!rejectingReview || !rejectionReason) return;

    startTransition(async () => {
      const result = await rejectReview({
        reviewId: rejectingReview.id,
        reason: rejectionReason,
      });

      if (result.success) {
        setRejectingReview(null);
        setRejectionReason("");
        refreshReviews();
        setStats((prev) => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          rejected: prev.rejected + 1,
        }));
      }
    });
  };

  const handleUpdateText = async () => {
    if (!editingReview) return;

    startTransition(async () => {
      const result = await updateReviewText({
        reviewId: editingReview.id,
        text: editedText,
      });

      if (result.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === editingReview.id ? { ...r, text: editedText } : r
          )
        );
      }
    });
  };

  const handleRevertToPending = async (reviewId: string) => {
    startTransition(async () => {
      const result = await revertToPending(reviewId);
      if (result.success) {
        refreshReviews();
      }
    });
  };

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    startTransition(async () => {
      const result = await bulkApproveReviews(ids);
      if (result.success) {
        setSelectedIds(new Set());
        refreshReviews();
      }
    });
  };

  const handleBulkReject = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || !bulkRejectionReason) return;

    startTransition(async () => {
      const result = await bulkRejectReviews(ids, bulkRejectionReason);
      if (result.success) {
        setSelectedIds(new Set());
        setBulkRejectDialogOpen(false);
        setBulkRejectionReason("");
        refreshReviews();
      }
    });
  };

  // Viewing mode handlers
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

  const handleToggleFeatured = async (reviewId: string, featured: boolean) => {
    startTransition(async () => {
      const result = await toggleReviewFeatured(reviewId, featured);
      if (result.success) {
        refreshReviews();
      }
    });
  };

  const handleArchive = async (reviewId: string) => {
    startTransition(async () => {
      const result = await archiveReview(reviewId);
      if (result.success) {
        refreshReviews();
      }
    });
  };

  const openReviewDetail = (review: Review | AggregatedReview) => {
    setSelectedReview(review as AggregatedReview);
    setDetailModalOpen(true);
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

  const openEditDialog = (review: Review) => {
    setEditingReview(review);
    setEditedText(review.text || "");
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

  const getStatusBadge = (status: Review["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50">
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="border-red-500 text-red-600 bg-red-50">
            Rejected
          </Badge>
        );
      case "archived":
        return (
          <Badge variant="outline" className="border-gray-400 text-gray-500">
            Archived
          </Badge>
        );
      default:
        return null;
    }
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

  return (
    <div className="space-y-6">
      {/* Mode Indicator */}
      {isPendingMode && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <Sparkles className="h-5 w-5 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">
            Moderation Mode
          </span>
          <span className="text-sm text-amber-600">
            — Review and approve or reject pending reviews
          </span>
        </div>
      )}

      {/* Stats Cards - Mode Dependent */}
      {isPendingMode ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.approved}</div>
              <p className="text-sm text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.rejected}</div>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{aggregatedStats?.total || stats.total}</div>
              <p className="text-sm text-muted-foreground">Total Reviews</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                {aggregatedStats?.averageRating || "—"}
              </div>
              <p className="text-sm text-muted-foreground">Avg Rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">
                {aggregatedStats?.bySource.internal || 0}
              </div>
              <p className="text-sm text-muted-foreground">From Surveys</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">
                {aggregatedStats?.bySource.google || 0}
              </div>
              <p className="text-sm text-muted-foreground">From Google</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">
                {aggregatedStats?.withResponse || 0}
              </div>
              <p className="text-sm text-muted-foreground">With Response</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-amber-600">
                {aggregatedStats?.featuredCount || 0}
              </div>
              <p className="text-sm text-muted-foreground">Featured</p>
            </CardContent>
          </Card>
        </div>
      )}

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

      {/* Bulk Actions - Mode Dependent */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.size} review{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          {isPendingMode ? (
            <>
              <Button size="sm" onClick={handleBulkApprove} disabled={isPending}>
                <Check className="h-4 w-4 mr-1" />
                Approve All
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setBulkRejectDialogOpen(true)}
                disabled={isPending}
              >
                <X className="h-4 w-4 mr-1" />
                Reject All
              </Button>
            </>
          ) : (
            <>
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
            </>
          )}
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
              <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No reviews found</p>
              <p className="text-sm text-muted-foreground/70">
                {statusFilter === "pending"
                  ? "All reviews have been processed!"
                  : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {reviews.map((review) => {
                const aggregatedReview = review as AggregatedReview;
                const isFeatured = "featured" in review && aggregatedReview.featured;
                const hasResponse = "responseText" in review && aggregatedReview.responseText;
                const sourceUrl = "sourceUrl" in review ? aggregatedReview.sourceUrl : undefined;

                return (
                  <div
                    key={review.id}
                    className={cn(
                      "flex gap-4 p-4 transition-colors hover:bg-muted/50",
                      !isPendingMode && "cursor-pointer"
                    )}
                    onClick={() => !isPendingMode && openReviewDetail(review)}
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
                          <div className="font-medium truncate flex items-center gap-2">
                            {review.customerName || "Anonymous"}
                            {isFeatured && (
                              <Flag className="h-4 w-4 text-amber-500 fill-amber-500" />
                            )}
                            {hasResponse && (
                              <MessageSquare className="h-4 w-4 text-green-500" />
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
                      <div
                        className="flex items-center justify-between pt-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-xs text-muted-foreground">
                          {formatDate(review.reviewDate)}
                        </span>
                        <div className="flex items-center gap-2">
                          {/* Pending mode actions */}
                          {review.status === "pending" && isPendingMode && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(review)}
                              >
                                <Edit2 className="mr-1 h-3 w-3" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(review)}
                                disabled={isPending}
                              >
                                <Check className="mr-1 h-3 w-3" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setRejectingReview(review)}
                                disabled={isPending}
                              >
                                <X className="mr-1 h-3 w-3" />
                                Reject
                              </Button>
                            </>
                          )}

                          {/* Non-pending mode actions */}
                          {!isPendingMode && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openReviewDetail(review);
                                }}
                              >
                                <Eye className="mr-1 h-3 w-3" />
                                View
                              </Button>
                              {sourceUrl && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(sourceUrl, "_blank");
                                  }}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleToggleFeatured(review.id, !isFeatured)
                                    }
                                  >
                                    <Flag className="mr-2 h-4 w-4" />
                                    {isFeatured ? "Unfeature" : "Feature"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleRevertToPending(review.id)}
                                  >
                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                    Revert to Pending
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleArchive(review.id)}
                                    className="text-red-600"
                                  >
                                    <Archive className="mr-2 h-4 w-4" />
                                    Archive
                                  </DropdownMenuItem>
                                  {review.status === "rejected" &&
                                    review.rejectionReason && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                                          <span className="font-medium">Reason:</span>{" "}
                                          {review.rejectionReason}
                                        </div>
                                      </>
                                    )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}

                          {/* Legacy dropdown for pending reviews when viewing in non-pending mode */}
                          {review.status === "pending" && !isPendingMode && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openEditDialog(review)}
                                >
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Edit & Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleApprove(review)}
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setRejectingReview(review)}
                                  className="text-red-600"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of{" "}
            {total} reviews
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || isPending}
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
                    className="w-8 h-8 p-0"
                    onClick={() => handlePageChange(pageNum)}
                    disabled={isPending}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || isPending}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Review Dialog */}
      <Dialog open={!!editingReview} onOpenChange={() => setEditingReview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
            <DialogDescription>
              Edit the review text before approving. The original text will be
              preserved in the survey response.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      editingReview && i < editingReview.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-muted-foreground">
                from {editingReview?.customerName || "Anonymous"}
              </span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-text">Review Text</Label>
              <Textarea
                id="review-text"
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={6}
                placeholder="Enter review text..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReview(null)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleUpdateText} disabled={isPending}>
              Save Changes
            </Button>
            <Button
              onClick={() => editingReview && handleApprove(editingReview)}
              disabled={isPending}
            >
              Save & Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Review Dialog */}
      <Dialog open={!!rejectingReview} onOpenChange={() => setRejectingReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Review</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this review. This will be
              recorded for reference.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      rejectingReview && i < rejectingReview.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-muted-foreground">
                from {rejectingReview?.customerName || "Anonymous"}
              </span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Enter reason for rejection..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingReview(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isPending || !rejectionReason}
            >
              Reject Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject Dialog */}
      <Dialog open={bulkRejectDialogOpen} onOpenChange={setBulkRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {selectedIds.size} Reviews</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting these reviews. This will be
              applied to all selected reviews.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-rejection-reason">Rejection Reason</Label>
            <Textarea
              id="bulk-rejection-reason"
              value={bulkRejectionReason}
              onChange={(e) => setBulkRejectionReason(e.target.value)}
              rows={3}
              placeholder="Enter reason for rejection..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkReject}
              disabled={isPending || !bulkRejectionReason}
            >
              Reject All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Detail Modal (for non-pending reviews) */}
      {selectedReview && (
        <ReviewDetailModal
          review={selectedReview}
          open={detailModalOpen}
          onOpenChange={(open) => {
            setDetailModalOpen(open);
            if (!open) setSelectedReview(null);
          }}
          onUpdate={refreshReviews}
        />
      )}
    </div>
  );
}
