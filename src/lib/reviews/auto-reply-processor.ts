import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  generateResponseSuggestion,
  type ResponseTone,
  type ReviewContext,
} from "@/lib/ai/response-suggestions";
import { sendReviewResponseEmail } from "@/lib/email/send";
import { createNotification } from "@/lib/notifications/actions";
import { coerceAutoReplySettings, hasAutoReplyFeature } from "./auto-reply-config";
import { sanitizeExternalText } from "./utils";

interface ProcessResult {
  processed: number;
  failed: number;
  skipped: number;
  errors: string[];
}

/**
 * Process a batch of auto-reply queue items.
 * Called by the cron endpoint every 15 minutes.
 */
export async function processAutoReplyBatch(
  batchSize = 20
): Promise<ProcessResult> {
  const result: ProcessResult = { processed: 0, failed: 0, skipped: 0, errors: [] };

  const supabase = createUntypedAdminClient();

  // Fetch eligible pending items
  const { data: queueItems, error: fetchError } = await supabase
    .from("auto_reply_queue")
    .select("*")
    .eq("status", "pending")
    .lte("eligible_at", new Date().toISOString())
    .lt("retry_count", 3)
    .order("eligible_at", { ascending: true })
    .limit(batchSize);

  if (fetchError) {
    console.error("Failed to fetch auto-reply queue:", fetchError);
    return result;
  }

  if (!queueItems || queueItems.length === 0) {
    return result;
  }

  for (const item of queueItems) {
    try {
      const shouldSkip = await checkSkipConditions(supabase, item);
      if (shouldSkip) {
        // Mark cancelled
        await supabase
          .from("auto_reply_queue")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", item.id);
        result.skipped++;
        continue;
      }

      // Optimistic lock: set to processing
      const { data: lockData, error: lockError } = await supabase
        .from("auto_reply_queue")
        .update({
          status: "processing",
          attempted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id)
        .eq("status", "pending")
        .select();

      if (lockError || !lockData || lockData.length === 0) {
        result.skipped++;
        continue;
      }

      await processQueueItem(supabase, item);
      result.processed++;

      // Throttle AI calls
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(`Review ${item.review_id}: ${errMsg}`);
      result.failed++;

      // Increment retry or mark failed
      const newRetryCount = (item.retry_count || 0) + 1;
      await supabase
        .from("auto_reply_queue")
        .update({
          status: newRetryCount >= 3 ? "failed" : "pending",
          retry_count: newRetryCount,
          error_message: errMsg,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);
    }
  }

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkSkipConditions(supabase: any, item: any): Promise<boolean> {
  // 1. Check org tier + auto_reply_enabled
  const { data: org } = await supabase
    .from("organizations")
    .select("subscription_tier, settings")
    .eq("id", item.organization_id)
    .single();

  if (!org) return true;
  if (!hasAutoReplyFeature(org.subscription_tier)) return true;

  const settings = coerceAutoReplySettings(org.settings);
  if (!settings.auto_reply_enabled) return true;

  // 2. Check LO opt-out
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("auto_reply_opt_out")
    .eq("user_id", item.user_id)
    .single();

  if (prefs?.auto_reply_opt_out) return true;

  // 3. Check review already has a response
  const { data: review } = await supabase
    .from("reviews")
    .select("response_text, response_status")
    .eq("id", item.review_id)
    .single();

  if (!review) return true;
  if (review.response_text || review.response_status === "posted") return true;

  return false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processQueueItem(supabase: any, item: any): Promise<void> {
  // Fetch review with context
  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .select(`
      id, source, source_review_id, user_id, customer_name, customer_email,
      rating, text, sentiment_score, sentiment_label, themes, key_phrases,
      review_date, organization_id,
      users!user_id(full_name),
      organizations!inner(name)
    `)
    .eq("id", item.review_id)
    .single();

  if (reviewError || !review) {
    throw new Error(`Review ${item.review_id} not found`);
  }

  const loanOfficer = review.users as { full_name: string } | null;
  const organization = review.organizations as unknown as { name: string };

  // Build review context for AI (sanitize external text to prevent prompt injection)
  const reviewContext: ReviewContext = {
    text: sanitizeExternalText(review.text ?? ''),
    rating: review.rating,
    customerName: sanitizeExternalText(review.customer_name ?? ''),
    loanOfficerName: loanOfficer?.full_name ?? "Team Member",
    source: review.source,
    sentimentScore: review.sentiment_score,
    sentimentLabel: review.sentiment_label,
    themes: (review.themes as string[] | null)?.map((t: string) => sanitizeExternalText(t)) as ReviewContext["themes"],
    keyPhrases: (review.key_phrases as string[] | null)?.map((p: string) => sanitizeExternalText(p)) ?? undefined,
  };

  // Generate AI response
  const tone = (item.tone || "professional") as ResponseTone;
  const suggestion = await generateResponseSuggestion(reviewContext, tone);
  const now = new Date().toISOString();

  // Critical: Update the review with the response
  const { error: updateError } = await supabase
    .from("reviews")
    .update({
      response_text: suggestion.response,
      response_status: "posted",
      ai_suggested_response: suggestion.response,
      response_at: now,
      response_posted_at: now,
    })
    .eq("id", item.review_id);

  if (updateError) {
    throw new Error(`Failed to update review: ${updateError.message}`);
  }

  // Critical: Mark queue item completed immediately after review update
  const { error: queueError } = await supabase
    .from("auto_reply_queue")
    .update({
      status: "completed",
      completed_at: now,
      updated_at: now,
    })
    .eq("id", item.id);

  if (queueError) {
    // Compensating rollback: revert the review update
    const { error: rollbackError } = await supabase
      .from("reviews")
      .update({
        response_text: null,
        response_status: null,
        ai_suggested_response: null,
        response_at: null,
        response_posted_at: null,
      })
      .eq("id", item.review_id);

    if (rollbackError) {
      console.error(
        `Auto-reply: rollback of review ${item.review_id} failed after queue update error`,
        { reviewId: item.review_id, queueError, rollbackError }
      );
    }
    throw new Error(`Failed to update queue status: ${queueError.message}`);
  }

  // Non-critical operations — failures are logged but don't affect queue status
  try {
    // Calculate response time
    const reviewDate = new Date(review.review_date);
    const responseDate = new Date(now);
    const responseTimeHours =
      (responseDate.getTime() - reviewDate.getTime()) / (1000 * 60 * 60);

    // Insert response analytics
    await supabase.from("response_analytics").insert({
      organization_id: item.organization_id,
      review_id: item.review_id,
      user_id: review.user_id,
      response_time_hours: Math.round(responseTimeHours * 100) / 100,
      was_ai_suggested: true,
      was_auto_reply: true,
      word_count: suggestion.response.split(/\s+/).length,
      sentiment_before: review.sentiment_score,
      platform: review.source,
      posted_successfully: true,
    });

    // Google reviews: create google_review_replies record
    if (review.source === "google") {
      const { data: connection } = await supabase
        .from("google_connections")
        .select("id")
        .eq("organization_id", item.organization_id)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (connection) {
        await supabase.from("google_review_replies").insert({
          organization_id: item.organization_id,
          review_id: item.review_id,
          connection_id: connection.id,
          reply_text: suggestion.response,
          status: "pending",
        });
      }
    }

    // Internal reviews: send response email
    if (review.source === "internal" && review.customer_email) {
      await sendReviewResponseEmail({
        toEmail: review.customer_email,
        toName: review.customer_name || undefined,
        customerName: review.customer_name || "Valued Customer",
        loanOfficerName: loanOfficer?.full_name ?? "Team Member",
        organizationName: organization.name,
        originalReviewText: review.text || null,
        responseText: suggestion.response,
        rating: review.rating ?? undefined,
        organizationId: item.organization_id,
        loanOfficerId: review.user_id,
      }).catch((err) => {
        console.error("Auto-reply: failed to send response email:", err);
      });
    }

    // Send in-app notification to the LO
    await createNotification({
      userId: review.user_id,
      type: "response_posted",
      title: "Auto-reply posted",
      message: `An AI response was posted to ${review.customer_name || "a customer"}'s ${review.rating ? `${review.rating}-star ` : ""}review`,
      organizationId: item.organization_id,
      reviewId: item.review_id,
      actionUrl: `/dashboard/all-reviews?review=${item.review_id}`,
      metadata: {
        auto_reply: true,
        rating: review.rating,
        customer_name: review.customer_name,
      },
    }).catch((err) => {
      console.error("Auto-reply: failed to send notification:", err);
    });
  } catch (secondaryError) {
    console.error("Auto-reply: secondary operations failed:", secondaryError);
  }
}
