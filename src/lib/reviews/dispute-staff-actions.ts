"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { unifiedGetUser } from "@/lib/auth/actions";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  FLAG_REASON_LABELS,
  type ActionResult,
  type ReviewFlagReason,
} from "./types";
import {
  createDisputeAuditLog,
  getOpenFlagForAdjudication,
  removeReviewForUpheldDispute,
  resolveDisputeSchema,
  resolveReviewFlag,
} from "./dispute-resolution";

const REVIEW_EXCERPT_LENGTH = 200;

export interface StaffDispute {
  id: string;
  reviewId: string;
  organizationId: string;
  organizationName: string;
  reason: ReviewFlagReason;
  reasonLabel: string;
  details: string | null;
  reporterName: string | null;
  reporterEmail: string | null;
  flaggedByName: string | null;
  createdAt: string;
  review: {
    id: string;
    rating: number;
    customerName: string | null;
    textExcerpt: string | null;
    status: string | null;
    isPublished: boolean | null;
  } | null;
}

interface StaffDisputeRow {
  id: string;
  review_id: string;
  organization_id: string;
  reason: string;
  details: string | null;
  reporter_name: string | null;
  reporter_email: string | null;
  created_at: string;
  organization: {
    id: string;
    name: string;
    account_type: string | null;
  } | null;
  review: {
    id: string;
    rating: number;
    customer_name: string | null;
    text: string | null;
    status: string | null;
    is_published: boolean | null;
  } | null;
  flagged_by: {
    full_name: string | null;
  } | null;
}

/**
 * PostgREST returns a single object for a to-one embed, but with no generated relationship
 * metadata supabase-js widens those embeds to arrays. Normalize both shapes to the one row.
 */
function toOneEmbed<T>(embed: T | T[] | null | undefined): T | null {
  if (embed === null || embed === undefined) return null;
  return Array.isArray(embed) ? (embed[0] ?? null) : embed;
}

async function requirePlatformAdminUserId(): Promise<string> {
  const user = await unifiedGetUser();
  if (!user) {
    redirect("/dashboard");
  }

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("is_platform_admin")
    .eq("id", user.id)
    .limit(1);

  if (error) {
    console.error("Platform admin lookup failed:", error.message);
    redirect("/dashboard");
  }

  if (data?.[0]?.is_platform_admin !== true) {
    redirect("/dashboard");
  }

  return user.id;
}

function asReviewFlagReason(reason: string): ReviewFlagReason {
  if (reason in FLAG_REASON_LABELS) {
    return reason as ReviewFlagReason;
  }
  return "other";
}

function mapStaffDispute(row: StaffDisputeRow): StaffDispute {
  const reason = asReviewFlagReason(row.reason);

  return {
    id: row.id,
    reviewId: row.review_id,
    organizationId: row.organization_id,
    organizationName: row.organization?.name ?? "Unknown organization",
    reason,
    reasonLabel: FLAG_REASON_LABELS[reason],
    details: row.details,
    reporterName: row.reporter_name,
    reporterEmail: row.reporter_email,
    flaggedByName: row.flagged_by?.full_name ?? null,
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
          isPublished: row.review.is_published,
        }
      : null,
  };
}

export async function getOpenIndividualDisputes(): Promise<
  ActionResult<{ disputes: StaffDispute[] }>
> {
  const staffUserId = await requirePlatformAdminUserId();
  if (!staffUserId) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("review_flags")
    .select(
      `
      id,
      review_id,
      organization_id,
      reason,
      details,
      reporter_name,
      reporter_email,
      created_at,
      organization:organizations!organization_id (
        id,
        name,
        account_type
      ),
      review:reviews!review_id (
        id,
        rating,
        customer_name,
        text,
        status,
        is_published
      ),
      flagged_by:users!flagged_by_user_id (
        full_name
      )
    `
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching staff disputes:", error);
    return { success: false, error: "Failed to fetch staff disputes" };
  }

  const disputes = (data ?? [])
    .map(
      (row): StaffDisputeRow => ({
        id: row.id,
        review_id: row.review_id,
        organization_id: row.organization_id,
        reason: row.reason,
        details: row.details,
        reporter_name: row.reporter_name,
        reporter_email: row.reporter_email,
        created_at: row.created_at,
        organization: toOneEmbed(row.organization),
        review: toOneEmbed(row.review),
        flagged_by: toOneEmbed(row.flagged_by),
      })
    )
    .filter((row) => row.organization?.account_type !== "enterprise")
    .map(mapStaffDispute);

  return { success: true, data: { disputes } };
}

export async function upholdStaffDispute(
  input: z.infer<typeof resolveDisputeSchema>
): Promise<ActionResult> {
  const validated = resolveDisputeSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0]?.message };
  }

  const staffUserId = await requirePlatformAdminUserId();
  if (!staffUserId) {
    return { success: false, error: "Unauthorized" };
  }

  const result = await getOpenFlagForAdjudication(validated.data.flagId, {
    accountType: "individual",
  });
  if ("error" in result) {
    return { success: false, error: result.error };
  }

  const { flag } = result;
  const { resolutionNote } = validated.data;
  const now = new Date().toISOString();
  const supabase = createUntypedAdminClient();

  const { error: reviewError } = await removeReviewForUpheldDispute({
    supabase,
    reviewId: flag.review_id,
    organizationId: flag.organization_id,
    reason: flag.reason,
    resolutionNote,
  });

  if (reviewError) {
    console.error("Error removing staff-disputed review:", reviewError);
    return { success: false, error: "Failed to remove the review" };
  }

  const { error: flagError } = await resolveReviewFlag({
    supabase,
    flagId: flag.id,
    organizationId: flag.organization_id,
    status: "actioned",
    reviewedBy: staffUserId,
    reviewedAt: now,
    resolutionNote,
    resolutionVerdict: "upheld",
  });

  if (flagError) {
    console.error("Error updating staff dispute:", flagError);
    return { success: false, error: "Failed to update the dispute" };
  }

  await createDisputeAuditLog({
    supabase,
    organizationId: flag.organization_id,
    userId: staffUserId,
    action: "review_flag_staff_upheld",
    flagId: flag.id,
    reviewId: flag.review_id,
    verdict: "upheld",
    resolutionNote,
    reason: flag.reason,
    resolvedByPlatformStaff: true,
  });

  revalidatePath("/staff/disputes");
  revalidatePath("/dashboard/reviews");
  return { success: true };
}

export async function dismissStaffDispute(
  input: z.infer<typeof resolveDisputeSchema>
): Promise<ActionResult> {
  const validated = resolveDisputeSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0]?.message };
  }

  const staffUserId = await requirePlatformAdminUserId();
  if (!staffUserId) {
    return { success: false, error: "Unauthorized" };
  }

  const result = await getOpenFlagForAdjudication(validated.data.flagId, {
    accountType: "individual",
  });
  if ("error" in result) {
    return { success: false, error: result.error };
  }

  const { flag } = result;
  const { resolutionNote } = validated.data;
  const supabase = createUntypedAdminClient();
  const { error: flagError } = await resolveReviewFlag({
    supabase,
    flagId: flag.id,
    organizationId: flag.organization_id,
    status: "dismissed",
    reviewedBy: staffUserId,
    reviewedAt: new Date().toISOString(),
    resolutionNote,
    resolutionVerdict: "dismissed",
  });

  if (flagError) {
    console.error("Error dismissing staff dispute:", flagError);
    return { success: false, error: "Failed to dismiss the dispute" };
  }

  await createDisputeAuditLog({
    supabase,
    organizationId: flag.organization_id,
    userId: staffUserId,
    action: "review_flag_staff_dismissed",
    flagId: flag.id,
    reviewId: flag.review_id,
    verdict: "dismissed",
    resolutionNote,
    reason: flag.reason,
    resolvedByPlatformStaff: true,
  });

  revalidatePath("/staff/disputes");
  revalidatePath("/dashboard/reviews");
  return { success: true };
}
