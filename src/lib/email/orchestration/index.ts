/**
 * Campaign Sequence Orchestration Engine
 *
 * Multi-channel (email + SMS) campaign sequencer with event/time-based triggers,
 * conditional branching, smart channel selection, and queue management.
 */

// Types

export type {
  SequenceType,
  SequenceStatus,
  TriggerType,
  TriggerEvent,
  ConditionOperator,
  DelayUnit,
  ExitReason,
  ChannelType,
  ChannelConfig,
  SmsTemplateConfig,
  SmartChannelConfig,
  SmsOrchestratedContext,
  ChannelSendResult,
  DelayConfig,
  Condition,
  ConditionalBranch,
  ABTestConfig,
  TemplateConfig,
  SequenceStep,
  SequenceTrigger,
  ExitCondition,
  SequenceDefinition,
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

// Condition Evaluation

export {
  getFieldValue,
  evaluateOperator,
  evaluateCondition,
  evaluateConditions,
  evaluateBranch,
  evaluateBranches,
  evaluateExitConditions,
  isProfileCompleted,
  hasFirstSurveySent,
  hasFirstReviewReceived,
  isPaidUser,
  isInactiveForDays,
  hasLoggedInSince,
  isEmailUnsubscribed,
  hasNotificationsDisabled,
  defaultCustomEvaluators,
  booleanCondition,
  equalsCondition,
  existsCondition,
  customCondition,
} from "./conditions";

// Trigger System

export {
  evaluateTriggerConditions,
  findMatchingTriggers,
  createSequenceInstance,
  handleEventTrigger,
  dispatchEvent,
  triggerSequenceManually,
  checkTimeBasedTriggers,
  getEligibleUsers,
} from "./triggers";

// Step Execution

export {
  updateSequenceStatus,
  updateSequenceAfterSend,
  updateSequenceAfterSkip,
  updateSequenceNextEmailAt,
  checkStandardExitConditions,
  checkDefinitionExitConditions,
  checkStepExitConditions,
  shouldSkipStep,
  evaluateStepBranches,
  executeStep,
  isReadyToExecute,
} from "./executor";

// Queue Management

export {
  fetchAndLockSequences,
  resetSequenceToActive,
  processSequenceQueue,
  processAllSequenceQueues,
  pauseSequence,
  resumeSequence,
  pauseUserSequences,
  resumeUserSequences,
  cancelSequence,
  cancelUserSequences,
  getQueueStats,
  getUserSequences,
  getSequenceById,
  resetStuckSequences,
  cleanupOldSequences,
} from "./queue";

// Registry

export {
  registerSequenceDefinition,
  getSequenceDefinition,
  getAllSequenceDefinitions,
  unregisterSequenceDefinition,
  registerCustomEvaluator,
  getCustomEvaluator,
  getAllCustomEvaluators,
  registerEmailSender,
  getEmailSender,
  getAllEmailSenders,
  registerSequenceDefinitions,
  registerCustomEvaluators,
  registerEmailSenders,
  getRegistryStats,
  clearRegistry,
} from "./registry";

// Utilities

export {
  delayToMs,
  addDelay,
} from "./utils";

// Channel Router

export {
  checkSmsEligibility,
  selectChannel,
  sendSequenceSms,
  routeStepToChannel,
} from "./channel-router";

// SMS Triggers

export {
  handleInboundSmsTrigger,
  handleSmsOptInTrigger,
  handleSmsOptOutTrigger,
  handleSmsDeliveryEvent,
} from "./sms-triggers";

export type {
  InboundSmsEvent,
  SmsConsentEvent,
  SmsDeliveryEvent,
} from "./sms-triggers";
