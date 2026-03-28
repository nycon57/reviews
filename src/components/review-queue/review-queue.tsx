"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  ClockCounterClockwise,
  CheckCircle,
  XCircle,
  ChartBar,
  GoogleLogo,
  EnvelopeSimple,
  ChatCircleDots,
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
        <div className="flex items-center gap-3 rounded-xl border border-amber-200/50 bg-amber-50/50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-950/20">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/30">
            <Sparkles className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <span className="text-sm font-medium text-amber-800">Moderation Mode</span>
            <span className="text-sm text-amber-600"> &mdash; Review and approve or reject pending reviews</span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {state.isPendingMode ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Pending", value: state.stats.pending, icon: ClockCounterClockwise, color: "text-amber-500" },
            { label: "Approved", value: state.stats.approved, icon: CheckCircle, color: "text-green-500" },
            { label: "Rejected", value: state.stats.rejected, icon: XCircle, color: "text-red-500" },
            { label: "Total", value: state.stats.total, icon: ChartBar, color: "text-repwell-teal-300" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-teal-300/10">
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-heading">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Total Reviews", value: state.aggregatedStats?.total ?? state.stats.total, icon: ChartBar },
            { label: "Avg Rating", value: state.aggregatedStats?.averageRating ?? "\u2014", icon: Star, isStar: true },
            { label: "From Surveys", value: state.aggregatedStats?.bySource.internal ?? 0, icon: EnvelopeSimple },
            { label: "From Google", value: state.aggregatedStats?.bySource.google ?? 0, icon: GoogleLogo },
            { label: "With Response", value: state.aggregatedStats?.withResponse ?? 0, icon: ChatCircleDots },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-teal-300/10">
                  <Icon className={`h-5 w-5 ${"isStar" in stat ? "fill-yellow-400 text-yellow-400" : "text-repwell-teal-300"}`} />
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-heading">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Card: Filters + Reviews List + Pagination */}
      <Card className="border border-border shadow-soft overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <Star className="h-5 w-5 text-repwell-teal-300" />
              </div>
              <CardTitle className="text-lg">Reviews ({state.total})</CardTitle>
            </div>
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
        <CardContent className="p-6 space-y-4">
          {/* Inline Filters */}
          <ReviewFiltersPanel />

          {/* Bulk Actions — state-aware */}
          {state.selectedIds.size > 0 && (() => {
            const selectedReviews = state.reviews.filter((r) => state.selectedIds.has(r.id));
            const hasApproved = selectedReviews.some((r) => r.status === "approved");
            const hasPending = selectedReviews.some((r) => r.status === "pending");

            return (
              <div className="flex items-center gap-4 p-4 rounded-xl border border-repwell-teal-300/20 bg-repwell-sage-100/30 dark:bg-repwell-teal-300/10">
                <span className="text-sm font-medium text-heading">
                  {state.selectedIds.size} review{state.selectedIds.size !== 1 ? "s" : ""} selected
                </span>
                {hasPending && (
                  <>
                    <Button size="sm" onClick={actions.handleBulkApprove} disabled={state.isPending}>
                      <Check className="h-4 w-4 mr-1" />Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => actions.setBulkRejectDialogOpen(true)} disabled={state.isPending}>
                      <X className="h-4 w-4 mr-1" />Reject
                    </Button>
                  </>
                )}
                {hasApproved && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => actions.handleBulkFeature(true)} disabled={state.isPending}>
                      <Flag className="h-4 w-4 mr-1" />Feature
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => actions.handleBulkFeature(false)} disabled={state.isPending}>
                      Unfeature
                    </Button>
                  </>
                )}
                <Button size="sm" variant="outline" onClick={actions.handleBulkArchive} disabled={state.isPending}>
                  <Archive className="h-4 w-4 mr-1" />Archive
                </Button>
                <Button size="sm" variant="ghost" onClick={() => actions.toggleSelectAll()}>
                  Cancel
                </Button>
              </div>
            );
          })()}

          {/* Reviews List */}
          {state.reviews.length === 0 ? (
            <div className="relative flex flex-col items-center justify-center py-16 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-repwell-sage-100/40 via-repwell-sage-200/20 to-repwell-teal-300/10" />
              <div className="relative">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-repwell-sage-100 to-repwell-sage-200/50">
                  <AlertCircle className="h-7 w-7 text-label" />
                </div>
                <p className="font-medium text-heading">No reviews found</p>
                <p className="mt-1 text-sm text-repwell-teal-300">
                  {state.filters.statusFilter === "pending"
                    ? "All reviews have been processed!"
                    : "Try adjusting your filters"}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y rounded-lg border border-border/50 overflow-hidden">
              {state.reviews.map((review) => (
                <ReviewListItem key={review.id} review={review} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {state.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/50 pt-4">
              <p className="text-xs text-muted-foreground">
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
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" />Previous
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
                  Next<ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ReviewDialogs />
    </div>
  );
}
