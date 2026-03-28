// Task System Types

export type TaskStatus = "pending" | "completed" | "dismissed" | "snoozed";
export type TaskSource = "rule" | "ai";
export type TaskPriority = "high" | "medium" | "low";
export type TaskFilter = "all" | "pending" | "completed";

export type TaskType =
  // Rule-based (all tiers)
  | "respond_review"
  | "pending_responses"
  | "incomplete_profile"
  | "no_recent_requests"
  | "connect_google"
  // Pro tier (AI-derived)
  | "survey_velocity_decline"
  | "negative_theme_spike"
  | "rating_improvement";

/** DB row shape, camelCased */
export interface UserTask {
  id: string;
  userId: string;
  organizationId: string | null;
  taskType: TaskType;
  source: TaskSource;
  dedupKey: string | null;
  priority: TaskPriority;
  title: string;
  description: string;
  actionUrl: string | null;
  metadata: Record<string, unknown>;
  status: TaskStatus;
  snoozeUntil: string | null;
  completedAt: string | null;
  dismissedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Output of rule functions, pre-insert */
export interface TaskCandidate {
  taskType: TaskType;
  source: TaskSource;
  dedupKey: string;
  priority: TaskPriority;
  title: string;
  description: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

/** Server action response */
export interface TasksResult {
  tasks: UserTask[];
  total: number;
  pendingCount: number;
}
