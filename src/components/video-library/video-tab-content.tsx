"use client";

import {
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  FilmStrip as Film,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useVideoLibrary } from "./video-library-context";
import { VideoBulkActionBar } from "./video-bulk-action-bar";
import { VideoFilters } from "./video-filters";
import { VideoCard } from "./video-card";
import { VideoListRow } from "./video-list-row";
import { VideoDialogs } from "./video-dialogs";

export function VideoTabContent() {
  const { state, actions } = useVideoLibrary();

  return (
    <div className="space-y-4">
      {/* Bulk Action Bar */}
      <VideoBulkActionBar />

      {/* Filters & View Toggle */}
      <VideoFilters />

      {/* Video Grid or List */}
      {state.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      ) : state.responses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-lg border border-dashed">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Film className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No video testimonials</h3>
          <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
            Video testimonials will appear here once customers submit them.
          </p>
        </div>
      ) : state.viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {state.responses.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="hidden items-center gap-4 px-3 py-2 text-xs font-medium text-muted-foreground sm:flex">
            {state.canManage && <div className="w-4" />}
            <div className="w-28">Preview</div>
            <div className="flex-1">Customer / Professional</div>
            <div className="w-28">Status</div>
            <div className="hidden w-20 sm:block">Sentiment</div>
            <div className="hidden w-24 text-right md:block">Date</div>
            {state.canManage && <div className="w-8" />}
          </div>
          {state.responses.map((video) => (
            <VideoListRow key={video.id} video={video} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {state.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            Showing {(state.page - 1) * state.pageSize + 1} to{" "}
            {Math.min(state.page * state.pageSize, state.total)} of {state.total}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => actions.setPage((p: number) => Math.max(1, p - 1))}
              disabled={state.page === 1 || state.isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {state.page} of {state.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => actions.setPage((p: number) => Math.min(state.totalPages, p + 1))}
              disabled={state.page === state.totalPages || state.isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <VideoDialogs />
    </div>
  );
}
