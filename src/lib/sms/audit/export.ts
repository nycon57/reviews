"use server";

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUserWithProfile } from "@/lib/auth/actions";
import { maskPhone, formatForDisplay } from "../phone-utils";
import { z } from "zod";
import { createHash } from "crypto";
import { getAuditLogger } from "./audit-logger";

// ── Types ───────────────────────────────────────────────────────────────

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ── Schemas ─────────────────────────────────────────────────────────────

const exportMessagesSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const exportAuditLogSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  eventType: z.string().optional(),
  format: z.enum(["csv", "pdf"]).default("csv"),
});

// ── Auth ────────────────────────────────────────────────────────────────

async function requireAdminOrManager(): Promise<
  { organizationId: string; userId: string; email: string } | { error: string }
> {
  const profile = await unifiedGetUserWithProfile();
  if (!profile) return { error: "Not authenticated" };
  if (!profile.organization_id) return { error: "No organization found" };
  if (profile.role !== "admin" && profile.role !== "manager") {
    return { error: "Admin or manager role required" };
  }
  return {
    organizationId: profile.organization_id,
    userId: profile.id,
    email: profile.email,
  };
}

// ── SMS Message Export ──────────────────────────────────────────────────

/**
 * Export all SMS messages for a date range as CSV.
 *
 * Columns: date, time, direction, from, to (masked), body, status,
 * segments, cost, template used, LO name
 */
export async function exportSmsMessages(
  input: z.infer<typeof exportMessagesSchema>
): Promise<ActionResult<{ csv: string; filename: string; hash: string }>> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = exportMessagesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = createUntypedAdminClient();

  // Fetch messages with template and LO info
  const { data: messages, error } = await supabase
    .from("sms_messages")
    .select(
      `
      id,
      direction,
      from_number,
      to_number,
      body,
      status,
      segments,
      cost_cents,
      template_id,
      loan_officer_id,
      sent_at,
      created_at
    `
    )
    .eq("organization_id", auth.organizationId)
    .gte("created_at", parsed.data.startDate)
    .lte("created_at", parsed.data.endDate + "T23:59:59Z")
    .order("created_at", { ascending: true });

  if (error) {
    return { success: false, error: "Failed to export messages" };
  }

  const rows = messages ?? [];

  // Fetch template names
  const templateIds = [
    ...new Set(
      rows
        .map((r: Record<string, unknown>) => r.template_id as string | null)
        .filter(Boolean)
    ),
  ];
  const templateMap = new Map<string, string>();
  if (templateIds.length > 0) {
    const { data: templates } = await supabase
      .from("sms_templates")
      .select("id, name")
      .in("id", templateIds);
    for (const t of templates ?? []) {
      templateMap.set(t.id as string, t.name as string);
    }
  }

  // Fetch LO names
  const loIds = [
    ...new Set(
      rows
        .map((r: Record<string, unknown>) => r.loan_officer_id as string | null)
        .filter(Boolean)
    ),
  ];
  const loMap = new Map<string, string>();
  if (loIds.length > 0) {
    const { data: los } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", loIds);
    for (const lo of los ?? []) {
      loMap.set(lo.id as string, (lo.full_name as string) || "Unknown");
    }
  }

  // Build CSV
  const csvRows: string[] = [];
  csvRows.push(
    "Date,Time,Direction,From,To,Body,Status,Segments,Cost,Template,Loan Officer"
  );

  for (const msg of rows) {
    const m = msg as Record<string, unknown>;
    const dateTime = new Date(m.created_at as string);
    const date = dateTime.toISOString().split("T")[0];
    const time = dateTime.toISOString().split("T")[1].split(".")[0];
    const direction = m.direction as string;
    const from = formatForDisplay(m.from_number as string);
    const to = maskPhone(m.to_number as string);
    const body = escapeCsv(m.body as string);
    const status = m.status as string;
    const segments = String(m.segments ?? 0);
    const costCents = m.cost_cents as number;
    const cost = `$${((costCents ?? 0) / 100).toFixed(2)}`;
    const template =
      templateMap.get(m.template_id as string) ?? "";
    const loName = loMap.get(m.loan_officer_id as string) ?? "";

    csvRows.push(
      [date, time, direction, from, to, body, status, segments, cost, template, loName]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
  }

  const csv = csvRows.join("\n");
  const hash = createHash("sha256").update(csv).digest("hex");
  const filename = `sms-export-${parsed.data.startDate}-to-${parsed.data.endDate}.csv`;

  // Log the export
  const logger = getAuditLogger();
  await logger.log({
    organizationId: auth.organizationId,
    eventType: "export_generated",
    actorId: auth.userId,
    actorEmail: auth.email,
    details: {
      export_type: "messages",
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      row_count: rows.length,
      sha256_hash: hash,
    },
  });

  return { success: true, data: { csv, filename, hash } };
}

// ── Audit Log Export ────────────────────────────────────────────────────

/**
 * Export the compliance audit log as CSV for regulatory requests.
 * Includes a SHA-256 hash for authenticity verification.
 */
export async function exportAuditLog(
  input: z.infer<typeof exportAuditLogSchema>
): Promise<ActionResult<{ csv: string; filename: string; hash: string }>> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = exportAuditLogSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = createUntypedAdminClient();

  let query = supabase
    .from("sms_audit_log")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .gte("created_at", parsed.data.startDate)
    .lte("created_at", parsed.data.endDate + "T23:59:59Z")
    .order("created_at", { ascending: true });

  if (parsed.data.eventType) {
    query = query.eq("event_type", parsed.data.eventType);
  }

  const { data: entries, error } = await query;

  if (error) {
    return { success: false, error: "Failed to export audit log" };
  }

  const rows = entries ?? [];

  // Build CSV
  const csvRows: string[] = [];
  csvRows.push(
    "Timestamp,Event Type,Phone Number,Actor Email,Loan Officer ID,Message ID,Details,IP Address"
  );

  for (const entry of rows) {
    const e = entry as Record<string, unknown>;
    const timestamp = e.created_at as string;
    const eventType = e.event_type as string;
    const phone = (e.phone_number as string) ? maskPhone(e.phone_number as string) : "";
    const actorEmail = (e.actor_email as string) ?? "";
    const loId = (e.loan_officer_id as string) ?? "";
    const msgId = (e.message_id as string) ?? "";
    const details = JSON.stringify(e.details ?? {});
    const ip = (e.ip_address as string) ?? "";

    csvRows.push(
      [timestamp, eventType, phone, actorEmail, loId, msgId, details, ip]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
  }

  const csv = csvRows.join("\n");
  const hash = createHash("sha256").update(csv).digest("hex");
  const filename = `sms-audit-log-${parsed.data.startDate}-to-${parsed.data.endDate}.csv`;

  // Log the export itself
  const logger = getAuditLogger();
  await logger.log({
    organizationId: auth.organizationId,
    eventType: "export_generated",
    actorId: auth.userId,
    actorEmail: auth.email,
    details: {
      export_type: "audit_log",
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      row_count: rows.length,
      sha256_hash: hash,
      event_type_filter: parsed.data.eventType ?? null,
    },
  });

  return { success: true, data: { csv, filename, hash } };
}

// ── Helpers ─────────────────────────────────────────────────────────────

function escapeCsv(value: string): string {
  return value.replace(/\n/g, " ").replace(/\r/g, "");
}
