"use client";

import { useState, useCallback, useEffect, useRef, memo } from "react";
import {
  Search,
  RefreshCw,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Trash2,
  User,
  Calendar,
  AlertCircle,
  Loader2,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type {
  VideoTestimonialResponse,
  VideoLibraryStats,
} from "@/lib/video-testimonials/actions";
import {
  getVideoTestimonialResponses,
  getVideoSignedUrl,
  updateVideoApprovalStatus,
  deleteVideoTestimonialResponse,
} from "@/lib/video-testimonials/actions";

// ============================================================================
// Types
// ============================================================================

interface LoanOfficer {
  id: string;
  fullName: string;
  email: string;
}

interface Props {
  initialResponses: VideoTestimonialResponse[];
  initialTotal: number;
  initialStats: VideoLibraryStats;
  loanOfficers: LoanOfficer[];
  userRole: "admin" | "manager" | "loan_officer";
}

// ============================================================================
// Shared Utility Functions
// ============================================================================

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDurationVerbose(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

function TranscriptionContent({
  status,
  transcription,
}: {
  status: string | null;
  transcription: string | null;
}): React.ReactElement {
  if (status === "completed" && transcription) {
    return (
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {transcription}
        </p>
      </div>
    );
  }

  if (status === "processing") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Transcription in progress...
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="text-sm text-red-600">
        Transcription failed: {transcription || "Unknown error"}
      </div>
    );
  }

  return (
    <div className="text-sm text-muted-foreground">
      No transcription available
    </div>
  );
}

// ============================================================================
// Sentiment Badge Component
// ============================================================================

function SentimentBadge({ label }: { label: string | null }) {
  if (!label) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs",
        // Use design system accent colors for sentiment
        label === "positive" && "border-repwell-sage-200/50 text-repwell-sage-200",
        label === "negative" && "border-[#c47c7c]/50 text-[#c47c7c]",
        label === "neutral" && "border-[#7c9eb8]/50 text-[#7c9eb8]"
      )}
    >
      {label}
    </Badge>
  );
}

// ============================================================================
// Approval Status Badge Component
// ============================================================================

function ApprovalStatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "outline" | "destructive";
      icon: typeof Clock;
    }
  > = {
    pending: { label: "Pending Review", variant: "secondary", icon: Clock },
    approved: { label: "Approved", variant: "default", icon: CheckCircle },
    rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
    published: { label: "Published", variant: "default", icon: Share2 },
  };

  const { label, variant, icon: Icon } = config[status] || config.pending;

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// ============================================================================
// Stats Cards Component
// ============================================================================

function StatsCards({ stats }: { stats: VideoLibraryStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Videos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Pending Review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {stats.pending}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Approved</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-repwell-sage-200">
            {stats.approved}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Published</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{stats.published}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Avg. Duration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatDurationVerbose(stats.averageDuration)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Video Card Component (Memoized for performance)
// ============================================================================

const VideoCard = memo(function VideoCard({
  video,
  onClick,
  canManage,
  canDelete,
  onApprove,
  onReject,
  onPublish,
  onDelete,
}: {
  video: VideoTestimonialResponse;
  onClick: () => void;
  canManage: boolean;
  canDelete: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="group overflow-hidden transition-shadow duration-300 hover:shadow-md">
      {/* Thumbnail / Video Preview */}
      <div
        className="relative aspect-video cursor-pointer bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onClick()}
        aria-label={`Play video from ${video.customerName}`}
      >
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={`Thumbnail for ${video.customerName}'s testimonial`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-repwell-sage-100/50 to-repwell-teal-300/20">
            <Film className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <Play className="h-6 w-6 text-repwell-teal-400 ml-1" />
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
      </div>

      {/* Card Content */}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-repwell-teal-500">
              {video.customerName}
            </h3>
            <p className="truncate text-sm text-muted-foreground">
              {video.loanOfficerName}
            </p>
          </div>
          {canManage && (
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
                  Play Video
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {video.approvalStatus === "pending" && (
                  <>
                    <DropdownMenuItem onClick={() => onApprove(video.id)}>
                      <ThumbsUp className="mr-2 h-4 w-4 text-green-600" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onReject(video.id)}>
                      <ThumbsDown className="mr-2 h-4 w-4 text-red-600" />
                      Reject
                    </DropdownMenuItem>
                  </>
                )}
                {video.approvalStatus === "approved" && (
                  <DropdownMenuItem onClick={() => onPublish(video.id)}>
                    <Share2 className="mr-2 h-4 w-4 text-blue-600" />
                    Publish
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(video.id)}
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

// ============================================================================
// Video Detail Modal Component
// ============================================================================

function VideoDetailModal({
  video,
  open,
  onOpenChange,
  canManage,
  onApprove,
  onReject,
  onPublish,
}: {
  video: VideoTestimonialResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onPublish: (id: string) => void;
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<"video" | "transcription" | "details">("video");
  const [loadedVideoId, setLoadedVideoId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load video URL - called when needed
  const loadVideoUrl = useCallback(async (videoPath: string, videoId: string) => {
    setIsLoadingUrl(true);
    setSignedUrl(null);
    try {
      const result = await getVideoSignedUrl(videoPath);
      if (result.success && result.data) {
        setSignedUrl(result.data.signedUrl);
        setLoadedVideoId(videoId);
      } else {
        toast({
          title: "Error",
          description: "Failed to load video",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoadingUrl(false);
    }
  }, []);

  // Handle open change with cleanup and loading
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen && video && loadedVideoId !== video.id) {
        // Load video when opening with a new video
        loadVideoUrl(video.videoPath, video.id);
      }
      if (!newOpen) {
        // Pause video if playing before closing
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
        // Reset state when closing
        setSignedUrl(null);
        setActiveTab("video");
        setLoadedVideoId(null);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange, video, loadedVideoId, loadVideoUrl]
  );

  // Trigger load when video changes while modal is already open
  const videoId = video?.id;
  const videoPath = video?.videoPath;
  useEffect(() => {
    if (open && videoId && videoPath && loadedVideoId !== videoId && !isLoadingUrl) {
      loadVideoUrl(videoPath, videoId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, open]);

  if (!video) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="h-5 w-5" />
            {video.customerName}&apos;s Testimonial
          </DialogTitle>
          <DialogDescription>
            For {video.loanOfficerName} - Submitted {formatDateLong(video.submittedAt)}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="flex-1 overflow-hidden flex flex-col"
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
              <AlertCircle className="h-4 w-4" />
              Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="flex-1 overflow-auto">
            <div className="space-y-4">
              {/* Video Player */}
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                {isLoadingUrl ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                  </div>
                ) : signedUrl ? (
                  <video
                    ref={videoRef}
                    src={signedUrl}
                    controls
                    className="h-full w-full"
                    poster={video.thumbnailUrl || undefined}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="flex h-full items-center justify-center text-white/50">
                    Video unavailable
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {canManage && (
                <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <ApprovalStatusBadge status={video.approvalStatus} />
                  </div>
                  <div className="flex items-center gap-2">
                    {video.approvalStatus === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onReject(video.id)}
                          className="text-[#c47c7c] border-[#c47c7c]/50 hover:bg-[#c47c7c]/10"
                        >
                          <ThumbsDown className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onApprove(video.id)}
                          className="bg-repwell-sage-200 hover:bg-repwell-sage-200/80 text-white"
                        >
                          <ThumbsUp className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      </>
                    )}
                    {video.approvalStatus === "approved" && (
                      <Button size="sm" onClick={() => onPublish(video.id)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Publish
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="transcription" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4 p-1">
                {/* Transcription */}
                <div>
                  <h4 className="mb-2 font-semibold text-repwell-teal-500">
                    Transcription
                  </h4>
                  <TranscriptionContent
                    status={video.transcriptionStatus}
                    transcription={video.transcription}
                  />
                </div>

                {/* AI Generated Text */}
                {video.aiGeneratedText && (
                  <div>
                    <h4 className="mb-2 font-semibold text-repwell-teal-500">
                      AI-Generated Review Text
                    </h4>
                    <div className="rounded-lg border bg-primary/5 p-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {video.aiGeneratedText}
                      </p>
                    </div>
                  </div>
                )}

                {/* Key Phrases */}
                {video.keyPhrases && video.keyPhrases.length > 0 && (
                  <div>
                    <h4 className="mb-2 font-semibold text-repwell-teal-500">
                      Key Phrases
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {video.keyPhrases.map((phrase, idx) => (
                        <Badge key={idx} variant="outline">
                          {phrase}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="details" className="flex-1 overflow-auto">
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="rounded-lg border p-4">
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-repwell-teal-500">
                  <User className="h-4 w-4" />
                  Customer Information
                </h4>
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
              </div>

              {/* Video Metadata */}
              <div className="rounded-lg border p-4">
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-repwell-teal-500">
                  <Film className="h-4 w-4" />
                  Video Details
                </h4>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Duration</dt>
                    <dd className="font-medium">
                      {formatDuration(video.durationSeconds)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">File Size</dt>
                    <dd className="font-medium">
                      {formatFileSize(video.fileSizeBytes)}
                    </dd>
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
                    <dd className="font-medium">{video.mimeType}</dd>
                  </div>
                </dl>
              </div>

              {/* Sentiment & Analysis */}
              {(video.sentimentLabel || video.sentimentScore !== null) && (
                <div className="rounded-lg border p-4">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold text-repwell-teal-500">
                    <AlertCircle className="h-4 w-4" />
                    AI Analysis
                  </h4>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    {video.sentimentLabel && (
                      <div>
                        <dt className="text-muted-foreground">Sentiment</dt>
                        <dd>
                          <SentimentBadge label={video.sentimentLabel} />
                        </dd>
                      </div>
                    )}
                    {video.sentimentScore !== null && (
                      <div>
                        <dt className="text-muted-foreground">Sentiment Score</dt>
                        <dd className="font-medium">
                          {(video.sentimentScore * 100).toFixed(0)}%
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Timeline */}
              <div className="rounded-lg border p-4">
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-repwell-teal-500">
                  <Calendar className="h-4 w-4" />
                  Timeline
                </h4>
                <dl className="space-y-2 text-sm">
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
              </div>

              {/* Rejection Reason */}
              {video.approvalStatus === "rejected" && video.rejectionReason && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <h4 className="mb-2 font-semibold text-red-700">
                    Rejection Reason
                  </h4>
                  <p className="text-sm text-red-600">{video.rejectionReason}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Rejection Dialog Component
// ============================================================================

function RejectDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState("");

  // Clear reason when dialog closes
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setReason("");
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Video Testimonial</DialogTitle>
          <DialogDescription>
            Provide a reason for rejecting this video. This will be recorded for
            internal reference.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rejectionReason">Rejection Reason</Label>
            <Textarea
              id="rejectionReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Poor video quality, inappropriate content, customer requested removal..."
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => onConfirm(reason)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Video"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export function VideoLibraryDashboard({
  initialResponses,
  initialTotal,
  initialStats,
  loanOfficers,
  userRole,
}: Props) {
  const [responses, setResponses] =
    useState<VideoTestimonialResponse[]>(initialResponses);
  const [total, setTotal] = useState(initialTotal);
  const [stats, setStats] = useState<VideoLibraryStats>(initialStats);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter state
  const [approvalFilter, setApprovalFilter] = useState<string>("all");
  const [loanOfficerFilter, setLoanOfficerFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 24;
  const totalPages = Math.ceil(total / pageSize);

  // Modal state
  const [selectedVideo, setSelectedVideo] =
    useState<VideoTestimonialResponse | null>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [videoToReject, setVideoToReject] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);

  // Track if initial render
  const isInitialMount = useRef(true);

  const canManage = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  // Fetch responses with current filters
  const fetchResponses = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getVideoTestimonialResponses({
        approvalStatus: approvalFilter !== "all" ? approvalFilter : undefined,
        loanOfficerId: loanOfficerFilter !== "all" ? loanOfficerFilter : undefined,
        search: searchQuery.trim() || undefined,
        page,
        pageSize,
      });

      if (result.success && result.data) {
        setResponses(result.data.responses);
        setTotal(result.data.total);
        setStats(result.data.stats);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch videos",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [approvalFilter, loanOfficerFilter, searchQuery, page]);

  // Auto-fetch when filters or page changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchResponses();
  }, [fetchResponses]);

  // Handle video selection
  const handleVideoClick = (video: VideoTestimonialResponse) => {
    setSelectedVideo(video);
    setVideoModalOpen(true);
  };

  // Handle approve
  const handleApprove = useCallback(
    async (id: string) => {
      setIsUpdating(true);
      try {
        const result = await updateVideoApprovalStatus(id, "approve");
        if (result.success) {
          toast({ title: "Success", description: "Video approved successfully" });
          fetchResponses();
          if (selectedVideo?.id === id) {
            setSelectedVideo(null);
            setVideoModalOpen(false);
          }
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to approve video",
            variant: "destructive",
          });
        }
      } finally {
        setIsUpdating(false);
      }
    },
    [fetchResponses, selectedVideo]
  );

  // Handle reject
  const handleRejectClick = (id: string) => {
    setVideoToReject(id);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = useCallback(
    async (reason: string) => {
      if (!videoToReject) return;

      setIsUpdating(true);
      try {
        const result = await updateVideoApprovalStatus(
          videoToReject,
          "reject",
          { reason }
        );
        if (result.success) {
          toast({ title: "Success", description: "Video rejected" });
          setRejectDialogOpen(false);
          setVideoToReject(null);
          fetchResponses();
          if (selectedVideo?.id === videoToReject) {
            setSelectedVideo(null);
            setVideoModalOpen(false);
          }
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to reject video",
            variant: "destructive",
          });
        }
      } finally {
        setIsUpdating(false);
      }
    },
    [videoToReject, fetchResponses, selectedVideo]
  );

  // Handle publish
  const handlePublish = useCallback(
    async (id: string) => {
      setIsUpdating(true);
      try {
        const result = await updateVideoApprovalStatus(id, "publish");
        if (result.success) {
          toast({ title: "Success", description: "Video published successfully" });
          fetchResponses();
          if (selectedVideo?.id === id) {
            setSelectedVideo(null);
            setVideoModalOpen(false);
          }
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to publish video",
            variant: "destructive",
          });
        }
      } finally {
        setIsUpdating(false);
      }
    },
    [fetchResponses, selectedVideo]
  );

  // Handle delete
  const handleDeleteClick = (id: string) => {
    setVideoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (!videoToDelete) return;

    setIsUpdating(true);
    try {
      const result = await deleteVideoTestimonialResponse(videoToDelete);
      if (result.success) {
        toast({ title: "Success", description: "Video deleted successfully" });
        setDeleteDialogOpen(false);
        setVideoToDelete(null);
        fetchResponses();
        if (selectedVideo?.id === videoToDelete) {
          setSelectedVideo(null);
          setVideoModalOpen(false);
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete video",
          variant: "destructive",
        });
      }
    } finally {
      setIsUpdating(false);
    }
  }, [videoToDelete, fetchResponses, selectedVideo]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Main Content Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Video Testimonials</CardTitle>
              <CardDescription>
                {total} video{total !== 1 ? "s" : ""} submitted
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Label htmlFor="search-videos" className="sr-only">
                Search videos by customer name
              </Label>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="search-videos"
                placeholder="Search by customer name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1); // Reset pagination when search changes
                }}
                className="pl-9"
              />
            </div>
            <div>
              <Label htmlFor="status-filter" className="sr-only">
                Filter by approval status
              </Label>
              <Select
                value={approvalFilter}
                onValueChange={(value) => {
                  setApprovalFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger id="status-filter" className="w-[160px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {canManage && (
              <div>
                <Label htmlFor="loan-officer-filter" className="sr-only">
                  Filter by loan officer
                </Label>
                <Select
                  value={loanOfficerFilter}
                  onValueChange={(value) => {
                    setLoanOfficerFilter(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger id="loan-officer-filter" className="w-[180px]">
                    <SelectValue placeholder="All Loan Officers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Loan Officers</SelectItem>
                    {loanOfficers.map((lo) => (
                      <SelectItem key={lo.id} value={lo.id}>
                        {lo.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={fetchResponses}
              disabled={isLoading}
              aria-label="Refresh video list"
            >
              <RefreshCw
                className={cn("h-4 w-4", isLoading && "animate-spin")}
              />
            </Button>
          </div>

          {/* Video Grid */}
          {responses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Film className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                No video testimonials yet
              </h3>
              <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
                Video testimonials will appear here once customers submit them
                through your testimonial request links.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {responses.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() => handleVideoClick(video)}
                  canManage={canManage}
                  canDelete={canDelete}
                  onApprove={handleApprove}
                  onReject={handleRejectClick}
                  onPublish={handlePublish}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, total)} of {total} videos
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Detail Modal */}
      <VideoDetailModal
        video={selectedVideo}
        open={videoModalOpen}
        onOpenChange={setVideoModalOpen}
        canManage={canManage}
        onApprove={handleApprove}
        onReject={handleRejectClick}
        onPublish={handlePublish}
      />

      {/* Rejection Dialog */}
      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={handleRejectConfirm}
        isLoading={isUpdating}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video Testimonial?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the video and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isUpdating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUpdating ? "Deleting..." : "Delete Video"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
