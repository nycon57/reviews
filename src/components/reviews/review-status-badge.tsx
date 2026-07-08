import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  REVIEW_STATUS_LABELS,
  type Review,
} from "@/lib/reviews/types";

export type ReviewRecordStatus = Review["status"];

export const REVIEW_STATUS_COPY: Record<
  ReviewRecordStatus,
  { label: string; description: string; className: string }
> = {
  pending: {
    label: "Quarantined",
    description: "Pending automated screening before it can go live.",
    className:
      "border-amber-500/60 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  },
  approved: {
    label: REVIEW_STATUS_LABELS.approved,
    description: "Published and visible on public review surfaces.",
    className:
      "border-repwell-sage-200/70 bg-repwell-sage-100/45 text-repwell-teal-500 dark:bg-repwell-teal-300/10 dark:text-repwell-sage-100",
  },
  rejected: {
    label: REVIEW_STATUS_LABELS.rejected,
    description: "Removed from public review surfaces.",
    className:
      "border-red-500/45 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
  },
  archived: {
    label: REVIEW_STATUS_LABELS.archived,
    description: "Archived internally and no longer active.",
    className: "border-border bg-muted text-muted-foreground",
  },
};

export const REVIEW_STATUS_FILTER_LABELS: Record<ReviewRecordStatus, string> = {
  pending: REVIEW_STATUS_COPY.pending.label,
  approved: REVIEW_STATUS_COPY.approved.label,
  rejected: REVIEW_STATUS_COPY.rejected.label,
  archived: REVIEW_STATUS_COPY.archived.label,
};

function isReviewRecordStatus(
  status: string | null | undefined
): status is ReviewRecordStatus {
  return (
    status === "pending" ||
    status === "approved" ||
    status === "rejected" ||
    status === "archived"
  );
}

function formatUnknownStatus(status: string | null | undefined) {
  const value = String(status ?? "unknown").trim();
  if (!value) return "Unknown";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

export function getReviewStatusLabel(status: string | null | undefined) {
  if (isReviewRecordStatus(status)) {
    return REVIEW_STATUS_COPY[status].label;
  }
  return formatUnknownStatus(status);
}

export function getReviewStatusDescription(
  status: string | null | undefined
) {
  if (isReviewRecordStatus(status)) {
    return REVIEW_STATUS_COPY[status].description;
  }
  return "Status not recognized by the current review workflow.";
}

export function ReviewStatusBadge({
  status,
  className,
}: {
  status: string | null | undefined;
  className?: string;
}) {
  const copy = isReviewRecordStatus(status)
    ? REVIEW_STATUS_COPY[status]
    : {
        label: formatUnknownStatus(status),
        className: "border-border bg-muted text-muted-foreground",
      };

  return (
    <Badge variant="outline" className={cn(copy.className, className)}>
      {copy.label}
    </Badge>
  );
}
