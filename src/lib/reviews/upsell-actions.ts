"use server";

/**
 * Server action behind the "Record a video" button on the review
 * verification success page. Creates (or reuses) the upsell video
 * testimonial request and sends the customer into the recording flow.
 */

import { redirect } from "next/navigation";
import { createVideoRequestForReview } from "@/lib/video-testimonials/upsell";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function startReviewVideoUpsell(formData: FormData): Promise<void> {
  const reviewId = formData.get("reviewId");
  const fallbackSlug = formData.get("professionalSlug");
  const fallbackUrl =
    typeof fallbackSlug === "string" && /^[a-z0-9-]+$/i.test(fallbackSlug)
      ? `/pro/${fallbackSlug}`
      : "/";

  if (typeof reviewId !== "string" || !UUID_PATTERN.test(reviewId)) {
    redirect(fallbackUrl);
  }

  // Eligibility (published direct review) is enforced inside the helper,
  // so a forged reviewId cannot mint a request for anything else.
  const request = await createVideoRequestForReview({ reviewId });

  redirect(request ? request.url : fallbackUrl);
}
