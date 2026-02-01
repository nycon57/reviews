"use client";

import { Button } from "@/components/ui/button";
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
import { Star } from "@phosphor-icons/react";
import { useReviewQueue } from "./review-queue-context";
import { ReviewDetailModal } from "../reviews/review-detail-modal";

export function ReviewDialogs() {
  const { state, actions } = useReviewQueue();

  return (
    <>
      {/* Edit Review Dialog */}
      <Dialog open={!!state.editingReview} onOpenChange={() => actions.setEditingReview(null)}>
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
                      state.editingReview && i < state.editingReview.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-muted-foreground">
                from {state.editingReview?.customerName || "Anonymous"}
              </span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-text">Review Text</Label>
              <Textarea
                id="review-text"
                value={state.editedText}
                onChange={(e) => actions.setEditedText(e.target.value)}
                rows={6}
                placeholder="Enter review text..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => actions.setEditingReview(null)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={actions.handleUpdateText} disabled={state.isPending}>
              Save Changes
            </Button>
            <Button
              onClick={() => state.editingReview && actions.handleApprove(state.editingReview)}
              disabled={state.isPending}
            >
              Save & Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Review Dialog */}
      <Dialog open={!!state.rejectingReview} onOpenChange={() => actions.setRejectingReview(null)}>
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
                      state.rejectingReview && i < state.rejectingReview.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-muted-foreground">
                from {state.rejectingReview?.customerName || "Anonymous"}
              </span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                value={state.rejectionReason}
                onChange={(e) => actions.setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Enter reason for rejection..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => actions.setRejectingReview(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={actions.handleReject}
              disabled={state.isPending || !state.rejectionReason}
            >
              Reject Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject Dialog */}
      <Dialog
        open={state.openDialog === "bulkReject"}
        onOpenChange={(open) => actions.setBulkRejectDialogOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {state.selectedIds.size} Reviews</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting these reviews. This will be
              applied to all selected reviews.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-rejection-reason">Rejection Reason</Label>
            <Textarea
              id="bulk-rejection-reason"
              value={state.bulkRejectionReason}
              onChange={(e) => actions.setBulkRejectionReason(e.target.value)}
              rows={3}
              placeholder="Enter reason for rejection..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => actions.setBulkRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={actions.handleBulkReject}
              disabled={state.isPending || !state.bulkRejectionReason}
            >
              Reject All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Detail Modal */}
      {state.selectedReview && (
        <ReviewDetailModal
          review={state.selectedReview}
          open={state.detailModalOpen}
          onOpenChange={(open) => {
            actions.setDetailModalOpen(open);
            if (!open) actions.setSelectedReview(null);
          }}
          onUpdate={actions.refreshReviews}
          hasAiAccess={state.hasAiAccess}
        />
      )}
    </>
  );
}
