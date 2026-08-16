import { describe, expect, it } from "vitest";
import {
  getDueCronMonitorDecisions,
  parseCronExpectedInterval,
  readCronMonitorState,
  type CronHeartbeatRow,
} from "@/lib/cron/monitor";

function row(overrides: Partial<CronHeartbeatRow> & { cron_name: string }): CronHeartbeatRow {
  return {
    cron_name: overrides.cron_name,
    last_run_at: overrides.last_run_at ?? "2026-07-08T10:00:00.000Z",
    last_success_at: overrides.last_success_at ?? "2026-07-08T10:00:00.000Z",
    last_status: overrides.last_status ?? "success",
    last_summary: overrides.last_summary ?? null,
    consecutive_failures: overrides.consecutive_failures ?? 0,
  };
}

describe("parseCronExpectedInterval", () => {
  it("maps supported Vercel cron shapes to expected max intervals", () => {
    expect(parseCronExpectedInterval("*/5 * * * *")).toEqual({
      intervalMinutes: 5,
    });
    expect(parseCronExpectedInterval("5 * * * *")).toEqual({
      intervalMinutes: 60,
    });
    expect(parseCronExpectedInterval("0 */6 * * *")).toEqual({
      intervalMinutes: 360,
    });
    expect(parseCronExpectedInterval("0 13 * * *")).toEqual({
      intervalMinutes: 1440,
    });
    expect(parseCronExpectedInterval("0 14 * * 1")).toEqual({
      intervalMinutes: 10080,
    });
  });

  it("defaults unsupported shapes to daily and notes the fallback", () => {
    expect(parseCronExpectedInterval("0 9 1 * *")).toEqual({
      intervalMinutes: 1440,
      note: "unsupported cron expression shape; defaulted to daily",
    });
  });
});

describe("readCronMonitorState", () => {
  it("extracts monitor epoch and alert dedupe map from the monitor heartbeat summary", () => {
    expect(
      readCronMonitorState({
        monitor_started_at: "2026-07-06T10:00:00.000Z",
        alert_sent_at_by_cron: {
          "process-queue": "2026-07-08T09:00:00.000Z",
          ignored: 12,
        },
      })
    ).toEqual({
      monitorStartedAt: "2026-07-06T10:00:00.000Z",
      alertSentAtByCron: {
        "process-queue": "2026-07-08T09:00:00.000Z",
      },
    });
  });
});

describe("getDueCronMonitorDecisions", () => {
  const crons = [
    { path: "/api/cron/process-queue", schedule: "*/5 * * * *" },
    { path: "/api/cron/send-digests", schedule: "0 13 * * *" },
    { path: "/api/cron/missing-job", schedule: "0 * * * *" },
  ];

  it("alerts when a cron has been silent beyond twice its interval plus grace", () => {
    const decisions = getDueCronMonitorDecisions({
      crons,
      heartbeatRows: [
        row({
          cron_name: "process-queue",
          last_success_at: "2026-07-08T09:34:00.000Z",
        }),
        row({ cron_name: "send-digests" }),
      ],
      monitorStartedAt: "2026-07-06T09:00:00.000Z",
      alertSentAtByCron: {},
      now: new Date("2026-07-08T10:00:00.000Z"),
    });

    expect(decisions).toMatchObject([
      {
        cronName: "process-queue",
        reasons: ["stale_success"],
        expectedIntervalMinutes: 5,
        silenceDurationMinutes: 26,
      },
      {
        cronName: "missing-job",
        reasons: ["missing_heartbeat"],
      },
    ]);
  });

  it("alerts when consecutive failures reach three even if last success is recent", () => {
    const decisions = getDueCronMonitorDecisions({
      crons,
      heartbeatRows: [
        row({
          cron_name: "process-queue",
          consecutive_failures: 3,
          last_success_at: "2026-07-08T09:59:00.000Z",
        }),
        row({ cron_name: "send-digests" }),
        row({ cron_name: "missing-job" }),
      ],
      monitorStartedAt: "2026-07-08T09:00:00.000Z",
      alertSentAtByCron: {},
      now: new Date("2026-07-08T10:00:00.000Z"),
    });

    expect(decisions).toMatchObject([
      {
        cronName: "process-queue",
        reasons: ["consecutive_failures"],
        consecutiveFailures: 3,
      },
    ]);
  });

  it("dedupes alerts for 24 hours using the monitor summary state", () => {
    const decisions = getDueCronMonitorDecisions({
      crons,
      heartbeatRows: [
        row({
          cron_name: "process-queue",
          last_success_at: "2026-07-08T09:00:00.000Z",
        }),
        row({ cron_name: "send-digests" }),
        row({ cron_name: "missing-job" }),
      ],
      monitorStartedAt: "2026-07-06T09:00:00.000Z",
      alertSentAtByCron: {
        "process-queue": "2026-07-08T09:30:00.000Z",
      },
      now: new Date("2026-07-08T10:00:00.000Z"),
    });

    expect(decisions.map((decision) => decision.cronName)).not.toContain("process-queue");
  });
});
