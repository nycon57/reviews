"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { computeDiff, generateChangeSummary } from "./config-diff";
import type { ActionResult } from "./types";
import type { Json } from "@/types/database.types";

const WIDGETS_PATH = "/dashboard/widgets";
const MAX_VERSIONS = 50;

// ── Types ──────────────────────────────────────────────────────────────

export interface WidgetVersion {
  id: string;
  widget_config_id: string;
  version: number;
  config: Record<string, unknown>;
  name: string;
  status: string;
  allowed_domains: string[];
  enable_structured_data: boolean;
  structured_data_type: string;
  entity_id: string | null;
  changed_by: string | null;
  change_note: string | null;
  change_summary: string | null;
  created_at: string;
  changed_by_name?: string | null;
}

export interface VersionListResult {
  versions: WidgetVersion[];
  total: number;
}

// ── Helpers ────────────────────────────────────────────────────────────

interface AuthedContext {
  userId: string;
  organizationId: string;
}

async function getAuthedContext(
  supabase: ReturnType<typeof createAdminClient>
): Promise<ActionResult<AuthedContext>> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (userError || !userData?.organization_id) {
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

// ── Create Version Snapshot ────────────────────────────────────────────

/**
 * Creates a version snapshot for a widget. Called automatically when
 * updateWidget saves changes, or manually for the initial version.
 */
export async function createVersionSnapshot(
  widgetConfigId: string,
  changeNote?: string
): Promise<ActionResult<WidgetVersion>> {
  try {
    const supabase = createAdminClient();
    const ctx = await getAuthedContext(supabase);
    if (!ctx.success) return ctx;

    // Fetch current widget state
    const { data: widget, error: fetchError } = await supabase
      .from("widget_configs")
      .select("*")
      .eq("id", widgetConfigId)
      .eq("organization_id", ctx.data.organizationId)
      .single();

    if (fetchError || !widget) {
      return { success: false, error: "Widget not found" };
    }

    // Get previous version's config for diff summary
    const { data: prevVersion } = await supabase
      .from("widget_config_versions")
      .select("config, version")
      .eq("widget_config_id", widgetConfigId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentConfig = (widget.config ?? {}) as Record<string, unknown>;
    let changeSummary = "Initial version";

    if (prevVersion) {
      const prevConfig = (prevVersion.config ?? {}) as Record<string, unknown>;
      const diffs = computeDiff(prevConfig, currentConfig);
      changeSummary = generateChangeSummary(diffs);
    }

    const newVersion = widget.version ?? 1;

    const { data, error } = await supabase
      .from("widget_config_versions")
      .insert({
        widget_config_id: widgetConfigId,
        version: newVersion,
        config: currentConfig as unknown as Json,
        name: widget.name,
        status: widget.status,
        allowed_domains: widget.allowed_domains ?? [],
        enable_structured_data: widget.enable_structured_data ?? true,
        structured_data_type: widget.structured_data_type ?? "LocalBusiness",
        entity_id: widget.entity_id,
        changed_by: ctx.data.userId,
        change_note: changeNote ?? null,
        change_summary: changeSummary,
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (version already snapshotted)
      if (error.code === "23505") {
        return { success: false, error: "Version already recorded" };
      }
      return { success: false, error: error.message };
    }

    return { success: true, data: data as WidgetVersion };
  } catch (err) {
    console.error("createVersionSnapshot error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ── List Versions ──────────────────────────────────────────────────────

export async function listWidgetVersions(
  widgetConfigId: string
): Promise<ActionResult<VersionListResult>> {
  try {
    const supabase = createAdminClient();
    const ctx = await getAuthedContext(supabase);
    if (!ctx.success) return ctx;

    // Verify widget belongs to org
    const { data: widget, error: widgetError } = await supabase
      .from("widget_configs")
      .select("id")
      .eq("id", widgetConfigId)
      .eq("organization_id", ctx.data.organizationId)
      .single();

    if (widgetError || !widget) {
      return { success: false, error: "Widget not found" };
    }

    const { data: versions, error, count } = await supabase
      .from("widget_config_versions")
      .select("*", { count: "exact" })
      .eq("widget_config_id", widgetConfigId)
      .order("version", { ascending: false })
      .limit(MAX_VERSIONS);

    if (error) {
      return { success: false, error: error.message };
    }

    // Fetch user names for changed_by
    const userIds = [
      ...new Set(
        (versions ?? [])
          .map((v) => v.changed_by)
          .filter((id): id is string => id !== null)
      ),
    ];

    let userMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, full_name")
        .in("id", userIds);

      if (users) {
        userMap = Object.fromEntries(
          users.map((u) => [u.id, u.full_name ?? "Unknown"])
        );
      }
    }

    const enriched: WidgetVersion[] = (versions ?? []).map((v) => ({
      ...(v as WidgetVersion),
      changed_by_name: v.changed_by ? (userMap[v.changed_by] ?? null) : null,
    }));

    return {
      success: true,
      data: { versions: enriched, total: count ?? 0 },
    };
  } catch (err) {
    console.error("listWidgetVersions error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ── Get Single Version ─────────────────────────────────────────────────

export async function getWidgetVersion(
  widgetConfigId: string,
  version: number
): Promise<ActionResult<WidgetVersion>> {
  try {
    const supabase = createAdminClient();
    const ctx = await getAuthedContext(supabase);
    if (!ctx.success) return ctx;

    // Verify widget belongs to org
    const { data: widget, error: widgetError } = await supabase
      .from("widget_configs")
      .select("id")
      .eq("id", widgetConfigId)
      .eq("organization_id", ctx.data.organizationId)
      .single();

    if (widgetError || !widget) {
      return { success: false, error: "Widget not found" };
    }

    const { data, error } = await supabase
      .from("widget_config_versions")
      .select("*")
      .eq("widget_config_id", widgetConfigId)
      .eq("version", version)
      .single();

    if (error || !data) {
      return { success: false, error: "Version not found" };
    }

    return { success: true, data: data as WidgetVersion };
  } catch (err) {
    console.error("getWidgetVersion error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ── Rollback to Version ────────────────────────────────────────────────

/**
 * Restores a previous version's config as a new version (non-destructive).
 * The widget_id stays the same so analytics references are preserved.
 */
export async function rollbackToVersion(
  widgetConfigId: string,
  targetVersion: number
): Promise<ActionResult<{ newVersion: number }>> {
  try {
    const supabase = createAdminClient();
    const ctx = await getAuthedContext(supabase);
    if (!ctx.success) return ctx;

    // Fetch current widget
    const { data: widget, error: widgetError } = await supabase
      .from("widget_configs")
      .select("id, organization_id, version, config")
      .eq("id", widgetConfigId)
      .eq("organization_id", ctx.data.organizationId)
      .single();

    if (widgetError || !widget) {
      return { success: false, error: "Widget not found" };
    }

    // Fetch target version snapshot
    const { data: targetVersionData, error: versionError } = await supabase
      .from("widget_config_versions")
      .select("*")
      .eq("widget_config_id", widgetConfigId)
      .eq("version", targetVersion)
      .single();

    if (versionError || !targetVersionData) {
      return { success: false, error: "Target version not found" };
    }

    const currentVersion = widget.version ?? 1;
    const newVersionNumber = currentVersion + 1;

    // Update widget_configs with optimistic locking (version check prevents concurrent overwrites)
    const { data: updatedRows, error: updateError } = await supabase
      .from("widget_configs")
      .update({
        config: targetVersionData.config,
        name: targetVersionData.name,
        status: targetVersionData.status as "active" | "draft" | "inactive",
        allowed_domains: targetVersionData.allowed_domains,
        enable_structured_data: targetVersionData.enable_structured_data,
        structured_data_type: targetVersionData.structured_data_type,
        entity_id: targetVersionData.entity_id,
        version: newVersionNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("id", widgetConfigId)
      .eq("organization_id", ctx.data.organizationId)
      .eq("version", currentVersion)
      .select("id");

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    if (!updatedRows || updatedRows.length === 0) {
      return {
        success: false,
        error: "Widget was modified by another user. Please refresh and try again.",
      };
    }

    // Create a new version snapshot for the rollback
    const currentConfig = (widget.config ?? {}) as Record<string, unknown>;
    const restoredConfig = (targetVersionData.config ?? {}) as Record<string, unknown>;
    const diffs = computeDiff(currentConfig, restoredConfig);
    const changeSummary = `Rolled back to v${targetVersion} — ${generateChangeSummary(diffs)}`;

    const { error: snapshotError } = await supabase
      .from("widget_config_versions")
      .insert({
        widget_config_id: widgetConfigId,
        version: newVersionNumber,
        config: targetVersionData.config,
        name: targetVersionData.name,
        status: targetVersionData.status,
        allowed_domains: targetVersionData.allowed_domains ?? [],
        enable_structured_data: targetVersionData.enable_structured_data ?? true,
        structured_data_type: targetVersionData.structured_data_type ?? "LocalBusiness",
        entity_id: targetVersionData.entity_id,
        changed_by: ctx.data.userId,
        change_note: `Rolled back to version ${targetVersion}`,
        change_summary: changeSummary,
      });

    if (snapshotError) {
      console.error("Failed to create rollback snapshot:", snapshotError);
      // Non-fatal: the widget was already updated successfully
    }

    revalidatePath(WIDGETS_PATH);
    return { success: true, data: { newVersion: newVersionNumber } };
  } catch (err) {
    console.error("rollbackToVersion error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}
