"use server";

/**
 * Dispute adjudication for the auto-publish review model.
 *
 * Reviews go live after machine screening; a live review can only be removed
 * through an upheld dispute. Enterprise orgs adjudicate their own disputes,
 * individual accounts escalate to the RepWell team.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { type ActionResult, type ReviewFlag, type ReviewFlagReason } from "./types";
import { routeNewFlag } from "./flag-routing";
import {
  createDisputeAuditLog,
  getOpenFlagForAdjudication,
  removeReviewForUpheldDispute,
  resolveDisputeSchema,
  resolveReviewFlag,
} from "./dispute-resolution";

const REVIEW_EXCERPT_LENGTH = 200;

// ============================================================================
// Auth helpers
// ============================================================================

async function getUserContext() {
  const user = await unifiedGetUser();
  if (!user) return null;

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id, role, full_name, email")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) return null;
  return userData;
}

async function requireManagerRole(): Promise<{
  userId: string;
  organizationId: string;
} | null> {
  const context = await getUserContext();
  if (!context || !["admin", "manager"].includes(context.role)) {
    return null;
  }
  return { userId: context.id, organizationId: context.organization_id! };
}

// ============================================================================
// Queries
// ============================================================================

interface FlagRow {
  id: string;
  review_id: string;
  reason: ReviewFlagReason;
  details: string | null;
  reporter_name: string | null;
  reporter_email: string | null;
  flagged_by_user_id: string | null;
  status: ReviewFlag["status"];
  resolution_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  review: {
    id: string;
    rating: number;
    customer_name: string | null;
    text: string | null;
    status: string;
    user_id: string | null;
  } | null;
  flagged_by: { full_name: string | null } | null;
}

function mapFlagRow(row: FlagRow): ReviewFlag {
  return {
    id: row.id,
    reviewId: row.review_id,
    reason: row.reason,
    details: row.details,
    reporterName: row.reporter_name,
    reporterEmail: row.reporter_email,
    flaggedByName: row.flagged_by?.full_name ?? null,
    status: row.status,
    resolutionNote: row.resolution_note,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    review: row.review
      ? {
          id: row.review.id,
          rating: row.review.rating,
          customerName: row.review.customer_name,
          textExcerpt: row.review.text ? row.review.text.slice(0, REVIEW_EXCERPT_LENGTH) : null,
          status: row.review.status,
          userId: row.review.user_id,
        }
      : null,
  };
}

export async function getReviewFlags(params?: {
  status?: "pending" | "resolved";
}): Promise<ActionResult<{ flags: ReviewFlag[] }>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = createUntypedAdminClient();
  let query = supabase
    .from("review_flags")
    .select(
      `
      id,
      review_id,
      reason,
      details,
      reporter_name,
      reporter_email,
      flagged_by_user_id,
      status,
      resolution_note,
      reviewed_at,
      created_at,
      review:reviews!review_id (
        id,
        rating,
        customer_name,
        text,
        status,
        user_id
      ),
      flagged_by:users!flagged_by_user_id (
        full_name
      )
    `
    )
    .eq("organization_id", context.organizationId)
    .order("created_at", { ascending: false });

  if (params?.status === "pending") {
    query = query.eq("status", "pending");
  } else if (params?.status === "resolved") {
    query = query.in("status", ["dismissed", "actioned"]);
  }

  // The untyped admin client cannot infer this select, and PostgREST returns the
  // many-to-one `review`/`flagged_by` embeds as objects rather than the arrays its
  // generic inference assumes, so the row shape is declared here.
  const { data, error } = await query.returns<FlagRow[]>();

  if (error) {
    console.error("Error fetching review flags:", error);
    return { success: false, error: "Failed to fetch disputes" };
  }

  return {
    success: true,
    data: { flags: (data ?? []).map(mapFlagRow) },
  };
}

export async function getReviewFlagStats(): Promise<
  ActionResult<{ open: number; resolved: number }>
> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = createUntypedAdminClient();
  const [openResult, resolvedResult] = await Promise.all([
    supabase
      .from("review_flags")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", context.organizationId)
      .eq("status", "pending"),
    supabase
      .from("review_flags")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", context.organizationId)
      .in("status", ["dismissed", "actioned"]),
  ]);

  if (openResult.error || resolvedResult.error) {
    console.error("Error fetching review flag stats:", openResult.error || resolvedResult.error);
    return { success: false, error: "Failed to fetch dispute stats" };
  }

  return {
    success: true,
    data: { open: openResult.count ?? 0, resolved: resolvedResult.count ?? 0 },
  };
}

// ============================================================================
// Adjudication
// ============================================================================

export async function upholdFlag(
  input: z.infer<typeof resolveDisputeSchema>
): Promise<ActionResult> {
  const validated = resolveDisputeSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0]?.message };
  }

  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const result = await getOpenFlagForAdjudication(validated.data.flagId, {
    accountType: "enterprise",
  });
  if ("error" in result) {
    return { success: false, error: result.error };
  }
  const { flag } = result;
  if (flag.organization_id !== context.organizationId) {
    return { success: false, error: "Dispute not found" };
  }
  const { resolutionNote } = validated.data;

  const supabase = createUntypedAdminClient();
  const now = new Date().toISOString();

  const { error: reviewError } = await removeReviewForUpheldDispute({
    supabase,
    reviewId: flag.review_id,
    organizationId: context.organizationId,
    reason: flag.reason,
    resolutionNote,
  });

  if (reviewError) {
    console.error("Error removing disputed review:", reviewError);
    return { success: false, error: "Failed to remove the review" };
  }

  const { error: flagError } = await resolveReviewFlag({
    supabase,
    flagId: flag.id,
    organizationId: context.organizationId,
    status: "actioned",
    reviewedBy: context.userId,
    reviewedAt: now,
    resolutionNote,
    resolutionVerdict: "upheld",
  });

  if (flagError) {
    console.error("Error updating review flag:", flagError);
    return { success: false, error: "Failed to update the dispute" };
  }

  await createDisputeAuditLog({
    supabase,
    organizationId: context.organizationId,
    userId: context.userId,
    action: "review_flag_upheld",
    flagId: flag.id,
    reviewId: flag.review_id,
    reason: flag.reason,
    verdict: "upheld",
    resolutionNote,
  });

  revalidatePath("/dashboard/reviews");
  return { success: true };
}

const dismissFlagSchema = z.object({
  flagId: z.string().uuid(),
  resolutionNote: z.string().trim().max(2000).optional(),
});

export async function dismissFlag(input: z.infer<typeof dismissFlagSchema>): Promise<ActionResult> {
  const validated = dismissFlagSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0]?.message };
  }

  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const result = await getOpenFlagForAdjudication(validated.data.flagId, {
    accountType: "enterprise",
  });
  if ("error" in result) {
    return { success: false, error: result.error };
  }
  const { flag } = result;
  if (flag.organization_id !== context.organizationId) {
    return { success: false, error: "Dispute not found" };
  }

  const supabase = createUntypedAdminClient();
  const resolutionNote = validated.data.resolutionNote?.trim() || null;
  const { error: flagError } = await resolveReviewFlag({
    supabase,
    flagId: flag.id,
    organizationId: context.organizationId,
    status: "dismissed",
    reviewedBy: context.userId,
    reviewedAt: new Date().toISOString(),
    resolutionNote,
    resolutionVerdict: "dismissed",
  });

  if (flagError) {
    console.error("Error dismissing review flag:", flagError);
    return { success: false, error: "Failed to dismiss the dispute" };
  }

  await createDisputeAuditLog({
    supabase,
    organizationId: context.organizationId,
    userId: context.userId,
    action: "review_flag_dismissed",
    flagId: flag.id,
    reviewId: flag.review_id,
    reason: flag.reason,
    verdict: "dismissed",
    resolutionNote,
  });

  revalidatePath("/dashboard/reviews");
  return { success: true };
}

// ============================================================================
// Reporting (internal, by an org member)
// ============================================================================

const reportReviewSchema = z.object({
  reviewId: z.string().uuid(),
  reason: z.enum([
    "inaccurate_information",
    "impersonation",
    "inappropriate_content",
    "spam_fake_review",
    "other",
  ]),
  details: z.string().trim().max(1000).optional(),
});

export async function reportReviewAsPro(
  input: z.infer<typeof reportReviewSchema>
): Promise<ActionResult> {
  const validated = reportReviewSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0]?.message };
  }

  const context = await getUserContext();
  if (!context?.organization_id) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const { data: review } = await supabase
    .from("reviews")
    .select("id, organization_id")
    .eq("id", validated.data.reviewId)
    .eq("organization_id", context.organization_id)
    .single();

  if (!review) {
    return { success: false, error: "Review not found" };
  }

  const untyped = createUntypedAdminClient();
  const { data: flag, error: insertError } = await untyped
    .from("review_flags")
    .insert({
      review_id: review.id,
      organization_id: context.organization_id,
      reason: validated.data.reason,
      details: validated.data.details?.trim() || null,
      reporter_name: context.full_name,
      reporter_email: context.email,
      flagged_by_user_id: context.id,
    })
    .select("id")
    .single();

  if (insertError || !flag) {
    console.error("Error inserting review flag:", insertError);
    return { success: false, error: "Failed to submit report" };
  }

  await routeNewFlag({ id: flag.id as string }, context.organization_id);

  revalidatePath("/dashboard/reviews");
  return { success: true };
}
