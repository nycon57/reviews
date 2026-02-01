"use client";

import { useState, useCallback } from "react";
import { ArrowsClockwise as RefreshCw } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useVideoLibrary } from "./video-library-context";

// ============================================================================
// Rejection Dialog (shared for single + bulk)
// ============================================================================

function RejectDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  isBulk = false,
  count = 1,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
  isBulk?: boolean;
  count?: number;
}) {
  const [reason, setReason] = useState("");

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) setReason("");
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isBulk ? `Reject ${count} Video${count !== 1 ? "s" : ""}` : "Reject Video Testimonial"}
          </DialogTitle>
          <DialogDescription>
            {isBulk
              ? `Provide a reason for rejecting these ${count} videos.`
              : "Provide a reason for rejecting this video."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rejectionReason">Rejection Reason</Label>
            <Textarea
              id="rejectionReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Poor video quality, inappropriate content..."
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => onConfirm(reason)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                isBulk ? `Reject ${count} Video${count !== 1 ? "s" : ""}` : "Reject Video"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// All Video Library Dialogs
// ============================================================================

export function VideoDialogs() {
  const { state, actions } = useVideoLibrary();

  return (
    <>
      {/* Single reject dialog */}
      <RejectDialog
        open={state.openDialog === "reject"}
        onOpenChange={(open) => { if (!open) actions.closeDialog(); }}
        onConfirm={actions.handleRejectConfirm}
        isLoading={state.isUpdating}
      />

      {/* Bulk reject dialog */}
      <RejectDialog
        open={state.openDialog === "bulkReject"}
        onOpenChange={(open) => { if (!open) actions.closeDialog(); }}
        onConfirm={actions.handleBulkRejectConfirm}
        isLoading={state.isUpdating}
        isBulk
        count={state.selectedIds.size}
      />

      {/* Single delete dialog */}
      <AlertDialog
        open={state.openDialog === "delete"}
        onOpenChange={(open) => { if (!open) actions.closeDialog(); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the video. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={state.isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={actions.handleDeleteConfirm}
              disabled={state.isUpdating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {state.isUpdating ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete dialog */}
      <AlertDialog
        open={state.openDialog === "bulkDelete"}
        onOpenChange={(open) => { if (!open) actions.closeDialog(); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {state.selectedIds.size} Video{state.selectedIds.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected videos. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={state.isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={actions.handleBulkDeleteConfirm}
              disabled={state.isUpdating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {state.isUpdating ? "Deleting..." : `Delete ${state.selectedIds.size}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
