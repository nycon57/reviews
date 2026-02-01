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
  SpinnerGap as Loader2,
  Calendar,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  getVideoSignedUrl,
  updateVideoApprovalStatus,
} from "@/lib/video-testimonials/actions";
import { VideoPlayerSection } from "./video-player-section";
import { VideoApprovalPanel } from "./video-approval-panel";
import { VideoFeedbackSection } from "./video-feedback-section";

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

interface Props {
  video: VideoDetail;
  userRole: "admin" | "manager" | "user";
}

type ApprovalAction = "approve" | "reject" | "request_changes" | "publish";

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

// ============================================================================
// Action Confirmation Dialog
// ============================================================================

function ActionDialog({
  open,
  onOpenChange,
  actionType,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionType: ApprovalAction | null;
  onConfirm: (notes?: string) => void;
  isLoading: boolean;
}) {
  const [notes, setNotes] = useState("");

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setNotes("");
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  if (!actionType) return null;

  const needsNotes = actionType === "reject" || actionType === "request_changes";

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
            {actionType === "publish" && (
              <>
                <Share2 className="h-5 w-5 text-primary" />
                Publish Testimonial
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {actionType === "approve" &&
              "This testimonial will be approved and ready for publishing."}
            {actionType === "reject" &&
              "This testimonial will be rejected and the team member will be notified."}
            {actionType === "request_changes" &&
              "The team member will be notified to make changes to this testimonial."}
            {actionType === "publish" &&
              "This testimonial will be published and visible publicly."}
          </DialogDescription>
        </DialogHeader>

        {needsNotes && (
          <div className="space-y-2">
            <Label htmlFor="actionNotes">
              {actionType === "reject" ? "Rejection Reason" : "Notes for Team Member"}
              {actionType === "reject" && (
                <span className="ml-1 text-muted-foreground">(optional)</span>
              )}
            </Label>
            <Textarea
              id="actionNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(needsNotes ? notes : undefined)}
            disabled={isLoading}
            className={cn(
              actionType === "approve" &&
                "bg-repwell-sage-200 hover:bg-repwell-sage-200/80 text-white",
              actionType === "reject" &&
                "bg-[#c47c7c] hover:bg-[#c47c7c]/80 text-white",
              actionType === "request_changes" &&
                "bg-amber-500 hover:bg-amber-500/80 text-white"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {actionType === "approve" && "Approve"}
                {actionType === "reject" && "Reject"}
                {actionType === "request_changes" && "Request Changes"}
                {actionType === "publish" && "Publish"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function VideoDetailView({ video, userRole }: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(true);
  const [activeTab, setActiveTab] = useState<"video" | "transcription" | "details">("video");

  // Action state
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<ApprovalAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = userRole === "admin" || userRole === "manager";

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

  const handleActionClick = (action: ApprovalAction) => {
    setCurrentAction(action);
    setActionDialogOpen(true);
  };

  const handleActionConfirm = useCallback(
    async (notes?: string) => {
      if (!currentAction) return;

      setIsSubmitting(true);
      try {
        const result = await updateVideoApprovalStatus(video.id, currentAction, {
          reason: currentAction === "reject" ? notes : undefined,
          managerNotes: currentAction === "request_changes" ? notes : undefined,
        });

        if (result.success) {
          const actionLabels = {
            approve: "approved",
            reject: "rejected",
            request_changes: "marked for changes",
            publish: "published",
          };
          toast({
            title: "Success",
            description: `Video ${actionLabels[currentAction]} successfully`,
          });
          setActionDialogOpen(false);
          setCurrentAction(null);
          router.refresh();
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update video",
            variant: "destructive",
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentAction, video.id, router]
  );

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
        <ApprovalStatusBadge status={video.approvalStatus} />
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
        </div>

        {/* Sidebar */}
        <VideoApprovalPanel
          video={video}
          canManage={canManage}
          onAction={handleActionClick}
        />
      </div>

      {/* Action Dialog */}
      <ActionDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        actionType={currentAction}
        onConfirm={handleActionConfirm}
        isLoading={isSubmitting}
      />
    </div>
  );
}
