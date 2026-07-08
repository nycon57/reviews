import {
  createUntypedAdminClient,
  type UntypedSupabaseClient,
} from "@/lib/supabase/admin";
import { checkAllMilestonesForReview } from "@/lib/milestones/actions";
import {
  getCelebrationThreshold,
  queueQuoteCardKitAfterPublish,
} from "@/lib/reviews/asset-kit";
import {
  screenReviewText,
  type ModerationResult,
} from "@/lib/reviews/moderation";
import {
  notifyReviewNeedsResponse,
  notifyReviewPublished,
} from "@/lib/reviews/notifications";
import { sendReviewResponseConfirmationEmail } from "./response-confirmation";
import {
  emitWebhookEvent,
  type ReviewWebhookData,
} from "@/lib/webhooks/outbound";

export type PublishReviewScreening =
  | {
      mode: "compute";
      text: string;
      customerName?: string | null;
    }
  | {
      mode: "precomputed";
      result: ModerationResult;
    };

export type PublishReviewOutcome =
  | "published"
  | "quarantined"
  | "deferred"
  | "already_published";

export interface PublishReviewIfCleanResult {
  outcome: PublishReviewOutcome;
  moderation: ModerationResult;
  belowThreshold: boolean | null;
  draftResponseSurfaced: boolean;
}

export interface PublishReviewIfCleanParams {
  reviewId: string;
  organizationId: string;
  ownerUserId: string;
  rating: number;
  customerName?: string | null;
  reviewText?: string | null;
  screening: PublishReviewScreening;
  /**
   * `false` is used by direct profile reviews: they are screened now but wait
   * for email verification before a clean verdict is allowed to publish.
   */
  publishWhenClean?: boolean;
  /**
   * Human release paths can set this; machine publish paths leave approved_by
   * untouched.
   */
  actorUserId?: string | null;
  now?: string;
  supabase?: UntypedSupabaseClient;
}

type PublishRow = {
  id: string;
  response_text: string | null;
  response_status: string | null;
};

async function buildReviewWebhookData(params: {
  supabase: UntypedSupabaseClient;
  reviewId: string;
  organizationId: string;
  ownerUserId: string;
  rating: number;
  customerName: string | null;
  reviewText: string | null;
}): Promise<ReviewWebhookData> {
  const [{ data: review }, { data: professional }] = await Promise.all([
    params.supabase
      .from("reviews")
      .select("source, source_url, review_date")
      .eq("id", params.reviewId)
      .eq("organization_id", params.organizationId)
      .maybeSingle(),
    params.supabase
      .from("users")
      .select("id, full_name")
      .eq("id", params.ownerUserId)
      .eq("organization_id", params.organizationId)
      .maybeSingle(),
  ]);

  const reviewRow = review as {
    source?: string | null;
    source_url?: string | null;
    review_date?: string | null;
  } | null;
  const professionalRow = professional as {
    full_name?: string | null;
  } | null;

  return {
    review_id: params.reviewId,
    rating: params.rating,
    text: params.reviewText,
    reviewer_display_name: params.customerName,
    source: reviewRow?.source ?? "unknown",
    review_date: reviewRow?.review_date ?? new Date().toISOString(),
    professional: {
      id: params.ownerUserId,
      full_name: professionalRow?.full_name ?? null,
    },
    public_url: reviewRow?.source_url ?? null,
  };
}

async function getModeration(
  screening: PublishReviewScreening
): Promise<ModerationResult> {
  if (screening.mode === "precomputed") {
    return screening.result;
  }

  return screenReviewText(screening.text, screening.customerName);
}

export function isReviewLive(review: { is_published: boolean | null }): boolean {
  return review.is_published === true;
}

function moderationUpdate(moderation: ModerationResult, now: string) {
  return {
    moderation_verdict: moderation.verdict,
    moderation_reasons: moderation.reasons,
    moderation_checked_at: now,
    moderation_provider: moderation.provider,
  };
}

async function getCurrentPublishState(params: {
  supabase: UntypedSupabaseClient;
  reviewId: string;
  organizationId: string;
}): Promise<{ is_published: boolean | null } | null> {
  const { data } = await params.supabase
    .from("reviews")
    .select("is_published")
    .eq("id", params.reviewId)
    .eq("organization_id", params.organizationId)
    .maybeSingle();

  return data as { is_published: boolean | null } | null;
}

async function surfaceDraftResponse(params: {
  supabase: UntypedSupabaseClient;
  reviewId: string;
  organizationId: string;
  responseText: string | null;
  responseStatus: string | null;
  now: string;
}): Promise<boolean> {
  if (!params.responseText || params.responseStatus !== "draft") {
    return false;
  }

  const { data, error } = await params.supabase
    .from("reviews")
    .update({
      response_status: "posted",
      response_at: params.now,
      response_posted_at: params.now,
    })
    .eq("id", params.reviewId)
    .eq("organization_id", params.organizationId)
    .eq("response_status", "draft")
    .select("id");

  if (error) {
    console.error("Failed to surface draft response after publish:", error);
    return false;
  }

  const surfaced =
    Array.isArray(data) && data.length > 0
      ? true
      : Boolean((data as { id?: string } | null)?.id);

  if (!surfaced) {
    return false;
  }

  await sendReviewResponseConfirmationEmail({
    reviewId: params.reviewId,
    organizationId: params.organizationId,
    responseText: params.responseText,
    supabase: params.supabase,
  });

  return true;
}

/**
 * Single review publish path for the publish-inversion model.
 *
 * Computes or accepts a machine-screening verdict, records moderation metadata,
 * publishes only clean reviews, fans out publish notifications/escalation, and
 * idempotently skips side effects on re-call. If a newly published review has a
 * saved draft response, the draft is auto-surfaced by marking it `posted` and
 * sending the reviewer confirmation email; publish remains successful if that
 * best-effort draft surfacing or email delivery fails.
 */
export async function publishReviewIfClean(
  params: PublishReviewIfCleanParams
): Promise<PublishReviewIfCleanResult> {
  const supabase = params.supabase ?? createUntypedAdminClient();
  const now = params.now ?? new Date().toISOString();
  const publishWhenClean = params.publishWhenClean ?? true;
  const moderation = await getModeration(params.screening);
  const moderationFields = moderationUpdate(moderation, now);

  if (!publishWhenClean) {
    const { error } = await supabase
      .from("reviews")
      .update({
        ...moderationFields,
        status: "pending",
        is_published: false,
        published_at: null,
      })
      .eq("id", params.reviewId)
      .eq("organization_id", params.organizationId);

    if (error) {
      throw new Error(`Failed to record review screening: ${error.message}`);
    }

    return {
      outcome: moderation.verdict === "pass" ? "deferred" : "quarantined",
      moderation,
      belowThreshold: null,
      draftResponseSurfaced: false,
    };
  }

  if (moderation.verdict !== "pass") {
    const { error } = await supabase
      .from("reviews")
      .update({
        ...moderationFields,
        status: "pending",
        is_published: false,
        published_at: null,
      })
      .eq("id", params.reviewId)
      .eq("organization_id", params.organizationId)
      .eq("is_published", false);

    if (error) {
      throw new Error(`Failed to quarantine review: ${error.message}`);
    }

    return {
      outcome: "quarantined",
      moderation,
      belowThreshold: null,
      draftResponseSurfaced: false,
    };
  }

  const updatePayload: Record<string, unknown> = {
    ...moderationFields,
    status: "approved",
    approved_at: now,
    rejection_reason: null,
    is_published: true,
    published_at: now,
  };

  if (params.actorUserId) {
    updatePayload.approved_by = params.actorUserId;
  }

  const { data, error } = await supabase
    .from("reviews")
    .update(updatePayload)
    .eq("id", params.reviewId)
    .eq("organization_id", params.organizationId)
    .eq("is_published", false)
    .select("id, response_text, response_status");

  if (error) {
    throw new Error(`Failed to publish review: ${error.message}`);
  }

  const publishedRow = Array.isArray(data)
    ? ((data[0] as PublishRow | undefined) ?? null)
    : ((data as PublishRow | null) ?? null);

  if (!publishedRow) {
    const current = await getCurrentPublishState({
      supabase,
      reviewId: params.reviewId,
      organizationId: params.organizationId,
    });

    return {
      outcome: current?.is_published ? "already_published" : "quarantined",
      moderation,
      belowThreshold: null,
      draftResponseSurfaced: false,
    };
  }

  const threshold = await getCelebrationThreshold(params.organizationId, supabase);
  const belowThreshold = params.rating < threshold;

  queueQuoteCardKitAfterPublish(
    params.organizationId,
    [params.reviewId],
    params.actorUserId ?? params.ownerUserId,
    threshold
  );

  const reviewWebhookData = buildReviewWebhookData({
    supabase,
    reviewId: params.reviewId,
    organizationId: params.organizationId,
    ownerUserId: params.ownerUserId,
    rating: params.rating,
    customerName: params.customerName ?? null,
    reviewText: params.reviewText ?? null,
  });

  const [, , , , , draftResponseSurfaced] = await Promise.all([
    notifyReviewPublished({
      reviewId: params.reviewId,
      organizationId: params.organizationId,
      ownerUserId: params.ownerUserId,
      customerName: params.customerName ?? null,
      rating: params.rating,
      reviewText: params.reviewText ?? null,
      belowThreshold,
    }).catch((error) => {
      console.error("Error sending review-published notification:", error);
    }),
    belowThreshold
      ? notifyReviewNeedsResponse({
          reviewId: params.reviewId,
          organizationId: params.organizationId,
          ownerUserId: params.ownerUserId,
          customerName: params.customerName ?? null,
          rating: params.rating,
        }).catch((error) => {
          console.error("Error sending needs-response notification:", error);
        })
      : Promise.resolve(),
    checkAllMilestonesForReview(
      params.ownerUserId,
      params.organizationId,
      params.ownerUserId,
      params.rating
    ).catch((error) => {
      console.error("Error checking review milestones:", error);
    }),
    reviewWebhookData
      .then((data) =>
        emitWebhookEvent({
          organizationId: params.organizationId,
          type: "review.published",
          data,
        })
      )
      .catch((error) => {
        console.error("Error enqueueing review.published webhook:", error);
      }),
    belowThreshold
      ? reviewWebhookData
          .then((data) =>
            emitWebhookEvent({
              organizationId: params.organizationId,
              type: "review.negative",
              data,
            })
          )
          .catch((error) => {
            console.error("Error enqueueing review.negative webhook:", error);
          })
      : Promise.resolve(),
    surfaceDraftResponse({
      supabase,
      reviewId: params.reviewId,
      organizationId: params.organizationId,
      responseText: publishedRow.response_text,
      responseStatus: publishedRow.response_status,
      now,
    }).catch((error) => {
      console.error("Error surfacing draft response after publish:", error);
      return false;
    }),
  ]);

  return {
    outcome: "published",
    moderation,
    belowThreshold,
    draftResponseSurfaced,
  };
}
