import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.types";

export type CronDefinition = {
  path: string;
  schedule: string;
};

export type CronHeartbeatRow = Pick<
  Database["public"]["Tables"]["cron_heartbeats"]["Row"],
  | "cron_name"
  | "last_run_at"
  | "last_success_at"
  | "last_status"
  | "last_summary"
  | "consecutive_failures"
>;

export type ParsedCronInterval = {
  intervalMinutes: number;
  note?: string;
};

export type CronMonitorDecision = {
  cronName: string;
  path: string;
  schedule: string;
  expectedIntervalMinutes: number;
  reasons: Array<"stale_success" | "consecutive_failures" | "missing_heartbeat">;
  silenceDurationMinutes: number | null;
  consecutiveFailures: number;
  lastSuccessAt: string | null;
  scheduleNote?: string;
};

export type CronMonitorState = {
  monitorStartedAt: string | null;
  alertSentAtByCron: Record<string, string>;
};

const DAILY_MINUTES = 24 * 60;
const WEEKLY_MINUTES = 7 * DAILY_MINUTES;
const MISSING_HEARTBEAT_GRACE_MINUTES = 48 * 60;
const ALERT_DEDUPE_MINUTES = 24 * 60;
const STALE_GRACE_MINUTES = 15;

function isIntegerField(value: string): boolean {
  return /^\d+$/.test(value);
}

function parseStepField(value: string): number | null {
  const match = value.match(/^\*\/(\d+)$/);
  if (!match) return null;

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function parseCronExpectedInterval(schedule: string): ParsedCronInterval {
  const fields = schedule.trim().split(/\s+/);
  if (fields.length !== 5) {
    return {
      intervalMinutes: DAILY_MINUTES,
      note: "unsupported cron expression shape; defaulted to daily",
    };
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;
  const minuteStep = parseStepField(minute);

  if (minuteStep && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return { intervalMinutes: minuteStep };
  }

  if (
    isIntegerField(minute) &&
    hour === "*" &&
    dayOfMonth === "*" &&
    month === "*" &&
    dayOfWeek === "*"
  ) {
    return { intervalMinutes: 60 };
  }

  const hourStep = parseStepField(hour);
  if (
    isIntegerField(minute) &&
    hourStep &&
    dayOfMonth === "*" &&
    month === "*" &&
    dayOfWeek === "*"
  ) {
    return { intervalMinutes: hourStep * 60 };
  }

  if (
    isIntegerField(minute) &&
    isIntegerField(hour) &&
    dayOfMonth === "*" &&
    month === "*" &&
    dayOfWeek === "*"
  ) {
    return { intervalMinutes: DAILY_MINUTES };
  }

  if (
    isIntegerField(minute) &&
    isIntegerField(hour) &&
    dayOfMonth === "*" &&
    month === "*" &&
    dayOfWeek !== "*"
  ) {
    return { intervalMinutes: WEEKLY_MINUTES };
  }

  return {
    intervalMinutes: DAILY_MINUTES,
    note: "unsupported cron expression shape; defaulted to daily",
  };
}

export function cronNameFromPath(path: string): string {
  return path.split("/").filter(Boolean).at(-1) ?? path;
}

function minutesBetween(now: Date, then: string): number {
  const parsed = Date.parse(then);
  if (!Number.isFinite(parsed)) return Number.POSITIVE_INFINITY;
  return Math.floor((now.getTime() - parsed) / 60000);
}

export function readCronMonitorState(
  summary: CronHeartbeatRow["last_summary"] | undefined
): CronMonitorState {
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    return {
      monitorStartedAt: null,
      alertSentAtByCron: {},
    };
  }

  const record = summary as Record<string, unknown>;
  const rawAlertMap = record.alert_sent_at_by_cron;
  const alertSentAtByCron: Record<string, string> =
    rawAlertMap && typeof rawAlertMap === "object" && !Array.isArray(rawAlertMap)
      ? Object.fromEntries(
          Object.entries(rawAlertMap as Record<string, unknown>).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string"
          )
        )
      : {};

  return {
    monitorStartedAt:
      typeof record.monitor_started_at === "string" ? record.monitor_started_at : null,
    alertSentAtByCron,
  };
}

export function getDueCronMonitorDecisions(params: {
  crons: CronDefinition[];
  heartbeatRows: CronHeartbeatRow[];
  monitorStartedAt: string | null;
  alertSentAtByCron: Record<string, string>;
  now: Date;
}): CronMonitorDecision[] {
  const rowsByName = new Map(params.heartbeatRows.map((row) => [row.cron_name, row]));
  const monitorAgeMinutes = params.monitorStartedAt
    ? minutesBetween(params.now, params.monitorStartedAt)
    : 0;

  const decisions: CronMonitorDecision[] = [];

  for (const cron of params.crons) {
    const cronName = cronNameFromPath(cron.path);
    const row = rowsByName.get(cronName);
    const parsed = parseCronExpectedInterval(cron.schedule);
    const reasons: CronMonitorDecision["reasons"] = [];
    const silenceDurationMinutes = row?.last_success_at
      ? minutesBetween(params.now, row.last_success_at)
      : null;

    if (!row) {
      if (params.monitorStartedAt && monitorAgeMinutes > MISSING_HEARTBEAT_GRACE_MINUTES) {
        reasons.push("missing_heartbeat");
      }
    } else {
      const staleAfterMinutes = parsed.intervalMinutes * 2 + STALE_GRACE_MINUTES;
      if (silenceDurationMinutes !== null && silenceDurationMinutes > staleAfterMinutes) {
        reasons.push("stale_success");
      }

      if (row.consecutive_failures >= 3) {
        reasons.push("consecutive_failures");
      }
    }

    if (reasons.length === 0) continue;

    const lastAlertedAt = params.alertSentAtByCron[cronName];
    if (lastAlertedAt && minutesBetween(params.now, lastAlertedAt) < ALERT_DEDUPE_MINUTES) {
      continue;
    }

    decisions.push({
      cronName,
      path: cron.path,
      schedule: cron.schedule,
      expectedIntervalMinutes: parsed.intervalMinutes,
      reasons,
      silenceDurationMinutes,
      consecutiveFailures: row?.consecutive_failures ?? 0,
      lastSuccessAt: row?.last_success_at ?? null,
      scheduleNote: parsed.note,
    });
  }

  return decisions;
}

function formatMinutes(minutes: number | null): string {
  if (minutes === null) return "never";
  if (!Number.isFinite(minutes)) return "unknown";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
}

export async function queueCronMonitorAlert(decision: CronMonitorDecision): Promise<number> {
  const supabase = createAdminClient();
  const { data: recipients, error: recipientsError } = await supabase
    .from("users")
    .select("id, organization_id")
    .eq("is_platform_admin", true)
    .eq("is_active", true)
    .not("email", "is", null)
    .not("organization_id", "is", null);

  if (recipientsError) {
    throw recipientsError;
  }

  const rows = (recipients ?? [])
    .filter((recipient) => recipient.organization_id)
    .map((recipient) => ({
      user_id: recipient.id,
      organization_id: recipient.organization_id as string,
      alert_type: "unusual_activity",
      severity: decision.reasons.includes("consecutive_failures") ? "critical" : "high",
      title: `Cron heartbeat alert: ${decision.cronName}`,
      message:
        `${decision.cronName} needs attention. Reasons: ${decision.reasons.join(", ")}. ` +
        `Expected every ${formatMinutes(decision.expectedIntervalMinutes)}, ` +
        `silent for ${formatMinutes(decision.silenceDurationMinutes)}.`,
      metadata: {
        source: "cron-monitor",
        cron_name: decision.cronName,
        path: decision.path,
        schedule: decision.schedule,
        expected_interval_minutes: decision.expectedIntervalMinutes,
        silence_duration_minutes: decision.silenceDurationMinutes,
        consecutive_failures: decision.consecutiveFailures,
        last_success_at: decision.lastSuccessAt,
        reasons: decision.reasons,
        schedule_note: decision.scheduleNote,
      },
      action_url: "/dashboard",
    }));

  if (rows.length === 0) {
    return 0;
  }

  const { error } = await supabase.from("admin_alert_queue").insert(rows);
  if (error) {
    throw error;
  }

  return rows.length;
}
