"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  DotsThree as MoreHorizontal,
  Archive,
  Flag,
  Chats as MessageSquare,
  Sparkle as Sparkles,
  ShareNetwork,
  Eye,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { Review, AggregatedReview } from "@/lib/reviews/types";
import { ReviewStatusBadge } from "@/components/reviews/review-status-badge";
import { useReviewQueue } from "./review-queue-context";
import { CreateSmartLinkModal } from "@/components/share-studio/create-smart-link-modal";
import { motion } from "framer-motion";
import { fadeInUp, transitions } from "@/lib/motion";

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

const MODERATION_REASON_LABELS: Record<string, string> = {
  profanity: "Profanity",
  pii_email: "PII: email",
  pii_phone: "PII: phone",
  pii_ssn: "PII: SSN",
  pii_address: "PII: address",
  spam_links: "Spam: links",
  spam_repetition: "Spam: repetition",
  ai_flagged: "AI flagged",
  screen_error: "Screen error",
};

function formatModerationReason(reason: string): string {
  return MODERATION_REASON_LABELS[reason] ?? reason.replace(/_/g, " ");
}

export function ReviewListItem({ review }: { review: Review | AggregatedReview }) {
  const { state, actions } = useReviewQueue();
  const router = useRouter();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const aggregatedReview = review as AggregatedReview;
  const isFeatured = "featured" in review && aggregatedReview.featured;
  const hasResponse = "responseText" in review && aggregatedReview.responseText;
  return (
    <motion.div
      layout
      variants={fadeInUp}
      exit={{ opacity: 0, scale: 0.95, transition: transitions.fast }}
      className="flex gap-4 p-4 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start pt-1">
        <Checkbox
          checked={state.selectedIds.has(review.id)}
          onCheckedChange={() => actions.toggleSelection(review.id)}
          aria-label={`Select review from ${review.customerName || "Anonymous"}`}
        />
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-repwell-teal-500 shrink-0">
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
              {hasResponse && <MessageSquare className="h-4 w-4 text-green-700" />}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-0.5" role="img" aria-label={`${review.rating} out of 5 stars`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"}`}
                />
              ))}
            </div>
            <ReviewStatusBadge status={review.status} />
            <SourceIcon source={review.source} />
          </div>
        </div>
        {review.text ? (
          <p className="text-sm text-muted-foreground line-clamp-2">{review.text}</p>
        ) : (
          <p className="text-sm text-muted-foreground/60 italic">No written review provided</p>
        )}
        {/* Machine-screening reasons for quarantined reviews */}
        {review.status === "pending" && (review.moderationReasons?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {review.moderationReasons!.map((reason) => (
              <Badge
                key={reason}
                variant="outline"
                className="border-border/60 text-xs font-normal text-muted-foreground"
              >
                {formatModerationReason(reason)}
              </Badge>
            ))}
          </div>
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
            : { borderColor: "border-repwell-teal-300/50", bgColor: "bg-repwell-teal-100/20", iconColor: "text-repwell-teal-400", labelColor: "text-heading", label: "Response", Icon: MessageSquare };

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
        <div className="flex items-center justify-end gap-2 pt-2">
          {/* Ellipsis menu — state-based actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" aria-label={`Actions for review from ${review.customerName || "Anonymous"}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!state.isPendingMode && (
                <>
                  <DropdownMenuItem onClick={() => router.push(`/dashboard/reviews/${review.id}`)}>
                    <Eye className="mr-2 h-4 w-4" />View details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {review.status === "approved" && (
                <>
                  <DropdownMenuItem onClick={() => actions.handleToggleFeatured(review.id, !isFeatured)}>
                    <Flag className="mr-2 h-4 w-4" />{isFeatured ? "Unfeature" : "Feature"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShareModalOpen(true)}>
                    <ShareNetwork className="mr-2 h-4 w-4" />Share
                  </DropdownMenuItem>
                </>
              )}

              {review.status === "pending" && !state.isPendingMode && (
                <>
                  <DropdownMenuItem onClick={() => actions.handleApprove(review)}>
                    <Check className="mr-2 h-4 w-4" />Publish
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => actions.setRejectingReview(review)} className="text-red-600">
                    <X className="mr-2 h-4 w-4" />Remove
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => actions.handleArchive(review.id)} className="text-red-600">
                <Archive className="mr-2 h-4 w-4" />Archive
              </DropdownMenuItem>

              {review.status === "rejected" && review.rejectionReason && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    <span className="font-medium">Removal reason:</span> {review.rejectionReason}
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CreateSmartLinkModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        reviewId={review.id}
        reviewTitle={`${review.customerName || "Customer"} review`}
      />
    </motion.div>
  );
}
