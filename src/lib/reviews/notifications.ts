/**
 * In-app notifications for the review record. Under the publish-inversion
 * model negative reviews go live immediately, so the pro is pointed at the
 * response composer instead of an approval queue.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

export async function notifyReviewNeedsResponse(params: {
  reviewId: string;
  organizationId: string;
  ownerUserId: string;
  customerName: string | null;
  rating: number;
}): Promise<void> {
  const supabase = createAdminClient();
  const customer = params.customerName || "A customer";

  const { error } = await supabase.from("notifications").insert({
    user_id: params.ownerUserId,
    organization_id: params.organizationId,
    type: "review_needs_response",
    title: "A new review could use your response",
    message: `${customer} left a ${params.rating}-star review. It is live now; a thoughtful public response goes a long way.`,
    action_url: `/dashboard/reviews/${params.reviewId}`,
    metadata: {
      event: "review_needs_response",
      review_id: params.reviewId,
      customer_name: params.customerName,
      rating: params.rating,
      created_at: new Date().toISOString(),
    } as Json,
  });

  if (error) {
    console.error("Error creating review-needs-response notification:", error);
  }
}
