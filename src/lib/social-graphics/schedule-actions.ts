"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import { getTemplate } from "./templates";
import type {
  ActionResult,
  CanvasSize,
  ReviewForGraphic,
  SocialProofGraphic,
  TemplateId,
} from "./types";
import type { Json } from "@/types/database.types";

const GRAPHICS_PATH = "/dashboard/social-graphics";
const DEFAULT_CANVAS: CanvasSize = {
  width: 1080,
  height: 1080,
  name: "Instagram Post",
};

/** Update the schedule_cron on a graphic (or create a schedule placeholder) */
export async function setSchedule(params: {
  templateId: TemplateId;
  canvasSize: CanvasSize;
  cronExpression: string;
}): Promise<ActionResult<SocialProofGraphic>> {
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

  const template = getTemplate(params.templateId);
  if (!template) {
    return { success: false, error: `Template not found: ${params.templateId}` };
  }

  // Create or update schedule graphic placeholder
  const { data, error } = await supabase
    .from("social_proof_graphics")
    .insert({
      organization_id: orgId,
      created_by: user.id,
      name: `Review of the Week (${template.metadata.name})`,
      canvas_size: params.canvasSize as unknown as Json,
      elements: [] as unknown as Json,
      template_id: params.templateId,
      schedule_cron: params.cronExpression,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath(GRAPHICS_PATH);
  return { success: true, data };
}

/** Remove a schedule from a graphic */
export async function removeSchedule(
  graphicId: string
): Promise<ActionResult<void>> {
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

  const { error } = await supabase
    .from("social_proof_graphics")
    .update({ schedule_cron: null, updated_at: new Date().toISOString() })
    .eq("id", graphicId)
    .eq("organization_id", userData.organization_id);

  if (error) return { success: false, error: error.message };

  revalidatePath(GRAPHICS_PATH);
  return { success: true, data: undefined };
}

/**
 * Execute scheduled generation: pick the top unfeature review from the past
 * week and generate a graphic with the configured template.
 * Called by the cron API route.
 */
export async function executeScheduledGeneration(
  organizationId: string,
  graphic: SocialProofGraphic
): Promise<ActionResult<SocialProofGraphic>> {
  const supabase = createAdminClient();
  const templateId = graphic.template_id as TemplateId | null;
  if (!templateId) {
    return { success: false, error: "No template configured for schedule" };
  }

  const template = getTemplate(templateId);
  if (!template) {
    return { success: false, error: `Template not found: ${templateId}` };
  }

  // Find the highest-rated review from the past 7 days not previously featured
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Get review IDs already used in graphics (capped to recent 500 to limit data transfer)
  const { data: existingGraphics } = await supabase
    .from("social_proof_graphics")
    .select("review_ids")
    .eq("organization_id", organizationId)
    .not("review_ids", "is", null)
    .order("created_at", { ascending: false })
    .limit(500);

  const usedReviewIds = new Set<string>();
  for (const g of existingGraphics ?? []) {
    if (Array.isArray(g.review_ids)) {
      for (const rid of g.review_ids) {
        if (typeof rid === "string") usedReviewIds.add(rid);
      }
    }
  }

  // Query recent top reviews
  const { data: recentReviews, error: reviewError } = await supabase
    .from("reviews")
    .select("id, rating, text, customer_name, review_date, source")
    .eq("organization_id", organizationId)
    .eq("status", "approved")
    .gte("review_date", oneWeekAgo.toISOString())
    .order("rating", { ascending: false })
    .order("review_date", { ascending: false })
    .limit(20);

  if (reviewError || !recentReviews?.length) {
    return { success: false, error: "No eligible reviews found this week" };
  }

  // Pick the first review not already featured
  const selectedRow = recentReviews.find((r) => !usedReviewIds.has(r.id));
  if (!selectedRow) {
    return { success: false, error: "All recent reviews already featured" };
  }

  const review: ReviewForGraphic = {
    id: selectedRow.id,
    rating: selectedRow.rating,
    text: selectedRow.text,
    customerName: selectedRow.customer_name,
    reviewDate: selectedRow.review_date,
    source: selectedRow.source,
  };

  // Get org name
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .single();

  const canvasSize: CanvasSize =
    (graphic.canvas_size as unknown as CanvasSize) ?? DEFAULT_CANVAS;

  const elements = template.generate({
    canvasSize,
    review,
    orgName: org?.name ?? "Your Company",
  });

  // Create a new graphic
  const { data: newGraphic, error: insertError } = await supabase
    .from("social_proof_graphics")
    .insert({
      organization_id: organizationId,
      created_by: graphic.created_by,
      name: `Review of the Week - ${review.customerName ?? "Review"}`,
      canvas_size: canvasSize as unknown as Json,
      elements: elements as unknown as Json,
      template_id: templateId,
      review_ids: [review.id],
    })
    .select()
    .single();

  if (insertError) return { success: false, error: insertError.message };

  // Update last_generated_at on the schedule graphic
  await supabase
    .from("social_proof_graphics")
    .update({
      last_generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", graphic.id);

  return { success: true, data: newGraphic };
}
