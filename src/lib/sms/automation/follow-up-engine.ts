import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { SmsService } from "../sms-service";
import { ConsentService } from "../consent-service";

export interface FollowUpResult {
  processed: number;
  sent: number;
  skipped: number;
  errors: string[];
}

/**
 * Process auto follow-up SMS for delivered review requests that
 * have not been clicked within the configured delay.
 *
 * Rules (per acceptance criteria):
 * - Max 1 follow-up per borrower per review request
 * - Respects consent and quiet hours
 * - Uses the follow_up template category
 */
export async function processFollowUps(): Promise<FollowUpResult> {
  const supabase = createUntypedAdminClient();

  // Find orgs with auto follow-up enabled
  const { data: orgSettings, error: settingsError } = await supabase
    .from("sms_settings")
    .select(
      "organization_id, auto_follow_up_delay_hours, auto_follow_up_template_id"
    )
    .eq("auto_follow_up_enabled", true)
    .not("auto_follow_up_template_id", "is", null);

  if (settingsError || !orgSettings || orgSettings.length === 0) {
    return { processed: 0, sent: 0, skipped: 0, errors: [] };
  }

  const result: FollowUpResult = {
    processed: 0,
    sent: 0,
    skipped: 0,
    errors: [],
  };

  const consentService = new ConsentService();

  for (const settings of orgSettings) {
    try {
      const delayHours = settings.auto_follow_up_delay_hours ?? 72;
      const cutoff = new Date(
        Date.now() - delayHours * 60 * 60 * 1000
      ).toISOString();

      // Find delivered messages eligible for follow-up:
      // - Delivered (not failed/undelivered)
      // - Has a short_link (review request link)
      // - Has a template (was a template-based send)
      // - Delivered before the cutoff time
      // - No follow-up already sent (no sms_messages with follow_up_of = id)
      const { data: eligible, error: queryError } = await supabase
        .from("sms_messages")
        .select(
          "id, organization_id, loan_officer_id, borrower_id, to_number, short_link_id"
        )
        .eq("organization_id", settings.organization_id)
        .eq("status", "delivered")
        .eq("direction", "outbound")
        .not("short_link_id", "is", null)
        .not("template_id", "is", null)
        .lte("delivered_at", cutoff)
        .limit(50);

      if (queryError || !eligible) continue;

      for (const msg of eligible) {
        result.processed++;

        // Check if a follow-up was already sent for this message
        const { data: existingFollowUp } = await supabase
          .from("sms_messages")
          .select("id")
          .eq("follow_up_of", msg.id)
          .limit(1)
          .maybeSingle();

        if (existingFollowUp) {
          result.skipped++;
          continue;
        }

        // Check if the short link was clicked
        if (msg.short_link_id) {
          const { data: link } = await supabase
            .from("sms_short_links")
            .select("click_count")
            .eq("id", msg.short_link_id)
            .single();

          if (link && link.click_count > 0) {
            result.skipped++;
            continue;
          }
        }

        // Check consent
        const hasConsent = await consentService.checkConsent(
          msg.organization_id,
          msg.to_number
        );
        if (!hasConsent) {
          result.skipped++;
          continue;
        }

        // Send the follow-up (SmsService internally handles quiet hours)
        try {
          const smsService = await SmsService.forOrganization(
            msg.organization_id
          );
          const sendResult = await smsService.sendReviewRequest({
            borrowerId: msg.borrower_id ?? msg.loan_officer_id!,
            loanOfficerId: msg.loan_officer_id!,
            templateId: settings.auto_follow_up_template_id!,
            borrowerPhone: msg.to_number,
            borrowerName: "", // Follow-up — name unavailable from original message
          });

          if (sendResult.success && sendResult.messageId) {
            // Link follow-up to original
            await supabase
              .from("sms_messages")
              .update({ follow_up_of: msg.id })
              .eq("id", sendResult.messageId);
            result.sent++;
          } else {
            result.skipped++;
          }
        } catch {
          result.skipped++;
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(
        `Org ${settings.organization_id}: ${errorMsg}`
      );
    }
  }

  return result;
}
