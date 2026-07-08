import { after } from "next/server";
import {
  createUntypedAdminClient,
  type UntypedSupabaseClient,
} from "@/lib/supabase/admin";
import { checkAllMilestonesForReview } from "@/lib/milestones/actions";
import { queueQuoteCardKitForReviews } from "@/lib/share-studio/service";
import {
  screenReviewText,
  type ModerationResult,
} from "@/lib/reviews/moderation";
import {
  notifyReviewNeedsResponse,
  notifyReviewPublished,
} from "@/lib/reviews/notifications";
import { sendReviewResponseConfirmationEmail } from "./response-confirmation";

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

async function getModeration(
  screening: PublishReviewScreening
): Promise<ModerationResult> {
  if (screening.mode === "precomputed") {
    return screening.result;
  }

  return screenReviewText(screening.text, screening.customerName);
}

async function readCelebrationThreshold(
  supabase: UntypedSupabaseClient,
  organizationId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", organizationId)
    .maybeSingle();

  if (error) {
    console.error("Error reading celebration threshold, using default:", error);
    return 4;
  }

  const settings = (data as { settings?: unknown } | null)?.settings as {
    videoCelebrationThreshold?: unknown;
  } | null;
  const raw = settings?.videoCelebrationThreshold;
  const value = typeof raw === "number" ? raw : Number(raw);
  return Number.isInteger(value) && value >= 1 && value <= 5 ? value : 4;
}

function queueQuoteCardKitAfterPublish(params: {
  organizationId: string;
  reviewId: string;
  actorUserId: string;
  minRating: number;
}) {
  after(async () => {
    try {
      await queueQuoteCardKitForReviews({
        organizationId: params.organizationId,
        reviewIds: [params.reviewId],
        actorUserId: params.actorUserId,
        minRating: params.minRating,
      });
    } catch (error) {
      console.error("Asset kit: quote card queue failed after publish", {
        organizationId: params.organizationId,
        reviewIds: [params.reviewId],
        error,
      });
    }
  });
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

  const threshold = await readCelebrationThreshold(supabase, params.organizationId);
  const belowThreshold = params.rating < threshold;

  queueQuoteCardKitAfterPublish({
    organizationId: params.organizationId,
    reviewId: params.reviewId,
    actorUserId: params.actorUserId ?? params.ownerUserId,
    minRating: threshold,
  });

  await notifyReviewPublished({
    reviewId: params.reviewId,
    organizationId: params.organizationId,
    ownerUserId: params.ownerUserId,
    customerName: params.customerName ?? null,
    rating: params.rating,
    reviewText: params.reviewText ?? null,
    belowThreshold,
  });

  if (belowThreshold) {
    await notifyReviewNeedsResponse({
      reviewId: params.reviewId,
      organizationId: params.organizationId,
      ownerUserId: params.ownerUserId,
      customerName: params.customerName ?? null,
      rating: params.rating,
    });
  }

  await checkAllMilestonesForReview(
    params.ownerUserId,
    params.organizationId,
    params.ownerUserId,
    params.rating
  ).catch((error) => {
    console.error("Error checking review milestones:", error);
  });

  const draftResponseSurfaced = await surfaceDraftResponse({
    supabase,
    reviewId: params.reviewId,
    organizationId: params.organizationId,
    responseText: publishedRow.response_text,
    responseStatus: publishedRow.response_status,
    now,
  });

  return {
    outcome: "published",
    moderation,
    belowThreshold,
    draftResponseSurfaced,
  };
}
