"use client";

import { useState, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Review } from "@/lib/reviews/types";
import {
  approveReview,
  rejectReview,
  updateReviewText,
  bulkApproveReviews,
  bulkRejectReviews,
  revertToPending,
  getReviews,
} from "@/lib/reviews/actions";

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
}

export function ReviewQueue({
  initialReviews,
  initialTotal,
  loanOfficers,
  initialStats,
}: ReviewQueueProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [total, setTotal] = useState(initialTotal);
  const [stats, setStats] = useState(initialStats);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [loanOfficerFilter, setLoanOfficerFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dialogs
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editedText, setEditedText] = useState("");
  const [rejectingReview, setRejectingReview] = useState<Review | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [bulkRejectDialogOpen, setBulkRejectDialogOpen] = useState(false);
  const [bulkRejectionReason, setBulkRejectionReason] = useState("");

  const refreshReviews = useCallback(() => {
    startTransition(async () => {
      const result = await getReviews({
        status: statusFilter === "all" ? "all" : (statusFilter as Review["status"]),
        loanOfficerId: loanOfficerFilter === "all" ? undefined : loanOfficerFilter,
        source: sourceFilter === "all" ? undefined : sourceFilter,
      });

      if (result.success && result.data) {
        setReviews(result.data.reviews);
        setTotal(result.data.total);
      }
    });
  }, [statusFilter, loanOfficerFilter, sourceFilter]);

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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
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

      {/* Filters and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            Filters:
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setSelectedIds(new Set());
              startTransition(async () => {
                const result = await getReviews({
                  status: value === "all" ? "all" : (value as Review["status"]),
                  loanOfficerId: loanOfficerFilter === "all" ? undefined : loanOfficerFilter,
                  source: sourceFilter === "all" ? undefined : sourceFilter,
                });
                if (result.success && result.data) {
                  setReviews(result.data.reviews);
                  setTotal(result.data.total);
                }
              });
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={loanOfficerFilter}
            onValueChange={(value) => {
              setLoanOfficerFilter(value);
              setSelectedIds(new Set());
              startTransition(async () => {
                const result = await getReviews({
                  status: statusFilter === "all" ? "all" : (statusFilter as Review["status"]),
                  loanOfficerId: value === "all" ? undefined : value,
                  source: sourceFilter === "all" ? undefined : sourceFilter,
                });
                if (result.success && result.data) {
                  setReviews(result.data.reviews);
                  setTotal(result.data.total);
                }
              });
            }}
          >
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

          <Select
            value={sourceFilter}
            onValueChange={(value) => {
              setSourceFilter(value);
              setSelectedIds(new Set());
              startTransition(async () => {
                const result = await getReviews({
                  status: statusFilter === "all" ? "all" : (statusFilter as Review["status"]),
                  loanOfficerId: loanOfficerFilter === "all" ? undefined : loanOfficerFilter,
                  source: value === "all" ? undefined : value,
                });
                if (result.success && result.data) {
                  setReviews(result.data.reviews);
                  setTotal(result.data.total);
                }
              });
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="internal">Survey</SelectItem>
              <SelectItem value="google">Google</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" onClick={refreshReviews} disabled={isPending}>
            <RefreshCcw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && statusFilter === "pending" && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} selected
            </span>
            <Button size="sm" onClick={handleBulkApprove} disabled={isPending}>
              <Check className="mr-1 h-4 w-4" />
              Approve All
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setBulkRejectDialogOpen(true)}
              disabled={isPending}
            >
              <X className="mr-1 h-4 w-4" />
              Reject All
            </Button>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Reviews ({total})
            </CardTitle>
            {statusFilter === "pending" && reviews.length > 0 && (
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
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex gap-4 p-4 transition-colors hover:bg-muted/50"
                >
                  {statusFilter === "pending" && (
                    <div className="flex items-start pt-1">
                      <Checkbox
                        checked={selectedIds.has(review.id)}
                        onCheckedChange={() => toggleSelection(review.id)}
                      />
                    </div>
                  )}
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
                        <div className="font-medium truncate">
                          {review.customerName || "Anonymous"}
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
                        <Badge variant="secondary" className="capitalize">
                          {review.source === "internal" ? "survey" : review.source}
                        </Badge>
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
                      <span className="text-xs text-muted-foreground">
                        {formatDate(review.reviewDate)}
                      </span>
                      <div className="flex items-center gap-2">
                        {review.status === "pending" && (
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
                        {(review.status === "approved" || review.status === "rejected") && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleRevertToPending(review.id)}
                              >
                                <RefreshCcw className="mr-2 h-4 w-4" />
                                Revert to Pending
                              </DropdownMenuItem>
                              {review.status === "rejected" && review.rejectionReason && (
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
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
