import { TwilioService } from "@/lib/sms/twilio-client";
import { WhatsAppService } from "./whatsapp-service";
import { RcsService } from "./rcs-service";
import type { ChannelMessage, ChannelSendResult } from "./channel-types";

/**
 * Unified message sender that routes messages to the correct channel.
 *
 * Channel priority (when using Messaging Service with all channels):
 * 1. WhatsApp -- if explicitly requested and customer opted in
 * 2. RCS -- if available and sender is in the Messaging Service pool
 * 3. SMS -- universal fallback
 */
export class UnifiedSender {
  private twilioService: TwilioService;

  private constructor(twilioService: TwilioService) {
    this.twilioService = twilioService;
  }

  static async forOrganization(
    organizationId: string
  ): Promise<UnifiedSender> {
    const twilioService = await TwilioService.forOrganization(organizationId);
    return new UnifiedSender(twilioService);
  }

  /**
   * Send a message via the specified channel.
   * Falls back to SMS if the primary channel fails and fallback is enabled.
   */
  async send(
    message: ChannelMessage,
    options?: { fallbackToSms?: boolean }
  ): Promise<ChannelSendResult> {
    const result = await this.sendViaChannel(message);

    if (
      !result.success &&
      options?.fallbackToSms &&
      message.channel !== "sms"
    ) {
      const smsResult = await this.sendViaChannel({
        ...message,
        channel: "sms",
      });

      return {
        ...smsResult,
        usedFallback: true,
        fallbackChannel: "sms",
      };
    }

    return result;
  }

  private async sendViaChannel(
    message: ChannelMessage
  ): Promise<ChannelSendResult> {
    switch (message.channel) {
      case "whatsapp": {
        const whatsapp = new WhatsAppService(this.twilioService);
        return message.whatsappTemplateName
          ? whatsapp.sendTemplate(message)
          : whatsapp.send(message);
      }
      case "rcs": {
        const rcs = new RcsService(this.twilioService);
        return rcs.send(message);
      }
      case "sms":
      default: {
        try {
          const result = await this.twilioService.sendSms({
            to: message.to,
            body: message.body,
            from: message.from,
            mediaUrl: message.mediaUrl,
          });
          return {
            success: true,
            sid: result.sid,
            channel: "sms",
            status: result.status,
            segments: result.segments,
          };
        } catch (error) {
          return {
            success: false,
            channel: "sms",
            error:
              error instanceof Error ? error.message : "SMS send failed",
          };
        }
      }
    }
  }
}
