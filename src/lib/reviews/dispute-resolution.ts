import type { UntypedSupabaseClient } from "@/lib/supabase/admin";
import { z } from "zod";
import {
  FLAG_REASON_LABELS,
  type ReviewFlagReason,
} from "./types";

export type DisputeResolutionVerdict = "upheld" | "dismissed";

type ReviewFlagResolvedStatus = "actioned" | "dismissed";

export const MIN_RESOLUTION_NOTE_LENGTH = 10;

export const resolveDisputeSchema = z.object({
  flagId: z.string().uuid(),
  resolutionNote: z
    .string()
    .trim()
    .min(
      MIN_RESOLUTION_NOTE_LENGTH,
      `Please add a resolution note of at least ${MIN_RESOLUTION_NOTE_LENGTH} characters`
    )
    .max(2000),
});

interface ResolveReviewFlagParams {
  supabase: UntypedSupabaseClient;
  flagId: string;
  organizationId: string;
  status: ReviewFlagResolvedStatus;
  reviewedBy: string;
  reviewedAt: string;
  resolutionNote: string | null;
  resolutionVerdict: DisputeResolutionVerdict;
}

export interface DatabaseErrorLike {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

type AccountType = "enterprise" | "individual";

export interface OpenFlagForAdjudication {
  id: string;
  review_id: string;
  organization_id: string;
  reason: ReviewFlagReason;
  status: string;
  organization: {
    account_type: string | null;
  } | null;
}

export async function resolveReviewFlag(
  params: ResolveReviewFlagParams
): Promise<{ error: DatabaseErrorLike | null }> {
  const { error } = await params.supabase
    .from("review_flags")
    .update({
      status: params.status,
      reviewed_by: params.reviewedBy,
      reviewed_at: params.reviewedAt,
      resolution_note: params.resolutionNote,
      resolution_verdict: params.resolutionVerdict,
    })
    .eq("id", params.flagId)
    .eq("organization_id", params.organizationId);

  return { error };
}

export async function getOpenFlagForAdjudication(
  flagId: string,
  options: { accountType: AccountType }
): Promise<{ flag: OpenFlagForAdjudication } | { error: string }> {
  const supabase = await createAdjudicationClient();
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
    if (error) console.error("Error fetching review dispute:", error);
    return { error: "Dispute not found" };
  }

  // `organization` is a to-one embed: PostgREST returns a single object, but the untyped client
  // widens it to an array, so normalise both shapes before reading account_type.
  const organization = (Array.isArray(data.organization) ? data.organization[0] : data.organization) ?? null;
  const flag: OpenFlagForAdjudication = { ...data, organization };
  if (flag.status !== "pending") {
    return { error: "This dispute has already been resolved" };
  }

  const isEnterprise = flag.organization?.account_type === "enterprise";
  if (options.accountType === "enterprise" && !isEnterprise) {
    return { error: "Disputes for individual accounts are reviewed by RepWell." };
  }
  if (options.accountType === "individual" && isEnterprise) {
    return { error: "Enterprise disputes must be resolved in the organization dashboard" };
  }

  return { flag };
}

export async function removeReviewForUpheldDispute(params: {
  supabase: UntypedSupabaseClient;
  reviewId: string;
  organizationId: string;
  reason: ReviewFlagReason;
  resolutionNote: string;
}): Promise<{ error: DatabaseErrorLike | null }> {
  const { error } = await params.supabase
    .from("reviews")
    .update({
      status: "rejected",
      is_published: false,
      published_at: null,
      rejection_reason: `Dispute upheld (${FLAG_REASON_LABELS[params.reason] ?? params.reason}): ${params.resolutionNote}`,
    })
    .eq("id", params.reviewId)
    .eq("organization_id", params.organizationId);

  return { error };
}

async function createAdjudicationClient(): Promise<UntypedSupabaseClient> {
  const { createUntypedAdminClient } = await import("@/lib/supabase/admin");
  return createUntypedAdminClient();
}

export async function createDisputeAuditLog(params: {
  supabase: UntypedSupabaseClient;
  organizationId: string;
  userId: string;
  action: string;
  flagId: string;
  reviewId: string;
  reason: ReviewFlagReason;
  verdict: DisputeResolutionVerdict;
  resolutionNote: string | null;
  resolvedByPlatformStaff?: boolean;
}): Promise<void> {
  try {
    const { error } = await params.supabase.from("organization_audit_logs").insert({
      organization_id: params.organizationId,
      user_id: params.userId,
      action: params.action,
      entity_type: "review_flag",
      entity_id: params.flagId,
      old_values: null,
      new_values: {
        flag_id: params.flagId,
        review_id: params.reviewId,
        verdict: params.verdict,
        resolution_note: params.resolutionNote,
        reason: params.reason,
        resolved_by_platform_staff: params.resolvedByPlatformStaff === true,
      },
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to create dispute audit log:", error);
    }
  } catch (error) {
    console.error("Failed to create dispute audit log:", error);
  }
}
