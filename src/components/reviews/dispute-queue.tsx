"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  CaretDown,
  CaretRight,
  CheckCircle,
  Flag,
  Info,
  ShieldCheck,
  SpinnerGap,
  XCircle,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
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
import { AnimatedSection } from "@/components/motion";
import { toast } from "@/hooks/use-toast";
import {
  dismissFlag,
  getReviewFlags,
  upholdFlag,
} from "@/lib/reviews/flag-actions";
import { FLAG_REASON_LABELS, type ReviewFlag } from "@/lib/reviews/types";
import { MIN_RESOLUTION_NOTE_LENGTH } from "@/lib/reviews/dispute-resolution";
import { RatingStars } from "@/components/reviews/rating-stars";

// ============================================================================
// Helpers
// ============================================================================

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ============================================================================
// Flag row
// ============================================================================

function FlagRow({
  flag,
  canAdjudicate,
  onUphold,
  onDismiss,
}: {
  flag: ReviewFlag;
  canAdjudicate: boolean;
  onUphold?: (flag: ReviewFlag) => void;
  onDismiss?: (flag: ReviewFlag) => void;
}) {
  const reporter = flag.flaggedByName || flag.reporterName || "Anonymous";
  const isResolved = flag.status === "dismissed" || flag.status === "actioned";

  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-heading">{reporter}</span>
            <Badge variant="outline" className="border-amber-500/50 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
              {FLAG_REASON_LABELS[flag.reason] ?? flag.reason}
            </Badge>
            {flag.status === "actioned" && (
              <Badge variant="outline" className="border-red-500/50 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300">
                Upheld
              </Badge>
            )}
            {flag.status === "dismissed" && (
              <Badge variant="outline" className="border-border text-muted-foreground">
                Dismissed
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Reported {formatDate(flag.createdAt)}
            {flag.reporterEmail ? ` by ${flag.reporterEmail}` : ""}
          </p>
        </div>
        {canAdjudicate && !isResolved && (
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => onDismiss?.(flag)}>
              <XCircle className="mr-1 h-4 w-4" />
              Dismiss
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-500/25 text-red-700/90 hover:border-red-500/45 hover:bg-red-100/55 hover:text-red-800 dark:border-red-400/25 dark:text-red-300/80 dark:hover:bg-red-400/10 dark:hover:text-red-200"
              onClick={() => onUphold?.(flag)}
            >
              <ShieldCheck className="mr-1 h-4 w-4" />
              Uphold and remove
            </Button>
          </div>
        )}
      </div>

      {flag.details && (
        <p className="text-sm text-foreground/80">{flag.details}</p>
      )}

      {flag.review && (
        <Link
          href={`/dashboard/reviews/${flag.review.id}`}
          className="block rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
        >
          <div className="mb-1 flex items-center gap-2">
            <RatingStars rating={flag.review.rating} />
            <span className="text-sm font-medium text-heading">
              {flag.review.customerName || "Anonymous"}
            </span>
          </div>
          {flag.review.textExcerpt ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {flag.review.textExcerpt}
            </p>
          ) : (
            <p className="text-sm italic text-muted-foreground/60">
              No written review provided
            </p>
          )}
        </Link>
      )}

      {isResolved && flag.resolutionNote && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium">Resolution note:</span> {flag.resolutionNote}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Main component
// ============================================================================

interface DisputeQueueProps {
  initialOpenFlags: ReviewFlag[];
  initialResolvedFlags: ReviewFlag[];
  accountType: "individual" | "enterprise";
}

export function DisputeQueue({
  initialOpenFlags,
  initialResolvedFlags,
  accountType,
}: DisputeQueueProps) {
  const [openFlags, setOpenFlags] = useState(initialOpenFlags);
  const [resolvedFlags, setResolvedFlags] = useState(initialResolvedFlags);
  const [showResolved, setShowResolved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [dialogFlag, setDialogFlag] = useState<ReviewFlag | null>(null);
  const [dialogMode, setDialogMode] = useState<"uphold" | "dismiss" | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canAdjudicate = accountType === "enterprise";

  const openDialog = (mode: "uphold" | "dismiss", flag: ReviewFlag) => {
    setDialogMode(mode);
    setDialogFlag(flag);
    setNote("");
  };

  const closeDialog = () => {
    if (isSubmitting) return;
    setDialogMode(null);
    setDialogFlag(null);
    setNote("");
  };

  const refreshFlags = () => {
    startTransition(async () => {
      const [open, resolved] = await Promise.all([
        getReviewFlags({ status: "pending" }),
        getReviewFlags({ status: "resolved" }),
      ]);
      if (open.success && open.data) setOpenFlags(open.data.flags);
      if (resolved.success && resolved.data) setResolvedFlags(resolved.data.flags);
    });
  };

  const handleConfirm = async () => {
    if (!dialogFlag || !dialogMode) return;
    setIsSubmitting(true);
    try {
      const result =
        dialogMode === "uphold"
          ? await upholdFlag({ flagId: dialogFlag.id, resolutionNote: note })
          : await dismissFlag({
              flagId: dialogFlag.id,
              resolutionNote: note.trim() || undefined,
            });

      if (result.success) {
        toast({
          title:
            dialogMode === "uphold"
              ? "Dispute upheld and review removed"
              : "Dispute dismissed",
        });
        setDialogMode(null);
        setDialogFlag(null);
        setNote("");
        refreshFlags();
      } else {
        toast({
          title: "Something went wrong",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {!canAdjudicate && (
        <AnimatedSection>
          <div className="flex items-start gap-3 rounded-xl border border-repwell-teal-300/20 bg-repwell-sage-100/30 px-4 py-3 dark:bg-repwell-teal-300/10">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-repwell-teal-300" weight="duotone" />
            <div>
              <p className="text-sm font-medium text-heading">
                Disputes for individual accounts are reviewed by the RepWell team
              </p>
              <p className="text-sm text-muted-foreground">
                New disputes are escalated automatically. We will follow up once a
                decision has been made.
              </p>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* Open disputes */}
      <AnimatedSection delay={0.05}>
        <Card className="overflow-hidden border border-border shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <Flag className="h-5 w-5 text-repwell-teal-300" weight="duotone" />
              </div>
              Open disputes ({openFlags.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            {openFlags.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-repwell-sage-100 to-repwell-sage-200/50">
                  <CheckCircle className="h-7 w-7 text-label" weight="duotone" />
                </div>
                <p className="font-medium text-heading">No open disputes</p>
                <p className="mt-1 text-sm text-repwell-teal-300">
                  Reported reviews will appear here for a decision.
                </p>
              </div>
            ) : (
              <div className="divide-y overflow-hidden rounded-lg border border-border/50">
                {openFlags.map((flag) => (
                  <FlagRow
                    key={flag.id}
                    flag={flag}
                    canAdjudicate={canAdjudicate}
                    onUphold={(f) => openDialog("uphold", f)}
                    onDismiss={(f) => openDialog("dismiss", f)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Resolved disputes */}
      {resolvedFlags.length > 0 && (
        <AnimatedSection delay={0.1}>
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground"
              onClick={() => setShowResolved((value) => !value)}
              disabled={isPending}
            >
              {showResolved ? (
                <CaretDown className="h-4 w-4" />
              ) : (
                <CaretRight className="h-4 w-4" />
              )}
              Resolved disputes ({resolvedFlags.length})
            </Button>
            {showResolved && (
              <div className="divide-y overflow-hidden rounded-lg border border-border/50">
                {resolvedFlags.map((flag) => (
                  <FlagRow key={flag.id} flag={flag} canAdjudicate={false} />
                ))}
              </div>
            )}
          </div>
        </AnimatedSection>
      )}

      {/* Adjudication dialog */}
      <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "uphold" ? "Uphold dispute and remove review?" : "Dismiss dispute?"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "uphold"
                ? "This permanently removes the review from public display."
                : "The review stays live and the dispute is closed."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="dispute-resolution-note">
              Resolution note{dialogMode === "dismiss" ? " (optional)" : ""}
            </Label>
            <Textarea
              id="dispute-resolution-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={
                dialogMode === "uphold"
                  ? "Explain why this dispute was upheld..."
                  : "Add context for the record..."
              }
              rows={4}
            />
            {dialogMode === "uphold" && (
              <p className="text-xs text-muted-foreground">
                A note of at least {MIN_RESOLUTION_NOTE_LENGTH} characters is required for the record.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={dialogMode === "uphold" ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={
                isSubmitting ||
                (dialogMode === "uphold" &&
                  note.trim().length < MIN_RESOLUTION_NOTE_LENGTH)
              }
            >
              {isSubmitting && <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />}
              {dialogMode === "uphold" ? "Uphold and remove" : "Dismiss dispute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
