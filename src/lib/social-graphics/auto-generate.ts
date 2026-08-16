"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import { getTemplate, selectBestTemplate } from "./templates";
import type {
  ActionResult,
  AutoGenerateInput,
  CanvasSize,
  ReviewForGraphic,
  SocialProofGraphic,
  TemplateId,
} from "./types";
import type { Json } from "@/types/database.types";

/**
 * Canvas types are declared as interfaces, so TypeScript will not structurally match them to the
 * `Json` column type even though they hold nothing but JSON data. The conversion lives here rather
 * than at each insert site. Counterpart to `parseCanvasSize` / `parseElements` in `./types`.
 */
function toJsonColumn<T>(value: T): Json {
  // SAFETY: canvas sizes and elements are plain serialisable data — numbers, strings and nested
  // object/array literals built in this codebase, never functions, class instances, or cycles.
  return value as Json;
}

const DEFAULT_CANVAS: CanvasSize = { width: 1080, height: 1080, name: "Instagram Post" };

/** Fetch a review and its LO data for graphic generation */
async function fetchReviewData(
  supabase: ReturnType<typeof createAdminClient>,
  reviewId: string,
  organizationId: string
): Promise<ActionResult<{
  review: ReviewForGraphic;
  loanOfficer: { id: string; fullName: string; avatarUrl: string | null; totalReviews: number; averageRating: number } | null;
}>> {
  const { data: reviewRow, error: reviewError } = await supabase
    .from("reviews")
    .select("id, rating, text, customer_name, review_date, source, user_id")
    .eq("id", reviewId)
    .eq("organization_id", organizationId)
    .single();

  if (reviewError || !reviewRow) {
    return { success: false, error: "Review not found" };
  }

  const review: ReviewForGraphic = {
    id: reviewRow.id,
    rating: reviewRow.rating,
    text: reviewRow.text,
    customerName: reviewRow.customer_name,
    reviewDate: reviewRow.review_date,
    source: reviewRow.source,
  };

  let loanOfficer = null;
  if (reviewRow.user_id) {
    const { data: lo } = await supabase
      .from("users")
      .select("id, full_name, avatar_url, total_reviews, average_rating")
      .eq("id", reviewRow.user_id)
      .single();

    if (lo) {
      loanOfficer = {
        id: lo.id,
        fullName: lo.full_name ?? "Team Member",
        avatarUrl: lo.avatar_url,
        totalReviews: lo.total_reviews ?? 0,
        averageRating: lo.average_rating ?? 4.8,
      };

      review.loanOfficerName = lo.full_name;
    }
  }

  return { success: true, data: { review, loanOfficer } };
}

/** Auto-generate a graphic from a single review */
export async function autoGenerateFromReview(
  input: AutoGenerateInput
): Promise<ActionResult<SocialProofGraphic>> {
  const user = await unifiedGetUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { success: false, error: "User missing organization" };
  }

  const orgId = userData.organization_id;

  // Fetch review data
  const reviewResult = await fetchReviewData(supabase, input.reviewId, orgId);
  if (!reviewResult.success) return reviewResult;

  const { review, loanOfficer } = reviewResult.data;

  // Select template
  const templateId: TemplateId =
    input.templateId ??
    selectBestTemplate({
      rating: review.rating,
      hasLoanOfficer: !!loanOfficer,
      reviewCount: 1,
    });

  const template = getTemplate(templateId);
  if (!template) {
    return { success: false, error: `Template "${templateId}" not found` };
  }

  // Get org name
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single();

  const canvasSize = input.canvasSize ?? DEFAULT_CANVAS;

  // Generate elements
  const elements = template.generate({
    canvasSize,
    review,
    loanOfficer: loanOfficer ?? undefined,
    orgName: org?.name ?? "Your Company",
  });

  // Save graphic
  const graphicName = `${template.metadata.name} - ${review.customerName ?? "Review"}`;

  const { data, error } = await supabase
    .from("social_proof_graphics")
    .insert({
      organization_id: orgId,
      created_by: user.id,
      name: graphicName,
      canvas_size: toJsonColumn(canvasSize),
      elements: toJsonColumn(elements),
      template_id: templateId,
      review_ids: [input.reviewId],
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/social-graphics");
  return { success: true, data };
}
