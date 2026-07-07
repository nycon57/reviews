/**
 * In-app notifications for the review record. Under the publish-inversion
 * model negative reviews go live immediately, so the pro is pointed at the
 * response composer instead of an approval queue.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/actions";
import { sendNewReviewNotificationEmail } from "@/lib/email";
import { sendNegativeReviewAlertEnhancedEmail } from "@/lib/email/send";
import type { Json } from "@/types/database.types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.repwell.com";

type ReviewRecipient = { id: string; full_name: string | null; email: string | null };

/**
 * Fan a freshly published review out to everyone who should hear about it.
 *
 * Policy (locked): every published review notifies the owning professional
 * in-app + email (subject to their preferences) and, via createNotification,
 * Slack. A below-threshold ("negative") review ADDITIONALLY escalates to the
 * organization's admins and managers with an urgent notification + alert email.
 *
 * createNotification self-gates the Slack fan-out on the recipient's Slack
 * preferences and notification type, so we simply route each recipient through
 * it. Email is gated here against notification_preferences. Never throws —
 * publish must succeed even if a downstream channel fails.
 */
export async function notifyReviewPublished(params: {
  reviewId: string;
  organizationId: string;
  ownerUserId: string;
  customerName: string | null;
  rating: number;
  reviewText?: string | null;
  belowThreshold: boolean;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    const customer = params.customerName || "A customer";
    const reviewDate = new Date().toISOString();
    const actionUrl = `/dashboard/reviews/${params.reviewId}`;
    const dashboardUrl = `${APP_URL}${actionUrl}`;

    const [{ data: owner }, { data: org }] = await Promise.all([
      supabase
        .from("users")
        .select("id, full_name, email")
        .eq("id", params.ownerUserId)
        .maybeSingle(),
      supabase
        .from("organizations")
        .select("name")
        .eq("id", params.organizationId)
        .maybeSingle(),
    ]);
    const orgName = org?.name || "your organization";

    // Only escalate to org staff for below-threshold reviews.
    let managers: ReviewRecipient[] = [];
    if (params.belowThreshold) {
      const { data } = await supabase
        .from("users")
        .select("id, full_name, email")
        .eq("organization_id", params.organizationId)
        .in("role", ["admin", "manager"]);
      managers = (data || []).filter((m) => m.id !== params.ownerUserId);
    }

    // One preferences read covers every recipient. Missing rows mean the user
    // is on defaults (all channels enabled).
    const recipientIds = [params.ownerUserId, ...managers.map((m) => m.id)];
    const { data: prefsRows } = await supabase
      .from("notification_preferences")
      .select("user_id, email_enabled, email_new_review, email_negative_review")
      .in("user_id", recipientIds);
    const prefsById = new Map(
      (prefsRows || []).map((p) => [p.user_id as string, p])
    );
    const emailAllowed = (userId: string, kind: "new" | "negative"): boolean => {
      const p = prefsById.get(userId);
      if (!p) return true;
      if (p.email_enabled === false) return false;
      return kind === "negative"
        ? p.email_negative_review !== false
        : p.email_new_review !== false;
    };

    const metadata: Record<string, unknown> = {
      event: "review_published",
      review_id: params.reviewId,
      customer_name: params.customerName,
      rating: params.rating,
      created_at: reviewDate,
    };

    // Owner: always notified that a review landed.
    await createNotification({
      userId: params.ownerUserId,
      type: "new_review",
      title: "You received a new review",
      message: `${customer} left a ${params.rating}-star review.`,
      organizationId: params.organizationId,
      reviewId: params.reviewId,
      metadata,
      actionUrl,
      priority: params.belowThreshold ? 1 : 0,
    });

    if (owner?.email && emailAllowed(params.ownerUserId, "new")) {
      await sendNewReviewNotificationEmail({
        toEmail: owner.email,
        loanOfficerName: owner.full_name || "there",
        customerName: customer,
        rating: params.rating,
        reviewText: params.reviewText || undefined,
        reviewDate,
        dashboardUrl,
        organizationName: orgName,
        reviewId: params.reviewId,
        organizationId: params.organizationId,
        loanOfficerId: params.ownerUserId,
      }).catch((error) => {
        console.error("Error sending new-review email to owner:", error);
      });
    }

    // Below-threshold: urgent escalation to admins + managers.
    if (params.belowThreshold && managers.length > 0) {
      await Promise.all(
        managers.map(async (manager) => {
          await createNotification({
            userId: manager.id,
            type: "negative_review",
            title: "Negative review needs attention",
            message: `${customer} left a ${params.rating}-star review for ${
              owner?.full_name || "a team member"
            }.`,
            organizationId: params.organizationId,
            reviewId: params.reviewId,
            metadata,
            actionUrl,
            priority: 2,
          });

          if (manager.email && emailAllowed(manager.id, "negative")) {
            await sendNegativeReviewAlertEnhancedEmail({
              toEmail: manager.email,
              recipientName: manager.full_name || "Manager",
              loanOfficerName: owner?.full_name || "Team Member",
              customerName: customer,
              rating: params.rating,
              reviewText: params.reviewText || undefined,
              reviewDate,
              dashboardUrl,
              reviewId: params.reviewId,
              organizationName: orgName,
              organizationId: params.organizationId,
              loanOfficerId: params.ownerUserId,
            }).catch((error) => {
              console.error("Error sending negative-review alert email:", error);
            });
          }
        })
      );
    }
  } catch (error) {
    console.error("Error dispatching review-published notifications:", error);
  }
}

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
