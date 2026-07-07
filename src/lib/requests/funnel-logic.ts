/**
 * Pure acquisition-funnel logic shared by the requests data layer
 * (unified-requests.ts) and the funnel chip UI. No I/O and no "use server" /
 * "use client" directive, so both a Server Action module and a client component
 * can import it and agree on how a request's stage and attention are derived.
 */
import type { RequestAttention, RequestType } from "./unified-requests";

/** A request is "stuck" once it has sat sent-but-unopened this long. */
export const STUCK_AFTER_DAYS = 14;

/** Statuses past which "stuck" no longer applies (the request has moved or ended). */
export const TERMINAL_OR_MOVED: ReadonlySet<string> = new Set([
  "opened",
  "completed",
  "expired",
  "cancelled",
  "failed",
]);

/** Ordered acquisition funnel stages. */
export const FUNNEL_STAGES = [
  "sent",
  "opened",
  "started",
  "submitted",
  "published",
] as const;

export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export const FUNNEL_STAGE_LABELS: Record<FunnelStage, string> = {
  sent: "Sent",
  opened: "Opened",
  started: "Started",
  submitted: "Submitted",
  published: "Published",
};

/** The subset of a request the funnel logic reads. */
export interface FunnelInput {
  type: RequestType;
  status: string;
  sentAt: string | null;
  openedAt: string | null;
  completedAt: string | null;
  published: boolean;
  heldReason: string | null;
}

/**
 * Furthest funnel stage a request reached, as an index into FUNNEL_STAGES, or
 * -1 when it hasn't been sent. Surveys have no distinct "started" state, so a
 * completed survey counts as started (it necessarily was); a video counts as
 * started once it is recording or beyond.
 */
export function furthestStageIndex(
  req: Pick<
    FunnelInput,
    "type" | "status" | "sentAt" | "openedAt" | "completedAt" | "published"
  >
): number {
  const reached: boolean[] = [
    !!req.sentAt,
    !!req.openedAt,
    req.type === "video"
      ? req.status === "recording" || !!req.completedAt
      : !!req.completedAt,
    !!req.completedAt,
    req.published,
  ];
  let idx = -1;
  reached.forEach((r, i) => {
    if (r) idx = i;
  });
  return idx;
}

/**
 * Non-terminal attention flag for a request, or null when none applies. "Held"
 * (a survey held back from sending) takes precedence over "stuck" (sent >14d ago
 * and never opened). `now` is injectable for deterministic tests.
 */
export function computeAttention(
  req: Pick<FunnelInput, "status" | "sentAt" | "openedAt" | "completedAt" | "heldReason">,
  now: number = Date.now()
): RequestAttention | null {
  if (req.heldReason) return "held";

  if (
    req.sentAt &&
    !req.openedAt &&
    !req.completedAt &&
    !TERMINAL_OR_MOVED.has(req.status)
  ) {
    const ageDays = (now - new Date(req.sentAt).getTime()) / (24 * 60 * 60 * 1000);
    if (ageDays > STUCK_AFTER_DAYS) return "stuck";
  }
  return null;
}
