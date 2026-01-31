import { z } from "zod";

// ── Enums (mirror database enums) ──────────────────────────────────────

export type SmsNumberType = "local" | "toll_free" | "short_code";
export type SmsNumberStatus = "active" | "pending" | "released";
export type SmsConsentStatus = "opted_in" | "opted_out" | "pending";
export type SmsConsentMethod =
  | "web_form"
  | "sms_keyword"
  | "api"
  | "import"
  | "verbal";
export type SmsDirection = "outbound" | "inbound";
export type SmsMessageStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "undelivered"
  | "failed"
  | "received";
export type SmsTemplateCategory =
  | "review_request"
  | "follow_up"
  | "thank_you"
  | "video_request"
  | "custom";

// ── Row types (match database schema) ──────────────────────────────────

export interface SmsPhoneNumber {
  id: string;
  organization_id: string;
  phone_number: string;
  twilio_sid: string | null;
  messaging_service_sid: string | null;
  number_type: SmsNumberType;
  status: SmsNumberStatus;
  capabilities: Record<string, boolean>;
  monthly_cost_cents: number;
  created_at: string;
  updated_at: string;
}

export interface SmsConsent {
  id: string;
  organization_id: string;
  phone_number: string;
  status: SmsConsentStatus;
  consent_method: SmsConsentMethod | null;
  consent_language: string | null;
  consent_ip: string | null;
  consent_source: string | null;
  opted_in_at: string | null;
  opted_out_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SmsMessage {
  id: string;
  organization_id: string;
  loan_officer_id: string | null;
  borrower_id: string | null;
  campaign_id: string | null;
  flow_execution_id: string | null;
  direction: SmsDirection;
  from_number: string;
  to_number: string;
  body: string;
  template_id: string | null;
  short_link_id: string | null;
  twilio_sid: string | null;
  status: SmsMessageStatus;
  error_code: string | null;
  error_message: string | null;
  segments: number;
  cost_cents: number;
  scheduled_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SmsSettings {
  id: string;
  organization_id: string;
  twilio_account_sid: string | null;
  twilio_auth_token_encrypted: string | null;
  messaging_service_sid: string | null;
  default_from_number: string | null;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  quiet_hours_timezone: string;
  use_recipient_timezone: boolean;
  monthly_message_limit: number;
  double_opt_in_enabled: boolean;
  a2p_campaign_id: string | null;
  a2p_brand_id: string | null;
  registration_status: string;
  brand_name: string | null;
  auto_follow_up_enabled: boolean;
  auto_follow_up_delay_hours: number;
  auto_follow_up_template_id: string | null;
  stop_response: string;
  help_response: string;
  double_opt_in_message: string;
  consent_language_text: string;
  created_at: string;
  updated_at: string;
}

export interface SmsCredits {
  id: string;
  organization_id: string;
  period_start: string;
  period_end: string;
  included_credits: number;
  used_credits: number;
  overage_credits: number;
  overage_rate_cents: number;
  created_at: string;
  updated_at: string;
}

export interface SmsTemplate {
  id: string;
  organization_id: string;
  name: string;
  category: SmsTemplateCategory;
  body: string;
  merge_fields: string[];
  is_locked: boolean;
  is_default: boolean;
  status: "active" | "archived";
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── Service input/output types ─────────────────────────────────────────

export interface SendSmsOptions {
  to: string;
  body: string;
  from?: string;
  mediaUrl?: string[];
  statusCallback?: string;
}

export interface SendSmsResult {
  sid: string;
  status: string;
  segments: number;
  dateCreated: string;
}

export interface PhoneNumberCapabilities {
  sms: boolean;
  mms: boolean;
  voice: boolean;
}

export interface PurchasePhoneNumberOptions {
  areaCode?: string;
  capabilities?: PhoneNumberCapabilities;
  numberType?: SmsNumberType;
}

export interface AvailablePhoneNumber {
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
  capabilities: PhoneNumberCapabilities;
}

export interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  messagingServiceSid?: string;
}

export interface SendReviewRequestInput {
  borrowerId: string;
  loanOfficerId: string;
  templateId: string;
  borrowerPhone: string;
  borrowerName: string;
}

export interface SendCustomMessageInput {
  to: string;
  body: string;
  loanOfficerId: string;
}

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  twilioSid?: string;
  segments?: number;
  error?: string;
  errorCode?: string;
}

export interface SmsLogEntry {
  organization_id: string;
  message_id: string | null;
  status: "sent" | "failed" | "queued" | "rate_limited";
  duration_ms: number;
  error_code?: string;
  segments?: number;
}

// ── Zod schemas ────────────────────────────────────────────────────────

export const e164PhoneSchema = z
  .string()
  .regex(/^\+1\d{10}$/, "Phone number must be in E.164 format (+1XXXXXXXXXX)");

export const sendSmsSchema = z.object({
  to: e164PhoneSchema,
  body: z.string().min(1, "Message body is required").max(1600, "Message body too long"),
  from: e164PhoneSchema.optional(),
  mediaUrl: z.array(z.string().url()).optional(),
});

export const sendReviewRequestSchema = z.object({
  borrowerId: z.string().uuid(),
  loanOfficerId: z.string().uuid(),
  templateId: z.string().uuid(),
  borrowerPhone: z.string().min(1, "Phone number is required"),
  borrowerName: z.string().min(1, "Borrower name is required"),
});

export const sendCustomMessageSchema = z.object({
  to: z.string().min(1, "Phone number is required"),
  body: z.string().min(1, "Message body is required").max(1600, "Message body too long"),
  loanOfficerId: z.string().uuid(),
});

export const purchasePhoneNumberSchema = z.object({
  areaCode: z.string().regex(/^\d{3}$/, "Area code must be 3 digits").optional(),
  capabilities: z
    .object({
      sms: z.boolean().default(true),
      mms: z.boolean().default(false),
      voice: z.boolean().default(false),
    })
    .optional(),
  numberType: z.enum(["local", "toll_free"]).default("local"),
});
