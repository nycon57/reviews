"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import type { Json } from "@/types/database.types";
import type { ActionResult, WidgetConfig } from "./types";
import {
  calculateSignificance,
  type VariantMetrics,
  type SignificanceResult,
} from "./ab-statistics";

const WIDGETS_PATH = "/dashboard/widgets";

// ── Types ──────────────────────────────────────────────────────────────

export interface AbTestConfig {
  enabled: boolean;
  splitPercent: number; // Percentage of traffic going to variant B (0-100)
  variantWidgetId: string; // UUID of the variant widget_configs row
  startedAt: string; // ISO timestamp
  status: "running" | "completed" | "cancelled";
  winnerId?: string; // UUID of winner widget, set when test concludes
  completedAt?: string; // ISO timestamp
}

export interface AbTestSummary {
  testId: string; // parent widget ID
  parentWidgetId: string;
  parentWidgetName: string;
  variantWidgetId: string;
  variantWidgetName: string;
  widgetType: string;
  status: "running" | "completed" | "cancelled";
  splitPercent: number;
  startedAt: string;
  completedAt: string | null;
  daysRunning: number;
  winnerId: string | null;
  variantA: VariantMetrics;
  variantB: VariantMetrics;
  significance: SignificanceResult;
}

export interface CreateAbTestInput {
  parentWidgetId: string; // UUID of the base widget
  variantConfig: Record<string, unknown>; // Config overrides for the variant
  variantName?: string;
  splitPercent?: number; // Default 50
}

export interface DeclareWinnerInput {
  parentWidgetId: string;
  winnerId: string; // UUID of the winning widget (parent or variant)
}

// ── Helpers ─────────────────────────────────────────────────────────────

interface AuthedContext {
  userId: string;
  organizationId: string;
}

async function getAuthedContext(): Promise<ActionResult<AuthedContext>> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();
  const { data: userData, error } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (error || !userData?.organization_id) {
    return { success: false, error: "Organization not found" };
  }

  if (userData.role !== "admin" && userData.role !== "manager") {
    return { success: false, error: "Insufficient permissions" };
  }

  return {
    success: true,
    data: { userId: user.id, organizationId: userData.organization_id },
  };
}

async function getVariantMetrics(
  supabase: ReturnType<typeof createAdminClient>,
  widgetId: string,
  startDate: string
): Promise<VariantMetrics> {
  const clickEvents = [
    "click_review",
    "click_cta",
    "click_write_review",
    "banner_click",
  ] as const;

  const [impressionResult, clickResult, writeReviewResult] = await Promise.all([
    supabase
      .from("widget_events")
      .select("id", { count: "exact", head: true })
      .eq("widget_id", widgetId)
      .eq("event_type", "impression")
      .gte("created_at", startDate),
    supabase
      .from("widget_events")
      .select("id", { count: "exact", head: true })
      .eq("widget_id", widgetId)
      .in("event_type", clickEvents)
      .gte("created_at", startDate),
    supabase
      .from("widget_events")
      .select("id", { count: "exact", head: true })
      .eq("widget_id", widgetId)
      .eq("event_type", "click_write_review")
      .gte("created_at", startDate),
  ]);

  return {
    impressions: impressionResult.count ?? 0,
    clicks: clickResult.count ?? 0,
    writeReviewClicks: writeReviewResult.count ?? 0,
  };
}

// ── Create A/B Test ──────────────────────────────────────────────────────

export async function createAbTest(
  input: CreateAbTestInput
): Promise<ActionResult<{ parentWidget: WidgetConfig; variantWidget: WidgetConfig }>> {
  try {
    const supabase = createAdminClient();
    const ctx = await getAuthedContext();
    if (!ctx.success) return ctx;

    const splitPercent = input.splitPercent ?? 50;
    if (splitPercent < 10 || splitPercent > 90) {
      return { success: false, error: "Split percent must be between 10 and 90" };
    }

    // Fetch parent widget
    const { data: parent, error: parentErr } = await supabase
      .from("widget_configs")
      .select("*")
      .eq("id", input.parentWidgetId)
      .eq("organization_id", ctx.data.organizationId)
      .single();

    if (parentErr || !parent) {
      return { success: false, error: "Widget not found" };
    }

    // Check no active A/B test exists
    const existingConfig = parent.ab_test_config as AbTestConfig | null;
    if (existingConfig?.enabled && existingConfig.status === "running") {
      return {
        success: false,
        error: "This widget already has an active A/B test. End it before starting a new one.",
      };
    }

    // Cannot create A/B test on a variant widget
    if (parent.parent_widget_id) {
      return { success: false, error: "Cannot create an A/B test on a variant widget" };
    }

    // Create variant widget as a copy with config overrides
    const existingWidgetConfig = (parent.config ?? {}) as Record<string, unknown>;
    const mergedConfig = deepMerge(existingWidgetConfig, input.variantConfig);

    const variantName = input.variantName || `${parent.name} (Variant B)`;
    const suffix = Math.random().toString(36).slice(2, 8);
    const variantWidgetSlug = `${parent.widget_id}-b-${suffix}`;

    const { data: variant, error: variantErr } = await supabase
      .from("widget_configs")
      .insert({
        widget_id: variantWidgetSlug,
        organization_id: parent.organization_id,
        created_by: ctx.data.userId,
        name: variantName,
        widget_type: parent.widget_type,
        entity_type: parent.entity_type,
        entity_id: parent.entity_id,
        config: mergedConfig as unknown as Json,
        allowed_domains: parent.allowed_domains,
        enable_structured_data: parent.enable_structured_data,
        structured_data_type: parent.structured_data_type,
        status: "active" as const,
        version: 1,
        parent_widget_id: parent.id,
        ab_test_group: "B",
      })
      .select()
      .single();

    if (variantErr || !variant) {
      return { success: false, error: variantErr?.message ?? "Failed to create variant" };
    }

    // Set A/B test group on parent
    const { error: parentGroupErr } = await supabase
      .from("widget_configs")
      .update({ ab_test_group: "A" })
      .eq("id", parent.id);

    if (parentGroupErr) {
      // Cleanup: delete variant
      await supabase.from("widget_configs").delete().eq("id", variant.id);
      return { success: false, error: "Failed to update parent widget" };
    }

    // Update parent with ab_test_config
    const abTestConfig: AbTestConfig = {
      enabled: true,
      splitPercent,
      variantWidgetId: variant.id,
      startedAt: new Date().toISOString(),
      status: "running",
    };

    const { data: updatedParent, error: updateErr } = await supabase
      .from("widget_configs")
      .update({
        ab_test_config: abTestConfig as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parent.id)
      .select()
      .single();

    if (updateErr || !updatedParent) {
      return { success: false, error: "Failed to activate A/B test" };
    }

    revalidatePath(WIDGETS_PATH);
    return { success: true, data: { parentWidget: updatedParent, variantWidget: variant } };
  } catch (err) {
    console.error("createAbTest error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ── Get A/B Test Results ──────────────────────────────────────────────────

export async function getAbTestResults(
  parentWidgetId: string
): Promise<ActionResult<AbTestSummary>> {
  try {
    const supabase = createAdminClient();
    const ctx = await getAuthedContext();
    if (!ctx.success) return ctx;

    const { data: parent, error: parentErr } = await supabase
      .from("widget_configs")
      .select("*")
      .eq("id", parentWidgetId)
      .eq("organization_id", ctx.data.organizationId)
      .single();

    if (parentErr || !parent) {
      return { success: false, error: "Widget not found" };
    }

    const abConfig = parent.ab_test_config as AbTestConfig | null;
    if (!abConfig) {
      return { success: false, error: "No A/B test found for this widget" };
    }

    // Fetch variant widget
    const { data: variant, error: variantErr } = await supabase
      .from("widget_configs")
      .select("*")
      .eq("id", abConfig.variantWidgetId)
      .single();

    if (variantErr || !variant) {
      return { success: false, error: "Variant widget not found" };
    }

    // Fetch metrics for both variants
    const [variantA, variantB] = await Promise.all([
      getVariantMetrics(supabase, parent.widget_id, abConfig.startedAt),
      getVariantMetrics(supabase, variant.widget_id, abConfig.startedAt),
    ]);

    const daysRunning = Math.max(
      1,
      Math.ceil((Date.now() - new Date(abConfig.startedAt).getTime()) / 86_400_000)
    );

    const significance = calculateSignificance(variantA, variantB, daysRunning);

    return {
      success: true,
      data: {
        testId: parent.id,
        parentWidgetId: parent.id,
        parentWidgetName: parent.name,
        variantWidgetId: variant.id,
        variantWidgetName: variant.name,
        widgetType: parent.widget_type,
        status: abConfig.status,
        splitPercent: abConfig.splitPercent,
        startedAt: abConfig.startedAt,
        completedAt: abConfig.completedAt ?? null,
        daysRunning,
        winnerId: abConfig.winnerId ?? null,
        variantA,
        variantB,
        significance,
      },
    };
  } catch (err) {
    console.error("getAbTestResults error:", err);
    return { success: false, error: "Failed to load A/B test results" };
  }
}

// ── List A/B Tests ───────────────────────────────────────────────────────

export async function listAbTests(): Promise<ActionResult<AbTestSummary[]>> {
  try {
    const supabase = createAdminClient();
    const ctx = await getAuthedContext();
    if (!ctx.success) return ctx;

    // Find all widgets with ab_test_config
    const { data: widgets, error } = await supabase
      .from("widget_configs")
      .select("*")
      .eq("organization_id", ctx.data.organizationId)
      .not("ab_test_config", "is", null)
      .order("updated_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const results: AbTestSummary[] = [];

    for (const parent of widgets ?? []) {
      const abConfig = parent.ab_test_config as AbTestConfig | null;
      if (!abConfig) continue;

      const { data: variant } = await supabase
        .from("widget_configs")
        .select("*")
        .eq("id", abConfig.variantWidgetId)
        .single();

      if (!variant) continue;

      const [variantA, variantB] = await Promise.all([
        getVariantMetrics(supabase, parent.widget_id, abConfig.startedAt),
        getVariantMetrics(supabase, variant.widget_id, abConfig.startedAt),
      ]);

      const daysRunning = Math.max(
        1,
        Math.ceil((Date.now() - new Date(abConfig.startedAt).getTime()) / 86_400_000)
      );

      const significance = calculateSignificance(variantA, variantB, daysRunning);

      results.push({
        testId: parent.id,
        parentWidgetId: parent.id,
        parentWidgetName: parent.name,
        variantWidgetId: variant.id,
        variantWidgetName: variant.name,
        widgetType: parent.widget_type,
        status: abConfig.status,
        splitPercent: abConfig.splitPercent,
        startedAt: abConfig.startedAt,
        completedAt: abConfig.completedAt ?? null,
        daysRunning,
        winnerId: abConfig.winnerId ?? null,
        variantA,
        variantB,
        significance,
      });
    }

    return { success: true, data: results };
  } catch (err) {
    console.error("listAbTests error:", err);
    return { success: false, error: "Failed to load A/B tests" };
  }
}

// ── Declare Winner ───────────────────────────────────────────────────────

export async function declareWinner(
  input: DeclareWinnerInput
): Promise<ActionResult<WidgetConfig>> {
  try {
    const supabase = createAdminClient();
    const ctx = await getAuthedContext();
    if (!ctx.success) return ctx;

    const { data: parent, error: parentErr } = await supabase
      .from("widget_configs")
      .select("*")
      .eq("id", input.parentWidgetId)
      .eq("organization_id", ctx.data.organizationId)
      .single();

    if (parentErr || !parent) {
      return { success: false, error: "Widget not found" };
    }

    const abConfig = parent.ab_test_config as AbTestConfig | null;
    if (!abConfig || abConfig.status !== "running") {
      return { success: false, error: "No active A/B test to conclude" };
    }

    const { data: variant } = await supabase
      .from("widget_configs")
      .select("*")
      .eq("id", abConfig.variantWidgetId)
      .single();

    if (!variant) {
      return { success: false, error: "Variant widget not found" };
    }

    // Validate winnerId is either parent or variant
    if (input.winnerId !== parent.id && input.winnerId !== variant.id) {
      return { success: false, error: "Winner must be either the base or variant widget" };
    }

    const now = new Date().toISOString();

    if (input.winnerId === variant.id) {
      // Variant wins: promote variant config to parent, deactivate variant
      const { error: promoteErr } = await supabase
        .from("widget_configs")
        .update({
          config: variant.config,
          ab_test_config: {
            ...abConfig,
            enabled: false,
            status: "completed",
            winnerId: variant.id,
            completedAt: now,
          } as unknown as Json,
          ab_test_group: null,
          updated_at: now,
          version: (parent.version ?? 1) + 1,
        })
        .eq("id", parent.id);

      if (promoteErr) {
        return { success: false, error: "Failed to promote variant" };
      }
    } else {
      // Parent wins: just mark test complete
      const { error: updateErr } = await supabase
        .from("widget_configs")
        .update({
          ab_test_config: {
            ...abConfig,
            enabled: false,
            status: "completed",
            winnerId: parent.id,
            completedAt: now,
          } as unknown as Json,
          ab_test_group: null,
          updated_at: now,
        })
        .eq("id", parent.id);

      if (updateErr) {
        return { success: false, error: "Failed to complete test" };
      }
    }

    // Deactivate variant (preserves analytics history)
    await supabase
      .from("widget_configs")
      .update({ status: "inactive" as const, ab_test_group: null, updated_at: now })
      .eq("id", variant.id);

    // Fetch updated parent
    const { data: updatedParent } = await supabase
      .from("widget_configs")
      .select("*")
      .eq("id", parent.id)
      .single();

    revalidatePath(WIDGETS_PATH);
    return { success: true, data: updatedParent! };
  } catch (err) {
    console.error("declareWinner error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ── Cancel Test ──────────────────────────────────────────────────────────

export async function cancelAbTest(
  parentWidgetId: string
): Promise<ActionResult<WidgetConfig>> {
  try {
    const supabase = createAdminClient();
    const ctx = await getAuthedContext();
    if (!ctx.success) return ctx;

    const { data: parent, error: parentErr } = await supabase
      .from("widget_configs")
      .select("*")
      .eq("id", parentWidgetId)
      .eq("organization_id", ctx.data.organizationId)
      .single();

    if (parentErr || !parent) {
      return { success: false, error: "Widget not found" };
    }

    const abConfig = parent.ab_test_config as AbTestConfig | null;
    if (!abConfig || abConfig.status !== "running") {
      return { success: false, error: "No active A/B test to cancel" };
    }

    const now = new Date().toISOString();

    // Mark test as cancelled
    const { data: updatedParent, error: updateErr } = await supabase
      .from("widget_configs")
      .update({
        ab_test_config: {
          ...abConfig,
          enabled: false,
          status: "cancelled",
          completedAt: now,
        } as unknown as Json,
        ab_test_group: null,
        updated_at: now,
      })
      .eq("id", parent.id)
      .select()
      .single();

    if (updateErr || !updatedParent) {
      return { success: false, error: "Failed to cancel test" };
    }

    // Deactivate variant
    await supabase
      .from("widget_configs")
      .update({ status: "inactive" as const, ab_test_group: null, updated_at: now })
      .eq("id", abConfig.variantWidgetId);

    revalidatePath(WIDGETS_PATH);
    return { success: true, data: updatedParent };
  } catch (err) {
    console.error("cancelAbTest error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ── Get Public A/B Config (for embed.js resolution) ──────────────────────

export interface PublicAbTestConfig {
  enabled: boolean;
  splitPercent: number;
  variantWidgetSlug: string; // widget_id (slug) of variant
}

/**
 * Get A/B test config for public embed resolution.
 * Called from the config API route when a widget has an active test.
 */
export async function getPublicAbTestConfig(
  parentDbId: string
): Promise<PublicAbTestConfig | null> {
  const supabase = createAdminClient();

  const { data: parent } = await supabase
    .from("widget_configs")
    .select("ab_test_config")
    .eq("id", parentDbId)
    .single();

  if (!parent?.ab_test_config) return null;

  const abConfig = parent.ab_test_config as unknown as AbTestConfig;
  if (!abConfig.enabled || abConfig.status !== "running") return null;

  // Get variant widget slug
  const { data: variant } = await supabase
    .from("widget_configs")
    .select("widget_id")
    .eq("id", abConfig.variantWidgetId)
    .single();

  if (!variant) return null;

  return {
    enabled: true,
    splitPercent: abConfig.splitPercent,
    variantWidgetSlug: variant.widget_id,
  };
}

// ── Utility ─────────────────────────────────────────────────────────────

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = target[key];
    if (
      sourceVal &&
      typeof sourceVal === "object" &&
      !Array.isArray(sourceVal) &&
      targetVal &&
      typeof targetVal === "object" &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>
      );
    } else {
      result[key] = sourceVal;
    }
  }
  return result;
}
