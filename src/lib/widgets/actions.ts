"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import {
  createWidgetInputSchema,
  updateWidgetInputSchema,
  deleteWidgetInputSchema,
  listWidgetsInputSchema,
  getWidgetInputSchema,
  duplicateWidgetInputSchema,
  type CreateWidgetInput,
  type UpdateWidgetInput,
  type DeleteWidgetInput,
  type ListWidgetsInput,
  type GetWidgetInput,
  type DuplicateWidgetInput,
} from "./schemas";
import type { Json } from "@/types/database.types";
import type {
  ActionResult,
  PaginatedResult,
  WidgetConfig,
  WidgetConfigInsert,
} from "./types";

const WIDGETS_PATH = "/dashboard/widgets";

// ── Helpers ─────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueWidgetId(
  supabase: ReturnType<typeof createAdminClient>,
  name: string
): Promise<string> {
  const base = slugify(name);
  const suffix = Math.random().toString(36).slice(2, 8);
  const candidate = `${base}-${suffix}`;

  const { data } = await supabase
    .from("widget_configs")
    .select("widget_id")
    .eq("widget_id", candidate)
    .maybeSingle();

  if (data) {
    // Collision; try again with longer suffix
    return `${base}-${Math.random().toString(36).slice(2, 10)}`;
  }

  return candidate;
}

interface AuthedContext {
  userId: string;
  organizationId: string;
  role: string;
}

async function getAuthedUserContext(
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
    return {
      success: false,
      error: "Insufficient permissions. Admin or manager role required.",
    };
  }

  return {
    success: true,
    data: {
      userId: user.id,
      organizationId: userData.organization_id,
      role: userData.role,
    },
  };
}

// ── Create Widget ───────────────────────────────────────────────────────

export async function createWidget(
  input: CreateWidgetInput
): Promise<ActionResult<WidgetConfig>> {
  try {
    const validated = createWidgetInputSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? "Validation failed" };
    }

    const supabase = createAdminClient();
    const ctx = await getAuthedUserContext(supabase);
    if (!ctx.success) return ctx;

    const widgetId = await generateUniqueWidgetId(supabase, validated.data.name);

    const insertRow: WidgetConfigInsert = {
      widget_id: widgetId,
      organization_id: ctx.data.organizationId,
      created_by: ctx.data.userId,
      name: validated.data.name,
      widget_type: validated.data.widget_type,
      entity_type: validated.data.entity_type,
      entity_id: validated.data.entity_id ?? null,
      config: validated.data.config as unknown as Json,
      allowed_domains: validated.data.allowed_domains,
      enable_structured_data: validated.data.enable_structured_data,
      structured_data_type: validated.data.structured_data_type,
      status: validated.data.status,
      version: 1,
    };

    const { data, error } = await supabase
      .from("widget_configs")
      .insert(insertRow)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(WIDGETS_PATH);
    return { success: true, data };
  } catch (err) {
    console.error("createWidget error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ── Update Widget ───────────────────────────────────────────────────────

export async function updateWidget(
  input: UpdateWidgetInput
): Promise<ActionResult<WidgetConfig>> {
  try {
    const validated = updateWidgetInputSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? "Validation failed" };
    }

    const supabase = createAdminClient();
    const ctx = await getAuthedUserContext(supabase);
    if (!ctx.success) return ctx;

    // Verify widget belongs to user's org
    const { data: existing, error: fetchError } = await supabase
      .from("widget_configs")
      .select("id, organization_id, config, version")
      .eq("id", validated.data.id)
      .eq("organization_id", ctx.data.organizationId)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: "Widget not found" };
    }

    // Merge config JSONB: deep-merge new config onto existing
    const existingConfig = (existing.config ?? {}) as Record<string, unknown>;
    const inputConfig = (validated.data.config ?? {}) as Record<string, unknown>;
    const mergedConfig = deepMerge(existingConfig, inputConfig);

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      version: (existing.version ?? 1) + 1,
    };

    if (validated.data.name !== undefined) updatePayload.name = validated.data.name;
    if (validated.data.config !== undefined)
      updatePayload.config = mergedConfig as unknown as Json;
    if (validated.data.allowed_domains !== undefined)
      updatePayload.allowed_domains = validated.data.allowed_domains;
    if (validated.data.enable_structured_data !== undefined)
      updatePayload.enable_structured_data = validated.data.enable_structured_data;
    if (validated.data.structured_data_type !== undefined)
      updatePayload.structured_data_type = validated.data.structured_data_type;
    if (validated.data.status !== undefined) updatePayload.status = validated.data.status;
    if (validated.data.entity_id !== undefined) updatePayload.entity_id = validated.data.entity_id;

    const { data, error } = await supabase
      .from("widget_configs")
      .update(updatePayload)
      .eq("id", validated.data.id)
      .eq("organization_id", ctx.data.organizationId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(WIDGETS_PATH);
    return { success: true, data };
  } catch (err) {
    console.error("updateWidget error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ── Delete Widget (soft-delete) ─────────────────────────────────────────

export async function deleteWidget(
  input: DeleteWidgetInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const validated = deleteWidgetInputSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? "Validation failed" };
    }

    const supabase = createAdminClient();
    const ctx = await getAuthedUserContext(supabase);
    if (!ctx.success) return ctx;

    // Verify widget belongs to user's org
    const { data: existing, error: fetchError } = await supabase
      .from("widget_configs")
      .select("id, organization_id, widget_id")
      .eq("id", validated.data.id)
      .eq("organization_id", ctx.data.organizationId)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: "Widget not found" };
    }

    // Prevent deletion of widgets with active A/B test variants
    const { count } = await supabase
      .from("widget_configs")
      .select("id", { count: "exact", head: true })
      .eq("parent_widget_id", existing.id)
      .eq("status", "active");

    if (count && count > 0) {
      return {
        success: false,
        error: "Cannot delete a widget with active A/B test variants. End the test first.",
      };
    }

    // Soft-delete: set status to inactive
    const { error } = await supabase
      .from("widget_configs")
      .update({ status: "inactive" as const, updated_at: new Date().toISOString() })
      .eq("id", validated.data.id)
      .eq("organization_id", ctx.data.organizationId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(WIDGETS_PATH);
    return { success: true, data: { id: validated.data.id } };
  } catch (err) {
    console.error("deleteWidget error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ── List Widgets (paginated, filtered) ──────────────────────────────────

export async function listWidgets(
  input: Partial<ListWidgetsInput> = {}
): Promise<ActionResult<PaginatedResult<WidgetConfig>>> {
  try {
    const validated = listWidgetsInputSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? "Validation failed" };
    }

    const supabase = createAdminClient();
    const ctx = await getAuthedUserContext(supabase);
    if (!ctx.success) return ctx;

    const { page, pageSize, widget_type, status, entity_type, search } = validated.data;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("widget_configs")
      .select("*", { count: "exact" })
      .eq("organization_id", ctx.data.organizationId)
      .is("parent_widget_id", null); // Exclude A/B test variants from listing

    if (widget_type) query = query.eq("widget_type", widget_type);
    if (status) query = query.eq("status", status);
    if (entity_type) query = query.eq("entity_type", entity_type);
    if (search) query = query.ilike("name", `%${search}%`);

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      return { success: false, error: error.message };
    }

    const total = count ?? 0;
    return {
      success: true,
      data: {
        items: data ?? [],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (err) {
    console.error("listWidgets error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ── Get Widget (by UUID or slug) ────────────────────────────────────────

export async function getWidget(
  input: GetWidgetInput
): Promise<ActionResult<WidgetConfig>> {
  try {
    const validated = getWidgetInputSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? "Validation failed" };
    }

    const supabase = createAdminClient();
    const ctx = await getAuthedUserContext(supabase);
    if (!ctx.success) return ctx;

    const { idOrSlug } = validated.data;

    // Try UUID first, fall back to widget_id slug
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    let query = supabase
      .from("widget_configs")
      .select("*")
      .eq("organization_id", ctx.data.organizationId);

    if (isUuid) {
      query = query.eq("id", idOrSlug);
    } else {
      query = query.eq("widget_id", idOrSlug);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return { success: false, error: "Widget not found" };
    }

    return { success: true, data };
  } catch (err) {
    console.error("getWidget error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ── Duplicate Widget ────────────────────────────────────────────────────

export async function duplicateWidget(
  input: DuplicateWidgetInput
): Promise<ActionResult<WidgetConfig>> {
  try {
    const validated = duplicateWidgetInputSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? "Validation failed" };
    }

    const supabase = createAdminClient();
    const ctx = await getAuthedUserContext(supabase);
    if (!ctx.success) return ctx;

    // Fetch source widget
    const { data: source, error: fetchError } = await supabase
      .from("widget_configs")
      .select("*")
      .eq("id", validated.data.id)
      .eq("organization_id", ctx.data.organizationId)
      .single();

    if (fetchError || !source) {
      return { success: false, error: "Widget not found" };
    }

    const newName = `${source.name} (Copy)`;
    const newWidgetId = await generateUniqueWidgetId(supabase, newName);

    const duplicateRow: WidgetConfigInsert = {
      widget_id: newWidgetId,
      organization_id: source.organization_id,
      created_by: ctx.data.userId,
      name: newName,
      widget_type: source.widget_type,
      entity_type: source.entity_type,
      entity_id: source.entity_id,
      config: source.config,
      allowed_domains: source.allowed_domains,
      enable_structured_data: source.enable_structured_data,
      structured_data_type: source.structured_data_type,
      status: "draft",
      version: 1,
    };

    const { data, error } = await supabase
      .from("widget_configs")
      .insert(duplicateRow)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(WIDGETS_PATH);
    return { success: true, data };
  } catch (err) {
    console.error("duplicateWidget error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ── Utility: deep merge for JSONB config ────────────────────────────────

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
