import Twilio from "twilio";
import type { MessageInstance } from "twilio/lib/rest/api/v2010/account/message";
import type { IncomingPhoneNumberInstance } from "twilio/lib/rest/api/v2010/account/incomingPhoneNumber";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  ENV_TWILIO_ACCOUNT_SID,
  ENV_TWILIO_AUTH_TOKEN,
  ENV_SMS_ENCRYPTION_KEY,
  TWILIO_ERROR_MAP,
  TRANSIENT_STATUS_CODES,
  MAX_RETRIES,
  RETRY_BASE_DELAY_MS,
} from "./constants";
import type {
  TwilioCredentials,
  SendSmsOptions,
  SendSmsResult,
  AvailablePhoneNumber,
  SmsPhoneNumber,
} from "./types";

// ── Singleton client cache with TTL ───────────────────────────────────

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CachedClient {
  client: Twilio.Twilio;
  authToken: string;
  createdAt: number;
}

const clientCache = new Map<string, CachedClient>();

function getOrCreateClient(accountSid: string, authToken: string): Twilio.Twilio {
  const key = accountSid;
  const now = Date.now();

  // Evict stale entries on access; also evict if authToken changed
  const existing = clientCache.get(key);
  if (existing && now - existing.createdAt < CACHE_TTL_MS && existing.authToken === authToken) {
    return existing.client;
  }

  const client = Twilio(accountSid, authToken);
  clientCache.set(key, { client, authToken, createdAt: now });
  return client;
}

// ── Credential resolution ──────────────────────────────────────────────

/**
 * Resolve Twilio credentials for an organization.
 * Priority: org-specific encrypted credentials > environment variable fallback.
 */
export async function resolveCredentials(
  organizationId: string
): Promise<TwilioCredentials> {
  const supabase = createUntypedAdminClient();

  const { data: settings } = await supabase
    .from("sms_settings")
    .select("twilio_account_sid, twilio_auth_token_encrypted, messaging_service_sid")
    .eq("organization_id", organizationId)
    .single();

  // Try org-specific credentials first
  if (settings?.twilio_account_sid && settings?.twilio_auth_token_encrypted) {
    const encryptionKey = process.env[ENV_SMS_ENCRYPTION_KEY];
    if (!encryptionKey) {
      throw new Error("SMS_ENCRYPTION_KEY is not configured");
    }

    // Decrypt the auth token using the database function
    const { data: decrypted, error } = await supabase.rpc("decrypt_sms_token", {
      p_encrypted: settings.twilio_auth_token_encrypted,
      p_key: encryptionKey,
    });

    if (error || !decrypted) {
      throw new Error("Failed to decrypt Twilio credentials");
    }

    return {
      accountSid: settings.twilio_account_sid,
      authToken: decrypted,
      messagingServiceSid: settings.messaging_service_sid ?? undefined,
    };
  }

  // Fall back to environment variables
  const accountSid = process.env[ENV_TWILIO_ACCOUNT_SID];
  const authToken = process.env[ENV_TWILIO_AUTH_TOKEN];

  if (!accountSid || !authToken) {
    throw new Error(
      "Twilio credentials not configured. Set org-level credentials or TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN environment variables."
    );
  }

  return { accountSid, authToken };
}

// ── TwilioService ──────────────────────────────────────────────────────

export class TwilioService {
  private client: Twilio.Twilio;
  private credentials: TwilioCredentials;

  constructor(credentials: TwilioCredentials) {
    this.credentials = credentials;
    this.client = getOrCreateClient(credentials.accountSid, credentials.authToken);
  }

  /**
   * Create a TwilioService for a specific organization.
   * Resolves credentials from the database or environment.
   */
  static async forOrganization(organizationId: string): Promise<TwilioService> {
    const credentials = await resolveCredentials(organizationId);
    return new TwilioService(credentials);
  }

  /**
   * Send an SMS message via Twilio.
   * Retries transient failures up to MAX_RETRIES times with exponential backoff.
   */
  async sendSms(options: SendSmsOptions): Promise<SendSmsResult> {
    const { to, body, from, mediaUrl, statusCallback } = options;

    let fromOrService: { from: string } | { messagingServiceSid: string };

    if (from) {
      fromOrService = { from };
    } else if (this.credentials.messagingServiceSid) {
      fromOrService = { messagingServiceSid: this.credentials.messagingServiceSid };
    } else {
      throw new Error("A from number or messaging service SID is required");
    }

    const message = await this.withRetry(() =>
      this.client.messages.create({
        to,
        body,
        ...fromOrService,
        ...(mediaUrl?.length ? { mediaUrl } : {}),
        ...(statusCallback ? { statusCallback } : {}),
      })
    );

    return {
      sid: message.sid,
      status: message.status,
      segments: message.numSegments ? Number(message.numSegments) : 1,
      dateCreated: message.dateCreated?.toISOString() ?? new Date().toISOString(),
    };
  }

  /**
   * Send a message using Twilio ContentSid (for WhatsApp templates).
   * Uses ContentSid + ContentVariables instead of Body.
   */
  async sendWithContent(options: {
    to: string;
    from?: string;
    contentSid: string;
    contentVariables?: string;
  }): Promise<SendSmsResult> {
    const { to, from, contentSid, contentVariables } = options;

    let fromOrService: { from: string } | { messagingServiceSid: string };

    if (from) {
      fromOrService = { from };
    } else if (this.credentials.messagingServiceSid) {
      fromOrService = { messagingServiceSid: this.credentials.messagingServiceSid };
    } else {
      throw new Error("A from number or messaging service SID is required");
    }

    const message = await this.withRetry(() =>
      this.client.messages.create({
        to,
        contentSid,
        ...(contentVariables ? { contentVariables } : {}),
        ...fromOrService,
      })
    );

    return {
      sid: message.sid,
      status: message.status,
      segments: message.numSegments ? Number(message.numSegments) : 1,
      dateCreated: message.dateCreated?.toISOString() ?? new Date().toISOString(),
    };
  }

  /**
   * Fetch the current status of a message by its Twilio SID.
   */
  async getMessageStatus(twilioSid: string): Promise<MessageInstance> {
    return this.client.messages(twilioSid).fetch();
  }

  /**
   * List all phone numbers owned by this Twilio account.
   */
  async listPhoneNumbers(): Promise<SmsPhoneNumber[]> {
    const numbers = await this.client.incomingPhoneNumbers.list();
    return numbers.map(mapTwilioNumber);
  }

  /**
   * Search for available phone numbers to purchase.
   */
  async searchAvailableNumbers(
    areaCode?: string,
    numberType: "local" | "toll_free" = "local"
  ): Promise<AvailablePhoneNumber[]> {
    const params: Record<string, unknown> = { limit: 20 };
    if (areaCode) params.areaCode = areaCode;

    const list =
      numberType === "toll_free"
        ? await this.client.availablePhoneNumbers("US").tollFree.list(params)
        : await this.client.availablePhoneNumbers("US").local.list(params);

    return list.map((n) => ({
      phoneNumber: n.phoneNumber,
      friendlyName: n.friendlyName,
      locality: n.locality,
      region: n.region,
      capabilities: {
        sms: Boolean(n.capabilities?.sms),
        mms: Boolean(n.capabilities?.mms),
        voice: Boolean(n.capabilities?.voice),
      },
    }));
  }

  /**
   * Purchase a phone number from Twilio.
   */
  async purchasePhoneNumber(
    phoneNumber: string,
    statusCallbackUrl?: string
  ): Promise<IncomingPhoneNumberInstance> {
    const params: Record<string, unknown> = { phoneNumber };
    if (statusCallbackUrl) {
      params.smsUrl = statusCallbackUrl;
    }
    return this.client.incomingPhoneNumbers.create(params);
  }

  /**
   * Release (delete) a phone number from the Twilio account.
   */
  async releasePhoneNumber(twilioSid: string): Promise<boolean> {
    return this.client.incomingPhoneNumbers(twilioSid).remove();
  }

  /**
   * Validate that the Twilio credentials are working by making a test API call.
   */
  async validateCredentials(): Promise<boolean> {
    try {
      await this.client.api.accounts(this.credentials.accountSid).fetch();
      return true;
    } catch {
      return false;
    }
  }

  // ── Retry logic ────────────────────────────────────────────────────

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error: unknown) {
        lastError = error;
        if (attempt < MAX_RETRIES && isTransient(error)) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          await sleep(delay);
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────

function isTransient(error: unknown): boolean {
  if (typeof error === "object" && error !== null && "status" in error) {
    return TRANSIENT_STATUS_CODES.includes((error as { status: number }).status);
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** US toll-free area code prefixes (800, 833, 844, 855, 866, 877, 888) */
const TOLL_FREE_PREFIXES = ["800", "833", "844", "855", "866", "877", "888"];

function isTollFreeNumber(phoneNumber: string): boolean {
  const match = phoneNumber.match(/^\+1(\d{3})/);
  return match ? TOLL_FREE_PREFIXES.includes(match[1]) : false;
}

function mapTwilioNumber(n: IncomingPhoneNumberInstance): SmsPhoneNumber {
  return {
    id: "",
    organization_id: "",
    phone_number: n.phoneNumber,
    twilio_sid: n.sid,
    messaging_service_sid: null,
    number_type: isTollFreeNumber(n.phoneNumber) ? "toll_free" : "local",
    status: "active",
    capabilities: {
      sms: Boolean(n.capabilities?.sms),
      mms: Boolean(n.capabilities?.mms),
      voice: Boolean(n.capabilities?.voice),
    },
    monthly_cost_cents: 0,
    created_at: n.dateCreated?.toISOString() ?? "",
    updated_at: n.dateUpdated?.toISOString() ?? "",
  };
}

/**
 * Map a Twilio error code to a user-friendly message.
 * Falls back to the original error message if unmapped.
 */
export function mapTwilioError(errorCode: number | undefined, fallback: string): string {
  if (errorCode && TWILIO_ERROR_MAP[errorCode]) {
    return TWILIO_ERROR_MAP[errorCode];
  }
  return fallback;
}
