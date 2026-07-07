"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  FileText,
  User,
  Clock,
  CheckCircle,
  XCircle,
  ShareNetwork as Share2,
  Chats as MessageSquare,
  Calendar,
  Copy,
  LinkSimple,
  Palette,
  Star,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  getVideoSignedUrl,
  updateVideoApprovalStatus,
} from "@/lib/video-testimonials/actions";
import { ensureVideoSmartLink } from "@/lib/share-studio/actions";
import {
  QuarantineBadge,
  CustomerRatingStars,
} from "@/components/video-library/video-shared";
import { VideoPlayerSection } from "./video-player-section";
import { VideoFeedbackSection } from "./video-feedback-section";
import { ReviewShareAssets } from "./review-share-assets";
import { AssetCreatorModal } from "@/components/share-studio/asset-creator-modal";
import {
  PublishingStatusPanel,
  type PublishingStatus,
} from "./publishing-status-panel";
import { AnimatedSection } from "@/components/motion";

// ============================================================================
// Types
// ============================================================================

interface VideoDetail {
  id: string;
  videoPath: string;
  thumbnailUrl: string | null;
  transcription: string | null;
  transcriptionStatus: string | null;
  aiGeneratedText: string | null;
  sentimentScore: number | null;
  sentimentLabel: string | null;
  customerRating: number | null;
  quarantined: boolean;
  keyPhrases: string[] | null;
  durationSeconds: number | null;
  fileSizeBytes: number | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  approvalStatus: string;
  rejectionReason: string | null;
  managerNotes: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  publishedAt: string | null;
  submittedAt: string;
  customerName: string;
  customerEmail: string;
  loanOfficerId: string;
  loanOfficerName: string;
  loanOfficerEmail: string;
  requestId: string;
}

export interface LinkedReviewSummary {
  id: string;
  rating: number;
  text: string | null;
  customerName: string | null;
  status: "pending" | "approved" | "rejected" | "archived";
  isPublished: boolean;
}

interface Props {
  video: VideoDetail;
  userRole: "admin" | "manager" | "user";
  /** The published written review extracted from this video, when one exists. */
  linkedReview?: LinkedReviewSummary;
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDateLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "Unknown";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

// ============================================================================
// Status Badge
// ============================================================================

function ApprovalStatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "outline" | "destructive";
      icon: typeof Clock;
      className?: string;
    }
  > = {
    pending: { label: "Pending Review", variant: "secondary", icon: Clock },
    changes_requested: {
      label: "Changes Requested",
      variant: "outline",
      icon: MessageSquare,
      className: "border-amber-500/50 text-amber-600",
    },
    approved: { label: "Approved", variant: "default", icon: CheckCircle },
    rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
    published: { label: "Published", variant: "default", icon: Share2 },
  };

  const {
    label,
    variant,
    icon: Icon,
    className,
  } = config[status] || config.pending;

  return (
    <Badge variant={variant} className={cn("gap-1", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function ReviewRecordBadge({
  status,
  isPublished,
}: {
  status: LinkedReviewSummary["status"];
  isPublished: boolean;
}) {
  if (status === "approved" && isPublished) {
    return (
      <Badge
        variant="outline"
        className="border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400"
      >
        Live
      </Badge>
    );
  }
  const config: Record<LinkedReviewSummary["status"], { label: string; className: string }> = {
    pending: {
      label: "Needs attention",
      className:
        "border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 dark:text-yellow-400",
    },
    approved: {
      label: "Approved",
      className:
        "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400",
    },
    rejected: {
      label: "Removed",
      className:
        "border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400",
    },
    archived: {
      label: "Archived",
      className: "border-border text-muted-foreground bg-muted",
    },
  };
  const { label, className } = config[status];
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

function LinkedReviewCard({ review }: { review: LinkedReviewSummary }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-3 text-base">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Review record
          </span>
          <ReviewRecordBadge status={review.status} isPublished={review.isPublished} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                weight={i < review.rating ? "fill" : "regular"}
                className={cn(
                  "h-4 w-4",
                  i < review.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/40"
                )}
              />
            ))}
          </div>
          <span className="text-sm font-medium">
            {review.customerName || "Anonymous"}
          </span>
        </div>
        {review.text ? (
          <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
            {review.text}
          </p>
        ) : (
          <p className="text-sm italic text-muted-foreground/60">
            No written review text
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          This is the written review extracted from the video. It publishes on
          its own and is only removed through an upheld dispute.
        </p>
        <Link href={`/dashboard/reviews/${review.id}`}>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowSquareOut className="h-4 w-4" />
            View review record
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function VideoDetailView({ video, userRole, linkedReview }: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(true);
  const [activeTab, setActiveTab] = useState<"video" | "transcription" | "details">("video");

  const [shareBusy, setShareBusy] = useState<Set<string>>(new Set());
  const [assetsRefreshToken, setAssetsRefreshToken] = useState(0);
  const [assetCreatorOpen, setAssetCreatorOpen] = useState(false);

  const addBusy = (key: string) => setShareBusy(prev => new Set(prev).add(key));
  const removeBusy = (key: string) => setShareBusy(prev => { const next = new Set(prev); next.delete(key); return next; });

  const canManage = userRole === "admin" || userRole === "manager";
  const publishingStatus = video.approvalStatus as PublishingStatus;
  const canShare = ["approved", "published"].includes(video.approvalStatus);

  // Load video URL on mount
  useEffect(() => {
    let isMounted = true;

    async function loadVideo() {
      setIsLoadingUrl(true);
      try {
        const result = await getVideoSignedUrl(video.videoPath);
        if (!isMounted) return;

        if (result.success && result.data) {
          setSignedUrl(result.data.signedUrl);
        } else {
          console.error("Failed to load video URL:", result.error);
          toast({
            title: "Error",
            description: result.error || "Failed to load video",
            variant: "destructive",
          });
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error loading video URL:", error);
        toast({
          title: "Error",
          description: "Failed to load video",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setIsLoadingUrl(false);
        }
      }
    }
    loadVideo();

    return () => {
      isMounted = false;
    };
  }, [video.videoPath]);

  const runApprovalAction = async (
    action: "approve" | "publish" | "reject",
    pastTense: string,
    payload?: { reason: string }
  ) => {
    const result = await updateVideoApprovalStatus(video.id, action, payload);
    if (result.success) {
      toast({ title: `Video ${pastTense}` });
      router.refresh();
    } else {
      toast({
        title: `Failed to ${action} video`,
        description: result.error || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleApproveVideo = () => runApprovalAction("approve", "approved");
  const handlePublishVideo = () => runApprovalAction("publish", "published");
  const handleRejectVideo = (reason: string) =>
    runApprovalAction("reject", "rejected", { reason });

  const resolveSmartLinkUrl = useCallback(async (): Promise<string | null> => {
    const result = await ensureVideoSmartLink(video.id);
    if (!result.success || !result.url) {
      toast({
        title: "Unable to create Smart Link",
        description: result.error || "Please try again.",
        variant: "destructive",
      });
      return null;
    }
    return `${window.location.origin}${result.url}`;
  }, [video.id]);

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

  return (
    <div className="flex-1 space-y-6">
      {/* Back link and header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/reviews?tab=videos">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Reviews
            </Button>
          </Link>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {video.customerName}&apos;s Testimonial
            </h1>
            <p className="text-sm text-muted-foreground">
              For {video.loanOfficerName}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <CustomerRatingStars rating={video.customerRating} />
          {video.quarantined && <QuarantineBadge />}
          <ApprovalStatusBadge status={video.approvalStatus} />
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Video player and tabs - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <VideoPlayerSection
            signedUrl={signedUrl}
            isLoadingUrl={isLoadingUrl}
            thumbnailUrl={video.thumbnailUrl}
            videoRef={videoRef}
          />

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="video" className="gap-2">
                <Play className="h-4 w-4" />
                Video
              </TabsTrigger>
              <TabsTrigger value="transcription" className="gap-2">
                <FileText className="h-4 w-4" />
                Transcription
              </TabsTrigger>
              <TabsTrigger value="details" className="gap-2">
                <User className="h-4 w-4" />
                Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="video" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Video Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                    <div>
                      <dt className="text-muted-foreground">Duration</dt>
                      <dd className="font-medium">{formatDuration(video.durationSeconds)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">File Size</dt>
                      <dd className="font-medium">{formatFileSize(video.fileSizeBytes)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Resolution</dt>
                      <dd className="font-medium">
                        {video.width && video.height
                          ? `${video.width}x${video.height}`
                          : "Unknown"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Format</dt>
                      <dd className="font-medium">{video.mimeType || "Unknown"}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transcription" className="mt-4">
              <VideoFeedbackSection video={video} canManage={canManage} />
            </TabsContent>

            <TabsContent value="details" className="mt-4 space-y-4">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Name</dt>
                      <dd className="font-medium">{video.customerName}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Email</dt>
                      <dd className="font-medium">{video.customerEmail}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Professional Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4" />
                    Professional
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Name</dt>
                      <dd className="font-medium">{video.loanOfficerName}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Email</dt>
                      <dd className="font-medium">{video.loanOfficerEmail}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Submitted</dt>
                      <dd className="font-medium">{formatDateLong(video.submittedAt)}</dd>
                    </div>
                    {video.approvedAt && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Approved</dt>
                        <dd className="font-medium">{formatDateLong(video.approvedAt)}</dd>
                      </div>
                    )}
                    {video.publishedAt && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Published</dt>
                        <dd className="font-medium">{formatDateLong(video.publishedAt)}</dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {linkedReview && <LinkedReviewCard review={linkedReview} />}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <AnimatedSection>
            <PublishingStatusPanel
              status={publishingStatus}
              canManage={canManage}
              publishedAt={video.publishedAt}
              rejectionReason={video.rejectionReason}
              onApprove={handleApproveVideo}
              onPublish={handlePublishVideo}
              onReject={handleRejectVideo}
              contextNote={
                linkedReview
                  ? "Controls where the video itself can appear. The written review publishes separately."
                  : undefined
              }
            />
          </AnimatedSection>

          {canShare && (
            <>
          <AnimatedSection delay={0.05}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Share Studio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleCopySmartLink}
                disabled={shareBusy.has("link")}
                aria-label="Copy smart link to clipboard"
              >
                <Copy className="h-4 w-4" />
                Copy Smart Link
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleOpenSmartLink}
                disabled={shareBusy.has("link")}
                aria-label="Open smart link in new tab"
              >
                <LinkSimple className="h-4 w-4" />
                Open Smart Link
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setAssetCreatorOpen(true)}
                aria-label="Create a shareable asset"
              >
                <Palette className="h-4 w-4" />
                Create Asset
              </Button>
            </CardContent>
          </Card>
          </AnimatedSection>

          <ReviewShareAssets
            sourceType="video_testimonial"
            sourceId={video.id}
            refreshToken={assetsRefreshToken}
          />
            </>
          )}
        </div>
      </div>

      {/* Asset Creator Modal */}
      {canShare && (
        <AssetCreatorModal
          open={assetCreatorOpen}
          onOpenChange={setAssetCreatorOpen}
          sourceType="video_testimonial"
          sourceId={video.id}
          reviewData={{
            text: video.aiGeneratedText || video.transcription,
            customerName: video.customerName,
            rating: video.sentimentScore
              ? Math.max(1, Math.min(5, Math.round((video.sentimentScore / 100) * 5)))
              : 5,
          }}
          clipSource={{
            transcript: video.transcription,
            durationSeconds: video.durationSeconds,
          }}
          onQueued={() => setAssetsRefreshToken((v) => v + 1)}
        />
      )}
    </div>
  );
}
