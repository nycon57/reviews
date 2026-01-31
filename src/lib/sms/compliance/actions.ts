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

  // Fetch opt-in events, opt-out events, and daily send stats in parallel
  const [optInResult, optOutResult, statsResult] = await Promise.all([
    supabase
      .from("sms_consent")
      .select("opted_in_at")
      .eq("organization_id", auth.organizationId)
      .gte("opted_in_at", parsed.data.startDate)
      .lte("opted_in_at", parsed.data.endDate + "T23:59:59Z"),
    supabase
      .from("sms_consent")
      .select("opted_out_at")
      .eq("organization_id", auth.organizationId)
      .eq("status", "opted_out")
      .gte("opted_out_at", parsed.data.startDate)
      .lte("opted_out_at", parsed.data.endDate + "T23:59:59Z"),
    supabase
      .from("sms_daily_stats")
      .select("date, sent")
      .eq("organization_id", auth.organizationId)
      .gte("date", parsed.data.startDate)
      .lte("date", parsed.data.endDate)
      .order("date", { ascending: true }),
  ]);

  if (optInResult.error || optOutResult.error || statsResult.error) {
    return { success: false, error: "Failed to load compliance report" };
  }

  // Group opt-in events by date
  const optInByDate = new Map<string, number>();
  for (const row of optInResult.data ?? []) {
    if (!row.opted_in_at) continue;
    const date = new Date(row.opted_in_at).toISOString().split("T")[0];
    optInByDate.set(date, (optInByDate.get(date) ?? 0) + 1);
  }

  // Group opt-out events by date
  const optOutByDate = new Map<string, number>();
  for (const row of optOutResult.data ?? []) {
    if (!row.opted_out_at) continue;
    const date = new Date(row.opted_out_at).toISOString().split("T")[0];
    optOutByDate.set(date, (optOutByDate.get(date) ?? 0) + 1);
  }

  // Get daily send totals (aggregate loan officer rows)
  const sentByDate = new Map<string, number>();
  for (const row of statsResult.data ?? []) {
    sentByDate.set(row.date, (sentByDate.get(row.date) ?? 0) + row.sent);
  }

  // Collect all dates that have any activity
  const allDates = new Set([
    ...optInByDate.keys(),
    ...optOutByDate.keys(),
    ...sentByDate.keys(),
  ]);
  const sortedDates = Array.from(allDates).sort();

  const report: ComplianceReportRow[] = [];
  for (const date of sortedDates) {
    const optedIn = optInByDate.get(date) ?? 0;
    const optedOut = optOutByDate.get(date) ?? 0;
    const sent = sentByDate.get(date) ?? 0;
    // Daily compliance rate: percentage of sends to opted-in contacts
    // (100% if no opt-outs occurred that day, scaled by opt-out ratio)
    const complianceRate = sent > 0
      ? Math.round(((sent - optedOut) / sent) * 1000) / 10
      : 100;
    report.push({
      date,
      optedIn,
      optedOut,
      netChange: optedIn - optedOut,
      complianceRate: Math.max(0, complianceRate),
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

  // Fetch settings and recent stats in parallel
  const untypedSupabase = createUntypedAdminClient();
  const typedSupabase = createAdminClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [settingsResult, statsResult] = await Promise.all([
    untypedSupabase
      .from("sms_settings")
      .select("*")
      .eq("organization_id", auth.organizationId)
      .single(),
    typedSupabase
      .from("sms_daily_stats")
      .select("sent, opted_out")
      .eq("organization_id", auth.organizationId)
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0]),
  ]);

  const { data: rawSettings, error } = settingsResult;
  if (error && error.code !== "PGRST116") {
    return { success: false, error: "Failed to load settings" };
  }

  const settings = rawSettings as SmsSettings | null;
  const { data: recentStats } = statsResult;

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
    return `${csvEscape(optOutDate)},${csvEscape(maskedPhone)},${csvEscape(method)},${csvEscape(optInDate)},N/A`;
  });

  return { success: true, data: [headers, ...rows].join("\n") };
}

function maskPhone(phone: string): string {
  const last4 = phone.slice(-4);
  return `XXX-XXX-${last4}`;
}

/** Escape a value for safe CSV output (prevents formula injection). */
function csvEscape(value: string): string {
  // Wrap in quotes and escape existing quotes
  const escaped = value.replace(/"/g, '""');
  // Prefix with single quote if starts with formula character
  if (/^[=+\-@\t\r]/.test(escaped)) {
    return `"'${escaped}"`;
  }
  return `"${escaped}"`;
}
