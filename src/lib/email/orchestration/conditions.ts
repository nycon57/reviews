/**
 * Email Sequence Orchestration Engine - Condition Evaluator
 *
 * Evaluates conditions for:
 * - Conditional branching (skip steps, send variants)
 * - Exit conditions (when to stop a sequence)
 * - Trigger conditions (when to start a sequence)
 */

import type {
  Condition,
  ConditionOperator,
  ConditionContext,
  ConditionalBranch,
  ExitCondition,
} from "./types";

// ============================================================================
// Field Value Extraction
// ============================================================================

/**
 * Extract a value from a nested object using dot notation
 * e.g., "user.profile_completed" -> context.user.profile_completed
 */
export function getFieldValue(
  context: ConditionContext,
  fieldPath: string
): unknown {
  const parts = fieldPath.split(".");
  let value: unknown = context;

  for (const part of parts) {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === "object") {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return value;
}

// ============================================================================
// Operator Evaluation
// ============================================================================

/**
 * Evaluate a single condition operator
 */
export function evaluateOperator(
  operator: ConditionOperator,
  fieldValue: unknown,
  compareValue: unknown
): boolean {
  switch (operator) {
    case "equals":
      return fieldValue === compareValue;

    case "not_equals":
      return fieldValue !== compareValue;

    case "greater_than":
      if (typeof fieldValue === "number" && typeof compareValue === "number") {
        return fieldValue > compareValue;
      }
      if (typeof fieldValue === "string" && typeof compareValue === "string") {
        return fieldValue > compareValue;
      }
      return false;

    case "less_than":
      if (typeof fieldValue === "number" && typeof compareValue === "number") {
        return fieldValue < compareValue;
      }
      if (typeof fieldValue === "string" && typeof compareValue === "string") {
        return fieldValue < compareValue;
      }
      return false;

    case "greater_than_or_equals":
      if (typeof fieldValue === "number" && typeof compareValue === "number") {
        return fieldValue >= compareValue;
      }
      if (typeof fieldValue === "string" && typeof compareValue === "string") {
        return fieldValue >= compareValue;
      }
      return false;

    case "less_than_or_equals":
      if (typeof fieldValue === "number" && typeof compareValue === "number") {
        return fieldValue <= compareValue;
      }
      if (typeof fieldValue === "string" && typeof compareValue === "string") {
        return fieldValue <= compareValue;
      }
      return false;

    case "contains":
      if (typeof fieldValue === "string" && typeof compareValue === "string") {
        return fieldValue.includes(compareValue);
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(compareValue);
      }
      return false;

    case "not_contains":
      if (typeof fieldValue === "string" && typeof compareValue === "string") {
        return !fieldValue.includes(compareValue);
      }
      if (Array.isArray(fieldValue)) {
        return !fieldValue.includes(compareValue);
      }
      return true;

    case "is_true":
      return fieldValue === true;

    case "is_false":
      return fieldValue === false;

    case "is_null":
      return fieldValue === null || fieldValue === undefined;

    case "is_not_null":
      return fieldValue !== null && fieldValue !== undefined;

    case "in_list":
      if (Array.isArray(compareValue)) {
        return compareValue.includes(fieldValue);
      }
      return false;

    case "not_in_list":
      if (Array.isArray(compareValue)) {
        return !compareValue.includes(fieldValue);
      }
      return true;

    default:
      console.warn(`Unknown operator: ${operator}`);
      return false;
  }
}

// ============================================================================
// Condition Evaluation
// ============================================================================

/**
 * Evaluate a single condition
 */
export function evaluateCondition(
  condition: Condition,
  context: ConditionContext
): boolean {
  // Handle custom evaluator
  if (condition.customEvaluator) {
    const evaluator = context.customEvaluators?.[condition.customEvaluator];
    if (evaluator) {
      return evaluator(context);
    }
    console.warn(`Custom evaluator not found: ${condition.customEvaluator}`);
    return false;
  }

  // Extract field value and evaluate
  const fieldValue = getFieldValue(context, condition.field);
  return evaluateOperator(condition.operator, fieldValue, condition.value);
}

/**
 * Evaluate multiple conditions with AND logic
 */
export function evaluateConditions(
  conditions: Condition[],
  context: ConditionContext
): boolean {
  if (conditions.length === 0) {
    return true;
  }

  return conditions.every((condition) => evaluateCondition(condition, context));
}

// ============================================================================
// Branch Evaluation
// ============================================================================

/**
 * Evaluate a conditional branch
 * Returns the action to take if conditions are met, or null if not matched
 */
export function evaluateBranch(
  branch: ConditionalBranch,
  context: ConditionContext
): ConditionalBranch | null {
  if (evaluateConditions(branch.conditions, context)) {
    return branch;
  }
  return null;
}

/**
 * Evaluate multiple branches, returning the first matching branch
 */
export function evaluateBranches(
  branches: ConditionalBranch[],
  context: ConditionContext
): ConditionalBranch | null {
  for (const branch of branches) {
    const result = evaluateBranch(branch, context);
    if (result) {
      return result;
    }
  }
  return null;
}

// ============================================================================
// Exit Condition Evaluation
// ============================================================================

/**
 * Evaluate exit conditions
 * Returns the first matching exit condition, or null if none match
 */
export function evaluateExitConditions(
  exitConditions: ExitCondition[],
  context: ConditionContext
): ExitCondition | null {
  for (const exitCondition of exitConditions) {
    if (evaluateConditions(exitCondition.conditions, context)) {
      return exitCondition;
    }
  }
  return null;
}

// ============================================================================
// Pre-built Condition Evaluators
// ============================================================================

/**
 * Check if user has completed their profile
 */
export function isProfileCompleted(context: ConditionContext): boolean {
  const user = context.user;
  return !!(
    user.full_name &&
    user.photo_url &&
    (user.full_name as string).trim() !== ""
  );
}

/**
 * Check if user has sent their first survey
 */
export function hasFirstSurveySent(context: ConditionContext): boolean {
  return context.metadata?.first_survey_sent === true;
}

/**
 * Check if user has received their first review
 */
export function hasFirstReviewReceived(context: ConditionContext): boolean {
  return context.metadata?.first_review_received === true;
}

/**
 * Check if user is a paid user
 */
export function isPaidUser(context: ConditionContext): boolean {
  const org = context.organization;
  return org.subscription_status === "active";
}

/**
 * Check if user is inactive for N days
 */
export function isInactiveForDays(
  days: number
): (context: ConditionContext) => boolean {
  return (context: ConditionContext): boolean => {
    const lastLogin = context.user.last_login_at as string | null;
    if (!lastLogin) return true;

    const lastLoginDate = new Date(lastLogin);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return diffDays >= days;
  };
}

/**
 * Check if user has logged in since a specific date
 */
export function hasLoggedInSince(
  sinceDate: string | Date
): (context: ConditionContext) => boolean {
  return (context: ConditionContext): boolean => {
    const lastLogin = context.user.last_login_at as string | null;
    if (!lastLogin) return false;

    const lastLoginDate = new Date(lastLogin);
    const checkDate = typeof sinceDate === "string" ? new Date(sinceDate) : sinceDate;

    return lastLoginDate > checkDate;
  };
}

/**
 * Check if email is unsubscribed
 */
export function isEmailUnsubscribed(context: ConditionContext): boolean {
  return context.metadata?.email_unsubscribed === true;
}

/**
 * Check if notifications are disabled
 */
export function hasNotificationsDisabled(context: ConditionContext): boolean {
  return context.user.receive_notifications === false;
}

/**
 * Default custom evaluators map
 */
export const defaultCustomEvaluators: Record<
  string,
  (ctx: ConditionContext) => boolean
> = {
  profile_completed: isProfileCompleted,
  first_survey_sent: hasFirstSurveySent,
  first_review_received: hasFirstReviewReceived,
  is_paid_user: isPaidUser,
  inactive_7_days: isInactiveForDays(7),
  inactive_14_days: isInactiveForDays(14),
  inactive_30_days: isInactiveForDays(30),
  inactive_45_days: isInactiveForDays(45),
  email_unsubscribed: isEmailUnsubscribed,
  notifications_disabled: hasNotificationsDisabled,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a condition for checking a boolean field
 */
export function booleanCondition(
  field: string,
  expectedValue: boolean
): Condition {
  return {
    field,
    operator: expectedValue ? "is_true" : "is_false",
  };
}

/**
 * Create a condition for checking field equality
 */
export function equalsCondition(field: string, value: unknown): Condition {
  return {
    field,
    operator: "equals",
    value,
  };
}

/**
 * Create a condition for checking field is not null
 */
export function existsCondition(field: string): Condition {
  return {
    field,
    operator: "is_not_null",
  };
}

/**
 * Create a condition using a custom evaluator
 */
export function customCondition(evaluatorName: string): Condition {
  return {
    field: "",
    operator: "is_true",
    customEvaluator: evaluatorName,
  };
}
