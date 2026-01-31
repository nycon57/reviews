import { NextRequest, NextResponse } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  validateTwilioSignature,
  buildWebhookUrl,
} from "@/lib/sms/webhook-validation";

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params = Object.fromEntries(formData.entries()) as Record<
      string,
      string
    >;

    // Validate Twilio signature
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
      // Unknown status — acknowledge but skip processing
      return NextResponse.json({ received: true });
    }

    const supabase = createUntypedAdminClient();

    // Fetch current message to check for status regression
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

    // Build the update payload
    const updatePayload: Record<string, unknown> = {
      status: dbStatus,
    };

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
      // Return 200 to prevent Twilio retry loops
      return NextResponse.json({ received: true });
    }

    // Increment daily stats for terminal statuses
    if (TERMINAL_STATUSES.has(dbStatus)) {
      const statDate = current.sent_at
        ? new Date(current.sent_at as string).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);

      await incrementDailyDeliveryStat(
        supabase,
        current.organization_id as string,
        current.loan_officer_id as string | null,
        statDate,
        dbStatus
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[SMS Status Webhook] Unexpected error:", error);
    // Return 200 to prevent Twilio retry loops on unrecoverable errors
    return NextResponse.json({ received: true });
  }
}

/**
 * Atomically increment sms_daily_stats for a terminal delivery status.
 * Uses raw SQL with ON CONFLICT for safe concurrent access.
 */
async function incrementDailyDeliveryStat(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  organizationId: string,
  loanOfficerId: string | null,
  date: string,
  status: string
): Promise<void> {
  const column = status === "delivered" ? "delivered" : "failed";

  // Atomic upsert: INSERT ... ON CONFLICT DO UPDATE with increment
  const { error } = await supabase.rpc("increment_sms_daily_stat", {
    p_organization_id: organizationId,
    p_loan_officer_id: loanOfficerId,
    p_date: date,
    p_column_name: column,
  });

  if (error) {
    // Fallback: try the non-atomic path if the RPC doesn't exist yet
    if (error.code === "42883") {
      await fallbackIncrementStat(
        supabase,
        organizationId,
        loanOfficerId,
        date,
        column
      );
      return;
    }
    console.error("[SMS Status Webhook] Stats update failed:", error.message);
  }
}

/**
 * Non-atomic fallback for incrementing stats when the RPC is unavailable.
 * Uses select-then-upsert with error handling for concurrent inserts.
 */
async function fallbackIncrementStat(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  organizationId: string,
  loanOfficerId: string | null,
  date: string,
  column: string
): Promise<void> {
  const { data: existing, error: selectError } = await supabase
    .from("sms_daily_stats")
    .select("id, delivered, failed")
    .eq("organization_id", organizationId)
    .is("loan_officer_id", loanOfficerId ?? null)
    .eq("date", date)
    .maybeSingle();

  if (selectError) {
    console.error(
      "[SMS Status Webhook] Stats select failed:",
      selectError.message
    );
    return;
  }

  if (existing) {
    const { error } = await supabase
      .from("sms_daily_stats")
      .update({ [column]: ((existing as unknown as Record<string, unknown>)[column] as number ?? 0) + 1 })
      .eq("id", existing.id);

    if (error) {
      console.error(
        "[SMS Status Webhook] Stats update failed:",
        error.message
      );
    }
  } else {
    const { error } = await supabase.from("sms_daily_stats").insert({
      organization_id: organizationId,
      loan_officer_id: loanOfficerId,
      date,
      [column]: 1,
    });

    if (error) {
      // Handle concurrent insert race: if duplicate, retry as update
      if (error.code === "23505") {
        await fallbackIncrementStat(
          supabase,
          organizationId,
          loanOfficerId,
          date,
          column
        );
        return;
      }
      console.error(
        "[SMS Status Webhook] Stats insert failed:",
        error.message
      );
    }
  }
}
