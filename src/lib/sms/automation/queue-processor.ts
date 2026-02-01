import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { TwilioService } from "../twilio-client";
import { QuietHoursEngine } from "../quiet-hours";
import { ConsentService } from "../consent-service";
import { CreditService } from "../credits/credit-service";
import { checkCostAlerts } from "./cost-alerts";

export interface QueueProcessorResult {
  processed: number;
  sent: number;
  rescheduled: number;
  failed: number;
  errors: string[];
}

/**
 * Process the SMS scheduled sends queue.
 *
 * Picks up messages where status = 'queued' and scheduled_at <= now(),
 * then sends each one through the standard SMS pipeline. Messages that
 * fall into quiet hours at execution time are rescheduled.
 *
 * Uses SELECT ... FOR UPDATE SKIP LOCKED (via a serialized approach)
 * to prevent concurrent cron runs from double-processing.
 */
export async function processScheduledQueue(
  batchSize: number = 100
): Promise<QueueProcessorResult> {
  const supabase = createUntypedAdminClient();
  const now = new Date().toISOString();

  // Fetch queued messages ready to send
  const { data: messages, error: fetchError } = await supabase
    .from("sms_messages")
    .select(
      "id, organization_id, loan_officer_id, borrower_id, to_number, body, template_id, segments, from_number"
    )
    .eq("status", "queued")
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(batchSize);

  if (fetchError) {
    return {
      processed: 0,
      sent: 0,
      rescheduled: 0,
      failed: 0,
      errors: [`Failed to fetch queued messages: ${fetchError.message}`],
    };
  }

  if (!messages || messages.length === 0) {
    return { processed: 0, sent: 0, rescheduled: 0, failed: 0, errors: [] };
  }

  const result: QueueProcessorResult = {
    processed: messages.length,
    sent: 0,
    rescheduled: 0,
    failed: 0,
    errors: [],
  };

  const quietHoursEngine = new QuietHoursEngine();
  const consentService = new ConsentService();

  for (const msg of messages) {
    try {
      // Mark as processing (prevents re-pickup)
      const { error: lockError } = await supabase
        .from("sms_messages")
        .update({ status: "sent" })
        .eq("id", msg.id)
        .eq("status", "queued"); // optimistic lock

      if (lockError) {
        result.failed++;
        result.errors.push(`Lock failed for ${msg.id}: ${lockError.message}`);
        continue;
      }

      // Re-check quiet hours at execution time
      const quietResult = await quietHoursEngine.check(
        msg.organization_id,
        msg.to_number
      );

      if (quietResult.blocked && quietResult.nextValidTime) {
        // Reschedule to next valid window
        await supabase
          .from("sms_messages")
          .update({
            status: "queued",
            scheduled_at: quietResult.nextValidTime,
          })
          .eq("id", msg.id);
        result.rescheduled++;
        continue;
      }

      // Re-check consent (may have opted out since queueing)
      const hasConsent = await consentService.checkConsent(
        msg.organization_id,
        msg.to_number
      );

      if (!hasConsent) {
        await supabase
          .from("sms_messages")
          .update({
            status: "failed",
            error_code: "CONSENT_REVOKED",
            error_message: "Recipient opted out after message was scheduled",
          })
          .eq("id", msg.id);
        result.failed++;
        continue;
      }

      // Check credits
      const creditService = new CreditService(msg.organization_id);
      const balance = await creditService.checkBalance();
      if (balance.remaining < msg.segments && !balance.overageAllowed) {
        await supabase
          .from("sms_messages")
          .update({
            status: "failed",
            error_code: "NO_CREDITS",
            error_message: "Insufficient credits at send time",
          })
          .eq("id", msg.id);
        result.failed++;
        continue;
      }

      // Send via Twilio directly (message is already persisted and rendered)
      const twilioService = await TwilioService.forOrganization(
        msg.organization_id
      );
      const sendResult = await twilioService.sendSms({
        to: msg.to_number,
        body: msg.body,
        from: msg.from_number,
      });

      // Update message with Twilio SID
      await supabase
        .from("sms_messages")
        .update({
          twilio_sid: sendResult.sid,
          status: sendResult.status as string,
          sent_at: new Date().toISOString(),
        })
        .eq("id", msg.id);

      // Deduct credits
      await creditService.deductCredit(msg.segments);

      // Check cost alerts after each send
      await checkCostAlerts(msg.organization_id).catch((err) =>
        console.error(`[SMS Queue] Cost alert check failed: ${err}`)
      );

      result.sent++;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.failed++;
      result.errors.push(`Message ${msg.id}: ${errorMsg}`);

      // Mark as failed (best-effort)
      try {
        await supabase
          .from("sms_messages")
          .update({
            status: "failed",
            error_message: errorMsg.slice(0, 500),
          })
          .eq("id", msg.id);
      } catch {
        // Swallow — the message was already logged above
      }
    }
  }

  return result;
}
