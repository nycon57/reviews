/**
 * Email Sequence Orchestration Engine - Step Executor
 *
 * Executes sequence steps:
 * - Evaluates exit conditions
 * - Handles conditional branching
 * - Manages delays and scheduling
 * - Sends emails through configured sender
 * - Updates sequence state
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  SequenceDefinition,
  SequenceRecord,
  SequenceStep,
  StepProcessResult,
  ConditionContext,
  EmailContext,
  ExitCondition,
  ConditionalBranch,
} from "./types";
import { evaluateExitConditions, evaluateBranches, defaultCustomEvaluators } from "./conditions";
import { addDelay } from "./utils";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build condition context for evaluation
 */
async function buildConditionContext(
  sequence: SequenceRecord,
  additionalMetadata?: Record<string, unknown>
): Promise<ConditionContext> {
  const supabase = createAdminClient();

  // Get user data
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", sequence.user_id)
    .single();

  // Get organization data
  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", sequence.organization_id)
    .single();

  return {
    user: (user as Record<string, unknown>) || {},
    organization: (organization as Record<string, unknown>) || {},
    sequence,
    metadata: { ...sequence.metadata, ...additionalMetadata },
    customEvaluators: defaultCustomEvaluators,
  };
}

/**
 * Check if email is unsubscribed
 */
async function isEmailUnsubscribed(email: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("email_unsubscribes")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();
  return !!data;
}

/**
 * Select A/B test variant with weight validation
 */
function selectVariant(
  step: SequenceStep,
  assignments: Record<string, string>
): string | undefined {
  if (!step.abTest || !step.abTest.variants.length) return undefined;

  // Check if already assigned
  const assignmentKey = `step_${step.step}`;
  if (assignments[assignmentKey]) {
    return assignments[assignmentKey];
  }

  const variants = step.abTest.variants;

  // Calculate total weight and normalize if needed
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight <= 0) {
    console.warn(`Invalid A/B test weights for step ${step.step}, using first variant`);
    return variants[0]?.id;
  }

  // Select based on normalized weights
  const random = Math.random() * totalWeight;
  let cumulative = 0;

  for (const variant of variants) {
    cumulative += variant.weight;
    if (random <= cumulative) {
      return variant.id;
    }
  }

  return variants[0]?.id;
}

// ============================================================================
// Sequence Status Updates
// ============================================================================

/**
 * Update sequence status to a terminal state
 */
export async function updateSequenceStatus(
  sequenceId: string,
  status: "completed" | "cancelled" | "exited",
  exitReason?: string,
  exitMilestone?: string
): Promise<void> {
  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "completed") {
    updateData.completed_at = new Date().toISOString();
  }

  if (exitReason) {
    updateData.exit_reason = exitReason;
    updateData.exited_at = new Date().toISOString();
  }

  if (exitMilestone) {
    updateData.exit_milestone = exitMilestone;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from as any)("email_sequences").update(updateData).eq("id", sequenceId);
}

/**
 * Update sequence after sending an email
 */
export async function updateSequenceAfterSend(
  sequence: SequenceRecord,
  step: number,
  emailId: string,
  templateName: string,
  variant?: string,
  nextEmailAt?: Date | null
): Promise<void> {
  const supabase = createAdminClient();

  const stepsCompleted = [
    ...sequence.steps_completed,
    {
      step,
      email_id: emailId,
      sent_at: new Date().toISOString(),
      template: templateName,
      ...(variant ? { variant } : {}),
    },
  ];

  const isComplete = step >= sequence.total_steps;

  // Update A/B test assignment if variant was selected
  const abTestAssignments = { ...sequence.ab_test_assignments };
  if (variant) {
    abTestAssignments[`step_${step}`] = variant;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from as any)("email_sequences")
    .update({
      current_step: step,
      steps_completed: stepsCompleted,
      ab_test_assignments: abTestAssignments,
      last_email_at: new Date().toISOString(),
      next_email_at: nextEmailAt?.toISOString() || null,
      status: isComplete ? "completed" : "active",
      completed_at: isComplete ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sequence.id);
}

/**
 * Update sequence after skipping a step
 */
export async function updateSequenceAfterSkip(
  sequence: SequenceRecord,
  step: number,
  reason: string,
  nextEmailAt?: Date | null
): Promise<void> {
  const supabase = createAdminClient();

  const skippedSteps = [
    ...sequence.skipped_steps,
    {
      step,
      reason,
      skipped_at: new Date().toISOString(),
    },
  ];

  const isComplete = step >= sequence.total_steps;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from as any)("email_sequences")
    .update({
      current_step: step,
      skipped_steps: skippedSteps,
      next_email_at: nextEmailAt?.toISOString() || null,
      status: isComplete ? "completed" : "active",
      completed_at: isComplete ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sequence.id);
}

/**
 * Update sequence next email time (for waiting)
 */
export async function updateSequenceNextEmailAt(
  sequenceId: string,
  nextEmailAt: Date
): Promise<void> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from as any)("email_sequences")
    .update({
      next_email_at: nextEmailAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", sequenceId);
}

// ============================================================================
// Exit Condition Handling
// ============================================================================

/**
 * Check standard exit conditions (unsubscribe, notifications disabled)
 */
export async function checkStandardExitConditions(
  sequence: SequenceRecord
): Promise<ExitCondition | null> {
  const supabase = createAdminClient();

  // Get user data
  const { data: user } = await supabase
    .from("users")
    .select("email, receive_notifications")
    .eq("id", sequence.user_id)
    .single();

  if (!user) {
    return {
      conditions: [],
      reason: "error",
      message: "User not found",
    };
  }

  // Check if user has disabled notifications
  if (user.receive_notifications === false) {
    return {
      conditions: [],
      reason: "user_disabled_notifications",
      message: "User has disabled notifications",
    };
  }

  // Check if email is unsubscribed
  const unsubscribed = await isEmailUnsubscribed(user.email);
  if (unsubscribed) {
    return {
      conditions: [],
      reason: "email_unsubscribed",
      message: "Email is unsubscribed",
    };
  }

  return null;
}

/**
 * Check definition-level exit conditions
 */
export async function checkDefinitionExitConditions(
  sequence: SequenceRecord,
  definition: SequenceDefinition
): Promise<ExitCondition | null> {
  if (!definition.exitConditions || definition.exitConditions.length === 0) {
    return null;
  }

  const context = await buildConditionContext(sequence);
  return evaluateExitConditions(definition.exitConditions, context);
}

/**
 * Check step-level exit conditions
 */
export async function checkStepExitConditions(
  sequence: SequenceRecord,
  step: SequenceStep
): Promise<ExitCondition | null> {
  if (!step.exitConditions || step.exitConditions.length === 0) {
    return null;
  }

  const context = await buildConditionContext(sequence);

  // Convert ConditionalBranch[] to ExitCondition[] for evaluation
  const exitConditions: ExitCondition[] = step.exitConditions.map((branch) => ({
    conditions: branch.conditions,
    reason: (branch.exitReason || "action_completed") as ExitCondition["reason"],
    milestone: branch.exitMilestone,
  }));

  return evaluateExitConditions(exitConditions, context);
}

// ============================================================================
// Conditional Branching
// ============================================================================

/**
 * Evaluate skip conditions for a step
 */
export async function shouldSkipStep(
  sequence: SequenceRecord,
  step: SequenceStep
): Promise<{ skip: boolean; reason?: string }> {
  if (!step.canSkip || !step.skipConditions || step.skipConditions.length === 0) {
    return { skip: false };
  }

  const context = await buildConditionContext(sequence);
  const matchingBranch = evaluateBranches(step.skipConditions, context);

  if (matchingBranch && matchingBranch.action === "skip") {
    return {
      skip: true,
      reason: matchingBranch.exitReason || "condition_met",
    };
  }

  return { skip: false };
}

/**
 * Evaluate branches for a step (variant selection, goto, etc.)
 */
export async function evaluateStepBranches(
  sequence: SequenceRecord,
  step: SequenceStep
): Promise<ConditionalBranch | null> {
  if (!step.branches || step.branches.length === 0) {
    return null;
  }

  const context = await buildConditionContext(sequence);
  return evaluateBranches(step.branches, context);
}

// ============================================================================
// Step Execution
// ============================================================================

/**
 * Execute a single sequence step
 */
export async function executeStep(
  sequence: SequenceRecord,
  definition: SequenceDefinition,
  emailSender: (
    ctx: EmailContext
  ) => Promise<{ success: boolean; emailId?: string; error?: string }>
): Promise<StepProcessResult> {
  const supabase = createAdminClient();

  // Check standard exit conditions first
  const standardExit = await checkStandardExitConditions(sequence);
  if (standardExit) {
    await updateSequenceStatus(
      sequence.id,
      "cancelled",
      standardExit.reason,
      standardExit.milestone
    );
    return { success: true, action: "exited" };
  }

  // Check definition-level exit conditions
  const definitionExit = await checkDefinitionExitConditions(sequence, definition);
  if (definitionExit) {
    await updateSequenceStatus(
      sequence.id,
      "exited",
      definitionExit.reason,
      definitionExit.milestone
    );
    return { success: true, action: "exited" };
  }

  // Determine next step
  const nextStepNum = sequence.current_step + 1;

  if (nextStepNum > sequence.total_steps) {
    // Sequence complete
    await updateSequenceStatus(sequence.id, "completed");
    return { success: true, action: "completed" };
  }

  // Find step config
  const stepConfig = definition.steps.find((s) => s.step === nextStepNum);
  if (!stepConfig) {
    return { success: false, error: `Step configuration not found: ${nextStepNum}` };
  }

  // Check step-level exit conditions
  const stepExit = await checkStepExitConditions(sequence, stepConfig);
  if (stepExit) {
    await updateSequenceStatus(sequence.id, "exited", stepExit.reason, stepExit.milestone);
    return { success: true, action: "exited" };
  }

  // Handle skipped steps iteratively to avoid stack overflow
  let currentStepNum = nextStepNum;
  let currentStepConfig = stepConfig;
  let workingSequence = { ...sequence };
  let skipsThisRun = 0;
  const MAX_CONSECUTIVE_SKIPS = 100; // Prevent infinite loops

  while (skipsThisRun < MAX_CONSECUTIVE_SKIPS) {
    const skipResult = await shouldSkipStep(workingSequence, currentStepConfig);

    if (!skipResult.skip) {
      break; // Found a step to execute
    }

    skipsThisRun++;

    // Calculate next email time
    const followingStep = definition.steps.find((s) => s.step === currentStepNum + 1);
    const nextEmailAt = followingStep ? addDelay(new Date(), followingStep.delay) : null;

    await updateSequenceAfterSkip(
      workingSequence,
      currentStepNum,
      skipResult.reason || "condition_met",
      nextEmailAt
    );

    // Check if sequence is complete
    if (currentStepNum >= workingSequence.total_steps) {
      return { success: true, action: "skipped" };
    }

    // Update working sequence and move to next step
    workingSequence = {
      ...workingSequence,
      current_step: currentStepNum,
      skipped_steps: [
        ...workingSequence.skipped_steps,
        {
          step: currentStepNum,
          reason: skipResult.reason || "condition_met",
          skipped_at: new Date().toISOString(),
        },
      ],
    };

    // Move to next step
    currentStepNum++;
    const nextConfig = definition.steps.find((s) => s.step === currentStepNum);
    if (!nextConfig) {
      // No more steps, sequence complete
      await updateSequenceStatus(workingSequence.id, "completed");
      return { success: true, action: "completed" };
    }
    currentStepConfig = nextConfig;

    // Re-check exit conditions for the new step
    const stepExitCheck = await checkStepExitConditions(workingSequence, currentStepConfig);
    if (stepExitCheck) {
      await updateSequenceStatus(
        workingSequence.id,
        "exited",
        stepExitCheck.reason,
        stepExitCheck.milestone
      );
      return { success: true, action: "exited" };
    }
  }

  if (skipsThisRun >= MAX_CONSECUTIVE_SKIPS) {
    console.error(`Sequence ${sequence.id} hit max consecutive skips (${MAX_CONSECUTIVE_SKIPS})`);
    return { success: false, error: "Max consecutive skips exceeded" };
  }

  // Update references to use the potentially updated values
  const stepToExecute = currentStepConfig;

  // Evaluate branches for variant selection
  const branch = await evaluateStepBranches(workingSequence, stepToExecute);
  let variant: string | undefined;

  if (branch?.action === "send_variant" && branch.variant) {
    variant = branch.variant;
  } else {
    // Select variant from A/B test config
    variant = selectVariant(stepToExecute, workingSequence.ab_test_assignments);
  }

  // Get user data for email sending
  const { data: user } = await supabase
    .from("users")
    .select("id, email, full_name")
    .eq("id", workingSequence.user_id)
    .single();

  if (!user) {
    return { success: false, error: "User not found" };
  }

  // Build email context
  const emailContext: EmailContext = {
    sequence: workingSequence,
    step: stepToExecute,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
    },
    variant,
    metadata: workingSequence.metadata,
  };

  // Send the email
  const sendResult = await emailSender(emailContext);

  if (!sendResult.success) {
    return { success: false, error: sendResult.error || "Failed to send email" };
  }

  // Calculate next email time
  const followingStepForSend = definition.steps.find((s) => s.step === currentStepNum + 1);
  const nextEmailAt = followingStepForSend
    ? addDelay(new Date(), followingStepForSend.delay)
    : null;

  // Update sequence state
  await updateSequenceAfterSend(
    workingSequence,
    currentStepNum,
    sendResult.emailId || "unknown",
    stepToExecute.template.name,
    variant,
    nextEmailAt
  );

  return {
    success: true,
    action: "sent",
    emailId: sendResult.emailId,
    variant,
    nextEmailAt: nextEmailAt || undefined,
  };
}

/**
 * Check if a sequence is ready to execute (next_email_at has passed)
 */
export async function isReadyToExecute(sequence: SequenceRecord): Promise<boolean> {
  if (!sequence.next_email_at) return false;
  return new Date(sequence.next_email_at) <= new Date();
}
