"use client";

import { useState, useCallback, useEffect, useRef, memo, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MagnifyingGlass as Search,
  ArrowsClockwise as RefreshCw,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  DotsThree as MoreHorizontal,
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  ThumbsUp,
  ThumbsDown,
  ShareNetwork as Share2,
  Trash as Trash2,
  FilmStrip as Film,
  GridFour as LayoutGrid,
  List,
  CheckSquare,
  Square,
  SpinnerGap as Loader2,
  Chats as MessageSquare,
} from "@phosphor-icons/react";
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
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type {
  VideoTestimonialResponse,
  VideoLibraryStats,
} from "@/lib/video-testimonials/actions";
import {
  getVideoTestimonialResponses,
  updateVideoApprovalStatus,
  deleteVideoTestimonialResponse,
  bulkUpdateVideoApprovalStatus,
} from "@/lib/video-testimonials/actions";
import { ReviewQueue } from "@/components/reviews/review-queue";
import type { AggregatedReview, ReviewAggregationStats } from "@/lib/reviews/types";

// Type for review stats (matches getReviewStats return type)
interface ReviewStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

// ============================================================================
// Types
// ============================================================================

interface LoanOfficer {
  id: string;
  fullName: string;
  email?: string;
}

interface UnifiedContentHubProps {
  // Text reviews data
  initialReviews: AggregatedReview[];
  initialReviewsTotal: number;
  reviewStats: ReviewStats;
  aggregatedStats?: ReviewAggregationStats;
  // Video testimonials data
  initialVideos: VideoTestimonialResponse[];
  initialVideosTotal: number;
  videoStats: VideoLibraryStats;
  // Shared
  loanOfficers: LoanOfficer[];
  userRole: "admin" | "manager" | "user";
  hasAiAccess: boolean;
  initialReviewId?: string;
}

type ViewMode = "grid" | "list";
type ContentTab = "reviews" | "videos";

// ============================================================================
// Shared Utility Functions
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
    pending: { label: "Pending", variant: "secondary", icon: Clock },
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
// Video Card Component (Grid View - Memoized for performance)
// ============================================================================

const VideoCard = memo(function VideoCard({
  video,
  onClick,
  canManage,
  canDelete,
  isSelected,
  onSelect,
  onApprove,
  onReject,
  onPublish,
  onDelete,
}: {
  video: VideoTestimonialResponse;
  onClick: () => void;
  canManage: boolean;
  canDelete: boolean;
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className={cn(
      "group overflow-hidden transition-all duration-300",
      isSelected && "ring-2 ring-primary",
      "hover:shadow-md"
    )}>
      {/* Thumbnail / Video Preview */}
      <div
        className="relative aspect-video cursor-pointer bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onClick()}
        aria-label={`View details for ${video.customerName}'s testimonial`}
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

        {/* Selection checkbox */}
        {canManage && (
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
                  View Details
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
// Video List Row Component (List View - Memoized for performance)
// ============================================================================

const VideoListRow = memo(function VideoListRow({
  video,
  onClick,
  canManage,
  canDelete,
  isSelected,
  onSelect,
  onApprove,
  onReject,
  onPublish,
  onDelete,
}: {
  video: VideoTestimonialResponse;
  onClick: () => void;
  canManage: boolean;
  canDelete: boolean;
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-4 rounded-lg border p-3 transition-all duration-200",
        isSelected && "ring-2 ring-primary bg-primary/5",
        "hover:bg-muted/50"
      )}
    >
      {/* Selection checkbox */}
      {canManage && (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(video.id, checked === true)}
            aria-label={`Select ${video.customerName}'s video`}
          />
        </div>
      )}

      {/* Thumbnail */}
      <div
        className="relative h-16 w-28 flex-shrink-0 cursor-pointer overflow-hidden rounded bg-muted"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onClick()}
      >
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={`Thumbnail for ${video.customerName}'s testimonial`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-repwell-sage-100/50 to-repwell-teal-300/20">
            <Film className="h-6 w-6 text-muted-foreground/50" />
          </div>
        )}
        {/* Duration */}
        <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-[10px] font-medium text-white">
          {formatDuration(video.durationSeconds)}
        </div>
        {/* Hover play icon */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
          <Play className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1 cursor-pointer" onClick={onClick}>
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-repwell-teal-500">
            {video.customerName}
          </h3>
          {video.transcriptionStatus === "completed" && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              <FileText className="mr-1 h-3 w-3" />
              CC
            </Badge>
          )}
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {video.loanOfficerName}
        </p>
      </div>

      {/* Status */}
      <div className="flex-shrink-0">
        <ApprovalStatusBadge status={video.approvalStatus} />
      </div>

      {/* Sentiment */}
      <div className="hidden w-20 flex-shrink-0 sm:block">
        {video.sentimentLabel ? (
          <SentimentBadge label={video.sentimentLabel} />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>

      {/* Date */}
      <div className="hidden w-24 flex-shrink-0 text-right text-sm text-muted-foreground md:block">
        {formatDate(video.submittedAt)}
      </div>

      {/* Actions */}
      {canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onClick}>
              <Play className="mr-2 h-4 w-4" />
              View Details
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
  );
});

// ============================================================================
// Rejection Dialog Component
// ============================================================================

function RejectDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  isBulk = false,
  count = 1,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
  isBulk?: boolean;
  count?: number;
}) {
  const [reason, setReason] = useState("");

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
          <DialogTitle>
            {isBulk ? `Reject ${count} Video${count !== 1 ? "s" : ""}` : "Reject Video Testimonial"}
          </DialogTitle>
          <DialogDescription>
            {isBulk
              ? `Provide a reason for rejecting these ${count} videos.`
              : "Provide a reason for rejecting this video."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rejectionReason">Rejection Reason</Label>
            <Textarea
              id="rejectionReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Poor video quality, inappropriate content..."
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
                isBulk ? `Reject ${count} Video${count !== 1 ? "s" : ""}` : "Reject Video"
              )}
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
  totalCount,
  allSelected,
  onSelectAll,
  onClearSelection,
  onBulkApprove,
  onBulkReject,
  onBulkPublish,
  onBulkDelete,
  isLoading,
  canDelete,
}: {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkApprove: () => void;
  onBulkReject: () => void;
  onBulkPublish: () => void;
  onBulkDelete: () => void;
  isLoading: boolean;
  canDelete: boolean;
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
          onClick={onBulkApprove}
          disabled={isLoading}
          className="gap-1.5"
        >
          <ThumbsUp className="h-4 w-4 text-green-600" />
          Approve
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onBulkReject}
          disabled={isLoading}
          className="gap-1.5"
        >
          <ThumbsDown className="h-4 w-4 text-red-600" />
          Reject
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onBulkPublish}
          disabled={isLoading}
          className="gap-1.5"
        >
          <Share2 className="h-4 w-4 text-blue-600" />
          Publish
        </Button>
        {canDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkDelete}
            disabled={isLoading}
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        )}
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
    </div>
  );
}

// ============================================================================
// Video Tab Content Component
// ============================================================================

function VideoTabContent({
  initialVideos,
  initialTotal,
  videoStats,
  loanOfficers,
  userRole,
}: {
  initialVideos: VideoTestimonialResponse[];
  initialTotal: number;
  videoStats: VideoLibraryStats;
  loanOfficers: LoanOfficer[];
  userRole: "admin" | "manager" | "user";
}) {
  const router = useRouter();
  const [responses, setResponses] = useState<VideoTestimonialResponse[]>(initialVideos);
  const [total, setTotal] = useState(initialTotal);
  // Stats are displayed in parent CombinedStatsCards; setStats kept for future auto-refresh
  const [_stats, setStats] = useState<VideoLibraryStats>(videoStats);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Filter state
  const [approvalFilter, setApprovalFilter] = useState<string>("all");
  const [loanOfficerFilter, setLoanOfficerFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 24;
  const totalPages = Math.ceil(total / pageSize);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [videoToReject, setVideoToReject] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [bulkRejectDialogOpen, setBulkRejectDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const isInitialMount = useRef(true);

  const canManage = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const allSelected = useMemo(
    () => selectedIds.size === responses.length && responses.length > 0,
    [selectedIds.size, responses.length]
  );

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
  }, [approvalFilter, loanOfficerFilter, searchQuery, page]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchResponses();
  }, [fetchResponses]);

  // Selection handlers
  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(responses.map((r) => r.id)));
  }, [responses]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Navigate to detail page
  const handleVideoClick = useCallback((video: VideoTestimonialResponse) => {
    router.push(`/dashboard/reviews/${video.id}?type=video`);
  }, [router]);

  // Handle single approve
  const handleApprove = useCallback(
    async (id: string) => {
      setIsUpdating(true);
      try {
        const result = await updateVideoApprovalStatus(id, "approve");
        if (result.success) {
          toast({ title: "Success", description: "Video approved" });
          fetchResponses();
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
    [fetchResponses]
  );

  // Handle single reject
  const handleRejectClick = useCallback((id: string) => {
    setVideoToReject(id);
    setRejectDialogOpen(true);
  }, []);

  const handleRejectConfirm = useCallback(
    async (reason: string) => {
      if (!videoToReject) return;

      setIsUpdating(true);
      try {
        const result = await updateVideoApprovalStatus(videoToReject, "reject", { reason });
        if (result.success) {
          toast({ title: "Success", description: "Video rejected" });
          setRejectDialogOpen(false);
          setVideoToReject(null);
          fetchResponses();
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
    [videoToReject, fetchResponses]
  );

  // Handle single publish
  const handlePublish = useCallback(
    async (id: string) => {
      setIsUpdating(true);
      try {
        const result = await updateVideoApprovalStatus(id, "publish");
        if (result.success) {
          toast({ title: "Success", description: "Video published" });
          fetchResponses();
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
    [fetchResponses]
  );

  // Handle single delete
  const handleDeleteClick = useCallback((id: string) => {
    setVideoToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!videoToDelete) return;

    setIsUpdating(true);
    try {
      const result = await deleteVideoTestimonialResponse(videoToDelete);
      if (result.success) {
        toast({ title: "Success", description: "Video deleted" });
        setDeleteDialogOpen(false);
        setVideoToDelete(null);
        fetchResponses();
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
  }, [videoToDelete, fetchResponses]);

  // Bulk action handlers
  const handleBulkApprove = useCallback(async () => {
    if (selectedIds.size === 0) return;

    setIsUpdating(true);
    try {
      const result = await bulkUpdateVideoApprovalStatus(Array.from(selectedIds), "approve");

      if (result.success && result.data) {
        const { successful, failed } = result.data;
        toast({
          title: failed.length === 0 ? "Success" : "Partial Success",
          description: `${successful.length} video${successful.length !== 1 ? "s" : ""} approved${failed.length > 0 ? `, ${failed.length} failed` : ""}`,
          variant: failed.length > 0 ? "destructive" : "default",
        });
        fetchResponses();
      } else {
        toast({
          title: "Error",
          description: result.error || "Bulk approve failed",
          variant: "destructive",
        });
      }
    } finally {
      setIsUpdating(false);
    }
  }, [selectedIds, fetchResponses]);

  const handleBulkRejectConfirm = useCallback(
    async (reason: string) => {
      if (selectedIds.size === 0) return;

      setIsUpdating(true);
      try {
        const result = await bulkUpdateVideoApprovalStatus(Array.from(selectedIds), "reject", { reason });

        if (result.success && result.data) {
          const { successful, failed } = result.data;
          toast({
            title: failed.length === 0 ? "Success" : "Partial Success",
            description: `${successful.length} video${successful.length !== 1 ? "s" : ""} rejected${failed.length > 0 ? `, ${failed.length} failed` : ""}`,
            variant: failed.length > 0 ? "destructive" : "default",
          });
          setBulkRejectDialogOpen(false);
          fetchResponses();
        } else {
          toast({
            title: "Error",
            description: result.error || "Bulk reject failed",
            variant: "destructive",
          });
          setBulkRejectDialogOpen(false);
        }
      } finally {
        setIsUpdating(false);
      }
    },
    [selectedIds, fetchResponses]
  );

  const handleBulkPublish = useCallback(async () => {
    if (selectedIds.size === 0) return;

    setIsUpdating(true);
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.all(ids.map((id) => updateVideoApprovalStatus(id, "publish")));

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      toast({
        title: failed === 0 ? "Success" : "Partial Success",
        description: `${successful} video${successful !== 1 ? "s" : ""} published${failed > 0 ? `, ${failed} failed` : ""}`,
        variant: failed > 0 ? "destructive" : "default",
      });
      fetchResponses();
    } finally {
      setIsUpdating(false);
    }
  }, [selectedIds, fetchResponses]);

  const handleBulkDeleteConfirm = useCallback(async () => {
    if (selectedIds.size === 0) return;

    setIsUpdating(true);
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.all(ids.map((id) => deleteVideoTestimonialResponse(id)));

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      toast({
        title: failed === 0 ? "Success" : "Partial Success",
        description: `${successful} video${successful !== 1 ? "s" : ""} deleted${failed > 0 ? `, ${failed} failed` : ""}`,
        variant: failed > 0 ? "destructive" : "default",
      });
      setBulkDeleteDialogOpen(false);
      fetchResponses();
    } finally {
      setIsUpdating(false);
    }
  }, [selectedIds, fetchResponses]);

  return (
    <div className="space-y-4">
      {/* Bulk Action Bar */}
      {canManage && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          totalCount={responses.length}
          allSelected={allSelected}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onBulkApprove={handleBulkApprove}
          onBulkReject={() => setBulkRejectDialogOpen(true)}
          onBulkPublish={handleBulkPublish}
          onBulkDelete={() => setBulkDeleteDialogOpen(true)}
          isLoading={isUpdating}
          canDelete={canDelete}
        />
      )}

      {/* Filters & View Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 max-w-md">
            <Label htmlFor="search-videos" className="sr-only">
              Search videos
            </Label>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search-videos"
              placeholder="Search by customer name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={approvalFilter}
            onValueChange={(value) => {
              setApprovalFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
          {canManage && (
            <Select
              value={loanOfficerFilter}
              onValueChange={(value) => {
                setLoanOfficerFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
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
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={fetchResponses}
            disabled={isLoading}
            aria-label="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => value && setViewMode(value as ViewMode)}
        >
          <ToggleGroupItem value="grid" aria-label="Grid view" size="sm">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view" size="sm">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Video Grid or List */}
      {responses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-lg border border-dashed">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Film className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No video testimonials</h3>
          <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
            Video testimonials will appear here once customers submit them.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {responses.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => handleVideoClick(video)}
              canManage={canManage}
              canDelete={canDelete}
              isSelected={selectedIds.has(video.id)}
              onSelect={handleSelect}
              onApprove={handleApprove}
              onReject={handleRejectClick}
              onPublish={handlePublish}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="hidden items-center gap-4 px-3 py-2 text-xs font-medium text-muted-foreground sm:flex">
            {canManage && <div className="w-4" />}
            <div className="w-28">Preview</div>
            <div className="flex-1">Customer / Loan Officer</div>
            <div className="w-28">Status</div>
            <div className="hidden w-20 sm:block">Sentiment</div>
            <div className="hidden w-24 text-right md:block">Date</div>
            {canManage && <div className="w-8" />}
          </div>
          {responses.map((video) => (
            <VideoListRow
              key={video.id}
              video={video}
              onClick={() => handleVideoClick(video)}
              canManage={canManage}
              canDelete={canDelete}
              isSelected={selectedIds.has(video.id)}
              onSelect={handleSelect}
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
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
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

      {/* Dialogs */}
      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={handleRejectConfirm}
        isLoading={isUpdating}
      />

      <RejectDialog
        open={bulkRejectDialogOpen}
        onOpenChange={setBulkRejectDialogOpen}
        onConfirm={handleBulkRejectConfirm}
        isLoading={isUpdating}
        isBulk
        count={selectedIds.size}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the video. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isUpdating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUpdating ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} Video{selectedIds.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected videos. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              disabled={isUpdating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUpdating ? "Deleting..." : `Delete ${selectedIds.size}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================================
// Main Unified Content Hub Component
// ============================================================================

export function UnifiedContentHub({
  initialReviews,
  initialReviewsTotal,
  reviewStats,
  aggregatedStats,
  initialVideos,
  initialVideosTotal,
  videoStats,
  loanOfficers,
  userRole,
  hasAiAccess,
  initialReviewId,
}: UnifiedContentHubProps) {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") === "videos" ? "videos" : "reviews";
  const [activeTab, setActiveTab] = useState<ContentTab>(defaultTab);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ContentTab)}
        className="space-y-4"
      >
        <TabsList variant="underline">
          <TabsTrigger value="reviews" variant="underline" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Text Reviews
            <Badge variant="secondary" className="ml-1.5 text-xs">
              {reviewStats.total}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="videos" variant="underline" className="gap-2">
            <Film className="h-4 w-4" />
            Video Testimonials
            <Badge variant="secondary" className="ml-1.5 text-xs">
              {videoStats.total}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="mt-6">
          <ReviewQueue
            initialReviews={initialReviews}
            initialTotal={initialReviewsTotal}
            loanOfficers={loanOfficers}
            initialStats={reviewStats}
            initialAggregatedStats={aggregatedStats}
            initialReviewId={initialReviewId}
            hasAiAccess={hasAiAccess}
          />
        </TabsContent>

        <TabsContent value="videos" className="mt-6">
          <VideoTabContent
            initialVideos={initialVideos}
            initialTotal={initialVideosTotal}
            videoStats={videoStats}
            loanOfficers={loanOfficers}
            userRole={userRole}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
