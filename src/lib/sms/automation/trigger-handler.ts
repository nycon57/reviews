import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { SmsService } from "../sms-service";
import { toE164 } from "../phone-utils";
import { ConsentService } from "../consent-service";
import type { SmsSendResult } from "../types";

export const crmWebhookPayloadSchema = z.object({
  borrower_name: z.string().min(1),
  borrower_phone: z.string().min(1),
  loan_officer_id: z.string().uuid(),
  closing_date: z.string().min(1),
  loan_type: z.string().optional(),
  property_address: z.string().optional(),
});

export type CrmWebhookPayload = z.infer<typeof crmWebhookPayloadSchema>;

export interface TriggerResult {
  success: boolean;
  messageId?: string;
  scheduledAt?: string;
  error?: string;
}

export function verifyCrmHmac(
  secret: string,
  signature: string,
  body: string
): boolean {
  const computed = createHmac("sha256", secret).update(body).digest("hex");
  if (computed.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
}

/**
 * Process a CRM webhook for post-closing SMS.
 *
 * If the scheduled time (closing_date + delay) is in the past, sends
 * immediately. Otherwise, queues the message for future delivery.
 */
export async function handleCrmTrigger(
  organizationId: string,
  payload: CrmWebhookPayload
): Promise<TriggerResult> {
  const supabase = createUntypedAdminClient();

  const { data: settings } = await supabase
    .from("sms_settings")
    .select(
      "crm_trigger_enabled, crm_trigger_delay_hours, crm_trigger_template_id, crm_field_mapping, default_from_number"
    )
    .eq("organization_id", organizationId)
    .single();

  if (!settings?.crm_trigger_enabled) {
    return { success: false, error: "CRM trigger is not enabled" };
  }

  if (!settings.crm_trigger_template_id) {
    return { success: false, error: "No template configured for CRM trigger" };
  }

  const normalizedPhone = toE164(payload.borrower_phone);
  if (!normalizedPhone) {
    return { success: false, error: "Invalid borrower phone number" };
  }

  const consentService = new ConsentService();
  const hasConsent = await consentService.checkConsent(
    organizationId,
    normalizedPhone
  );
  if (!hasConsent) {
    return { success: false, error: "Borrower has not opted in to SMS" };
  }

  const delayHours = settings.crm_trigger_delay_hours ?? 24;
  const closingDate = new Date(payload.closing_date);
  const scheduledAt = new Date(
    closingDate.getTime() + delayHours * 60 * 60 * 1000
  );

  if (scheduledAt <= new Date()) {
    return sendImmediately(organizationId, settings, normalizedPhone, payload);
  }

  return queueForLater(
    supabase,
    organizationId,
    settings,
    normalizedPhone,
    payload,
    scheduledAt
  );
}

async function sendImmediately(
  organizationId: string,
  settings: { crm_trigger_template_id: string },
  normalizedPhone: string,
  payload: CrmWebhookPayload
): Promise<TriggerResult> {
  const smsService = await SmsService.forOrganization(organizationId);
  const result: SmsSendResult = await smsService.sendReviewRequest({
    borrowerId: payload.loan_officer_id,
    loanOfficerId: payload.loan_officer_id,
    templateId: settings.crm_trigger_template_id,
    borrowerPhone: normalizedPhone,
    borrowerName: payload.borrower_name,
  });
  return {
    success: result.success,
    messageId: result.messageId,
    scheduledAt: result.scheduledAt,
    error: result.error,
  };
}

async function queueForLater(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  organizationId: string,
  settings: {
    crm_trigger_template_id: string;
    crm_field_mapping: unknown;
    default_from_number: string | null;
  },
  normalizedPhone: string,
  payload: CrmWebhookPayload,
  scheduledAt: Date
): Promise<TriggerResult> {
  const fromNumber =
    settings.default_from_number ??
    (await resolveActivePhoneNumber(supabase, organizationId));
  if (!fromNumber) {
    return { success: false, error: "No from number configured" };
  }

  const { data: template } = await supabase
    .from("sms_templates")
    .select("body")
    .eq("id", settings.crm_trigger_template_id)
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .single();

  if (!template) {
    return { success: false, error: "Trigger template not found or inactive" };
  }

  const body = renderTemplate(template.body, payload, settings.crm_field_mapping);

  const { calculateSegments } = await import("../segment-calculator");
  const segmentInfo = calculateSegments(body);

  const { data: message, error: insertError } = await supabase
    .from("sms_messages")
    .insert({
      organization_id: organizationId,
      loan_officer_id: payload.loan_officer_id,
      direction: "outbound",
      from_number: fromNumber,
      to_number: normalizedPhone,
      body,
      template_id: settings.crm_trigger_template_id,
      status: "queued",
      segments: segmentInfo.segments,
      scheduled_at: scheduledAt.toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !message) {
    return {
      success: false,
      error: `Failed to queue message: ${insertError?.message}`,
    };
  }

  return {
    success: true,
    messageId: message.id,
    scheduledAt: scheduledAt.toISOString(),
  };
}

function renderTemplate(
  templateBody: string,
  payload: CrmWebhookPayload,
  fieldMapping: unknown
): string {
  const mergeValues: Record<string, string> = {
    borrower_name: payload.borrower_name,
    closing_date: payload.closing_date,
    loan_type: payload.loan_type ?? "",
    property_address: payload.property_address ?? "",
  };

  const mapping = (fieldMapping ?? {}) as Record<string, string>;
  for (const [crmField, mergeField] of Object.entries(mapping)) {
    const value = (payload as Record<string, unknown>)[crmField];
    if (typeof value === "string") {
      mergeValues[mergeField] = value;
    }
  }

  let body = templateBody;
  for (const [key, value] of Object.entries(mergeValues)) {
    body = body.replaceAll(`{{${key}}}`, value);
  }
  return body;
}

async function resolveActivePhoneNumber(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  organizationId: string
): Promise<string | null> {
  const { data: number } = await supabase
    .from("sms_phone_numbers")
    .select("phone_number")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .limit(1)
    .single();

  return number?.phone_number ?? null;
}
