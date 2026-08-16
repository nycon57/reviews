import { NextRequest, NextResponse } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getResendClient, emailConfig, getFromAddress } from "@/lib/email/client";
import { getNegativeReviewAlertEmail } from "@/lib/email/templates";
import type { NegativeReviewAlertEmailData } from "@/lib/email/types";
import { withCronHeartbeat } from "@/lib/cron/heartbeat";

// Verify the request is from a valid cron job source
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // If no secret is configured, only allow in development
  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

interface PendingAlert {
  id: string;
  user_id: string;
  notification_id: string;
  notifications: {
    id: string;
    type: string;
    title: string;
    message: string;
    action_url?: string;
    metadata: Record<string, unknown>;
    created_at: string;
  };
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
}

interface NotificationPreferences {
  instant_alerts_enabled: boolean;
  instant_alert_negative_reviews: boolean;
}

// POST /api/cron/send-alerts
// This endpoint processes instant alert notifications (negative reviews)
// Recommended frequency: every 1-2 minutes for near-real-time alerts
export async function POST(request: NextRequest) {
  // Verify the request is authorized
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronHeartbeat("send-alerts", async () => {
    try {
      const supabase = createUntypedAdminClient();
      const resend = getResendClient();

      // Get unsent negative review alerts from the digest queue
      // These are notifications that were queued for instant delivery
      const { data: pendingAlerts, error: alertsError } = (await supabase
        .from("notification_digest_queue")
        .select(
          `
        id,
        user_id,
        notification_id,
        notifications (
          id,
          type,
          title,
          message,
          action_url,
          metadata,
          created_at
        )
      `
        )
        .eq("sent", false)
        .eq("digest_type", "instant")
        .order("queued_at", { ascending: true })
        .limit(50)) as { data: PendingAlert[] | null; error: Error | null };

      if (alertsError) {
        console.error("Error getting pending alerts:", alertsError);
        return NextResponse.json({ success: false, error: alertsError.message }, { status: 500 });
      }

      if (!pendingAlerts || pendingAlerts.length === 0) {
        return NextResponse.json({
          success: true,
          message: "No pending alerts to send",
          processed: 0,
          timestamp: new Date().toISOString(),
        });
      }

      let sent = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const alert of pendingAlerts) {
        try {
          // Get user profile
          const { data: profile, error: profileError } = (await supabase
            .from("users")
            .select("id, email, full_name")
            .eq("id", alert.user_id)
            .single()) as { data: UserProfile | null; error: Error | null };

          if (profileError || !profile) {
            errors.push(`Failed to get profile for user ${alert.user_id}`);
            failed++;
            // Mark as sent to prevent retry loops
            await supabase
              .from("notification_digest_queue")
              .update({ sent: true, sent_at: new Date().toISOString() })
              .eq("id", alert.id);
            continue;
          }

          // Check if user still has instant alerts enabled
          const { data: prefs, error: prefsError } = (await supabase
            .from("notification_preferences")
            .select("instant_alerts_enabled, instant_alert_negative_reviews")
            .eq("user_id", alert.user_id)
            .single()) as { data: NotificationPreferences | null; error: Error | null };

          if (prefsError || !prefs) {
            // No preferences found, skip
            await supabase
              .from("notification_digest_queue")
              .update({ sent: true, sent_at: new Date().toISOString() })
              .eq("id", alert.id);
            continue;
          }

          if (!prefs.instant_alerts_enabled || !prefs.instant_alert_negative_reviews) {
            // User has disabled instant alerts, skip but mark as sent
            await supabase
              .from("notification_digest_queue")
              .update({ sent: true, sent_at: new Date().toISOString() })
              .eq("id", alert.id);
            continue;
          }

          const notification = alert.notifications;
          const metadata = notification.metadata || {};

          // Prepare email data
          const emailData: NegativeReviewAlertEmailData = {
            toEmail: profile.email,
            toName: profile.full_name,
            recipientName: profile.full_name || "there",
            customerName: (metadata.customer_name as string) || "A customer",
            rating: (metadata.rating as number) || 1,
            reviewText: metadata.review_text as string | undefined,
            reviewDate: new Date(notification.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }),
            dashboardUrl: emailConfig.baseUrl + "/dashboard",
            reviewId: (metadata.review_id as string) || notification.id,
          };

          // Generate email content
          const { subject, html } = getNegativeReviewAlertEmail(emailData);

          // Send the email
          const { error: sendError } = await resend.emails.send({
            from: getFromAddress(),
            to: profile.email,
            subject,
            html,
          });

          if (sendError) {
            errors.push(`Failed to send alert to ${profile.email}: ${sendError.message}`);
            failed++;
            continue;
          }

          // Mark as sent
          await supabase
            .from("notification_digest_queue")
            .update({ sent: true, sent_at: new Date().toISOString() })
            .eq("id", alert.id);

          sent++;
        } catch (alertError) {
          errors.push(
            `Error processing alert ${alert.id}: ${alertError instanceof Error ? alertError.message : "Unknown error"}`
          );
          failed++;
        }
      }

      return NextResponse.json({
        success: true,
        processed: pendingAlerts.length,
        sent,
        failed,
        errors: errors.slice(0, 10),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Alert cron job error:", error);

      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  });
}

// GET endpoint for health checks

// Vercel Cron triggers this endpoint with a GET request (carrying the
// Authorization: Bearer <CRON_SECRET> header). Delegate to POST so the job
// actually runs its work on the scheduled trigger.
export async function GET(request: NextRequest) {
  return POST(request);
}
