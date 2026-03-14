/**
 * Unified messaging channel abstraction.
 * Extends the existing email/sms channel model with WhatsApp and RCS.
 */

export type MessageChannel = "sms" | "whatsapp" | "rcs";

export interface ChannelMessage {
  to: string;
  body: string;
  from?: string;
  channel: MessageChannel;
  mediaUrl?: string[];
  /** WhatsApp template name (required for outbound outside 24h window) */
  whatsappTemplateName?: string;
  /** WhatsApp template language code */
  whatsappTemplateLanguage?: string;
  /** WhatsApp template variables */
  whatsappTemplateVariables?: Record<string, string>;
}

export interface ChannelSendResult {
  success: boolean;
  sid?: string;
  channel: MessageChannel;
  status?: string;
  segments?: number;
  error?: string;
  /** True if the message was sent via fallback channel */
  usedFallback?: boolean;
  /** The fallback channel used */
  fallbackChannel?: MessageChannel;
}

export interface ChannelCapabilities {
  sms: boolean;
  whatsapp: boolean;
  rcs: boolean;
}

export interface ChannelEligibility {
  channel: MessageChannel;
  eligible: boolean;
  reason?: string;
}

/**
 * Convert an E.164 phone number to a WhatsApp address.
 * Twilio uses "whatsapp:+1234567890" prefix.
 */
export function toWhatsAppAddress(e164Phone: string): string {
  return `whatsapp:${e164Phone}`;
}

/**
 * Check if a phone number is a WhatsApp address.
 */
export function isWhatsAppAddress(address: string): boolean {
  return address.startsWith("whatsapp:");
}

/**
 * Extract the E.164 phone number from a WhatsApp address.
 */
export function fromWhatsAppAddress(address: string): string {
  return address.replace(/^whatsapp:/, "");
}
