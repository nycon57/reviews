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
 * Send auto follow-up SMS for delivered review requests that have not
 * been clicked within the configured delay. Max 1 follow-up per
 * original message. Respects consent and quiet hours.
 */
export async function processFollowUps(): Promise<FollowUpResult> {
  const supabase = createUntypedAdminClient();

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

        if (await alreadyFollowedUp(supabase, msg.id)) {
          result.skipped++;
          continue;
        }

        if (msg.short_link_id && (await linkWasClicked(supabase, msg.short_link_id))) {
          result.skipped++;
          continue;
        }

        if (!msg.loan_officer_id) {
          result.skipped++;
          continue;
        }

        const hasConsent = await consentService.checkConsent(
          msg.organization_id,
          msg.to_number
        );
        if (!hasConsent) {
          result.skipped++;
          continue;
        }

        try {
          const smsService = await SmsService.forOrganization(
            msg.organization_id
          );
          const sendResult = await smsService.sendReviewRequest({
            borrowerId: msg.borrower_id ?? msg.loan_officer_id,
            loanOfficerId: msg.loan_officer_id,
            templateId: settings.auto_follow_up_template_id!,
            borrowerPhone: msg.to_number,
            borrowerName: "",
          });

          if (sendResult.success && sendResult.messageId) {
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

async function alreadyFollowedUp(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  messageId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("sms_messages")
    .select("id")
    .eq("follow_up_of", messageId)
    .limit(1)
    .maybeSingle();
  return !!data;
}

async function linkWasClicked(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  shortLinkId: string
): Promise<boolean> {
  const { data: link } = await supabase
    .from("sms_short_links")
    .select("click_count")
    .eq("id", shortLinkId)
    .single();
  return !!link && link.click_count > 0;
}
