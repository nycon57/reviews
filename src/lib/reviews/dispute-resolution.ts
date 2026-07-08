import type { UntypedSupabaseClient } from "@/lib/supabase/admin";

export type DisputeResolutionVerdict = "upheld" | "dismissed";

type ReviewFlagResolvedStatus = "actioned" | "dismissed";

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

interface DatabaseErrorLike {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

function isMissingResolutionVerdictColumn(error: DatabaseErrorLike): boolean {
  const haystack = [
    error.code,
    error.message,
    error.details,
    error.hint,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    haystack.includes("resolution_verdict") &&
    (haystack.includes("column") ||
      haystack.includes("schema cache") ||
      haystack.includes("pgrst204") ||
      haystack.includes("42703"))
  );
}

export async function resolveReviewFlag(
  params: ResolveReviewFlagParams
): Promise<{ error: DatabaseErrorLike | null }> {
  const payload = {
    status: params.status,
    reviewed_by: params.reviewedBy,
    reviewed_at: params.reviewedAt,
    resolution_note: params.resolutionNote,
    // TODO(database-types): remove the fallback below after
    // review_flags.resolution_verdict is present in generated database types.
    resolution_verdict: params.resolutionVerdict,
  };

  const { error } = await params.supabase
    .from("review_flags")
    .update(payload)
    .eq("id", params.flagId)
    .eq("organization_id", params.organizationId);

  if (!error || !isMissingResolutionVerdictColumn(error)) {
    return { error };
  }

  console.error(
    "review_flags.resolution_verdict is not available yet; resolving dispute without explicit verdict column",
    { flagId: params.flagId, status: params.status }
  );

  const fallback = await params.supabase
    .from("review_flags")
    .update({
      status: params.status,
      reviewed_by: params.reviewedBy,
      reviewed_at: params.reviewedAt,
      resolution_note: params.resolutionNote,
    })
    .eq("id", params.flagId)
    .eq("organization_id", params.organizationId);

  return { error: fallback.error };
}
