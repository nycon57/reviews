"use server";

import { getSurveysForDistribution } from "@/lib/distribution/actions";
import {
  getVideoTestimonialRequests,
  getVideoTestimonialRequestStats,
} from "@/lib/video-testimonials/actions";

// ============================================================================
// Types
// ============================================================================

export type RequestType = "survey" | "video";

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
          openedAt: null,
          reminderCount: s.reminderCount,
          source: s.source,
          createdAt: s.createdAt,
          requestUrl: null,
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

  // Paginate
  const start = (page - 1) * pageSize;
  const paged = merged.slice(start, start + pageSize);

  return { requests: paged, total };
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
