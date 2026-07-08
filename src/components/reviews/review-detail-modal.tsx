"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  ArrowSquareOut as ExternalLink,
  Archive,
  Flag,
  Chats as MessageSquare,
  Calendar,
  MapPin,
  TrendUp as TrendingUp,
  Tag as Tags,
  Clock,
  ShareNetwork as Share2,
} from "@phosphor-icons/react";
import type { AggregatedReview } from "@/lib/reviews/types";
import {
  archiveReview,
  toggleReviewFeatured,
} from "@/lib/reviews/aggregation-actions";
import { formatReviewSource } from "@/lib/reviews/source-labels";
import { ResponseComposer } from "./response-composer";
import { SocialPostComposer } from "@/components/social";
import { ReviewStatusBadge } from "./review-status-badge";

interface ReviewDetailModalProps {
  review: AggregatedReview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
  hasAiAccess?: boolean;
}

export function ReviewDetailModal({
  review,
  open,
  onOpenChange,
  onUpdate,
  hasAiAccess = true,
}: ReviewDetailModalProps) {
  const [isPending, startTransition] = useTransition();
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [showSocialComposer, setShowSocialComposer] = useState(false);

  if (!review) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleArchive = () => {
    startTransition(async () => {
      const result = await archiveReview(review.id);
      if (result.success) {
        onUpdate?.();
        onOpenChange(false);
      }
    });
  };

  const handleToggleFeatured = () => {
    startTransition(async () => {
      const result = await toggleReviewFeatured(review.id, !review.featured);
      if (result.success) {
        onUpdate?.();
      }
    });
  };

  const customerInitials = review.customerName
    ? review.customerName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const hasAiData = review.sentimentLabel || (review.themes && review.themes.length > 0);
  const hasSourceInfo = review.sourceUrl || review.syncedAt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-repwell-sage-100/40 to-transparent px-6 pt-6 pb-5 border-b border-border/50">
          <DialogHeader className="space-y-0">
            <div className="flex items-start justify-between gap-4 pr-8">
              {/* Customer identity */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-repwell-teal-300/10 text-label text-sm font-semibold shrink-0">
                  {customerInitials}
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold text-heading">
                    {review.customerName || "Anonymous"}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(review.reviewDate)}
                    </span>
                    {review.customerLocation && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {review.customerLocation}
                      </span>
                    )}
                  </DialogDescription>
                </div>
              </div>

              {/* Rating + badges */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      weight={i < review.rating ? "fill" : "regular"}
                      className={`h-4.5 w-4.5 ${
                        i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-repwell-sage-200"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <ReviewStatusBadge status={review.status} />
                  <Badge variant="secondary" className="text-xs">
                    {formatReviewSource(review.source)}
                  </Badge>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-5">
          {/* Review text — primary content, no box treatment */}
          <div>
            {review.title && (
              <h4 className="font-medium text-heading mb-1.5">{review.title}</h4>
            )}
            {review.text ? (
              <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                {review.text}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No written review provided
              </p>
            )}
          </div>

          {/* AI Analysis + Source — compact inline row */}
          {(hasAiData || hasSourceInfo) && (
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3.5 space-y-3">
              {/* Sentiment + themes */}
              {hasAiData && (
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-repwell-teal-300 mt-0.5 shrink-0" />
                  <div className="flex flex-wrap gap-1.5">
                    {review.sentimentLabel && (
                      <Badge
                        variant="outline"
                        className={
                          review.sentimentLabel.toLowerCase() === "positive"
                            ? "border-green-200 text-green-700 bg-green-50/50"
                            : review.sentimentLabel.toLowerCase() === "negative"
                              ? "border-red-200 text-red-700 bg-red-50/50"
                              : "border-border text-muted-foreground"
                        }
                      >
                        {review.sentimentLabel}
                      </Badge>
                    )}
                    {review.themes?.map((theme, i) => (
                      <Badge key={i} variant="outline" className="border-border/50 text-muted-foreground">
                        <Tags className="h-3 w-3 mr-1" />
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {review.keyPhrases && review.keyPhrases.length > 0 && (
                <p className="text-xs text-muted-foreground pl-5.5">
                  <span className="font-medium">Key phrases:</span> {review.keyPhrases.join(", ")}
                </p>
              )}
              {/* Source link */}
              {hasSourceInfo && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {hasAiData && <div className="w-3.5 shrink-0" />}
                  {review.sourceUrl && (() => {
                    try {
                      const url = new URL(review.sourceUrl);
                      if (!['http:', 'https:'].includes(url.protocol)) return null;
                      return (
                        <a
                          href={url.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-label hover:text-repwell-teal-500 dark:hover:text-foreground transition-colors inline-flex items-center gap-1"
                        >
                          View on {formatReviewSource(review.source)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      );
                    } catch {
                      return null;
                    }
                  })()}
                  {review.syncedAt && (
                    <>
                      <span className="text-border">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Synced {formatDateTime(review.syncedAt)}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Response — existing response shown inline */}
          {review.responseText && (
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <MessageSquare className="h-3.5 w-3.5 text-repwell-teal-300" />
                <span className="text-xs font-medium text-label uppercase tracking-wider">Your Response</span>
              </div>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{review.responseText}</p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDateTime(review.responseAt)}
              </p>
            </div>
          )}

          {/* Response composer — expandable */}
          {!review.responseText && showResponseForm && (
            <div className="rounded-lg border border-repwell-teal-300/20 bg-repwell-sage-100/10 dark:bg-repwell-teal-300/10 p-4">
              <ResponseComposer
                review={review}
                onSuccess={() => {
                  setShowResponseForm(false);
                  onUpdate?.();
                }}
                onCancel={() => setShowResponseForm(false)}
                hasAiAccess={hasAiAccess}
                draftOnly={!review.isPublished}
              />
            </div>
          )}
        </div>

        {/* ── Footer — actions + metadata ── */}
        <div className="border-t border-border/50 bg-muted/20 px-6 py-4 space-y-3">
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={review.featured ? "default" : "outline"}
              size="sm"
              onClick={handleToggleFeatured}
              disabled={isPending}
            >
              <Flag className="h-4 w-4 mr-1.5" />
              {review.featured ? "Featured" : "Feature"}
            </Button>
            {!review.responseText && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResponseForm(!showResponseForm)}
              >
                <MessageSquare className="h-4 w-4 mr-1.5" />
                {showResponseForm ? "Cancel" : "Respond"}
              </Button>
            )}
            {review.status !== "archived" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleArchive}
                disabled={isPending}
              >
                <Archive className="h-4 w-4 mr-1.5" />
                Archive
              </Button>
            )}
            {review.status === "approved" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSocialComposer(true)}
              >
                <Share2 className="h-4 w-4 mr-1.5" />
                Share
              </Button>
            )}
          </div>

          {/* Metadata — single compact line */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Created {formatDateTime(review.createdAt)}</span>
            {review.approvedAt && !review.publishedAt && <span>Published {formatDateTime(review.approvedAt)}</span>}
            {review.publishedAt && <span>Published {formatDateTime(review.publishedAt)}</span>}
          </div>
        </div>
      </DialogContent>

      {/* Social Post Composer */}
      <SocialPostComposer
        reviewId={review.id}
        reviewRating={review.rating}
        reviewText={review.text}
        customerName={review.customerName}
        open={showSocialComposer}
        onOpenChange={setShowSocialComposer}
        onSuccess={onUpdate}
      />
    </Dialog>
  );
}
