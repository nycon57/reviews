"use server";

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import type {
  UserTask,
  TaskFilter,
  TasksResult,
  TaskCandidate,
  TaskType,
} from "./types";
import {
  checkUnrespondedReviews,
  checkPendingResponseCount,
  checkIncompleteProfile,
  checkNoRecentRequests,
  checkSurveyVelocityDecline,
  checkNegativeThemeSpike,
  checkRatingImprovement,
} from "./rules";

// ============================================================================
// Helpers
// ============================================================================

/** Convert snake_case DB row to camelCase UserTask */
function toUserTask(row: Record<string, unknown>): UserTask {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    organizationId: row.organization_id as string | null,
    taskType: row.task_type as TaskType,
    source: row.source as UserTask["source"],
    dedupKey: row.dedup_key as string | null,
    priority: row.priority as UserTask["priority"],
    title: row.title as string,
    description: row.description as string,
    actionUrl: row.action_url as string | null,
    metadata: (row.metadata as Record<string, unknown>) || {},
    status: row.status as UserTask["status"],
    snoozeUntil: row.snooze_until as string | null,
    completedAt: row.completed_at as string | null,
    dismissedAt: row.dismissed_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ============================================================================
// Read actions
// ============================================================================

export async function getTasks(
  filter: TaskFilter = "pending",
  limit = 20,
  offset = 0
): Promise<TasksResult> {
  const user = await unifiedGetUser();
  if (!user) return { tasks: [], total: 0, pendingCount: 0 };

  const supabase = createUntypedAdminClient();

  // Build filtered query
  let query = supabase
    .from("user_tasks")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter === "pending") {
    query = query.eq("status", "pending");
  } else if (filter === "completed") {
    query = query.in("status", ["completed", "dismissed"]);
  }
  // "all" — no status filter

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching tasks:", error);
    return { tasks: [], total: 0, pendingCount: 0 };
  }

  // Reuse count from first query when filter is "pending" to avoid a second DB call
  let pendingCount: number;
  if (filter === "pending") {
    pendingCount = count || 0;
  } else {
    const { count: pc } = await supabase
      .from("user_tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "pending");
    pendingCount = pc || 0;
  }

  return {
    tasks: (data || []).map(toUserTask),
    total: count || 0,
    pendingCount,
  };
}

export async function getPendingTaskCount(): Promise<number> {
  const user = await unifiedGetUser();
  if (!user) return 0;

  const supabase = createUntypedAdminClient();
  const { count, error } = await supabase
    .from("user_tasks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "pending");

  if (error) {
    console.error("Error fetching pending task count:", error);
    return 0;
  }

  return count || 0;
}

// ============================================================================
// Write actions
// ============================================================================

export async function completeTask(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await unifiedGetUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = createUntypedAdminClient();
  const { error } = await supabase
    .from("user_tasks")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error completing task:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function dismissTask(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await unifiedGetUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = createUntypedAdminClient();
  const { error } = await supabase
    .from("user_tasks")
    .update({
      status: "dismissed",
      dismissed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error dismissing task:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function snoozeTask(
  taskId: string,
  hours: 24 | 72 | 168
): Promise<{ success: boolean; error?: string }> {
  const user = await unifiedGetUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const snoozeUntil = new Date();
  snoozeUntil.setHours(snoozeUntil.getHours() + hours);

  const supabase = createUntypedAdminClient();
  const { error } = await supabase
    .from("user_tasks")
    .update({
      status: "snoozed",
      snooze_until: snoozeUntil.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error snoozing task:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");
  return { success: true };
}

// ============================================================================
// Task generation
// ============================================================================

export async function generateTasksForUser(
  userId: string,
  orgId: string,
  isPro: boolean
): Promise<void> {
  const supabase = createUntypedAdminClient();

  // Throttle: skip if last task was created <5min ago
  const { data: recentTask } = await supabase
    .from("user_tasks")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (recentTask) {
    const lastCreated = new Date(recentTask.created_at as string);
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (lastCreated > fiveMinAgo) return;
  }

  // Un-snooze expired tasks
  await supabase
    .from("user_tasks")
    .update({ status: "pending", snooze_until: null, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "snoozed")
    .lte("snooze_until", new Date().toISOString());

  // Auto-complete stale respond_review tasks (review already responded to)
  const { data: respondTasks } = await supabase
    .from("user_tasks")
    .select("id, metadata")
    .eq("user_id", userId)
    .eq("status", "pending")
    .eq("task_type", "respond_review");

  if (respondTasks?.length) {
    const reviewIds = respondTasks
      .map((t) => (t.metadata as Record<string, unknown>)?.reviewId as string)
      .filter(Boolean);

    if (reviewIds.length) {
      const { data: respondedReviews } = await supabase
        .from("reviews")
        .select("id")
        .in("id", reviewIds)
        .not("response_text", "is", null);

      const respondedIds = new Set((respondedReviews || []).map((r) => r.id));
      const staleTaskIds = respondTasks
        .filter((t) => {
          const rid = (t.metadata as Record<string, unknown>)?.reviewId as string;
          return rid && respondedIds.has(rid);
        })
        .map((t) => t.id as string);

      if (staleTaskIds.length) {
        await supabase
          .from("user_tasks")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .in("id", staleTaskIds);
      }
    }
  }

  // Run all applicable rules
  const allRules: Promise<TaskCandidate[]>[] = [
    checkUnrespondedReviews(supabase, userId, orgId),
    checkPendingResponseCount(supabase, userId, orgId),
    checkIncompleteProfile(supabase, userId),
    checkNoRecentRequests(supabase, userId, orgId),
  ];

  if (isPro) {
    allRules.push(
      checkSurveyVelocityDecline(supabase, userId, orgId),
      checkNegativeThemeSpike(supabase, userId, orgId),
      checkRatingImprovement(supabase, userId, orgId)
    );
  }

  const results = await Promise.all(allRules);
  const candidates = results.flat();

  // Batch upsert all candidates in a single DB call
  if (candidates.length > 0) {
    const now = new Date().toISOString();
    await supabase.from("user_tasks").upsert(
      candidates.map((candidate) => ({
        user_id: userId,
        organization_id: orgId,
        task_type: candidate.taskType,
        source: candidate.source,
        dedup_key: candidate.dedupKey,
        priority: candidate.priority,
        title: candidate.title,
        description: candidate.description,
        action_url: candidate.actionUrl || null,
        metadata: candidate.metadata || {},
        status: "pending",
        updated_at: now,
      })),
      {
        onConflict: "user_id,dedup_key",
        ignoreDuplicates: true,
      }
    );
  }
}
