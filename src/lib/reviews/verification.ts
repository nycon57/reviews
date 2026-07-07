/**
 * Email verification for direct (pro-page) review submissions.
 *
 * Anonymous submissions stay unpublished until the reviewer clicks the link
 * in their verification email. On verification, reviews that passed machine
 * screening publish immediately; quarantined reviews stay pending for the
 * release queue.
 */

import { createHash, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { queueQuoteCardKitAfterPublish } from "@/lib/reviews/asset-kit";
import {
  notifyReviewNeedsResponse,
  notifyReviewPublished,
} from "@/lib/reviews/notifications";
import { getCelebrationThreshold } from "@/lib/video-testimonials/public-actions";
import { checkAllMilestonesForReview } from "@/lib/milestones/actions";
import { findOrCreateContact } from "@/lib/contacts/actions";

/** Single source of truth for verification token crypto (raw token emailed, only the hash stored). */
export function generateVerificationToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString("hex");
  return { rawToken, tokenHash: hashVerificationToken(rawToken) };
}

export function hashVerificationToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export type VerifyDirectReviewResult =
  | { outcome: "invalid" }
  | {
      outcome: "published" | "quarantined";
      reviewId: string;
      professionalName: string | null;
      professionalSlug: string | null;
      /** Published review met the celebration threshold: offer the video upsell */
      showVideoUpsell: boolean;
    };

export async function verifyDirectReview(
  rawToken: string
): Promise<VerifyDirectReviewResult> {
  if (!/^[a-f0-9]{64}$/i.test(rawToken)) {
    return { outcome: "invalid" };
  }

  const tokenHash = hashVerificationToken(rawToken);
  const supabase = createAdminClient();

  // TODO: Remove type assertion after running db:push && db:types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: review, error } = await (supabase as any)
    .from("reviews")
    .select(
      "id, organization_id, user_id, rating, customer_name, customer_email, moderation_verdict"
    )
    .eq("verification_token_hash", tokenHash)
    .is("verified_at", null)
    .maybeSingle();

  if (error || !review) {
    if (error) {
      console.error("Error looking up review verification token:", error);
    }
    return { outcome: "invalid" };
  }

  const now = new Date().toISOString();
  const passed = review.moderation_verdict === "pass";

  // The professional lookup only depends on review.user_id, so run it
  // concurrently with the verifying UPDATE instead of waiting for the update.
  // TODO: Remove type assertion after running db:push && db:types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePromise = (supabase as any)
    .from("reviews")
    .update({
      verified_at: now,
      verification_token_hash: null,
      ...(passed
        ? {
            status: "approved",
            is_published: true,
            published_at: now,
            approved_at: now,
          }
        : {}),
    })
    .eq("id", review.id)
    .is("verified_at", null)
    .select("id");

  // Look up the professional for the confirmation page link
  const proPromise = supabase
    .from("users")
    .select("full_name, slug")
    .eq("id", review.user_id)
    .maybeSingle();

  const [{ data: verifiedRows, error: updateError }, { data: pro }] =
    await Promise.all([updatePromise, proPromise]);

  if (updateError) {
    console.error("Error verifying review:", updateError);
    return { outcome: "invalid" };
  }

  // Concurrency guard: the `.is("verified_at", null)` filter means a second
  // concurrent verify (e.g. a double-click) updates zero rows. Only the request
  // that actually flipped the row runs the one-time publish side effects.
  const isFirstVerification =
    Array.isArray(verifiedRows) && verifiedRows.length === 1;

  // Contact resolution happens at VERIFICATION, not submission: the email is
  // only proven here (ADR 0004). Link on the first verification regardless of
  // moderation outcome — a quarantined reviewer still proved their email — so
  // dedup and suppression cover them. Owner = the professional the review is
  // for. Best-effort: never fail verification over Contact linkage.
  if (isFirstVerification && review.customer_email) {
    try {
      const contact = await findOrCreateContact(
        review.organization_id,
        { email: review.customer_email, name: review.customer_name },
        review.user_id,
        "direct_review"
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("reviews")
        .update({ contact_id: contact.id })
        .eq("id", review.id);
    } catch (contactError) {
      console.error("verifyDirectReview: contact link failed", contactError);
    }
  }

  let showVideoUpsell = false;

  if (passed && isFirstVerification) {
    queueQuoteCardKitAfterPublish(
      review.organization_id,
      [review.id],
      review.user_id
    );

    const threshold = await getCelebrationThreshold(review.organization_id);
    const belowThreshold = review.rating < threshold;

    await notifyReviewPublished({
      reviewId: review.id,
      organizationId: review.organization_id,
      ownerUserId: review.user_id,
      customerName: review.customer_name,
      rating: review.rating,
      belowThreshold,
    });

    if (belowThreshold) {
      await notifyReviewNeedsResponse({
        reviewId: review.id,
        organizationId: review.organization_id,
        ownerUserId: review.user_id,
        customerName: review.customer_name,
        rating: review.rating,
      });
    } else {
      showVideoUpsell = true;
    }

    // Cheapest-correct milestone detection (populates the pending queue that
    // the process-milestone-emails cron drains). Best-effort: never block or
    // fail publish over a milestone check.
    await checkAllMilestonesForReview(
      review.user_id,
      review.organization_id,
      review.user_id,
      review.rating
    ).catch((error) => {
      console.error("Error checking review milestones:", error);
    });
  }

  return {
    outcome: passed ? "published" : "quarantined",
    reviewId: review.id,
    professionalName: pro?.full_name ?? null,
    professionalSlug: pro?.slug ?? null,
    showVideoUpsell,
  };
}
