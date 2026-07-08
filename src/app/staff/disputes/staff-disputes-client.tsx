"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Buildings,
  CheckCircle,
  Clock,
  Flag,
  ShieldWarning,
  SpinnerGap,
  Star,
  UserCircle,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  dismissStaffDispute,
  upholdStaffDispute,
  type StaffDispute,
} from "@/lib/reviews/dispute-staff-actions";

const MIN_NOTE_LENGTH = 10;

type ResolutionKind = "uphold" | "dismiss";

interface PendingResolution {
  kind: ResolutionKind;
  dispute: StaffDispute;
}

interface StaffDisputesClientProps {
  disputes: StaffDispute[];
  loadError: string | null;
}

function formatAge(createdAt: string): string {
  const created = new Date(createdAt);
  const diffMs = Date.now() - created.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return created.toLocaleDateString();
}

function formatReporter(dispute: StaffDispute): string {
  return (
    dispute.reporterName ||
    dispute.flaggedByName ||
    dispute.reporterEmail ||
    "Unknown reporter"
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} star rating`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={
            index < rating
              ? "h-4 w-4 fill-yellow-400 text-yellow-400"
              : "h-4 w-4 fill-muted text-muted"
          }
          weight={index < rating ? "fill" : "regular"}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export function StaffDisputesClient({
  disputes: initialDisputes,
  loadError,
}: StaffDisputesClientProps) {
  const router = useRouter();
  const [disputes, setDisputes] = useState(initialDisputes);
  const [pendingResolution, setPendingResolution] =
    useState<PendingResolution | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setDisputes(initialDisputes);
  }, [initialDisputes]);

  const oldestAge = useMemo(() => {
    if (!disputes.length) return "None";
    return formatAge(disputes[0].createdAt);
  }, [disputes]);

  const noteIsValid = resolutionNote.trim().length >= MIN_NOTE_LENGTH;
  const activeDispute = pendingResolution?.dispute ?? null;
  const isUphold = pendingResolution?.kind === "uphold";

  function openResolution(kind: ResolutionKind, dispute: StaffDispute) {
    setPendingResolution({ kind, dispute });
    setResolutionNote("");
    setActionError(null);
  }

  function closeResolution() {
    if (isSubmitting) return;
    setPendingResolution(null);
    setResolutionNote("");
    setActionError(null);
  }

  async function submitResolution() {
    if (!pendingResolution || !noteIsValid) return;

    setIsSubmitting(true);
    setActionError(null);

    const payload = {
      flagId: pendingResolution.dispute.id,
      resolutionNote: resolutionNote.trim(),
    };
    const result =
      pendingResolution.kind === "uphold"
        ? await upholdStaffDispute(payload)
        : await dismissStaffDispute(payload);

    setIsSubmitting(false);

    if (!result.success) {
      setActionError(result.error ?? "Failed to resolve dispute");
      return;
    }

    setDisputes((current) =>
      current.filter((dispute) => dispute.id !== pendingResolution.dispute.id)
    );
    setPendingResolution(null);
    setResolutionNote("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="w-fit border-repwell-teal-300/30 bg-repwell-sage-100/25 text-repwell-teal-400"
          >
            Staff queue
          </Badge>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-heading">
              Individual disputes
            </h2>
            <p className="text-sm text-muted-foreground">
              Open review disputes from individual accounts.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:min-w-[20rem]">
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Flag className="h-4 w-4 text-repwell-teal-300" aria-hidden="true" />
              Open
            </div>
            <p className="mt-1 text-2xl font-semibold text-heading">
              {disputes.length}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Clock className="h-4 w-4 text-repwell-teal-300" aria-hidden="true" />
              Oldest
            </div>
            <p className="mt-1 text-2xl font-semibold text-heading">{oldestAge}</p>
          </div>
        </div>
      </div>

      {loadError ? (
        <Alert variant="destructive">
          <WarningCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Could not load disputes</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="overflow-hidden border border-border shadow-soft">
        <CardHeader className="border-b border-border/60 bg-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-teal-300/10">
              <ShieldWarning
                className="h-5 w-5 text-repwell-teal-300"
                aria-hidden="true"
              />
            </div>
            <div>
              <CardTitle className="text-lg">Open individual disputes</CardTitle>
              <CardDescription>
                Uphold removes the live review; dismiss keeps it published.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {disputes.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-repwell-sage-100/40">
                <CheckCircle
                  className="h-6 w-6 text-repwell-teal-300"
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="font-medium text-heading">No open individual disputes</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  New individual account disputes will appear here.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[12rem]">Organization</TableHead>
                  <TableHead className="min-w-[320px]">Review</TableHead>
                  <TableHead className="min-w-[12rem]">Reporter</TableHead>
                  <TableHead className="min-w-[11rem]">Reason</TableHead>
                  <TableHead className="min-w-[7rem]">Age</TableHead>
                  <TableHead className="min-w-[12rem] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-repwell-teal-300/10">
                          <Buildings
                            className="h-4 w-4 text-repwell-teal-300"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-heading">
                            {dispute.organizationName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Individual account
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[360px] space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {dispute.review ? (
                            <RatingStars rating={dispute.review.rating} />
                          ) : (
                            <Badge variant="outline">Missing review</Badge>
                          )}
                          {dispute.review?.customerName ? (
                            <span className="text-sm font-medium text-heading">
                              {dispute.review.customerName}
                            </span>
                          ) : null}
                        </div>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {dispute.review?.textExcerpt || "No written review provided"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <UserCircle
                          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-heading">
                            {formatReporter(dispute)}
                          </p>
                          {dispute.reporterEmail ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {dispute.reporterEmail}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <Badge variant="outline">{dispute.reasonLabel}</Badge>
                        {dispute.details ? (
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {dispute.details}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatAge(dispute.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openResolution("uphold", dispute)}
                        >
                          <XCircle className="h-4 w-4" aria-hidden="true" />
                          Uphold
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openResolution("dismiss", dispute)}
                        >
                          <CheckCircle className="h-4 w-4" aria-hidden="true" />
                          Dismiss
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(pendingResolution)}
        onOpenChange={(open) => {
          if (!open) closeResolution();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isUphold ? "Uphold dispute" : "Dismiss dispute"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isUphold
                ? "This will remove the live review and close the dispute."
                : "This will keep the review live and close the dispute."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {activeDispute ? (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-sm font-medium text-heading">
                {activeDispute.organizationName}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {activeDispute.review?.textExcerpt || "No written review provided"}
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <label
              htmlFor="resolution-note"
              className="text-sm font-medium text-heading"
            >
              Resolution note
            </label>
            <Textarea
              id="resolution-note"
              value={resolutionNote}
              onChange={(event) => setResolutionNote(event.target.value)}
              placeholder="Briefly explain the decision."
              className="min-h-28"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              {Math.max(0, MIN_NOTE_LENGTH - resolutionNote.trim().length)} more
              characters required.
            </p>
          </div>

          {actionError ? (
            <Alert variant="destructive">
              <WarningCircle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Could not resolve dispute</AlertTitle>
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <Button
              variant={isUphold ? "destructive" : "default"}
              onClick={submitResolution}
              disabled={!noteIsValid || isSubmitting}
            >
              {isSubmitting ? (
                <SpinnerGap className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : isUphold ? (
                <XCircle className="h-4 w-4" aria-hidden="true" />
              ) : (
                <CheckCircle className="h-4 w-4" aria-hidden="true" />
              )}
              {isUphold ? "Remove review" : "Keep review"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
