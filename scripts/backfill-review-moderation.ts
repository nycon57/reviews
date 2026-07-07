/**
 * Backfill machine moderation for pre-inversion pending reviews.
 *
 * Under the publish-inversion model, 'pending' means machine-quarantined
 * awaiting human release. Reviews created before the inversion sit in
 * 'pending' without ever being screened — this script screens them and
 * auto-publishes the ones that pass.
 *
 * Idempotent: only touches rows where moderation_checked_at IS NULL.
 * Skips source='direct' rows that haven't completed email verification.
 *
 * Run: npx tsx --env-file=.env scripts/backfill-review-moderation.ts
 */
import { createClient } from "@supabase/supabase-js";
import { screenReviewText } from "../src/lib/reviews/moderation";

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("id, text, customer_name, source, verified_at")
    .eq("status", "pending")
    .is("moderation_checked_at", null);

  if (error) throw new Error(`Failed to load pending reviews: ${error.message}`);

  const summary = { total: reviews?.length ?? 0, published: 0, quarantined: 0, skipped: 0, failed: 0 };

  for (const review of reviews ?? []) {
    // Direct reviews awaiting email verification are not ready to screen
    if (review.source === "direct" && !review.verified_at) {
      summary.skipped++;
      console.log(`skip   ${review.id} (direct, unverified)`);
      continue;
    }

    const moderation = await screenReviewText(review.text ?? "", review.customer_name);
    const publish = moderation.verdict === "pass";
    const now = new Date().toISOString();

    const update: Record<string, unknown> = {
      moderation_verdict: moderation.verdict,
      moderation_reasons: moderation.reasons,
      moderation_checked_at: now,
      moderation_provider: moderation.provider,
    };

    if (publish) {
      update.status = "approved";
      update.is_published = true;
      update.approved_at = now;
      update.published_at = now;
    }

    const { error: updateError } = await supabase
      .from("reviews")
      .update(update)
      .eq("id", review.id)
      .eq("status", "pending");

    if (updateError) {
      summary.failed++;
      console.error(`error  ${review.id}: ${updateError.message}`);
      continue;
    }

    if (publish) {
      summary.published++;
      console.log(`pass   ${review.id} → published`);
    } else {
      summary.quarantined++;
      console.log(`quar   ${review.id} (${moderation.reasons.join(", ")})`);
    }
  }

  console.log(
    `\nDone. ${summary.total} pending reviews: ${summary.published} published, ` +
      `${summary.quarantined} quarantined, ${summary.skipped} skipped, ${summary.failed} failed.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
