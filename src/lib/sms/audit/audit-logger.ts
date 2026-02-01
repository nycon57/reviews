import { createUntypedAdminClient } from "@/lib/supabase/admin";
import type { UntypedSupabaseClient } from "@/lib/supabase/admin";

// ── Types ───────────────────────────────────────────────────────────────

export type SmsAuditEventType =
  | "consent_granted"
  | "consent_revoked"
  | "message_sent"
  | "message_failed"
  | "message_queued"
  | "opt_out_received"
  | "keyword_response"
  | "quiet_hours_blocked"
  | "rate_limited"
  | "credit_deducted"
  | "number_assigned"
  | "number_unassigned"
  | "domain_verified"
  | "settings_changed"
  | "export_generated";

export interface AuditLogEntry {
  id: string;
  organizationId: string;
  eventType: SmsAuditEventType;
  phoneNumber: string | null;
  actorId: string | null;
  actorEmail: string | null;
  loanOfficerId: string | null;
  messageId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

export interface LogAuditInput {
  organizationId: string;
  eventType: SmsAuditEventType;
  phoneNumber?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  loanOfficerId?: string | null;
  messageId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
}

// ── Audit Logger ────────────────────────────────────────────────────────

/**
 * Immutable audit logger for SMS compliance events.
 *
 * All entries are append-only — the database table has no UPDATE or DELETE
 * permissions for authenticated users. Entries are retained for a minimum
 * of 5 years, with automated archival to cold storage after 2 years.
 */
export class SmsAuditLogger {
  private supabase: UntypedSupabaseClient;

  constructor(supabase?: UntypedSupabaseClient) {
    this.supabase = supabase ?? createUntypedAdminClient();
  }

  /**
   * Log a compliance event to the immutable audit log.
   */
  async log(input: LogAuditInput): Promise<void> {
    const { error } = await this.supabase.from("sms_audit_log").insert({
      organization_id: input.organizationId,
      event_type: input.eventType,
      phone_number: input.phoneNumber ?? null,
      actor_id: input.actorId ?? null,
      actor_email: input.actorEmail ?? null,
      loan_officer_id: input.loanOfficerId ?? null,
      message_id: input.messageId ?? null,
      details: input.details ?? {},
      ip_address: input.ipAddress ?? null,
    });

    if (error) {
      // Audit logging should never block the main operation
      console.error("[SmsAuditLogger] Failed to write audit entry:", error.message);
    }
  }

  /**
   * Log multiple events in a single batch insert.
   */
  async logBatch(entries: LogAuditInput[]): Promise<void> {
    if (entries.length === 0) return;

    const rows = entries.map((input) => ({
      organization_id: input.organizationId,
      event_type: input.eventType,
      phone_number: input.phoneNumber ?? null,
      actor_id: input.actorId ?? null,
      actor_email: input.actorEmail ?? null,
      loan_officer_id: input.loanOfficerId ?? null,
      message_id: input.messageId ?? null,
      details: input.details ?? {},
      ip_address: input.ipAddress ?? null,
    }));

    const { error } = await this.supabase.from("sms_audit_log").insert(rows);

    if (error) {
      console.error("[SmsAuditLogger] Batch write failed:", error.message);
    }
  }
}

/**
 * Create a fresh audit logger instance.
 *
 * In serverless environments, each request should get a fresh client
 * to avoid stale Supabase connections across invocations.
 */
export function getAuditLogger(): SmsAuditLogger {
  return new SmsAuditLogger();
}
