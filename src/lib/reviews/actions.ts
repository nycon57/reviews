"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Review, ReviewSource, ActionResult } from "./types";
import { queueQuoteCardKitAfterPublish } from "./asset-kit";

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

// Get authenticated user context with org — all enterprise roles allowed
// Returns scopedUserId when the user can only see their own data (role=user)
async function requireOrgUser(): Promise<{
  userId: string;
  organizationId: string;
  scopedUserId: string | null;
} | null> {
  const context = await getUserContext();

  if (!context || !context.organization_id) {
    return null;
  }

  const isManagerOrAbove = ["admin", "manager"].includes(context.role);

  return {
    userId: context.id,
    organizationId: context.organization_id,
    scopedUserId: isManagerOrAbove ? null : context.id,
  };
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

async function requireReviewPublishingAccess(reviewId: string): Promise<{
  userId: string;
  organizationId: string;
  existingReview: {
    id: string;
    status: string | null;
    user_id: string | null;
  };
} | null> {
  const context = await getUserContext();

  if (!context?.organization_id) {
    return null;
  }

  const supabase = createAdminClient();
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id, status, user_id")
    .eq("id", reviewId)
    .eq("organization_id", context.organization_id)
    .single();

  if (!existingReview) {
    return null;
  }

  const canManageOrg = ["admin", "manager"].includes(context.role);
  const ownsReview = existingReview.user_id === context.id;

  if (!canManageOrg && !ownsReview) {
    return null;
  }

  return {
    userId: context.id,
    organizationId: context.organization_id,
    existingReview,
  };
}

// Get pending reviews for approval queue
export async function getPendingReviews(params?: {
  loanOfficerId?: string;
  minRating?: number;
  maxRating?: number;
  source?: ReviewSource | "all";
  page?: number;
  limit?: number;
}): Promise<ActionResult<{ reviews: Review[]; total: number }>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = createAdminClient();
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("reviews")
    .select(
      `
      id,
      organization_id,
      user_id,
      source,
      rating,
      title,
      text,
      customer_name,
      customer_email,
      status,
      approved_at,
      approved_by,
      rejection_reason,
      is_published,
      published_at,
      review_date,
      created_at,
      users!user_id (
        id,
        full_name,
        email,
        avatar_url
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
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply filters
  if (params?.loanOfficerId) {
    query = query.eq("user_id", params.loanOfficerId);
  }
  if (params?.minRating) {
    query = query.gte("rating", params.minRating);
  }
  if (params?.maxRating) {
    query = query.lte("rating", params.maxRating);
  }
  if (params?.source && params.source !== "all") {
    query = query.eq("source", params.source);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching pending reviews:", error);
    return { success: false, error: "Failed to fetch pending reviews" };
  }

  const reviews: Review[] = (data || []).map((row) => {
    const loanOfficer = row.users as unknown as {
      id: string;
      full_name: string;
      email: string;
      avatar_url: string | null;
    };

    const surveyResponse = row.survey_responses as unknown as {
      id: string;
      overall_rating: number | null;
      nps_score: number | null;
      testimonial_text: string | null;
    } | null;

    return {
      id: row.id,
      organizationId: row.organization_id,
      loanOfficerId: row.user_id,
      source: row.source as ReviewSource,
      rating: row.rating,
      title: row.title,
      text: row.text,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      status: row.status as Review["status"],
      approvedAt: row.approved_at,
      approvedBy: row.approved_by,
      rejectionReason: row.rejection_reason,
      isPublished: row.is_published ?? false,
      publishedAt: row.published_at,
      reviewDate: row.review_date,
      createdAt: row.created_at!,
      loanOfficer: {
        id: loanOfficer.id,
        fullName: loanOfficer.full_name,
        email: loanOfficer.email,
        avatarUrl: loanOfficer.avatar_url,
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
  });

  return {
    success: true,
    data: { reviews, total: count || 0 },
  };
}

// Get all reviews with status filter
export async function getReviews(params?: {
  status?: "pending" | "approved" | "rejected" | "archived" | "all";
  loanOfficerId?: string;
  source?: ReviewSource | "all";
  page?: number;
  limit?: number;
}): Promise<ActionResult<{ reviews: Review[]; total: number }>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = createAdminClient();
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("reviews")
    .select(
      `
      id,
      organization_id,
      user_id,
      source,
      rating,
      title,
      text,
      customer_name,
      customer_email,
      status,
      approved_at,
      approved_by,
      rejection_reason,
      is_published,
      published_at,
      review_date,
      created_at,
      users!user_id (
        id,
        full_name,
        email,
        avatar_url
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
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply status filter
  if (params?.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  // Apply other filters
  if (params?.loanOfficerId) {
    query = query.eq("user_id", params.loanOfficerId);
  }
  if (params?.source && params.source !== "all") {
    query = query.eq("source", params.source);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching reviews:", error);
    return { success: false, error: "Failed to fetch reviews" };
  }

  const reviews: Review[] = (data || []).map((row) => {
    const loanOfficer = row.users as unknown as {
      id: string;
      full_name: string;
      email: string;
      avatar_url: string | null;
    };

    const surveyResponse = row.survey_responses as unknown as {
      id: string;
      overall_rating: number | null;
      nps_score: number | null;
      testimonial_text: string | null;
    } | null;

    return {
      id: row.id,
      organizationId: row.organization_id,
      loanOfficerId: row.user_id,
      source: row.source as ReviewSource,
      rating: row.rating,
      title: row.title,
      text: row.text,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      status: row.status as Review["status"],
      approvedAt: row.approved_at,
      approvedBy: row.approved_by,
      rejectionReason: row.rejection_reason,
      isPublished: row.is_published ?? false,
      publishedAt: row.published_at,
      reviewDate: row.review_date,
      createdAt: row.created_at!,
      loanOfficer: {
        id: loanOfficer.id,
        fullName: loanOfficer.full_name,
        email: loanOfficer.email,
        avatarUrl: loanOfficer.avatar_url,
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
  });

  return {
    success: true,
    data: { reviews, total: count || 0 },
  };
}

// Get a single review by ID
export async function getReviewById(
  reviewId: string
): Promise<ActionResult<Review>> {
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
      rating,
      title,
      text,
      customer_name,
      customer_email,
      status,
      approved_at,
      approved_by,
      rejection_reason,
      is_published,
      published_at,
      review_date,
      created_at,
      users!user_id (
        id,
        full_name,
        email,
        avatar_url
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
    avatar_url: string | null;
  };

  const surveyResponse = data.survey_responses as unknown as {
    id: string;
    overall_rating: number | null;
    nps_score: number | null;
    testimonial_text: string | null;
  } | null;

  const review: Review = {
    id: data.id,
    organizationId: data.organization_id,
    loanOfficerId: data.user_id,
    source: data.source as ReviewSource,
    rating: data.rating,
    title: data.title,
    text: data.text,
    customerName: data.customer_name,
    customerEmail: data.customer_email,
    status: data.status as Review["status"],
    approvedAt: data.approved_at,
    approvedBy: data.approved_by,
    rejectionReason: data.rejection_reason,
    isPublished: data.is_published ?? false,
    publishedAt: data.published_at,
    reviewDate: data.review_date,
    createdAt: data.created_at!,
    loanOfficer: {
      id: loanOfficer.id,
      fullName: loanOfficer.full_name,
      email: loanOfficer.email,
      avatarUrl: loanOfficer.avatar_url,
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

  return { success: true, data: review };
}

// Approve review schema
const approveReviewSchema = z.object({
  reviewId: z.string().uuid(),
  notes: z.string().optional(),
});

// Release a machine-quarantined review. Under the auto-publish model
// 'pending' means quarantined-awaiting-human-release, so approving always
// publishes.
export async function approveReview(
  input: z.infer<typeof approveReviewSchema>
): Promise<ActionResult> {
  const validated = approveReviewSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0]?.message };
  }

  const { reviewId } = validated.data;
  const access = await requireReviewPublishingAccess(reviewId);
  if (!access) {
    return { success: false, error: "Unauthorized to publish this review" };
  }

  if (access.existingReview.status !== "pending") {
    return { success: false, error: "Only quarantined reviews can be released" };
  }

  const supabase = createAdminClient();

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("reviews")
    .update({
      status: "approved",
      approved_at: now,
      approved_by: access.userId,
      rejection_reason: null,
      is_published: true,
      published_at: now,
    })
    .eq("id", reviewId)
    .eq("organization_id", access.organizationId)
    .eq("status", "pending");

  if (error) {
    console.error("Error approving review:", error);
    return { success: false, error: "Failed to approve review" };
  }

  queueQuoteCardKitAfterPublish(access.organizationId, [reviewId], access.userId);

  revalidatePath("/dashboard/reviews");
  return { success: true };
}

// Reject review schema
const rejectReviewSchema = z.object({
  reviewId: z.string().uuid(),
  reason: z.string().min(1, "Rejection reason is required"),
});

// Reject a review
export async function rejectReview(
  input: z.infer<typeof rejectReviewSchema>
): Promise<ActionResult> {
  const validated = rejectReviewSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0]?.message };
  }

  const { reviewId, reason } = validated.data;
  const access = await requireReviewPublishingAccess(reviewId);
  if (!access) {
    return { success: false, error: "Unauthorized to reject this review" };
  }

  if (access.existingReview.status !== "pending") {
    return {
      success: false,
      error: "Live reviews can only be removed through a dispute.",
    };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("reviews")
    .update({
      status: "rejected",
      rejection_reason: reason,
      is_published: false,
      published_at: null,
    })
    .eq("id", reviewId)
    .eq("organization_id", access.organizationId)
    .eq("status", "pending");

  if (error) {
    console.error("Error rejecting review:", error);
    return { success: false, error: "Failed to reject review" };
  }

  revalidatePath("/dashboard/reviews");
  return { success: true };
}

// Update review text schema
const updateReviewTextSchema = z.object({
  reviewId: z.string().uuid(),
  text: z.string().min(1, "Review text is required"),
});

// Update review text before publishing
export async function updateReviewText(
  input: z.infer<typeof updateReviewTextSchema>
): Promise<ActionResult> {
  const validated = updateReviewTextSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0]?.message };
  }
  return { success: false, error: "Review text cannot be edited" };
}

// Bulk release machine-quarantined reviews (always publishes)
export async function bulkApproveReviews(
  reviewIds: string[]
): Promise<ActionResult<{ approved: number; failed: number }>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  if (!reviewIds.length) {
    return { success: false, error: "No reviews selected" };
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Only quarantined (pending) reviews can be released
  const { data, error } = await supabase
    .from("reviews")
    .update({
      status: "approved",
      approved_at: now,
      approved_by: context.userId,
      rejection_reason: null,
      is_published: true,
      published_at: now,
    })
    .in("id", reviewIds)
    .eq("organization_id", context.organizationId)
    .eq("status", "pending")
    .select("id");

  if (error) {
    console.error("Error bulk approving reviews:", error);
    return { success: false, error: "Failed to approve reviews" };
  }

  const approved = data?.length || 0;
  const failed = reviewIds.length - approved;

  queueQuoteCardKitAfterPublish(
    context.organizationId,
    (data || []).map((r) => String(r.id)),
    context.userId
  );

  revalidatePath("/dashboard/reviews");
  return { success: true, data: { approved, failed } };
}

// Bulk reject reviews
export async function bulkRejectReviews(
  reviewIds: string[],
  reason: string
): Promise<ActionResult<{ rejected: number; failed: number }>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  if (!reviewIds.length) {
    return { success: false, error: "No reviews selected" };
  }

  if (!reason) {
    return { success: false, error: "Rejection reason is required" };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reviews")
    .update({
      status: "rejected",
      rejection_reason: reason,
      is_published: false,
      published_at: null,
    })
    .in("id", reviewIds)
    .eq("organization_id", context.organizationId)
    .eq("status", "pending")
    .select("id");

  if (error) {
    console.error("Error bulk rejecting reviews:", error);
    return { success: false, error: "Failed to reject reviews" };
  }

  const rejected = data?.length || 0;
  const failed = reviewIds.length - rejected;

  if (rejected === 0) {
    return {
      success: false,
      error: "Live reviews can only be removed through a dispute.",
    };
  }

  revalidatePath("/dashboard/reviews");
  return { success: true, data: { rejected, failed } };
}

// Get review statistics for dashboard
export async function getReviewStats(): Promise<
  ActionResult<{
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  }>
> {
  const context = await requireOrgUser();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();

  let query = supabase
    .from("reviews")
    .select("status")
    .eq("organization_id", context.organizationId);

  if (context.scopedUserId) {
    query = query.eq("user_id", context.scopedUserId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching review stats:", error);
    return { success: false, error: "Failed to fetch review statistics" };
  }

  const stats = {
    pending: 0,
    approved: 0,
    rejected: 0,
    total: data?.length || 0,
  };

  for (const review of data || []) {
    if (review.status === "pending") stats.pending++;
    else if (review.status === "approved") stats.approved++;
    else if (review.status === "rejected") stats.rejected++;
  }

  return { success: true, data: stats };
}

// Get users for filter dropdown
export async function getUsersForFilter(): Promise<
  ActionResult<{ id: string; fullName: string }[]>
> {
  const context = await requireOrgUser();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  // Regular users don't need the team filter — return empty list
  if (context.scopedUserId) {
    return { success: true, data: [] };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name")
    .eq("organization_id", context.organizationId)
    .eq("is_active", true)
    .order("full_name");

  if (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: "Failed to fetch users" };
  }

  return {
    success: true,
    data: (data || []).map((user) => ({
      id: user.id,
      fullName: user.full_name || "Unknown",
    })),
  };
}

/** @deprecated Use getUsersForFilter instead */
export const getLoanOfficersForFilter = getUsersForFilter;

export async function getReviewSummary(opts: {
  startDate?: string;
  endDate?: string;
  userId?: string;
}): Promise<
  ActionResult<{
    totalReviews: number;
    averageRating: number;
    responseRate: number;
    npsScore: number;
  }>
> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  let query = supabase
    .from("reviews")
    .select("rating, response_text", { count: "exact" })
    .eq("organization_id", context.organizationId)
    .eq("status", "approved");

  if (opts.startDate) query = query.gte("created_at", opts.startDate);
  if (opts.endDate) query = query.lte("created_at", opts.endDate);
  if (opts.userId) query = query.eq("user_id", opts.userId);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching review summary:", error);
    return { success: false, error: "Failed to fetch review summary" };
  }

  const reviews = data || [];
  const totalReviews = count ?? reviews.length;

  const ratingsOnly = reviews.filter((r) => r.rating != null);
  const averageRating =
    ratingsOnly.length > 0
      ? Math.round(
          (ratingsOnly.reduce((sum, r) => sum + (r.rating as number), 0) /
            ratingsOnly.length) *
            10
        ) / 10
      : 0;

  const withResponse = reviews.filter(
    (r) => r.response_text && r.response_text.trim().length > 0
  ).length;
  const responseRate =
    totalReviews > 0 ? Math.round((withResponse / totalReviews) * 1000) / 10 : 0;

  // NPS: 5-star mapping — 5 = promoter, 4 = passive, 1-3 = detractor
  let promoters = 0;
  let detractors = 0;
  for (const r of ratingsOnly) {
    const rating = r.rating as number;
    if (rating >= 5) promoters++;
    else if (rating <= 3) detractors++;
  }
  const npsScore =
    ratingsOnly.length > 0
      ? Math.round(
          ((promoters - detractors) / ratingsOnly.length) * 100
        )
      : 0;

  return {
    success: true,
    data: { totalReviews, averageRating, responseRate, npsScore },
  };
}
