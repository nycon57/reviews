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
 * Process queued SMS messages whose scheduled_at has arrived.
 * Messages blocked by quiet hours are rescheduled; revoked consent
 * or insufficient credits cause the message to fail.
 */
export async function processScheduledQueue(
  batchSize: number = 100
): Promise<QueueProcessorResult> {
  const supabase = createUntypedAdminClient();
  const now = new Date().toISOString();

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
      // Optimistic lock: only proceed if still queued
      const { error: lockError } = await supabase
        .from("sms_messages")
        .update({ status: "sent" })
        .eq("id", msg.id)
        .eq("status", "queued");

      if (lockError) {
        result.failed++;
        result.errors.push(`Lock failed for ${msg.id}: ${lockError.message}`);
        continue;
      }

      const quietResult = await quietHoursEngine.check(
        msg.organization_id,
        msg.to_number
      );

      if (quietResult.blocked && quietResult.nextValidTime) {
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

      const hasConsent = await consentService.checkConsent(
        msg.organization_id,
        msg.to_number
      );

      if (!hasConsent) {
        await markFailed(supabase, msg.id, "CONSENT_REVOKED", "Recipient opted out after message was scheduled");
        result.failed++;
        continue;
      }

      const creditService = new CreditService(msg.organization_id);
      const balance = await creditService.checkBalance();
      if (balance.remaining < msg.segments && !balance.overageAllowed) {
        await markFailed(supabase, msg.id, "NO_CREDITS", "Insufficient credits at send time");
        result.failed++;
        continue;
      }

      const twilioService = await TwilioService.forOrganization(
        msg.organization_id
      );
      const sendResult = await twilioService.sendSms({
        to: msg.to_number,
        body: msg.body,
        from: msg.from_number,
      });

      await supabase
        .from("sms_messages")
        .update({
          twilio_sid: sendResult.sid,
          status: sendResult.status as string,
          sent_at: new Date().toISOString(),
        })
        .eq("id", msg.id);

      await creditService.deductCredit(msg.segments);

      await checkCostAlerts(msg.organization_id).catch((err) =>
        console.error(`[SMS Queue] Cost alert check failed: ${err}`)
      );

      result.sent++;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.failed++;
      result.errors.push(`Message ${msg.id}: ${errorMsg}`);

      try {
        await supabase
          .from("sms_messages")
          .update({
            status: "failed",
            error_message: errorMsg.slice(0, 500),
          })
          .eq("id", msg.id);
      } catch {
        // Already logged above
      }
    }
  }

  return result;
}

async function markFailed(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  messageId: string,
  errorCode: string,
  errorMessage: string
): Promise<void> {
  await supabase
    .from("sms_messages")
    .update({
      status: "failed",
      error_code: errorCode,
      error_message: errorMessage,
    })
    .eq("id", messageId);
}
