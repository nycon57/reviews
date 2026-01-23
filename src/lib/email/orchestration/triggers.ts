"use server";

/**
 * Email Sequence Orchestration Engine - Trigger System
 *
 * Handles starting sequences based on:
 * - Events (user_signup, review_received, etc.)
 * - Time-based conditions (user inactive for N days)
 * - Manual API triggers
 * - Conditional triggers based on user state
 */

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  SequenceType,
  SequenceDefinition,
  SequenceTrigger,
  TriggerContext,
  TriggerEvent,
  StartSequenceResult,
  ConditionContext,
  DelayConfig,
} from "./types";
import { evaluateConditions, defaultCustomEvaluators } from "./conditions";

// ============================================================================
// Validation Schemas
// ============================================================================

const uuidSchema = z.string().uuid();

const delayConfigSchema = z.object({
  value: z.number().positive().max(365),
  unit: z.enum(["minutes", "hours", "days", "weeks"]),
});

const manualTriggerOptionsSchema = z.object({
  replaceExisting: z.boolean().optional(),
  allowMultiple: z.boolean().optional(),
  delay: delayConfigSchema.optional(),
});

const manualTriggerSchema = z.object({
  userId: uuidSchema,
  organizationId: uuidSchema,
  metadata: z.record(z.unknown()).optional(),
  options: manualTriggerOptionsSchema.optional(),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert delay config to milliseconds
 */
function delayToMs(delay: DelayConfig): number {
  const multipliers: Record<string, number> = {
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
  };
  return delay.value * (multipliers[delay.unit] || 0);
}

/**
 * Add delay to a date
 */
function addDelay(date: Date, delay: DelayConfig): Date {
  const result = new Date(date);
  result.setTime(result.getTime() + delayToMs(delay));
  return result;
}

/**
 * Check if user has an active sequence of the given type
 */
async function hasActiveSequence(
  userId: string,
  sequenceType: SequenceType
): Promise<{ exists: boolean; sequenceId?: string }> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)("email_sequences")
    .select("id")
    .eq("user_id", userId)
    .eq("sequence_type", sequenceType)
    .in("status", ["active", "paused", "processing"])
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error checking for active sequence:", error);
    return { exists: false };
  }

  return {
    exists: !!data,
    sequenceId: data?.id,
  };
}

/**
 * Cancel an existing active sequence
 */
async function cancelExistingSequence(
  sequenceId: string,
  reason: string = "sequence_replaced"
): Promise<void> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from as any)("email_sequences")
    .update({
      status: "cancelled",
      exit_reason: reason,
      exited_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", sequenceId);
}

/**
 * Build condition context for evaluation
 */
async function buildConditionContext(
  context: TriggerContext
): Promise<ConditionContext> {
  const supabase = createAdminClient();

  // Get user data
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", context.userId)
    .single();

  // Get organization data
  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", context.organizationId)
    .single();

  return {
    user: (user as Record<string, unknown>) || {},
    organization: (organization as Record<string, unknown>) || {},
    sequence: {
      id: "",
      user_id: context.userId,
      organization_id: context.organizationId,
      sequence_type: "",
      status: "active",
      current_step: 0,
      total_steps: 0,
      steps_completed: [],
      ab_test_assignments: {},
      skipped_steps: [],
      metadata: context.metadata || {},
      started_at: new Date().toISOString(),
    },
    metadata: context.metadata || {},
    eventData: context.eventData,
    customEvaluators: defaultCustomEvaluators,
  };
}

/**
 * Assign A/B test variants for a sequence
 */
function assignABTestVariants(
  assignmentKeys: string[] = []
): Record<string, string> {
  const assignments: Record<string, string> = {};

  for (const key of assignmentKeys) {
    // Simple 50/50 split by default
    assignments[key] = Math.random() < 0.5 ? "A" : "B";
  }

  return assignments;
}

// ============================================================================
// Trigger Evaluation
// ============================================================================

/**
 * Evaluate if a trigger's conditions are met
 */
export async function evaluateTriggerConditions(
  trigger: SequenceTrigger,
  context: TriggerContext
): Promise<boolean> {
  // If no conditions, always pass
  if (!trigger.conditions || trigger.conditions.length === 0) {
    return true;
  }

  const conditionContext = await buildConditionContext(context);
  return evaluateConditions(trigger.conditions, conditionContext);
}

/**
 * Find matching triggers for an event
 */
export function findMatchingTriggers(
  definition: SequenceDefinition,
  event: TriggerEvent,
  customEvent?: string
): SequenceTrigger[] {
  return definition.triggers.filter((trigger) => {
    if (trigger.type !== "event") return false;
    if (trigger.event !== event) return false;
    if (event === "custom_event" && trigger.customEvent !== customEvent) return false;
    return true;
  });
}

// ============================================================================
// Sequence Creation
// ============================================================================

/**
 * Create a new sequence instance
 */
export async function createSequenceInstance(
  definition: SequenceDefinition,
  context: TriggerContext,
  trigger?: SequenceTrigger
): Promise<StartSequenceResult> {
  const supabase = createAdminClient();

  // Check for existing active sequence
  const existingCheck = await hasActiveSequence(context.userId, definition.type);

  if (existingCheck.exists) {
    // Handle based on trigger settings
    if (trigger?.replaceExisting && existingCheck.sequenceId) {
      await cancelExistingSequence(existingCheck.sequenceId);
    } else if (!trigger?.allowMultiple) {
      return {
        success: false,
        skipped: true,
        skipReason: "active_sequence_exists",
      };
    }
  }

  // Calculate first email time
  let nextEmailAt = new Date();
  if (trigger?.delay) {
    nextEmailAt = addDelay(nextEmailAt, trigger.delay);
  }

  // Assign A/B test variants
  const abTestAssignments = assignABTestVariants(definition.abTestAssignments);

  // Prepare metadata
  const metadata = {
    ...context.metadata,
    triggerEvent: context.event,
    customEvent: context.customEvent,
    eventData: context.eventData,
    sequenceStartedAt: new Date().toISOString(),
  };

  // Create the sequence record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequence, error } = await (supabase.from as any)("email_sequences")
    .insert({
      user_id: context.userId,
      organization_id: context.organizationId,
      sequence_type: definition.type,
      status: "active",
      current_step: 0,
      total_steps: definition.steps.length,
      steps_completed: [],
      ab_test_assignments: abTestAssignments,
      skipped_steps: [],
      next_email_at: nextEmailAt.toISOString(),
      metadata,
    })
    .select("id")
    .single();

  if (error) {
    return {
      success: false,
      error: `Failed to create sequence: ${error.message}`,
    };
  }

  return {
    success: true,
    sequenceId: sequence.id,
  };
}

// ============================================================================
// Event-Based Triggers
// ============================================================================

/**
 * Handle an event trigger
 * Called when an event occurs that might start a sequence
 */
export async function handleEventTrigger(
  definition: SequenceDefinition,
  event: TriggerEvent,
  context: TriggerContext
): Promise<StartSequenceResult> {
  // Check if sequence is enabled
  if (definition.enabled === false) {
    return {
      success: false,
      skipped: true,
      skipReason: "sequence_disabled",
    };
  }

  // Find matching triggers
  const matchingTriggers = findMatchingTriggers(
    definition,
    event,
    context.customEvent
  );

  if (matchingTriggers.length === 0) {
    return {
      success: false,
      skipped: true,
      skipReason: "no_matching_trigger",
    };
  }

  // Evaluate each trigger's conditions
  for (const trigger of matchingTriggers) {
    const conditionsMet = await evaluateTriggerConditions(trigger, context);
    if (conditionsMet) {
      // Found a matching trigger, create the sequence
      return createSequenceInstance(definition, context, trigger);
    }
  }

  return {
    success: false,
    skipped: true,
    skipReason: "trigger_conditions_not_met",
  };
}

/**
 * Dispatch an event to all registered sequences
 */
export async function dispatchEvent(
  event: TriggerEvent,
  context: TriggerContext,
  sequenceDefinitions: Map<SequenceType, SequenceDefinition>
): Promise<Map<SequenceType, StartSequenceResult>> {
  const results = new Map<SequenceType, StartSequenceResult>();

  for (const [type, definition] of sequenceDefinitions) {
    const result = await handleEventTrigger(definition, event, {
      ...context,
      event,
    });
    results.set(type, result);
  }

  return results;
}

// ============================================================================
// Manual Triggers
// ============================================================================

/**
 * Manually trigger a sequence for a user
 */
export async function triggerSequenceManually(
  definition: SequenceDefinition,
  userId: string,
  organizationId: string,
  metadata?: Record<string, unknown>,
  options?: {
    replaceExisting?: boolean;
    allowMultiple?: boolean;
    delay?: DelayConfig;
  }
): Promise<StartSequenceResult> {
  // Validate input
  const validation = manualTriggerSchema.safeParse({
    userId,
    organizationId,
    metadata,
    options,
  });

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.message,
    };
  }

  // Check if sequence is enabled
  if (definition.enabled === false) {
    return {
      success: false,
      skipped: true,
      skipReason: "sequence_disabled",
    };
  }

  const context: TriggerContext = {
    userId: validation.data.userId,
    organizationId: validation.data.organizationId,
    metadata: validation.data.metadata,
  };

  const trigger: SequenceTrigger = {
    type: "manual",
    replaceExisting: validation.data.options?.replaceExisting,
    allowMultiple: validation.data.options?.allowMultiple,
    delay: validation.data.options?.delay,
  };

  return createSequenceInstance(definition, context, trigger);
}

// ============================================================================
// Time-Based Triggers (for cron jobs)
// ============================================================================

/**
 * Check for users matching time-based trigger conditions
 * Called by cron jobs to start sequences based on user state
 */
export async function checkTimeBasedTriggers(
  definition: SequenceDefinition,
  batchSize: number = 100
): Promise<{
  triggered: number;
  skipped: number;
  errors: string[];
}> {
  const result = {
    triggered: 0,
    skipped: 0,
    errors: [] as string[],
  };

  // Find time-based triggers
  const timeTriggers = definition.triggers.filter((t) => t.type === "time");
  if (timeTriggers.length === 0) {
    return result;
  }

  const supabase = createAdminClient();

  // Get users without an active sequence of this type
  const { data: users, error } = await supabase
    .from("users")
    .select("id, organization_id, email, full_name, last_login_at, receive_notifications")
    .eq("is_active", true)
    .eq("receive_notifications", true)
    .limit(batchSize);

  if (error) {
    result.errors.push(`Failed to fetch users: ${error.message}`);
    return result;
  }

  if (!users || users.length === 0) {
    return result;
  }

  // Process each user
  for (const user of users) {
    try {
      // Skip users without organization
      if (!user.organization_id) {
        result.skipped++;
        continue;
      }

      // Check if user already has an active sequence
      const existingCheck = await hasActiveSequence(user.id, definition.type);
      if (existingCheck.exists) {
        result.skipped++;
        continue;
      }

      // Build context and evaluate trigger conditions
      const context: TriggerContext = {
        userId: user.id,
        organizationId: user.organization_id,
        metadata: {
          firstName: user.full_name?.split(" ")[0] || "there",
          lastLoginAt: user.last_login_at,
        },
      };

      for (const trigger of timeTriggers) {
        const conditionsMet = await evaluateTriggerConditions(trigger, context);
        if (conditionsMet) {
          const createResult = await createSequenceInstance(
            definition,
            context,
            trigger
          );
          if (createResult.success) {
            result.triggered++;
          } else if (!createResult.skipped) {
            result.errors.push(
              `User ${user.id}: ${createResult.error || "Unknown error"}`
            );
          } else {
            result.skipped++;
          }
          break; // Only start one sequence per user
        }
      }
    } catch (err) {
      result.errors.push(
        `User ${user.id}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return result;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all users eligible for a sequence using efficient single query
 * Useful for batch operations or reports
 */
export async function getEligibleUsers(
  definition: SequenceDefinition,
  limit: number = 100
): Promise<{ id: string; organization_id: string; email: string }[]> {
  const supabase = createAdminClient();

  // First get users who already have an active sequence of this type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: activeSequenceUserIds } = await (supabase.from as any)("email_sequences")
    .select("user_id")
    .eq("sequence_type", definition.type)
    .in("status", ["active", "paused", "processing"]);

  const excludeUserIds = new Set((activeSequenceUserIds || []).map((r: { user_id: string }) => r.user_id));

  // Get eligible users (active, with notifications enabled, not in exclude list)
  let query = supabase
    .from("users")
    .select("id, organization_id, email")
    .eq("is_active", true)
    .eq("receive_notifications", true)
    .limit(limit);

  const { data: users, error } = await query;

  if (error || !users) {
    return [];
  }

  // Filter out users who already have active sequences and users without organization
  // (in-memory filter is now O(1) per user)
  return users
    .filter((user): user is typeof user & { organization_id: string } =>
      !excludeUserIds.has(user.id) && user.organization_id !== null
    );
}
