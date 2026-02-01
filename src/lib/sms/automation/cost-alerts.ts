import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { CreditService } from "../credits/credit-service";
import { ALERT_THRESHOLDS } from "../credits/constants";
import type { AlertLevel } from "../credits/constants";
import type { CreditBalance } from "../credits/types";

/**
 * Check credit usage for an organization and send email notifications
 * at configured thresholds (75%, 90%, 100%, and first overage).
 *
 * Uses sms_cost_alert_log to prevent duplicate notifications
 * within a billing period.
 */
export async function checkCostAlerts(
  organizationId: string
): Promise<{ alertsSent: string[] }> {
  const supabase = createUntypedAdminClient();
  const creditService = new CreditService(organizationId);
  const balance = await creditService.checkBalance();

  if (balance.included <= 0) {
    return { alertsSent: [] };
  }

  const alertsSent: string[] = [];
  const ratio = balance.used / balance.included;

  const thresholdsToCheck: { level: AlertLevel | "overage"; threshold: number }[] = [
    { level: "warning", threshold: ALERT_THRESHOLDS.warning },
    { level: "critical", threshold: ALERT_THRESHOLDS.critical },
    { level: "exceeded", threshold: ALERT_THRESHOLDS.exceeded },
  ];

  for (const { level, threshold } of thresholdsToCheck) {
    if (ratio < threshold) continue;

    const alreadySent = await hasAlertBeenSent(
      supabase,
      organizationId,
      balance.periodStart,
      level
    );
    if (alreadySent) continue;

    await sendCostAlertEmail(organizationId, level as AlertLevel, balance);
    await recordAlertSent(supabase, organizationId, balance.periodStart, level);
    alertsSent.push(level);
  }

  if (balance.overage > 0) {
    const alreadySent = await hasAlertBeenSent(
      supabase,
      organizationId,
      balance.periodStart,
      "overage"
    );
    if (!alreadySent) {
      await sendOverageAlertEmail(organizationId, balance);
      await recordAlertSent(
        supabase,
        organizationId,
        balance.periodStart,
        "overage"
      );
      alertsSent.push("overage");
    }
  }

  return { alertsSent };
}

async function hasAlertBeenSent(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  organizationId: string,
  periodStart: string,
  alertLevel: string
): Promise<boolean> {
  const { data } = await supabase
    .from("sms_cost_alert_log")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("period_start", periodStart)
    .eq("alert_level", alertLevel)
    .maybeSingle();
  return !!data;
}

async function recordAlertSent(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  organizationId: string,
  periodStart: string,
  alertLevel: string
): Promise<void> {
  await supabase.from("sms_cost_alert_log").insert({
    organization_id: organizationId,
    period_start: periodStart,
    alert_level: alertLevel,
  });
}

async function getOrgAdminEmail(
  organizationId: string
): Promise<{ email: string; fullName: string | null } | null> {
  const supabase = createUntypedAdminClient();
  const { data: admin } = await supabase
    .from("users")
    .select("email, full_name")
    .eq("organization_id", organizationId)
    .eq("role", "admin")
    .limit(1)
    .single();

  if (!admin?.email) return null;
  return { email: admin.email, fullName: admin.full_name ?? null };
}

async function sendAlertEmail(
  to: string,
  subject: string,
  text: string
): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("[SMS Cost Alert] RESEND_API_KEY not configured");
    return;
  }
  const { Resend } = await import("resend");
  const resend = new Resend(resendApiKey);
  await resend.emails.send({
    from: "RepWell <notifications@repwell.com>",
    to,
    subject,
    text,
  });
}

async function sendCostAlertEmail(
  organizationId: string,
  level: AlertLevel,
  balance: CreditBalance
): Promise<void> {
  const admin = await getOrgAdminEmail(organizationId);
  if (!admin) {
    console.warn(`[SMS Cost Alert] No admin email found for org ${organizationId}`);
    return;
  }

  const percentage = Math.round((balance.used / balance.included) * 100);
  const subject = getCostAlertSubject(level, percentage);
  const body = getCostAlertBody(level, balance, percentage);

  try {
    await sendAlertEmail(admin.email, subject, body);
  } catch (error) {
    console.error(`[SMS Cost Alert] Failed to send email: ${error}`);
  }
}

async function sendOverageAlertEmail(
  organizationId: string,
  balance: CreditBalance
): Promise<void> {
  const admin = await getOrgAdminEmail(organizationId);
  if (!admin) return;

  const overageCost = (balance.overage * balance.overageRateCents) / 100;
  const projectedOverage = estimateMonthlyOverage(balance);

  const subject = "SMS Credit Overage Alert — RepWell";
  const body = [
    `Hi ${admin.fullName ?? "there"},`,
    "",
    "Your organization has exceeded its included SMS credits and is now incurring overage charges.",
    "",
    `Current overage: ${balance.overage} credits ($${overageCost.toFixed(2)})`,
    `Overage rate: $${(balance.overageRateCents / 100).toFixed(2)} per credit`,
    `Projected monthly overage cost: $${projectedOverage.toFixed(2)}`,
    "",
    "To manage costs, consider purchasing a credit pack or upgrading your plan.",
    "",
    "— RepWell",
  ].join("\n");

  try {
    await sendAlertEmail(admin.email, subject, body);
  } catch (error) {
    console.error(`[SMS Cost Alert] Overage email failed: ${error}`);
  }
}

function getCostAlertSubject(level: AlertLevel, percentage: number): string {
  switch (level) {
    case "warning":
      return `SMS Credits ${percentage}% Used — RepWell`;
    case "critical":
      return `SMS Credits ${percentage}% Used — Action Recommended`;
    case "exceeded":
      return `SMS Credits Depleted — RepWell`;
    default:
      return `SMS Credit Alert — RepWell`;
  }
}

function getCostAlertBody(
  level: AlertLevel,
  balance: CreditBalance,
  percentage: number
): string {
  const remaining = Math.max(0, balance.included - balance.used);
  const lines = [
    `Your SMS credit usage has reached ${percentage}% of your monthly allocation.`,
    "",
    `Used: ${balance.used} / ${balance.included} credits`,
    `Remaining: ${remaining} credits`,
    `Billing period: ${balance.periodStart} to ${balance.periodEnd}`,
  ];

  if (level === "exceeded") {
    lines.push(
      "",
      "Your included credits are fully used. Additional sends will incur overage charges.",
      "Consider purchasing a credit pack to avoid interruptions."
    );
  } else if (level === "critical") {
    lines.push(
      "",
      "You are close to running out of credits. Consider purchasing a credit pack."
    );
  }

  lines.push("", "— RepWell");
  return lines.join("\n");
}

function estimateMonthlyOverage(balance: CreditBalance): number {
  const periodStart = new Date(balance.periodStart);
  const periodEnd = new Date(balance.periodEnd);
  const now = new Date();

  const totalDays =
    (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
  const elapsedDays = Math.max(
    1,
    (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  const dailyOverageRate = balance.overage / elapsedDays;
  const projectedOverageCredits = dailyOverageRate * totalDays;

  return (projectedOverageCredits * balance.overageRateCents) / 100;
}
