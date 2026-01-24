"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import type { Database } from "@/types/database.types";

// ============================================================================
// Zod Schemas for Input Validation
// ============================================================================

const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  loanOfficerId: z.string().uuid().optional(),
}).optional();

const trendsParamsSchema = z.object({
  period: z.enum(["daily", "weekly", "monthly"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  loanOfficerId: z.string().uuid().optional(),
}).optional();

const loStatsParamsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().int().min(1).max(500).optional(),
}).optional();

// ============================================================================
// Types
// ============================================================================

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface VideoTestimonialFunnelMetrics {
  // Request funnel stages
  totalRequests: number;
  sent: number;
  opened: number;
  completed: number; // submitted status

  // Response funnel stages (post-submission)
  pending: number;
  approved: number;
  rejected: number;
  published: number;

  // Conversion rates (as percentages)
  sentToOpenedRate: number;
  openedToCompletedRate: number;
  completedToApprovedRate: number;
  approvedToPublishedRate: number;
  overallConversionRate: number; // sent to published

  // Additional metrics
  averageTimeToOpen: number | null; // in hours
  averageTimeToComplete: number | null; // in hours
  averageApprovalTime: number | null; // in hours
  expiredCount: number;
  cancelledCount: number;
}

export interface VideoTestimonialTrendDataPoint {
  date: string;
  sent: number;
  opened: number;
  completed: number;
  approved: number;
  published: number;
  conversionRate: number;
}

export interface LoanOfficerVideoStats {
  loanOfficerId: string;
  loanOfficerName: string;
  sent: number;
  opened: number;
  completed: number;
  approved: number;
  published: number;
  conversionRate: number;
}

type VideoTestimonialRequestStatus =
  Database["public"]["Enums"]["video_testimonial_request_status"];
type _VideoTestimonialApprovalStatus =
  Database["public"]["Enums"]["video_testimonial_approval_status"];

// ============================================================================
// Helper Functions
// ============================================================================

function calculateRate(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100 * 10) / 10; // Round to 1 decimal
}

function calculateHoursDifference(
  startDate: string | null,
  endDate: string | null
): number | null {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const hours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  // Filter out negative values (bad data)
  return hours >= 0 ? hours : null;
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Get video testimonial funnel metrics for the organization
 * Calculates aggregate metrics for all funnel stages
 */
export async function getVideoTestimonialFunnelMetrics(params?: {
  startDate?: string;
  endDate?: string;
  loanOfficerId?: string;
}): Promise<ActionResult<VideoTestimonialFunnelMetrics>> {
  try {
    // Validate input with Zod
    const validatedParams = dateRangeSchema.parse(params);

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = createAdminClient();

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Role-based filtering - query loan officer ID once
    let loanOfficerIdFilter: string | undefined = validatedParams?.loanOfficerId;
    if (userData.role === "user") {
      const { data: loData } = await supabase
        .from("loan_officers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (loData) {
        loanOfficerIdFilter = loData.id;
      } else {
        return {
          success: true,
          data: createEmptyMetrics(),
        };
      }
    }

    // Build base query for requests
    let requestsQuery = supabase
      .from("video_testimonial_requests")
      .select("id, status, sent_at, opened_at, submitted_at, created_at")
      .eq("organization_id", userData.organization_id);

    // Apply date filters (use created_at for consistency)
    if (validatedParams?.startDate) {
      requestsQuery = requestsQuery.gte("created_at", validatedParams.startDate);
    }
    if (validatedParams?.endDate) {
      requestsQuery = requestsQuery.lte("created_at", validatedParams.endDate);
    }
    if (loanOfficerIdFilter) {
      requestsQuery = requestsQuery.eq("loan_officer_id", loanOfficerIdFilter);
    }

    const { data: requests, error: requestsError } = await requestsQuery;

    if (requestsError) {
      console.error("Error fetching requests:", requestsError);
      return { success: false, error: "Failed to fetch request metrics" };
    }

    // Build query for responses (filter by created_at for consistency with requests)
    let responsesQuery = supabase
      .from("video_testimonial_responses")
      .select("id, approval_status, submitted_at, approved_at, published_at, request_id")
      .eq("organization_id", userData.organization_id);

    if (validatedParams?.startDate) {
      responsesQuery = responsesQuery.gte("created_at", validatedParams.startDate);
    }
    if (validatedParams?.endDate) {
      responsesQuery = responsesQuery.lte("created_at", validatedParams.endDate);
    }
    if (loanOfficerIdFilter) {
      responsesQuery = responsesQuery.eq("loan_officer_id", loanOfficerIdFilter);
    }

    const { data: responses, error: responsesError } = await responsesQuery;

    if (responsesError) {
      console.error("Error fetching responses:", responsesError);
      return { success: false, error: "Failed to fetch response metrics" };
    }

    // Calculate request funnel metrics
    const totalRequests = requests?.length || 0;
    const sentStatuses: VideoTestimonialRequestStatus[] = ["sent", "opened", "recording", "submitted"];
    const sent = requests?.filter(r => sentStatuses.includes(r.status as VideoTestimonialRequestStatus) || r.sent_at).length || 0;
    const opened = requests?.filter(r => r.opened_at || ["opened", "recording", "submitted"].includes(r.status)).length || 0;
    const completed = requests?.filter(r => r.status === "submitted").length || 0;
    const expired = requests?.filter(r => r.status === "expired").length || 0;
    const cancelled = requests?.filter(r => r.status === "cancelled").length || 0;

    // Calculate response metrics
    const pendingResponses = responses?.filter(r => r.approval_status === "pending" || r.approval_status === "changes_requested").length || 0;
    const approved = responses?.filter(r => r.approval_status === "approved" || r.approval_status === "published").length || 0;
    const rejected = responses?.filter(r => r.approval_status === "rejected").length || 0;
    const published = responses?.filter(r => r.approval_status === "published").length || 0;

    // Calculate conversion rates
    const sentToOpenedRate = calculateRate(opened, sent);
    const openedToCompletedRate = calculateRate(completed, opened);
    const completedToApprovedRate = calculateRate(approved, completed);
    const approvedToPublishedRate = calculateRate(published, approved);
    const overallConversionRate = calculateRate(published, sent);

    // Calculate average times
    const timesToOpen = requests
      ?.filter(r => r.sent_at && r.opened_at)
      .map(r => calculateHoursDifference(r.sent_at, r.opened_at))
      .filter((t): t is number => t !== null) || [];

    const timesToComplete = requests
      ?.filter(r => r.opened_at && r.submitted_at)
      .map(r => calculateHoursDifference(r.opened_at, r.submitted_at))
      .filter((t): t is number => t !== null) || [];

    const timesToApprove = responses
      ?.filter(r => r.submitted_at && r.approved_at)
      .map(r => calculateHoursDifference(r.submitted_at, r.approved_at))
      .filter((t): t is number => t !== null) || [];

    const averageTimeToOpen = timesToOpen.length > 0
      ? Math.round(timesToOpen.reduce((a, b) => a + b, 0) / timesToOpen.length)
      : null;

    const averageTimeToComplete = timesToComplete.length > 0
      ? Math.round(timesToComplete.reduce((a, b) => a + b, 0) / timesToComplete.length)
      : null;

    const averageApprovalTime = timesToApprove.length > 0
      ? Math.round(timesToApprove.reduce((a, b) => a + b, 0) / timesToApprove.length)
      : null;

    return {
      success: true,
      data: {
        totalRequests,
        sent,
        opened,
        completed,
        pending: pendingResponses,
        approved,
        rejected,
        published,
        sentToOpenedRate,
        openedToCompletedRate,
        completedToApprovedRate,
        approvedToPublishedRate,
        overallConversionRate,
        averageTimeToOpen,
        averageTimeToComplete,
        averageApprovalTime,
        expiredCount: expired,
        cancelledCount: cancelled,
      },
    };
  } catch (error) {
    console.error("Error getting funnel metrics:", error);
    return { success: false, error: "Failed to get funnel metrics" };
  }
}

/**
 * Get video testimonial trend data over time
 * Returns daily/weekly/monthly aggregates based on period
 */
export async function getVideoTestimonialTrends(params?: {
  period?: "daily" | "weekly" | "monthly";
  startDate?: string;
  endDate?: string;
  loanOfficerId?: string;
}): Promise<ActionResult<VideoTestimonialTrendDataPoint[]>> {
  try {
    // Validate input with Zod
    const validatedParams = trendsParamsSchema.parse(params);

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = createAdminClient();

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Default to last 30 days if no dates provided
    const endDate = validatedParams?.endDate || new Date().toISOString();
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() - 30);
    const startDate = validatedParams?.startDate || defaultStart.toISOString();

    // Role-based filtering - query loan officer ID once
    let loanOfficerIdFilter: string | undefined = validatedParams?.loanOfficerId;
    if (userData.role === "user") {
      const { data: loData } = await supabase
        .from("loan_officers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (loData) {
        loanOfficerIdFilter = loData.id;
      } else {
        return { success: true, data: [] };
      }
    }

    // Fetch requests
    let requestsQuery = supabase
      .from("video_testimonial_requests")
      .select("status, sent_at, opened_at, submitted_at, created_at")
      .eq("organization_id", userData.organization_id)
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (loanOfficerIdFilter) {
      requestsQuery = requestsQuery.eq("loan_officer_id", loanOfficerIdFilter);
    }

    const { data: requests, error: requestsError } = await requestsQuery;

    if (requestsError) {
      console.error("Error fetching trend requests:", requestsError);
      return { success: false, error: "Failed to fetch trend data" };
    }

    // Fetch responses (use created_at for consistency with requests)
    let responsesQuery = supabase
      .from("video_testimonial_responses")
      .select("approval_status, submitted_at, approved_at, published_at")
      .eq("organization_id", userData.organization_id)
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (loanOfficerIdFilter) {
      responsesQuery = responsesQuery.eq("loan_officer_id", loanOfficerIdFilter);
    }

    const { data: responses, error: responsesError } = await responsesQuery;

    if (responsesError) {
      console.error("Error fetching trend responses:", responsesError);
      return { success: false, error: "Failed to fetch trend data" };
    }

    // Group by date based on period
    const period = params?.period || "daily";
    const groupedData = new Map<string, {
      sent: number;
      opened: number;
      completed: number;
      approved: number;
      published: number;
    }>();

    // Helper to get date key based on period
    const getDateKey = (dateStr: string): string => {
      const date = new Date(dateStr);
      if (period === "daily") {
        return date.toISOString().split("T")[0];
      } else if (period === "weekly") {
        // Get start of week (Sunday)
        const day = date.getDay();
        const diff = date.getDate() - day;
        const weekStart = new Date(date);
        weekStart.setDate(diff);
        return weekStart.toISOString().split("T")[0];
      } else {
        // Monthly
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
      }
    };

    // Initialize date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    while (current <= end) {
      const key = getDateKey(current.toISOString());
      if (!groupedData.has(key)) {
        groupedData.set(key, { sent: 0, opened: 0, completed: 0, approved: 0, published: 0 });
      }
      // Advance based on period
      if (period === "daily") {
        current.setDate(current.getDate() + 1);
      } else if (period === "weekly") {
        current.setDate(current.getDate() + 7);
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }

    // Process requests
    for (const req of requests || []) {
      if (req.sent_at) {
        const key = getDateKey(req.sent_at);
        const entry = groupedData.get(key);
        if (entry) entry.sent++;
      }
      if (req.opened_at) {
        const key = getDateKey(req.opened_at);
        const entry = groupedData.get(key);
        if (entry) entry.opened++;
      }
      if (req.status === "submitted" && req.submitted_at) {
        const key = getDateKey(req.submitted_at);
        const entry = groupedData.get(key);
        if (entry) entry.completed++;
      }
    }

    // Process responses
    for (const res of responses || []) {
      if ((res.approval_status === "approved" || res.approval_status === "published") && res.approved_at) {
        const key = getDateKey(res.approved_at);
        const entry = groupedData.get(key);
        if (entry) entry.approved++;
      }
      if (res.approval_status === "published" && res.published_at) {
        const key = getDateKey(res.published_at);
        const entry = groupedData.get(key);
        if (entry) entry.published++;
      }
    }

    // Convert to array and calculate conversion rates
    const trendData: VideoTestimonialTrendDataPoint[] = Array.from(groupedData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        ...data,
        conversionRate: calculateRate(data.completed, data.sent),
      }));

    return { success: true, data: trendData };
  } catch (error) {
    console.error("Error getting trend data:", error);
    return { success: false, error: "Failed to get trend data" };
  }
}

/**
 * Get video testimonial stats per loan officer
 * Useful for leaderboards and team performance views
 */
export async function getVideoTestimonialStatsByLoanOfficer(params?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<ActionResult<LoanOfficerVideoStats[]>> {
  try {
    // Validate input with Zod
    const validatedParams = loStatsParamsSchema.parse(params);

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = createAdminClient();

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Only managers and admins can see team stats
    if (!["admin", "manager"].includes(userData.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Get loan officers in the organization
    const { data: loanOfficers, error: loError } = await supabase
      .from("loan_officers")
      .select("id, full_name")
      .eq("organization_id", userData.organization_id)
      .eq("is_active", true);

    if (loError) {
      console.error("Error fetching loan officers:", loError);
      return { success: false, error: "Failed to fetch loan officers" };
    }

    // Fetch ALL requests in bulk (fixes N+1 query issue)
    let requestsQuery = supabase
      .from("video_testimonial_requests")
      .select("loan_officer_id, status, sent_at, opened_at, submitted_at")
      .eq("organization_id", userData.organization_id);

    if (validatedParams?.startDate) {
      requestsQuery = requestsQuery.gte("created_at", validatedParams.startDate);
    }
    if (validatedParams?.endDate) {
      requestsQuery = requestsQuery.lte("created_at", validatedParams.endDate);
    }

    const { data: allRequests, error: requestsError } = await requestsQuery;

    if (requestsError) {
      console.error("Error fetching requests:", requestsError);
      return { success: false, error: "Failed to fetch request stats" };
    }

    // Fetch ALL responses in bulk (fixes N+1 query issue)
    let responsesQuery = supabase
      .from("video_testimonial_responses")
      .select("loan_officer_id, approval_status")
      .eq("organization_id", userData.organization_id);

    if (validatedParams?.startDate) {
      responsesQuery = responsesQuery.gte("created_at", validatedParams.startDate);
    }
    if (validatedParams?.endDate) {
      responsesQuery = responsesQuery.lte("created_at", validatedParams.endDate);
    }

    const { data: allResponses, error: responsesError } = await responsesQuery;

    if (responsesError) {
      console.error("Error fetching responses:", responsesError);
      return { success: false, error: "Failed to fetch response stats" };
    }

    // Group requests by loan officer
    const requestsByLO = new Map<string, typeof allRequests>();
    for (const req of allRequests || []) {
      if (!req.loan_officer_id) continue;
      const existing = requestsByLO.get(req.loan_officer_id) || [];
      existing.push(req);
      requestsByLO.set(req.loan_officer_id, existing);
    }

    // Group responses by loan officer
    const responsesByLO = new Map<string, typeof allResponses>();
    for (const res of allResponses || []) {
      if (!res.loan_officer_id) continue;
      const existing = responsesByLO.get(res.loan_officer_id) || [];
      existing.push(res);
      responsesByLO.set(res.loan_officer_id, existing);
    }

    // Calculate stats for each loan officer
    const sentStatuses: VideoTestimonialRequestStatus[] = ["sent", "opened", "recording", "submitted"];
    const stats: LoanOfficerVideoStats[] = [];

    for (const lo of loanOfficers || []) {
      const requests = requestsByLO.get(lo.id) || [];
      const responses = responsesByLO.get(lo.id) || [];

      const sent = requests.filter(r => sentStatuses.includes(r.status as VideoTestimonialRequestStatus) || r.sent_at).length;
      const opened = requests.filter(r => r.opened_at || ["opened", "recording", "submitted"].includes(r.status)).length;
      const completed = requests.filter(r => r.status === "submitted").length;
      const approved = responses.filter(r => r.approval_status === "approved" || r.approval_status === "published").length;
      const published = responses.filter(r => r.approval_status === "published").length;

      stats.push({
        loanOfficerId: lo.id,
        loanOfficerName: lo.full_name,
        sent,
        opened,
        completed,
        approved,
        published,
        conversionRate: calculateRate(completed, sent),
      });
    }

    // Sort by completed count (most productive first)
    stats.sort((a, b) => b.completed - a.completed);

    // Apply limit if specified
    const limit = validatedParams?.limit || 50;
    const limitedStats = stats.slice(0, limit);

    return { success: true, data: limitedStats };
  } catch (error) {
    console.error("Error getting LO stats:", error);
    return { success: false, error: "Failed to get loan officer stats" };
  }
}

// Helper to create empty metrics object
function createEmptyMetrics(): VideoTestimonialFunnelMetrics {
  return {
    totalRequests: 0,
    sent: 0,
    opened: 0,
    completed: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    published: 0,
    sentToOpenedRate: 0,
    openedToCompletedRate: 0,
    completedToApprovedRate: 0,
    approvedToPublishedRate: 0,
    overallConversionRate: 0,
    averageTimeToOpen: null,
    averageTimeToComplete: null,
    averageApprovalTime: null,
    expiredCount: 0,
    cancelledCount: 0,
  };
}
