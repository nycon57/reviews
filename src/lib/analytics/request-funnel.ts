"use server";

/**
 * Acquisition funnel rollup (ADR 0004, CONTEXT.md § Acquisition Funnel).
 *
 * Aggregates review/testimonial requests into per-professional and org-wide
 * funnel metrics over a selectable window: how many were sent, opened, submitted,
 * and ended in a published review. Both request types (surveys, video requests)
 * key on `loan_officer_id`, so the professional is the natural rollup unit and
 * the two sources unify cleanly.
 *
 * "Published" is resolved through the same request→review chains the requests
 * list uses (survey → survey_responses → reviews; video request →
 * video_testimonial_responses → reviews), gated on reviews.is_published — the
 * canonical live-review signal after the publish inversion.
 *
 * Read-only. Org-scoped from the session; a professional sees only their own
 * funnel, managers/admins see every professional in the org.
 */
import { getAccessContext } from "@/lib/access";
import { createUntypedAdminClient } from "@/lib/supabase/admin";

export interface FunnelMetrics {
  requestsSent: number;
  opened: number;
  submitted: number;
  published: number;
  /** opened / requestsSent, 0..1. */
  openRate: number;
  /** submitted / requestsSent, 0..1. */
  submissionRate: number;
}

export interface ProfessionalFunnel extends FunnelMetrics {
  loanOfficerId: string;
  name: string;
  userId: string | null;
}

export interface RequestFunnelRollup {
  windowDays: number;
  org: FunnelMetrics;
  professionals: ProfessionalFunnel[];
}

/** The windows the analytics card offers. */
const ALLOWED_WINDOWS = [30, 90] as const;

type Client = ReturnType<typeof createUntypedAdminClient>;

interface Accumulator {
  requestsSent: number;
  opened: number;
  submitted: number;
  published: number;
}

function emptyAcc(): Accumulator {
  return { requestsSent: 0, opened: 0, submitted: 0, published: 0 };
}

function finalize(acc: Accumulator): FunnelMetrics {
  return {
    requestsSent: acc.requestsSent,
    opened: acc.opened,
    submitted: acc.submitted,
    published: acc.published,
    openRate: acc.requestsSent > 0 ? acc.opened / acc.requestsSent : 0,
    submissionRate: acc.requestsSent > 0 ? acc.submitted / acc.requestsSent : 0,
  };
}

/**
 * Compute the funnel rollup for the caller's org over `windowDays` (30 or 90).
 * Managers/admins get every professional; a professional gets only their own.
 */
export async function getRequestFunnelRollup(
  windowDays = 30
): Promise<RequestFunnelRollup> {
  const window = (ALLOWED_WINDOWS as readonly number[]).includes(windowDays)
    ? windowDays
    : 30;

  const ctx = await getAccessContext();
  if (!ctx) throw new Error("getRequestFunnelRollup: not authenticated");
  const isManager = ctx.role === "admin" || ctx.role === "manager";

  const supabase = createUntypedAdminClient();
  const cutoff = new Date(Date.now() - window * 24 * 60 * 60 * 1000).toISOString();

  // Which professionals are in scope, and their display names.
  const officers = await getOfficers(supabase, ctx.organizationId, isManager ? null : ctx.userId);
  if (officers.length === 0) {
    return { windowDays: window, org: finalize(emptyAcc()), professionals: [] };
  }
  const officerIds = officers.map((o) => o.id);
  const acc = new Map<string, Accumulator>();
  for (const id of officerIds) acc.set(id, emptyAcc());

  // Windowed requests for those professionals.
  const [surveyRes, videoRes] = await Promise.all([
    supabase
      .from("surveys")
      .select("id, loan_officer_id, sent_at, opened_at, completed_at, status")
      .eq("organization_id", ctx.organizationId)
      .in("loan_officer_id", officerIds)
      .gte("created_at", cutoff),
    supabase
      .from("video_testimonial_requests")
      .select("id, loan_officer_id, sent_at, opened_at, submitted_at, status")
      .eq("organization_id", ctx.organizationId)
      .in("loan_officer_id", officerIds)
      .gte("created_at", cutoff),
  ]);

  const surveys = (surveyRes.data ?? []) as Array<{
    id: string;
    loan_officer_id: string;
    sent_at: string | null;
    opened_at: string | null;
    completed_at: string | null;
    status: string | null;
  }>;
  const videos = (videoRes.data ?? []) as Array<{
    id: string;
    loan_officer_id: string;
    sent_at: string | null;
    opened_at: string | null;
    submitted_at: string | null;
    status: string | null;
  }>;

  // Resolve which of these requests ended in a published review.
  const [publishedSurveyIds, publishedVideoIds] = await Promise.all([
    resolvePublishedSurveys(supabase, surveys.map((s) => s.id)),
    resolvePublishedVideos(supabase, videos.map((v) => v.id)),
  ]);

  for (const s of surveys) {
    const a = acc.get(s.loan_officer_id);
    if (!a) continue;
    if (s.sent_at) a.requestsSent += 1;
    if (s.opened_at) a.opened += 1;
    if (s.completed_at || s.status === "completed") a.submitted += 1;
    if (publishedSurveyIds.has(s.id)) a.published += 1;
  }
  for (const v of videos) {
    const a = acc.get(v.loan_officer_id);
    if (!a) continue;
    if (v.sent_at) a.requestsSent += 1;
    if (v.opened_at) a.opened += 1;
    if (v.submitted_at || v.status === "submitted") a.submitted += 1;
    if (publishedVideoIds.has(v.id)) a.published += 1;
  }

  const professionals: ProfessionalFunnel[] = officers
    .map((o) => ({
      loanOfficerId: o.id,
      name: o.full_name,
      userId: o.user_id,
      ...finalize(acc.get(o.id) ?? emptyAcc()),
    }))
    // Most active first; drop professionals with no activity in the window.
    .filter((p) => p.requestsSent > 0 || p.submitted > 0 || p.published > 0)
    .sort((a, b) => b.requestsSent - a.requestsSent);

  const orgAcc = emptyAcc();
  for (const a of acc.values()) {
    orgAcc.requestsSent += a.requestsSent;
    orgAcc.opened += a.opened;
    orgAcc.submitted += a.submitted;
    orgAcc.published += a.published;
  }

  return { windowDays: window, org: finalize(orgAcc), professionals };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getOfficers(
  supabase: Client,
  organizationId: string,
  restrictToUserId: string | null
): Promise<Array<{ id: string; full_name: string; user_id: string | null }>> {
  let query = supabase
    .from("loan_officers")
    .select("id, full_name, user_id")
    .eq("organization_id", organizationId);
  if (restrictToUserId) query = query.eq("user_id", restrictToUserId);

  const { data } = await query;
  return ((data ?? []) as Array<{ id: string; full_name: string | null; user_id: string | null }>).map(
    (o) => ({ id: o.id, full_name: o.full_name ?? "Unknown", user_id: o.user_id })
  );
}

/** Survey ids whose survey_response chain lands on a published review. */
async function resolvePublishedSurveys(
  supabase: Client,
  surveyIds: string[]
): Promise<Set<string>> {
  const out = new Set<string>();
  if (surveyIds.length === 0) return out;

  const { data: responses } = await supabase
    .from("survey_responses")
    .select("id, survey_id")
    .in("survey_id", surveyIds);
  const rows = (responses ?? []) as Array<{ id: string; survey_id: string }>;
  if (rows.length === 0) return out;

  const responseToSurvey = new Map(rows.map((r) => [r.id, r.survey_id]));
  const { data: reviews } = await supabase
    .from("reviews")
    .select("survey_response_id")
    .in(
      "survey_response_id",
      rows.map((r) => r.id)
    )
    .eq("is_published", true);

  for (const r of (reviews ?? []) as Array<{ survey_response_id: string | null }>) {
    const surveyId = r.survey_response_id ? responseToSurvey.get(r.survey_response_id) : null;
    if (surveyId) out.add(surveyId);
  }
  return out;
}

/** Video request ids whose response's linked review is published. */
async function resolvePublishedVideos(
  supabase: Client,
  requestIds: string[]
): Promise<Set<string>> {
  const out = new Set<string>();
  if (requestIds.length === 0) return out;

  const { data: responses } = await supabase
    .from("video_testimonial_responses")
    .select("request_id, review_id")
    .in("request_id", requestIds)
    .not("review_id", "is", null);
  const rows = (responses ?? []) as Array<{ request_id: string; review_id: string | null }>;
  if (rows.length === 0) return out;

  const reviewToRequest = new Map<string, string>();
  for (const r of rows) {
    if (r.review_id) reviewToRequest.set(r.review_id, r.request_id);
  }
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id")
    .in("id", Array.from(reviewToRequest.keys()))
    .eq("is_published", true);

  for (const r of (reviews ?? []) as Array<{ id: string }>) {
    const requestId = reviewToRequest.get(r.id);
    if (requestId) out.add(requestId);
  }
  return out;
}
