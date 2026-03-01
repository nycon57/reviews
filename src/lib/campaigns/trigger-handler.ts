import "server-only";

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import type { TriggerEvent, TriggerContext } from "@/lib/email/orchestration/types";
import { startCampaignForUser } from "./campaign-engine";

// ============================================================================
// Event triggers
// ============================================================================

interface TriggerResult {
  campaignId: string;
  sequencesCreated: number;
  skipped: number;
  errors: string[];
}

/**
 * Process an event trigger across all active campaigns that match the event.
 * Called when application events fire (user_signup, review_received, etc.)
 */
export async function processEventTrigger(
  event: TriggerEvent,
  context: TriggerContext
): Promise<TriggerResult[]> {
  const supabase = createUntypedAdminClient();
  const results: TriggerResult[] = [];

  // Find all active campaigns with matching event triggers
  const { data: campaigns, error } = await supabase
    .from("campaign_workflows")
    .select("id, organization_id, sequence_definition")
    .eq("status", "active");

  if (error || !campaigns) {
    console.error("[TriggerHandler] Failed to fetch active campaigns:", error);
    return results;
  }

  for (const row of campaigns as Record<string, unknown>[]) {
    const campaignId = String(row.id);
    const orgId = String(row.organization_id);
    const definition = row.sequence_definition as Record<string, unknown> | null;

    // Only process if the campaign's org matches the trigger context
    if (orgId !== context.organizationId) continue;

    const triggers = Array.isArray(definition?.triggers) ? definition.triggers : [];

    // Check if any trigger matches the event
    const matchingTrigger = triggers.find((t) => {
      const trigger = t as Record<string, unknown>;
      if (trigger.type !== "event") return false;
      if (trigger.event !== event) return false;

      // If event is custom_event, also match customEvent
      if (event === "custom_event" && context.customEvent) {
        return trigger.customEvent === context.customEvent;
      }
      return true;
    });

    if (!matchingTrigger) continue;

    const trigger = matchingTrigger as Record<string, unknown>;
    const result: TriggerResult = {
      campaignId,
      sequencesCreated: 0,
      skipped: 0,
      errors: [],
    };

    // Evaluate trigger conditions
    const conditions = Array.isArray(trigger.conditions) ? trigger.conditions : [];
    if (conditions.length > 0) {
      const conditionsMet = evaluateBasicConditions(
        conditions as Record<string, unknown>[],
        context
      );
      if (!conditionsMet) {
        result.skipped++;
        results.push(result);
        continue;
      }
    }

    // Start sequence for the user
    try {
      const startResult = await startCampaignForUser(
        campaignId,
        context.userId,
        orgId,
        {
          trigger_event: event,
          trigger_custom_event: context.customEvent,
          ...context.eventData,
          ...context.metadata,
        }
      );

      if ("sequenceId" in startResult) {
        result.sequencesCreated++;
      } else {
        result.skipped++;
      }
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : "Unknown error");
    }

    results.push(result);
  }

  return results;
}

// ============================================================================
// Time-based triggers
// ============================================================================

/**
 * Process time-based triggers for all active campaigns.
 * Called by the cron job on schedule.
 */
export async function processTimeTriggers(): Promise<TriggerResult[]> {
  const supabase = createUntypedAdminClient();
  const results: TriggerResult[] = [];

  const { data: campaigns, error } = await supabase
    .from("campaign_workflows")
    .select("id, organization_id, sequence_definition")
    .eq("status", "active");

  if (error || !campaigns) {
    console.error("[TriggerHandler] Failed to fetch campaigns for time triggers:", error);
    return results;
  }

  for (const row of campaigns as Record<string, unknown>[]) {
    const campaignId = String(row.id);
    const orgId = String(row.organization_id);
    const definition = row.sequence_definition as Record<string, unknown> | null;
    const triggers = Array.isArray(definition?.triggers) ? definition.triggers : [];

    const timeTrigger = triggers.find((t) => {
      const trigger = t as Record<string, unknown>;
      return trigger.type === "time";
    });

    if (!timeTrigger) continue;

    const trigger = timeTrigger as Record<string, unknown>;
    const schedule = String(trigger.schedule || "");

    // Check if this schedule should fire now
    if (!shouldFireSchedule(schedule)) continue;

    const result: TriggerResult = {
      campaignId,
      sequencesCreated: 0,
      skipped: 0,
      errors: [],
    };

    // Find eligible users in the org who aren't already enrolled (paginated)
    try {
      const pageSize = 50;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const eligibleUsers = await getEligibleUsersForCampaign(campaignId, orgId, pageSize, offset);

        if (eligibleUsers.length === pageSize) {
          console.warn(
            `[TriggerHandler] Campaign ${campaignId}: page at offset ${offset} returned ${pageSize} users (limit reached), more may exist`
          );
        }

        for (const userId of eligibleUsers) {
          try {
            const startResult = await startCampaignForUser(
              campaignId,
              userId,
              orgId,
              { trigger_type: "time", trigger_schedule: schedule }
            );

            if ("sequenceId" in startResult) {
              result.sequencesCreated++;
            } else {
              result.skipped++;
            }
          } catch (err) {
            result.errors.push(err instanceof Error ? err.message : "Unknown error");
          }
        }

        hasMore = eligibleUsers.length === pageSize;
        offset += pageSize;
      }
    } catch (err) {
      result.errors.push(`Failed to fetch eligible users: ${err instanceof Error ? err.message : "Unknown"}`);
    }

    results.push(result);
  }

  return results;
}

// ============================================================================
// Manual triggers
// ============================================================================

/**
 * Manually enroll specific users into a campaign.
 */
export async function processManualTrigger(
  campaignId: string,
  userIds: string[],
  metadata?: Record<string, unknown>
): Promise<{ created: number; skipped: number; errors: string[] }> {
  const supabase = createUntypedAdminClient();

  // Verify campaign exists and is active
  const { data: campaign } = await supabase
    .from("campaign_workflows")
    .select("id, organization_id, status")
    .eq("id", campaignId)
    .single();

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const orgId = String((campaign as Record<string, unknown>).organization_id);
  const status = String((campaign as Record<string, unknown>).status);

  if (status !== "active") {
    throw new Error(`Campaign must be active to trigger manually. Current status: ${status}`);
  }

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const userId of userIds) {
    try {
      const result = await startCampaignForUser(
        campaignId,
        userId,
        orgId,
        { trigger_type: "manual", ...metadata }
      );

      if ("sequenceId" in result) {
        created++;
      } else {
        skipped++;
      }
    } catch (err) {
      errors.push(`User ${userId}: ${err instanceof Error ? err.message : "Unknown"}`);
    }
  }

  return { created, skipped, errors };
}

// ============================================================================
// Helpers
// ============================================================================

function evaluateBasicConditions(
  conditions: Record<string, unknown>[],
  context: TriggerContext
): boolean {
  const allData = {
    ...context.metadata,
    ...context.eventData,
    userId: context.userId,
    organizationId: context.organizationId,
    event: context.event,
  };

  for (const condition of conditions) {
    const field = String(condition.field ?? "");
    const operator = String(condition.operator ?? "equals");
    const expected = condition.value;

    const actual = getNestedValue(allData, field);

    switch (operator) {
      case "equals":
        if (String(actual) !== String(expected)) return false;
        break;
      case "not_equals":
        if (String(actual) === String(expected)) return false;
        break;
      case "is_true":
        if (!actual) return false;
        break;
      case "is_false":
        if (actual) return false;
        break;
      case "is_not_null":
        if (actual === null || actual === undefined) return false;
        break;
      case "is_null":
        if (actual !== null && actual !== undefined) return false;
        break;
      case "contains":
        if (!String(actual ?? "").includes(String(expected ?? ""))) return false;
        break;
      default:
        break;
    }
  }

  return true;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function shouldFireSchedule(schedule: string): boolean {
  if (!schedule) return false;

  // Schedule format: "frequency:time:days" (e.g. "weekly:09:00:monday,wednesday")
  const parts = schedule.split(":");
  if (parts.length < 3) return false;

  const frequency = parts[0];
  const targetHour = parseInt(parts[1], 10);
  const targetMinute = parseInt(parts[2], 10);
  const days = parts[3]?.split(",") ?? [];

  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();

  // Only fire within a 5-minute window of the target time
  const minutesDiff = Math.abs((currentHour * 60 + currentMinute) - (targetHour * 60 + targetMinute));
  if (minutesDiff > 5) return false;

  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const currentDay = dayNames[now.getUTCDay()];

  switch (frequency) {
    case "daily":
      return true;
    case "weekly":
      return days.includes(currentDay);
    case "monthly":
      return now.getUTCDate() === 1;
    default:
      return false;
  }
}

async function getEligibleUsersForCampaign(
  campaignId: string,
  organizationId: string,
  limit: number,
  offset: number = 0
): Promise<string[]> {
  const supabase = createUntypedAdminClient();

  // Get users in the org who don't already have an active sequence for this campaign
  const { data: users, error } = await supabase
    .from("users")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("receive_notifications", true)
    .range(offset, offset + limit - 1);

  if (error || !users) return [];

  const userIds = (users as { id: string }[]).map((u) => u.id);
  if (userIds.length === 0) return [];

  // Filter out users who already have active sequences for this campaign
  const { data: existing } = await supabase
    .from("email_sequences")
    .select("user_id")
    .eq("campaign_workflow_id", campaignId)
    .in("status", ["active", "processing", "paused", "completed"])
    .in("user_id", userIds);

  const enrolledUserIds = new Set((existing ?? []).map((r) => String((r as { user_id: string }).user_id)));

  return userIds.filter((id) => !enrolledUserIds.has(id));
}
