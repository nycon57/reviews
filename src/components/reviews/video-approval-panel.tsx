"use client";

import {
  ThumbsUp,
  ThumbsDown,
  Chats as MessageSquare,
  ShareNetwork as Share2,
  WarningCircle as AlertCircle,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

type ApprovalAction = "approve" | "reject" | "request_changes" | "publish";

interface VideoInfo {
  approvalStatus: string;
  sentimentLabel: string | null;
  sentimentScore: number | null;
  managerNotes: string | null;
  rejectionReason: string | null;
  customerName: string;
  customerEmail: string;
  loanOfficerName: string;
  loanOfficerEmail: string;
  submittedAt: string;
  approvedAt: string | null;
  publishedAt: string | null;
}

interface VideoApprovalPanelProps {
  video: VideoInfo;
  canManage: boolean;
  onAction: (action: ApprovalAction) => void;
}

// ============================================================================
// Utilities
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
// Approval Panel
// ============================================================================

export function VideoApprovalPanel({ video, canManage, onAction }: VideoApprovalPanelProps) {
  return (
    <div className="space-y-6">
      {/* Approval Actions */}
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(video.approvalStatus === "pending" ||
              video.approvalStatus === "changes_requested") && (
              <>
                <Button
                  onClick={() => onAction("approve")}
                  className="w-full gap-2 bg-repwell-sage-200 text-white hover:bg-repwell-sage-200/80"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onAction("request_changes")}
                  className="w-full gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                >
                  <MessageSquare className="h-4 w-4" />
                  Request Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onAction("reject")}
                  className="w-full gap-2 border-[#c47c7c]/50 text-[#c47c7c] hover:bg-red-50 hover:text-[#c47c7c]"
                >
                  <ThumbsDown className="h-4 w-4" />
                  Reject
                </Button>
              </>
            )}
            {video.approvalStatus === "approved" && (
              <Button
                onClick={() => onAction("publish")}
                className="w-full gap-2"
              >
                <Share2 className="h-4 w-4" />
                Publish
              </Button>
            )}
            {video.approvalStatus === "published" && (
              <div className="text-center text-sm text-muted-foreground">
                This video has been published
              </div>
            )}
            {video.approvalStatus === "rejected" && (
              <div className="text-center text-sm text-muted-foreground">
                This video has been rejected
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Analysis */}
      {(video.sentimentLabel || video.sentimentScore !== null) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              {video.sentimentLabel && (
                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground">Sentiment</dt>
                  <dd>
                    <SentimentBadge label={video.sentimentLabel} />
                  </dd>
                </div>
              )}
              {video.sentimentScore !== null && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Confidence</dt>
                  <dd className="font-medium">
                    {(video.sentimentScore * 100).toFixed(0)}%
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Manager Notes */}
      {video.managerNotes && (
        <Card className="border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-600">Manager Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-amber-700">
              {video.managerNotes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Rejection Reason */}
      {video.approvalStatus === "rejected" && video.rejectionReason && (
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-red-600">Rejection Reason</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-red-600">
              {video.rejectionReason}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
