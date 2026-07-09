"use server";

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import type { ActionResult, AutoReplySettings } from "./types";
import {
  calculateAutoReplyEligibleAt,
  coerceAutoReplySettings,
  hasAutoReplyFeature,
} from "./auto-reply-config";

const AUTO_REPLY_UPGRADE_MESSAGE = "Auto-reply is available on Professional and Enterprise plans";

interface UserOrgContext {
  userId: string;
  organizationId: string;
  role: string;
  subscriptionTier: string | null;
}

async function getUserOrgContext(): Promise<UserOrgContext | null> {
  const user = await unifiedGetUser();
  if (!user) return null;

  const supabase = createUntypedAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) return null;

  const { data: orgData } = await supabase
    .from("organizations")
    .select("subscription_tier")
    .eq("id", userData.organization_id)
    .single();

  return {
    userId: userData.id,
    organizationId: userData.organization_id,
    role: userData.role,
    subscriptionTier: orgData?.subscription_tier ?? null,
  };
}

function userHasAutoReplyAccess(ctx: UserOrgContext): boolean {
  return hasAutoReplyFeature(ctx.subscriptionTier);
}

async function enqueueExistingApprovedReviews(
  organizationId: string,
  tone: AutoReplySettings["auto_reply_tone"],
  minRating: AutoReplySettings["auto_reply_min_rating"]
) {
  const supabase = createUntypedAdminClient();
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("id, user_id, review_date, approved_at, created_at, response_text, response_status")
    .eq("organization_id", organizationId)
    .eq("status", "approved")
    .is("response_text", null)
    .not("user_id", "is", null)
    .gte("rating", minRating);

  if (error || !reviews?.length) {
    if (error) {
      console.error("Failed to backfill auto-reply queue:", error);
    }
    return;
  }

  const queueRows = reviews
    .filter((review) => review.user_id && review.response_status !== "posted")
    .map((review) => ({
      organization_id: organizationId,
      review_id: review.id,
      user_id: review.user_id,
      tone,
      eligible_at: calculateAutoReplyEligibleAt(
        review.approved_at ?? review.created_at ?? review.review_date
      ),
    }));

  if (!queueRows.length) {
    return;
  }

  const chunkErrors: { chunkIndex: number; error: unknown }[] = [];

  for (let i = 0; i < queueRows.length; i += 500) {
    const chunkIndex = Math.floor(i / 500);
    const chunk = queueRows.slice(i, i + 500);
    const { error: upsertError } = await supabase
      .from("auto_reply_queue")
      .upsert(chunk, { onConflict: "review_id", ignoreDuplicates: true });

    if (upsertError) {
      chunkErrors.push({ chunkIndex, error: upsertError });
    }
  }

  if (chunkErrors.length > 0) {
    console.error(`Failed to enqueue ${chunkErrors.length} chunk(s) of auto-replies:`, chunkErrors);
  }
}

export async function getAutoReplyFeatureAccess(): Promise<ActionResult<{ hasAccess: boolean }>> {
  const ctx = await getUserOrgContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  return {
    success: true,
    data: {
      hasAccess: userHasAutoReplyAccess(ctx),
    },
  };
}

/**
 * Get auto-reply settings for the current user's organization.
 */
export async function getAutoReplySettings(): Promise<ActionResult<AutoReplySettings>> {
  const ctx = await getUserOrgContext();
  if (!ctx) return { success: false, error: "Unauthorized" };
  if (!userHasAutoReplyAccess(ctx)) {
    return { success: false, error: AUTO_REPLY_UPGRADE_MESSAGE };
  }

  const supabase = createUntypedAdminClient();
  const { data: org, error } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", ctx.organizationId)
    .single();

  if (error || !org) {
    return { success: false, error: "Organization not found" };
  }

  return {
    success: true,
    data: coerceAutoReplySettings(org.settings),
  };
}

/**
 * Update auto-reply settings. When disabling, cancels all pending queue items.
 */
export async function updateAutoReplySettings(
  updates: Partial<AutoReplySettings>
): Promise<ActionResult> {
  const ctx = await getUserOrgContext();
  if (!ctx) return { success: false, error: "Unauthorized" };
  if (!userHasAutoReplyAccess(ctx)) {
    return { success: false, error: AUTO_REPLY_UPGRADE_MESSAGE };
  }

  // Team-wide settings can only be changed by managers/admins.
  if (ctx.role === "user") {
    return { success: false, error: "Insufficient permissions" };
  }

  const supabase = createUntypedAdminClient();

  // Get current settings and merge (fetch updated_at for optimistic lock)
  const { data: org } = await supabase
    .from("organizations")
    .select("settings, updated_at")
    .eq("id", ctx.organizationId)
    .single();

  if (!org) {
    return { success: false, error: "Organization not found" };
  }

  const currentSettings =
    org.settings && typeof org.settings === "object"
      ? (org.settings as Record<string, unknown>)
      : {};
  const currentAutoReply = coerceAutoReplySettings(currentSettings);
  const mergedAutoReply = coerceAutoReplySettings({
    ...currentSettings,
    ...updates,
  });
  const newSettings = {
    ...currentSettings,
    ...mergedAutoReply,
  };
  const isEnabling = !currentAutoReply.auto_reply_enabled && mergedAutoReply.auto_reply_enabled;

  const { data: updateResult, error } = await supabase
    .from("organizations")
    .update({ settings: newSettings, updated_at: new Date().toISOString() })
    .eq("id", ctx.organizationId)
    .eq("updated_at", org.updated_at)
    .select();

  if (error) {
    console.error("Error updating auto-reply settings:", error);
    return { success: false, error: "Failed to update settings" };
  }

  if (!updateResult || updateResult.length === 0) {
    return { success: false, error: "Settings were modified concurrently, please retry" };
  }

  // If disabling, cancel all pending queue items for this org
  if (updates.auto_reply_enabled === false) {
    await supabase
      .from("auto_reply_queue")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("organization_id", ctx.organizationId)
      .eq("status", "pending");
  }

  // When enabled, queue existing approved reviews that still need a response.
  if (isEnabling) {
    await enqueueExistingApprovedReviews(
      ctx.organizationId,
      mergedAutoReply.auto_reply_tone,
      mergedAutoReply.auto_reply_min_rating
    );
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

/**
 * Cancel a specific auto-reply by review ID.
 */
export async function cancelAutoReply(reviewId: string): Promise<ActionResult> {
  const ctx = await getUserOrgContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  const supabase = createUntypedAdminClient();

  const { error } = await supabase
    .from("auto_reply_queue")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("review_id", reviewId)
    .eq("organization_id", ctx.organizationId)
    .eq("status", "pending");

  if (error) {
    console.error("Error cancelling auto-reply:", error);
    return { success: false, error: "Failed to cancel auto-reply" };
  }

  revalidatePath("/dashboard/all-reviews");
  return { success: true };
}

/**
 * Get queue stats for dashboard display.
 */
export async function getAutoReplyQueueStats(): Promise<
  ActionResult<{ pending: number; completed: number; failed: number; cancelled: number }>
> {
  const ctx = await getUserOrgContext();
  if (!ctx) return { success: false, error: "Unauthorized" };
  if (!userHasAutoReplyAccess(ctx)) {
    return { success: false, error: AUTO_REPLY_UPGRADE_MESSAGE };
  }

  const supabase = createUntypedAdminClient();

  const statuses = ["pending", "completed", "failed", "cancelled"] as const;
  const counts: Record<string, number> = {};

  for (const status of statuses) {
    const { count } = await supabase
      .from("auto_reply_queue")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", ctx.organizationId)
      .eq("status", status);
    counts[status] = count || 0;
  }

  return {
    success: true,
    data: {
      pending: counts.pending,
      completed: counts.completed,
      failed: counts.failed,
      cancelled: counts.cancelled,
    },
  };
}

/**
 * Get the current user's auto-reply opt-out status.
 */
export async function getAutoReplyOptOut(): Promise<ActionResult<boolean>> {
  const ctx = await getUserOrgContext();
  if (!ctx) return { success: false, error: "Unauthorized" };
  if (!userHasAutoReplyAccess(ctx)) {
    return { success: false, error: AUTO_REPLY_UPGRADE_MESSAGE };
  }

  const supabase = createUntypedAdminClient();
  const { data } = await supabase
    .from("notification_preferences")
    .select("auto_reply_opt_out")
    .eq("user_id", ctx.userId)
    .single();

  return { success: true, data: data?.auto_reply_opt_out ?? false };
}

/**
 * Update the current user's auto-reply opt-out preference.
 */
export async function updateAutoReplyOptOut(optOut: boolean): Promise<ActionResult> {
  const ctx = await getUserOrgContext();
  if (!ctx) return { success: false, error: "Unauthorized" };
  if (!userHasAutoReplyAccess(ctx)) {
    return { success: false, error: AUTO_REPLY_UPGRADE_MESSAGE };
  }

  const supabase = createUntypedAdminClient();

  const { error } = await supabase
    .from("notification_preferences")
    .upsert({ user_id: ctx.userId, auto_reply_opt_out: optOut }, { onConflict: "user_id" });

  if (error) {
    return { success: false, error: "Failed to update preference" };
  }

  // If opting out, cancel pending queue items for this user
  if (optOut) {
    const { error: cancelError } = await supabase
      .from("auto_reply_queue")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("user_id", ctx.userId)
      .eq("organization_id", ctx.organizationId)
      .eq("status", "pending");

    if (cancelError) {
      console.error("Failed to cancel pending auto-reply queue items after opt-out", {
        userId: ctx.userId,
        organizationId: ctx.organizationId,
        error: cancelError,
      });
      revalidatePath("/dashboard/settings");
      return { success: false, error: "Opt-out saved but queue cancellation failed" };
    }
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

/**
 * Enqueue a single review for auto-reply after individual approval.
 * Best-effort: failures are silently ignored.
 */
export async function enqueueReviewForAutoReply(
  reviewId: string,
  orgId: string,
  userId: string | null
) {
  try {
    const ctx = await getUserOrgContext();
    if (!ctx || ctx.organizationId !== orgId) return;
    if (ctx.role === "user" && userId !== ctx.userId) return;

    const supabase = createUntypedAdminClient();

    // Check if org has auto-reply enabled
    const { data: org } = await supabase
      .from("organizations")
      .select("settings, subscription_tier")
      .eq("id", orgId)
      .single();

    if (!org) return;
    if (!hasAutoReplyFeature(org.subscription_tier)) return;

    const settings = coerceAutoReplySettings(org.settings);
    if (!settings.auto_reply_enabled) return;

    // Check review has no existing response
    const { data: review } = await supabase
      .from("reviews")
      .select("response_text, response_status")
      .eq("id", reviewId)
      .single();

    if (!review) return;
    if (review.response_text || review.response_status === "posted") return;

    // Upsert to auto_reply_queue
    await supabase.from("auto_reply_queue").upsert(
      {
        organization_id: orgId,
        review_id: reviewId,
        user_id: userId,
        tone: settings.auto_reply_tone,
        eligible_at: calculateAutoReplyEligibleAt(new Date().toISOString()),
      },
      { onConflict: "review_id", ignoreDuplicates: true }
    );
  } catch {
    // Silently fail - auto-reply is best-effort
  }
}
