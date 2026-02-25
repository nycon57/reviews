"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SourceIcon } from "@/components/shared/review-item";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Star,
  Check,
  X,
  PencilSimple as Edit2,
  DotsThree as MoreHorizontal,
  ArrowCounterClockwise as RefreshCcw,
  Archive,
  Flag,
  ArrowSquareOut as ExternalLink,
  Chats as MessageSquare,
  Eye,
  Sparkle as Sparkles,
  ShareNetwork,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { Review, AggregatedReview } from "@/lib/reviews/types";
import { useReviewQueue } from "./review-queue-context";
import { CreateSmartLinkModal } from "@/components/share-studio/create-smart-link-modal";

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getStatusBadge(status: Review["status"]) {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50">Pending</Badge>;
    case "approved":
      return <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">Approved</Badge>;
    case "rejected":
      return <Badge variant="outline" className="border-red-500 text-red-600 bg-red-50">Rejected</Badge>;
    case "archived":
      return <Badge variant="outline" className="border-gray-400 text-gray-500">Archived</Badge>;
    default:
      return null;
  }
}

export function ReviewListItem({ review }: { review: Review | AggregatedReview }) {
  const { state, actions } = useReviewQueue();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const aggregatedReview = review as AggregatedReview;
  const isFeatured = "featured" in review && aggregatedReview.featured;
  const hasResponse = "responseText" in review && aggregatedReview.responseText;
  const sourceUrl = "sourceUrl" in review ? aggregatedReview.sourceUrl : undefined;

  return (
    <div
      className={cn(
        "flex gap-4 p-4 transition-colors hover:bg-muted/50",
        !state.isPendingMode && "cursor-pointer"
      )}
      onClick={() => !state.isPendingMode && actions.openReviewDetail(review)}
    >
      <div className="flex items-start pt-1" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={state.selectedIds.has(review.id)}
          onCheckedChange={() => actions.toggleSelection(review.id)}
        />
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
        {review.customerName && review.customerName.trim()
          ? review.customerName.trim().split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
          : "?"}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="font-medium truncate flex items-center gap-2">
              {review.customerName || "Anonymous"}
              <span className="text-xs font-normal text-muted-foreground">
                &middot; {formatDate(review.reviewDate)}
              </span>
              {isFeatured && <Flag className="h-4 w-4 text-amber-500 fill-amber-500" />}
              {hasResponse && <MessageSquare className="h-4 w-4 text-green-500" />}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"}`}
                />
              ))}
            </div>
            {getStatusBadge(review.status)}
            <SourceIcon source={review.source} />
          </div>
        </div>
        {review.text ? (
          <p className="text-sm text-muted-foreground line-clamp-2">{review.text}</p>
        ) : (
          <p className="text-sm text-muted-foreground/60 italic">No written review provided</p>
        )}
        {/* Response display */}
        {hasResponse && (() => {
          const isAiResponse = aggregatedReview.aiSuggestedResponse &&
            aggregatedReview.responseText === aggregatedReview.aiSuggestedResponse;
          const isTemplateResponse = !isAiResponse && aggregatedReview.responseTemplateId;
          const responseConfig = isAiResponse
            ? { borderColor: "border-violet-400/50", bgColor: "bg-violet-50/50", iconColor: "text-violet-500", labelColor: "text-violet-600", label: "AI Response", Icon: Sparkles }
            : isTemplateResponse
            ? { borderColor: "border-amber-400/50", bgColor: "bg-amber-50/50", iconColor: "text-amber-500", labelColor: "text-amber-600", label: "Template", Icon: Archive }
            : { borderColor: "border-repwell-teal-300/50", bgColor: "bg-repwell-teal-100/20", iconColor: "text-repwell-teal-400", labelColor: "text-repwell-teal-500", label: "Response", Icon: MessageSquare };

          return (
            <div className={cn("mt-4 pl-3 border-l-2 rounded-r-md py-2 pr-2", responseConfig.borderColor, responseConfig.bgColor)}>
              <div className="flex items-center gap-1.5 mb-1">
                <responseConfig.Icon className={cn("h-3 w-3", responseConfig.iconColor)} />
                <span className={cn("text-xs font-medium", responseConfig.labelColor)}>{responseConfig.label}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{aggregatedReview.responseText}</p>
            </div>
          );
        })()}
        <div className="flex items-center justify-end pt-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            {/* Pending mode actions */}
            {review.status === "pending" && state.isPendingMode && (
              <>
                <Button size="sm" variant="outline" onClick={() => actions.openEditDialog(review)}>
                  <Edit2 className="mr-1 h-3 w-3" />Edit
                </Button>
                <Button size="sm" onClick={() => actions.handleApprove(review)} disabled={state.isPending}>
                  <Check className="mr-1 h-3 w-3" />Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => actions.setRejectingReview(review)} disabled={state.isPending}>
                  <X className="mr-1 h-3 w-3" />Reject
                </Button>
              </>
            )}

            {/* Non-pending mode actions */}
            {!state.isPendingMode && review.status !== "pending" && (
              <>
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); actions.openReviewDetail(review); }}>
                  <Eye className="mr-1 h-3 w-3" />View
                </Button>
                {review.status === "approved" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); setShareModalOpen(true); }}
                    title="Create Smart Link"
                  >
                    <ShareNetwork className="h-3 w-3" />
                  </Button>
                )}
                {sourceUrl && (
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); window.open(sourceUrl, "_blank"); }}>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => actions.handleToggleFeatured(review.id, !isFeatured)}>
                      <Flag className="mr-2 h-4 w-4" />{isFeatured ? "Unfeature" : "Feature"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => actions.handleRevertToPending(review.id)}>
                      <RefreshCcw className="mr-2 h-4 w-4" />Revert to Pending
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => actions.handleArchive(review.id)} className="text-red-600">
                      <Archive className="mr-2 h-4 w-4" />Archive
                    </DropdownMenuItem>
                    {review.status === "rejected" && review.rejectionReason && (
                      <>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          <span className="font-medium">Reason:</span> {review.rejectionReason}
                        </div>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {/* Pending reviews in non-pending mode */}
            {review.status === "pending" && !state.isPendingMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => actions.openEditDialog(review)}>
                    <Edit2 className="mr-2 h-4 w-4" />Edit & Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => actions.handleApprove(review)}>
                    <Check className="mr-2 h-4 w-4" />Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => actions.setRejectingReview(review)} className="text-red-600">
                    <X className="mr-2 h-4 w-4" />Reject
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
      <CreateSmartLinkModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        reviewId={review.id}
        reviewTitle={`${review.customerName || "Customer"} review`}
      />
    </div>
  );
}
