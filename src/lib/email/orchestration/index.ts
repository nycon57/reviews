/**
 * Campaign Sequence Orchestration Engine
 *
 * A centralized engine for managing multi-channel campaign sequences:
 * - Sequence definition schema (JSON-based)
 * - Multi-channel delivery: email and SMS
 * - SMS send node with consent/quiet-hours/credit checks
 * - Inbound SMS trigger node (sms_received, sms_opt_in, sms_opt_out)
 * - Smart channel selection (prefer_sms, prefer_email, best_available, round_robin)
 * - Conditional channel switching with fallback
 * - Event-based and time-based triggers
 * - Step execution with delay support
 * - Conditional branching based on user actions
 * - Exit conditions (action completed, unsubscribe, consent revoked, etc.)
 * - Sequence pause/resume per user
 * - Queue management and batch processing
 *
 * @example
 * ```typescript
 * import {
 *   registerSequenceDefinition,
 *   handleEventTrigger,
 *   processSequenceQueue,
 *   routeStepToChannel,
 *   handleInboundSmsTrigger,
 * } from "@/lib/email/orchestration";
 *
 * // Register a multi-channel sequence definition
 * registerSequenceDefinition({
 *   type: "welcome",
 *   name: "Welcome Sequence",
 *   steps: [
 *     { step: 1, template: emailTemplate, delay: { value: 0, unit: "minutes" } },
 *     {
 *       step: 2,
 *       template: emailTemplate,
 *       delay: { value: 1, unit: "days" },
 *       channelConfig: {
 *         channel: "sms",
 *         smsTemplate: { templateId: "..." },
 *         fallbackChannel: "email",
 *       },
 *     },
 *     {
 *       step: 3,
 *       template: emailTemplate,
 *       delay: { value: 3, unit: "days" },
 *       smartChannel: { strategy: "best_available" },
 *     },
 *   ],
 *   triggers: [{ type: "event", event: "user_signup" }],
 * });
 *
 * // Handle inbound SMS triggers
 * await handleInboundSmsTrigger(smsEvent, definitions);
 * ```
 */

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Core types
  SequenceType,
  SequenceStatus,
  TriggerType,
  TriggerEvent,
  ConditionOperator,
  DelayUnit,
  ExitReason,
  // Channel types
  ChannelType,
  ChannelConfig,
  SmsTemplateConfig,
  SmartChannelConfig,
  SmsOrchestratedContext,
  ChannelSendResult,
  // Configuration types
  DelayConfig,
  Condition,
  ConditionalBranch,
  ABTestConfig,
  TemplateConfig,
  SequenceStep,
  SequenceTrigger,
  ExitCondition,
  SequenceDefinition,
  // Runtime types
  CompletedStep,
  SkippedStep,
  SequenceRecord,
  StepProcessResult,
  QueueProcessResult,
  TriggerContext,
  ConditionContext,
  EmailContext,
  StartSequenceResult,
  SequenceRegistry,
} from "./types";

// ============================================================================
// Condition Evaluation
// ============================================================================

export {
  // Core evaluation functions
  getFieldValue,
  evaluateOperator,
  evaluateCondition,
  evaluateConditions,
  evaluateBranch,
  evaluateBranches,
  evaluateExitConditions,
  // Pre-built evaluators
  isProfileCompleted,
  hasFirstSurveySent,
  hasFirstReviewReceived,
  isPaidUser,
  isInactiveForDays,
  hasLoggedInSince,
  isEmailUnsubscribed,
  hasNotificationsDisabled,
  defaultCustomEvaluators,
  // Helper functions
  booleanCondition,
  equalsCondition,
  existsCondition,
  customCondition,
} from "./conditions";

// ============================================================================
// Trigger System
// ============================================================================

export {
  // Trigger evaluation
  evaluateTriggerConditions,
  findMatchingTriggers,
  // Sequence creation
  createSequenceInstance,
  // Event-based triggers
  handleEventTrigger,
  dispatchEvent,
  // Manual triggers
  triggerSequenceManually,
  // Time-based triggers
  checkTimeBasedTriggers,
  // Utilities
  getEligibleUsers,
} from "./triggers";

// ============================================================================
// Step Execution
// ============================================================================

export {
  // Status updates
  updateSequenceStatus,
  updateSequenceAfterSend,
  updateSequenceAfterSkip,
  updateSequenceNextEmailAt,
  // Exit condition checking
  checkStandardExitConditions,
  checkDefinitionExitConditions,
  checkStepExitConditions,
  // Conditional branching
  shouldSkipStep,
  evaluateStepBranches,
  // Step execution
  executeStep,
  isReadyToExecute,
} from "./executor";

// ============================================================================
// Queue Management
// ============================================================================

export {
  // Queue processing
  fetchAndLockSequences,
  resetSequenceToActive,
  processSequenceQueue,
  processAllSequenceQueues,
  // Pause/Resume
  pauseSequence,
  resumeSequence,
  pauseUserSequences,
  resumeUserSequences,
  cancelSequence,
  cancelUserSequences,
  // Statistics
  getQueueStats,
  getUserSequences,
  getSequenceById,
  // Cleanup
  resetStuckSequences,
  cleanupOldSequences,
} from "./queue";

// ============================================================================
// Registry
// ============================================================================

export {
  // Definition management
  registerSequenceDefinition,
  getSequenceDefinition,
  getAllSequenceDefinitions,
  unregisterSequenceDefinition,
  // Custom evaluator management
  registerCustomEvaluator,
  getCustomEvaluator,
  getAllCustomEvaluators,
  // Email sender management
  registerEmailSender,
  getEmailSender,
  getAllEmailSenders,
  // Bulk registration
  registerSequenceDefinitions,
  registerCustomEvaluators,
  registerEmailSenders,
  // Stats
  getRegistryStats,
  clearRegistry,
} from "./registry";

// ============================================================================
// Utilities
// ============================================================================

export {
  // Delay calculations
  delayToMs,
  addDelay,
} from "./utils";

// ============================================================================
// Channel Router (Multi-Channel Delivery)
// ============================================================================

export {
  // SMS eligibility
  checkSmsEligibility,
  // Smart channel selection
  selectChannel,
  // SMS send node
  sendSequenceSms,
  // Channel routing (main entry point for multi-channel steps)
  routeStepToChannel,
} from "./channel-router";

// ============================================================================
// SMS Trigger Nodes (Inbound SMS Events)
// ============================================================================

export {
  // Inbound SMS trigger
  handleInboundSmsTrigger,
  // Consent event triggers
  handleSmsOptInTrigger,
  handleSmsOptOutTrigger,
  // Delivery status tracking
  handleSmsDeliveryEvent,
} from "./sms-triggers";

export type {
  InboundSmsEvent,
  SmsConsentEvent,
  SmsDeliveryEvent,
} from "./sms-triggers";
