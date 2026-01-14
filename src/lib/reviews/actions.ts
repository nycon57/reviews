"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Json } from "@/types/database.types";
import type { Review, ActionResult, AutoApprovalRule } from "./types";
import { DEFAULT_AUTO_APPROVAL_RULES } from "./types";

// Get user's role and organization ID
async function getUserContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

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

// Get pending reviews for approval queue
export async function getPendingReviews(params?: {
  loanOfficerId?: string;
  minRating?: number;
  maxRating?: number;
  source?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<{ reviews: Review[]; total: number }>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = await createClient();
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("reviews")
    .select(
      `
      id,
      organization_id,
      loan_officer_id,
      source,
      rating,
      title,
      text,
      customer_name,
      status,
      approved_at,
      approved_by,
      rejection_reason,
      is_published,
      published_at,
      review_date,
      created_at,
      loan_officers!inner (
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
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply filters
  if (params?.loanOfficerId) {
    query = query.eq("loan_officer_id", params.loanOfficerId);
  }
  if (params?.minRating) {
    query = query.gte("rating", params.minRating);
  }
  if (params?.maxRating) {
    query = query.lte("rating", params.maxRating);
  }
  if (params?.source) {
    query = query.eq("source", params.source);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching pending reviews:", error);
    return { success: false, error: "Failed to fetch pending reviews" };
  }

  const reviews: Review[] = (data || []).map((row) => {
    const loanOfficer = row.loan_officers as unknown as {
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

    return {
      id: row.id,
      organizationId: row.organization_id,
      loanOfficerId: row.loan_officer_id,
      source: row.source,
      rating: row.rating,
      title: row.title,
      text: row.text,
      customerName: row.customer_name,
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
  source?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<{ reviews: Review[]; total: number }>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = await createClient();
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("reviews")
    .select(
      `
      id,
      organization_id,
      loan_officer_id,
      source,
      rating,
      title,
      text,
      customer_name,
      status,
      approved_at,
      approved_by,
      rejection_reason,
      is_published,
      published_at,
      review_date,
      created_at,
      loan_officers!inner (
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
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply status filter
  if (params?.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  // Apply other filters
  if (params?.loanOfficerId) {
    query = query.eq("loan_officer_id", params.loanOfficerId);
  }
  if (params?.source) {
    query = query.eq("source", params.source);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching reviews:", error);
    return { success: false, error: "Failed to fetch reviews" };
  }

  const reviews: Review[] = (data || []).map((row) => {
    const loanOfficer = row.loan_officers as unknown as {
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

    return {
      id: row.id,
      organizationId: row.organization_id,
      loanOfficerId: row.loan_officer_id,
      source: row.source,
      rating: row.rating,
      title: row.title,
      text: row.text,
      customerName: row.customer_name,
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

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      id,
      organization_id,
      loan_officer_id,
      source,
      rating,
      title,
      text,
      customer_name,
      status,
      approved_at,
      approved_by,
      rejection_reason,
      is_published,
      published_at,
      review_date,
      created_at,
      loan_officers!inner (
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

  const loanOfficer = data.loan_officers as unknown as {
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

  const review: Review = {
    id: data.id,
    organizationId: data.organization_id,
    loanOfficerId: data.loan_officer_id,
    source: data.source,
    rating: data.rating,
    title: data.title,
    text: data.text,
    customerName: data.customer_name,
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

  return { success: true, data: review };
}

// Approve review schema
const approveReviewSchema = z.object({
  reviewId: z.string().uuid(),
  editedText: z.string().optional(),
  publish: z.boolean().default(true),
  notes: z.string().optional(),
});

// Approve a review
export async function approveReview(
  input: z.infer<typeof approveReviewSchema>
): Promise<ActionResult> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const validated = approveReviewSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0]?.message };
  }

  const { reviewId, editedText, publish } = validated.data;
  const supabase = await createClient();

  // Verify review belongs to organization
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id, organization_id, status")
    .eq("id", reviewId)
    .eq("organization_id", context.organizationId)
    .single();

  if (!existingReview) {
    return { success: false, error: "Review not found" };
  }

  // Update the review
  const updateData: Record<string, unknown> = {
    status: "approved",
    approved_at: new Date().toISOString(),
    approved_by: context.userId,
    rejection_reason: null,
  };

  if (editedText !== undefined) {
    updateData.text = editedText;
  }

  if (publish) {
    updateData.is_published = true;
    updateData.published_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("reviews")
    .update(updateData)
    .eq("id", reviewId);

  if (error) {
    console.error("Error approving review:", error);
    return { success: false, error: "Failed to approve review" };
  }

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
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const validated = rejectReviewSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0]?.message };
  }

  const { reviewId, reason } = validated.data;
  const supabase = await createClient();

  // Verify review belongs to organization
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id, organization_id")
    .eq("id", reviewId)
    .eq("organization_id", context.organizationId)
    .single();

  if (!existingReview) {
    return { success: false, error: "Review not found" };
  }

  const { error } = await supabase
    .from("reviews")
    .update({
      status: "rejected",
      rejection_reason: reason,
      is_published: false,
      published_at: null,
    })
    .eq("id", reviewId);

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
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const validated = updateReviewTextSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0]?.message };
  }

  const { reviewId, text } = validated.data;
  const supabase = await createClient();

  // Verify review belongs to organization
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id, organization_id")
    .eq("id", reviewId)
    .eq("organization_id", context.organizationId)
    .single();

  if (!existingReview) {
    return { success: false, error: "Review not found" };
  }

  const { error } = await supabase
    .from("reviews")
    .update({ text })
    .eq("id", reviewId);

  if (error) {
    console.error("Error updating review text:", error);
    return { success: false, error: "Failed to update review text" };
  }

  revalidatePath("/dashboard/reviews");
  return { success: true };
}

// Bulk approve reviews
export async function bulkApproveReviews(
  reviewIds: string[],
  publish: boolean = true
): Promise<ActionResult<{ approved: number; failed: number }>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  if (!reviewIds.length) {
    return { success: false, error: "No reviews selected" };
  }

  const supabase = await createClient();
  let approved = 0;
  let failed = 0;

  const updateData: Record<string, unknown> = {
    status: "approved",
    approved_at: new Date().toISOString(),
    approved_by: context.userId,
    rejection_reason: null,
  };

  if (publish) {
    updateData.is_published = true;
    updateData.published_at = new Date().toISOString();
  }

  // Process reviews
  const { data, error } = await supabase
    .from("reviews")
    .update(updateData)
    .in("id", reviewIds)
    .eq("organization_id", context.organizationId)
    .eq("status", "pending")
    .select("id");

  if (error) {
    console.error("Error bulk approving reviews:", error);
    return { success: false, error: "Failed to approve reviews" };
  }

  approved = data?.length || 0;
  failed = reviewIds.length - approved;

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

  const supabase = await createClient();

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

  revalidatePath("/dashboard/reviews");
  return { success: true, data: { rejected, failed } };
}

// Revert review to pending status
export async function revertToPending(reviewId: string): Promise<ActionResult> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("reviews")
    .update({
      status: "pending",
      approved_at: null,
      approved_by: null,
      rejection_reason: null,
      is_published: false,
      published_at: null,
    })
    .eq("id", reviewId)
    .eq("organization_id", context.organizationId);

  if (error) {
    console.error("Error reverting review:", error);
    return { success: false, error: "Failed to revert review" };
  }

  revalidatePath("/dashboard/reviews");
  return { success: true };
}

// Get auto-approval rules for organization
export async function getAutoApprovalRules(): Promise<
  ActionResult<AutoApprovalRule[]>
> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = await createClient();

  const { data: org, error } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", context.organizationId)
    .single();

  if (error) {
    console.error("Error fetching organization settings:", error);
    return { success: false, error: "Failed to fetch auto-approval rules" };
  }

  const settings = (org?.settings as Record<string, unknown>) || {};
  const rules = (settings.autoApprovalRules as AutoApprovalRule[]) || DEFAULT_AUTO_APPROVAL_RULES;

  return { success: true, data: rules };
}

// Update auto-approval rules
export async function updateAutoApprovalRules(
  rules: AutoApprovalRule[]
): Promise<ActionResult> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = await createClient();

  // Get current settings
  const { data: org } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", context.organizationId)
    .single();

  const currentSettings = (org?.settings as Record<string, unknown>) || {};
  const updatedSettings = {
    ...currentSettings,
    autoApprovalRules: rules,
  } as unknown as Json;

  const { error } = await supabase
    .from("organizations")
    .update({ settings: updatedSettings })
    .eq("id", context.organizationId);

  if (error) {
    console.error("Error updating auto-approval rules:", error);
    return { success: false, error: "Failed to update auto-approval rules" };
  }

  return { success: true };
}

// Apply auto-approval rules to a review (called when review is created)
export async function applyAutoApprovalRules(
  reviewId: string,
  organizationId: string,
  rating: number
): Promise<{ autoApproved: boolean }> {
  const adminClient = createAdminClient();

  // Get organization settings
  const { data: org } = await adminClient
    .from("organizations")
    .select("settings")
    .eq("id", organizationId)
    .single();

  const settings = (org?.settings as Record<string, unknown>) || {};
  const rules = (settings.autoApprovalRules as AutoApprovalRule[]) || DEFAULT_AUTO_APPROVAL_RULES;

  // Check if any enabled rule matches
  let shouldAutoApprove = false;

  for (const rule of rules) {
    if (!rule.enabled) continue;

    if (rule.type === "rating" && rule.config.minRating) {
      if (rating >= rule.config.minRating) {
        shouldAutoApprove = true;
        break;
      }
    }
  }

  if (shouldAutoApprove) {
    await adminClient
      .from("reviews")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .eq("id", reviewId);
  }

  return { autoApproved: shouldAutoApprove };
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
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("status")
    .eq("organization_id", context.organizationId);

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

// Get loan officers for filter dropdown
export async function getLoanOfficersForFilter(): Promise<
  ActionResult<{ id: string; fullName: string }[]>
> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("loan_officers")
    .select("id, full_name")
    .eq("organization_id", context.organizationId)
    .eq("is_active", true)
    .order("full_name");

  if (error) {
    console.error("Error fetching loan officers:", error);
    return { success: false, error: "Failed to fetch loan officers" };
  }

  return {
    success: true,
    data: (data || []).map((lo) => ({
      id: lo.id,
      fullName: lo.full_name,
    })),
  };
}
