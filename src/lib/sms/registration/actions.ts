"use server";

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUserWithProfile } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import {
  brandRegistrationSchema,
  campaignRegistrationSchema,
  type BrandRegistrationInput,
  type CampaignRegistrationInput,
} from "./schemas";
import {
  submitBrandRegistration,
  submitCampaignRegistration,
  checkRegistrationStatus,
  deriveRegistrationUpdate,
} from "./twilio-a2p";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

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

/**
 * Get the current 10DLC registration state from sms_settings.
 */
export async function getRegistrationStatus(): Promise<
  ActionResult<{
    registrationStatus: string;
    brandId: string | null;
    campaignId: string | null;
    brandName: string | null;
    messagingServiceSid: string | null;
    brandFailureReason: string | null;
    campaignFailureReason: string | null;
  }>
> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("sms_settings")
    .select(
      "registration_status, a2p_brand_id, a2p_campaign_id, brand_name, messaging_service_sid, brand_failure_reason, campaign_failure_reason"
    )
    .eq("organization_id", auth.organizationId)
    .single();

  if (error && error.code !== "PGRST116") {
    return { success: false, error: "Failed to load registration status" };
  }

  return {
    success: true,
    data: {
      registrationStatus: (data?.registration_status as string) ?? "not_started",
      brandId: (data?.a2p_brand_id as string | null) ?? null,
      campaignId: (data?.a2p_campaign_id as string | null) ?? null,
      brandName: (data?.brand_name as string | null) ?? null,
      messagingServiceSid: (data?.messaging_service_sid as string | null) ?? null,
      brandFailureReason: (data?.brand_failure_reason as string | null) ?? null,
      campaignFailureReason: (data?.campaign_failure_reason as string | null) ?? null,
    },
  };
}

/**
 * Submit brand registration to Twilio and persist the result.
 */
export async function registerBrand(
  input: BrandRegistrationInput
): Promise<ActionResult<{ brandId: string }>> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = brandRegistrationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    const result = await submitBrandRegistration(auth.organizationId, parsed.data);

    const supabase = createUntypedAdminClient();
    const { error: updateError } = await supabase
      .from("sms_settings")
      .update({
        a2p_brand_id: result.brandId,
        brand_name: parsed.data.legalCompanyName,
        registration_status: "brand_pending",
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", auth.organizationId);

    if (updateError) {
      return {
        success: false,
        error: "Brand submitted to Twilio but failed to save locally. Contact support.",
      };
    }

    revalidatePath("/dashboard/settings");
    return { success: true, data: { brandId: result.brandId } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Brand registration failed";
    return { success: false, error: message };
  }
}

/**
 * Submit campaign registration to Twilio and persist the result.
 */
export async function registerCampaign(
  input: CampaignRegistrationInput
): Promise<ActionResult<{ campaignId: string }>> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = campaignRegistrationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  // Get brand ID and messaging service SID
  const supabase = createUntypedAdminClient();
  const { data: settings, error: fetchError } = await supabase
    .from("sms_settings")
    .select("a2p_brand_id, messaging_service_sid, registration_status")
    .eq("organization_id", auth.organizationId)
    .single();

  if (fetchError || !settings) {
    return { success: false, error: "SMS settings not found" };
  }

  if (!settings.a2p_brand_id) {
    return { success: false, error: "Brand registration must be completed first" };
  }

  if (settings.registration_status !== "brand_approved") {
    return { success: false, error: "Brand must be approved before registering a campaign" };
  }

  if (!settings.messaging_service_sid) {
    return {
      success: false,
      error: "A Messaging Service SID is required. Configure it in SMS Settings.",
    };
  }

  try {
    const result = await submitCampaignRegistration(
      auth.organizationId,
      settings.a2p_brand_id,
      settings.messaging_service_sid,
      parsed.data
    );

    const { error: updateError } = await supabase
      .from("sms_settings")
      .update({
        a2p_campaign_id: result.campaignId,
        registration_status: "campaign_pending",
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", auth.organizationId);

    if (updateError) {
      return {
        success: false,
        error: "Campaign submitted to Twilio but failed to save locally. Contact support.",
      };
    }

    revalidatePath("/dashboard/settings");
    return { success: true, data: { campaignId: result.campaignId } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Campaign registration failed";
    return { success: false, error: message };
  }
}

/**
 * Manually refresh registration status from Twilio.
 */
export async function refreshRegistrationStatus(): Promise<ActionResult> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = createUntypedAdminClient();
  const { data: settings, error: fetchError } = await supabase
    .from("sms_settings")
    .select("a2p_brand_id, a2p_campaign_id, messaging_service_sid, registration_status")
    .eq("organization_id", auth.organizationId)
    .single();

  if (fetchError || !settings) {
    return { success: false, error: "SMS settings not found" };
  }

  if (!settings.a2p_brand_id) {
    return { success: false, error: "No brand registration found" };
  }

  try {
    const status = await checkRegistrationStatus(
      auth.organizationId,
      settings.a2p_brand_id,
      settings.a2p_campaign_id,
      settings.messaging_service_sid
    );

    const { updateFields } = deriveRegistrationUpdate(
      settings.registration_status as string,
      settings.a2p_campaign_id as string | null,
      status
    );

    const { error: updateError } = await supabase
      .from("sms_settings")
      .update(updateFields)
      .eq("organization_id", auth.organizationId);

    if (updateError) {
      return { success: false, error: "Failed to update registration status" };
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to check status";
    return { success: false, error: message };
  }
}
