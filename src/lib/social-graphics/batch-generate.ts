"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import { getTemplate } from "./templates";
import type {
  ActionResult,
  BatchGenerateInput,
  ReviewForGraphic,
  SocialProofGraphic,
} from "./types";

/** Batch generate graphics: one per review using a single template */
export async function batchGenerateFromReviews(
  input: BatchGenerateInput
): Promise<ActionResult<SocialProofGraphic[]>> {
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

  const template = getTemplate(input.templateId);
  if (!template) {
    return { success: false, error: `Template "${input.templateId}" not found` };
  }

  // Fetch all reviews in one query
  const { data: reviewRows, error: reviewError } = await supabase
    .from("reviews")
    .select("id, rating, text, customer_name, review_date, source, user_id")
    .in("id", input.reviewIds)
    .eq("organization_id", orgId);

  if (reviewError || !reviewRows?.length) {
    return { success: false, error: "No reviews found" };
  }

  // Get org name
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single();

  const orgName = org?.name ?? "Your Company";

  // Generate one graphic per review
  const inserts = reviewRows.map((row) => {
    const review: ReviewForGraphic = {
      id: row.id,
      rating: row.rating,
      text: row.text,
      customerName: row.customer_name,
      reviewDate: row.review_date,
      source: row.source,
    };

    const elements = template.generate({
      canvasSize: input.canvasSize,
      review,
      orgName,
    });

    return {
      organization_id: orgId,
      created_by: user.id,
      name: `${template.metadata.name} - ${review.customerName ?? "Review"}`,
      canvas_size: input.canvasSize,
      elements,
      template_id: input.templateId,
      review_ids: [row.id],
    };
  });

  const { data, error } = await supabase
    .from("social_proof_graphics")
    .insert(inserts)
    .select();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/social-graphics");
  return { success: true, data: data ?? [] };
}
