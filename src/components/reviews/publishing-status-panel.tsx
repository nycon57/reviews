"use client";

import { useState } from "react";
import {
  CheckCircle,
  Clock,
  ShareNetwork,
  SpinnerGap,
  XCircle,
  Chats,
  Archive,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
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

export type PublishingStatus =
  | "pending"
  | "approved"
  | "published"
  | "rejected"
  | "changes_requested"
  | "archived";

const STATUS_COPY: Record<
  PublishingStatus,
  { label: string; description: string; icon: typeof Clock }
> = {
  pending: {
    label: "Quarantined",
    description: "Held by automated screening. Publish to make it live, or remove it from review surfaces.",
    icon: Clock,
  },
  changes_requested: {
    label: "Changes requested",
    description: "Waiting on updates before this can move forward.",
    icon: Chats,
  },
  approved: {
    label: "Ready to publish",
    description: "Screening has cleared it. Publish to make it publicly visible.",
    icon: CheckCircle,
  },
  published: {
    label: "Published",
    description: "Live and publicly visible.",
    icon: ShareNetwork,
  },
  rejected: {
    label: "Removed",
    description: "Removed from public publishing surfaces.",
    icon: XCircle,
  },
  archived: {
    label: "Archived",
    description: "No longer active.",
    icon: Archive,
  },
};

interface PublishingStatusPanelProps {
  status: PublishingStatus;
  canManage: boolean;
  publishedAt?: string | null;
  rejectionReason?: string | null;
  /** When provided, shows a release action for pending / changes_requested items. */
  onApprove?: () => Promise<void>;
  onPublish: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  /**
   * Whether Remove is offered for live (approved/published) items.
   * Reviews set this to false: live reviews can only be removed through an
   * upheld dispute. Video reviews keep the default.
   */
  allowRejectWhenLive?: boolean;
  /**
   * Extra line under the status description clarifying what the actions
   * govern (e.g. that video publishing is separate from the written review).
   */
  contextNote?: string;
}

export function PublishingStatusPanel({
  status,
  canManage,
  publishedAt,
  rejectionReason,
  onApprove,
  onPublish,
  onReject,
  allowRejectWhenLive = true,
  contextNote,
}: PublishingStatusPanelProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busyAction, setBusyAction] = useState<"approve" | "publish" | "reject" | null>(null);

  const canApprove =
    canManage && Boolean(onApprove) && (status === "pending" || status === "changes_requested");
  const canPublish = canManage && status !== "published" && status !== "archived";
  const isLive = status === "approved" || status === "published";
  const canReject =
    canManage &&
    status !== "rejected" &&
    status !== "archived" &&
    (allowRejectWhenLive || !isLive);

  const copy = STATUS_COPY[status] ?? STATUS_COPY.pending;
  const StatusIcon = copy.icon;

  const runAction = async (action: "approve" | "publish", fn: () => Promise<void>) => {
    setBusyAction(action);
    try {
      await fn();
    } finally {
      setBusyAction(null);
    }
  };

  const handleReject = async () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    setBusyAction("reject");
    try {
      await onReject(trimmed);
      setRejectOpen(false);
      setReason("");
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <StatusIcon className="h-4 w-4 text-muted-foreground" />
          {copy.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {status === "published" && publishedAt
            ? `Live since ${new Date(publishedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}.`
            : copy.description}
        </p>

        {contextNote && (
          <p className="text-xs text-muted-foreground">{contextNote}</p>
        )}

        {status === "rejected" && rejectionReason && (
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            {rejectionReason}
          </p>
        )}

        {canManage ? (
          (canApprove || canPublish || canReject) && (
            <div className="grid gap-2">
              {canApprove && (
                <Button
                  className="w-full gap-2"
                  onClick={() => runAction("approve", onApprove!)}
                  disabled={busyAction !== null}
                >
                  {busyAction === "approve" ? (
                    <SpinnerGap className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Clear for publishing
                </Button>
              )}
              {canPublish && (
                <Button
                  variant={canApprove ? "outline" : "default"}
                  className="w-full gap-2"
                  onClick={() => runAction("publish", onPublish)}
                  disabled={busyAction !== null}
                >
                  {busyAction === "publish" ? (
                    <SpinnerGap className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShareNetwork className="h-4 w-4" />
                  )}
                  Publish
                </Button>
              )}
              {canReject && (
                <Button
                  variant="outline"
                  className="w-full gap-2 border-red-500/25 text-red-700/90 hover:border-red-500/45 hover:bg-red-100/55 hover:text-red-800 focus-visible:ring-red-500/25 dark:border-red-400/25 dark:text-red-300/80 dark:hover:border-red-300/45 dark:hover:bg-red-400/10 dark:hover:text-red-200 dark:focus-visible:ring-red-300/25"
                  onClick={() => setRejectOpen(true)}
                  disabled={busyAction !== null}
                >
                  <XCircle className="h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
          )
        ) : (
          <p className="text-sm text-muted-foreground">
            Only admins and managers can manage publishing.
          </p>
        )}
      </CardContent>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from publishing?</DialogTitle>
            <DialogDescription>
              This keeps the item off public review surfaces. Add a short reason for the record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="publishing-rejection-reason">Reason</Label>
            <Textarea
              id="publishing-rejection-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Why should this stay unpublished?"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={busyAction === "reject"}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleReject}
              disabled={!reason.trim() || busyAction === "reject"}
            >
              {busyAction === "reject" && <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
