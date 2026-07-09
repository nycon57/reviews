/**
 * Email Sequence Orchestration Engine - Queue Management
 *
 * Manages the email sequence queue:
 * - Fetches sequences ready to process
 * - Implements optimistic locking for concurrent execution
 * - Batch processing with configurable size
 * - Pause/resume functionality per user
 * - Queue statistics and monitoring
 */

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  SequenceType,
  SequenceRecord,
  SequenceDefinition,
  QueueProcessResult,
  EmailContext,
} from "./types";
import { executeStep, updateSequenceStatus } from "./executor";

// ============================================================================
// Validation Schemas
// ============================================================================

const uuidSchema = z.string().uuid();
const sequenceTypeSchema = z.enum([
  "welcome",
  "onboarding",
  "org_onboarding",
  "role_onboarding",
  "team_invite",
  "re-engagement",
  "win_back",
  "feature_announcement",
  "milestone",
  "trial_ending",
  "dunning",
  "subscription",
  "announcement",
  "abandoned_action",
  "referral",
  "profile_reminder",
  "custom",
]);

const pauseSequenceSchema = z.object({
  sequenceId: uuidSchema,
});

const resumeSequenceSchema = z.object({
  sequenceId: uuidSchema,
  resumeImmediately: z.boolean().optional().default(true),
});

const cancelSequenceSchema = z.object({
  sequenceId: uuidSchema,
  reason: z.string().max(255).optional().default("manual_cancel"),
});

const userSequencesSchema = z.object({
  userId: uuidSchema,
  sequenceType: sequenceTypeSchema.optional(),
});

const cancelUserSequencesSchema = z.object({
  userId: uuidSchema,
  reason: z.string().max(255).optional().default("manual_cancel"),
  sequenceType: sequenceTypeSchema.optional(),
});

// ============================================================================
// Queue Processing
// ============================================================================

/**
 * Fetch sequences ready for processing with optimistic locking
 */
export async function fetchAndLockSequences(
  sequenceType?: SequenceType,
  batchSize: number = 50
): Promise<SequenceRecord[]> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Build query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from as any)("email_sequences")
    .select("*")
    .eq("status", "active")
    .lte("next_email_at", now)
    .order("next_email_at", { ascending: true })
    .limit(batchSize);

  // Filter by sequence type if specified
  if (sequenceType) {
    query = query.eq("sequence_type", sequenceType);
  }

  const { data: sequences, error } = await query;

  if (error || !sequences || sequences.length === 0) {
    return [];
  }

  // Optimistic locking: mark as processing
  const sequenceIds = (sequences as SequenceRecord[]).map((s) => s.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lockedSequences, error: lockError } = await (supabase.from as any)(
    "email_sequences"
  )
    .update({
      status: "processing",
      updated_at: new Date().toISOString(),
    })
    .in("id", sequenceIds)
    .eq("status", "active")
    .select("id");

  if (lockError) {
    console.error("Failed to acquire lock:", lockError);
    return [];
  }

  // Return only sequences we successfully locked
  const lockedIds = new Set((lockedSequences || []).map((s: { id: string }) => s.id));
  return (sequences as SequenceRecord[]).filter((s) => lockedIds.has(s.id));
}

/**
 * Reset a sequence from processing back to active
 */
export async function resetSequenceToActive(sequenceId: string): Promise<void> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from as any)("email_sequences")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", sequenceId)
    .eq("status", "processing");
}

/**
 * Process the queue for a specific sequence type
 */
export async function processSequenceQueue(
  definition: SequenceDefinition,
  emailSender: (
    ctx: EmailContext
  ) => Promise<{ success: boolean; emailId?: string; error?: string }>,
  batchSize: number = 50
): Promise<QueueProcessResult> {
  const result: QueueProcessResult = {
    processed: 0,
    failed: 0,
    skipped: 0,
    exited: 0,
    waiting: 0,
    errors: [],
  };

  // Fetch and lock sequences
  const sequences = await fetchAndLockSequences(definition.type, batchSize);

  if (sequences.length === 0) {
    return result;
  }

  // Process each sequence
  for (const sequence of sequences) {
    try {
      const stepResult = await executeStep(sequence, definition, emailSender);

      if (stepResult.success) {
        switch (stepResult.action) {
          case "sent":
            result.processed++;
            // Status already updated by executeStep
            break;
          case "skipped":
            result.skipped++;
            // Status already updated by executeStep
            break;
          case "exited":
          case "completed":
            result.exited++;
            // Status already updated by executeStep
            break;
          case "waiting":
            result.waiting++;
            // Reset to active for later processing
            await resetSequenceToActive(sequence.id);
            break;
        }
      } else {
        result.failed++;
        result.errors.push(`Sequence ${sequence.id}: ${stepResult.error || "Unknown error"}`);
        // Reset to active so it can be retried
        await resetSequenceToActive(sequence.id);
      }
    } catch (err) {
      result.failed++;
      result.errors.push(
        `Sequence ${sequence.id}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      // Reset to active so it can be retried
      await resetSequenceToActive(sequence.id);
    }
  }

  return result;
}

/**
 * Process all sequence types in the queue
 */
export async function processAllSequenceQueues(
  definitions: Map<SequenceType, SequenceDefinition>,
  emailSenders: Map<
    SequenceType,
    (ctx: EmailContext) => Promise<{ success: boolean; emailId?: string; error?: string }>
  >,
  batchSize: number = 50
): Promise<Map<SequenceType, QueueProcessResult>> {
  const results = new Map<SequenceType, QueueProcessResult>();

  for (const [type, definition] of definitions) {
    const sender = emailSenders.get(type);
    if (!sender) {
      results.set(type, {
        processed: 0,
        failed: 0,
        skipped: 0,
        exited: 0,
        waiting: 0,
        errors: [`No email sender configured for sequence type: ${type}`],
      });
      continue;
    }

    const result = await processSequenceQueue(definition, sender, batchSize);
    results.set(type, result);
  }

  return results;
}

// ============================================================================
// Pause/Resume Functionality
// ============================================================================

/**
 * Pause a sequence
 */
export async function pauseSequence(
  sequenceId: string
): Promise<{ success: boolean; error?: string }> {
  // Validate input
  const validation = pauseSequenceSchema.safeParse({ sequenceId });
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("email_sequences")
    .update({
      status: "paused",
      updated_at: new Date().toISOString(),
    })
    .eq("id", validation.data.sequenceId)
    .in("status", ["active", "processing"]);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Resume a paused sequence
 */
export async function resumeSequence(
  sequenceId: string,
  resumeImmediately: boolean = true
): Promise<{ success: boolean; error?: string }> {
  // Validate input
  const validation = resumeSequenceSchema.safeParse({ sequenceId, resumeImmediately });
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = {
    status: "active",
    updated_at: new Date().toISOString(),
  };

  if (validation.data.resumeImmediately) {
    // Send next email soon
    updateData.next_email_at = new Date().toISOString();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("email_sequences")
    .update(updateData)
    .eq("id", validation.data.sequenceId)
    .eq("status", "paused");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Pause all sequences for a user
 */
export async function pauseUserSequences(
  userId: string,
  sequenceType?: SequenceType
): Promise<{ success: boolean; pausedCount: number; error?: string }> {
  // Validate input
  const validation = userSequencesSchema.safeParse({ userId, sequenceType });
  if (!validation.success) {
    return { success: false, pausedCount: 0, error: validation.error.message };
  }

  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from as any)("email_sequences")
    .update({
      status: "paused",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", validation.data.userId)
    .in("status", ["active", "processing"]);

  if (validation.data.sequenceType) {
    query = query.eq("sequence_type", validation.data.sequenceType);
  }

  const { data, error } = await query.select("id");

  if (error) {
    return { success: false, pausedCount: 0, error: error.message };
  }

  return { success: true, pausedCount: data?.length || 0 };
}

/**
 * Resume all sequences for a user
 */
export async function resumeUserSequences(
  userId: string,
  sequenceType?: SequenceType,
  resumeImmediately: boolean = true
): Promise<{ success: boolean; resumedCount: number; error?: string }> {
  // Validate input
  const validation = userSequencesSchema.safeParse({ userId, sequenceType });
  if (!validation.success) {
    return { success: false, resumedCount: 0, error: validation.error.message };
  }

  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = {
    status: "active",
    updated_at: new Date().toISOString(),
  };

  if (resumeImmediately) {
    updateData.next_email_at = new Date().toISOString();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from as any)("email_sequences")
    .update(updateData)
    .eq("user_id", validation.data.userId)
    .eq("status", "paused");

  if (validation.data.sequenceType) {
    query = query.eq("sequence_type", validation.data.sequenceType);
  }

  const { data, error } = await query.select("id");

  if (error) {
    return { success: false, resumedCount: 0, error: error.message };
  }

  return { success: true, resumedCount: data?.length || 0 };
}

/**
 * Cancel a sequence
 */
export async function cancelSequence(
  sequenceId: string,
  reason: string = "manual_cancel"
): Promise<{ success: boolean; error?: string }> {
  // Validate input
  const validation = cancelSequenceSchema.safeParse({ sequenceId, reason });
  if (!validation.success) {
    return { success: false, error: validation.error.message };
  }

  await updateSequenceStatus(validation.data.sequenceId, "cancelled", validation.data.reason);
  return { success: true };
}

/**
 * Cancel all sequences for a user
 */
export async function cancelUserSequences(
  userId: string,
  reason: string = "manual_cancel",
  sequenceType?: SequenceType
): Promise<{ success: boolean; cancelledCount: number; error?: string }> {
  // Validate input
  const validation = cancelUserSequencesSchema.safeParse({ userId, reason, sequenceType });
  if (!validation.success) {
    return { success: false, cancelledCount: 0, error: validation.error.message };
  }

  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from as any)("email_sequences")
    .update({
      status: "cancelled",
      exit_reason: validation.data.reason,
      exited_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", validation.data.userId)
    .in("status", ["active", "paused", "processing"]);

  if (validation.data.sequenceType) {
    query = query.eq("sequence_type", validation.data.sequenceType);
  }

  const { data, error } = await query.select("id");

  if (error) {
    return { success: false, cancelledCount: 0, error: error.message };
  }

  return { success: true, cancelledCount: data?.length || 0 };
}

// ============================================================================
// Queue Statistics
// ============================================================================

/**
 * Get queue statistics using database aggregation for efficiency
 */
export async function getQueueStats(sequenceType?: SequenceType): Promise<{
  active: number;
  paused: number;
  processing: number;
  completed: number;
  cancelled: number;
  exited: number;
  pendingNow: number;
  pendingNext24h: number;
}> {
  const supabase = createAdminClient();
  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Use individual count queries for each status to avoid loading all records
  const statusQueries = ["active", "paused", "processing", "completed", "cancelled", "exited"].map(
    async (status) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from as any)("email_sequences")
        .select("id", { count: "exact", head: true })
        .eq("status", status);
      if (sequenceType) {
        query = query.eq("sequence_type", sequenceType);
      }
      const { count } = await query;
      return { status, count: count || 0 };
    }
  );

  // Get pending counts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pendingNowQuery = (supabase.from as any)("email_sequences")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .lte("next_email_at", now.toISOString());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pendingNext24hQuery = (supabase.from as any)("email_sequences")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .lte("next_email_at", next24h.toISOString())
    .gt("next_email_at", now.toISOString());

  if (sequenceType) {
    pendingNowQuery = pendingNowQuery.eq("sequence_type", sequenceType);
    pendingNext24hQuery = pendingNext24hQuery.eq("sequence_type", sequenceType);
  }

  // Execute all queries in parallel
  const [statusResults, pendingNow, pendingNext24h] = await Promise.all([
    Promise.all(statusQueries),
    pendingNowQuery,
    pendingNext24hQuery,
  ]);

  // Convert status results to counts object
  const counts: Record<string, number> = {};
  for (const { status, count } of statusResults) {
    counts[status] = count;
  }

  return {
    active: counts["active"] || 0,
    paused: counts["paused"] || 0,
    processing: counts["processing"] || 0,
    completed: counts["completed"] || 0,
    cancelled: counts["cancelled"] || 0,
    exited: counts["exited"] || 0,
    pendingNow: pendingNow.count || 0,
    pendingNext24h: pendingNext24h.count || 0,
  };
}

/**
 * Get user's active sequences
 */
export async function getUserSequences(
  userId: string,
  includeCompleted: boolean = false
): Promise<SequenceRecord[]> {
  const supabase = createAdminClient();

  const statuses = includeCompleted
    ? ["active", "paused", "processing", "completed", "cancelled", "exited"]
    : ["active", "paused", "processing"];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)("email_sequences")
    .select("*")
    .eq("user_id", userId)
    .in("status", statuses)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user sequences:", error);
    return [];
  }

  return (data || []) as SequenceRecord[];
}

/**
 * Get sequence by ID
 */
export async function getSequenceById(sequenceId: string): Promise<SequenceRecord | null> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)("email_sequences")
    .select("*")
    .eq("id", sequenceId)
    .single();

  if (error) {
    return null;
  }

  return data as SequenceRecord;
}

// ============================================================================
// Cleanup Functions
// ============================================================================

/**
 * Reset stuck processing sequences (for recovery from crashes)
 */
export async function resetStuckSequences(olderThanMinutes: number = 30): Promise<number> {
  const supabase = createAdminClient();
  const threshold = new Date(Date.now() - olderThanMinutes * 60 * 1000);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)("email_sequences")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("status", "processing")
    .lt("updated_at", threshold.toISOString())
    .select("id");

  if (error) {
    console.error("Error resetting stuck sequences:", error);
    return 0;
  }

  return data?.length || 0;
}

/**
 * Clean up old completed sequences (optional archiving)
 */
export async function cleanupOldSequences(
  olderThanDays: number = 90,
  deleteCompleted: boolean = false
): Promise<{ archived: number; deleted: number }> {
  const supabase = createAdminClient();
  const threshold = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

  if (deleteCompleted) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from as any)("email_sequences")
      .delete()
      .in("status", ["completed", "cancelled", "exited"])
      .lt("updated_at", threshold.toISOString())
      .select("id");

    return { archived: 0, deleted: data?.length || 0 };
  }

  // Just count old sequences (archiving would be a separate process)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase.from as any)("email_sequences")
    .select("id", { count: "exact", head: true })
    .in("status", ["completed", "cancelled", "exited"])
    .lt("updated_at", threshold.toISOString());

  return { archived: count || 0, deleted: 0 };
}
