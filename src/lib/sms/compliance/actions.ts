"use server";

import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUserWithProfile } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import type { SmsSettings } from "@/lib/sms/types";
import {
  saveQuietHoursSchema,
  saveOptOutSettingsSchema,
  saveDoubleOptInSchema,
  saveConsentLanguageSchema,
  complianceReportSchema,
  type SaveQuietHoursInput,
  type SaveOptOutSettingsInput,
  type SaveDoubleOptInInput,
  type SaveConsentLanguageInput,
  type ComplianceReportInput,
} from "./schemas";

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

export async function saveQuietHours(
  input: SaveQuietHoursInput
): Promise<ActionResult> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = saveQuietHoursSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("sms_settings")
    .update({
      quiet_hours_enabled: parsed.data.quietHoursEnabled,
      quiet_hours_start: parsed.data.quietHoursStart,
      quiet_hours_end: parsed.data.quietHoursEnd,
      quiet_hours_timezone: parsed.data.quietHoursTimezone,
      use_recipient_timezone: parsed.data.useRecipientTimezone,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", auth.organizationId);

  if (error) {
    return { success: false, error: "Failed to save quiet hours settings" };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function saveOptOutSettings(
  input: SaveOptOutSettingsInput
): Promise<ActionResult> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = saveOptOutSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  // Use untyped client for new columns not yet in generated types
  const supabase = createUntypedAdminClient();
  const { error } = await supabase
    .from("sms_settings")
    .update({
      stop_response: parsed.data.stopResponse,
      help_response: parsed.data.helpResponse,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", auth.organizationId);

  if (error) {
    return { success: false, error: "Failed to save opt-out settings" };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function saveDoubleOptIn(
  input: SaveDoubleOptInInput
): Promise<ActionResult> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = saveDoubleOptInSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  // Use untyped client for new columns not yet in generated types
  const supabase = createUntypedAdminClient();
  const { error } = await supabase
    .from("sms_settings")
    .update({
      double_opt_in_enabled: parsed.data.doubleOptInEnabled,
      double_opt_in_message: parsed.data.doubleOptInMessage,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", auth.organizationId);

  if (error) {
    return { success: false, error: "Failed to save double opt-in settings" };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function saveConsentLanguage(
  input: SaveConsentLanguageInput
): Promise<ActionResult> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = saveConsentLanguageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  // Use untyped client for new columns not yet in generated types
  const supabase = createUntypedAdminClient();
  const { error } = await supabase
    .from("sms_settings")
    .update({
      consent_language_text: parsed.data.consentLanguageText,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", auth.organizationId);

  if (error) {
    return { success: false, error: "Failed to save consent language" };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export interface ComplianceReportRow {
  date: string;
  optedIn: number;
  optedOut: number;
  netChange: number;
  complianceRate: number;
}

export async function getComplianceReport(
  input: ComplianceReportInput
): Promise<ActionResult<ComplianceReportRow[]>> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = complianceReportSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = createAdminClient();

  // Get daily stats for the date range
  const { data: dailyStats, error } = await supabase
    .from("sms_daily_stats")
    .select("date, sent, opted_out")
    .eq("organization_id", auth.organizationId)
    .gte("date", parsed.data.startDate)
    .lte("date", parsed.data.endDate)
    .order("date", { ascending: true });

  if (error) {
    return { success: false, error: "Failed to load compliance report" };
  }

  // Get total consent counts for compliance rate
  const { count: totalOptedIn } = await supabase
    .from("sms_consent")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", auth.organizationId)
    .eq("status", "opted_in");

  const { count: totalContacts } = await supabase
    .from("sms_consent")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", auth.organizationId);

  const baseRate =
    totalContacts && totalContacts > 0
      ? ((totalOptedIn ?? 0) / totalContacts) * 100
      : 100;

  // Aggregate by date (combine loan officer rows)
  const dateMap = new Map<string, { sent: number; optedOut: number }>();
  for (const row of dailyStats ?? []) {
    const existing = dateMap.get(row.date) ?? { sent: 0, optedOut: 0 };
    existing.sent += row.sent;
    existing.optedOut += row.opted_out;
    dateMap.set(row.date, existing);
  }

  const report: ComplianceReportRow[] = [];
  for (const [date, stats] of dateMap) {
    const optedIn = Math.max(0, stats.sent - stats.optedOut);
    report.push({
      date,
      optedIn,
      optedOut: stats.optedOut,
      netChange: optedIn - stats.optedOut,
      complianceRate: Math.round(baseRate * 10) / 10,
    });
  }

  return { success: true, data: report };
}

export interface ComplianceHealthScore {
  score: number;
  details: {
    quietHoursConfigured: boolean;
    tenDlcRegistered: boolean;
    consentLanguagePresent: boolean;
    optOutRateHealthy: boolean;
    doubleOptInEnabled: boolean;
  };
}

export async function getComplianceHealthScore(): Promise<
  ActionResult<ComplianceHealthScore>
> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  // Use untyped client to access new columns
  const supabase = createUntypedAdminClient();
  const { data: rawSettings, error } = await supabase
    .from("sms_settings")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .single();

  if (error && error.code !== "PGRST116") {
    return { success: false, error: "Failed to load settings" };
  }

  const settings = rawSettings as SmsSettings | null;

  // Get opt-out rate from last 30 days
  const typedSupabase = createAdminClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: recentStats } = await typedSupabase
    .from("sms_daily_stats")
    .select("sent, opted_out")
    .eq("organization_id", auth.organizationId)
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

  const totalSent = (recentStats ?? []).reduce((sum, r) => sum + r.sent, 0);
  const totalOptedOut = (recentStats ?? []).reduce(
    (sum, r) => sum + r.opted_out,
    0
  );
  const optOutRate = totalSent > 0 ? totalOptedOut / totalSent : 0;

  const details = {
    quietHoursConfigured: Boolean(settings?.quiet_hours_enabled),
    tenDlcRegistered: settings?.registration_status === "fully_registered",
    consentLanguagePresent: Boolean(
      settings?.consent_language_text &&
        settings.consent_language_text.trim().length > 0
    ),
    optOutRateHealthy: optOutRate < 0.05,
    doubleOptInEnabled: Boolean(settings?.double_opt_in_enabled),
  };

  // Weighted score: quiet hours 20%, 10DLC 30%, consent 20%, opt-out rate 20%, double opt-in 10%
  let score = 0;
  if (details.quietHoursConfigured) score += 20;
  if (details.tenDlcRegistered) score += 30;
  if (details.consentLanguagePresent) score += 20;
  if (details.optOutRateHealthy) score += 20;
  if (details.doubleOptInEnabled) score += 10;

  return { success: true, data: { score, details } };
}

export async function exportOptOutReport(
  input: ComplianceReportInput
): Promise<ActionResult<string>> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = complianceReportSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = createAdminClient();

  const { data: optOuts, error } = await supabase
    .from("sms_consent")
    .select("phone_number, consent_method, opted_in_at, opted_out_at")
    .eq("organization_id", auth.organizationId)
    .eq("status", "opted_out")
    .gte("opted_out_at", parsed.data.startDate)
    .lte("opted_out_at", parsed.data.endDate + "T23:59:59Z")
    .order("opted_out_at", { ascending: false });

  if (error) {
    return { success: false, error: "Failed to export opt-out report" };
  }

  // Build CSV with masked phone numbers
  const headers = "Date,Phone (Masked),Opt-Out Method,Original Opt-In Date,Messages Received";
  const rows = (optOuts ?? []).map((row) => {
    const maskedPhone = maskPhone(row.phone_number);
    const optOutDate = row.opted_out_at
      ? new Date(row.opted_out_at).toISOString().split("T")[0]
      : "";
    const optInDate = row.opted_in_at
      ? new Date(row.opted_in_at).toISOString().split("T")[0]
      : "";
    const method = row.consent_method ?? "unknown";
    return `${optOutDate},${maskedPhone},${method},${optInDate},N/A`;
  });

  return { success: true, data: [headers, ...rows].join("\n") };
}

function maskPhone(phone: string): string {
  const last4 = phone.slice(-4);
  return `XXX-XXX-${last4}`;
}
