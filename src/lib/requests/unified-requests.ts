"use server";

import { getSurveysForDistribution } from "@/lib/distribution/actions";
import {
  getVideoTestimonialRequests,
  getVideoTestimonialRequestStats,
} from "@/lib/video-testimonials/actions";
import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { computeAttention } from "@/lib/requests/funnel-logic";

// ============================================================================
// Types
// ============================================================================

export type RequestType = "survey" | "video";

/** Non-terminal attention flags surfaced on the funnel (CONTEXT.md § Acquisition Funnel). */
export type RequestAttention = "held" | "stuck";

export interface UnifiedRequest {
  id: string;
  type: RequestType;
  customerName: string;
  customerEmail: string;
  status: string;
  loanOfficerName: string;
  sentAt: string | null;
  completedAt: string | null;
  openedAt: string | null;
  reminderCount: number;
  source: string;
  createdAt: string;
  requestUrl: string | null;
  /** Review ID for completed requests (linked via survey_responses or video_testimonials) */
  reviewId: string | null;
  /** True when the linked review is live (is_published) — the funnel's final stage. */
  published: boolean;
  /**
   * Non-terminal attention state, null when none:
   * - "held": a survey held back from sending (e.g. unattributed) — needs a human.
   * - "stuck": sent >14d ago and never opened.
   */
  attention: RequestAttention | null;
  /** Free-text reason when attention === "held" (from surveys.held_reason). */
  heldReason: string | null;
}

export interface UnifiedRequestStats {
  total: number;
  pending: number;
  sent: number;
  completed: number;
  expired: number;
  byType: { survey: number; video: number };
}

export interface UnifiedRequestFilters {
  type?: RequestType;
  status?: string;
  loanOfficerId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ============================================================================
// Status Normalization
// ============================================================================

function normalizeVideoStatus(status: string): string {
  switch (status) {
    case "submitted":
      return "completed";
    case "recording":
      return "opened";
    default:
      return status;
  }
}

function normalizeSurveyStatus(status: string): string {
  // Survey statuses map directly except "completed" stays as-is
  return status;
}

// ============================================================================
// Server Actions
// ============================================================================

export async function getUnifiedRequests(
  filters: UnifiedRequestFilters = {}
): Promise<{
  requests: UnifiedRequest[];
  total: number;
}> {
  const { type, status, loanOfficerId, search, page = 1, pageSize = 25 } = filters;

  // Determine which data sources to query
  const fetchSurveys = !type || type === "survey";
  const fetchVideos = !type || type === "video";

  // Map unified status back to source-specific status for filtering
  const surveyStatus = status === "completed" ? "completed" : status === "opened" ? undefined : status;
  const videoStatus =
    status === "completed"
      ? "submitted"
      : status === "opened"
        ? "opened"
        : status;

  // When merging two sources with client-side sort, we need enough rows
  // from each to fill the requested page. Fetch page * pageSize from each
  // source (worst case: all merged rows come from one source). Use a higher
  // limit when search is active since client-side filtering reduces results.
  const fetchLimit = search
    ? Math.max(page * pageSize * 4, 200)
    : Math.max(page * pageSize, 50);

  const [surveyResult, videoResult] = await Promise.all([
    fetchSurveys
      ? getSurveysForDistribution({
          status: surveyStatus,
          loanOfficerId,
          page: 1,
          pageSize: fetchLimit,
        })
      : null,
    fetchVideos
      ? getVideoTestimonialRequests({
          status: videoStatus,
          loanOfficerId,
          search,
          page: 1,
          pageSize: fetchLimit,
        })
      : null,
  ]);

  // Map surveys to UnifiedRequest
  const surveyRequests: UnifiedRequest[] =
    surveyResult?.success && surveyResult.data
      ? surveyResult.data.surveys.map((s) => ({
          id: s.id,
          type: "survey" as const,
          customerName: s.customerName,
          customerEmail: s.customerEmail,
          status: normalizeSurveyStatus(s.status),
          loanOfficerName: s.loanOfficerName,
          sentAt: s.sentAt,
          completedAt: s.completedAt,
          openedAt: null, // enriched below (surveys.opened_at)
          reminderCount: s.reminderCount,
          source: s.source,
          createdAt: s.createdAt,
          requestUrl: null,
          reviewId: null,
          published: false,
          attention: null,
          heldReason: null,
        }))
      : [];

  // Map video requests to UnifiedRequest
  const videoRequests: UnifiedRequest[] =
    videoResult?.success && videoResult.data
      ? videoResult.data.requests.map((v) => ({
          id: v.id,
          type: "video" as const,
          customerName: v.customerName,
          customerEmail: v.customerEmail,
          status: normalizeVideoStatus(v.status),
          loanOfficerName: "", // Video requests don't return LO name in list query
          sentAt: v.sentAt,
          completedAt: v.submittedAt,
          openedAt: v.openedAt,
          reminderCount: v.reminderCount,
          source: v.source,
          createdAt: v.createdAt,
          requestUrl: v.requestUrl,
          reviewId: null,
          published: false,
          attention: null,
          heldReason: null,
        }))
      : [];

  // Merge and sort by createdAt desc
  let merged = [...surveyRequests, ...videoRequests];

  // Apply search filter for surveys (video search is done server-side)
  if (search && fetchSurveys) {
    const q = search.toLowerCase();
    merged = merged.filter(
      (r) =>
        r.type === "video" || // Video already filtered server-side
        r.customerName.toLowerCase().includes(q) ||
        r.customerEmail.toLowerCase().includes(q)
    );
  }

  merged.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const total = merged.length;

  // Paginate first, then enrich only the visible page — funnel enrichment
  // (survey open time, published stage, attention) hits several tables and we
  // never want to pay for rows the caller won't see.
  const start = (page - 1) * pageSize;
  const paged = merged.slice(start, start + pageSize);

  await enrichFunnel(paged);

  return { requests: paged, total };
}

// ============================================================================
// Funnel enrichment
// ============================================================================

/**
 * Fill in the funnel-specific fields for a page of requests, mutating in place:
 * survey open time, the published stage (linked review is live), and the
 * "held" / "stuck" attention flags. Runs a small fixed number of batched reads
 * regardless of page size.
 */
async function enrichFunnel(requests: UnifiedRequest[]): Promise<void> {
  if (requests.length === 0) return;

  const supabase = createAdminClient();
  const surveyIds = requests.filter((r) => r.type === "survey").map((r) => r.id);
  const videoIds = requests.filter((r) => r.type === "video").map((r) => r.id);

  const [surveyMeta, surveyPublished, videoPublished] = await Promise.all([
    fetchSurveyMeta(surveyIds),
    resolvePublishedSurveys(supabase, surveyIds),
    resolvePublishedVideos(supabase, videoIds),
  ]);

  for (const req of requests) {
    if (req.type === "survey") {
      const meta = surveyMeta.get(req.id);
      if (meta) {
        req.openedAt = meta.openedAt;
        req.heldReason = meta.heldReason;
      }
      const pub = surveyPublished.get(req.id);
      if (pub) {
        req.reviewId = pub.reviewId;
        req.published = pub.published;
      }
    } else {
      const pub = videoPublished.get(req.id);
      if (pub) {
        req.reviewId = pub.reviewId;
        req.published = pub.published;
      }
    }
    req.attention = computeAttention(req);
  }
}

interface SurveyMeta {
  openedAt: string | null;
  heldReason: string | null;
}

/**
 * Read surveys.opened_at (dropped by the distribution mapping — the audit
 * finding) and surveys.held_reason. `held_reason` is added by a parallel change
 * and may be absent on disk, so a missing-column error degrades to no Held flag
 * rather than failing the whole list.
 */
async function fetchSurveyMeta(surveyIds: string[]): Promise<Map<string, SurveyMeta>> {
  const out = new Map<string, SurveyMeta>();
  if (surveyIds.length === 0) return out;

  // Untyped client: held_reason isn't in the generated schema yet (added by a
  // parallel change), so a typed select would fail to compile.
  const supabase = createUntypedAdminClient();
  let rows: Array<{ id: string; opened_at: string | null; held_reason?: string | null }> = [];

  const withHeld = await supabase
    .from("surveys")
    .select("id, opened_at, held_reason")
    .in("id", surveyIds);
  if (withHeld.error) {
    // 42703 = undefined_column: held_reason not deployed yet. Retry without it.
    const fallback = await supabase
      .from("surveys")
      .select("id, opened_at")
      .in("id", surveyIds);
    rows = (fallback.data ?? []) as typeof rows;
  } else {
    rows = (withHeld.data ?? []) as typeof rows;
  }

  for (const r of rows) {
    out.set(r.id, {
      openedAt: r.opened_at ?? null,
      heldReason: (r.held_reason ?? null) as string | null,
    });
  }
  return out;
}

interface PublishedLink {
  reviewId: string;
  published: boolean;
}

/** Resolve survey → survey_responses → reviews, returning review id + published flag. */
async function resolvePublishedSurveys(
  supabase: ReturnType<typeof createAdminClient>,
  surveyIds: string[]
): Promise<Map<string, PublishedLink>> {
  const out = new Map<string, PublishedLink>();
  if (surveyIds.length === 0) return out;

  const { data: responseRows } = await supabase
    .from("survey_responses")
    .select("id, survey_id")
    .in("survey_id", surveyIds);
  if (!responseRows || responseRows.length === 0) return out;

  const responseToSurvey = new Map(responseRows.map((r) => [r.id, r.survey_id]));
  const { data: reviewRows } = await supabase
    .from("reviews")
    .select("id, survey_response_id, is_published")
    .in(
      "survey_response_id",
      responseRows.map((r) => r.id)
    );

  for (const review of (reviewRows ?? []) as Array<{
    id: string;
    survey_response_id: string | null;
    is_published: boolean | null;
  }>) {
    const surveyId = review.survey_response_id
      ? responseToSurvey.get(review.survey_response_id)
      : null;
    if (surveyId) {
      out.set(surveyId, { reviewId: review.id, published: review.is_published ?? false });
    }
  }
  return out;
}

/** Resolve video request → video_testimonial_responses → reviews. */
async function resolvePublishedVideos(
  supabase: ReturnType<typeof createAdminClient>,
  requestIds: string[]
): Promise<Map<string, PublishedLink>> {
  const out = new Map<string, PublishedLink>();
  if (requestIds.length === 0) return out;

  const { data: responseRows } = await supabase
    .from("video_testimonial_responses")
    .select("request_id, review_id")
    .in("request_id", requestIds)
    .not("review_id", "is", null);
  if (!responseRows || responseRows.length === 0) return out;

  const reviewToRequest = new Map<string, string>();
  for (const r of responseRows as Array<{ request_id: string; review_id: string | null }>) {
    if (r.review_id) reviewToRequest.set(r.review_id, r.request_id);
  }
  if (reviewToRequest.size === 0) return out;

  const { data: reviewRows } = await supabase
    .from("reviews")
    .select("id, is_published")
    .in("id", Array.from(reviewToRequest.keys()));

  for (const review of (reviewRows ?? []) as Array<{ id: string; is_published: boolean | null }>) {
    const requestId = reviewToRequest.get(review.id);
    if (requestId) {
      out.set(requestId, { reviewId: review.id, published: review.is_published ?? false });
    }
  }
  return out;
}

export async function getUnifiedRequestStats(): Promise<UnifiedRequestStats> {
  const [surveyResult, videoResult] = await Promise.all([
    getSurveysForDistribution({ page: 1, pageSize: 500 }),
    getVideoTestimonialRequestStats(),
  ]);

  // Count survey statuses from the raw data
  const surveys = surveyResult?.success ? surveyResult.data?.surveys ?? [] : [];
  const surveyStats = {
    total: surveys.length,
    pending: surveys.filter((s) => s.status === "pending").length,
    sent: surveys.filter((s) => s.status === "sent").length,
    completed: surveys.filter((s) => s.status === "completed").length,
    expired: surveys.filter((s) => s.status === "expired").length,
  };

  const videoStats =
    videoResult?.success && videoResult.data
      ? videoResult.data
      : { total: 0, pending: 0, sent: 0, completed: 0, expired: 0 };

  return {
    total: surveyStats.total + videoStats.total,
    pending: surveyStats.pending + videoStats.pending,
    sent: surveyStats.sent + videoStats.sent,
    completed: surveyStats.completed + videoStats.completed,
    expired: surveyStats.expired + videoStats.expired,
    byType: {
      survey: surveyStats.total,
      video: videoStats.total,
    },
  };
}
