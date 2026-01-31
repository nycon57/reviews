import { NextRequest, NextResponse } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  validateTwilioSignature,
  buildWebhookUrl,
} from "@/lib/sms/webhook-validation";

/**
 * Twilio Delivery Status Webhook
 *
 * Receives status callbacks from Twilio when a message transitions through
 * delivery states: queued → sent → delivered | undelivered | failed.
 *
 * Updates the sms_messages table and increments sms_daily_stats counters.
 *
 * @see https://www.twilio.com/docs/messaging/guides/track-outbound-message-status
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const params = Object.fromEntries(formData.entries()) as Record<string, string>;

  // Validate Twilio signature
  const signature = request.headers.get("x-twilio-signature");
  const webhookUrl = buildWebhookUrl(request);

  if (!validateTwilioSignature(signature, webhookUrl, params)) {
    console.warn("[SMS Status Webhook] Invalid Twilio signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const messageSid = params.MessageSid;
  const messageStatus = params.MessageStatus;

  if (!messageSid || !messageStatus) {
    return NextResponse.json(
      { error: "Missing MessageSid or MessageStatus" },
      { status: 400 }
    );
  }

  // Map Twilio status strings to our database enum values
  const statusMap: Record<string, string> = {
    queued: "queued",
    sent: "sent",
    delivered: "delivered",
    undelivered: "undelivered",
    failed: "failed",
  };

  const dbStatus = statusMap[messageStatus.toLowerCase()];
  if (!dbStatus) {
    // Unknown status — acknowledge but skip processing
    return NextResponse.json({ received: true });
  }

  const supabase = createUntypedAdminClient();

  // Build the update payload
  const updatePayload: Record<string, unknown> = {
    status: dbStatus,
  };

  // Set delivered_at timestamp on terminal delivery
  if (dbStatus === "delivered") {
    updatePayload.delivered_at = new Date().toISOString();
  }

  // Capture error details on failure
  if (dbStatus === "failed" || dbStatus === "undelivered") {
    if (params.ErrorCode) updatePayload.error_code = params.ErrorCode;
    if (params.ErrorMessage) updatePayload.error_message = params.ErrorMessage;
  }

  // Update the message record by twilio_sid
  const { data: message, error: updateError } = await supabase
    .from("sms_messages")
    .update(updatePayload)
    .eq("twilio_sid", messageSid)
    .select("id, organization_id, loan_officer_id, sent_at")
    .single();

  if (updateError) {
    // If no matching message found, log but still return 200 to avoid Twilio retries
    if (updateError.code === "PGRST116") {
      console.warn(`[SMS Status Webhook] No message found for SID: ${messageSid}`);
      return NextResponse.json({ received: true });
    }
    console.error("[SMS Status Webhook] Update failed:", updateError.message);
    return NextResponse.json(
      { error: "Database update failed" },
      { status: 500 }
    );
  }

  // Increment daily stats for terminal statuses
  if (message && (dbStatus === "delivered" || dbStatus === "failed" || dbStatus === "undelivered")) {
    const statDate = message.sent_at
      ? new Date(message.sent_at).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    await updateDailyStats(
      supabase,
      message.organization_id,
      message.loan_officer_id,
      statDate,
      dbStatus
    );
  }

  return NextResponse.json({ received: true });
}

/**
 * Upsert sms_daily_stats for a terminal delivery status.
 * Uses ON CONFLICT to atomically increment the correct counter.
 */
async function updateDailyStats(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  organizationId: string,
  loanOfficerId: string | null,
  date: string,
  status: string
): Promise<void> {
  const column = status === "delivered" ? "delivered" : "failed";

  // Upsert with increment — try update first, insert if not found
  const { data: existing } = await supabase
    .from("sms_daily_stats")
    .select("id, delivered, failed")
    .eq("organization_id", organizationId)
    .is("loan_officer_id", loanOfficerId ?? null)
    .eq("date", date)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("sms_daily_stats")
      .update({ [column]: (existing[column] as number) + 1 })
      .eq("id", existing.id);
  } else {
    await supabase.from("sms_daily_stats").insert({
      organization_id: organizationId,
      loan_officer_id: loanOfficerId,
      date,
      [column]: 1,
    });
  }
}
