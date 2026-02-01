"use client";

import { memo } from "react";
import {
  Play,
  FileText,
  DotsThree as MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  ShareNetwork as Share2,
  Trash as Trash2,
  FilmStrip as Film,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { VideoTestimonialResponse } from "@/lib/video-testimonials/actions";
import { useVideoLibrary } from "./video-library-context";
import { ApprovalStatusBadge, SentimentBadge, formatDuration, formatDate } from "./video-shared";

export const VideoListRow = memo(function VideoListRow({
  video,
}: {
  video: VideoTestimonialResponse;
}) {
  const { state, actions } = useVideoLibrary();
  const isSelected = state.selectedIds.has(video.id);

  const onClick = () => actions.handleVideoClick(video);

  return (
    <div
      className={cn(
        "group flex items-center gap-4 rounded-lg border p-3 transition-all duration-200",
        isSelected && "ring-2 ring-primary bg-primary/5",
        "hover:bg-muted/50"
      )}
    >
      {/* Selection checkbox */}
      {state.canManage && (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => actions.handleSelect(video.id, checked === true)}
            aria-label={`Select ${video.customerName}'s video`}
          />
        </div>
      )}

      {/* Thumbnail */}
      <div
        className="relative h-16 w-28 flex-shrink-0 cursor-pointer overflow-hidden rounded bg-muted"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            if (e.key === " ") e.preventDefault();
            onClick();
          }
        }}
      >
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={`Thumbnail for ${video.customerName}'s testimonial`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-repwell-sage-100/50 to-repwell-teal-300/20">
            <Film className="h-6 w-6 text-muted-foreground/50" />
          </div>
        )}
        {/* Duration */}
        <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-[10px] font-medium text-white">
          {formatDuration(video.durationSeconds)}
        </div>
        {/* Hover play icon */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
          <Play className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1 cursor-pointer" onClick={onClick}>
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-repwell-teal-500">
            {video.customerName}
          </h3>
          {video.transcriptionStatus === "completed" && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              <FileText className="mr-1 h-3 w-3" />
              CC
            </Badge>
          )}
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {video.loanOfficerName}
        </p>
      </div>

      {/* Status */}
      <div className="flex-shrink-0">
        <ApprovalStatusBadge status={video.approvalStatus} />
      </div>

      {/* Sentiment */}
      <div className="hidden w-20 flex-shrink-0 sm:block">
        {video.sentimentLabel ? (
          <SentimentBadge label={video.sentimentLabel} />
        ) : (
          <span className="text-xs text-muted-foreground">&mdash;</span>
        )}
      </div>

      {/* Date */}
      <div className="hidden w-24 flex-shrink-0 text-right text-sm text-muted-foreground md:block">
        {formatDate(video.submittedAt)}
      </div>

      {/* Actions */}
      {state.canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onClick}>
              <Play className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {video.approvalStatus === "pending" && (
              <>
                <DropdownMenuItem onClick={() => actions.handleApprove(video.id)}>
                  <ThumbsUp className="mr-2 h-4 w-4 text-green-600" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => actions.handleRejectClick(video.id)}>
                  <ThumbsDown className="mr-2 h-4 w-4 text-red-600" />
                  Reject
                </DropdownMenuItem>
              </>
            )}
            {video.approvalStatus === "approved" && (
              <DropdownMenuItem onClick={() => actions.handlePublish(video.id)}>
                <Share2 className="mr-2 h-4 w-4 text-blue-600" />
                Publish
              </DropdownMenuItem>
            )}
            {state.canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => actions.handleDeleteClick(video.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
});
