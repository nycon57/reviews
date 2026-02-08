import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { TwilioService, mapTwilioError } from "./twilio-client";
import { toE164 } from "./phone-utils";
import { calculateSegments } from "./segment-calculator";
import { checkRateLimits } from "./rate-limiter";
import {
  CreditService,
  InsufficientCreditsError,
} from "./credits/credit-service";
import { ConsentService, ConsentRequiredError } from "./consent-service";
import { QuietHoursEngine, QuietHoursError } from "./quiet-hours";
import { StateQuietHoursService } from "./enterprise/state-quiet-hours";
import { resolveLoFromNumber } from "./enterprise/per-lo-numbers";
import { SmsAuditLogger } from "./audit/audit-logger";
import type {
  SmsSendResult,
  SmsLogEntry,
  SendReviewRequestInput,
  SendCustomMessageInput,
  SmsMessage,
} from "./types";

// ── Re-export errors for consumers ────────────────────────────────────

export { ConsentRequiredError } from "./consent-service";
export { QuietHoursError } from "./quiet-hours";
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
  private consentService: ConsentService;
  private quietHoursEngine: QuietHoursEngine;
  private stateQuietHours: StateQuietHoursService;
  private auditLogger: SmsAuditLogger;

  private constructor(organizationId: string, twilioService: TwilioService) {
    this.organizationId = organizationId;
    this.twilioService = twilioService;
    this.creditService = new CreditService(organizationId);
    this.consentService = new ConsentService();
    this.quietHoursEngine = new QuietHoursEngine();
    this.stateQuietHours = new StateQuietHoursService();
    this.auditLogger = new SmsAuditLogger();
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
   *
   * Messages blocked by quiet hours are queued with scheduled_at set to
   * the next valid send window.
   */
  async sendReviewRequest(input: SendReviewRequestInput): Promise<SmsSendResult> {
    const startMs = Date.now();
    const normalizedPhone = toE164(input.borrowerPhone);
    if (!normalizedPhone) {
      return { success: false, error: "Invalid phone number" };
    }

    try {
      // 1. Validate consent (mandatory per TCPA)
      await this.consentService.requireConsent(this.organizationId, normalizedPhone);

      // 1b. Gate on 10DLC registration status
      const registrationCheck = await this.require10DLCRegistration();
      if (!registrationCheck.allowed) {
        return { success: false, error: registrationCheck.error!, errorCode: "REGISTRATION_INCOMPLETE" };
      }

      // 2. Check quiet hours (queues if blocked)
      const quietResult = await this.quietHoursEngine.check(
        this.organizationId,
        normalizedPhone
      );

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

      // If quiet hours are active, queue the message instead of sending
      if (quietResult.blocked && quietResult.nextValidTime) {
        return this.queueMessage({
          loanOfficerId: input.loanOfficerId,
          borrowerId: input.borrowerId,
          phone: normalizedPhone,
          body,
          templateId: input.templateId,
          segments: segmentInfo.segments,
          scheduledAt: quietResult.nextValidTime,
          startMs,
        });
      }

      // 6. Check rate limits
      const rateCheck = await checkRateLimits(normalizedPhone, this.organizationId);
      if (!rateCheck.allowed) {
        throw new RateLimitError(rateCheck.reason ?? "Rate limit exceeded", rateCheck.retryAfter);
      }

      // 6b. Check credit balance before sending
      await this.requireCredits(segmentInfo.segments);

      // 7. Resolve from number (per-LO number priority)
      const fromNumber = await this.resolveFromNumber(input.loanOfficerId);

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

      // 11. Audit log
      await this.auditLogger.log({
        organizationId: this.organizationId,
        eventType: "message_sent",
        phoneNumber: normalizedPhone,
        loanOfficerId: input.loanOfficerId,
        messageId,
        details: { segments: segmentInfo.segments, template_id: input.templateId },
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
      await this.consentService.requireConsent(this.organizationId, normalizedPhone);

      // Gate on 10DLC registration status
      const registrationCheck = await this.require10DLCRegistration();
      if (!registrationCheck.allowed) {
        return { success: false, error: registrationCheck.error!, errorCode: "REGISTRATION_INCOMPLETE" };
      }

      const quietResult = await this.quietHoursEngine.check(
        this.organizationId,
        normalizedPhone
      );

      const segmentInfo = calculateSegments(input.body);

      // Queue if in quiet hours
      if (quietResult.blocked && quietResult.nextValidTime) {
        return this.queueMessage({
          loanOfficerId: input.loanOfficerId,
          phone: normalizedPhone,
          body: input.body,
          segments: segmentInfo.segments,
          scheduledAt: quietResult.nextValidTime,
          startMs,
        });
      }

      const rateCheck = await checkRateLimits(normalizedPhone, this.organizationId);
      if (!rateCheck.allowed) {
        throw new RateLimitError(rateCheck.reason ?? "Rate limit exceeded", rateCheck.retryAfter);
      }

      await this.requireCredits(segmentInfo.segments);

      const fromNumber = await this.resolveFromNumber(input.loanOfficerId);

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

      await this.auditLogger.log({
        organizationId: this.organizationId,
        eventType: "message_sent",
        phoneNumber: normalizedPhone,
        loanOfficerId: input.loanOfficerId,
        messageId,
        details: { segments: segmentInfo.segments },
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

  /**
   * Queue a message for delivery after quiet hours end.
   * Persists the message with status "queued" and scheduled_at set to
   * the next valid send window.
   */
  private async queueMessage(opts: {
    loanOfficerId: string;
    borrowerId?: string;
    phone: string;
    body: string;
    templateId?: string;
    segments: number;
    scheduledAt: string;
    startMs: number;
  }): Promise<SmsSendResult> {
    const fromNumber = await this.resolveFromNumber(opts.loanOfficerId);

    const messageId = await this.persistMessage({
      loan_officer_id: opts.loanOfficerId,
      borrower_id: opts.borrowerId,
      direction: "outbound",
      from_number: fromNumber,
      to_number: opts.phone,
      body: opts.body,
      template_id: opts.templateId,
      status: "queued",
      segments: opts.segments,
      scheduled_at: opts.scheduledAt,
    });

    this.log({
      organization_id: this.organizationId,
      message_id: messageId,
      status: "queued",
      duration_ms: Date.now() - opts.startMs,
      segments: opts.segments,
    });

    await this.auditLogger.log({
      organizationId: this.organizationId,
      eventType: "message_queued",
      phoneNumber: opts.phone,
      loanOfficerId: opts.loanOfficerId,
      messageId,
      details: {
        scheduled_at: opts.scheduledAt,
        reason: "quiet_hours",
        segments: opts.segments,
      },
    });

    return {
      success: true,
      messageId,
      segments: opts.segments,
      scheduledAt: opts.scheduledAt,
    };
  }

  /**
   * Check that the org has completed 10DLC registration before allowing sends.
   */
  private async require10DLCRegistration(): Promise<{ allowed: boolean; error?: string }> {
    const supabase = createUntypedAdminClient();
    const { data: settings } = await supabase
      .from("sms_settings")
      .select("registration_status")
      .eq("organization_id", this.organizationId)
      .single();

    if (!settings || settings.registration_status !== "fully_registered") {
      return {
        allowed: false,
        error: "SMS registration not complete. Complete 10DLC registration in Settings.",
      };
    }

    return { allowed: true };
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

  /**
   * Resolve from number with per-LO number priority:
   * 1. LO's dedicated number (if assigned)
   * 2. Org default_from_number
   * 3. First active org phone number
   */
  private async resolveFromNumber(loanOfficerId?: string): Promise<string> {
    // Check for per-LO dedicated number first
    if (loanOfficerId) {
      const loNumber = await resolveLoFromNumber(
        this.organizationId,
        loanOfficerId
      );
      if (loNumber) return loNumber;
    }

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
      .is("loan_officer_id", null)
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
