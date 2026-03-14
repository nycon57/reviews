"use client";

import { memo, useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
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

export const VideoCard = memo(function VideoCard({
  video,
}: {
  video: VideoTestimonialResponse;
}) {
  const { state, actions } = useVideoLibrary();
  const isSelected = state.selectedIds.has(video.id);
  const [thumbnailError, setThumbnailError] = useState(false);

  const onClick = () => actions.handleVideoClick(video);

  return (
    <Card className={cn(
      "group overflow-hidden transition-all duration-300",
      isSelected && "ring-2 ring-primary",
      "hover:shadow-md"
    )}>
      {/* Thumbnail / Video Preview */}
      <div
        className="relative aspect-video cursor-pointer bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onClick()}
        aria-label={`View details for ${video.customerName}'s testimonial`}
      >
        {video.thumbnailUrl && !thumbnailError ? (
          <img
            src={video.thumbnailUrl}
            alt={`Thumbnail for ${video.customerName}'s testimonial`}
            className="h-full w-full object-cover"
            onError={() => setThumbnailError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-repwell-teal-300 to-repwell-sage-300">
            <img
              src="/branding/RepWell-Icon-Full-Color.png"
              alt="RepWell"
              className="h-10 w-auto brightness-0 invert opacity-60"
            />
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <Play className="h-6 w-6 text-label ml-1" />
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
          {formatDuration(video.durationSeconds)}
        </div>

        {/* Transcription indicator */}
        {video.transcriptionStatus === "completed" && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
            <FileText className="h-3 w-3" />
            <span>CC</span>
          </div>
        )}

        {/* Selection checkbox */}
        {state.canManage && (
          <div
            className="absolute left-2 top-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => actions.handleSelect(video.id, checked === true)}
              className="h-5 w-5 border-2 border-white bg-white/80 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              aria-label={`Select ${video.customerName}'s video`}
            />
          </div>
        )}
      </div>

      {/* Card Content */}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-heading">
              {video.customerName}
            </h3>
            <p className="truncate text-sm text-muted-foreground">
              {video.loanOfficerName}
            </p>
          </div>
          {state.canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
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

        <div className="mt-3 flex items-center justify-between">
          <ApprovalStatusBadge status={video.approvalStatus} />
          <span className="text-xs text-muted-foreground">
            {formatDate(video.submittedAt)}
          </span>
        </div>

        {/* Sentiment indicator */}
        {video.sentimentLabel && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Sentiment:</span>
            <SentimentBadge label={video.sentimentLabel} />
          </div>
        )}
      </CardContent>
    </Card>
  );
});
