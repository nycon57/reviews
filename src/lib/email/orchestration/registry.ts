import "server-only";

/**
 * Email Sequence Orchestration Engine - Sequence Registry
 *
 * Central registry for:
 * - Sequence definitions
 * - Custom condition evaluators
 * - Email sender implementations
 */

import type {
  SequenceType,
  SequenceDefinition,
  SequenceRegistry,
  EmailContext,
  ConditionContext,
} from "./types";

// ============================================================================
// Global Registry (Server-Side Singleton)
// ============================================================================

/**
 * Global registry instance
 * In production, this would be populated at startup or loaded from database
 */
const globalRegistry: SequenceRegistry = {
  definitions: new Map(),
  customEvaluators: new Map(),
  emailSenders: new Map(),
};

// ============================================================================
// Definition Management
// ============================================================================

/**
 * Register a sequence definition
 */
export function registerSequenceDefinition(
  definition: SequenceDefinition
): void {
  globalRegistry.definitions.set(definition.type, definition);
}

/**
 * Get a sequence definition by type
 */
export function getSequenceDefinition(
  type: SequenceType
): SequenceDefinition | undefined {
  return globalRegistry.definitions.get(type);
}

/**
 * Get all registered sequence definitions
 */
export function getAllSequenceDefinitions(): Map<SequenceType, SequenceDefinition> {
  return new Map(globalRegistry.definitions);
}

/**
 * Remove a sequence definition
 */
export function unregisterSequenceDefinition(type: SequenceType): boolean {
  return globalRegistry.definitions.delete(type);
}

// ============================================================================
// Custom Evaluator Management
// ============================================================================

/**
 * Register a custom condition evaluator
 */
export function registerCustomEvaluator(
  name: string,
  evaluator: (ctx: ConditionContext) => boolean
): void {
  globalRegistry.customEvaluators.set(name, evaluator);
}

/**
 * Get a custom evaluator by name
 */
export function getCustomEvaluator(
  name: string
): ((ctx: ConditionContext) => boolean) | undefined {
  return globalRegistry.customEvaluators.get(name);
}

/**
 * Get all custom evaluators
 */
export function getAllCustomEvaluators(): Map<
  string,
  (ctx: ConditionContext) => boolean
> {
  return new Map(globalRegistry.customEvaluators);
}

// ============================================================================
// Email Sender Management
// ============================================================================

/**
 * Register an email sender for a sequence type
 */
export function registerEmailSender(
  type: SequenceType,
  sender: (ctx: EmailContext) => Promise<{ subject: string; html: string }>
): void {
  globalRegistry.emailSenders.set(type, sender);
}

/**
 * Get email sender for a sequence type
 */
export function getEmailSender(
  type: SequenceType
): ((ctx: EmailContext) => Promise<{ subject: string; html: string }>) | undefined {
  return globalRegistry.emailSenders.get(type);
}

/**
 * Get all email senders
 */
export function getAllEmailSenders(): Map<
  SequenceType,
  (ctx: EmailContext) => Promise<{ subject: string; html: string }>
> {
  return new Map(globalRegistry.emailSenders);
}

// ============================================================================
// Campaign-Specific Definition Management
// ============================================================================

/**
 * Separate registry for campaign definitions keyed by campaignId.
 * Avoids collisions when multiple campaigns share type "custom".
 */
const campaignDefinitions = new Map<string, SequenceDefinition>();

/**
 * Register a campaign sequence definition by campaign ID.
 */
export function registerCampaignSequenceDefinition(
  campaignId: string,
  definition: SequenceDefinition
): void {
  campaignDefinitions.set(campaignId, definition);
  // Also register under the shared "custom" type for queue processing
  globalRegistry.definitions.set(definition.type, definition);
}

/**
 * Get a campaign sequence definition by campaign ID.
 */
export function getCampaignSequenceDefinition(
  campaignId: string
): SequenceDefinition | undefined {
  return campaignDefinitions.get(campaignId);
}

/**
 * Remove a campaign's definition from the registry.
 */
export function unregisterCampaignSequenceDefinition(campaignId: string): boolean {
  return campaignDefinitions.delete(campaignId);
}

/**
 * Get all registered campaign definitions.
 */
export function getAllCampaignDefinitions(): Map<string, SequenceDefinition> {
  return new Map(campaignDefinitions);
}

// ============================================================================
// Bulk Registration
// ============================================================================

/**
 * Register multiple sequence definitions at once
 */
export function registerSequenceDefinitions(
  definitions: SequenceDefinition[]
): void {
  for (const definition of definitions) {
    registerSequenceDefinition(definition);
  }
}

/**
 * Register multiple custom evaluators at once
 */
export function registerCustomEvaluators(
  evaluators: Record<string, (ctx: ConditionContext) => boolean>
): void {
  for (const [name, evaluator] of Object.entries(evaluators)) {
    registerCustomEvaluator(name, evaluator);
  }
}

/**
 * Register multiple email senders at once
 */
export function registerEmailSenders(
  senders: Map<
    SequenceType,
    (ctx: EmailContext) => Promise<{ subject: string; html: string }>
  >
): void {
  for (const [type, sender] of senders) {
    registerEmailSender(type, sender);
  }
}

// ============================================================================
// Registry Stats
// ============================================================================

/**
 * Get registry statistics
 */
export function getRegistryStats(): {
  definitionsCount: number;
  evaluatorsCount: number;
  sendersCount: number;
  registeredTypes: SequenceType[];
} {
  return {
    definitionsCount: globalRegistry.definitions.size,
    evaluatorsCount: globalRegistry.customEvaluators.size,
    sendersCount: globalRegistry.emailSenders.size,
    registeredTypes: Array.from(globalRegistry.definitions.keys()),
  };
}

/**
 * Clear all registrations (useful for testing)
 */
export function clearRegistry(): void {
  globalRegistry.definitions.clear();
  globalRegistry.customEvaluators.clear();
  globalRegistry.emailSenders.clear();
}
