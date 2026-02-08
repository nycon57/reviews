import { createUntypedAdminClient } from "@/lib/supabase/admin";
import type { UntypedSupabaseClient } from "@/lib/supabase/admin";
import { toE164, maskPhone } from "./phone-utils";
import { TwilioVerifyService } from "./verify/twilio-verify";
import type { VerifyChannel } from "./verify/twilio-verify";
import type {
  SmsConsentStatus,
  SmsConsentMethod,
  ConsentRecord,
  RecordConsentInput,
  RevokeConsentInput,
  ConsentReportRow,
} from "./types";

// ── Errors ──────────────────────────────────────────────────────────────

export class ConsentRequiredError extends Error {
  constructor(phone: string) {
    super(`Consent not recorded for ${maskPhone(phone)}`);
    this.name = "ConsentRequiredError";
  }
}

// ── ConsentService ──────────────────────────────────────────────────────

/**
 * Manages SMS consent lifecycle for TCPA compliance.
 *
 * Consent records are append-only for audit purposes — status transitions
 * are recorded but rows are never deleted. The 5-year retention policy
 * is enforced at the database level via RLS and no DELETE permissions.
 */
export class ConsentService {
  private supabase: UntypedSupabaseClient;

  constructor(supabase?: UntypedSupabaseClient) {
    this.supabase = supabase ?? createUntypedAdminClient();
  }

  /**
   * Record explicit consent (opt-in) for a phone number.
   * Captures full audit trail: method, source, consent language, IP.
   */
  async recordConsent(input: RecordConsentInput): Promise<ConsentRecord> {
    const phone = toE164(input.phone);
    if (!phone) {
      throw new Error("Invalid phone number format");
    }

    const now = new Date().toISOString();

    // Check for existing consent record
    const { data: existing } = await this.supabase
      .from("sms_consent")
      .select("id, status")
      .eq("organization_id", input.orgId)
      .eq("phone_number", phone)
      .maybeSingle();

    if (existing) {
      // Update existing record — preserves the row for audit trail
      const { data, error } = await this.supabase
        .from("sms_consent")
        .update({
          status: "opted_in" as SmsConsentStatus,
          consent_method: input.method,
          consent_language: input.language ?? null,
          consent_source: input.source ?? null,
          consent_ip: input.ip ?? null,
          opted_in_at: now,
          updated_at: now,
        })
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error || !data) {
        throw new Error(`Failed to update consent: ${error?.message}`);
      }

      return mapToConsentRecord(data);
    }

    // Insert new consent record
    const { data, error } = await this.supabase
      .from("sms_consent")
      .insert({
        organization_id: input.orgId,
        phone_number: phone,
        status: "opted_in" as SmsConsentStatus,
        consent_method: input.method,
        consent_language: input.language ?? null,
        consent_source: input.source ?? null,
        consent_ip: input.ip ?? null,
        opted_in_at: now,
      })
      .select("*")
      .single();

    if (error || !data) {
      // Handle unique constraint race condition with a single retry
      if (error?.code === "23505") {
        const { data: retryData } = await this.supabase
          .from("sms_consent")
          .select("id, status")
          .eq("organization_id", input.orgId)
          .eq("phone_number", phone)
          .maybeSingle();

        if (retryData) {
          const { data: updated, error: updateErr } = await this.supabase
            .from("sms_consent")
            .update({
              status: "opted_in" as SmsConsentStatus,
              consent_method: input.method,
              consent_language: input.language ?? null,
              consent_source: input.source ?? null,
              consent_ip: input.ip ?? null,
              opted_in_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", retryData.id)
            .select("*")
            .single();

          if (updateErr || !updated) {
            throw new Error(`Failed to record consent after retry: ${updateErr?.message}`);
          }
          return mapToConsentRecord(updated);
        }
        throw new Error("Failed to record consent: race condition could not be resolved");
      }
      throw new Error(`Failed to record consent: ${error?.message}`);
    }

    return mapToConsentRecord(data);
  }

  /**
   * Revoke consent (opt-out) for a phone number.
   * Sets status to opted_out and records the timestamp. The original
   * consent record is preserved for the audit trail.
   */
  async revokeConsent(input: RevokeConsentInput): Promise<void> {
    const phone = toE164(input.phone);
    if (!phone) {
      throw new Error("Invalid phone number format");
    }

    const now = new Date().toISOString();

    const { data: existing } = await this.supabase
      .from("sms_consent")
      .select("id")
      .eq("organization_id", input.orgId)
      .eq("phone_number", phone)
      .maybeSingle();

    if (existing) {
      const { error } = await this.supabase
        .from("sms_consent")
        .update({
          status: "opted_out" as SmsConsentStatus,
          consent_method: "sms_keyword" as SmsConsentMethod,
          opted_out_at: now,
          updated_at: now,
        })
        .eq("id", existing.id);

      if (error) {
        throw new Error(`Failed to revoke consent: ${error.message}`);
      }
      return;
    }

    // No existing record — create one in opted_out state so we have
    // a record of the opt-out even if the number was never opted in.
    const { error } = await this.supabase.from("sms_consent").insert({
      organization_id: input.orgId,
      phone_number: phone,
      status: "opted_out" as SmsConsentStatus,
      consent_method: "sms_keyword" as SmsConsentMethod,
      opted_out_at: now,
    });

    if (error && error.code !== "23505") {
      throw new Error(`Failed to record opt-out: ${error.message}`);
    }
  }

  /**
   * Check whether a phone number has active consent for an organization.
   * Returns true only if the status is explicitly "opted_in".
   */
  async checkConsent(orgId: string, phone: string): Promise<boolean> {
    const normalized = toE164(phone);
    if (!normalized) return false;

    const { data } = await this.supabase
      .from("sms_consent")
      .select("status")
      .eq("organization_id", orgId)
      .eq("phone_number", normalized)
      .maybeSingle();

    return data?.status === "opted_in";
  }

  /**
   * Require consent before sending. Throws ConsentRequiredError if not opted in.
   */
  async requireConsent(orgId: string, phone: string): Promise<void> {
    const hasConsent = await this.checkConsent(orgId, phone);
    if (!hasConsent) {
      throw new ConsentRequiredError(phone);
    }
  }

  /**
   * Get the full consent history for a phone number within an organization.
   * Returns all consent records (never deleted) sorted by creation date.
   */
  async getConsentHistory(
    orgId: string,
    phone: string
  ): Promise<ConsentRecord[]> {
    const normalized = toE164(phone);
    if (!normalized) return [];

    const { data, error } = await this.supabase
      .from("sms_consent")
      .select("*")
      .eq("organization_id", orgId)
      .eq("phone_number", normalized)
      .order("created_at", { ascending: true });

    if (error || !data) return [];

    return data.map(mapToConsentRecord);
  }

  /**
   * Initiate the double opt-in flow using Twilio Verify.
   *
   * Sends a 6-digit OTP via SMS (or voice) to the phone number, then
   * sets the consent record to "pending" in our sms_consent table for
   * the audit trail.
   *
   * The caller should then collect the OTP from the user and call
   * `confirmDoubleOptIn()` to validate it.
   *
   * @param orgId   - Organization ID
   * @param phone   - Phone number (any US format, normalized to E.164)
   * @param method  - Consent method for audit trail
   * @param source  - Optional source identifier
   * @param ip      - Optional IP address for audit
   * @param channel - Twilio Verify channel: "sms" (default) or "call"
   */
  async initiateDoubleOptIn(
    orgId: string,
    phone: string,
    method: SmsConsentMethod,
    source?: string,
    ip?: string,
    channel: VerifyChannel = "sms"
  ): Promise<ConsentRecord> {
    const normalized = toE164(phone);
    if (!normalized) {
      throw new Error("Invalid phone number format");
    }

    const now = new Date().toISOString();

    // Check for existing consent record
    const { data: existing } = await this.supabase
      .from("sms_consent")
      .select("id, status")
      .eq("organization_id", orgId)
      .eq("phone_number", normalized)
      .maybeSingle();

    if (existing) {
      // If already opted in, return the existing record — no OTP needed
      if (existing.status === "opted_in") {
        const { data, error: fetchErr } = await this.supabase
          .from("sms_consent")
          .select("*")
          .eq("id", existing.id)
          .single();
        if (fetchErr || !data) {
          throw new Error(`Failed to fetch existing consent record: ${fetchErr?.message}`);
        }
        return mapToConsentRecord(data);
      }

      // Send OTP via Twilio Verify
      const verifyService = await TwilioVerifyService.forOrganization(orgId);
      await verifyService.startVerification(normalized, channel);

      // Update consent record to pending (write-through for audit trail)
      const { data, error } = await this.supabase
        .from("sms_consent")
        .update({
          status: "pending" as SmsConsentStatus,
          consent_method: method,
          consent_source: source ?? null,
          consent_ip: ip ?? null,
          updated_at: now,
        })
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error || !data) {
        throw new Error(`Failed to initiate double opt-in: ${error?.message}`);
      }
      return mapToConsentRecord(data);
    }

    // Send OTP via Twilio Verify before creating the consent record,
    // so we don't write a pending record for a number that can't receive OTPs.
    const verifyService = await TwilioVerifyService.forOrganization(orgId);
    await verifyService.startVerification(normalized, channel);

    // Create new pending consent record (write-through for audit trail)
    const { data, error } = await this.supabase
      .from("sms_consent")
      .insert({
        organization_id: orgId,
        phone_number: normalized,
        status: "pending" as SmsConsentStatus,
        consent_method: method,
        consent_source: source ?? null,
        consent_ip: ip ?? null,
      })
      .select("*")
      .single();

    if (error || !data) {
      if (error?.code === "23505") {
        // Race condition: another request inserted first. Fetch and update.
        const { data: raceRow } = await this.supabase
          .from("sms_consent")
          .select("id, status")
          .eq("organization_id", orgId)
          .eq("phone_number", normalized)
          .maybeSingle();

        if (raceRow) {
          if (raceRow.status === "opted_in") {
            const { data: fullRow } = await this.supabase
              .from("sms_consent")
              .select("*")
              .eq("id", raceRow.id)
              .single();
            return mapToConsentRecord(fullRow);
          }

          const { data: updated, error: updateErr } = await this.supabase
            .from("sms_consent")
            .update({
              status: "pending" as SmsConsentStatus,
              consent_method: method,
              consent_source: source ?? null,
              consent_ip: ip ?? null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", raceRow.id)
            .select("*")
            .single();

          if (updateErr || !updated) {
            throw new Error(`Failed to initiate double opt-in after retry: ${updateErr?.message}`);
          }
          return mapToConsentRecord(updated);
        }
        throw new Error("Failed to create pending consent: race condition could not be resolved");
      }
      throw new Error(`Failed to create pending consent: ${error?.message}`);
    }

    return mapToConsentRecord(data);
  }

  /**
   * Confirm double opt-in by validating the OTP code via Twilio Verify.
   *
   * If the code is valid (status: "approved"), transitions consent from
   * "pending" to "opted_in" in our sms_consent table.
   *
   * @param orgId - Organization ID
   * @param phone - Phone number (any US format)
   * @param code  - The 6-digit OTP code the user entered
   * @returns true if the code was valid and consent was confirmed
   */
  async confirmDoubleOptIn(orgId: string, phone: string, code: string): Promise<boolean> {
    const normalized = toE164(phone);
    if (!normalized) return false;

    // Validate the OTP via Twilio Verify
    const verifyService = await TwilioVerifyService.forOrganization(orgId);
    const result = await verifyService.checkVerification(normalized, code);

    if (!result.valid || result.status !== "approved") {
      console.warn(
        `[ConsentService] confirmDoubleOptIn: verification not approved for ${maskPhone(normalized)}. ` +
          `status=${result.status} valid=${result.valid}`
      );
      return false;
    }

    // OTP validated — transition consent to opted_in (write-through for audit trail)
    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from("sms_consent")
      .update({
        status: "opted_in" as SmsConsentStatus,
        opted_in_at: now,
        updated_at: now,
      })
      .eq("organization_id", orgId)
      .eq("phone_number", normalized)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[ConsentService] confirmDoubleOptIn DB update failed:", error.message);
      return false;
    }

    return data !== null;
  }

  /**
   * Generate a consent report for an organization over a date range.
   * Returns daily opt-in/opt-out counts and running totals.
   */
  async getConsentReport(
    orgId: string,
    startDate: string,
    endDate: string
  ): Promise<ConsentReportRow[]> {
    // Fetch opt-in and opt-out events in parallel
    const [optInResult, optOutResult, totalResult] = await Promise.all([
      this.supabase
        .from("sms_consent")
        .select("opted_in_at")
        .eq("organization_id", orgId)
        .not("opted_in_at", "is", null)
        .gte("opted_in_at", startDate)
        .lte("opted_in_at", endDate + "T23:59:59Z"),
      this.supabase
        .from("sms_consent")
        .select("opted_out_at")
        .eq("organization_id", orgId)
        .not("opted_out_at", "is", null)
        .gte("opted_out_at", startDate)
        .lte("opted_out_at", endDate + "T23:59:59Z"),
      // Count total consented before start date for running total
      this.supabase
        .from("sms_consent")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("status", "opted_in")
        .lt("opted_in_at", startDate),
    ]);

    if (optInResult.error || optOutResult.error) {
      throw new Error("Failed to load consent report data");
    }

    // Group events by date
    const optInByDate = new Map<string, number>();
    for (const row of optInResult.data ?? []) {
      if (!row.opted_in_at) continue;
      const date = row.opted_in_at.split("T")[0];
      optInByDate.set(date, (optInByDate.get(date) ?? 0) + 1);
    }

    const optOutByDate = new Map<string, number>();
    for (const row of optOutResult.data ?? []) {
      if (!row.opted_out_at) continue;
      const date = row.opted_out_at.split("T")[0];
      optOutByDate.set(date, (optOutByDate.get(date) ?? 0) + 1);
    }

    // Build the report with running totals
    const allDates = new Set([...optInByDate.keys(), ...optOutByDate.keys()]);
    const sortedDates = Array.from(allDates).sort();

    let runningTotal = totalResult.count ?? 0;
    const report: ConsentReportRow[] = [];

    for (const date of sortedDates) {
      const optedIn = optInByDate.get(date) ?? 0;
      const optedOut = optOutByDate.get(date) ?? 0;
      runningTotal += optedIn - optedOut;

      report.push({
        date,
        optedIn,
        optedOut,
        netChange: optedIn - optedOut,
        totalConsented: Math.max(0, runningTotal),
      });
    }

    return report;
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────

function mapToConsentRecord(row: Record<string, unknown>): ConsentRecord {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    phoneNumber: row.phone_number as string,
    status: row.status as SmsConsentStatus,
    method: (row.consent_method as SmsConsentMethod) ?? null,
    consentLanguage: (row.consent_language as string) ?? null,
    consentSource: (row.consent_source as string) ?? null,
    consentIp: (row.consent_ip as string) ?? null,
    optedInAt: (row.opted_in_at as string) ?? null,
    optedOutAt: (row.opted_out_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}
