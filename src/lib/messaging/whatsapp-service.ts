import { TwilioService } from "@/lib/sms/twilio-client";
import type { ChannelMessage, ChannelSendResult } from "./channel-types";
import { toWhatsAppAddress } from "./channel-types";

/**
 * WhatsApp messaging via Twilio Messaging API.
 *
 * Key differences from SMS:
 * - Outbound messages outside a 24h customer-initiated window require
 *   pre-approved WhatsApp templates (utility, marketing, or authentication).
 * - Media attachments are supported natively.
 * - Pricing follows Meta's per-conversation model (not per-segment).
 */
export class WhatsAppService {
  private twilioService: TwilioService;

  constructor(twilioService: TwilioService) {
    this.twilioService = twilioService;
  }

  /**
   * Send a WhatsApp message.
   * Uses the Twilio Messaging API with "whatsapp:" prefix on the To number.
   */
  async send(message: ChannelMessage): Promise<ChannelSendResult> {
    try {
      const toAddress = toWhatsAppAddress(message.to);
      const fromAddress = message.from
        ? toWhatsAppAddress(message.from)
        : undefined;

      // Build message body -- if using a template, Twilio handles template rendering.
      // For freeform messages within 24h window, use body directly.
      const result = await this.twilioService.sendSms({
        to: toAddress,
        body: message.body,
        from: fromAddress,
        mediaUrl: message.mediaUrl,
      });

      return {
        success: true,
        sid: result.sid,
        channel: "whatsapp",
        status: result.status,
        segments: 1, // WhatsApp doesn't have segments -- charged per conversation
      };
    } catch (error) {
      return {
        success: false,
        channel: "whatsapp",
        error:
          error instanceof Error ? error.message : "WhatsApp send failed",
      };
    }
  }

  /**
   * Send a WhatsApp template message (for outbound outside 24h window).
   * Template must be pre-approved by Meta.
   * Uses Twilio's ContentSid + ContentVariables instead of Body.
   */
  async sendTemplate(message: ChannelMessage): Promise<ChannelSendResult> {
    if (!message.whatsappTemplateName) {
      return {
        success: false,
        channel: "whatsapp",
        error:
          "WhatsApp template name is required for outbound template messages",
      };
    }

    try {
      const toAddress = toWhatsAppAddress(message.to);
      const fromAddress = message.from
        ? toWhatsAppAddress(message.from)
        : undefined;

      // Look up the Twilio ContentSid for this template name.
      // The ContentSid is the Twilio-side identifier for pre-approved WhatsApp templates.
      const contentSid = await this.resolveContentSid(message.whatsappTemplateName);
      if (!contentSid) {
        return {
          success: false,
          channel: "whatsapp",
          error: `No ContentSid found for WhatsApp template "${message.whatsappTemplateName}"`,
        };
      }

      // Build ContentVariables from template variables
      const contentVariables = message.whatsappTemplateVariables
        ? JSON.stringify(message.whatsappTemplateVariables)
        : undefined;

      const result = await this.twilioService.sendWithContent({
        to: toAddress,
        from: fromAddress,
        contentSid,
        contentVariables,
      });

      return {
        success: true,
        sid: result.sid,
        channel: "whatsapp",
        status: result.status,
        segments: 1,
      };
    } catch (error) {
      return {
        success: false,
        channel: "whatsapp",
        error:
          error instanceof Error ? error.message : "WhatsApp template send failed",
      };
    }
  }

  /**
   * Resolve a WhatsApp template name to a Twilio ContentSid.
   * Looks up the mapping from the whatsapp_templates config/table.
   */
  private async resolveContentSid(templateName: string): Promise<string | null> {
    // Template name → ContentSid mapping.
    // In production, this should be backed by a database table or config.
    // For now, check env var pattern: WHATSAPP_TEMPLATE_{UPPER_NAME}_SID
    const envKey = `WHATSAPP_TEMPLATE_${templateName.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_SID`;
    return process.env[envKey] ?? null;
  }
}
