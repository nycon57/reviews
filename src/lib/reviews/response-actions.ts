"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./types";
import {
  generateResponseSuggestion,
  improveResponseWithContext,
  type ResponseTone,
  type ReviewContext,
} from "@/lib/ai/response-suggestions";

// Response template types
export interface ResponseTemplate {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  category: "thank_you" | "apologetic" | "follow_up" | "promotional" | "custom";
  tone: "professional" | "friendly" | "empathetic" | "formal";
  content: string;
  variables: string[];
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewResponse {
  reviewId: string;
  responseText: string;
  responseStatus: "draft" | "pending_approval" | "approved" | "rejected" | "posted" | null;
  responseAt: string | null;
  responseBy: string | null;
  responseApprovedAt: string | null;
  responseApprovedBy: string | null;
  responseRejectedAt: string | null;
  responseRejectedBy: string | null;
  responseRejectionReason: string | null;
  responseTemplateId: string | null;
  aiSuggestedResponse: string | null;
  responsePostedAt: string | null;
  responsePostError: string | null;
}

export interface ResponseAnalytics {
  totalResponses: number;
  averageResponseTimeHours: number;
  responseRate: number;
  templateUsage: Record<string, number>;
  aiSuggestionRate: number;
  approvalRate: number;
  platformBreakdown: Record<string, number>;
  pendingApprovals: number;
}

// Get user context
async function getUserContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  return userData;
}

// Require manager or admin role
async function requireManagerRole(): Promise<{ userId: string; organizationId: string } | null> {
  const context = await getUserContext();
  if (!context || !["admin", "manager"].includes(context.role)) return null;
  return { userId: context.id, organizationId: context.organization_id! };
}

// Require any authenticated user
async function requireAuth(): Promise<{ userId: string; organizationId: string; role: string } | null> {
  const context = await getUserContext();
  if (!context) return null;
  return { userId: context.id, organizationId: context.organization_id!, role: context.role };
}

// ============================================
// Response Template CRUD Operations
// ============================================

export async function getResponseTemplates(
  category?: string
): Promise<ActionResult<ResponseTemplate[]>> {
  const context = await requireAuth();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Use type assertion for response_templates table (migration pending)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("response_templates")
    .select("*")
    .eq("organization_id", context.organizationId)
    .eq("is_active", true)
    .order("usage_count", { ascending: false });

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching response templates:", error);
    return { success: false, error: "Failed to fetch templates" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const templates: ResponseTemplate[] = (data || []).map((row: any) => ({
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    category: row.category,
    tone: row.tone,
    content: row.content,
    variables: row.variables || [],
    isDefault: row.is_default,
    isActive: row.is_active,
    usageCount: row.usage_count,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return { success: true, data: templates };
}

export async function createResponseTemplate(
  template: Omit<ResponseTemplate, "id" | "organizationId" | "usageCount" | "createdBy" | "createdAt" | "updatedAt">
): Promise<ActionResult<ResponseTemplate>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("response_templates")
    .insert({
      organization_id: context.organizationId,
      name: template.name,
      description: template.description,
      category: template.category,
      tone: template.tone,
      content: template.content,
      variables: template.variables,
      is_default: template.isDefault,
      is_active: template.isActive,
      created_by: context.userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating response template:", error);
    return { success: false, error: "Failed to create template" };
  }

  revalidatePath("/dashboard/responses");
  return {
    success: true,
    data: {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      description: data.description,
      category: data.category,
      tone: data.tone,
      content: data.content,
      variables: data.variables || [],
      isDefault: data.is_default,
      isActive: data.is_active,
      usageCount: data.usage_count,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  };
}

export async function updateResponseTemplate(
  templateId: string,
  updates: Partial<Omit<ResponseTemplate, "id" | "organizationId" | "usageCount" | "createdBy" | "createdAt" | "updatedAt">>
): Promise<ActionResult> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.tone !== undefined) updateData.tone = updates.tone;
  if (updates.content !== undefined) updateData.content = updates.content;
  if (updates.variables !== undefined) updateData.variables = updates.variables;
  if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("response_templates")
    .update(updateData)
    .eq("id", templateId)
    .eq("organization_id", context.organizationId);

  if (error) {
    console.error("Error updating response template:", error);
    return { success: false, error: "Failed to update template" };
  }

  revalidatePath("/dashboard/responses");
  return { success: true };
}

export async function deleteResponseTemplate(templateId: string): Promise<ActionResult> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = await createClient();

  // Soft delete by setting is_active to false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("response_templates")
    .update({ is_active: false })
    .eq("id", templateId)
    .eq("organization_id", context.organizationId);

  if (error) {
    console.error("Error deleting response template:", error);
    return { success: false, error: "Failed to delete template" };
  }

  revalidatePath("/dashboard/responses");
  return { success: true };
}

// ============================================
// Response Composition & Submission
// ============================================

// Save a draft response
export async function saveDraftResponse(
  reviewId: string,
  responseText: string,
  templateId?: string
): Promise<ActionResult> {
  const context = await requireAuth();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("reviews")
    .update({
      response_text: responseText,
      response_status: "draft",
      response_by: context.userId,
      response_at: new Date().toISOString(),
      response_template_id: templateId || null,
    })
    .eq("id", reviewId)
    .eq("organization_id", context.organizationId);

  if (error) {
    console.error("Error saving draft response:", error);
    return { success: false, error: "Failed to save draft" };
  }

  revalidatePath("/dashboard/all-reviews");
  revalidatePath("/dashboard/responses");
  return { success: true };
}

// Submit response for approval (if approval workflow is enabled)
export async function submitResponseForApproval(
  reviewId: string,
  responseText: string,
  templateId?: string
): Promise<ActionResult> {
  const context = await requireAuth();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("reviews")
    .update({
      response_text: responseText,
      response_status: "pending_approval",
      response_by: context.userId,
      response_at: new Date().toISOString(),
      response_template_id: templateId || null,
    })
    .eq("id", reviewId)
    .eq("organization_id", context.organizationId);

  if (error) {
    console.error("Error submitting response for approval:", error);
    return { success: false, error: "Failed to submit for approval" };
  }

  revalidatePath("/dashboard/all-reviews");
  revalidatePath("/dashboard/responses");
  revalidatePath("/dashboard/response-approvals");
  return { success: true };
}

// Post response options for tracking AI usage
export interface PostResponseOptions {
  templateId?: string;
  wasAISuggested?: boolean;
  wasEditedFromAI?: boolean;
  originalAISuggestion?: string;
}

// Post response directly (for managers or when approval not required)
export async function postResponse(
  reviewId: string,
  responseText: string,
  templateIdOrOptions?: string | PostResponseOptions
): Promise<ActionResult> {
  const context = await requireAuth();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  // Parse options - support both old and new signature
  let options: PostResponseOptions = {};
  if (typeof templateIdOrOptions === "string") {
    options.templateId = templateIdOrOptions;
  } else if (templateIdOrOptions) {
    options = templateIdOrOptions;
  }

  const supabase = await createClient();

  // Get the review to determine the platform and post accordingly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: review, error: fetchError } = await (supabase as any)
    .from("reviews")
    .select("id, source, source_review_id, loan_officer_id, customer_name, sentiment_score, review_date")
    .eq("id", reviewId)
    .eq("organization_id", context.organizationId)
    .single();

  if (fetchError || !review) {
    return { success: false, error: "Review not found" };
  }

  const now = new Date().toISOString();

  // Update the review with the response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from("reviews")
    .update({
      response_text: responseText,
      response_status: "posted",
      response_by: context.userId,
      response_at: now,
      response_template_id: options.templateId || null,
      response_posted_at: now,
    })
    .eq("id", reviewId)
    .eq("organization_id", context.organizationId);

  if (updateError) {
    console.error("Error posting response:", updateError);
    return { success: false, error: "Failed to post response" };
  }

  // Calculate response time in hours
  const reviewDate = new Date(review.review_date);
  const responseDate = new Date(now);
  const responseTimeHours = (responseDate.getTime() - reviewDate.getTime()) / (1000 * 60 * 60);

  // Record analytics with AI tracking
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("response_analytics").insert({
    organization_id: context.organizationId,
    review_id: reviewId,
    loan_officer_id: review.loan_officer_id,
    response_time_hours: Math.round(responseTimeHours * 100) / 100,
    template_used: options.templateId || null,
    was_ai_suggested: options.wasAISuggested || false,
    was_edited_from_template: options.templateId
      ? true
      : options.wasEditedFromAI || false,
    word_count: responseText.split(/\s+/).length,
    sentiment_before: review.sentiment_score,
    platform: review.source,
    posted_successfully: true,
  });

  // If it's a Google review, also create a record in google_review_replies
  if (review.source === "google") {
    // Get the Google connection for this organization
    const { data: connection } = await supabase
      .from("google_connections")
      .select("id")
      .eq("organization_id", context.organizationId)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (connection) {
      await supabase.from("google_review_replies").insert({
        organization_id: context.organizationId,
        review_id: reviewId,
        connection_id: connection.id,
        reply_text: responseText,
        status: "pending", // Will be processed by a background job to post to Google
        sent_by: context.userId,
      });
    }
  }

  revalidatePath("/dashboard/all-reviews");
  revalidatePath("/dashboard/responses");
  return { success: true };
}

// ============================================
// Response Approval Workflow (for Managers)
// ============================================

// Get responses pending approval
export async function getPendingApprovals(): Promise<ActionResult<{
  reviews: Array<{
    id: string;
    customerName: string | null;
    text: string | null;
    rating: number;
    source: string;
    reviewDate: string;
    responseText: string;
    responseBy: string | null;
    responseAt: string | null;
    loanOfficer: { id: string; fullName: string; photoUrl: string | null };
  }>;
  total: number;
}>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, count } = await (supabase as any)
    .from("reviews")
    .select(
      `
      id,
      customer_name,
      text,
      rating,
      source,
      review_date,
      response_text,
      response_by,
      response_at,
      loan_officers!inner (
        id,
        full_name,
        photo_url
      )
    `,
      { count: "exact" }
    )
    .eq("organization_id", context.organizationId)
    .eq("response_status", "pending_approval")
    .order("response_at", { ascending: true });

  if (error) {
    console.error("Error fetching pending approvals:", error);
    return { success: false, error: "Failed to fetch pending approvals" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviews = (data || []).map((row: any) => {
    const lo = row.loan_officers as unknown as { id: string; full_name: string; photo_url: string | null };
    return {
      id: row.id,
      customerName: row.customer_name,
      text: row.text,
      rating: row.rating,
      source: row.source,
      reviewDate: row.review_date,
      responseText: row.response_text!,
      responseBy: row.response_by,
      responseAt: row.response_at,
      loanOfficer: {
        id: lo.id,
        fullName: lo.full_name,
        photoUrl: lo.photo_url,
      },
    };
  });

  return { success: true, data: { reviews, total: count || 0 } };
}

// Approve a pending response
export async function approveResponse(reviewId: string): Promise<ActionResult> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  // Get the current response text
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: review, error: fetchError } = await (supabase as any)
    .from("reviews")
    .select("response_text, loan_officer_id, source, source_review_id, review_date, sentiment_score, response_template_id")
    .eq("id", reviewId)
    .eq("organization_id", context.organizationId)
    .eq("response_status", "pending_approval")
    .single();

  if (fetchError || !review) {
    return { success: false, error: "Pending response not found" };
  }

  // Update to approved and posted
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("reviews")
    .update({
      response_status: "posted",
      response_approved_at: now,
      response_approved_by: context.userId,
      response_posted_at: now,
    })
    .eq("id", reviewId)
    .eq("organization_id", context.organizationId);

  if (error) {
    console.error("Error approving response:", error);
    return { success: false, error: "Failed to approve response" };
  }

  // Calculate response time
  const reviewDate = new Date(review.review_date);
  const responseDate = new Date(now);
  const responseTimeHours = (responseDate.getTime() - reviewDate.getTime()) / (1000 * 60 * 60);

  // Record analytics
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("response_analytics").insert({
    organization_id: context.organizationId,
    review_id: reviewId,
    loan_officer_id: review.loan_officer_id,
    response_time_hours: Math.round(responseTimeHours * 100) / 100,
    template_used: review.response_template_id,
    was_ai_suggested: false,
    was_edited_from_template: review.response_template_id ? true : false,
    word_count: review.response_text?.split(/\s+/).length || 0,
    sentiment_before: review.sentiment_score,
    platform: review.source,
    posted_successfully: true,
  });

  // Create Google reply record if applicable
  if (review.source === "google") {
    const { data: connection } = await supabase
      .from("google_connections")
      .select("id")
      .eq("organization_id", context.organizationId)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (connection) {
      await supabase.from("google_review_replies").insert({
        organization_id: context.organizationId,
        review_id: reviewId,
        connection_id: connection.id,
        reply_text: review.response_text,
        status: "pending",
        sent_by: context.userId,
      });
    }
  }

  revalidatePath("/dashboard/all-reviews");
  revalidatePath("/dashboard/responses");
  revalidatePath("/dashboard/response-approvals");
  return { success: true };
}

// Reject a pending response
export async function rejectResponse(
  reviewId: string,
  reason: string
): Promise<ActionResult> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("reviews")
    .update({
      response_status: "rejected",
      response_rejected_at: new Date().toISOString(),
      response_rejected_by: context.userId,
      response_rejection_reason: reason,
    })
    .eq("id", reviewId)
    .eq("organization_id", context.organizationId)
    .eq("response_status", "pending_approval");

  if (error) {
    console.error("Error rejecting response:", error);
    return { success: false, error: "Failed to reject response" };
  }

  revalidatePath("/dashboard/all-reviews");
  revalidatePath("/dashboard/responses");
  revalidatePath("/dashboard/response-approvals");
  return { success: true };
}

// ============================================
// Response Analytics
// ============================================

export async function getResponseAnalytics(
  startDate?: string,
  endDate?: string
): Promise<ActionResult<ResponseAnalytics>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = await createClient();

  // Get total reviews count
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reviewsQuery = (supabase as any)
    .from("reviews")
    .select("id, response_text, response_status", { count: "exact" })
    .eq("organization_id", context.organizationId)
    .eq("status", "approved");

  if (startDate) reviewsQuery = reviewsQuery.gte("review_date", startDate);
  if (endDate) reviewsQuery = reviewsQuery.lte("review_date", endDate);

  const { data: reviews, count: totalReviews } = await reviewsQuery;

  // Get response analytics data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let analyticsQuery = (supabase as any)
    .from("response_analytics")
    .select("*")
    .eq("organization_id", context.organizationId);

  if (startDate) analyticsQuery = analyticsQuery.gte("created_at", startDate);
  if (endDate) analyticsQuery = analyticsQuery.lte("created_at", endDate);

  const { data: analytics } = await analyticsQuery;

  // Get pending approvals count
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: pendingApprovals } = await (supabase as any)
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", context.organizationId)
    .eq("response_status", "pending_approval");

  // Calculate metrics
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const responsesWithText = reviews?.filter((r: any) => r.response_text) || [];
  const totalResponses = responsesWithText.length;
  const responseRate = totalReviews ? (totalResponses / totalReviews) * 100 : 0;

  // Calculate average response time
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const responseTimes = analytics?.map((a: any) => a.response_time_hours).filter(Boolean) || [];
  const avgResponseTime = responseTimes.length
    ? responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length
    : 0;

  // Template usage breakdown
  const templateUsage: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const a of (analytics || []) as any[]) {
    if (a.template_used) {
      templateUsage[a.template_used] = (templateUsage[a.template_used] || 0) + 1;
    }
  }

  // AI suggestion rate
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aiSuggested = analytics?.filter((a: any) => a.was_ai_suggested).length || 0;
  const aiSuggestionRate = analytics?.length ? (aiSuggested / analytics.length) * 100 : 0;

  // Approval rate (approved / (approved + rejected))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const approvedCount = reviews?.filter((r: any) => r.response_status === "posted").length || 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rejectedCount = reviews?.filter((r: any) => r.response_status === "rejected").length || 0;
  const approvalRate = approvedCount + rejectedCount > 0
    ? (approvedCount / (approvedCount + rejectedCount)) * 100
    : 100;

  // Platform breakdown
  const platformBreakdown: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const a of (analytics || []) as any[]) {
    if (a.platform) {
      platformBreakdown[a.platform] = (platformBreakdown[a.platform] || 0) + 1;
    }
  }

  return {
    success: true,
    data: {
      totalResponses,
      averageResponseTimeHours: Math.round(avgResponseTime * 10) / 10,
      responseRate: Math.round(responseRate * 10) / 10,
      templateUsage,
      aiSuggestionRate: Math.round(aiSuggestionRate * 10) / 10,
      approvalRate: Math.round(approvalRate * 10) / 10,
      platformBreakdown,
      pendingApprovals: pendingApprovals || 0,
    },
  };
}

// ============================================
// AI Response Suggestions (S021)
// ============================================

// Generate AI-powered response suggestion for a review
export async function generateAISuggestion(
  reviewId: string,
  tone: ResponseTone = "professional"
): Promise<ActionResult<string>> {
  const context = await requireAuth();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Get the review content with sentiment data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: review, error } = await (supabase as any)
    .from("reviews")
    .select(`
      text,
      customer_name,
      rating,
      source,
      sentiment_score,
      sentiment_label,
      themes,
      key_phrases,
      loan_officers!inner(full_name)
    `)
    .eq("id", reviewId)
    .eq("organization_id", context.organizationId)
    .single();

  if (error || !review) {
    return { success: false, error: "Review not found" };
  }

  // Build review context for AI
  const loanOfficer = review.loan_officers as unknown as { full_name: string };
  const reviewContext: ReviewContext = {
    text: review.text,
    rating: review.rating,
    customerName: review.customer_name,
    loanOfficerName: loanOfficer.full_name,
    source: review.source,
    sentimentScore: review.sentiment_score,
    sentimentLabel: review.sentiment_label,
    themes: review.themes,
    keyPhrases: review.key_phrases,
  };

  try {
    // Generate AI-powered response
    const suggestion = await generateResponseSuggestion(reviewContext, tone);

    // Save the AI suggestion to the review
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("reviews")
      .update({ ai_suggested_response: suggestion.response })
      .eq("id", reviewId)
      .eq("organization_id", context.organizationId);

    return { success: true, data: suggestion.response };
  } catch (error) {
    console.error("Failed to generate AI suggestion:", error);
    return {
      success: false,
      error: "Failed to generate AI suggestion. Please try again."
    };
  }
}

// Track when a user edits an AI-suggested response (for learning)
export async function trackResponseEdit(
  reviewId: string,
  originalSuggestion: string,
  editedResponse: string
): Promise<ActionResult<{ learnings: string[] }>> {
  const context = await requireAuth();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Get the review context for analysis
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: review, error } = await (supabase as any)
    .from("reviews")
    .select(`
      text,
      customer_name,
      rating,
      source,
      sentiment_score,
      sentiment_label,
      themes,
      key_phrases,
      loan_officers!inner(full_name)
    `)
    .eq("id", reviewId)
    .eq("organization_id", context.organizationId)
    .single();

  if (error || !review) {
    return { success: false, error: "Review not found" };
  }

  const loanOfficer = review.loan_officers as unknown as { full_name: string };
  const reviewContext: ReviewContext = {
    text: review.text,
    rating: review.rating,
    customerName: review.customer_name,
    loanOfficerName: loanOfficer.full_name,
    source: review.source,
    sentimentScore: review.sentiment_score,
    sentimentLabel: review.sentiment_label,
    themes: review.themes,
    keyPhrases: review.key_phrases,
  };

  try {
    // Analyze the edit to extract learnings
    const { learnings } = await improveResponseWithContext(
      originalSuggestion,
      editedResponse,
      reviewContext
    );

    // Store the edit data for future learning (optional table)
    // This could be used to fine-tune future suggestions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("ai_response_learnings").insert({
      organization_id: context.organizationId,
      review_id: reviewId,
      original_suggestion: originalSuggestion,
      edited_response: editedResponse,
      learnings: learnings,
      rating: review.rating,
      sentiment_label: review.sentiment_label,
      created_by: context.userId,
    }).catch(() => {
      // Table may not exist yet, silently continue
    });

    return { success: true, data: { learnings } };
  } catch (error) {
    console.error("Failed to track response edit:", error);
    return { success: true, data: { learnings: [] } };
  }
}
