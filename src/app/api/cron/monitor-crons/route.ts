import { NextRequest, NextResponse } from "next/server";
import vercelConfig from "../../../../../vercel.json";
import { verifyCronSecret } from "@/lib/cron/verify-secret";
import { withCronHeartbeat } from "@/lib/cron/heartbeat";
import {
  cronNameFromPath,
  getDueCronMonitorDecisions,
  parseCronExpectedInterval,
  queueCronMonitorAlert,
  readCronMonitorState,
  type CronDefinition,
} from "@/lib/cron/monitor";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 300;

type VercelConfig = {
  crons?: CronDefinition[];
};

const CRON_NAME = "monitor-crons";
// Dedupe state lives in its OWN row, written verbatim — the wrapper's
// last_summary compaction (MAX_SUMMARY_KEYS) would silently truncate the
// alert map past 12 crons and break the 24h dedupe.
const STATE_ROW = "monitor-crons:state";

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronHeartbeat(CRON_NAME, async () => {
    const now = new Date();
    const crons = ((vercelConfig as VercelConfig).crons ?? []).filter((cron) =>
      cron.path.startsWith("/api/cron/")
    );
    const cronNames = crons.map((cron) => cronNameFromPath(cron.path));
    const supabase = createAdminClient();

    const { data: heartbeatRows, error: heartbeatError } = await supabase
      .from("cron_heartbeats")
      .select("cron_name,last_run_at,last_success_at,last_status,last_summary,consecutive_failures")
      .in("cron_name", cronNames);

    if (heartbeatError) {
      return NextResponse.json(
        {
          success: false,
          error: heartbeatError.message,
          timestamp: now.toISOString(),
        },
        { status: 500 }
      );
    }

    const monitorRow = (heartbeatRows ?? []).find((row) => row.cron_name === CRON_NAME);
    const { data: stateRow } = await supabase
      .from("cron_heartbeats")
      .select("last_summary")
      .eq("cron_name", STATE_ROW)
      .maybeSingle();
    const monitorState = readCronMonitorState(stateRow?.last_summary);
    const monitorStartedAt =
      monitorState.monitorStartedAt ??
      monitorRow?.last_success_at ??
      monitorRow?.last_run_at ??
      null;
    const dueDecisions = getDueCronMonitorDecisions({
      crons,
      heartbeatRows: heartbeatRows ?? [],
      monitorStartedAt,
      alertSentAtByCron: monitorState.alertSentAtByCron,
      now,
    });

    const alertSentAtByCron = { ...monitorState.alertSentAtByCron };
    const alertResults: Array<{ cronName: string; queued: number }> = [];
    const alertErrors: Array<{ cronName: string; error: string }> = [];

    for (const decision of dueDecisions) {
      try {
        const queued = await queueCronMonitorAlert(decision);
        alertSentAtByCron[decision.cronName] = now.toISOString();
        alertResults.push({ cronName: decision.cronName, queued });
      } catch (error) {
        alertErrors.push({
          cronName: decision.cronName,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Persist dedupe state verbatim (never through the summary compactor).
    const { error: stateError } = await supabase.from("cron_heartbeats").upsert({
      cron_name: STATE_ROW,
      last_summary: {
        monitor_started_at: monitorStartedAt ?? now.toISOString(),
        alert_sent_at_by_cron: alertSentAtByCron,
      },
      updated_at: now.toISOString(),
    });
    if (stateError) {
      console.error("[monitor-crons] failed to persist dedupe state:", stateError.message);
    }

    const scheduleMappings = Object.fromEntries(
      [...new Set(crons.map((cron) => cron.schedule))].map((schedule) => [
        schedule,
        parseCronExpectedInterval(schedule),
      ])
    );

    const responseBody = {
      success: alertErrors.length === 0,
      monitored: crons.length,
      due_alerts: dueDecisions.length,
      alerts_created: alertResults.reduce((total, result) => total + result.queued, 0),
      alert_results: alertResults,
      alert_errors: alertErrors,
      monitor_started_at: monitorStartedAt ?? now.toISOString(),
      alert_sent_at_by_cron: alertSentAtByCron,
      schedule_mappings: scheduleMappings,
      timestamp: now.toISOString(),
    };

    return NextResponse.json(responseBody, {
      status: alertErrors.length === 0 ? 200 : 500,
    });
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
