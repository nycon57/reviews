import { TwilioService } from "@/lib/sms/twilio-client";
import type { ChannelMessage, ChannelSendResult } from "./channel-types";

/**
 * RCS Business Messaging via Twilio Messaging API.
 *
 * Key characteristics:
 * - RCS is handled by Twilio's Messaging Service -- when an RCS Sender
 *   is added to the Sender Pool, Twilio automatically tries RCS first
 *   and falls back to SMS if the carrier/device doesn't support it.
 * - No special address prefix needed (unlike WhatsApp).
 * - RCS Senders cannot be created programmatically -- they must be
 *   provisioned manually in Twilio Console.
 * - Available in 22+ countries, all Android + iOS 18.1+.
 */
export class RcsService {
  private twilioService: TwilioService;

  constructor(twilioService: TwilioService) {
    this.twilioService = twilioService;
  }

  /**
   * Send an RCS message.
   *
   * RCS is sent through the same Twilio Messaging API as SMS.
   * When the org's Messaging Service has an RCS Sender in its pool,
   * Twilio automatically selects RCS when available and falls back to SMS.
   *
   * The `channel` in the result indicates whether RCS was actually used,
   * which is determined by Twilio's status callback (not at send time).
   */
  async send(message: ChannelMessage): Promise<ChannelSendResult> {
    try {
      // RCS uses the same API as SMS -- Twilio handles channel selection
      // via the Messaging Service's Sender Pool
      const result = await this.twilioService.sendSms({
        to: message.to,
        body: message.body,
        from: message.from,
        mediaUrl: message.mediaUrl,
      });

      // Twilio selects the actual channel (RCS or SMS fallback) at delivery time.
      // The definitive channel is only known via Twilio's status callback, not at send time.
      return {
        success: true,
        sid: result.sid,
        channel: "rcs",
        status: result.status,
        segments: 1, // RCS doesn't segment like SMS
        usedFallback: false, // Will be updated by status callback if SMS fallback occurred
      };
    } catch (error) {
      return {
        success: false,
        channel: "rcs",
        error: error instanceof Error ? error.message : "RCS send failed",
      };
    }
  }
}
