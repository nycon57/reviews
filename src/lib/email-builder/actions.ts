"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { createTemplateSchema, updateTemplateSchema } from "./schemas";
import { renderEmailDocument } from "./renderer";
import { extractMergeFields, replaceMergeFields, MERGE_FIELD_EXAMPLES } from "./merge-fields";
import type { CustomEmailTemplate, EmailDocument } from "./types";
import type { EmailBrandingConfig } from "@/lib/organization/types";
import { emailBrandingConfigSchema } from "@/lib/organization/types";

async function getUserContext() {
  const user = await unifiedGetUser();
  if (!user) throw new Error("Not authenticated");

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (!data) throw new Error("User not found");
  return { userId: data.id, organizationId: data.organization_id as string, role: data.role as string };
}

/**
 * Helper to access the email_templates_custom table.
 * Table not yet in generated Supabase types — bypasses strict table name check.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function templatesTable(supabase: ReturnType<typeof createAdminClient>): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.from as any)("email_templates_custom");
}

/** Fetch email branding config for the current user's org. */
async function getOrgBrandingForUser(
  organizationId: string
): Promise<EmailBrandingConfig | null> {
  const supabase = createAdminClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", organizationId)
    .single();

  const settings = org?.settings as Record<string, unknown> | null;
  const raw = settings?.email_branding;
  if (!raw) return null;

  const parsed = emailBrandingConfigSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

// ---------- Queries ----------

export async function listTemplates(): Promise<CustomEmailTemplate[]> {
  const ctx = await getUserContext();
  const supabase = createAdminClient();

  const { data, error } = await templatesTable(supabase)
    .select("*")
    .eq("organization_id", ctx.organizationId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Failed to list templates: ${(error as { message: string }).message}`);
  return (data ?? []) as CustomEmailTemplate[];
}

export async function getTemplateById(
  id: string
): Promise<CustomEmailTemplate | null> {
  const ctx = await getUserContext();
  const supabase = createAdminClient();

  const { data, error } = await templatesTable(supabase)
    .select("*")
    .eq("id", id)
    .eq("organization_id", ctx.organizationId)
    .single();

  if (error) {
    if ((error as { code: string }).code === "PGRST116") return null;
    throw new Error(`Failed to get template: ${(error as { message: string }).message}`);
  }
  return data as CustomEmailTemplate;
}

// ---------- Mutations ----------

export async function createTemplate(input: {
  name: string;
  description?: string;
  category?: string;
  subject: string;
  previewText?: string;
  document: EmailDocument;
}): Promise<CustomEmailTemplate> {
  const ctx = await getUserContext();
  const parsed = createTemplateSchema.parse(input);

  // Pre-render HTML cache
  const orgBranding = await getOrgBrandingForUser(ctx.organizationId);
  const { html } = await renderEmailDocument(parsed.document, undefined, orgBranding);
  const mergeFields = extractMergeFields(parsed.document.blocks);

  const supabase = createAdminClient();

  // Deduplicate name: check for existing templates with the same base name
  const baseName = parsed.name;
  const escapedBaseName = baseName.replace(/[%_\\]/g, (c: string) => `\\${c}`);
  const { data: existing } = await templatesTable(supabase)
    .select("name")
    .eq("organization_id", ctx.organizationId)
    .like("name", `${escapedBaseName}%`);

  let uniqueName = baseName;
  if (existing && existing.length > 0) {
    const names = new Set((existing as { name: string }[]).map((t) => t.name));
    if (names.has(baseName)) {
      let suffix = 2;
      while (names.has(`${baseName} (${suffix})`)) suffix++;
      uniqueName = `${baseName} (${suffix})`;
    }
  }

  const { data, error } = await templatesTable(supabase)
    .insert({
      organization_id: ctx.organizationId,
      created_by: ctx.userId,
      name: uniqueName,
      description: parsed.description ?? null,
      category: parsed.category ?? "custom",
      subject: parsed.subject,
      preview_text: parsed.previewText ?? null,
      document: parsed.document,
      html_cache: html,
      merge_fields: mergeFields,
      is_starter: false,
      is_default: false,
      version: 1,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create template: ${(error as { message: string }).message}`);
  return data as CustomEmailTemplate;
}

export async function updateTemplate(
  id: string,
  input: {
    name?: string;
    description?: string;
    category?: string;
    subject?: string;
    previewText?: string;
    document?: EmailDocument;
  }
): Promise<CustomEmailTemplate> {
  const ctx = await getUserContext();
  const parsed = updateTemplateSchema.parse(input);

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (parsed.name !== undefined) updates.name = parsed.name;
  if (parsed.description !== undefined) updates.description = parsed.description;
  if (parsed.category !== undefined) updates.category = parsed.category;
  if (parsed.subject !== undefined) updates.subject = parsed.subject;
  if (parsed.previewText !== undefined) updates.preview_text = parsed.previewText;

  if (parsed.document) {
    updates.document = parsed.document;
    const orgBranding = await getOrgBrandingForUser(ctx.organizationId);
    const { html } = await renderEmailDocument(parsed.document, undefined, orgBranding);
    updates.html_cache = html;
    updates.merge_fields = extractMergeFields(parsed.document.blocks);
  }

  const supabase = createAdminClient();

  // Atomic version increment: read current version, increment, and update in one go
  // Uses templatesTable helper since table isn't in generated types
  const { data: current } = await templatesTable(supabase)
    .select("version")
    .eq("id", id)
    .eq("organization_id", ctx.organizationId)
    .single();

  updates.version = ((current as { version: number } | null)?.version ?? 0) + 1;

  const { data, error } = await templatesTable(supabase)
    .update(updates)
    .eq("id", id)
    .eq("organization_id", ctx.organizationId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update template: ${(error as { message: string }).message}`);
  return data as CustomEmailTemplate;
}

export async function deleteTemplate(id: string): Promise<void> {
  const ctx = await getUserContext();
  const supabase = createAdminClient();

  const { error } = await templatesTable(supabase)
    .delete()
    .eq("id", id)
    .eq("organization_id", ctx.organizationId);

  if (error) throw new Error(`Failed to delete template: ${(error as { message: string }).message}`);
}

export async function duplicateTemplate(
  id: string
): Promise<CustomEmailTemplate> {
  const existing = await getTemplateById(id);
  if (!existing) throw new Error("Template not found");

  return createTemplate({
    name: `${existing.name} (Copy)`,
    description: existing.description ?? undefined,
    category: existing.category,
    subject: existing.subject,
    previewText: existing.preview_text ?? undefined,
    document: existing.document,
  });
}

// ---------- Resolve (shared by send.ts + campaign-email-sender.ts) ----------

/**
 * Load a custom template by ID and render it with merge values.
 * Uses html_cache when available to avoid re-rendering on every send.
 * Falls back to full render if cache is missing.
 */
export async function resolveTemplateById(
  templateId: string,
  mergeValues: Record<string, string>
): Promise<{ subject: string; html: string }> {
  const supabase = createAdminClient();

  const { data, error } = await templatesTable(supabase)
    .select("document, subject, html_cache, organization_id")
    .eq("id", templateId)
    .single();

  if (error || !data) {
    throw new Error(`Custom template not found: ${templateId}`);
  }

  const row = data as { document: unknown; subject: string; html_cache: string | null; organization_id: string };
  const subject = replaceMergeFields(row.subject, mergeValues);

  // Fast path: use cached HTML with merge field replacement
  if (row.html_cache) {
    const html = replaceMergeFields(row.html_cache, mergeValues);
    return { subject, html };
  }

  // Slow path: full React Email render (cache miss or first use)
  const raw = row.document;
  if (
    !raw ||
    typeof raw !== "object" ||
    !("blocks" in (raw as Record<string, unknown>)) ||
    !Array.isArray((raw as Record<string, unknown>).blocks) ||
    !("settings" in (raw as Record<string, unknown>))
  ) {
    throw new Error(`Custom template ${templateId} has an invalid document structure`);
  }

  const doc = raw as EmailDocument;
  const orgBranding = await getOrgBrandingForUser(row.organization_id);
  const { html } = await renderEmailDocument(doc, mergeValues, orgBranding);
  return { subject, html };
}

// ---------- Preview ----------

export async function previewTemplate(
  document: EmailDocument,
  mergeValues?: Record<string, string>
): Promise<{ html: string }> {
  const ctx = await getUserContext();
  const orgBranding = await getOrgBrandingForUser(ctx.organizationId);
  return renderEmailDocument(document, mergeValues, orgBranding);
}

// ---------- Send Test Email ----------

/** Fetch team members for the "send as" selector. */
export async function getTeamMembersForTestEmail(): Promise<
  { id: string; full_name: string; email: string; avatar_url: string | null; title: string | null }[]
> {
  const ctx = await getUserContext();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, avatar_url, title")
    .eq("organization_id", ctx.organizationId)
    .eq("is_active", true)
    .order("full_name");

  if (error) return [];
  return (data ?? []) as { id: string; full_name: string; email: string; avatar_url: string | null; title: string | null }[];
}

/** Build real merge values from a specific user + their org. */
async function buildMergeValuesForUser(
  userId: string,
  organizationId: string
): Promise<Record<string, string>> {
  const supabase = createAdminClient();

  const [{ data: user }, { data: org }] = await Promise.all([
    supabase
      .from("users")
      .select("full_name, email, avatar_url, photo_url, title, phone, personal_website_url, linkedin_url")
      .eq("id", userId)
      .single(),
    supabase
      .from("organizations")
      .select("name, logo_url, company_email, company_phone")
      .eq("id", organizationId)
      .single(),
  ]);

  const u = user as { full_name: string; email: string; avatar_url: string | null; photo_url: string | null; title: string | null; phone: string | null; personal_website_url: string | null; linkedin_url: string | null } | null;
  const o = org as { name: string; logo_url: string | null; company_email: string | null; company_phone: string | null } | null;

  const firstName = u?.full_name?.split(" ")[0] ?? "Test";
  const { emailConfig } = await import("@/lib/email/client");

  return {
    // Customer fields stay as sample data
    customer_name: MERGE_FIELD_EXAMPLES.customer_name,
    customer_first_name: MERGE_FIELD_EXAMPLES.customer_first_name,
    customer_email: MERGE_FIELD_EXAMPLES.customer_email,
    // Professional fields from real user
    professional_name: u?.full_name ?? "Test User",
    professional_first_name: firstName,
    professional_photo_url: u?.avatar_url || u?.photo_url || "",
    // Organization fields from real org
    company_name: o?.name ?? "Your Company",
    company_logo_url: o?.logo_url ?? "",
    // Links
    survey_link: `${emailConfig.baseUrl}/survey/test-preview`,
    review_link: `${emailConfig.baseUrl}/review/test-preview`,
    unsubscribe_link: "#",
  };
}

export async function sendTestEmail(input: {
  document: EmailDocument;
  subject: string;
  recipientEmail: string;
  /** User ID to populate professional merge fields from. Falls back to sample data. */
  sendAsUserId?: string;
}): Promise<{ success: boolean; error?: string }> {
  const ctx = await getUserContext();

  // Validate recipient
  const email = input.recipientEmail.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Invalid email address" };
  }

  try {
    // Build merge values — real user data if sendAsUserId provided, else samples
    const mergeValues = input.sendAsUserId
      ? await buildMergeValuesForUser(input.sendAsUserId, ctx.organizationId)
      : MERGE_FIELD_EXAMPLES;

    const orgBranding = await getOrgBrandingForUser(ctx.organizationId);
    const { html } = await renderEmailDocument(input.document, mergeValues, orgBranding);
    const subject = replaceMergeFields(input.subject || "Test Email", mergeValues);

    const { sendEmailWithReliability } = await import("@/lib/email/send-utils");
    const { getFromAddress } = await import("@/lib/email/client");

    const result = await sendEmailWithReliability({
      to: email,
      from: getFromAddress(),
      subject: `[Test] ${subject}`,
      html,
      idempotencyKey: `test-email-${ctx.userId}-${Date.now()}`,
      includeListUnsubscribe: false,
      tags: [
        { name: "type", value: "test" },
        { name: "user_id", value: ctx.userId },
      ],
    });

    if (!result.success) {
      return { success: false, error: result.error || "Failed to send" };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send test email",
    };
  }
}

