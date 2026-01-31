"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUserWithProfile } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import {
  saveTwilioCredentialsSchema,
  setDefaultFromNumberSchema,
  searchPhoneNumbersSchema,
  purchaseNumberSchema,
  releaseNumberSchema,
  type SaveTwilioCredentialsInput,
  type SetDefaultFromNumberInput,
  type SearchPhoneNumbersInput,
  type PurchaseNumberInput,
  type ReleaseNumberInput,
} from "./schemas";
import { TwilioService } from "../twilio-client";
import type { SmsSettings, SmsPhoneNumber, AvailablePhoneNumber } from "../types";

type ActionResult<T = void> = { success: true; data?: T } | { success: false; error: string };

async function requireAdminOrManager(): Promise<
  { organizationId: string; userId: string } | { error: string }
> {
  const profile = await unifiedGetUserWithProfile();
  if (!profile) return { error: "Not authenticated" };
  if (!profile.organization_id) return { error: "No organization found" };
  if (profile.role !== "admin" && profile.role !== "manager") {
    return { error: "Insufficient permissions. Admin or manager role required." };
  }
  return { organizationId: profile.organization_id, userId: profile.id };
}

export async function getSmsSettings(): Promise<ActionResult<SmsSettings | null>> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sms_settings")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .single();

  if (error && error.code !== "PGRST116") {
    return { success: false, error: "Failed to load SMS settings" };
  }

  return { success: true, data: data as SmsSettings | null };
}

export async function getSmsPhoneNumbers(): Promise<ActionResult<SmsPhoneNumber[]>> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sms_phone_numbers")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: "Failed to load phone numbers" };
  }

  return { success: true, data: (data ?? []) as SmsPhoneNumber[] };
}

export async function saveTwilioCredentials(
  input: SaveTwilioCredentialsInput
): Promise<ActionResult> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = saveTwilioCredentialsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { accountSid, authToken, messagingServiceSid } = parsed.data;

  // Validate credentials with Twilio before saving
  try {
    const service = new TwilioService({
      accountSid,
      authToken,
      messagingServiceSid: messagingServiceSid || undefined,
    });
    const isValid = await service.validateCredentials();
    if (!isValid) {
      return { success: false, error: "Invalid Twilio credentials. Please check your Account SID and Auth Token." };
    }
  } catch {
    return { success: false, error: "Could not connect to Twilio. Please verify your credentials." };
  }

  const supabase = createAdminClient();
  const encryptionKey = process.env.SMS_ENCRYPTION_KEY;
  if (!encryptionKey) {
    return { success: false, error: "Server configuration error: encryption key not set" };
  }

  // Encrypt the auth token
  const { data: encrypted, error: encryptError } = await supabase.rpc("encrypt_sms_token", {
    p_token: authToken,
    p_key: encryptionKey,
  });

  if (encryptError || !encrypted) {
    return { success: false, error: "Failed to securely store credentials" };
  }

  // Upsert sms_settings
  const { error: upsertError } = await supabase
    .from("sms_settings")
    .upsert(
      {
        organization_id: auth.organizationId,
        twilio_account_sid: accountSid,
        twilio_auth_token_encrypted: encrypted,
        messaging_service_sid: messagingServiceSid || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id" }
    );

  if (upsertError) {
    return { success: false, error: "Failed to save credentials" };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function testTwilioConnection(): Promise<
  ActionResult<{ connected: boolean; accountName?: string }>
> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  try {
    const service = await TwilioService.forOrganization(auth.organizationId);
    const connected = await service.validateCredentials();
    return { success: true, data: { connected } };
  } catch {
    return { success: true, data: { connected: false } };
  }
}

export async function setDefaultFromNumber(
  input: SetDefaultFromNumberInput
): Promise<ActionResult> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = setDefaultFromNumberSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("sms_settings")
    .update({
      default_from_number: parsed.data.phoneNumber,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", auth.organizationId);

  if (error) {
    return { success: false, error: "Failed to update default number" };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function searchAvailableNumbers(
  input: SearchPhoneNumbersInput
): Promise<ActionResult<AvailablePhoneNumber[]>> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = searchPhoneNumbersSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    const service = await TwilioService.forOrganization(auth.organizationId);
    const numbers = await service.searchAvailableNumbers(
      parsed.data.areaCode || undefined,
      parsed.data.numberType
    );
    return { success: true, data: numbers };
  } catch {
    return { success: false, error: "Failed to search phone numbers. Check your Twilio credentials." };
  }
}

export async function purchasePhoneNumber(
  input: PurchaseNumberInput
): Promise<ActionResult> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = purchaseNumberSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = createAdminClient();

  try {
    const service = await TwilioService.forOrganization(auth.organizationId);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const statusCallbackUrl = `${siteUrl}/api/webhooks/twilio/status`;

    const twilioNumber = await service.purchasePhoneNumber(
      parsed.data.phoneNumber,
      statusCallbackUrl
    );

    // Store in database
    const { error: insertError } = await supabase
      .from("sms_phone_numbers")
      .insert({
        organization_id: auth.organizationId,
        phone_number: parsed.data.phoneNumber,
        twilio_sid: twilioNumber.sid,
        number_type: parsed.data.phoneNumber.startsWith("+18") ? "toll_free" : "local",
        status: "active",
        capabilities: {
          sms: Boolean(twilioNumber.capabilities?.sms),
          mms: Boolean(twilioNumber.capabilities?.mms),
          voice: Boolean(twilioNumber.capabilities?.voice),
        },
        monthly_cost_cents: 0,
      });

    if (insertError) {
      return { success: false, error: "Number purchased but failed to save to database" };
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to purchase phone number";
    return { success: false, error: message };
  }
}

export async function releasePhoneNumber(
  input: ReleaseNumberInput
): Promise<ActionResult> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = releaseNumberSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = createAdminClient();

  // Get the phone number record
  const { data: phoneRecord, error: fetchError } = await supabase
    .from("sms_phone_numbers")
    .select("*")
    .eq("id", parsed.data.phoneNumberId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (fetchError || !phoneRecord) {
    return { success: false, error: "Phone number not found" };
  }

  // Release from Twilio if we have a SID
  if (phoneRecord.twilio_sid) {
    try {
      const service = await TwilioService.forOrganization(auth.organizationId);
      await service.releasePhoneNumber(phoneRecord.twilio_sid);
    } catch {
      return { success: false, error: "Failed to release number from Twilio" };
    }
  }

  // Mark as released in database
  const { error: updateError } = await supabase
    .from("sms_phone_numbers")
    .update({
      status: "released",
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.phoneNumberId);

  if (updateError) {
    return { success: false, error: "Failed to update phone number status" };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function getWebhookUrls(): Promise<
  ActionResult<{ statusCallback: string; inboundSms: string }>
> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    success: true,
    data: {
      statusCallback: `${siteUrl}/api/webhooks/twilio/status`,
      inboundSms: `${siteUrl}/api/webhooks/twilio/inbound`,
    },
  };
}
