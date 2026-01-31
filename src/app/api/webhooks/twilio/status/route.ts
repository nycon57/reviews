import { NextRequest, NextResponse } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  validateTwilioSignature,
  buildWebhookUrl,
} from "@/lib/sms/webhook-validation";
import { incrementDailyStat } from "@/lib/sms/daily-stats";

export const dynamic = "force-dynamic";

/**
 * Twilio Delivery Status Webhook
 *
 * Receives status callbacks from Twilio when a message transitions through
 * delivery states: queued -> sent -> delivered | undelivered | failed.
 *
 * Updates the sms_messages table and increments sms_daily_stats counters.
 *
 * @see https://www.twilio.com/docs/messaging/guides/track-outbound-message-status
 */

// Status hierarchy: only allow forward transitions to prevent out-of-order regression.
const STATUS_ORDER: Record<string, number> = {
  queued: 0,
  sent: 1,
  delivered: 2,
  undelivered: 2,
  failed: 2,
};

const TERMINAL_STATUSES = new Set(["delivered", "undelivered", "failed"]);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const params = Object.fromEntries(formData.entries()) as Record<
      string,
      string
    >;

    const signature = request.headers.get("x-twilio-signature");
    const webhookUrl = buildWebhookUrl(request);

    if (!validateTwilioSignature(signature, webhookUrl, params)) {
      console.warn("[SMS Status Webhook] Invalid Twilio signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }

    const messageSid = params.MessageSid;
    const messageStatus = params.MessageStatus;

    if (!messageSid || !messageStatus) {
      return NextResponse.json(
        { error: "Missing MessageSid or MessageStatus" },
        { status: 400 }
      );
    }

    const dbStatus = messageStatus.toLowerCase();
    if (!(dbStatus in STATUS_ORDER)) {
      return NextResponse.json({ received: true });
    }

    const supabase = createUntypedAdminClient();

    const { data: current } = await supabase
      .from("sms_messages")
      .select("id, organization_id, loan_officer_id, sent_at, status")
      .eq("twilio_sid", messageSid)
      .maybeSingle();

    if (!current) {
      console.warn(
        `[SMS Status Webhook] No message found for SID: ${messageSid}`
      );
      return NextResponse.json({ received: true });
    }

    // Prevent out-of-order status regression
    const currentOrder = STATUS_ORDER[current.status as string] ?? -1;
    const newOrder = STATUS_ORDER[dbStatus];
    if (newOrder < currentOrder) {
      return NextResponse.json({ received: true });
    }

    // Skip duplicate terminal status updates (idempotency)
    if (current.status === dbStatus && TERMINAL_STATUSES.has(dbStatus)) {
      return NextResponse.json({ received: true });
    }

    const updatePayload: Record<string, unknown> = { status: dbStatus };

    if (dbStatus === "delivered") {
      updatePayload.delivered_at = new Date().toISOString();
    }

    if (dbStatus === "failed" || dbStatus === "undelivered") {
      if (params.ErrorCode) updatePayload.error_code = params.ErrorCode;
      if (params.ErrorMessage)
        updatePayload.error_message = params.ErrorMessage;
    }

    const { error: updateError } = await supabase
      .from("sms_messages")
      .update(updatePayload)
      .eq("id", current.id);

    if (updateError) {
      console.error(
        "[SMS Status Webhook] Update failed:",
        updateError.message
      );
      return NextResponse.json({ received: true });
    }

    // Increment daily stats for terminal statuses
    if (TERMINAL_STATUSES.has(dbStatus)) {
      const statDate = current.sent_at
        ? new Date(current.sent_at as string).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);

      const column = dbStatus === "delivered" ? "delivered" : "failed";

      await incrementDailyStat(
        supabase,
        current.organization_id as string,
        current.loan_officer_id as string | null,
        statDate,
        column
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[SMS Status Webhook] Unexpected error:", error);
    return NextResponse.json({ received: true });
  }
}
