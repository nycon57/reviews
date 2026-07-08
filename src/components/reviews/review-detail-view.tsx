"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
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
  Copy,
  LinkSimple,
  Palette,
  GearSix,
  Sparkle as Sparkles,
  FileText,
  VideoCamera,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SourceIcon } from "@/components/shared/review-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  archiveReview,
  toggleReviewFeatured,
} from "@/lib/reviews/aggregation-actions";
import { approveReview, rejectReview } from "@/lib/reviews/actions";
import { reportReviewAsPro } from "@/lib/reviews/flag-actions";
import {
  FLAG_REASON_LABELS,
  type ReviewFlagReason,
} from "@/lib/reviews/types";
import { ResponseComposer } from "./response-composer";
import { SocialPostComposer } from "@/components/social";
import { toast } from "@/hooks/use-toast";
import { formatReviewSource } from "@/lib/reviews/source-labels";
import { ensureReviewSmartLink } from "@/lib/share-studio/actions";
import { ReviewShareAssets } from "./review-share-assets";
import { AssetCreatorModal } from "@/components/share-studio/asset-creator-modal";
import {
  PublishingStatusPanel,
  type PublishingStatus,
} from "./publishing-status-panel";
import { ReviewStatusBadge } from "./review-status-badge";
import { AnimatedSection } from "@/components/motion";

// ============================================================================
// Types
// ============================================================================

interface ReviewDetail {
  id: string;
  source: string;
  sourceReviewId: string | null;
  sourceUrl: string | null;
  rating: number;
  title: string | null;
  text: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerLocation: string | null;
  reviewDate: string | null;
  status: "pending" | "approved" | "rejected" | "archived";
  featured: boolean;
  rejectionReason: string | null;
  isPublished: boolean;
  responseText: string | null;
  responseStatus: "draft" | "pending_approval" | "approved" | "rejected" | "posted" | null;
  responseAt: string | null;
  responseBy: string | null;
  responseTemplateId: string | null;
  aiSuggestedResponse: string | null;
  responsePostedAt: string | null;
  sentimentScore: number | null;
  sentimentLabel: string | null;
  keyPhrases: string[] | null;
  themes: string[] | null;
  approvedAt: string | null;
  publishedAt: string | null;
  syncedAt: string | null;
  createdAt: string;
  updatedAt: string;
  loanOfficer?: {
    id: string;
    fullName: string;
    email: string;
    photoUrl: string | null;
  };
}

export interface LinkedVideoSummary {
  id: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  approvalStatus: string;
}

interface Props {
  review: ReviewDetail;
  userRole: "admin" | "manager" | "user";
  currentUserId?: string;
  hasAiAccess?: boolean;
  /** True when an unresolved dispute exists for this review (internal only) */
  hasOpenDispute?: boolean;
  /** The source video asset this review was extracted from, when one exists. */
  linkedVideo?: LinkedVideoSummary;
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SentimentBadge({ label }: { label: string | null }) {
  if (!label) return null;
  const colors: Record<string, string> = {
    positive: "border-green-200 text-green-700 bg-green-50/50",
    neutral: "border-border text-muted-foreground",
    negative: "border-red-200 text-red-700 bg-red-50/50",
  };
  return (
    <Badge variant="outline" className={colors[label.toLowerCase()] || "border-border text-muted-foreground"}>
      {label}
    </Badge>
  );
}

function formatVideoDuration(seconds: number | null): string | null {
  if (!seconds) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const VIDEO_ASSET_STATUS_LABELS: Record<string, string> = {
  pending: "Pending review",
  changes_requested: "Changes requested",
  approved: "Ready to publish",
  published: "Published",
  rejected: "Removed",
};

function LinkedVideoCard({ video }: { video: LinkedVideoSummary }) {
  const duration = formatVideoDuration(video.durationSeconds);
  const statusLabel =
    VIDEO_ASSET_STATUS_LABELS[video.approvalStatus] ?? video.approvalStatus;
  return (
    <Card className="border border-border shadow-soft overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="rounded-xl bg-repwell-teal-300/10 p-1.5">
            <VideoCamera className="h-4 w-4 text-repwell-teal-300" weight="duotone" />
          </div>
          Source video
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <Link
          href={`/dashboard/reviews/${video.id}?type=video`}
          className="block"
          aria-label="Open the source video review"
        >
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt="Source video thumbnail"
              className="aspect-video w-full rounded-lg border border-border object-cover"
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-border bg-muted">
              <VideoCamera className="h-8 w-8 text-muted-foreground/50" weight="duotone" />
            </div>
          )}
        </Link>
        <div className="flex items-center justify-between gap-2 text-sm">
          <Badge variant="outline" className="text-muted-foreground">
            {statusLabel}
          </Badge>
          {duration && (
            <span className="text-xs text-muted-foreground">{duration}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          This review was extracted from a video review. The video has its
          own publishing controls that determine where it can appear.
        </p>
        <Link href={`/dashboard/reviews/${video.id}?type=video`}>
          <Button variant="outline" size="sm" className="w-full gap-2">
            <VideoCamera className="h-4 w-4" weight="duotone" />
            View video
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ReviewDetailView({
  review,
  userRole,
  currentUserId,
  hasAiAccess = true,
  hasOpenDispute = false,
  linkedVideo,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showSocialComposer, setShowSocialComposer] = useState(false);
  const [assetCreatorOpen, setAssetCreatorOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState<Set<string>>(new Set());
  const [assetsRefreshToken, setAssetsRefreshToken] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReviewFlagReason | "">("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const addBusy = (key: string) => setShareBusy(prev => new Set(prev).add(key));
  const removeBusy = (key: string) => setShareBusy(prev => { const next = new Set(prev); next.delete(key); return next; });

  const canManage = userRole === "admin" || userRole === "manager";
  const canManagePublishing =
    canManage || (!!currentUserId && review.loanOfficer?.id === currentUserId);
  const canRespond =
    canManage || (!!currentUserId && review.loanOfficer?.id === currentUserId);
  const publishingStatus: PublishingStatus =
    review.status === "approved" && review.isPublished ? "published" : review.status;
  const isLive = review.status === "approved" && review.isPublished;
  const canComposeResponse =
    canRespond && review.status !== "archived" && review.status !== "rejected";
  const responseDraftOnly = canComposeResponse && !isLive;
  const responseIsDraft = review.responseStatus === "draft";
  const hasPostedResponse =
    !!review.responseText && review.responseStatus !== "draft";
  const responseSourceLabel = review.responseTemplateId
    ? "Canned response"
    : review.aiSuggestedResponse && review.responseText === review.aiSuggestedResponse
      ? "AI generated"
      : null;
  const handleReportReview = async () => {
    if (!reportReason) return;
    setReportSubmitting(true);
    try {
      const result = await reportReviewAsPro({
        reviewId: review.id,
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });
      if (result.success) {
        toast({ title: "Report submitted" });
        setReportOpen(false);
        setReportReason("");
        setReportDetails("");
        router.refresh();
      } else {
        toast({
          title: "Failed to submit report",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setReportSubmitting(false);
    }
  };

  const handlePublishReview = async () => {
    const result = await approveReview({
      reviewId: review.id,
    });
    if (result.success) {
      toast({ title: "Review published" });
      router.refresh();
    } else {
      toast({
        title: "Failed to publish review",
        description: result.error || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectReview = async (reason: string) => {
    const result = await rejectReview({ reviewId: review.id, reason });
    if (result.success) {
      toast({ title: "Review removed" });
      router.refresh();
    } else {
      toast({
        title: "Failed to remove review",
        description: result.error || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleArchive = () => {
    startTransition(async () => {
      const result = await archiveReview(review.id);
      if (result.success) {
        toast({ title: "Review archived successfully" });
        router.refresh();
      } else {
        toast({
          title: "Failed to archive review",
          variant: "destructive",
        });
      }
    });
  };

  const handleToggleFeatured = () => {
    startTransition(async () => {
      const result = await toggleReviewFeatured(review.id, !review.featured);
      if (result.success) {
        toast({
          title: review.featured ? "Removed from featured" : "Added to featured",
        });
        router.refresh();
      } else {
        toast({
          title: "Failed to update featured status",
          variant: "destructive",
        });
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

  const resolveSmartLinkUrl = async (): Promise<string | null> => {
    const result = await ensureReviewSmartLink(review.id);
    if (!result.success || !result.url) {
      toast({
        title: "Unable to create Smart Link",
        description: result.error || "Please try again.",
        variant: "destructive",
      });
      return null;
    }
    return `${window.location.origin}${result.url}`;
  };

  const handleCopySmartLink = () => {
    addBusy("link");
    void (async () => {
      try {
        const url = await resolveSmartLinkUrl();
        if (!url) return;
        await navigator.clipboard.writeText(url);
        toast({ title: "Smart Link copied" });
        setAssetsRefreshToken((value) => value + 1);
      } catch {
        toast({
          title: "Copy failed",
          description: "Could not copy Smart Link.",
          variant: "destructive",
        });
      } finally {
        removeBusy("link");
      }
    })();
  };

  const handleOpenSmartLink = () => {
    addBusy("link");
    void (async () => {
      try {
        const url = await resolveSmartLinkUrl();
        if (!url) return;
        window.open(url, "_blank", "noopener,noreferrer");
        setAssetsRefreshToken((value) => value + 1);
      } finally {
        removeBusy("link");
      }
    })();
  };

  const hasAiData = review.sentimentLabel || (review.themes && review.themes.length > 0);
  const hasSourceInfo = review.sourceUrl || review.sourceReviewId;

  return (
    <div className="flex-1 space-y-6">
      {/* Back link */}
      <Link href="/dashboard/reviews">
        <Button variant="ghost" size="sm" className="gap-2 hover:text-repwell-teal-400 dark:hover:text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Reviews
        </Button>
      </Link>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Review — unified hero card */}
          <Card className="border border-border shadow-soft overflow-hidden">
            {/* Gradient header with customer info */}
            <div className="bg-gradient-to-r from-repwell-sage-100/40 to-transparent px-6 pt-5 pb-4 border-b border-border/50">
              <div className="flex items-start gap-4">
                <div
                  role="img"
                  aria-label={review.customerName || "Customer avatar"}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-repwell-teal-300/10 text-label shrink-0 text-base font-semibold"
                >
                  {customerInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold text-xl text-heading truncate">
                      {review.customerName || "Anonymous"}
                    </h2>
                    <div className="flex items-center gap-2 shrink-0">
                      <ReviewStatusBadge status={review.status} />
                      {hasOpenDispute && (
                        <Badge
                          variant="outline"
                          className="border-amber-500/50 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                        >
                          Disputed
                        </Badge>
                      )}
                      <SourceIcon source={review.source} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-sm text-muted-foreground">
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
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="pt-5 pb-6 px-6 space-y-5">
              {/* Review title with star rating */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  {review.title && (
                    <h3 className="font-medium text-lg text-heading">{review.title}</h3>
                  )}
                  <div className="flex items-center gap-0.5 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        weight={i < review.rating ? "fill" : "regular"}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-repwell-sage-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {review.text ? (
                  <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
                    {review.text}
                  </p>
                ) : (
                  <p className="text-muted-foreground/60 italic">
                    No written review provided
                  </p>
                )}
              </div>

              {/* AI Analysis — inline box (matching modal pattern) */}
              {hasAiData && (
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3.5 space-y-3">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-repwell-teal-300 mt-0.5 shrink-0" weight="duotone" />
                    <div className="flex flex-wrap gap-1.5">
                      {review.sentimentLabel && <SentimentBadge label={review.sentimentLabel} />}
                      {review.themes?.map((theme) => (
                        <Badge key={theme} variant="outline" className="border-border/50 text-muted-foreground">
                          <Tags className="h-3 w-3 mr-1" />
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {review.keyPhrases && review.keyPhrases.length > 0 && (
                    <p className="text-xs text-muted-foreground pl-5.5">
                      <span className="font-medium">Key phrases:</span> {review.keyPhrases.join(", ")}
                    </p>
                  )}
                </div>
              )}

              {/* Source info — inline within the card */}
              {hasSourceInfo && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {review.sourceUrl && (
                    <a
                      href={review.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-label hover:text-repwell-teal-500 dark:hover:text-foreground transition-colors inline-flex items-center gap-1"
                    >
                      View on {formatReviewSource(review.source)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {review.sourceUrl && review.syncedAt && (
                    <span className="text-border">&middot;</span>
                  )}
                  {review.syncedAt && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Synced {formatDateTime(review.syncedAt)}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {(hasPostedResponse || canComposeResponse) && (
            <Card className="border border-border shadow-soft overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3 text-lg">
                  <span className="flex items-center gap-2">
                    <div className="rounded-xl bg-repwell-teal-300/10 p-1.5">
                      <MessageSquare className="h-4 w-4 text-repwell-teal-300" weight="duotone" />
                    </div>
                    Response
                  </span>
                  {responseIsDraft && (
                    <Badge variant="outline" className="border-amber-500/50 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                      Draft
                    </Badge>
                  )}
                  {hasPostedResponse && (
                    <Badge variant="outline" className="border-repwell-sage-200/60 bg-repwell-sage-100/40 text-repwell-teal-500">
                      Posted
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {hasPostedResponse ? (
                  <div className="space-y-3">
                    <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                      {review.responseText}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(review.responsePostedAt || review.responseAt)}
                      </span>
                      {responseSourceLabel && (
                        <Badge variant="outline" className="gap-1 border-border/60 text-xs text-muted-foreground">
                          {responseSourceLabel === "AI generated" ? (
                            <Sparkles className="h-3 w-3" />
                          ) : (
                            <FileText className="h-3 w-3" />
                          )}
                          {responseSourceLabel}
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <ResponseComposer
                    review={review}
                    onSuccess={() => router.refresh()}
                    hasAiAccess={hasAiAccess}
                    draftOnly={responseDraftOnly}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          <AnimatedSection>
            <PublishingStatusPanel
              status={publishingStatus}
              canManage={canManagePublishing}
              publishedAt={review.publishedAt}
              rejectionReason={review.rejectionReason}
              onPublish={handlePublishReview}
              onReject={handleRejectReview}
              allowRejectWhenLive={false}
            />
          </AnimatedSection>

          {/* Source video - for reviews extracted from a video review */}
          {linkedVideo && (
            <AnimatedSection delay={0.02}>
              <LinkedVideoCard video={linkedVideo} />
            </AnimatedSection>
          )}

          {/* Live reviews can only be removed through a dispute */}
          {isLive && (
            <AnimatedSection delay={0.03}>
              <Button
                variant="outline"
                className="w-full gap-2 text-muted-foreground"
                onClick={() => setReportOpen(true)}
              >
                <Flag className="h-4 w-4" weight="duotone" />
                Report this review
              </Button>
            </AnimatedSection>
          )}

          {/* Share Studio — approved only */}
          {review.status === "approved" && review.isPublished && (
            <>
            <AnimatedSection delay={0.05}>
            <Card className="border border-border shadow-soft overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="rounded-xl bg-repwell-teal-300/10 p-1.5">
                    <Share2 className="h-4 w-4 text-repwell-teal-300" weight="duotone" />
                  </div>
                  Share Studio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleCopySmartLink}
                  disabled={shareBusy.has("link")}
                  aria-label="Copy smart link to clipboard"
                >
                  <Copy className="h-4 w-4" weight="duotone" />
                  Copy Smart Link
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleOpenSmartLink}
                  disabled={shareBusy.has("link")}
                  aria-label="Open smart link in new tab"
                >
                  <LinkSimple className="h-4 w-4" weight="duotone" />
                  Open Smart Link
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setAssetCreatorOpen(true)}
                  aria-label="Create a shareable asset"
                >
                  <Palette className="h-4 w-4" weight="duotone" />
                  Create Asset
                </Button>
              </CardContent>
            </Card>
            </AnimatedSection>

            <ReviewShareAssets
              sourceType="review"
              sourceId={review.id}
              refreshToken={assetsRefreshToken}
            />
            </>
          )}

          {/* Actions */}
          {canManage && (
            <AnimatedSection delay={0.1}>
            <Card className="border border-border shadow-soft overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="rounded-xl bg-repwell-teal-300/10 p-1.5">
                    <GearSix className="h-4 w-4 text-repwell-teal-300" weight="duotone" />
                  </div>
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {review.status === "approved" && (
                  <Button
                    variant={review.featured ? "default" : "outline"}
                    className="w-full gap-2"
                    onClick={handleToggleFeatured}
                    disabled={isPending}
                  >
                    <Flag className="h-4 w-4" weight="duotone" />
                    {review.featured ? "Featured" : "Feature"}
                  </Button>
                )}
                {review.status === "approved" && review.isPublished && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setShowSocialComposer(true)}
                  >
                    <Share2 className="h-4 w-4" weight="duotone" />
                    Share to Social
                  </Button>
                )}
                {(review.status === "approved" || review.status === "rejected") && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-muted-foreground"
                    onClick={handleArchive}
                    disabled={isPending}
                  >
                    <Archive className="h-4 w-4" weight="duotone" />
                    Archive
                  </Button>
                )}
              </CardContent>
            </Card>
            </AnimatedSection>
          )}

          {/* Timeline */}
          <AnimatedSection delay={0.2}>
          <Card className="border border-border shadow-soft overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="rounded-xl bg-repwell-teal-300/10 p-1.5">
                  <Calendar className="h-4 w-4 text-repwell-teal-300" weight="duotone" />
                </div>
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Created</dt>
                  <dd className="font-medium text-heading">{formatDateTime(review.createdAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Updated</dt>
                  <dd className="font-medium text-heading">{formatDateTime(review.updatedAt)}</dd>
                </div>
                {review.approvedAt && !review.publishedAt && (
                  <div className="flex justify-between">
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Published</dt>
                    <dd className="font-medium text-heading">{formatDateTime(review.approvedAt)}</dd>
                  </div>
                )}
                {review.publishedAt && (
                  <div className="flex justify-between">
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Published</dt>
                    <dd className="font-medium text-heading">{formatDateTime(review.publishedAt)}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
          </AnimatedSection>
        </div>
      </div>

      {/* Report review dialog */}
      <Dialog open={reportOpen} onOpenChange={(open) => !reportSubmitting && setReportOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this review</DialogTitle>
            <DialogDescription>
              The review stays live while the dispute is reviewed. It is only
              removed if the dispute is upheld.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-review-reason">Grounds</Label>
              <Select
                value={reportReason}
                onValueChange={(value) => setReportReason(value as ReviewFlagReason)}
              >
                <SelectTrigger id="report-review-reason">
                  <SelectValue placeholder="Select grounds for the report" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FLAG_REASON_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-review-details">Details</Label>
              <Textarea
                id="report-review-details"
                value={reportDetails}
                onChange={(event) => setReportDetails(event.target.value)}
                placeholder="Describe the issue..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReportOpen(false)}
              disabled={reportSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleReportReview}
              disabled={!reportReason || reportSubmitting}
            >
              {reportSubmitting ? "Submitting..." : "Submit report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Social Post Composer */}
      <SocialPostComposer
        reviewId={review.id}
        reviewRating={review.rating}
        reviewText={review.text}
        customerName={review.customerName}
        open={showSocialComposer}
        onOpenChange={setShowSocialComposer}
        onSuccess={() => router.refresh()}
      />

      {/* Asset Creator Modal — approved only */}
      {review.status === "approved" && review.isPublished && (
        <AssetCreatorModal
          open={assetCreatorOpen}
          onOpenChange={setAssetCreatorOpen}
          sourceType="review"
          sourceId={review.id}
          reviewData={{
            text: review.text,
            customerName: review.customerName,
            rating: review.rating,
          }}
          onQueued={() => setAssetsRefreshToken((v) => v + 1)}
        />
      )}
    </div>
  );
}
