"use server";

/**
 * Server Actions for Email A/B Testing System
 * Story S092: Email A/B Testing System
 */

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Helper to get untyped Supabase client for A/B testing tables
 * These tables are not yet in generated types - regenerate after migration
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabaseForABTesting(): SupabaseClient<any, any, any> {
  return createAdminClient() as unknown as SupabaseClient<any, any, any>;
}
import type {
  ActionResult,
  ABTest,
  ABTestResult,
  ABTestFilters,
  ABTestSummary,
  ABTestWithResults,
  CreateABTestInput,
  UpdateABTestInput,
  DeclareWinnerInput,
  StatisticalSignificance,
  WinningMetric,
} from "./types";
import {
  createABTestSchema,
  updateABTestSchema,
  declareWinnerSchema,
  abTestFiltersSchema,
  mapDbTestToTs,
  mapDbResultToTs,
} from "./types";
import {
  calculateStatisticalSignificance,
  calculateConfidenceInterval,
} from "./statistics";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get admin context - requires admin role
 */
async function getAdminContext() {
  const user = await unifiedGetUser();
  if (!user) {
    return null;
  }

  const supabase = getSupabaseForABTesting();
  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData || userData.role !== "admin") {
    return null;
  }

  return {
    userId: userData.id,
    organizationId: userData.organization_id!,
    role: userData.role,
  };
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create a new A/B test
 */
export async function createABTest(
  data: CreateABTestInput
): Promise<ActionResult<ABTest>> {
  // Validate input
  const validated = createABTestSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0]?.message || "Invalid test configuration",
    };
  }

  const context = await getAdminContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin access required" };
  }

  const supabase = await getSupabaseForABTesting();
  const testData = validated.data;

  // Validate traffic split keys match variant IDs
  const variantIds = testData.variants.map((v) => v.id);
  const splitKeys = Object.keys(testData.trafficSplit);
  if (
    variantIds.length !== splitKeys.length ||
    !variantIds.every((id) => splitKeys.includes(id))
  ) {
    return {
      success: false,
      error: "Traffic split must have one entry per variant",
    };
  }

  // Insert test
  const { data: test, error } = await supabase
    .from("email_ab_tests")
    .insert({
      organization_id: context.organizationId,
      name: testData.name,
      description: testData.description || null,
      email_type: testData.emailType,
      test_type: testData.testType,
      winning_metric: testData.winningMetric,
      variants: testData.variants,
      traffic_split: testData.trafficSplit,
      auto_winner_enabled: testData.autoWinnerEnabled,
      min_sample_size: testData.minSampleSize,
      test_duration_hours: testData.testDurationHours,
      confidence_level: testData.confidenceLevel,
      status: "draft",
      created_by: context.userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating A/B test:", error);
    return { success: false, error: "Failed to create A/B test" };
  }

  // Initialize results rows for each variant
  const resultsToInsert = testData.variants.map((v) => ({
    ab_test_id: test.id,
    variant: v.id,
    emails_sent: 0,
    emails_delivered: 0,
    emails_opened: 0,
    emails_clicked: 0,
    emails_bounced: 0,
    emails_failed: 0,
  }));

  const { error: resultsError } = await supabase
    .from("email_ab_test_results")
    .insert(resultsToInsert);

  if (resultsError) {
    console.error("Error initializing A/B test results:", resultsError);
    // Don't fail the whole operation, results will be created on first email
  }

  revalidatePath("/dashboard/admin/email-ab-tests");

  return { success: true, data: mapDbTestToTs(test) };
}

/**
 * Update an existing A/B test (only if status is "draft")
 */
export async function updateABTest(
  id: string,
  data: UpdateABTestInput
): Promise<ActionResult<ABTest>> {
  // Validate input
  const validated = updateABTestSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0]?.message || "Invalid update data",
    };
  }

  const context = await getAdminContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin access required" };
  }

  const supabase = await getSupabaseForABTesting();

  // Check if test exists and is editable
  const { data: existing } = await supabase
    .from("email_ab_tests")
    .select("id, status, organization_id")
    .eq("id", id)
    .eq("organization_id", context.organizationId)
    .single();

  if (!existing) {
    return { success: false, error: "A/B test not found" };
  }

  if (existing.status !== "draft") {
    return {
      success: false,
      error: "Cannot edit test that is not in draft status",
    };
  }

  // Build update object with snake_case keys
  const updateData: Record<string, unknown> = {};
  if (validated.data.name !== undefined) {
    updateData.name = validated.data.name;
  }
  if (validated.data.description !== undefined) {
    updateData.description = validated.data.description;
  }
  if (validated.data.autoWinnerEnabled !== undefined) {
    updateData.auto_winner_enabled = validated.data.autoWinnerEnabled;
  }
  if (validated.data.minSampleSize !== undefined) {
    updateData.min_sample_size = validated.data.minSampleSize;
  }
  if (validated.data.testDurationHours !== undefined) {
    updateData.test_duration_hours = validated.data.testDurationHours;
  }
  if (validated.data.confidenceLevel !== undefined) {
    updateData.confidence_level = validated.data.confidenceLevel;
  }

  // Update test
  const { data: updated, error } = await supabase
    .from("email_ab_tests")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating A/B test:", error);
    return { success: false, error: "Failed to update A/B test" };
  }

  revalidatePath("/dashboard/admin/email-ab-tests");
  revalidatePath(`/dashboard/admin/email-ab-tests/${id}`);

  return { success: true, data: mapDbTestToTs(updated) };
}

/**
 * Delete (archive) an A/B test
 */
export async function deleteABTest(id: string): Promise<ActionResult<void>> {
  const context = await getAdminContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin access required" };
  }

  const supabase = await getSupabaseForABTesting();

  // Soft delete by setting status to archived
  const { error } = await supabase
    .from("email_ab_tests")
    .update({ status: "archived" })
    .eq("id", id)
    .eq("organization_id", context.organizationId);

  if (error) {
    console.error("Error archiving A/B test:", error);
    return { success: false, error: "Failed to archive A/B test" };
  }

  revalidatePath("/dashboard/admin/email-ab-tests");

  return { success: true };
}

// ============================================================================
// Lifecycle Management
// ============================================================================

/**
 * Start an A/B test (activate it)
 */
export async function startABTest(id: string): Promise<ActionResult<ABTest>> {
  const context = await getAdminContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin access required" };
  }

  const supabase = await getSupabaseForABTesting();

  // Check test exists and is in draft status
  const { data: existing } = await supabase
    .from("email_ab_tests")
    .select("id, status, variants, test_duration_hours, organization_id")
    .eq("id", id)
    .eq("organization_id", context.organizationId)
    .single();

  if (!existing) {
    return { success: false, error: "A/B test not found" };
  }

  if (existing.status !== "draft") {
    return {
      success: false,
      error: "Only draft tests can be started",
    };
  }

  // Ensure at least 2 variants
  const variants = existing.variants as unknown[];
  if (!variants || variants.length < 2) {
    return {
      success: false,
      error: "Test must have at least 2 variants to start",
    };
  }

  // Calculate end date based on duration
  const startedAt = new Date();
  const endedAt = new Date(
    startedAt.getTime() + existing.test_duration_hours * 60 * 60 * 1000
  );

  // Update status to active
  const { data: updated, error } = await supabase
    .from("email_ab_tests")
    .update({
      status: "active",
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error starting A/B test:", error);
    return { success: false, error: "Failed to start A/B test" };
  }

  revalidatePath("/dashboard/admin/email-ab-tests");
  revalidatePath(`/dashboard/admin/email-ab-tests/${id}`);

  return { success: true, data: mapDbTestToTs(updated) };
}

/**
 * Stop an A/B test early
 */
export async function stopABTest(id: string): Promise<ActionResult<ABTest>> {
  const context = await getAdminContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin access required" };
  }

  const supabase = await getSupabaseForABTesting();

  // Check test exists and is active
  const { data: existing } = await supabase
    .from("email_ab_tests")
    .select("id, status, organization_id")
    .eq("id", id)
    .eq("organization_id", context.organizationId)
    .single();

  if (!existing) {
    return { success: false, error: "A/B test not found" };
  }

  if (existing.status !== "active" && existing.status !== "paused") {
    return {
      success: false,
      error: "Only active or paused tests can be stopped",
    };
  }

  // Update status to completed
  const { data: updated, error } = await supabase
    .from("email_ab_tests")
    .update({
      status: "completed",
      ended_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error stopping A/B test:", error);
    return { success: false, error: "Failed to stop A/B test" };
  }

  revalidatePath("/dashboard/admin/email-ab-tests");
  revalidatePath(`/dashboard/admin/email-ab-tests/${id}`);

  return { success: true, data: mapDbTestToTs(updated) };
}

/**
 * Pause an A/B test temporarily
 */
export async function pauseABTest(id: string): Promise<ActionResult<ABTest>> {
  const context = await getAdminContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin access required" };
  }

  const supabase = await getSupabaseForABTesting();

  const { data: updated, error } = await supabase
    .from("email_ab_tests")
    .update({ status: "paused" })
    .eq("id", id)
    .eq("organization_id", context.organizationId)
    .eq("status", "active")
    .select()
    .single();

  if (error || !updated) {
    console.error("Error pausing A/B test:", error);
    return { success: false, error: "Failed to pause A/B test" };
  }

  revalidatePath("/dashboard/admin/email-ab-tests");
  revalidatePath(`/dashboard/admin/email-ab-tests/${id}`);

  return { success: true, data: mapDbTestToTs(updated) };
}

/**
 * Resume a paused A/B test
 */
export async function resumeABTest(id: string): Promise<ActionResult<ABTest>> {
  const context = await getAdminContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin access required" };
  }

  const supabase = await getSupabaseForABTesting();

  const { data: updated, error } = await supabase
    .from("email_ab_tests")
    .update({ status: "active" })
    .eq("id", id)
    .eq("organization_id", context.organizationId)
    .eq("status", "paused")
    .select()
    .single();

  if (error || !updated) {
    console.error("Error resuming A/B test:", error);
    return { success: false, error: "Failed to resume A/B test" };
  }

  revalidatePath("/dashboard/admin/email-ab-tests");
  revalidatePath(`/dashboard/admin/email-ab-tests/${id}`);

  return { success: true, data: mapDbTestToTs(updated) };
}

// ============================================================================
// Query Operations
// ============================================================================

/**
 * Get a single A/B test by ID
 */
export async function getABTest(id: string): Promise<ActionResult<ABTest>> {
  const context = await getAdminContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin access required" };
  }

  const supabase = await getSupabaseForABTesting();

  const { data: test, error } = await supabase
    .from("email_ab_tests")
    .select("*")
    .eq("id", id)
    .eq("organization_id", context.organizationId)
    .single();

  if (error || !test) {
    console.error("Error fetching A/B test:", error);
    return { success: false, error: "A/B test not found" };
  }

  return { success: true, data: mapDbTestToTs(test) };
}

/**
 * Get a single A/B test with results
 */
export async function getABTestWithResults(
  id: string
): Promise<ActionResult<ABTestWithResults>> {
  const context = await getAdminContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin access required" };
  }

  const supabase = await getSupabaseForABTesting();

  // Get test
  const { data: test, error: testError } = await supabase
    .from("email_ab_tests")
    .select("*")
    .eq("id", id)
    .eq("organization_id", context.organizationId)
    .single();

  if (testError || !test) {
    console.error("Error fetching A/B test:", testError);
    return { success: false, error: "A/B test not found" };
  }

  // Get results
  const { data: results, error: resultsError } = await supabase
    .from("email_ab_test_results")
    .select("*")
    .eq("ab_test_id", id)
    .order("variant");

  if (resultsError) {
    console.error("Error fetching A/B test results:", resultsError);
    return { success: false, error: "Failed to fetch test results" };
  }

  return {
    success: true,
    data: {
      ...mapDbTestToTs(test),
      results: (results || []).map(mapDbResultToTs),
    },
  };
}

/**
 * Get list of A/B tests with filtering and pagination
 */
export async function getABTests(
  filters?: Partial<ABTestFilters>
): Promise<ActionResult<{ tests: ABTest[]; total: number }>> {
  // Validate filters
  const validated = abTestFiltersSchema.safeParse(filters || {});
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0]?.message || "Invalid filters",
    };
  }

  const context = await getAdminContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin access required" };
  }

  const supabase = await getSupabaseForABTesting();
  const f = validated.data;

  // Build query
  let query = supabase
    .from("email_ab_tests")
    .select("*", { count: "exact" })
    .eq("organization_id", context.organizationId);

  // Apply filters
  if (f.status && f.status !== "all") {
    query = query.eq("status", f.status);
  } else {
    // Exclude archived by default
    query = query.neq("status", "archived");
  }

  if (f.testType && f.testType !== "all") {
    query = query.eq("test_type", f.testType);
  }

  if (f.emailType) {
    query = query.eq("email_type", f.emailType);
  }

  if (f.createdBy) {
    query = query.eq("created_by", f.createdBy);
  }

  if (f.startDate) {
    query = query.gte("started_at", f.startDate);
  }

  if (f.endDate) {
    query = query.lte("started_at", f.endDate);
  }

  if (f.hasWinner !== undefined) {
    if (f.hasWinner) {
      query = query.not("winner_variant", "is", null);
    } else {
      query = query.is("winner_variant", null);
    }
  }

  if (f.search) {
    query = query.ilike("name", `%${f.search}%`);
  }

  // Apply sorting
  const sortColumn =
    f.sortBy === "createdAt"
      ? "created_at"
      : f.sortBy === "startedAt"
        ? "started_at"
        : f.sortBy;
  query = query.order(sortColumn || "created_at", {
    ascending: f.sortOrder === "asc",
  });

  // Apply pagination
  const offset = ((f.page || 1) - 1) * (f.limit || 20);
  query = query.range(offset, offset + (f.limit || 20) - 1);

  const { data: tests, error, count } = await query;

  if (error) {
    console.error("Error fetching A/B tests:", error);
    return { success: false, error: "Failed to fetch A/B tests" };
  }

  return {
    success: true,
    data: {
      tests: (tests || []).map(mapDbTestToTs),
      total: count || 0,
    },
  };
}

/**
 * Get detailed results with statistical analysis for an A/B test
 */
export async function getABTestAnalysis(testId: string): Promise<
  ActionResult<{
    results: ABTestResult[];
    significance: StatisticalSignificance[];
  }>
> {
  const context = await getAdminContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin access required" };
  }

  const supabase = await getSupabaseForABTesting();

  // Get test details
  const { data: test, error: testError } = await supabase
    .from("email_ab_tests")
    .select("*")
    .eq("id", testId)
    .eq("organization_id", context.organizationId)
    .single();

  if (testError || !test) {
    console.error("Error fetching test:", testError);
    return { success: false, error: "A/B test not found" };
  }

  // Get results
  const { data: dbResults, error: resultsError } = await supabase
    .from("email_ab_test_results")
    .select("*")
    .eq("ab_test_id", testId)
    .order("variant");

  if (resultsError) {
    console.error("Error fetching results:", resultsError);
    return { success: false, error: "Failed to fetch test results" };
  }

  const results = (dbResults || []).map(mapDbResultToTs);

  // Calculate confidence intervals for each variant
  const resultsWithCI = results.map((r) => {
    const metric = test.winning_metric as WinningMetric;
    const successes =
      metric === "open_rate" ? r.emailsOpened : r.emailsClicked;
    const trials = r.emailsDelivered;

    const ci = calculateConfidenceInterval(
      successes,
      trials,
      Number(test.confidence_level)
    );

    return {
      ...r,
      confidenceIntervalLower: ci.lower,
      confidenceIntervalUpper: ci.upper,
    };
  });

  // Calculate statistical significance between variants
  const significance: StatisticalSignificance[] = [];
  const variants = test.variants as { id: string; isControl: boolean }[];
  const controlVariant = variants.find((v) => v.isControl);
  const controlResult = controlVariant
    ? resultsWithCI.find((r) => r.variant === controlVariant.id)
    : resultsWithCI[0];

  if (controlResult) {
    for (const result of resultsWithCI) {
      if (result.variant === controlResult.variant) continue;

      const metric = test.winning_metric as WinningMetric;
      const controlSuccesses =
        metric === "open_rate"
          ? controlResult.emailsOpened
          : controlResult.emailsClicked;
      const variantSuccesses =
        metric === "open_rate" ? result.emailsOpened : result.emailsClicked;

      const sig = calculateStatisticalSignificance(
        {
          successes: controlSuccesses,
          trials: controlResult.emailsDelivered,
        },
        {
          successes: variantSuccesses,
          trials: result.emailsDelivered,
        },
        metric,
        Number(test.confidence_level)
      );

      significance.push({
        ...sig,
        variantA: controlResult.variant,
        variantB: result.variant,
      });
    }
  }

  return {
    success: true,
    data: { results: resultsWithCI, significance },
  };
}

/**
 * Get A/B test summary statistics
 */
export async function getABTestSummary(): Promise<ActionResult<ABTestSummary>> {
  const context = await getAdminContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin access required" };
  }

  const supabase = await getSupabaseForABTesting();

  const { data: tests, error } = await supabase
    .from("email_ab_tests")
    .select("id, status, winner_variant, started_at, ended_at")
    .eq("organization_id", context.organizationId)
    .neq("status", "archived");

  if (error) {
    console.error("Error fetching test summary:", error);
    return { success: false, error: "Failed to fetch summary" };
  }

  const allTests = tests || [];
  const active = allTests.filter((t) => t.status === "active").length;
  const completed = allTests.filter((t) => t.status === "completed").length;
  const draft = allTests.filter((t) => t.status === "draft").length;
  const paused = allTests.filter((t) => t.status === "paused").length;
  const withWinner = allTests.filter((t) => t.winner_variant !== null).length;

  // Calculate average duration for completed tests
  const completedTests = allTests.filter((t) => t.started_at && t.ended_at);
  const totalDuration = completedTests.reduce((sum, t) => {
    const duration =
      new Date(t.ended_at!).getTime() - new Date(t.started_at!).getTime();
    return sum + duration / (1000 * 60 * 60); // Convert to hours
  }, 0);
  const averageDuration =
    completedTests.length > 0
      ? Number((totalDuration / completedTests.length).toFixed(1))
      : 0;

  // Get total emails sent across all tests for this organization
  const testIds = allTests.map((t) => t.id);
  let totalEmailsSent = 0;

  if (testIds.length > 0) {
    const { data: resultsSums } = await supabase
      .from("email_ab_test_results")
      .select("emails_sent")
      .in("ab_test_id", testIds); // Filter by organization's tests only

    if (resultsSums) {
      totalEmailsSent = resultsSums.reduce(
        (sum, r) => sum + (r.emails_sent || 0),
        0
      );
    }
  }

  return {
    success: true,
    data: {
      total: allTests.length,
      active,
      completed,
      draft,
      paused,
      withWinner,
      averageDuration,
      totalEmailsSent,
    },
  };
}

// ============================================================================
// Winner Selection
// ============================================================================

/**
 * Manually declare a winner for an A/B test
 */
export async function declareWinner(
  data: DeclareWinnerInput
): Promise<ActionResult<ABTest>> {
  // Validate input
  const validated = declareWinnerSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0]?.message || "Invalid winner data",
    };
  }

  const context = await getAdminContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin access required" };
  }

  const supabase = await getSupabaseForABTesting();
  const { testId, variantId, autoWinner, reason } = validated.data;

  // Verify test exists and variant is valid
  const { data: test, error: testError } = await supabase
    .from("email_ab_tests")
    .select("id, variants, organization_id, status")
    .eq("id", testId)
    .eq("organization_id", context.organizationId)
    .single();

  if (testError || !test) {
    return { success: false, error: "A/B test not found" };
  }

  // Verify variant exists in test
  const variants = test.variants as { id: string }[];
  const variantExists = variants.some((v) => v.id === variantId);
  if (!variantExists) {
    return { success: false, error: "Invalid variant ID for this test" };
  }

  // Update test with winner
  const { data: updated, error: updateError } = await supabase
    .from("email_ab_tests")
    .update({
      winner_variant: variantId,
      winner_declared_at: new Date().toISOString(),
      winner_declared_by: context.userId,
      winner_auto: autoWinner,
      winner_reason: reason || (autoWinner ? "Auto-declared by system" : "Manually declared"),
      status: test.status === "active" ? "completed" : test.status,
      ended_at:
        test.status === "active" ? new Date().toISOString() : undefined,
    })
    .eq("id", testId)
    .select()
    .single();

  if (updateError) {
    console.error("Error declaring winner:", updateError);
    return { success: false, error: "Failed to declare winner" };
  }

  revalidatePath("/dashboard/admin/email-ab-tests");
  revalidatePath(`/dashboard/admin/email-ab-tests/${testId}`);

  return { success: true, data: mapDbTestToTs(updated) };
}

/**
 * Apply winning variant configuration to future email sends
 * This is a placeholder - actual implementation would update email templates or settings
 */
export async function applyWinnerToFuture(
  testId: string
): Promise<ActionResult<{ message: string }>> {
  const context = await getAdminContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin access required" };
  }

  const supabase = await getSupabaseForABTesting();

  // Get test with winner
  const { data: test, error } = await supabase
    .from("email_ab_tests")
    .select("*")
    .eq("id", testId)
    .eq("organization_id", context.organizationId)
    .single();

  if (error || !test) {
    return { success: false, error: "A/B test not found" };
  }

  if (!test.winner_variant) {
    return {
      success: false,
      error: "No winner declared for this test",
    };
  }

  // Get winning variant details
  const variants = test.variants as { id: string; name: string }[];
  const winningVariant = variants.find((v) => v.id === test.winner_variant);
  if (!winningVariant) {
    return { success: false, error: "Winner variant not found" };
  }

  // TODO: Implement logic to update email templates or campaign defaults
  // This would depend on the specific integration requirements
  // For example:
  // - Update survey_templates table with new subject line
  // - Update email sequence configuration
  // - Store in organization settings for this email type

  return {
    success: true,
    data: {
      message: `Winner variant "${winningVariant.name}" marked for future ${test.email_type} emails. Please update email templates manually.`,
    },
  };
}

// ============================================================================
// Utility Functions for Email Integration
// ============================================================================

/**
 * Get an active A/B test for a specific email type
 * Used by email sending logic to determine if an A/B test should be applied
 */
export async function getActiveTestForEmailType(
  organizationId: string,
  emailType: string
): Promise<ActionResult<ABTest | null>> {
  const supabase = await getSupabaseForABTesting();

  const { data: test, error } = await supabase
    .from("email_ab_tests")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("email_type", emailType)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching active test:", error);
    return { success: false, error: "Failed to fetch active test" };
  }

  return {
    success: true,
    data: test ? mapDbTestToTs(test) : null,
  };
}

