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
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SourceIcon } from "@/components/shared/review-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  archiveReview,
  toggleReviewFeatured,
} from "@/lib/reviews/aggregation-actions";
import { ResponseComposer } from "./response-composer";
import { SocialPostComposer } from "@/components/social";
import { toast } from "@/hooks/use-toast";
import { ensureReviewSmartLink } from "@/lib/share-studio/actions";
import { ReviewShareAssets } from "./review-share-assets";
import { AssetCreatorModal } from "@/components/share-studio/asset-creator-modal";
import { AnimatedPresence, AnimatedSection } from "@/components/motion";

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
  responseText: string | null;
  responseAt: string | null;
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

interface Props {
  review: ReviewDetail;
  userRole: "admin" | "manager" | "user";
  hasAiAccess?: boolean;
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

// ============================================================================
// Badge Components
// ============================================================================

function StatusBadge({ status }: { status: ReviewDetail["status"] }) {
  const variants = {
    pending: "border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 dark:text-yellow-400",
    approved: "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400",
    rejected: "border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400",
    archived: "border-border text-muted-foreground bg-muted",
  };
  return (
    <Badge variant="outline" className={variants[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
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

// ============================================================================
// Main Component
// ============================================================================

export function ReviewDetailView({ review, userRole, hasAiAccess = true }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [showSocialComposer, setShowSocialComposer] = useState(false);
  const [assetCreatorOpen, setAssetCreatorOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState<Set<string>>(new Set());
  const [assetsRefreshToken, setAssetsRefreshToken] = useState(0);

  const addBusy = (key: string) => setShareBusy(prev => new Set(prev).add(key));
  const removeBusy = (key: string) => setShareBusy(prev => { const next = new Set(prev); next.delete(key); return next; });

  const canManage = userRole === "admin" || userRole === "manager";

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
                      <StatusBadge status={review.status} />
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
                      {review.themes?.map((theme, i) => (
                        <Badge key={i} variant="outline" className="border-border/50 text-muted-foreground">
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
                      View on {review.source.charAt(0).toUpperCase() + review.source.slice(1)}
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

          {/* Response Section — inline box */}
          {review.responseText && (
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <MessageSquare className="h-3.5 w-3.5 text-repwell-teal-300" weight="duotone" />
                <span className="text-xs font-medium text-label uppercase tracking-wider">Your Response</span>
              </div>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{review.responseText}</p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDateTime(review.responseAt)}
              </p>
            </div>
          )}

          {/* Response Form */}
          <AnimatedPresence show={!review.responseText && showResponseForm} mode="slide-up">
            <div className="rounded-lg border border-repwell-teal-300/20 bg-repwell-sage-100/10 dark:bg-repwell-teal-300/10 p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <MessageSquare className="h-3.5 w-3.5 text-repwell-teal-300" weight="duotone" />
                <span className="text-xs font-medium text-label uppercase tracking-wider">Compose Response</span>
              </div>
              <ResponseComposer
                review={review}
                onSuccess={() => {
                  setShowResponseForm(false);
                  router.refresh();
                }}
                onCancel={() => setShowResponseForm(false)}
                hasAiAccess={hasAiAccess}
              />
            </div>
          </AnimatedPresence>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Share Studio */}
          <AnimatedSection>
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
                <Button
                  variant={review.featured ? "default" : "outline"}
                  className="w-full gap-2"
                  onClick={handleToggleFeatured}
                  disabled={isPending}
                >
                  <Flag className="h-4 w-4" weight="duotone" />
                  {review.featured ? "Featured" : "Feature"}
                </Button>
                {!review.responseText && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setShowResponseForm(!showResponseForm)}
                  >
                    <MessageSquare className="h-4 w-4" weight="duotone" />
                    Respond
                  </Button>
                )}
                {review.status === "approved" && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setShowSocialComposer(true)}
                  >
                    <Share2 className="h-4 w-4" weight="duotone" />
                    Share to Social
                  </Button>
                )}
                {review.status !== "archived" && (
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
                {review.approvedAt && (
                  <div className="flex justify-between">
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Approved</dt>
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

      {/* Asset Creator Modal */}
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
    </div>
  );
}
