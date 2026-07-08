"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformAdmin, unifiedGetUser } from "@/lib/auth/actions";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  FLAG_REASON_LABELS,
  type ActionResult,
  type ReviewFlagReason,
} from "./types";
import { resolveReviewFlag } from "./dispute-resolution";

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

interface OpenFlagForStaff {
  id: string;
  review_id: string;
  organization_id: string;
  reason: ReviewFlagReason;
  status: string;
  organization: {
    account_type: string | null;
  } | null;
}

async function requirePlatformAdminUserId(): Promise<string | null> {
  await requirePlatformAdmin();
  const user = await unifiedGetUser();
  return user?.id ?? null;
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

async function getOpenFlagForStaffAdjudication(
  flagId: string
): Promise<{ flag: OpenFlagForStaff } | { error: string }> {
  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("review_flags")
    .select(
      `
      id,
      review_id,
      organization_id,
      reason,
      status,
      organization:organizations!organization_id (
        account_type
      )
    `
    )
    .eq("id", flagId)
    .single();

  if (error || !data) {
    if (error) console.error("Error fetching staff dispute:", error);
    return { error: "Dispute not found" };
  }

  const flag = data as unknown as OpenFlagForStaff;
  if (flag.status !== "pending") {
    return { error: "This dispute has already been resolved" };
  }

  if (flag.organization?.account_type === "enterprise") {
    return { error: "Enterprise disputes must be resolved in the organization dashboard" };
  }

  return { flag };
}

async function createStaffDisputeAuditLog(params: {
  organizationId: string;
  staffUserId: string;
  flagId: string;
  reviewId: string;
  action: "review_flag_staff_upheld" | "review_flag_staff_dismissed";
  verdict: "upheld" | "dismissed";
  note: string;
  reason: ReviewFlagReason;
}) {
  try {
    const supabase = createUntypedAdminClient();
    const { error } = await supabase.from("organization_audit_logs").insert({
      organization_id: params.organizationId,
      user_id: params.staffUserId,
      action: params.action,
      entity_type: "review_flag",
      entity_id: params.flagId,
      new_values: {
        flag_id: params.flagId,
        review_id: params.reviewId,
        verdict: params.verdict,
        resolution_note: params.note,
        reason: params.reason,
        resolved_by_platform_staff: true,
      },
    });

    if (error) {
      console.error("Failed to create staff dispute audit log:", error);
    }
  } catch (error) {
    console.error("Failed to create staff dispute audit log:", error);
  }
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

  const disputes = ((data ?? []) as unknown as StaffDisputeRow[])
    .filter((row) => row.organization?.account_type !== "enterprise")
    .map(mapStaffDispute);

  return { success: true, data: { disputes } };
}

const resolveStaffDisputeSchema = z.object({
  flagId: z.string().uuid(),
  resolutionNote: z
    .string()
    .trim()
    .min(10, "Please add a resolution note of at least 10 characters")
    .max(2000),
});

export async function upholdStaffDispute(
  input: z.infer<typeof resolveStaffDisputeSchema>
): Promise<ActionResult> {
  const validated = resolveStaffDisputeSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0]?.message };
  }

  const staffUserId = await requirePlatformAdminUserId();
  if (!staffUserId) {
    return { success: false, error: "Unauthorized" };
  }

  const result = await getOpenFlagForStaffAdjudication(validated.data.flagId);
  if ("error" in result) {
    return { success: false, error: result.error };
  }

  const { flag } = result;
  const { resolutionNote } = validated.data;
  const now = new Date().toISOString();
  const supabase = createUntypedAdminClient();

  const { error: reviewError } = await supabase
    .from("reviews")
    .update({
      status: "rejected",
      is_published: false,
      published_at: null,
      rejection_reason: `Dispute upheld (${FLAG_REASON_LABELS[flag.reason] ?? flag.reason}): ${resolutionNote}`,
    })
    .eq("id", flag.review_id)
    .eq("organization_id", flag.organization_id);

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

  await createStaffDisputeAuditLog({
    organizationId: flag.organization_id,
    staffUserId,
    flagId: flag.id,
    reviewId: flag.review_id,
    action: "review_flag_staff_upheld",
    verdict: "upheld",
    note: resolutionNote,
    reason: flag.reason,
  });

  revalidatePath("/staff/disputes");
  revalidatePath("/dashboard/reviews");
  return { success: true };
}

export async function dismissStaffDispute(
  input: z.infer<typeof resolveStaffDisputeSchema>
): Promise<ActionResult> {
  const validated = resolveStaffDisputeSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0]?.message };
  }

  const staffUserId = await requirePlatformAdminUserId();
  if (!staffUserId) {
    return { success: false, error: "Unauthorized" };
  }

  const result = await getOpenFlagForStaffAdjudication(validated.data.flagId);
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

  await createStaffDisputeAuditLog({
    organizationId: flag.organization_id,
    staffUserId,
    flagId: flag.id,
    reviewId: flag.review_id,
    action: "review_flag_staff_dismissed",
    verdict: "dismissed",
    note: resolutionNote,
    reason: flag.reason,
  });

  revalidatePath("/staff/disputes");
  revalidatePath("/dashboard/reviews");
  return { success: true };
}
