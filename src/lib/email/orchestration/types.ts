import type { EmailTemplate } from "../types";

// Channel Types

export type ChannelType = "email" | "sms";

export interface SmsTemplateConfig {
  templateId: string;
  mergeFieldOverrides?: Record<string, string>;
}

/**
 * Channel-specific configuration for a sequence step.
 * When channel is "sms", smsTemplate must be provided.
 * When channel is "email" (default), the existing template field is used.
 */
export interface ChannelConfig {
  channel: ChannelType;
  smsTemplate?: SmsTemplateConfig;
  fallbackChannel?: ChannelType;
  fallbackTemplate?: TemplateConfig;
  fallbackSmsTemplate?: SmsTemplateConfig;
}

/** Determines which channel to use based on recipient state. */
export interface SmartChannelConfig {
  strategy: "prefer_sms" | "prefer_email" | "best_available" | "round_robin";
  smsRequirements?: {
    requireConsent?: boolean;
    requirePhoneNumber?: boolean;
    respectQuietHours?: boolean;
    requireCredits?: boolean;
  };
}

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

export interface ChannelSendResult {
  success: boolean;
  channel: ChannelType;
  messageId?: string;
  error?: string;
  /** True if the message was queued (e.g., quiet hours) rather than sent immediately */
  queued?: boolean;
  scheduledAt?: string;
  usedFallback?: boolean;
  fallbackChannel?: ChannelType;
}

// Sequence Definition Types

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

export type SequenceStatus =
  | "active"
  | "paused"
  | "processing"
  | "completed"
  | "cancelled"
  | "exited";

export type TriggerType =
  | "event"
  | "time"
  | "condition"
  | "manual"
  | "api";

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

export type DelayUnit = "minutes" | "hours" | "days" | "weeks";

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

// Sequence Definition Schema

export interface DelayConfig {
  value: number;
  unit: DelayUnit;
}

export interface Condition {
  /** Field path to evaluate (e.g., "user.profile_completed", "metadata.daysInactive") */
  field: string;
  operator: ConditionOperator;
  value?: unknown;
  customEvaluator?: string;
}

export interface ConditionalBranch {
  conditions: Condition[];
  action: "skip" | "exit" | "goto_step" | "send_variant";
  targetStep?: number;
  variant?: string;
  exitReason?: string;
  exitMilestone?: string;
}

export interface ABTestConfig {
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

export interface TemplateConfig {
  name: EmailTemplate;
  subjectOverride?: string;
  subjectVariants?: Record<string, string>;
  dataFields?: string[];
}

export interface SequenceStep {
  step: number;
  template: TemplateConfig;
  delay: DelayConfig;
  canSkip?: boolean;
  skipConditions?: ConditionalBranch[];
  branches?: ConditionalBranch[];
  abTest?: ABTestConfig;
  exitConditions?: ConditionalBranch[];
  description?: string;
  /** When omitted, defaults to email channel with the template field. */
  channelConfig?: ChannelConfig;
  /** Overrides channelConfig.channel based on recipient state (consent, phone, etc.). */
  smartChannel?: SmartChannelConfig;
}

export interface SequenceTrigger {
  type: TriggerType;
  event?: TriggerEvent;
  customEvent?: string;
  schedule?: string;
  conditions?: Condition[];
  delay?: DelayConfig;
  allowMultiple?: boolean;
  replaceExisting?: boolean;
}

export interface ExitCondition {
  conditions: Condition[];
  reason: ExitReason;
  milestone?: string;
  message?: string;
}

export interface SequenceDefinition {
  type: SequenceType;
  name: string;
  description?: string;
  version?: string;
  enabled?: boolean;
  steps: SequenceStep[];
  triggers: SequenceTrigger[];
  exitConditions?: ExitCondition[];
  requiredMetadata?: string[];
  abTestAssignments?: string[];
  tags?: string[];
}

// Runtime Types

export interface CompletedStep {
  step: number;
  email_id: string;
  sent_at: string;
  template?: string;
  variant?: string;
  channel?: ChannelType;
  used_fallback?: boolean;
}

export interface SkippedStep {
  step: number;
  reason: string;
  skipped_at: string;
}

/** Matches the email_sequences database table schema. */
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

export interface StepProcessResult {
  success: boolean;
  action?: "sent" | "skipped" | "exited" | "completed" | "waiting";
  emailId?: string;
  variant?: string;
  error?: string;
  nextEmailAt?: Date;
}

export interface QueueProcessResult {
  processed: number;
  failed: number;
  skipped: number;
  exited: number;
  waiting: number;
  errors: string[];
}

export interface TriggerContext {
  userId: string;
  organizationId: string;
  event?: TriggerEvent;
  customEvent?: string;
  eventData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ConditionContext {
  user: Record<string, unknown>;
  organization: Record<string, unknown>;
  sequence: SequenceRecord;
  metadata: Record<string, unknown>;
  eventData?: Record<string, unknown>;
  customEvaluators?: Record<string, (ctx: ConditionContext) => boolean>;
}

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

export interface StartSequenceResult {
  success: boolean;
  sequenceId?: string;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

export interface SequenceRegistry {
  definitions: Map<SequenceType, SequenceDefinition>;
  customEvaluators: Map<string, (ctx: ConditionContext) => boolean>;
  emailSenders: Map<SequenceType, (ctx: EmailContext) => Promise<{ subject: string; html: string }>>;
}
