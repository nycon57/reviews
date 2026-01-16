import { NextRequest, NextResponse } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getResendClient, emailConfig, getFromAddress } from "@/lib/email/client";
import { getNotificationDigestEmail } from "@/lib/email/templates";
import type { NotificationDigestEmailData } from "@/lib/email/types";

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

interface DigestUser {
  user_id: string;
  digest_frequency: "daily" | "weekly" | "monthly";
}

interface DigestNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url?: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
}

// POST /api/cron/send-digests
// This endpoint should be called by a cron job to send notification digests
// Recommended frequency: every hour (the logic will determine which users need digests)
export async function POST(request: NextRequest) {
  // Verify the request is authorized
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const supabase = createUntypedAdminClient();
    const resend = getResendClient();

    // Get users who need digest emails
    const { data: usersNeedingDigest, error: usersError } = await supabase
      .rpc("get_users_needing_digest") as { data: DigestUser[] | null; error: Error | null };

    if (usersError) {
      console.error("Error getting users needing digest:", usersError);
      return NextResponse.json(
        { success: false, error: usersError.message },
        { status: 500 }
      );
    }

    if (!usersNeedingDigest || usersNeedingDigest.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users need digest emails at this time",
        processed: 0,
        timestamp: new Date().toISOString(),
      });
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const user of usersNeedingDigest) {
      try {
        // Fetch profile and notifications in parallel
        const [profileResult, queueResult] = await Promise.all([
          supabase
            .from("users")
            .select("id, email, full_name")
            .eq("id", user.user_id)
            .single(),
          supabase
            .from("notification_digest_queue")
            .select(`
              id,
              notification_id,
              notifications (
                id,
                type,
                title,
                message,
                action_url,
                created_at
              )
            `)
            .eq("user_id", user.user_id)
            .eq("sent", false)
            .order("queued_at", { ascending: false })
            .limit(50),
        ]);

        const profile = profileResult.data as UserProfile | null;
        const profileError = profileResult.error;
        const { data: queuedNotifications, error: queueError } = queueResult;

        if (profileError || !profile) {
          errors.push(`Failed to get profile for user ${user.user_id}`);
          failed++;
          continue;
        }

        if (queueError) {
          errors.push(`Failed to get notifications for user ${user.user_id}: ${queueError.message}`);
          failed++;
          continue;
        }

        if (!queuedNotifications || queuedNotifications.length === 0) {
          // No notifications to send, skip this user
          continue;
        }

        // Extract the notifications from the queue join
        const notifications: DigestNotification[] = queuedNotifications
          .map((q) => {
            const notif = q.notifications as unknown as DigestNotification | null;
            return notif;
          })
          .filter((n): n is DigestNotification => n !== null);

        if (notifications.length === 0) {
          continue;
        }

        // Calculate summary statistics
        const newReviewCount = notifications.filter(
          (n) => n.type === "new_review" || n.type === "review_approved"
        ).length;
        const negativeReviewCount = notifications.filter(
          (n) => n.type === "negative_review_alert"
        ).length;

        // Format digest period
        const digestPeriodMap: Record<string, string> = {
          daily: "Daily",
          weekly: "Weekly",
          monthly: "Monthly",
        };
        const digestPeriod = digestPeriodMap[user.digest_frequency] || "Daily";

        // Prepare email data
        const emailData: NotificationDigestEmailData = {
          toEmail: profile.email,
          toName: profile.full_name,
          recipientName: profile.full_name || "there",
          digestPeriod,
          notifications: notifications.map((n) => ({
            type: n.type,
            title: n.title,
            message: n.message,
            actionUrl: n.action_url,
            createdAt: new Date(n.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }),
          })),
          summary: {
            totalNotifications: notifications.length,
            newReviews: newReviewCount,
            negativeReviews: negativeReviewCount,
          },
          dashboardUrl: emailConfig.baseUrl + "/dashboard",
        };

        // Generate email content
        const { subject, html } = getNotificationDigestEmail(emailData);

        // Send the email
        const { error: sendError } = await resend.emails.send({
          from: getFromAddress(),
          to: profile.email,
          subject,
          html,
        });

        if (sendError) {
          errors.push(`Failed to send digest to ${profile.email}: ${sendError.message}`);
          failed++;
          continue;
        }

        // Mark notifications as sent and update user's last digest time in parallel
        const queueIds = queuedNotifications.map((q) => q.id);
        await Promise.all([
          supabase
            .from("notification_digest_queue")
            .update({ sent: true, sent_at: new Date().toISOString() })
            .in("id", queueIds),
          supabase
            .from("notification_preferences")
            .update({ last_digest_sent_at: new Date().toISOString() })
            .eq("user_id", user.user_id),
        ]);

        sent++;
      } catch (userError) {
        errors.push(
          `Error processing user ${user.user_id}: ${userError instanceof Error ? userError.message : "Unknown error"}`
        );
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: usersNeedingDigest.length,
      sent,
      failed,
      errors: errors.slice(0, 10), // Limit error details returned
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Digest cron job error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET endpoint for health checks
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    status: "healthy",
    endpoint: "send-digests",
    timestamp: new Date().toISOString(),
  });
}
