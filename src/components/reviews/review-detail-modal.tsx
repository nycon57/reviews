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
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  ExternalLink,
  Archive,
  Flag,
  MessageSquare,
  Calendar,
  MapPin,
  User,
  Building2,
  TrendingUp,
  Tags,
  Clock,
  Share2,
} from "lucide-react";
import type { AggregatedReview } from "@/lib/reviews/types";
import {
  archiveReview,
  toggleReviewFeatured,
} from "@/lib/reviews/aggregation-actions";
import { ResponseComposer } from "./response-composer";
import { SocialPostComposer } from "@/components/social";

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
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: AggregatedReview["status"]) => {
    const variants = {
      pending: "border-yellow-500 text-yellow-600 bg-yellow-50",
      approved: "border-green-500 text-green-600 bg-green-50",
      rejected: "border-red-500 text-red-600 bg-red-50",
      archived: "border-gray-400 text-gray-500 bg-gray-50",
    };
    return (
      <Badge variant="outline" className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      internal: "bg-blue-100 text-blue-700",
      google: "bg-red-100 text-red-700",
      zillow: "bg-purple-100 text-purple-700",
      facebook: "bg-indigo-100 text-indigo-700",
      yelp: "bg-orange-100 text-orange-700",
    };
    return (
      <Badge className={colors[source] || "bg-gray-100 text-gray-700"}>
        {source === "internal" ? "Survey" : source.charAt(0).toUpperCase() + source.slice(1)}
      </Badge>
    );
  };

  const getSentimentBadge = (label: string | null) => {
    if (!label) return null;
    const colors: Record<string, string> = {
      positive: "bg-green-100 text-green-700",
      neutral: "bg-gray-100 text-gray-700",
      negative: "bg-red-100 text-red-700",
    };
    return (
      <Badge className={colors[label.toLowerCase()] || "bg-gray-100 text-gray-700"}>
        {label}
      </Badge>
    );
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Review Details</span>
            {getStatusBadge(review.status)}
            {getSourceBadge(review.source)}
          </DialogTitle>
          <DialogDescription>
            View full review context and manage this review
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer & Rating Section */}
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 text-lg font-semibold">
              {customerInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    {review.customerName || "Anonymous"}
                  </h3>
                  {review.customerLocation && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {review.customerLocation}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(review.reviewDate)}
              </div>
            </div>
          </div>

          <Separator />

          {/* Review Content */}
          <div className="space-y-3">
            {review.title && (
              <h4 className="font-medium text-lg">{review.title}</h4>
            )}
            {review.text ? (
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {review.text}
              </p>
            ) : (
              <p className="text-muted-foreground/60 italic">
                No written review provided
              </p>
            )}
          </div>

          {/* Sentiment & Themes */}
          {(review.sentimentLabel || (review.themes && review.themes.length > 0)) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  AI Analysis
                </h4>
                <div className="flex flex-wrap gap-2">
                  {review.sentimentLabel && getSentimentBadge(review.sentimentLabel)}
                  {review.themes?.map((theme, i) => (
                    <Badge key={i} variant="outline" className="flex items-center gap-1">
                      <Tags className="h-3 w-3" />
                      {theme}
                    </Badge>
                  ))}
                </div>
                {review.keyPhrases && review.keyPhrases.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Key phrases: </span>
                    {review.keyPhrases.join(", ")}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Loan Officer Info */}
          <Separator />
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Loan Officer
            </h4>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={review.loanOfficer?.photoUrl || undefined} />
                <AvatarFallback>
                  {review.loanOfficer?.fullName
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "LO"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{review.loanOfficer?.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {review.loanOfficer?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Response Section */}
          {review.responseText && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Response
                </h4>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap">{review.responseText}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Responded on {formatDateTime(review.responseAt)}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Response Form */}
          {!review.responseText && showResponseForm && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Compose Response
                </h4>
                <ResponseComposer
                  review={review}
                  onSuccess={() => {
                    setShowResponseForm(false);
                    onUpdate?.();
                  }}
                  onCancel={() => setShowResponseForm(false)}
                  hasAiAccess={hasAiAccess}
                />
              </div>
            </>
          )}

          {/* Source Info */}
          {(review.sourceUrl || review.sourceReviewId) && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Source Information
                </h4>
                {review.sourceUrl && (
                  <a
                    href={review.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    View on {review.source.charAt(0).toUpperCase() + review.source.slice(1)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {review.syncedAt && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last synced: {formatDateTime(review.syncedAt)}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex flex-wrap gap-2">
            <Button
              variant={review.featured ? "default" : "outline"}
              size="sm"
              onClick={handleToggleFeatured}
              disabled={isPending}
            >
              <Flag className="h-4 w-4 mr-1" />
              {review.featured ? "Featured" : "Feature"}
            </Button>
            {!review.responseText && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResponseForm(!showResponseForm)}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Respond
              </Button>
            )}
            {review.status !== "archived" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleArchive}
                disabled={isPending}
              >
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
            )}
            {review.status === "approved" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSocialComposer(true)}
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share to Social
              </Button>
            )}
          </div>

          {/* Metadata */}
          <div className="text-xs text-muted-foreground border-t pt-4 grid grid-cols-2 gap-2">
            <div>Created: {formatDateTime(review.createdAt)}</div>
            <div>Updated: {formatDateTime(review.updatedAt)}</div>
            {review.approvedAt && (
              <div>Approved: {formatDateTime(review.approvedAt)}</div>
            )}
            {review.publishedAt && (
              <div>Published: {formatDateTime(review.publishedAt)}</div>
            )}
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
