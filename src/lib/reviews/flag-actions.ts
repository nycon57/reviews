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
import {
  createAdminClient,
  createUntypedAdminClient,
} from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { sendReviewDisputeEscalationEmail } from "@/lib/email/send";
import { emailConfig } from "@/lib/email/client";
import {
  FLAG_REASON_LABELS,
  type ActionResult,
  type ReviewFlag,
  type ReviewFlagReason,
} from "./types";

const INDIVIDUAL_DISPUTE_ERROR =
  "Disputes for individual accounts are reviewed by RepWell.";

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

async function getOrganizationAccountType(
  organizationId: string
): Promise<"individual" | "enterprise" | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("organizations")
    .select("account_type, name")
    .eq("id", organizationId)
    .single();

  if (!data) return null;
  return data.account_type === "enterprise" ? "enterprise" : "individual";
}

// ============================================================================
// Audit log (mirrors createAuditLogEntry in video-testimonials/actions.ts)
// ============================================================================

async function createAuditLogEntry(params: {
  organizationId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = createUntypedAdminClient();
    await supabase.from("organization_audit_logs").insert({
      organization_id: params.organizationId,
      user_id: params.userId,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId,
      metadata: params.metadata ?? null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // Log but don't fail the main operation
    console.error("Failed to create audit log entry:", error);
  }
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
          textExcerpt: row.review.text
            ? row.review.text.slice(0, REVIEW_EXCERPT_LENGTH)
            : null,
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

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching review flags:", error);
    return { success: false, error: "Failed to fetch disputes" };
  }

  return {
    success: true,
    data: { flags: ((data ?? []) as unknown as FlagRow[]).map(mapFlagRow) },
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
    console.error(
      "Error fetching review flag stats:",
      openResult.error || resolvedResult.error
    );
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

async function getOpenFlagForAdjudication(
  flagId: string,
  organizationId: string
): Promise<
  | { flag: { id: string; review_id: string; reason: ReviewFlagReason } }
  | { error: string }
> {
  const supabase = createUntypedAdminClient();
  const { data: flag } = await supabase
    .from("review_flags")
    .select("id, review_id, reason, status")
    .eq("id", flagId)
    .eq("organization_id", organizationId)
    .single();

  if (!flag) {
    return { error: "Dispute not found" };
  }
  if (flag.status !== "pending") {
    return { error: "This dispute has already been resolved" };
  }

  const accountType = await getOrganizationAccountType(organizationId);
  if (accountType !== "enterprise") {
    return { error: INDIVIDUAL_DISPUTE_ERROR };
  }

  return { flag };
}

const upholdFlagSchema = z.object({
  flagId: z.string().uuid(),
  resolutionNote: z
    .string()
    .trim()
    .min(10, "Please add a resolution note of at least 10 characters")
    .max(2000),
});

export async function upholdFlag(
  input: z.infer<typeof upholdFlagSchema>
): Promise<ActionResult> {
  const validated = upholdFlagSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0]?.message };
  }

  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const result = await getOpenFlagForAdjudication(
    validated.data.flagId,
    context.organizationId
  );
  if ("error" in result) {
    return { success: false, error: result.error };
  }
  const { flag } = result;
  const { resolutionNote } = validated.data;

  const supabase = createUntypedAdminClient();
  const now = new Date().toISOString();

  const { error: reviewError } = await supabase
    .from("reviews")
    .update({
      status: "rejected",
      is_published: false,
      published_at: null,
      rejection_reason: `Dispute upheld (${FLAG_REASON_LABELS[flag.reason] ?? flag.reason}): ${resolutionNote}`,
    })
    .eq("id", flag.review_id)
    .eq("organization_id", context.organizationId);

  if (reviewError) {
    console.error("Error removing disputed review:", reviewError);
    return { success: false, error: "Failed to remove the review" };
  }

  const { error: flagError } = await supabase
    .from("review_flags")
    .update({
      status: "actioned",
      reviewed_by: context.userId,
      reviewed_at: now,
      resolution_note: resolutionNote,
    })
    .eq("id", flag.id)
    .eq("organization_id", context.organizationId);

  if (flagError) {
    console.error("Error updating review flag:", flagError);
    return { success: false, error: "Failed to update the dispute" };
  }

  await createAuditLogEntry({
    organizationId: context.organizationId,
    userId: context.userId,
    action: "review_flag_upheld",
    resourceType: "review_flag",
    resourceId: flag.id,
    metadata: {
      flag_id: flag.id,
      review_id: flag.review_id,
      reason: flag.reason,
    },
  });

  revalidatePath("/dashboard/reviews");
  return { success: true };
}

const dismissFlagSchema = z.object({
  flagId: z.string().uuid(),
  resolutionNote: z.string().trim().max(2000).optional(),
});

export async function dismissFlag(
  input: z.infer<typeof dismissFlagSchema>
): Promise<ActionResult> {
  const validated = dismissFlagSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0]?.message };
  }

  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const result = await getOpenFlagForAdjudication(
    validated.data.flagId,
    context.organizationId
  );
  if ("error" in result) {
    return { success: false, error: result.error };
  }
  const { flag } = result;

  const supabase = createUntypedAdminClient();
  const { error: flagError } = await supabase
    .from("review_flags")
    .update({
      status: "dismissed",
      reviewed_by: context.userId,
      reviewed_at: new Date().toISOString(),
      resolution_note: validated.data.resolutionNote?.trim() || null,
    })
    .eq("id", flag.id)
    .eq("organization_id", context.organizationId);

  if (flagError) {
    console.error("Error dismissing review flag:", flagError);
    return { success: false, error: "Failed to dismiss the dispute" };
  }

  await createAuditLogEntry({
    organizationId: context.organizationId,
    userId: context.userId,
    action: "review_flag_dismissed",
    resourceType: "review_flag",
    resourceId: flag.id,
    metadata: {
      flag_id: flag.id,
      review_id: flag.review_id,
      reason: flag.reason,
    },
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

// ============================================================================
// Routing — notify enterprise managers or escalate individuals to RepWell
// ============================================================================

export async function routeNewFlag(
  flag: { id: string },
  organizationId: string
): Promise<void> {
  try {
    const untyped = createUntypedAdminClient();
    const supabase = createAdminClient();

    // Re-fetch from the database so routing never trusts caller-supplied data
    const { data: flagRow } = await untyped
      .from("review_flags")
      .select(
        "id, review_id, reason, details, reporter_name, reporter_email, flagged_by_user_id"
      )
      .eq("id", flag.id)
      .eq("organization_id", organizationId)
      .eq("status", "pending")
      .single();

    if (!flagRow) return;

    const { data: org } = await supabase
      .from("organizations")
      .select("name, account_type")
      .eq("id", organizationId)
      .single();

    if (!org) return;

    const reasonLabel =
      FLAG_REASON_LABELS[flagRow.reason as ReviewFlagReason] ?? flagRow.reason;

    if (org.account_type === "enterprise") {
      // Notify all org admins and managers in-app
      const { data: managers } = await supabase
        .from("users")
        .select("id")
        .eq("organization_id", organizationId)
        .in("role", ["admin", "manager"])
        .eq("is_active", true);

      if (!managers?.length) return;

      const { error: notifyError } = await supabase
        .from("notifications")
        .insert(
          managers.map((manager) => ({
            user_id: manager.id,
            organization_id: organizationId,
            type: "review_flag_pending",
            title: "A review has been disputed",
            message: `A review was reported for ${reasonLabel.toLowerCase()}. Review the dispute to uphold or dismiss it.`,
            action_url: "/dashboard/reviews?tab=disputes",
            metadata: {
              event: "review_flag_pending",
              flag_id: flagRow.id,
              review_id: flagRow.review_id,
              reason: flagRow.reason,
              created_at: new Date().toISOString(),
            },
          }))
        );

      if (notifyError) {
        console.error("Error creating dispute notifications:", notifyError);
      }
      return;
    }

    // Individual account — escalate to the RepWell team
    await untyped
      .from("review_flags")
      .update({ escalated_to_platform_at: new Date().toISOString() })
      .eq("id", flagRow.id);

    const escalationEmail = process.env.REVIEW_DISPUTE_ESCALATION_EMAIL;
    if (!escalationEmail) {
      console.warn(
        "REVIEW_DISPUTE_ESCALATION_EMAIL is not set; skipping dispute escalation email for flag",
        flagRow.id
      );
      return;
    }

    const { data: review } = await supabase
      .from("reviews")
      .select("id, rating, customer_name, text")
      .eq("id", flagRow.review_id)
      .single();

    let reporterName = flagRow.reporter_name as string | null;
    if (!reporterName && flagRow.flagged_by_user_id) {
      const { data: reporter } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", flagRow.flagged_by_user_id)
        .single();
      reporterName = reporter?.full_name ?? null;
    }

    await sendReviewDisputeEscalationEmail({
      toEmail: escalationEmail,
      organizationId,
      flagId: flagRow.id,
      reviewId: flagRow.review_id,
      organizationName: org.name,
      reporterName: reporterName ?? undefined,
      reporterEmail: (flagRow.reporter_email as string | null) ?? undefined,
      reasonLabel,
      details: (flagRow.details as string | null) ?? undefined,
      rating: review?.rating ?? 0,
      customerName: review?.customer_name ?? undefined,
      reviewExcerpt: review?.text
        ? review.text.slice(0, REVIEW_EXCERPT_LENGTH)
        : "",
      reviewUrl: `${emailConfig.baseUrl}/dashboard/reviews/${flagRow.review_id}`,
    });
  } catch (error) {
    // Routing is best-effort; never fail the flag submission itself
    console.error("Error routing new review flag:", error);
  }
}
