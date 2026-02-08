import { createUntypedAdminClient } from "@/lib/supabase/admin";
import type { UntypedSupabaseClient } from "@/lib/supabase/admin";
import {
  OPT_OUT_KEYWORDS,
  OPT_IN_KEYWORDS,
  HELP_KEYWORDS,
} from "./webhook-validation";
import { ConsentService } from "./consent-service";

// ── Types ───────────────────────────────────────────────────────────────

export type KeywordType = "opt_out" | "opt_in" | "double_opt_in_confirm" | "help" | "none";

export interface KeywordResult {
  type: KeywordType;
  response: string;
  consentUpdated: boolean;
}

/** Default responses when org settings are not configured */
const DEFAULT_STOP_RESPONSE =
  "You have been unsubscribed and will no longer receive messages. Reply START to resubscribe.";
const DEFAULT_START_RESPONSE =
  "You have been resubscribed and will receive messages again. Reply STOP to unsubscribe.";
const DEFAULT_HELP_RESPONSE =
  "Reply STOP to unsubscribe or START to resubscribe. For support, contact your loan officer directly.";

// ── KeywordHandler ──────────────────────────────────────────────────────

/**
 * Processes inbound SMS keywords for TCPA compliance.
 *
 * Handles STOP/START/HELP keywords and double opt-in confirmations.
 * Uses configurable response messages from org settings. Falls back
 * to TCPA-compliant defaults when settings are not configured.
 */
export class KeywordHandler {
  private supabase: UntypedSupabaseClient;
  private consentService: ConsentService;

  constructor(supabase?: UntypedSupabaseClient) {
    this.supabase = supabase ?? createUntypedAdminClient();
    this.consentService = new ConsentService(this.supabase);
  }

  /**
   * Classify the keyword type from a message body.
   * Normalizes: trims whitespace, converts to lowercase.
   */
  classifyKeyword(body: string): KeywordType {
    const normalized = body.trim().toLowerCase();

    if (OPT_OUT_KEYWORDS.has(normalized)) return "opt_out";
    if (HELP_KEYWORDS.has(normalized)) return "help";

    // "YES" is checked before general opt-in keywords because it serves
    // double duty: double opt-in confirmation when pending, otherwise opt-in.
    if (normalized === "yes") return "double_opt_in_confirm";

    if (OPT_IN_KEYWORDS.has(normalized)) return "opt_in";

    return "none";
  }

  /**
   * Process an inbound keyword message and return the appropriate response.
   *
   * - STOP keywords: immediately revoke consent, send confirmation
   * - START keywords: re-opt-in, send confirmation
   * - HELP keywords: send configurable help text
   * - YES keyword: confirm double opt-in if pending
   */
  async processKeyword(
    organizationId: string,
    phone: string,
    body: string
  ): Promise<KeywordResult> {
    const type = this.classifyKeyword(body);

    if (type === "none") {
      return { type: "none", response: "", consentUpdated: false };
    }

    // Load org settings for configurable responses
    const settings = await this.getOrgSettings(organizationId);

    switch (type) {
      case "opt_out":
        return this.handleOptOut(organizationId, phone, settings);
      case "opt_in":
        return this.handleOptIn(organizationId, phone, settings);
      case "help":
        return this.handleHelp(settings);
      case "double_opt_in_confirm":
        return this.handleDoubleOptInConfirm(organizationId, phone, settings);
      default:
        return { type: "none", response: "", consentUpdated: false };
    }
  }

  private async handleOptOut(
    organizationId: string,
    phone: string,
    settings: OrgKeywordSettings
  ): Promise<KeywordResult> {
    try {
      await this.consentService.revokeConsent({
        orgId: organizationId,
        phone,
        reason: "STOP keyword received",
      });
    } catch (error) {
      // Per TCPA: always honor STOP even if DB write fails
      console.error("[KeywordHandler] Opt-out DB update failed:", error);
    }

    return {
      type: "opt_out",
      response: settings.stopResponse,
      consentUpdated: true,
    };
  }

  private async handleOptIn(
    organizationId: string,
    phone: string,
    settings: OrgKeywordSettings
  ): Promise<KeywordResult> {
    try {
      await this.consentService.recordConsent({
        orgId: organizationId,
        phone,
        method: "sms_keyword",
        source: "START keyword",
      });
    } catch (error) {
      console.error("[KeywordHandler] Opt-in DB update failed:", error);
    }

    return {
      type: "opt_in",
      response: settings.startResponse,
      consentUpdated: true,
    };
  }

  private handleHelp(settings: OrgKeywordSettings): KeywordResult {
    // Interpolate org name into help response
    let response = settings.helpResponse;
    if (settings.orgName) {
      response = response.replace("{{org_name}}", settings.orgName);
    }

    return {
      type: "help",
      response,
      consentUpdated: false,
    };
  }

  private async handleDoubleOptInConfirm(
    organizationId: string,
    phone: string,
    settings: OrgKeywordSettings
  ): Promise<KeywordResult> {
    // Whether double opt-in is disabled, Twilio Verify handles OTP via web UI,
    // or legacy keyword confirmation — all paths re-opt-in the user.
    return this.handleOptIn(organizationId, phone, settings);
  }

  private async getOrgSettings(
    organizationId: string
  ): Promise<OrgKeywordSettings> {
    const [{ data }, { data: org }] = await Promise.all([
      this.supabase
        .from("sms_settings")
        .select(
          "stop_response, help_response, double_opt_in_enabled, double_opt_in_message, brand_name"
        )
        .eq("organization_id", organizationId)
        .maybeSingle(),
      this.supabase
        .from("organizations")
        .select("name")
        .eq("id", organizationId)
        .maybeSingle(),
    ]);

    return {
      stopResponse: data?.stop_response || DEFAULT_STOP_RESPONSE,
      startResponse: DEFAULT_START_RESPONSE,
      helpResponse: data?.help_response || DEFAULT_HELP_RESPONSE,
      doubleOptInEnabled: data?.double_opt_in_enabled ?? false,
      doubleOptInMessage: data?.double_opt_in_message || "",
      orgName: org?.name ?? data?.brand_name ?? null,
    };
  }
}

interface OrgKeywordSettings {
  stopResponse: string;
  startResponse: string;
  helpResponse: string;
  doubleOptInEnabled: boolean;
  doubleOptInMessage: string;
  orgName: string | null;
}
