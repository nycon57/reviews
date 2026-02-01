import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron/verify-secret";
import { createUntypedAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/sms-compliance-report
 *
 * Generates and sends a monthly compliance summary email to org admins.
 * Includes opt-out rate, consent health, quiet hours violations, and
 * registration status.
 *
 * Recommended: Run on the 1st of each month at 9 AM UTC.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await generateComplianceReports();

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[SMS Compliance Report] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    status: "healthy",
    endpoint: "sms-compliance-report",
    timestamp: new Date().toISOString(),
  });
}

// ── Report Generation ───────────────────────────────────────────────────

interface ComplianceReportResult {
  orgsProcessed: number;
  emailsSent: number;
  errors: string[];
}

async function generateComplianceReports(): Promise<ComplianceReportResult> {
  const supabase = createUntypedAdminClient();

  // Find all orgs with SMS settings (active SMS users)
  const { data: orgs, error: orgsError } = await supabase
    .from("sms_settings")
    .select("organization_id")
    .not("twilio_account_sid", "is", null);

  if (orgsError || !orgs) {
    throw new Error("Failed to load organizations with SMS settings");
  }

  const result: ComplianceReportResult = {
    orgsProcessed: 0,
    emailsSent: 0,
    errors: [],
  };

  // Calculate date range for last month
  const now = new Date();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const startDate = lastMonthStart.toISOString().split("T")[0];
  const endDate = lastMonthEnd.toISOString().split("T")[0];
  const monthLabel = lastMonthStart.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  for (const org of orgs) {
    const orgId = org.organization_id as string;
    try {
      const report = await generateOrgReport(supabase, orgId, startDate, endDate);
      await sendComplianceEmail(supabase, orgId, report, monthLabel);
      result.orgsProcessed++;
      result.emailsSent++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      result.errors.push(`Org ${orgId}: ${msg}`);
    }
  }

  return result;
}

interface OrgComplianceReport {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  optOutCount: number;
  optInCount: number;
  optOutRate: number;
  totalConsented: number;
  quietHoursBlocked: number;
  registrationStatus: string;
}

async function generateOrgReport(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  orgId: string,
  startDate: string,
  endDate: string
): Promise<OrgComplianceReport> {
  // Message stats — use count-only queries to avoid fetching all rows
  const dateFilter = { gte: startDate, lte: endDate + "T23:59:59Z" };

  const [
    { count: totalSentCount },
    { count: deliveredCount },
    { count: failedCount },
    { count: optOutCount },
    { count: optInCount },
    { count: totalConsented },
    { count: quietHoursBlocked },
  ] = await Promise.all([
    supabase
      .from("sms_messages")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("direction", "outbound")
      .gte("created_at", dateFilter.gte)
      .lte("created_at", dateFilter.lte),
    supabase
      .from("sms_messages")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("direction", "outbound")
      .eq("status", "delivered")
      .gte("created_at", dateFilter.gte)
      .lte("created_at", dateFilter.lte),
    supabase
      .from("sms_messages")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("direction", "outbound")
      .in("status", ["failed", "undelivered"])
      .gte("created_at", dateFilter.gte)
      .lte("created_at", dateFilter.lte),
    supabase
      .from("sms_audit_log")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("event_type", "opt_out_received")
      .gte("created_at", dateFilter.gte)
      .lte("created_at", dateFilter.lte),
    supabase
      .from("sms_consent")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "opted_in")
      .gte("opted_in_at", dateFilter.gte)
      .lte("opted_in_at", dateFilter.lte),
    supabase
      .from("sms_consent")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "opted_in"),
    supabase
      .from("sms_audit_log")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("event_type", "quiet_hours_blocked")
      .gte("created_at", dateFilter.gte)
      .lte("created_at", dateFilter.lte),
  ]);

  const totalSent = totalSentCount ?? 0;
  const totalDelivered = deliveredCount ?? 0;
  const totalFailed = failedCount ?? 0;

  // Registration status
  const { data: settings } = await supabase
    .from("sms_settings")
    .select("registration_status")
    .eq("organization_id", orgId)
    .single();

  const optOutRate =
    totalSent > 0 ? ((optOutCount ?? 0) / totalSent) * 100 : 0;

  return {
    totalSent,
    totalDelivered,
    totalFailed,
    optOutCount: optOutCount ?? 0,
    optInCount: optInCount ?? 0,
    optOutRate: Math.round(optOutRate * 100) / 100,
    totalConsented: totalConsented ?? 0,
    quietHoursBlocked: quietHoursBlocked ?? 0,
    registrationStatus:
      (settings?.registration_status as string) ?? "unknown",
  };
}

async function sendComplianceEmail(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  orgId: string,
  report: OrgComplianceReport,
  monthLabel: string
): Promise<void> {
  // Find admin emails for the org
  const { data: admins } = await supabase
    .from("users")
    .select("email, full_name")
    .eq("organization_id", orgId)
    .eq("role", "admin")
    .eq("is_active", true);

  if (!admins || admins.length === 0) return;

  // Get org name
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single();

  const orgName = (org?.name as string) ?? "Your Organization";
  const adminEmails = admins.map((a: Record<string, unknown>) => a.email as string);

  // Build plain text email body
  const body = buildComplianceEmailBody(orgName, monthLabel, report);

  // Send via Resend if configured, otherwise log
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "RepWell SMS Compliance <noreply@repwell.com>",
          to: adminEmails,
          subject: `SMS Compliance Summary — ${monthLabel}`,
          text: body,
        }),
      });
    } catch (err) {
      console.error("[SMS Compliance Report] Email send failed:", err);
    }
  } else {
    console.log(
      "[SMS Compliance Report] Resend not configured. Report for",
      orgId,
      ":",
      JSON.stringify(report)
    );
  }
}

function buildComplianceEmailBody(
  orgName: string,
  monthLabel: string,
  report: OrgComplianceReport
): string {
  let registrationLabel: string;
  switch (report.registrationStatus) {
    case "approved":
      registrationLabel = "Approved";
      break;
    case "pending":
      registrationLabel = "Pending";
      break;
    case "rejected":
      registrationLabel = "REJECTED — Action Required";
      break;
    default:
      registrationLabel = "Not Registered";
  }

  return `SMS Compliance Summary — ${monthLabel}
Organization: ${orgName}

MESSAGE ACTIVITY
  Sent: ${report.totalSent}
  Delivered: ${report.totalDelivered}
  Failed: ${report.totalFailed}

CONSENT HEALTH
  New Opt-Ins: ${report.optInCount}
  Opt-Outs: ${report.optOutCount}
  Opt-Out Rate: ${report.optOutRate}%
  Total Active Consents: ${report.totalConsented}

COMPLIANCE
  Quiet Hours Blocked: ${report.quietHoursBlocked}
  A2P/10DLC Registration: ${registrationLabel}

${report.optOutRate > 5 ? "⚠ Opt-out rate exceeds 5%. Review your messaging strategy to reduce unsubscribes.\n" : ""}${report.registrationStatus === "rejected" ? "⚠ A2P/10DLC registration was rejected. Re-submit in Settings > SMS to resume sending.\n" : ""}
This report is generated automatically. View details in RepWell under Settings > SMS > Compliance.
`;
}
