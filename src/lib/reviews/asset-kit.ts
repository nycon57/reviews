/**
 * Asset Kit auto-generation (CONTEXT.md § Asset Generation): queue quote-card
 * images for reviews at/above the org's celebration threshold the moment they
 * go public. Runs post-response via after(); failures never affect the
 * publish itself.
 */

import { after } from "next/server";
import { queueQuoteCardKitForReviews } from "@/lib/share-studio/service";
import { getCelebrationThreshold } from "@/lib/video-testimonials/public-actions";

export function queueQuoteCardKitAfterPublish(
  organizationId: string,
  reviewIds: string[],
  actorUserId: string
): void {
  if (!reviewIds.length) return;
  after(async () => {
    try {
      const minRating = await getCelebrationThreshold(organizationId);
      await queueQuoteCardKitForReviews({
        organizationId,
        reviewIds,
        actorUserId,
        minRating,
      });
    } catch (err) {
      console.error("Asset kit: quote card queue failed after publish", {
        organizationId,
        reviewIds,
        error: err,
      });
    }
  });
}
