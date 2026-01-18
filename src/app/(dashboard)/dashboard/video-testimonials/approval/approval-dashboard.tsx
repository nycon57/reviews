"use client";

import { useState, useCallback, useRef, useEffect, memo } from "react";
import {
  Search,
  RefreshCw,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  User,
  Film,
  Loader2,
  Edit3,
  AlertTriangle,
  CheckSquare,
  Square,
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { VideoTestimonialResponse } from "@/lib/video-testimonials/actions";
import {
  getVideosPendingApproval,
  getVideoSignedUrl,
  updateVideoApprovalStatus,
  updateVideoAIText,
  bulkUpdateVideoApprovalStatus,
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
  initialStats: { pending: number; changesRequested: number };
  loanOfficers: LoanOfficer[];
}

type ApprovalAction = "approve" | "reject" | "request_changes";

// ============================================================================
// Utility Functions
// ============================================================================

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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

// ============================================================================
// Status Badge Component
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
    pending: {
      label: "Pending Review",
      variant: "secondary",
      icon: Clock,
    },
    changes_requested: {
      label: "Changes Requested",
      variant: "outline",
      icon: MessageSquare,
      className: "border-amber-500/50 text-amber-600",
    },
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
// Stats Cards Component
// ============================================================================

function StatsCards({ stats }: { stats: { pending: number; changesRequested: number } }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Awaiting Review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {stats.pending + stats.changesRequested}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>New Submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pending}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Changes Requested</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-500">
            {stats.changesRequested}
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
  isSelected,
  onSelect,
}: {
  video: VideoTestimonialResponse;
  onClick: () => void;
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
}) {
  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-300",
        isSelected && "ring-2 ring-primary",
        "hover:shadow-md"
      )}
    >
      {/* Thumbnail / Video Preview */}
      <div
        className="relative aspect-video cursor-pointer bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onClick()}
        aria-label={`Review video from ${video.customerName}`}
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
            <Play className="ml-1 h-6 w-6 text-repwell-teal-400" />
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
        <div
          className="absolute left-2 top-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(video.id, checked === true)}
            className="h-5 w-5 border-2 border-white bg-white/80 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            aria-label={`Select ${video.customerName}'s video`}
          />
        </div>
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

        {/* Changes requested indicator */}
        {video.approvalStatus === "changes_requested" && video.managerNotes && (
          <div className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-950/20 dark:text-amber-300">
            <strong>Notes:</strong> {video.managerNotes.slice(0, 100)}
            {video.managerNotes.length > 100 && "..."}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// ============================================================================
// Approval Modal Component
// ============================================================================

function ApprovalModal({
  video,
  open,
  onOpenChange,
  onAction,
}: {
  video: VideoTestimonialResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (
    action: ApprovalAction,
    options?: { reason?: string; managerNotes?: string; editedAiText?: string }
  ) => void;
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<"video" | "transcription" | "details">("video");
  const [loadedVideoId, setLoadedVideoId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedAiText, setEditedAiText] = useState("");
  const [isEditingText, setIsEditingText] = useState(false);
  const [actionType, setActionType] = useState<ApprovalAction | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load video URL
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
        loadVideoUrl(video.videoPath, video.id);
        setEditedAiText(video.aiGeneratedText || "");
      }
      if (!newOpen) {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
        setSignedUrl(null);
        setActiveTab("video");
        setLoadedVideoId(null);
        setIsEditingText(false);
        setActionType(null);
        setActionNotes("");
      }
      onOpenChange(newOpen);
    },
    [onOpenChange, video, loadedVideoId, loadVideoUrl]
  );

  // Trigger load when video changes
  const videoId = video?.id;
  const videoPath = video?.videoPath;
  useEffect(() => {
    if (open && videoId && videoPath && loadedVideoId !== videoId && !isLoadingUrl) {
      loadVideoUrl(videoPath, videoId);
      setEditedAiText(video?.aiGeneratedText || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, open]);

  // Handle action submission
  const handleSubmitAction = async () => {
    if (!actionType) return;

    setIsSubmitting(true);
    try {
      const hasTextChanges = isEditingText && editedAiText !== video?.aiGeneratedText;
      await onAction(actionType, {
        reason: actionType === "reject" ? actionNotes : undefined,
        managerNotes: actionType === "request_changes" ? actionNotes : undefined,
        editedAiText: hasTextChanges ? editedAiText : undefined,
      });
      handleOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save AI text edit
  const handleSaveAiText = async () => {
    if (!video) return;

    setIsSubmitting(true);
    try {
      const result = await updateVideoAIText(video.id, editedAiText);
      if (result.success) {
        toast({ title: "Success", description: "AI text updated successfully" });
        setIsEditingText(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update AI text",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!video) return null;

  // If action type is selected, show confirmation dialog
  if (actionType) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "approve" && (
                <>
                  <CheckCircle className="h-5 w-5 text-repwell-sage-200" />
                  Approve Testimonial
                </>
              )}
              {actionType === "reject" && (
                <>
                  <XCircle className="h-5 w-5 text-[#c47c7c]" />
                  Reject Testimonial
                </>
              )}
              {actionType === "request_changes" && (
                <>
                  <MessageSquare className="h-5 w-5 text-amber-500" />
                  Request Changes
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" &&
                "This testimonial will be approved and ready for publishing."}
              {actionType === "reject" &&
                "This testimonial will be rejected and the loan officer will be notified."}
              {actionType === "request_changes" &&
                "The loan officer will be notified to make changes to this testimonial."}
            </DialogDescription>
          </DialogHeader>

          {(actionType === "reject" || actionType === "request_changes") && (
            <div className="space-y-2">
              <Label htmlFor="actionNotes">
                {actionType === "reject" ? "Rejection Reason" : "Notes for Loan Officer"}
                {actionType === "reject" && (
                  <span className="ml-1 text-muted-foreground">(optional)</span>
                )}
              </Label>
              <Textarea
                id="actionNotes"
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={
                  actionType === "reject"
                    ? "e.g., Poor video quality, inappropriate content..."
                    : "e.g., Please re-record with better lighting, adjust the AI text..."
                }
                rows={4}
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setActionType(null)}
              disabled={isSubmitting}
            >
              Back
            </Button>
            <Button
              onClick={handleSubmitAction}
              disabled={isSubmitting}
              className={cn(
                actionType === "approve" &&
                  "bg-repwell-sage-200 hover:bg-repwell-sage-200/80 text-white",
                actionType === "reject" &&
                  "bg-[#c47c7c] hover:bg-[#c47c7c]/80 text-white",
                actionType === "request_changes" &&
                  "bg-amber-500 hover:bg-amber-500/80 text-white"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {actionType === "approve" && "Approve"}
                  {actionType === "reject" && "Reject"}
                  {actionType === "request_changes" && "Request Changes"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-[95vw] flex-col overflow-hidden sm:max-w-3xl lg:max-w-4xl">
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
          className="flex flex-1 flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="video" className="gap-2">
              <Play className="h-4 w-4" />
              Video
            </TabsTrigger>
            <TabsTrigger value="transcription" className="gap-2">
              <FileText className="h-4 w-4" />
              Text & Review
            </TabsTrigger>
            <TabsTrigger value="details" className="gap-2">
              <User className="h-4 w-4" />
              Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="flex-1 overflow-auto">
            <div className="space-y-4">
              {/* Video Player */}
              <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
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
                  {video.transcriptionStatus === "completed" && video.transcription ? (
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {video.transcription}
                      </p>
                    </div>
                  ) : video.transcriptionStatus === "processing" ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Transcription in progress...
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No transcription available
                    </div>
                  )}
                </div>

                {/* AI Generated Text (Editable) */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-semibold text-repwell-teal-500">
                      AI-Generated Review Text
                    </h4>
                    {!isEditingText && video.aiGeneratedText && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingText(true)}
                        className="gap-1.5"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    )}
                  </div>

                  {isEditingText ? (
                    <div className="space-y-2">
                      <Label htmlFor="ai-text-editor" className="sr-only">
                        Edit AI-Generated Review Text
                      </Label>
                      <Textarea
                        id="ai-text-editor"
                        value={editedAiText}
                        onChange={(e) => setEditedAiText(e.target.value)}
                        rows={6}
                        className="text-sm leading-relaxed"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsEditingText(false);
                            setEditedAiText(video.aiGeneratedText || "");
                          }}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveAiText}
                          disabled={isSubmitting || editedAiText === video.aiGeneratedText}
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : video.aiGeneratedText ? (
                    <div className="rounded-lg border bg-primary/5 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {video.aiGeneratedText}
                      </p>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No AI-generated text available
                    </div>
                  )}
                </div>

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

                {/* Manager Notes (if changes requested) */}
                {video.managerNotes && (
                  <div>
                    <h4 className="mb-2 font-semibold text-amber-600">
                      Manager Notes
                    </h4>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:bg-amber-950/20">
                      <p className="whitespace-pre-wrap text-sm text-amber-700 dark:text-amber-300">
                        {video.managerNotes}
                      </p>
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
                    <dt className="text-muted-foreground">Resolution</dt>
                    <dd className="font-medium">
                      {video.width && video.height
                        ? `${video.width}x${video.height}`
                        : "Unknown"}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Sentiment */}
              {video.sentimentLabel && (
                <div className="rounded-lg border p-4">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold text-repwell-teal-500">
                    <AlertTriangle className="h-4 w-4" />
                    AI Analysis
                  </h4>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Sentiment</dt>
                      <dd>
                        <SentimentBadge label={video.sentimentLabel} />
                      </dd>
                    </div>
                    {video.sentimentScore !== null && (
                      <div>
                        <dt className="text-muted-foreground">Confidence</dt>
                        <dd className="font-medium">
                          {(video.sentimentScore * 100).toFixed(0)}%
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            <ApprovalStatusBadge status={video.approvalStatus} />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setActionType("request_changes")}
              className="gap-1.5 border-amber-500/50 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
            >
              <MessageSquare className="h-4 w-4" />
              Request Changes
            </Button>
            <Button
              variant="outline"
              onClick={() => setActionType("reject")}
              className="gap-1.5 border-[#c47c7c]/50 text-[#c47c7c] hover:bg-red-50 hover:text-[#c47c7c]"
            >
              <ThumbsDown className="h-4 w-4" />
              Reject
            </Button>
            <Button
              onClick={() => setActionType("approve")}
              className="gap-1.5 bg-repwell-sage-200 text-white hover:bg-repwell-sage-200/80"
            >
              <ThumbsUp className="h-4 w-4" />
              Approve
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Bulk Action Bar Component
// ============================================================================

function BulkActionBar({
  selectedCount,
  onSelectAll,
  onClearSelection,
  onBulkAction,
  isLoading,
  totalCount,
  allSelected,
}: {
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkAction: (action: ApprovalAction) => void;
  isLoading: boolean;
  totalCount: number;
  allSelected: boolean;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={allSelected ? onClearSelection : onSelectAll}
          className="gap-1.5"
        >
          {allSelected ? (
            <>
              <Square className="h-4 w-4" />
              Deselect All
            </>
          ) : (
            <>
              <CheckSquare className="h-4 w-4" />
              Select All ({totalCount})
            </>
          )}
        </Button>
        <span className="text-sm text-muted-foreground">
          {selectedCount} video{selectedCount !== 1 ? "s" : ""} selected
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkAction("request_changes")}
          disabled={isLoading}
          className="gap-1.5 border-amber-500/50 text-amber-600"
        >
          <MessageSquare className="h-4 w-4" />
          Request Changes
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkAction("reject")}
          disabled={isLoading}
          className="gap-1.5 border-[#c47c7c]/50 text-[#c47c7c]"
        >
          <ThumbsDown className="h-4 w-4" />
          Reject
        </Button>
        <Button
          size="sm"
          onClick={() => onBulkAction("approve")}
          disabled={isLoading}
          className="gap-1.5 bg-repwell-sage-200 text-white hover:bg-repwell-sage-200/80"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ThumbsUp className="h-4 w-4" />
          )}
          Approve Selected
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export function ApprovalDashboard({
  initialResponses,
  initialTotal,
  initialStats,
  loanOfficers,
}: Props) {
  const [responses, setResponses] =
    useState<VideoTestimonialResponse[]>(initialResponses);
  const [total, setTotal] = useState(initialTotal);
  const [stats, setStats] = useState(initialStats);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter state
  const [loanOfficerFilter, setLoanOfficerFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 24;
  const totalPages = Math.ceil(total / pageSize);

  // Modal state
  const [selectedVideo, setSelectedVideo] =
    useState<VideoTestimonialResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Track if initial render
  const isInitialMount = useRef(true);

  // Fetch responses with current filters
  const fetchResponses = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getVideosPendingApproval({
        loanOfficerId: loanOfficerFilter !== "all" ? loanOfficerFilter : undefined,
        search: searchQuery.trim() || undefined,
        page,
        pageSize,
      });

      if (result.success && result.data) {
        setResponses(result.data.responses);
        setTotal(result.data.total);
        setStats(result.data.stats);
        // Clear selections when data changes
        setSelectedIds(new Set());
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
  }, [loanOfficerFilter, searchQuery, page]);

  // Auto-fetch when filters or page changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchResponses();
  }, [fetchResponses]);

  // Handle video selection for review
  const handleVideoClick = (video: VideoTestimonialResponse) => {
    setSelectedVideo(video);
    setModalOpen(true);
  };

  // Handle checkbox selection
  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    setSelectedIds(new Set(responses.map((r) => r.id)));
  };

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Handle single action from modal
  const handleAction = useCallback(
    async (
      action: ApprovalAction,
      options?: { reason?: string; managerNotes?: string; editedAiText?: string }
    ) => {
      if (!selectedVideo) return;

      setIsUpdating(true);
      try {
        const result = await updateVideoApprovalStatus(selectedVideo.id, action, options);
        if (result.success) {
          const actionLabels = {
            approve: "approved",
            reject: "rejected",
            request_changes: "marked for changes",
          };
          toast({
            title: "Success",
            description: `Video ${actionLabels[action]} successfully`,
          });
          fetchResponses();
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update video",
            variant: "destructive",
          });
        }
      } finally {
        setIsUpdating(false);
      }
    },
    [selectedVideo, fetchResponses]
  );

  // Handle bulk action
  const handleBulkAction = useCallback(
    async (action: ApprovalAction) => {
      if (selectedIds.size === 0) return;

      setIsUpdating(true);
      try {
        const result = await bulkUpdateVideoApprovalStatus(
          Array.from(selectedIds),
          action
        );

        if (result.success && result.data) {
          const { successful, failed } = result.data;
          const actionLabels = {
            approve: "approved",
            reject: "rejected",
            request_changes: "marked for changes",
          };

          if (failed.length === 0) {
            toast({
              title: "Success",
              description: `${successful.length} video${successful.length !== 1 ? "s" : ""} ${actionLabels[action]}`,
            });
          } else {
            toast({
              title: "Partial Success",
              description: `${successful.length} succeeded, ${failed.length} failed`,
              variant: "destructive",
            });
          }

          fetchResponses();
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to process bulk action",
            variant: "destructive",
          });
        }
      } finally {
        setIsUpdating(false);
      }
    },
    [selectedIds, fetchResponses]
  );

  const allSelected = selectedIds.size === responses.length && responses.length > 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onBulkAction={handleBulkAction}
        isLoading={isUpdating}
        totalCount={responses.length}
        allSelected={allSelected}
      />

      {/* Main Content Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Videos Pending Approval</CardTitle>
              <CardDescription>
                {total} video{total !== 1 ? "s" : ""} awaiting review
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
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
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
            <Button
              variant="outline"
              size="icon"
              onClick={fetchResponses}
              disabled={isLoading}
              aria-label="Refresh video list"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>

          {/* Video Grid */}
          {responses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <CheckCircle className="h-6 w-6 text-repwell-sage-200" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">All caught up!</h3>
              <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
                There are no video testimonials waiting for approval.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {responses.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() => handleVideoClick(video)}
                  isSelected={selectedIds.has(video.id)}
                  onSelect={handleSelect}
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

      {/* Approval Modal */}
      <ApprovalModal
        video={selectedVideo}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onAction={handleAction}
      />
    </div>
  );
}
