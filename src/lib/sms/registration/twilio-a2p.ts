import { resolveCredentials } from "../twilio-client";
import type { BrandRegistrationInput, CampaignRegistrationInput } from "./schemas";

export interface BrandRegistrationResult {
  brandId: string;
  status: string;
}

export interface CampaignRegistrationResult {
  campaignId: string;
  status: string;
}

export interface RegistrationStatusResult {
  brandStatus: string | null;
  brandFailureReason: string | null;
  campaignStatus: string | null;
  campaignFailureReason: string | null;
}

/**
 * Submit brand registration to Twilio via the A2P Brand Registration API.
 */
export async function submitBrandRegistration(
  organizationId: string,
  input: BrandRegistrationInput
): Promise<BrandRegistrationResult> {
  const credentials = await resolveCredentials(organizationId);
  const baseUrl = `https://messaging.twilio.com/v1`;
  const auth = Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString("base64");

  const ein = input.einTaxId.replace("-", "");
  const brandBody = new URLSearchParams();
  brandBody.set("CustomerProfileBundleSid", "");
  brandBody.set("A2PProfileBundleSid", "");
  brandBody.set("BrandType", input.companyType === "non_profit" ? "NON_PROFIT" : input.companyType.toUpperCase());
  brandBody.set("CompanyName", input.legalCompanyName);
  brandBody.set("Ein", ein);
  brandBody.set("EinIssuingCountry", input.country);
  brandBody.set("Street", input.street);
  brandBody.set("City", input.city);
  brandBody.set("State", input.state);
  brandBody.set("PostalCode", input.postalCode);
  brandBody.set("Country", input.country);
  brandBody.set("WebsiteUrl", input.websiteUrl);
  brandBody.set("Vertical", input.vertical);
  if (input.stockTicker) {
    brandBody.set("StockTicker", input.stockTicker);
  }

  const response = await fetch(`${baseUrl}/a2p/BrandRegistrations`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: brandBody.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const msg = errorData?.message || errorData?.detail || `Brand registration failed (${response.status})`;
    throw new Error(msg);
  }

  const data = await response.json();

  return {
    brandId: data.sid || data.brand_registration_sid,
    status: data.status || "pending",
  };
}

/**
 * Submit campaign registration (use case) to Twilio.
 * Requires an approved brand first.
 */
export async function submitCampaignRegistration(
  organizationId: string,
  brandId: string,
  messagingServiceSid: string,
  input: CampaignRegistrationInput
): Promise<CampaignRegistrationResult> {
  const credentials = await resolveCredentials(organizationId);
  const baseUrl = `https://messaging.twilio.com/v1`;
  const auth = Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString("base64");

  const campaignBody = new URLSearchParams({
    BrandRegistrationSid: brandId,
    MessagingServiceSid: messagingServiceSid,
    Description: input.campaignDescription,
    MessageSamples: JSON.stringify([input.messageSample]),
    MessageFlow: input.messageFlowDescription,
    OptInMessage: input.optInDescription,
    OptInKeywords: JSON.stringify(input.optInKeywords.split(",").map((k) => k.trim())),
    OptOutKeywords: JSON.stringify(input.optOutKeywords.split(",").map((k) => k.trim())),
    HelpKeywords: JSON.stringify(input.helpKeywords.split(",").map((k) => k.trim())),
    UseCase: "CUSTOMER_CARE",
    HasEmbeddedLinks: "true",
    HasEmbeddedPhone: "false",
  });

  const response = await fetch(
    `${baseUrl}/Services/${messagingServiceSid}/UsAppToPersonUsecases`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: campaignBody.toString(),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const msg =
      errorData?.message || errorData?.detail || `Campaign registration failed (${response.status})`;
    throw new Error(msg);
  }

  const data = await response.json();

  return {
    campaignId: data.sid || data.campaign_id,
    status: data.campaign_status || "pending",
  };
}

/**
 * Check registration status for brand and campaign.
 */
export async function checkRegistrationStatus(
  organizationId: string,
  brandId: string | null,
  campaignId: string | null,
  messagingServiceSid: string | null
): Promise<RegistrationStatusResult> {
  const credentials = await resolveCredentials(organizationId);
  const baseUrl = `https://messaging.twilio.com/v1`;
  const auth = Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString("base64");

  let brandStatus: string | null = null;
  let brandFailureReason: string | null = null;
  let campaignStatus: string | null = null;
  let campaignFailureReason: string | null = null;

  if (brandId) {
    try {
      const brandResponse = await fetch(`${baseUrl}/a2p/BrandRegistrations/${brandId}`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      if (brandResponse.ok) {
        const brandData = await brandResponse.json();
        brandStatus = brandData.status;
        brandFailureReason = brandData.failure_reason || null;
      }
    } catch {
      // Non-fatal - keep null status
    }
  }

  if (campaignId && messagingServiceSid) {
    try {
      const campaignResponse = await fetch(
        `${baseUrl}/Services/${messagingServiceSid}/UsAppToPersonUsecases/${campaignId}`,
        { headers: { Authorization: `Basic ${auth}` } }
      );
      if (campaignResponse.ok) {
        const campaignData = await campaignResponse.json();
        campaignStatus = campaignData.campaign_status;
        campaignFailureReason = campaignData.failure_reason || null;
      }
    } catch {
      // Non-fatal
    }
  }

  return { brandStatus, brandFailureReason, campaignStatus, campaignFailureReason };
}

/**
 * Derive the new registration_status and any update fields from a Twilio status check result.
 */
export function deriveRegistrationUpdate(
  currentStatus: string,
  campaignId: string | null,
  statusResult: RegistrationStatusResult
): { newStatus: string; updateFields: Record<string, unknown> } {
  let newStatus = currentStatus;
  const updateFields: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (statusResult.brandStatus === "approved" || statusResult.brandStatus === "APPROVED") {
    if (statusResult.campaignStatus === "VERIFIED" || statusResult.campaignStatus === "approved") {
      newStatus = "fully_registered";
    } else if (campaignId) {
      if (statusResult.campaignStatus === "FAILED" || statusResult.campaignStatus === "rejected") {
        newStatus = "rejected";
        updateFields.campaign_failure_reason = statusResult.campaignFailureReason;
      } else {
        newStatus = "campaign_pending";
      }
    } else {
      newStatus = "brand_approved";
    }
  } else if (statusResult.brandStatus === "FAILED" || statusResult.brandStatus === "rejected") {
    newStatus = "rejected";
    updateFields.brand_failure_reason = statusResult.brandFailureReason;
  }

  updateFields.registration_status = newStatus;
  return { newStatus, updateFields };
}
