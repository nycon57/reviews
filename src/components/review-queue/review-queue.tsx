"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Star,
  Check,
  X,
  WarningCircle as AlertCircle,
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  Archive,
  Flag,
  Sparkle as Sparkles,
} from "@phosphor-icons/react";
import { useReviewQueue } from "./review-queue-context";
import { ReviewFiltersPanel } from "./review-filters-panel";
import { ReviewListItem } from "./review-list-item";
import { ReviewDialogs } from "./review-dialogs";

export function ReviewQueueContent() {
  const { state, actions } = useReviewQueue();

  return (
    <div className="space-y-6">
      {/* Mode Indicator */}
      {state.isPendingMode && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <Sparkles className="h-5 w-5 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">Moderation Mode</span>
          <span className="text-sm text-amber-600">&mdash; Review and approve or reject pending reviews</span>
        </div>
      )}

      {/* Stats Cards */}
      {state.isPendingMode ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{state.stats.pending}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{state.stats.approved}</div>
              <p className="text-sm text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{state.stats.rejected}</div>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{state.stats.total}</div>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{state.aggregatedStats?.total || state.stats.total}</div>
              <p className="text-sm text-muted-foreground">Total Reviews</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                {state.aggregatedStats?.averageRating || "\u2014"}
              </div>
              <p className="text-sm text-muted-foreground">Avg Rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{state.aggregatedStats?.bySource.internal || 0}</div>
              <p className="text-sm text-muted-foreground">From Surveys</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">{state.aggregatedStats?.bySource.google || 0}</div>
              <p className="text-sm text-muted-foreground">From Google</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{state.aggregatedStats?.withResponse || 0}</div>
              <p className="text-sm text-muted-foreground">With Response</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <ReviewFiltersPanel />

      {/* Bulk Actions */}
      {state.selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {state.selectedIds.size} review{state.selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          {state.isPendingMode ? (
            <>
              <Button size="sm" onClick={actions.handleBulkApprove} disabled={state.isPending}>
                <Check className="h-4 w-4 mr-1" />Approve All
              </Button>
              <Button size="sm" variant="destructive" onClick={() => actions.setBulkRejectDialogOpen(true)} disabled={state.isPending}>
                <X className="h-4 w-4 mr-1" />Reject All
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => actions.handleBulkFeature(true)}>
                <Flag className="h-4 w-4 mr-1" />Feature
              </Button>
              <Button size="sm" variant="outline" onClick={() => actions.handleBulkFeature(false)}>
                Unfeature
              </Button>
              <Button size="sm" variant="outline" onClick={actions.handleBulkArchive}>
                <Archive className="h-4 w-4 mr-1" />Archive
              </Button>
            </>
          )}
          <Button size="sm" variant="ghost" onClick={() => actions.toggleSelectAll()}>
            Cancel
          </Button>
        </div>
      )}

      {/* Reviews List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Reviews ({state.total})</CardTitle>
            {state.reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={state.selectedIds.size === state.reviews.length && state.reviews.length > 0}
                  onCheckedChange={actions.toggleSelectAll}
                />
                <Label htmlFor="select-all" className="text-sm cursor-pointer">Select all</Label>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {state.reviews.length === 0 ? (
            <div className="relative flex flex-col items-center justify-center py-16 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-repwell-sage-100/40 via-repwell-sage-200/20 to-repwell-teal-300/10" />
              <div className="relative">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-repwell-sage-100 to-repwell-sage-200/50">
                  <AlertCircle className="h-7 w-7 text-repwell-teal-400" />
                </div>
                <p className="font-medium text-repwell-teal-500">No reviews found</p>
                <p className="mt-1 text-sm text-repwell-teal-300">
                  {state.filters.statusFilter === "pending"
                    ? "All reviews have been processed!"
                    : "Try adjusting your filters"}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {state.reviews.map((review) => (
                <ReviewListItem key={review.id} review={review} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {state.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(state.filters.page - 1) * state.limit + 1} to{" "}
            {Math.min(state.filters.page * state.limit, state.total)} of {state.total} reviews
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => actions.handlePageChange(state.filters.page - 1)}
              disabled={state.filters.page === 1 || state.isPending}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, state.totalPages) }, (_, i) => {
                let pageNum: number;
                if (state.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (state.filters.page <= 3) {
                  pageNum = i + 1;
                } else if (state.filters.page >= state.totalPages - 2) {
                  pageNum = state.totalPages - 4 + i;
                } else {
                  pageNum = state.filters.page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={state.filters.page === pageNum ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => actions.handlePageChange(pageNum)}
                    disabled={state.isPending}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => actions.handlePageChange(state.filters.page + 1)}
              disabled={state.filters.page === state.totalPages || state.isPending}
            >
              Next<ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ReviewDialogs />
    </div>
  );
}
