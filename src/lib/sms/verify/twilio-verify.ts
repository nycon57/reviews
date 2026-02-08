import Twilio from "twilio";
import { resolveCredentials } from "../twilio-client";
import { maskPhone } from "../phone-utils";
import {
  ENV_TWILIO_VERIFY_SERVICE_SID,
} from "../constants";

// ── Types ──────────────────────────────────────────────────────────────

export type VerifyChannel = "sms" | "call";

export type VerifyStatus =
  | "pending"
  | "approved"
  | "canceled"
  | "max_attempts_reached"
  | "failed"
  | "expired";

export interface StartVerificationResult {
  sid: string;
  status: VerifyStatus;
  channel: VerifyChannel;
  to: string;
  valid: boolean;
}

export interface CheckVerificationResult {
  sid: string;
  status: VerifyStatus;
  to: string;
  valid: boolean;
}

// ── Errors ──────────────────────────────────────────────────────────────

export class VerifyServiceNotConfiguredError extends Error {
  constructor() {
    super(
      "Twilio Verify Service SID is not configured. " +
        "Set the TWILIO_VERIFY_SERVICE_SID environment variable."
    );
    this.name = "VerifyServiceNotConfiguredError";
  }
}

export class VerifyError extends Error {
  public readonly code?: number;
  constructor(message: string, code?: number) {
    super(message);
    this.name = "VerifyError";
    this.code = code;
  }
}

// ── Singleton client cache ──────────────────────────────────────────────

const verifyClientCache = new Map<string, Twilio.Twilio>();

function getOrCreateClient(accountSid: string, authToken: string): Twilio.Twilio {
  let client = verifyClientCache.get(accountSid);
  if (!client) {
    client = Twilio(accountSid, authToken);
    verifyClientCache.set(accountSid, client);
  }
  return client;
}

// ── TwilioVerifyService ─────────────────────────────────────────────────

/**
 * Wraps the Twilio Verify API for OTP-based phone number verification.
 *
 * Used during the double opt-in flow:
 * 1. `startVerification()` sends a 6-digit OTP to the phone number.
 * 2. `checkVerification()` validates the code the user enters.
 *
 * Twilio manages OTP generation, delivery, expiry, and rate limiting.
 * We keep the sms_consent table writes for our own audit trail.
 */
export class TwilioVerifyService {
  private client: Twilio.Twilio;
  private verifyServiceSid: string;

  constructor(client: Twilio.Twilio, verifyServiceSid: string) {
    this.client = client;
    this.verifyServiceSid = verifyServiceSid;
  }

  /**
   * Create a TwilioVerifyService for a specific organization.
   * Resolves Twilio credentials from org settings / env, then reads the
   * Verify Service SID from the environment.
   */
  static async forOrganization(organizationId: string): Promise<TwilioVerifyService> {
    const credentials = await resolveCredentials(organizationId);
    const client = getOrCreateClient(credentials.accountSid, credentials.authToken);

    const verifyServiceSid = process.env[ENV_TWILIO_VERIFY_SERVICE_SID];
    if (!verifyServiceSid) {
      throw new VerifyServiceNotConfiguredError();
    }

    return new TwilioVerifyService(client, verifyServiceSid);
  }

  /**
   * Send a verification OTP to a phone number.
   *
   * @param phoneNumber - E.164 formatted phone number (e.g. +15551234567)
   * @param channel     - Delivery channel: "sms" (default) or "call"
   */
  async startVerification(
    phoneNumber: string,
    channel: VerifyChannel = "sms"
  ): Promise<StartVerificationResult> {
    try {
      console.log(
        `[TwilioVerify] Starting ${channel} verification for ${maskPhone(phoneNumber)}`
      );

      const verification = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verifications.create({
          to: phoneNumber,
          channel,
        });

      console.log(
        `[TwilioVerify] Verification started: sid=${verification.sid} status=${verification.status}`
      );

      return {
        sid: verification.sid,
        status: verification.status as VerifyStatus,
        channel: verification.channel as VerifyChannel,
        to: verification.to,
        valid: verification.valid,
      };
    } catch (error: unknown) {
      const twilioErr = error as { code?: number; message?: string };
      console.error(
        `[TwilioVerify] startVerification failed for ${maskPhone(phoneNumber)}: ` +
          `code=${twilioErr.code} message=${twilioErr.message}`
      );
      throw new VerifyError(
        mapVerifyErrorMessage(twilioErr.code, twilioErr.message),
        twilioErr.code
      );
    }
  }

  /**
   * Check a verification code entered by the user.
   *
   * @param phoneNumber - E.164 formatted phone number
   * @param code        - The 6-digit OTP code the user provided
   * @returns Result with `valid: true` and `status: "approved"` on success
   */
  async checkVerification(
    phoneNumber: string,
    code: string
  ): Promise<CheckVerificationResult> {
    try {
      console.log(
        `[TwilioVerify] Checking verification for ${maskPhone(phoneNumber)}`
      );

      const check = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks.create({
          to: phoneNumber,
          code,
        });

      console.log(
        `[TwilioVerify] Verification check: sid=${check.sid} status=${check.status} valid=${check.valid}`
      );

      return {
        sid: check.sid,
        status: check.status as VerifyStatus,
        to: check.to,
        valid: check.valid,
      };
    } catch (error: unknown) {
      const twilioErr = error as { code?: number; message?: string };
      console.error(
        `[TwilioVerify] checkVerification failed for ${maskPhone(phoneNumber)}: ` +
          `code=${twilioErr.code} message=${twilioErr.message}`
      );
      throw new VerifyError(
        mapVerifyErrorMessage(twilioErr.code, twilioErr.message),
        twilioErr.code
      );
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Map known Twilio Verify error codes to user-friendly messages.
 */
function mapVerifyErrorMessage(
  code: number | undefined,
  fallback: string | undefined
): string {
  const VERIFY_ERROR_MAP: Record<number, string> = {
    20003: "Authentication failed. Check Twilio credentials.",
    20404: "Verify Service not found. Check TWILIO_VERIFY_SERVICE_SID.",
    20429: "Too many verification attempts. Please wait before trying again.",
    60200: "Invalid phone number for verification.",
    60202: "Max send attempts reached for this phone number.",
    60203: "Max check attempts reached. Please request a new code.",
    60205: "Verification has expired. Please request a new code.",
    60212: "Verification is no longer pending.",
  };

  if (code && VERIFY_ERROR_MAP[code]) {
    return VERIFY_ERROR_MAP[code];
  }

  return fallback ?? "Verification failed. Please try again.";
}
