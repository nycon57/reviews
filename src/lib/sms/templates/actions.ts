"use server";

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import type { SmsTemplate } from "../types";
import {
  createSmsTemplateSchema,
  updateSmsTemplateSchema,
  archiveSmsTemplateSchema,
  getSmsTemplateSchema,
  listSmsTemplatesSchema,
  type CreateSmsTemplateInput,
  type UpdateSmsTemplateInput,
  type ListSmsTemplatesInput,
} from "./schemas";
import { validateTemplateBody } from "./validators";
import {
  extractMergeFields,
  renderTemplate,
  renderTemplatePreview,
  type MergeContext,
  type RenderResult,
} from "./merge-engine";
import { DEFAULT_SMS_TEMPLATES } from "./default-templates";

// ── Types ─────────────────────────────────────────────────────────────

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Auth helper ───────────────────────────────────────────────────────

async function getUserContext() {
  const user = await unifiedGetUser();
  if (!user) return null;

  const supabase = createUntypedAdminClient();
  const { data } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  return data as { id: string; organization_id: string; role: string } | null;
}

// ── CRUD Actions ──────────────────────────────────────────────────────

/**
 * Create a new SMS template for the current user's organization.
 */
export async function createSmsTemplate(
  input: CreateSmsTemplateInput
): Promise<ActionResult<SmsTemplate>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = createSmsTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  // Validate template body
  const validation = validateTemplateBody(parsed.data.body);
  if (!validation.valid) {
    const firstError = validation.issues.find((i) => i.severity === "error");
    return { success: false, error: firstError?.message ?? "Template body validation failed" };
  }

  const mergeFields = extractMergeFields(parsed.data.body);

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("sms_templates")
    .insert({
      organization_id: context.organization_id,
      name: parsed.data.name,
      category: parsed.data.category,
      body: parsed.data.body,
      merge_fields: mergeFields,
      is_locked: false,
      is_default: false,
      status: "active",
      created_by: context.id,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: `Failed to create template: ${error.message}` };
  }

  revalidatePath("/dashboard/settings");
  return { success: true, data: data as SmsTemplate };
}

/**
 * Update an existing SMS template.
 * Locked templates can only be edited by admin users.
 * Default templates can be duplicated but not edited.
 */
export async function updateSmsTemplate(
  input: UpdateSmsTemplateInput
): Promise<ActionResult<SmsTemplate>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = updateSmsTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = createUntypedAdminClient();

  // Fetch existing template to check permissions
  const { data: existing } = await supabase
    .from("sms_templates")
    .select("*")
    .eq("id", parsed.data.id)
    .eq("organization_id", context.organization_id)
    .single();

  if (!existing) {
    return { success: false, error: "Template not found" };
  }

  // Check locked template permissions
  if (existing.is_locked && context.role !== "admin") {
    return { success: false, error: "Only admins can edit locked templates" };
  }

  // Validate body if being updated
  if (parsed.data.body) {
    const validation = validateTemplateBody(parsed.data.body);
    if (!validation.valid) {
      const firstError = validation.issues.find((i) => i.severity === "error");
      return { success: false, error: firstError?.message ?? "Template body validation failed" };
    }
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
  if (parsed.data.body !== undefined) {
    updateData.body = parsed.data.body;
    updateData.merge_fields = extractMergeFields(parsed.data.body);
  }
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("sms_templates")
    .update(updateData)
    .eq("id", parsed.data.id)
    .eq("organization_id", context.organization_id)
    .select()
    .single();

  if (error) {
    return { success: false, error: `Failed to update template: ${error.message}` };
  }

  revalidatePath("/dashboard/settings");
  return { success: true, data: data as SmsTemplate };
}

/**
 * Archive an SMS template (soft delete).
 * Default templates (is_default=true) cannot be archived.
 * Locked templates require admin role.
 */
export async function archiveSmsTemplate(
  input: { id: string }
): Promise<ActionResult> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = archiveSmsTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = createUntypedAdminClient();

  // Fetch template to check permissions
  const { data: existing } = await supabase
    .from("sms_templates")
    .select("is_default, is_locked")
    .eq("id", parsed.data.id)
    .eq("organization_id", context.organization_id)
    .single();

  if (!existing) {
    return { success: false, error: "Template not found" };
  }

  if (existing.is_default) {
    return { success: false, error: "Default templates cannot be archived" };
  }

  if (existing.is_locked && context.role !== "admin") {
    return { success: false, error: "Only admins can archive locked templates" };
  }

  const { error } = await supabase
    .from("sms_templates")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("organization_id", context.organization_id);

  if (error) {
    return { success: false, error: `Failed to archive template: ${error.message}` };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

/**
 * Get a single SMS template by ID.
 */
export async function getSmsTemplate(
  input: { id: string }
): Promise<ActionResult<SmsTemplate>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = getSmsTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("sms_templates")
    .select("*")
    .eq("id", parsed.data.id)
    .eq("organization_id", context.organization_id)
    .single();

  if (error || !data) {
    return { success: false, error: "Template not found" };
  }

  return { success: true, data: data as SmsTemplate };
}

/**
 * List SMS templates for the current organization with optional filters.
 */
export async function listSmsTemplates(
  input?: Partial<ListSmsTemplatesInput>
): Promise<ActionResult<{ templates: SmsTemplate[]; total: number }>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = listSmsTemplatesSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { category, status, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  const supabase = createUntypedAdminClient();
  let query = supabase
    .from("sms_templates")
    .select("*", { count: "exact" })
    .eq("organization_id", context.organization_id)
    .eq("status", status)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error, count } = await query;

  if (error) {
    return { success: false, error: `Failed to list templates: ${error.message}` };
  }

  return {
    success: true,
    data: {
      templates: (data ?? []) as SmsTemplate[],
      total: count ?? 0,
    },
  };
}

/**
 * Render a template preview with sample merge data.
 * Accepts either a template ID (fetches from DB) or raw body text.
 */
export async function previewSmsTemplate(
  input: { id?: string; body?: string }
): Promise<ActionResult<RenderResult>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  let body: string;

  if (input.id) {
    const supabase = createUntypedAdminClient();
    const { data } = await supabase
      .from("sms_templates")
      .select("body")
      .eq("id", input.id)
      .eq("organization_id", context.organization_id)
      .single();

    if (!data) {
      return { success: false, error: "Template not found" };
    }
    body = data.body;
  } else if (input.body) {
    body = input.body;
  } else {
    return { success: false, error: "Either template ID or body text is required" };
  }

  const result = renderTemplatePreview(body);
  return { success: true, data: result };
}

/**
 * Render a template with actual merge context (used at send time).
 * Stores the rendered body as a snapshot for audit trail.
 */
export async function renderSmsTemplate(
  templateId: string,
  mergeContext: MergeContext
): Promise<ActionResult<RenderResult>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createUntypedAdminClient();
  const { data: template } = await supabase
    .from("sms_templates")
    .select("body")
    .eq("id", templateId)
    .eq("organization_id", context.organization_id)
    .eq("status", "active")
    .single();

  if (!template) {
    return { success: false, error: "Template not found or inactive" };
  }

  const result = renderTemplate(template.body, mergeContext);
  return { success: true, data: result };
}

/**
 * Seed default SMS templates for an organization.
 * Called during organization SMS initialization.
 * Skips if default templates already exist.
 */
export async function seedDefaultTemplates(
  organizationId: string
): Promise<ActionResult<{ created: number }>> {
  const supabase = createUntypedAdminClient();

  // Check if defaults already exist
  const { count } = await supabase
    .from("sms_templates")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("is_default", true);

  if (count && count > 0) {
    return { success: true, data: { created: 0 } };
  }

  const inserts = DEFAULT_SMS_TEMPLATES.map((t) => ({
    organization_id: organizationId,
    name: t.name,
    category: t.category,
    body: t.body,
    merge_fields: t.merge_fields,
    is_locked: true,
    is_default: true,
    status: "active",
  }));

  const { error } = await supabase.from("sms_templates").insert(inserts);

  if (error) {
    return { success: false, error: `Failed to seed default templates: ${error.message}` };
  }

  return { success: true, data: { created: inserts.length } };
}
