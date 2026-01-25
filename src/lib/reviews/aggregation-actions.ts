"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import type {
  AggregatedReview,
  AggregatedReviewFilters,
  ReviewAggregationStats,
  ReviewExportData,
  ActionResult,
} from "./types";

// Get user's role and organization ID
async function getUserContext() {
  const user = await unifiedGetUser();

  if (!user) {
    return null;
  }

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  return userData;
}

// Check if user has manager/admin role
async function requireManagerRole(): Promise<{
  userId: string;
  organizationId: string;
} | null> {
  const context = await getUserContext();

  if (!context) {
    return null;
  }

  if (!["admin", "manager"].includes(context.role)) {
    return null;
  }

  return {
    userId: context.id,
    organizationId: context.organization_id!,
  };
}

// Map database row to AggregatedReview
function mapRowToAggregatedReview(
  row: Record<string, unknown>,
  loanOfficer: { id: string; full_name: string; email: string; photo_url: string | null },
  surveyResponse: { id: string; overall_rating: number | null; nps_score: number | null; testimonial_text: string | null } | null
): AggregatedReview {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    loanOfficerId: row.user_id as string,
    source: row.source as string,
    rating: row.rating as number,
    title: row.title as string | null,
    text: row.text as string | null,
    customerName: row.customer_name as string | null,
    customerEmail: row.customer_email as string | null,
    customerLocation: row.customer_location as string | null,
    status: row.status as AggregatedReview["status"],
    approvedAt: row.approved_at as string | null,
    approvedBy: row.approved_by as string | null,
    rejectionReason: row.rejection_reason as string | null,
    isPublished: (row.is_published as boolean) ?? false,
    publishedAt: row.published_at as string | null,
    reviewDate: row.review_date as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    sourceReviewId: row.source_review_id as string | null,
    sourceUrl: row.source_url as string | null,
    sentimentScore: row.sentiment_score as number | null,
    sentimentLabel: row.sentiment_label as string | null,
    themes: row.themes as string[] | null,
    keyPhrases: row.key_phrases as string[] | null,
    responseText: row.response_text as string | null,
    responseAt: row.response_at as string | null,
    responseBy: row.response_by as string | null,
    responseSyncedAt: row.response_synced_at as string | null,
    featured: (row.featured as boolean) ?? false,
    syncedAt: row.synced_at as string | null,
    loanOfficer: {
      id: loanOfficer.id,
      fullName: loanOfficer.full_name,
      email: loanOfficer.email,
      photoUrl: loanOfficer.photo_url,
    },
    surveyResponse: surveyResponse
      ? {
          id: surveyResponse.id,
          overallRating: surveyResponse.overall_rating,
          npsScore: surveyResponse.nps_score,
          testimonialText: surveyResponse.testimonial_text,
        }
      : null,
  };
}

// Get aggregated reviews with comprehensive filtering and search
export async function getAggregatedReviews(
  filters?: AggregatedReviewFilters
): Promise<ActionResult<{ reviews: AggregatedReview[]; total: number }>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = createAdminClient();
  const page = filters?.page || 1;
  const limit = filters?.limit || 50;
  const offset = (page - 1) * limit;
  const sortBy = filters?.sortBy || "reviewDate";
  const sortOrder = filters?.sortOrder || "desc";

  // Map sortBy to actual column names
  const sortColumnMap: Record<string, string> = {
    reviewDate: "review_date",
    rating: "rating",
    createdAt: "created_at",
    updatedAt: "updated_at",
  };
  const sortColumn = sortColumnMap[sortBy] || "review_date";

  let query = supabase
    .from("reviews")
    .select(
      `
      id,
      organization_id,
      user_id,
      source,
      source_review_id,
      source_url,
      rating,
      title,
      text,
      customer_name,
      customer_email,
      customer_location,
      sentiment_score,
      sentiment_label,
      themes,
      key_phrases,
      status,
      approved_at,
      approved_by,
      rejection_reason,
      response_text,
      response_at,
      response_by,
      response_synced_at,
      is_published,
      published_at,
      featured,
      review_date,
      synced_at,
      created_at,
      updated_at,
      users!user_id (
        id,
        full_name,
        email,
        photo_url
      ),
      survey_responses (
        id,
        overall_rating,
        nps_score,
        testimonial_text
      )
    `,
      { count: "exact" }
    )
    .eq("organization_id", context.organizationId)
    .order(sortColumn, { ascending: sortOrder === "asc" })
    .range(offset, offset + limit - 1);

  // Apply status filter
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  // Apply source filter
  if (filters?.source && filters.source !== "all") {
    query = query.eq("source", filters.source);
  }

  // Apply user filter
  if (filters?.loanOfficerId) {
    query = query.eq("user_id", filters.loanOfficerId);
  }

  // Apply rating range filters
  if (filters?.minRating) {
    query = query.gte("rating", filters.minRating);
  }
  if (filters?.maxRating) {
    query = query.lte("rating", filters.maxRating);
  }

  // Apply date range filters
  if (filters?.startDate) {
    query = query.gte("review_date", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("review_date", filters.endDate);
  }

  // Apply response filter
  if (filters?.hasResponse === true) {
    query = query.not("response_text", "is", null);
  } else if (filters?.hasResponse === false) {
    query = query.is("response_text", null);
  }

  // Apply featured filter
  if (filters?.featured !== undefined) {
    query = query.eq("featured", filters.featured);
  }

  // Apply search filter (searches in text, customer_name, title)
  if (filters?.search && filters.search.trim()) {
    const searchTerm = `%${filters.search.trim()}%`;
    query = query.or(
      `text.ilike.${searchTerm},customer_name.ilike.${searchTerm},title.ilike.${searchTerm}`
    );
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching aggregated reviews:", error);
    return { success: false, error: error.message || "Failed to fetch reviews" };
  }

  const reviews: AggregatedReview[] = (data || []).map((row) => {
    const loanOfficer = row.users as unknown as {
      id: string;
      full_name: string;
      email: string;
      photo_url: string | null;
    };

    const surveyResponse = row.survey_responses as unknown as {
      id: string;
      overall_rating: number | null;
      nps_score: number | null;
      testimonial_text: string | null;
    } | null;

    return mapRowToAggregatedReview(row, loanOfficer, surveyResponse);
  });

  return {
    success: true,
    data: { reviews, total: count || 0 },
  };
}

// Get a single review by ID with full details
export async function getAggregatedReviewById(
  reviewId: string
): Promise<ActionResult<AggregatedReview>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      id,
      organization_id,
      user_id,
      source,
      source_review_id,
      source_url,
      rating,
      title,
      text,
      customer_name,
      customer_email,
      customer_location,
      sentiment_score,
      sentiment_label,
      themes,
      key_phrases,
      status,
      approved_at,
      approved_by,
      rejection_reason,
      response_text,
      response_at,
      response_by,
      response_synced_at,
      is_published,
      published_at,
      featured,
      review_date,
      synced_at,
      created_at,
      updated_at,
      users!user_id (
        id,
        full_name,
        email,
        photo_url
      ),
      survey_responses (
        id,
        overall_rating,
        nps_score,
        testimonial_text
      )
    `
    )
    .eq("id", reviewId)
    .eq("organization_id", context.organizationId)
    .single();

  if (error || !data) {
    return { success: false, error: "Review not found" };
  }

  const loanOfficer = data.users as unknown as {
    id: string;
    full_name: string;
    email: string;
    photo_url: string | null;
  };

  const surveyResponse = data.survey_responses as unknown as {
    id: string;
    overall_rating: number | null;
    nps_score: number | null;
    testimonial_text: string | null;
  } | null;

  return {
    success: true,
    data: mapRowToAggregatedReview(data, loanOfficer, surveyResponse),
  };
}

// Get aggregation statistics
export async function getReviewAggregationStats(): Promise<
  ActionResult<ReviewAggregationStats>
> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("source, status, rating, response_text, featured")
    .eq("organization_id", context.organizationId);

  if (error) {
    console.error("Error fetching review stats:", error);
    return { success: false, error: "Failed to fetch statistics" };
  }

  const stats: ReviewAggregationStats = {
    total: data?.length || 0,
    bySource: {},
    byStatus: {},
    byRating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    averageRating: 0,
    withResponse: 0,
    featuredCount: 0,
  };

  let totalRating = 0;

  for (const review of data || []) {
    // Count by source
    if (review.source) {
      stats.bySource[review.source] = (stats.bySource[review.source] || 0) + 1;
    }

    // Count by status
    if (review.status) {
      stats.byStatus[review.status] = (stats.byStatus[review.status] || 0) + 1;
    }

    // Count by rating
    if (review.rating >= 1 && review.rating <= 5) {
      stats.byRating[review.rating]++;
      totalRating += review.rating;
    }

    // Count with response
    if (review.response_text) {
      stats.withResponse++;
    }

    // Count featured
    if (review.featured) {
      stats.featuredCount++;
    }
  }

  if (stats.total > 0) {
    stats.averageRating = Math.round((totalRating / stats.total) * 10) / 10;
  }

  return { success: true, data: stats };
}

// Toggle featured status
export async function toggleReviewFeatured(
  reviewId: string,
  featured: boolean
): Promise<ActionResult> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("reviews")
    .update({ featured })
    .eq("id", reviewId)
    .eq("organization_id", context.organizationId);

  if (error) {
    console.error("Error toggling featured status:", error);
    return { success: false, error: "Failed to update featured status" };
  }

  revalidatePath("/dashboard/all-reviews");
  return { success: true };
}

// Archive a review
export async function archiveReview(reviewId: string): Promise<ActionResult> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("reviews")
    .update({ status: "archived" })
    .eq("id", reviewId)
    .eq("organization_id", context.organizationId);

  if (error) {
    console.error("Error archiving review:", error);
    return { success: false, error: "Failed to archive review" };
  }

  revalidatePath("/dashboard/all-reviews");
  revalidatePath("/dashboard/reviews");
  return { success: true };
}

// Bulk archive reviews
export async function bulkArchiveReviews(
  reviewIds: string[]
): Promise<ActionResult<{ archived: number }>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  if (!reviewIds.length) {
    return { success: false, error: "No reviews selected" };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reviews")
    .update({ status: "archived" })
    .in("id", reviewIds)
    .eq("organization_id", context.organizationId)
    .select("id");

  if (error) {
    console.error("Error bulk archiving reviews:", error);
    return { success: false, error: "Failed to archive reviews" };
  }

  revalidatePath("/dashboard/all-reviews");
  revalidatePath("/dashboard/reviews");
  return { success: true, data: { archived: data?.length || 0 } };
}

// Bulk toggle featured status
export async function bulkToggleFeatured(
  reviewIds: string[],
  featured: boolean
): Promise<ActionResult<{ updated: number }>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  if (!reviewIds.length) {
    return { success: false, error: "No reviews selected" };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reviews")
    .update({ featured })
    .in("id", reviewIds)
    .eq("organization_id", context.organizationId)
    .select("id");

  if (error) {
    console.error("Error bulk updating featured status:", error);
    return { success: false, error: "Failed to update reviews" };
  }

  revalidatePath("/dashboard/all-reviews");
  return { success: true, data: { updated: data?.length || 0 } };
}

// Export reviews to CSV format
export async function exportReviews(
  filters?: AggregatedReviewFilters
): Promise<ActionResult<ReviewExportData[]>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = createAdminClient();

  // Build query without pagination for export
  let query = supabase
    .from("reviews")
    .select(
      `
      id,
      source,
      rating,
      customer_name,
      text,
      status,
      review_date,
      response_text,
      sentiment_label,
      users!user_id (
        full_name
      )
    `
    )
    .eq("organization_id", context.organizationId)
    .order("review_date", { ascending: false });

  // Apply same filters as getAggregatedReviews
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.source && filters.source !== "all") {
    query = query.eq("source", filters.source);
  }
  if (filters?.loanOfficerId) {
    query = query.eq("user_id", filters.loanOfficerId);
  }
  if (filters?.minRating) {
    query = query.gte("rating", filters.minRating);
  }
  if (filters?.maxRating) {
    query = query.lte("rating", filters.maxRating);
  }
  if (filters?.startDate) {
    query = query.gte("review_date", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("review_date", filters.endDate);
  }
  if (filters?.search && filters.search.trim()) {
    const searchTerm = `%${filters.search.trim()}%`;
    query = query.or(
      `text.ilike.${searchTerm},customer_name.ilike.${searchTerm},title.ilike.${searchTerm}`
    );
  }

  // Limit export to 1000 records for performance
  query = query.limit(1000);

  const { data, error } = await query;

  if (error) {
    console.error("Error exporting reviews:", error);
    return { success: false, error: "Failed to export reviews" };
  }

  const exportData: ReviewExportData[] = (data || []).map((row) => {
    const user = row.users as unknown as { full_name: string };
    return {
      id: row.id,
      source: row.source,
      rating: row.rating,
      customerName: row.customer_name,
      text: row.text,
      loanOfficerName: user.full_name,
      status: row.status || "pending",
      reviewDate: row.review_date,
      responseText: row.response_text,
      sentimentLabel: row.sentiment_label,
    };
  });

  return { success: true, data: exportData };
}
