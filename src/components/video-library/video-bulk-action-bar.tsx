"use client";

import {
  ThumbsUp,
  ThumbsDown,
  ShareNetwork as Share2,
  Trash as Trash2,
  SpinnerGap as Loader2,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useVideoLibrary } from "./video-library-context";

export function VideoBulkActionBar() {
  const { state, actions } = useVideoLibrary();

  if (!state.canManage || state.selectedIds.size === 0) return null;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-repwell-teal-300/20 bg-repwell-sage-100/30">
      <span className="text-sm font-medium text-repwell-teal-500">
        {state.selectedIds.size} video{state.selectedIds.size !== 1 ? "s" : ""} selected
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={actions.handleBulkApprove}
        disabled={state.isUpdating}
      >
        <ThumbsUp className="h-4 w-4 mr-1 text-green-600" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={actions.openBulkRejectDialog}
        disabled={state.isUpdating}
      >
        <ThumbsDown className="h-4 w-4 mr-1 text-red-600" />
        Reject
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={actions.handleBulkPublish}
        disabled={state.isUpdating}
      >
        <Share2 className="h-4 w-4 mr-1 text-blue-600" />
        Publish
      </Button>
      {state.canDelete && (
        <Button
          size="sm"
          variant="outline"
          onClick={actions.openBulkDeleteDialog}
          disabled={state.isUpdating}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      )}
      {state.isUpdating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      <Button size="sm" variant="ghost" onClick={actions.handleClearSelection}>
        Cancel
      </Button>
    </div>
  );
}
