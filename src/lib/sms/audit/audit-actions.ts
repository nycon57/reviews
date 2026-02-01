"use server";

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUserWithProfile } from "@/lib/auth/actions";
import { z } from "zod";
import type { AuditLogEntry, SmsAuditEventType } from "./audit-logger";

// ── Types ───────────────────────────────────────────────────────────────

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export interface AuditLogPage {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ── Schemas ─────────────────────────────────────────────────────────────

const auditLogQuerySchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(10).max(100).default(50),
  eventType: z.string().optional(),
  phoneNumber: z.string().optional(),
  loanOfficerId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;

// ── Auth ────────────────────────────────────────────────────────────────

async function requireAdminOrManager(): Promise<
  { organizationId: string } | { error: string }
> {
  const profile = await unifiedGetUserWithProfile();
  if (!profile) return { error: "Not authenticated" };
  if (!profile.organization_id) return { error: "No organization found" };
  if (profile.role !== "admin" && profile.role !== "manager") {
    return { error: "Admin or manager role required" };
  }
  return { organizationId: profile.organization_id };
}

// ── Actions ─────────────────────────────────────────────────────────────

/**
 * Query the compliance audit log with filters and pagination.
 */
export async function getAuditLog(
  query: AuditLogQuery
): Promise<ActionResult<AuditLogPage>> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = auditLogQuerySchema.safeParse(query);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { page, pageSize, eventType, phoneNumber, loanOfficerId, startDate, endDate } =
    parsed.data;

  const supabase = createUntypedAdminClient();

  // Build query
  let baseQuery = supabase
    .from("sms_audit_log")
    .select("*", { count: "exact" })
    .eq("organization_id", auth.organizationId)
    .order("created_at", { ascending: false });

  if (eventType) {
    baseQuery = baseQuery.eq("event_type", eventType);
  }
  if (phoneNumber) {
    baseQuery = baseQuery.eq("phone_number", phoneNumber);
  }
  if (loanOfficerId) {
    baseQuery = baseQuery.eq("loan_officer_id", loanOfficerId);
  }
  if (startDate) {
    baseQuery = baseQuery.gte("created_at", startDate);
  }
  if (endDate) {
    baseQuery = baseQuery.lte("created_at", endDate + "T23:59:59Z");
  }

  // Pagination
  const offset = (page - 1) * pageSize;
  baseQuery = baseQuery.range(offset, offset + pageSize - 1);

  const { data, count, error } = await baseQuery;

  if (error) {
    return { success: false, error: "Failed to load audit log" };
  }

  const entries: AuditLogEntry[] = (data ?? []).map(mapAuditEntry);
  const total = count ?? 0;

  return {
    success: true,
    data: {
      entries,
      total,
      page,
      pageSize,
      hasMore: offset + pageSize < total,
    },
  };
}

/**
 * Get available event types for the filter dropdown.
 */
export async function getAuditEventTypes(): Promise<ActionResult<string[]>> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  // Return all event types from the enum
  const types: SmsAuditEventType[] = [
    "consent_granted",
    "consent_revoked",
    "message_sent",
    "message_failed",
    "message_queued",
    "opt_out_received",
    "keyword_response",
    "quiet_hours_blocked",
    "rate_limited",
    "credit_deducted",
    "number_assigned",
    "number_unassigned",
    "domain_verified",
    "settings_changed",
    "export_generated",
  ];

  return { success: true, data: types };
}

// ── Helpers ─────────────────────────────────────────────────────────────

function mapAuditEntry(row: Record<string, unknown>): AuditLogEntry {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    eventType: row.event_type as SmsAuditEventType,
    phoneNumber: (row.phone_number as string) ?? null,
    actorId: (row.actor_id as string) ?? null,
    actorEmail: (row.actor_email as string) ?? null,
    loanOfficerId: (row.loan_officer_id as string) ?? null,
    messageId: (row.message_id as string) ?? null,
    details: (row.details as Record<string, unknown>) ?? {},
    ipAddress: (row.ip_address as string) ?? null,
    createdAt: row.created_at as string,
  };
}
