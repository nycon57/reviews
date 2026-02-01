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
// Channel Types
// ============================================================================

/**
 * Supported communication channels in the sequencer
 */
export type ChannelType = "email" | "sms";

/**
 * SMS-specific template configuration for sequence steps
 */
export interface SmsTemplateConfig {
  /** SMS template ID (references sms_templates table) */
  templateId: string;
  /** Merge field overrides for this step */
  mergeFieldOverrides?: Record<string, string>;
}

/**
 * Channel-specific configuration for a sequence step.
 * When channel is "sms", smsTemplate must be provided.
 * When channel is "email" (default), the existing template field is used.
 */
export interface ChannelConfig {
  /** Which channel to use for this step. Defaults to "email" if omitted. */
  channel: ChannelType;
  /** SMS template config (required when channel is "sms") */
  smsTemplate?: SmsTemplateConfig;
  /** Fallback channel if primary fails (e.g., no SMS consent → fall back to email) */
  fallbackChannel?: ChannelType;
  /** Fallback template (email) if falling back from SMS */
  fallbackTemplate?: TemplateConfig;
  /** Fallback SMS template if falling back from email */
  fallbackSmsTemplate?: SmsTemplateConfig;
}

/**
 * Smart channel selection configuration.
 * Determines which channel to use based on recipient state.
 */
export interface SmartChannelConfig {
  /** Strategy for automatic channel selection */
  strategy: "prefer_sms" | "prefer_email" | "best_available" | "round_robin";
  /** Requirements that must be met for SMS delivery */
  smsRequirements?: {
    /** Require active SMS consent */
    requireConsent?: boolean;
    /** Require phone number on file */
    requirePhoneNumber?: boolean;
    /** Respect quiet hours (delays rather than falls back) */
    respectQuietHours?: boolean;
    /** Require sufficient SMS credits */
    requireCredits?: boolean;
  };
}

/**
 * Context for sending an SMS through the orchestration engine
 */
export interface SmsOrchestratedContext {
  sequence: SequenceRecord;
  step: SequenceStep;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    phone?: string | null;
  };
  organizationId: string;
  smsTemplate: SmsTemplateConfig;
  variant?: string;
  metadata: Record<string, unknown>;
}

/**
 * Result from a channel send operation (unified across email/SMS)
 */
export interface ChannelSendResult {
  success: boolean;
  channel: ChannelType;
  messageId?: string;
  error?: string;
  /** If the message was queued (e.g., quiet hours) rather than sent immediately */
  queued?: boolean;
  scheduledAt?: string;
  /** If a fallback channel was used */
  usedFallback?: boolean;
  fallbackChannel?: ChannelType;
}

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
  | "sms_received"
  | "sms_opt_in"
  | "sms_opt_out"
  | "sms_delivered"
  | "sms_failed"
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
  | "sms_consent_revoked"
  | "sms_credits_exhausted"
  | "no_phone_number"
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
  /** Email template configuration (used when channel is "email" or omitted) */
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
  /**
   * Channel configuration for this step.
   * When omitted, defaults to email channel with the template field.
   */
  channelConfig?: ChannelConfig;
  /**
   * Smart channel selection. When set, the engine automatically picks
   * the best channel based on recipient state (consent, phone availability, etc.).
   * Overrides channelConfig.channel if conditions allow.
   */
  smartChannel?: SmartChannelConfig;
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
  /** Which channel was used to deliver this step */
  channel?: ChannelType;
  /** If a fallback channel was used */
  used_fallback?: boolean;
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
