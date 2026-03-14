"use server";

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUserWithProfile } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import { SmsService } from "../sms-service";
import { ConsentService } from "../consent-service";
import { QuietHoursEngine } from "../quiet-hours";
import { CreditService } from "../credits/credit-service";
import { toE164, formatForDisplay } from "../phone-utils";
import {
  renderTemplate,
  renderTemplatePreview,
  type MergeContext,
} from "../templates/merge-engine";
import {
  sendSmsReviewRequestSchema,
  sendSmsVideoRequestSchema,
  recordInlineConsentSchema,
  checkSmsSendReadinessSchema,
  type SendSmsReviewRequestInput,
  type SendSmsVideoRequestInput,
  type RecordInlineConsentInput,
  type CheckSmsSendReadinessInput,
} from "./schemas";
import type { z } from "zod";
import type {
  SmsTemplate,
  SmsConsentStatus,
  SmsSendResult,
} from "../types";

type ActionResult<T = void> = { success: true; data?: T } | { success: false; error: string };

async function getAuthContext() {
  const profile = await unifiedGetUserWithProfile();
  if (!profile || !profile.organization_id) return null;
  return {
    userId: profile.id,
    organizationId: profile.organization_id,
    role: profile.role as string,
    fullName: profile.full_name as string,
  };
}

// ── Shared SMS send helper ───────────────────────────────────────────

async function sendSmsRequestInternal<T extends { borrowerName: string; borrowerPhone: string; loanOfficerId: string; templateId: string }>(
  input: T,
  schema: z.ZodType<T>,
  errorLabel: string
): Promise<ActionResult<SmsSendResult>> {
  const auth = await getAuthContext();
  if (!auth) return { success: false, error: "Not authenticated" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const normalizedPhone = toE164(parsed.data.borrowerPhone);
  if (!normalizedPhone) {
    return { success: false, error: "Invalid phone number format. Use (XXX) XXX-XXXX or +1XXXXXXXXXX." };
  }

  const supabase = createUntypedAdminClient();
  const { data: targetUser } = await supabase
    .from("users")
    .select("id, organization_id, full_name")
    .eq("id", parsed.data.loanOfficerId)
    .single();

  if (!targetUser || targetUser.organization_id !== auth.organizationId) {
    return { success: false, error: "Selected team member not found in your organization" };
  }

  const smsService = await SmsService.forOrganization(auth.organizationId);
  const result = await smsService.sendReviewRequest({
    borrowerId: auth.userId,
    loanOfficerId: parsed.data.loanOfficerId,
    templateId: parsed.data.templateId,
    borrowerPhone: normalizedPhone,
    borrowerName: parsed.data.borrowerName,
  });

  if (result.success) {
    revalidatePath("/dashboard/reviews");
  }

  return result.success
    ? { success: true, data: result }
    : { success: false, error: result.error ?? errorLabel };
}

// ── Send SMS Review Request ──────────────────────────────────────────

export async function sendSmsReviewRequest(
  input: SendSmsReviewRequestInput
): Promise<ActionResult<SmsSendResult>> {
  return sendSmsRequestInternal(input, sendSmsReviewRequestSchema, "Failed to send SMS");
}

// ── Send SMS Video Testimonial Request ────────────────────────────────

export async function sendSmsVideoRequest(
  input: SendSmsVideoRequestInput
): Promise<ActionResult<SmsSendResult>> {
  return sendSmsRequestInternal(input, sendSmsVideoRequestSchema, "Failed to send video request SMS");
}

// ── Check Send Readiness ─────────────────────────────────────────────

export interface SendReadiness {
  phoneValid: boolean;
  phoneE164: string | null;
  phoneDisplay: string | null;
  consentStatus: SmsConsentStatus | "none";
  consentRequired: boolean;
  quietHoursBlocked: boolean;
  quietHoursNextValid: string | null;
  registrationComplete: boolean;
  creditBalance: number;
  creditSufficient: boolean;
  templateValid: boolean;
  templatePreview: string | null;
  segmentCount: number;
  creditCost: number;
}

export async function checkSmsSendReadiness(
  input: CheckSmsSendReadinessInput
): Promise<ActionResult<SendReadiness>> {
  const auth = await getAuthContext();
  if (!auth) return { success: false, error: "Not authenticated" };

  const parsed = checkSmsSendReadinessSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const normalizedPhone = toE164(parsed.data.borrowerPhone);
  const phoneValid = normalizedPhone !== null;
  const supabase = createUntypedAdminClient();

  // Run independent checks in parallel
  const [consentResult, quietResult, settingsResult, balance, templateResult] =
    await Promise.all([
      // Consent check
      phoneValid && normalizedPhone
        ? supabase
            .from("sms_consent")
            .select("status")
            .eq("organization_id", auth.organizationId)
            .eq("phone_number", normalizedPhone)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      // Quiet hours check
      phoneValid && normalizedPhone
        ? new QuietHoursEngine().check(auth.organizationId, normalizedPhone)
        : Promise.resolve({ blocked: false, nextValidTime: null }),
      // Registration check
      supabase
        .from("sms_settings")
        .select("registration_status")
        .eq("organization_id", auth.organizationId)
        .single(),
      // Credits check
      new CreditService(auth.organizationId).checkBalance(),
      // Template check
      supabase
        .from("sms_templates")
        .select("body, status")
        .eq("id", parsed.data.templateId)
        .eq("organization_id", auth.organizationId)
        .single(),
    ]);

  const consentStatus: SmsConsentStatus | "none" =
    (consentResult.data?.status as SmsConsentStatus) ?? "none";
  const quietHoursBlocked = quietResult.blocked;
  const quietHoursNextValid = quietResult.nextValidTime;
  const registrationComplete =
    settingsResult.data?.registration_status === "approved";

  let templateValid = false;
  let templatePreview: string | null = null;
  let segmentCount = 0;
  const template = templateResult.data;

  if (template && template.status === "active") {
    templateValid = true;
    const preview = renderTemplatePreview(template.body);
    templatePreview = preview.body;
    segmentCount = preview.segmentInfo.segments;
  }

  const creditCost = segmentCount;

  return {
    success: true,
    data: {
      phoneValid,
      phoneE164: normalizedPhone,
      phoneDisplay: normalizedPhone ? formatForDisplay(normalizedPhone) : null,
      consentStatus,
      consentRequired: consentStatus !== "opted_in",
      quietHoursBlocked,
      quietHoursNextValid,
      registrationComplete,
      creditBalance: balance.remaining,
      creditSufficient: balance.remaining >= creditCost || balance.overageAllowed,
      templateValid,
      templatePreview,
      segmentCount,
      creditCost,
    },
  };
}

// ── Record Inline Consent ────────────────────────────────────────────

export async function recordInlineConsent(
  input: RecordInlineConsentInput
): Promise<ActionResult<{ status: SmsConsentStatus }>> {
  const auth = await getAuthContext();
  if (!auth) return { success: false, error: "Not authenticated" };

  const parsed = recordInlineConsentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const normalizedPhone = toE164(parsed.data.phone);
  if (!normalizedPhone) {
    return { success: false, error: "Invalid phone number format" };
  }

  const consentService = new ConsentService();
  const record = await consentService.recordConsent({
    orgId: auth.organizationId,
    phone: normalizedPhone,
    method: "web_form",
    source: "sms_send_dialog",
    language: parsed.data.consentLanguage,
  });

  return { success: true, data: { status: record.status } };
}

// ── Get SMS Templates for Send ───────────────────────────────────────

export async function getSmsTemplatesForSend(
  category?: string
): Promise<ActionResult<SmsTemplate[]>> {
  const auth = await getAuthContext();
  if (!auth) return { success: false, error: "Not authenticated" };

  const supabase = createUntypedAdminClient();
  let query = supabase
    .from("sms_templates")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .eq("status", "active")
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) {
    return { success: false, error: "Failed to load templates" };
  }

  return { success: true, data: (data ?? []) as SmsTemplate[] };
}

// ── Render Template Preview with Context ─────────────────────────────

export async function renderSmsPreview(
  templateId: string,
  context: MergeContext
): Promise<ActionResult<{ body: string; segments: number; encoding: string }>> {
  const auth = await getAuthContext();
  if (!auth) return { success: false, error: "Not authenticated" };

  const supabase = createUntypedAdminClient();
  const { data: template } = await supabase
    .from("sms_templates")
    .select("body")
    .eq("id", templateId)
    .eq("organization_id", auth.organizationId)
    .eq("status", "active")
    .single();

  if (!template) {
    return { success: false, error: "Template not found" };
  }

  const result = renderTemplate(template.body, context);
  return {
    success: true,
    data: {
      body: result.body,
      segments: result.segmentInfo.segments,
      encoding: result.segmentInfo.encoding,
    },
  };
}

// ── Get Recent SMS Sends ─────────────────────────────────────────────

export interface RecentSmsSend {
  id: string;
  toNumber: string;
  toNumberDisplay: string;
  body: string;
  status: string;
  segments: number;
  sentAt: string | null;
  createdAt: string;
  scheduledAt: string | null;
}

export async function getRecentSmsSends(): Promise<ActionResult<RecentSmsSend[]>> {
  const auth = await getAuthContext();
  if (!auth) return { success: false, error: "Not authenticated" };

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("sms_messages")
    .select("id, to_number, body, status, segments, sent_at, created_at, scheduled_at")
    .eq("organization_id", auth.organizationId)
    .eq("direction", "outbound")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return { success: false, error: "Failed to load recent sends" };
  }

  const sends: RecentSmsSend[] = (data ?? []).map((msg) => ({
    id: msg.id,
    toNumber: msg.to_number,
    toNumberDisplay: formatForDisplay(msg.to_number),
    body: msg.body,
    status: msg.status,
    segments: msg.segments,
    sentAt: msg.sent_at,
    createdAt: msg.created_at,
    scheduledAt: msg.scheduled_at,
  }));

  return { success: true, data: sends };
}

// ── Get Message Status (for polling) ─────────────────────────────────

export async function getMessageStatus(
  messageId: string
): Promise<ActionResult<{ status: string; deliveredAt: string | null }>> {
  const auth = await getAuthContext();
  if (!auth) return { success: false, error: "Not authenticated" };

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("sms_messages")
    .select("status, delivered_at")
    .eq("id", messageId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (error || !data) {
    return { success: false, error: "Message not found" };
  }

  return { success: true, data: { status: data.status, deliveredAt: data.delivered_at } };
}
