import {
  createUntypedAdminClient,
  type UntypedSupabaseClient,
} from "@/lib/supabase/admin";
import { sendReviewResponseEmail } from "@/lib/email/send";

type ReviewResponseConfirmationRow = {
  id: string;
  source: string | null;
  source_review_id: string | null;
  organization_id: string;
  user_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  rating: number | null;
  text: string | null;
  response_text: string | null;
  response_status: string | null;
  is_published: boolean | null;
  users?: { full_name: string | null } | Array<{ full_name: string | null }> | null;
  organizations?: { name: string | null } | Array<{ name: string | null }> | null;
};

export type ReviewResponseConfirmationResult =
  | { sent: true; email: string }
  | {
      sent: false;
      reason:
        | "review_not_found"
        | "review_not_published"
        | "response_not_public"
        | "missing_email"
        | "send_failed";
      error?: unknown;
    };

async function resolveVideoReviewer(
  supabase: UntypedSupabaseClient,
  sourceReviewId: string | null
): Promise<{ email: string | null; name: string | null }> {
  if (!sourceReviewId) {
    return { email: null, name: null };
  }

  const { data: response } = await supabase
    .from("video_testimonial_responses")
    .select("request_id")
    .eq("id", sourceReviewId)
    .maybeSingle();

  const requestId = (response as { request_id?: string | null } | null)?.request_id;
  if (!requestId) {
    return { email: null, name: null };
  }

  const { data: request } = await supabase
    .from("video_testimonial_requests")
    .select("customer_email, customer_name")
    .eq("id", requestId)
    .maybeSingle();

  const reviewer = request as {
    customer_email?: string | null;
    customer_name?: string | null;
  } | null;

  return {
    email: reviewer?.customer_email ?? null,
    name: reviewer?.customer_name ?? null,
  };
}

async function resolveReviewer(
  supabase: UntypedSupabaseClient,
  review: ReviewResponseConfirmationRow
): Promise<{ email: string | null; name: string | null }> {
  if (review.customer_email) {
    return { email: review.customer_email, name: review.customer_name };
  }

  if (review.source === "video_testimonial") {
    const videoReviewer = await resolveVideoReviewer(
      supabase,
      review.source_review_id
    );
    return {
      email: videoReviewer.email,
      name: videoReviewer.name ?? review.customer_name,
    };
  }

  return { email: null, name: review.customer_name };
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

/**
 * Sends the reviewer-facing confirmation for a public response.
 *
 * The guard is source-agnostic: a confirmation can go to any review that is
 * published, has a non-draft public response, and has a reachable reviewer
 * email either on `reviews.customer_email` or via video testimonial linkage.
 */
export async function sendReviewResponseConfirmationEmail(params: {
  reviewId: string;
  organizationId: string;
  responseText?: string | null;
  supabase?: UntypedSupabaseClient;
}): Promise<ReviewResponseConfirmationResult> {
  const supabase = params.supabase ?? createUntypedAdminClient();

  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      id,
      source,
      source_review_id,
      organization_id,
      user_id,
      customer_name,
      customer_email,
      rating,
      text,
      response_text,
      response_status,
      is_published,
      users!user_id(full_name),
      organizations!inner(name)
    `
    )
    .eq("id", params.reviewId)
    .eq("organization_id", params.organizationId)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("Failed to load review for response confirmation:", error);
    }
    return { sent: false, reason: "review_not_found", error };
  }

  const review = data as unknown as ReviewResponseConfirmationRow;
  if (review.is_published !== true) {
    return { sent: false, reason: "review_not_published" };
  }

  const responseText = params.responseText ?? review.response_text;
  if (!responseText || review.response_status === "draft") {
    return { sent: false, reason: "response_not_public" };
  }

  const reviewer = await resolveReviewer(supabase, review);
  if (!reviewer.email) {
    return { sent: false, reason: "missing_email" };
  }

  const loanOfficer = firstRelation(review.users);
  const organization = firstRelation(review.organizations);

  try {
    const result = await sendReviewResponseEmail({
      toEmail: reviewer.email,
      toName: reviewer.name || undefined,
      customerName: reviewer.name || "Valued Customer",
      loanOfficerName: loanOfficer?.full_name ?? "Team Member",
      organizationName: organization?.name ?? "our team",
      originalReviewText: review.text || null,
      responseText,
      rating: review.rating ?? 5,
      organizationId: review.organization_id,
      loanOfficerId: review.user_id ?? undefined,
    });
    if (!result.success) {
      return { sent: false, reason: "send_failed", error: result.error };
    }
    return { sent: true, email: reviewer.email };
  } catch (error) {
    console.error("Failed to send review response email:", error);
    return { sent: false, reason: "send_failed", error };
  }
}
