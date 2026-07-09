import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/system-actions";
import { sendReviewDisputeEscalationEmail } from "@/lib/email/send";
import { emailConfig } from "@/lib/email/client";
import { FLAG_REASON_LABELS, type ReviewFlagReason } from "./types";

const REVIEW_EXCERPT_LENGTH = 200;

export async function routeNewFlag(flag: { id: string }, organizationId: string): Promise<void> {
  try {
    const untyped = createUntypedAdminClient();
    const supabase = createAdminClient();

    const { data: flagRow } = await untyped
      .from("review_flags")
      .select("id, review_id, reason, details, reporter_name, reporter_email, flagged_by_user_id")
      .eq("id", flag.id)
      .eq("organization_id", organizationId)
      .eq("status", "pending")
      .single();

    if (!flagRow) return;

    const { data: org } = await supabase
      .from("organizations")
      .select("name, account_type")
      .eq("id", organizationId)
      .single();

    if (!org) return;

    const reasonLabel = FLAG_REASON_LABELS[flagRow.reason as ReviewFlagReason] ?? flagRow.reason;

    if (org.account_type === "enterprise") {
      const { data: managers } = await supabase
        .from("users")
        .select("id")
        .eq("organization_id", organizationId)
        .in("role", ["admin", "manager"])
        .eq("is_active", true);

      if (!managers?.length) return;

      const { error: notifyError } = await supabase.from("notifications").insert(
        managers.map((manager) => ({
          user_id: manager.id,
          organization_id: organizationId,
          type: "review_flag_pending",
          title: "A review has been disputed",
          message: `A review was reported for ${reasonLabel.toLowerCase()}. Review the dispute to uphold or dismiss it.`,
          action_url: "/dashboard/reviews?tab=disputes",
          metadata: {
            event: "review_flag_pending",
            flag_id: flagRow.id,
            review_id: flagRow.review_id,
            reason: flagRow.reason,
            created_at: new Date().toISOString(),
          },
        }))
      );

      if (notifyError) {
        console.error("Error creating dispute notifications:", notifyError);
      }
      return;
    }

    const [escalationResult, reviewResult, reporterResult, platformAdminsResult] =
      await Promise.all([
        untyped
          .from("review_flags")
          .update({ escalated_to_platform_at: new Date().toISOString() })
          .eq("id", flagRow.id),
        supabase
          .from("reviews")
          .select("id, rating, customer_name, text")
          .eq("id", flagRow.review_id)
          .single(),
        !flagRow.reporter_name && flagRow.flagged_by_user_id
          ? supabase.from("users").select("full_name").eq("id", flagRow.flagged_by_user_id).single()
          : Promise.resolve({ data: null, error: null }),
        untyped.from("users").select("id").eq("is_platform_admin", true).eq("is_active", true),
      ]);

    if (escalationResult.error) {
      console.error("Error marking dispute escalated:", escalationResult.error);
    }

    const { data: review } = reviewResult;
    const reporterName =
      (flagRow.reporter_name as string | null) ?? reporterResult.data?.full_name ?? null;
    const { data: platformAdmins, error: platformAdminsError } = platformAdminsResult;

    if (platformAdminsError) {
      console.error(
        "Error querying platform admins for dispute notification:",
        platformAdminsError
      );
    } else if (!platformAdmins?.length) {
      console.error("No active platform admins found for individual dispute notification", {
        flagId: flagRow.id,
        organizationId,
      });
    } else {
      await Promise.all(
        platformAdmins.map(async (admin: { id: string }) => {
          const notification = await createNotification({
            userId: admin.id,
            type: "review_dispute",
            title: "Individual dispute needs review",
            message: `${org.name} reported a review for ${reasonLabel.toLowerCase()}. Review the staff dispute queue to uphold or dismiss it.`,
            organizationId,
            reviewId: flagRow.review_id,
            actionUrl: "/staff/disputes",
            priority: 2,
            metadata: {
              event: "individual_review_dispute_pending",
              flag_id: flagRow.id,
              review_id: flagRow.review_id,
              reason: flagRow.reason,
              reporter_name: reporterName,
              reporter_email: flagRow.reporter_email,
              created_at: new Date().toISOString(),
            },
          });

          if (!notification.success) {
            console.error("Error creating platform dispute notification:", notification.error);
          }
        })
      );
    }

    const escalationEmail = process.env.REVIEW_DISPUTE_ESCALATION_EMAIL;
    if (escalationEmail) {
      await sendReviewDisputeEscalationEmail({
        toEmail: escalationEmail,
        organizationId,
        flagId: flagRow.id,
        reviewId: flagRow.review_id,
        organizationName: org.name,
        reporterName: reporterName ?? undefined,
        reporterEmail: (flagRow.reporter_email as string | null) ?? undefined,
        reasonLabel,
        details: (flagRow.details as string | null) ?? undefined,
        rating: review?.rating ?? 0,
        customerName: review?.customer_name ?? undefined,
        reviewExcerpt: review?.text ? review.text.slice(0, REVIEW_EXCERPT_LENGTH) : "",
        reviewUrl: `${emailConfig.baseUrl}/staff/disputes`,
      });
    } else {
      console.error(
        "REVIEW_DISPUTE_ESCALATION_EMAIL is not set; skipping optional dispute escalation email after queue notification",
        { flagId: flagRow.id, organizationId }
      );
    }
  } catch (error) {
    console.error("Error routing new review flag:", error);
  }
}
