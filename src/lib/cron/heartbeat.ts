import type { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.types";

type Json = Database["public"]["Tables"]["cron_heartbeats"]["Row"]["last_summary"];
type JsonValue = Json;

const MAX_SUMMARY_KEYS = 12;
const MAX_ARRAY_ITEMS = 10;
const MAX_STRING_LENGTH = 500;

function compactJson(value: unknown, depth = 0): JsonValue {
  if (value === null || typeof value === "boolean" || typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}...` : value;
  }

  if (Array.isArray(value)) {
    if (depth >= 2) {
      return `[${value.length} items]`;
    }

    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => compactJson(item, depth + 1));
  }

  if (typeof value === "object") {
    if (depth >= 2) {
      return "[object]";
    }

    const entries = Object.entries(value as Record<string, unknown>).slice(0, MAX_SUMMARY_KEYS);
    return Object.fromEntries(
      entries.map(([key, entryValue]) => [key, compactJson(entryValue, depth + 1)])
    );
  }

  return String(value);
}

async function readResponseSummary(response: Response): Promise<JsonValue | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return compactJson(await response.clone().json());
  } catch {
    return null;
  }
}

function summaryIndicatesFailure(summary: JsonValue | null): boolean {
  return (
    typeof summary === "object" &&
    summary !== null &&
    !Array.isArray(summary) &&
    (summary as { success?: unknown }).success === false
  );
}

async function writeHeartbeat(params: {
  cronName: string;
  status: "success" | "failure";
  durationMs: number;
  summary: JsonValue | null;
}): Promise<void> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  if (params.status === "success") {
    const { error } = await supabase.from("cron_heartbeats").upsert(
      {
        cron_name: params.cronName,
        last_run_at: now,
        last_success_at: now,
        last_status: "success",
        last_duration_ms: params.durationMs,
        last_summary: params.summary,
        consecutive_failures: 0,
        updated_at: now,
      },
      { onConflict: "cron_name" }
    );

    if (error) throw error;
    return;
  }

  const { data: existing } = await supabase
    .from("cron_heartbeats")
    .select("consecutive_failures")
    .eq("cron_name", params.cronName)
    .maybeSingle();

  const { error } = await supabase.from("cron_heartbeats").upsert(
    {
      cron_name: params.cronName,
      last_run_at: now,
      last_status: "failure",
      last_duration_ms: params.durationMs,
      last_summary: params.summary,
      consecutive_failures: (existing?.consecutive_failures ?? 0) + 1,
      updated_at: now,
    },
    { onConflict: "cron_name" }
  );

  if (error) throw error;
}

/**
 * Records a best-effort heartbeat for cron route work without changing the
 * route's response or making heartbeat storage part of cron success.
 */
export async function withCronHeartbeat<TResponse extends Response | NextResponse>(
  cronName: string,
  handler: () => Promise<TResponse> | TResponse
): Promise<TResponse> {
  const startedAt = Date.now();

  try {
    const response = await handler();
    const durationMs = Date.now() - startedAt;
    const summary = await readResponseSummary(response);
    const status =
      response.status >= 500 || summaryIndicatesFailure(summary) ? "failure" : "success";

    try {
      await writeHeartbeat({
        cronName,
        status,
        durationMs,
        summary,
      });
    } catch (heartbeatError) {
      console.error(`Failed to write cron heartbeat for ${cronName}:`, heartbeatError);
    }

    return response;
  } catch (error) {
    const durationMs = Date.now() - startedAt;

    try {
      await writeHeartbeat({
        cronName,
        status: "failure",
        durationMs,
        summary: compactJson({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
      });
    } catch (heartbeatError) {
      console.error(`Failed to write cron failure heartbeat for ${cronName}:`, heartbeatError);
    }

    throw error;
  }
}
