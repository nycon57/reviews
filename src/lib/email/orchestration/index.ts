/**
 * Email Sequence Orchestration Engine
 *
 * A centralized engine for managing all email sequences:
 * - Sequence definition schema (JSON-based)
 * - Event-based and time-based triggers
 * - Step execution with delay support
 * - Conditional branching based on user actions
 * - Exit conditions (action completed, unsubscribe, timeout)
 * - Sequence pause/resume per user
 * - Queue management and batch processing
 *
 * @example
 * ```typescript
 * import {
 *   registerSequenceDefinition,
 *   handleEventTrigger,
 *   processSequenceQueue,
 *   pauseSequence,
 *   resumeSequence,
 * } from "@/lib/email/orchestration";
 *
 * // Register a sequence definition
 * registerSequenceDefinition(mySequenceDefinition);
 *
 * // Handle an event trigger
 * await handleEventTrigger(definition, "user_signup", {
 *   userId: "...",
 *   organizationId: "...",
 *   metadata: { firstName: "John" },
 * });
 *
 * // Process the queue (called by cron job)
 * const result = await processSequenceQueue(definition, emailSender);
 *
 * // Pause/resume sequences
 * await pauseSequence(sequenceId);
 * await resumeSequence(sequenceId);
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
