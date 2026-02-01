import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { TwilioService, mapTwilioError } from "./twilio-client";
import { toE164, maskPhone } from "./phone-utils";
import { calculateSegments } from "./segment-calculator";
import { checkRateLimits } from "./rate-limiter";
import {
  CreditService,
  InsufficientCreditsError,
} from "./credits/credit-service";
import type {
  SmsSendResult,
  SmsLogEntry,
  SendReviewRequestInput,
  SendCustomMessageInput,
  SmsMessage,
} from "./types";

// ── Custom errors ──────────────────────────────────────────────────────

export class ConsentRequiredError extends Error {
  constructor(phone: string) {
    super(`Consent not recorded for ${maskPhone(phone)}`);
    this.name = "ConsentRequiredError";
  }
}

export class QuietHoursError extends Error {
  public nextValidTime: string;
  constructor(nextValidTime: string) {
    super(`Quiet hours active. Next valid send time: ${nextValidTime}`);
    this.name = "QuietHoursError";
    this.nextValidTime = nextValidTime;
  }
}

export { InsufficientCreditsError };

export class RateLimitError extends Error {
  public retryAfter?: string;
  constructor(message: string, retryAfter?: string) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

// ── SmsService ─────────────────────────────────────────────────────────

export class SmsService {
  private organizationId: string;
  private twilioService: TwilioService;
  private creditService: CreditService;

  private constructor(organizationId: string, twilioService: TwilioService) {
    this.organizationId = organizationId;
    this.twilioService = twilioService;
    this.creditService = new CreditService(organizationId);
  }

  static async forOrganization(organizationId: string): Promise<SmsService> {
    const twilioService = await TwilioService.forOrganization(organizationId);
    return new SmsService(organizationId, twilioService);
  }

  /**
   * Send a review request SMS to a borrower.
   * Full pipeline: validate consent -> check quiet hours -> resolve template
   *   -> calculate segments -> check rate limits -> send via Twilio
   *   -> persist to sms_messages -> deduct credits.
   */
  async sendReviewRequest(input: SendReviewRequestInput): Promise<SmsSendResult> {
    const startMs = Date.now();
    const normalizedPhone = toE164(input.borrowerPhone);
    if (!normalizedPhone) {
      return { success: false, error: "Invalid phone number" };
    }

    try {
      // 1. Validate consent
      await this.requireConsent(normalizedPhone);

      // 2. Check quiet hours
      await this.checkQuietHours();

      // 3. Resolve template
      const template = await this.resolveTemplate(input.templateId);
      if (!template) {
        return { success: false, error: "Template not found" };
      }

      // 4. Merge fields into template body
      const body = this.resolveMergeFields(template.body, {
        borrower_name: input.borrowerName,
      });

      // 5. Calculate segments
      const segmentInfo = calculateSegments(body);

      // 6. Check rate limits
      const rateCheck = await checkRateLimits(normalizedPhone, this.organizationId);
      if (!rateCheck.allowed) {
        throw new RateLimitError(rateCheck.reason ?? "Rate limit exceeded", rateCheck.retryAfter);
      }

      // 6b. Check credit balance before sending
      await this.requireCredits(segmentInfo.segments);

      // 7. Resolve from number
      const fromNumber = await this.resolveFromNumber();

      // 8. Send via Twilio
      const result = await this.twilioService.sendSms({
        to: normalizedPhone,
        body,
        from: fromNumber,
      });

      // 9. Persist to sms_messages
      const messageId = await this.persistMessage({
        loan_officer_id: input.loanOfficerId,
        borrower_id: input.borrowerId,
        direction: "outbound",
        from_number: fromNumber,
        to_number: normalizedPhone,
        body,
        template_id: input.templateId,
        twilio_sid: result.sid,
        status: result.status as SmsMessage["status"],
        segments: segmentInfo.segments,
        sent_at: new Date().toISOString(),
      });

      // 10. Deduct credits
      await this.deductCredits(segmentInfo.segments);

      this.log({
        organization_id: this.organizationId,
        message_id: messageId,
        status: "sent",
        duration_ms: Date.now() - startMs,
        segments: segmentInfo.segments,
      });

      return {
        success: true,
        messageId,
        twilioSid: result.sid,
        segments: segmentInfo.segments,
      };
    } catch (error) {
      return this.handleSendError(error, startMs);
    }
  }

  /**
   * Send a custom SMS message (not template-based).
   */
  async sendCustomMessage(input: SendCustomMessageInput): Promise<SmsSendResult> {
    const startMs = Date.now();
    const normalizedPhone = toE164(input.to);
    if (!normalizedPhone) {
      return { success: false, error: "Invalid phone number" };
    }

    try {
      await this.requireConsent(normalizedPhone);
      await this.checkQuietHours();

      const segmentInfo = calculateSegments(input.body);

      const rateCheck = await checkRateLimits(normalizedPhone, this.organizationId);
      if (!rateCheck.allowed) {
        throw new RateLimitError(rateCheck.reason ?? "Rate limit exceeded", rateCheck.retryAfter);
      }

      // Check credit balance before sending
      await this.requireCredits(segmentInfo.segments);

      const fromNumber = await this.resolveFromNumber();

      const result = await this.twilioService.sendSms({
        to: normalizedPhone,
        body: input.body,
        from: fromNumber,
      });

      const messageId = await this.persistMessage({
        loan_officer_id: input.loanOfficerId,
        direction: "outbound",
        from_number: fromNumber,
        to_number: normalizedPhone,
        body: input.body,
        twilio_sid: result.sid,
        status: result.status as SmsMessage["status"],
        segments: segmentInfo.segments,
        sent_at: new Date().toISOString(),
      });

      await this.deductCredits(segmentInfo.segments);

      this.log({
        organization_id: this.organizationId,
        message_id: messageId,
        status: "sent",
        duration_ms: Date.now() - startMs,
        segments: segmentInfo.segments,
      });

      return {
        success: true,
        messageId,
        twilioSid: result.sid,
        segments: segmentInfo.segments,
      };
    } catch (error) {
      return this.handleSendError(error, startMs);
    }
  }

  // ── Pipeline steps ─────────────────────────────────────────────────

  private async requireConsent(phone: string): Promise<void> {
    const supabase = createUntypedAdminClient();
    const { data } = await supabase
      .from("sms_consent")
      .select("status")
      .eq("organization_id", this.organizationId)
      .eq("phone_number", phone)
      .single();

    if (!data || data.status !== "opted_in") {
      throw new ConsentRequiredError(phone);
    }
  }

  private async checkQuietHours(): Promise<void> {
    const supabase = createUntypedAdminClient();
    const { data: settings } = await supabase
      .from("sms_settings")
      .select("quiet_hours_enabled, quiet_hours_start, quiet_hours_end, quiet_hours_timezone")
      .eq("organization_id", this.organizationId)
      .single();

    if (!settings?.quiet_hours_enabled) return;

    const now = new Date();
    // Resolve current time in the org's configured timezone
    const timeStr = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      timeZone: settings.quiet_hours_timezone,
    });

    const currentMinutes = timeToMinutes(timeStr);
    const startMinutes = timeToMinutes(settings.quiet_hours_start);
    const endMinutes = timeToMinutes(settings.quiet_hours_end);

    const inQuietHours =
      startMinutes > endMinutes
        ? currentMinutes >= startMinutes || currentMinutes < endMinutes // overnight window (e.g., 21:00-08:00)
        : currentMinutes >= startMinutes && currentMinutes < endMinutes;

    if (inQuietHours) {
      // Calculate next valid send time
      const nextValid = new Date(now);
      if (startMinutes > endMinutes) {
        // Overnight: next valid is the end time today or tomorrow
        nextValid.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
        if (currentMinutes >= startMinutes) {
          nextValid.setDate(nextValid.getDate() + 1);
        }
      } else {
        nextValid.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
      }
      throw new QuietHoursError(nextValid.toISOString());
    }
  }

  private async resolveTemplate(
    templateId: string
  ): Promise<{ body: string; merge_fields: string[] } | null> {
    const supabase = createUntypedAdminClient();
    const { data } = await supabase
      .from("sms_templates")
      .select("body, merge_fields")
      .eq("id", templateId)
      .eq("organization_id", this.organizationId)
      .eq("status", "active")
      .single();

    return data ?? null;
  }

  private resolveMergeFields(
    body: string,
    values: Record<string, string>
  ): string {
    let resolved = body;
    for (const [key, value] of Object.entries(values)) {
      resolved = resolved.replaceAll(`{{${key}}}`, value);
    }
    return resolved;
  }

  private async resolveFromNumber(): Promise<string> {
    const supabase = createUntypedAdminClient();
    const { data: settings } = await supabase
      .from("sms_settings")
      .select("default_from_number")
      .eq("organization_id", this.organizationId)
      .single();

    if (settings?.default_from_number) {
      return settings.default_from_number;
    }

    // Fallback: use first active phone number for the org
    const { data: numbers } = await supabase
      .from("sms_phone_numbers")
      .select("phone_number")
      .eq("organization_id", this.organizationId)
      .eq("status", "active")
      .limit(1)
      .single();

    if (numbers?.phone_number) {
      return numbers.phone_number;
    }

    throw new Error("No from number configured. Add a phone number in SMS settings.");
  }

  private async persistMessage(
    message: Partial<SmsMessage> & {
      direction: string;
      from_number: string;
      to_number: string;
      body: string;
    }
  ): Promise<string> {
    const supabase = createUntypedAdminClient();
    const { data, error } = await supabase
      .from("sms_messages")
      .insert({
        organization_id: this.organizationId,
        ...message,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`Failed to persist SMS message: ${error?.message}`);
    }
    return data.id;
  }

  /**
   * Checks credit balance and throws InsufficientCreditsError if the org
   * cannot cover the required segments (no remaining credits and overage
   * is not allowed).
   */
  private async requireCredits(segments: number): Promise<void> {
    const balance = await this.creditService.checkBalance();

    if (balance.remaining < segments && !balance.overageAllowed) {
      throw new InsufficientCreditsError(this.organizationId);
    }
  }

  private async deductCredits(segments: number): Promise<void> {
    await this.creditService.deductCredit(segments);
  }

  // ── Error handling ─────────────────────────────────────────────────

  private handleSendError(error: unknown, startMs: number): SmsSendResult {
    const duration_ms = Date.now() - startMs;

    if (error instanceof ConsentRequiredError) {
      this.log({ organization_id: this.organizationId, message_id: null, status: "failed", duration_ms, error_code: "CONSENT_REQUIRED" });
      return { success: false, error: error.message, errorCode: "CONSENT_REQUIRED" };
    }
    if (error instanceof QuietHoursError) {
      this.log({ organization_id: this.organizationId, message_id: null, status: "queued", duration_ms, error_code: "QUIET_HOURS" });
      return { success: false, error: error.message, errorCode: "QUIET_HOURS" };
    }
    if (error instanceof InsufficientCreditsError) {
      this.log({ organization_id: this.organizationId, message_id: null, status: "failed", duration_ms, error_code: "NO_CREDITS" });
      return { success: false, error: error.message, errorCode: "NO_CREDITS" };
    }
    if (error instanceof RateLimitError) {
      this.log({ organization_id: this.organizationId, message_id: null, status: "rate_limited", duration_ms, error_code: "RATE_LIMIT" });
      return { success: false, error: error.message, errorCode: "RATE_LIMIT" };
    }

    // Twilio SDK errors
    const twilioCode = (error as { code?: number })?.code;
    const userMessage = mapTwilioError(twilioCode, (error as Error)?.message ?? "SMS send failed");
    this.log({ organization_id: this.organizationId, message_id: null, status: "failed", duration_ms, error_code: String(twilioCode ?? "UNKNOWN") });
    return { success: false, error: userMessage, errorCode: String(twilioCode ?? "UNKNOWN") };
  }

  /**
   * Structured log entry. No PII is included (phone numbers are masked upstream).
   */
  private log(entry: SmsLogEntry): void {
    console.log(
      JSON.stringify({
        service: "sms",
        ...entry,
        timestamp: new Date().toISOString(),
      })
    );
  }
}

// ── Utilities ──────────────────────────────────────────────────────────

function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}
