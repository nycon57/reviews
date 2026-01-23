/**
 * Email Sequence Orchestration Engine - Type Definitions
 *
 * Core types for defining and executing email sequences.
 * These types enable:
 * - JSON/database-based sequence definitions
 * - Event-based and time-based triggers
 * - Conditional branching and exit conditions
 * - Queue management and step execution
 */

import type { EmailTemplate } from "../types";

// ============================================================================
// Sequence Definition Types
// ============================================================================

/**
 * Supported sequence types in the system
 */
export type SequenceType =
  | "welcome"
  | "onboarding"
  | "org_onboarding"
  | "role_onboarding"
  | "team_invite"
  | "re-engagement"
  | "win_back"
  | "feature_announcement"
  | "milestone"
  | "trial_ending"
  | "dunning"
  | "subscription"
  | "announcement"
  | "abandoned_action"
  | "referral"
  | "profile_reminder"
  | "custom";

/**
 * Sequence status states
 */
export type SequenceStatus =
  | "active"
  | "paused"
  | "processing"
  | "completed"
  | "cancelled"
  | "exited";

/**
 * Trigger types for starting sequences
 */
export type TriggerType =
  | "event"
  | "time"
  | "condition"
  | "manual"
  | "api";

/**
 * Event types that can trigger sequences
 */
export type TriggerEvent =
  | "user_signup"
  | "user_login"
  | "org_created"
  | "team_member_invited"
  | "survey_sent"
  | "review_received"
  | "video_submitted"
  | "trial_started"
  | "trial_ending"
  | "payment_failed"
  | "subscription_changed"
  | "user_inactive"
  | "action_abandoned"
  | "milestone_reached"
  | "referral_created"
  | "custom_event";

/**
 * Condition operators for branching logic
 */
export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "less_than"
  | "greater_than_or_equals"
  | "less_than_or_equals"
  | "contains"
  | "not_contains"
  | "is_true"
  | "is_false"
  | "is_null"
  | "is_not_null"
  | "in_list"
  | "not_in_list";

/**
 * Delay unit types for scheduling
 */
export type DelayUnit = "minutes" | "hours" | "days" | "weeks";

/**
 * Exit reason types
 */
export type ExitReason =
  | "activation_milestone_reached"
  | "user_returned"
  | "user_disabled_notifications"
  | "email_unsubscribed"
  | "action_completed"
  | "timeout"
  | "manual_cancel"
  | "sequence_replaced"
  | "error"
  | "custom";

// ============================================================================
// Sequence Definition Schema
// ============================================================================

/**
 * Delay configuration for scheduling emails
 */
export interface DelayConfig {
  value: number;
  unit: DelayUnit;
}

/**
 * Condition for evaluating user state
 */
export interface Condition {
  /** Field path to evaluate (e.g., "user.profile_completed", "metadata.daysInactive") */
  field: string;
  /** Comparison operator */
  operator: ConditionOperator;
  /** Value to compare against */
  value?: unknown;
  /** Custom function name to evaluate (for complex conditions) */
  customEvaluator?: string;
}

/**
 * Conditional branching configuration
 */
export interface ConditionalBranch {
  /** Conditions to evaluate (AND logic) */
  conditions: Condition[];
  /** Action to take if conditions are met */
  action: "skip" | "exit" | "goto_step" | "send_variant";
  /** Target step for goto_step action */
  targetStep?: number;
  /** Variant to send for send_variant action */
  variant?: string;
  /** Exit reason if action is exit */
  exitReason?: string;
  /** Exit milestone if action is exit */
  exitMilestone?: string;
}

/**
 * A/B test configuration for a step
 */
export interface ABTestConfig {
  /** Test ID for tracking */
  testId?: string;
  /** Variants and their weights (must sum to 100) */
  variants: {
    id: string;
    weight: number;
    templateOverride?: EmailTemplate;
  }[];
  /** Metric to optimize for */
  winningMetric?: "open_rate" | "click_rate" | "conversion";
}

/**
 * Email template configuration
 */
export interface TemplateConfig {
  /** Template name/ID */
  name: EmailTemplate;
  /** Subject line override */
  subjectOverride?: string;
  /** Subject line variants for A/B testing */
  subjectVariants?: Record<string, string>;
  /** Dynamic data fields to populate */
  dataFields?: string[];
}

/**
 * Step definition within a sequence
 */
export interface SequenceStep {
  /** Step number (1-indexed) */
  step: number;
  /** Email template configuration */
  template: TemplateConfig;
  /** Delay from previous step (or sequence start for step 1) */
  delay: DelayConfig;
  /** Whether this step can be skipped based on conditions */
  canSkip?: boolean;
  /** Conditions for skipping this step */
  skipConditions?: ConditionalBranch[];
  /** Conditional branches to evaluate before sending */
  branches?: ConditionalBranch[];
  /** A/B test configuration */
  abTest?: ABTestConfig;
  /** Exit conditions to check before sending */
  exitConditions?: ConditionalBranch[];
  /** Description for logging/debugging */
  description?: string;
}

/**
 * Trigger configuration for starting a sequence
 */
export interface SequenceTrigger {
  /** Trigger type */
  type: TriggerType;
  /** Event name for event triggers */
  event?: TriggerEvent;
  /** Custom event name if event is "custom_event" */
  customEvent?: string;
  /** Schedule for time triggers (cron expression or interval) */
  schedule?: string;
  /** Conditions that must be met to trigger */
  conditions?: Condition[];
  /** Delay before starting sequence after trigger */
  delay?: DelayConfig;
  /** Whether to allow multiple active sequences per user */
  allowMultiple?: boolean;
  /** Whether to replace existing active sequence of same type */
  replaceExisting?: boolean;
}

/**
 * Exit condition configuration
 */
export interface ExitCondition {
  /** Conditions to evaluate */
  conditions: Condition[];
  /** Reason for exiting */
  reason: ExitReason;
  /** Milestone that triggered exit (for tracking) */
  milestone?: string;
  /** Custom message for logging */
  message?: string;
}

/**
 * Complete sequence definition
 */
export interface SequenceDefinition {
  /** Unique sequence type identifier */
  type: SequenceType;
  /** Human-readable name */
  name: string;
  /** Description of the sequence purpose */
  description?: string;
  /** Version for tracking schema changes */
  version?: string;
  /** Whether the sequence is enabled */
  enabled?: boolean;
  /** Sequence steps in order */
  steps: SequenceStep[];
  /** Triggers for starting the sequence */
  triggers: SequenceTrigger[];
  /** Global exit conditions checked before each step */
  exitConditions?: ExitCondition[];
  /** Default metadata fields required */
  requiredMetadata?: string[];
  /** Default A/B test assignments to make at start */
  abTestAssignments?: string[];
  /** Tags for categorization */
  tags?: string[];
}

// ============================================================================
// Runtime Types
// ============================================================================

/**
 * Completed step record
 */
export interface CompletedStep {
  step: number;
  email_id: string;
  sent_at: string;
  template?: string;
  variant?: string;
}

/**
 * Skipped step record
 */
export interface SkippedStep {
  step: number;
  reason: string;
  skipped_at: string;
}

/**
 * Sequence instance record (matches database schema)
 */
export interface SequenceRecord {
  id: string;
  user_id: string;
  organization_id: string;
  sequence_type: string;
  status: SequenceStatus;
  current_step: number;
  total_steps: number;
  steps_completed: CompletedStep[];
  ab_test_assignments: Record<string, string>;
  skipped_steps: SkippedStep[];
  exit_reason?: string;
  exit_milestone?: string;
  exited_at?: string;
  next_email_at?: string;
  last_email_at?: string;
  metadata: Record<string, unknown>;
  started_at: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Result of processing a sequence step
 */
export interface StepProcessResult {
  success: boolean;
  action?: "sent" | "skipped" | "exited" | "completed" | "waiting";
  emailId?: string;
  variant?: string;
  error?: string;
  nextEmailAt?: Date;
}

/**
 * Result of processing the queue
 */
export interface QueueProcessResult {
  processed: number;
  failed: number;
  skipped: number;
  exited: number;
  waiting: number;
  errors: string[];
}

/**
 * Trigger evaluation context
 */
export interface TriggerContext {
  userId: string;
  organizationId: string;
  event?: TriggerEvent;
  customEvent?: string;
  eventData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Condition evaluation context
 */
export interface ConditionContext {
  user: Record<string, unknown>;
  organization: Record<string, unknown>;
  sequence: SequenceRecord;
  metadata: Record<string, unknown>;
  eventData?: Record<string, unknown>;
  customEvaluators?: Record<string, (ctx: ConditionContext) => boolean>;
}

/**
 * Email sending context
 */
export interface EmailContext {
  sequence: SequenceRecord;
  step: SequenceStep;
  user: {
    id: string;
    email: string;
    full_name: string | null;
  };
  variant?: string;
  metadata: Record<string, unknown>;
}

/**
 * Result of starting a sequence
 */
export interface StartSequenceResult {
  success: boolean;
  sequenceId?: string;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

/**
 * Sequence registry for managing definitions
 */
export interface SequenceRegistry {
  definitions: Map<SequenceType, SequenceDefinition>;
  customEvaluators: Map<string, (ctx: ConditionContext) => boolean>;
  emailSenders: Map<SequenceType, (ctx: EmailContext) => Promise<{ subject: string; html: string }>>;
}
