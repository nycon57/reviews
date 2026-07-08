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
      {/* Remove Review Dialog */}
      <Dialog open={!!state.rejectingReview} onOpenChange={() => actions.setRejectingReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove review from publishing?</DialogTitle>
            <DialogDescription>
              Add a reason for keeping this review off public review surfaces.
              This will be recorded for reference.
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
              <Label htmlFor="rejection-reason">Removal reason</Label>
              <Textarea
                id="rejection-reason"
                value={state.rejectionReason}
                onChange={(e) => actions.setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Why should this review stay unpublished?"
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
              Remove review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Remove Dialog */}
      <Dialog
        open={state.openDialog === "bulkReject"}
        onOpenChange={(open) => actions.setBulkRejectDialogOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {state.selectedIds.size} reviews from publishing?</DialogTitle>
            <DialogDescription>
              Add a reason for keeping these reviews off public review surfaces.
              This will be applied to all selected reviews.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-rejection-reason">Removal reason</Label>
            <Textarea
              id="bulk-rejection-reason"
              value={state.bulkRejectionReason}
              onChange={(e) => actions.setBulkRejectionReason(e.target.value)}
              rows={3}
              placeholder="Why should these reviews stay unpublished?"
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
              Remove all
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
