"use client";

import {
  ThumbsUp,
  ThumbsDown,
  ShareNetwork as Share2,
  Trash as Trash2,
  CheckSquare,
  Square,
  SpinnerGap as Loader2,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useVideoLibrary } from "./video-library-context";

export function VideoBulkActionBar() {
  const { state, actions } = useVideoLibrary();

  if (!state.canManage || state.selectedIds.size === 0) return null;

  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={state.allSelected ? actions.handleClearSelection : actions.handleSelectAll}
          className="gap-1.5"
        >
          {state.allSelected ? (
            <>
              <Square className="h-4 w-4" />
              Deselect All
            </>
          ) : (
            <>
              <CheckSquare className="h-4 w-4" />
              Select All ({state.responses.length})
            </>
          )}
        </Button>
        <span className="text-sm text-muted-foreground">
          {state.selectedIds.size} video{state.selectedIds.size !== 1 ? "s" : ""} selected
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={actions.handleBulkApprove}
          disabled={state.isUpdating}
          className="gap-1.5"
        >
          <ThumbsUp className="h-4 w-4 text-green-600" />
          Approve
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={actions.openBulkRejectDialog}
          disabled={state.isUpdating}
          className="gap-1.5"
        >
          <ThumbsDown className="h-4 w-4 text-red-600" />
          Reject
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={actions.handleBulkPublish}
          disabled={state.isUpdating}
          className="gap-1.5"
        >
          <Share2 className="h-4 w-4 text-blue-600" />
          Publish
        </Button>
        {state.canDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={actions.openBulkDeleteDialog}
            disabled={state.isUpdating}
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        )}
        {state.isUpdating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
    </div>
  );
}
