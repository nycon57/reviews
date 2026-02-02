"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import {
  generateStructuredData,
  resolveDefaultSchemaType,
  type EntityData,
  type ReviewData,
  type JsonLdOutput,
} from "./structured-data-generator";
import {
  validateStructuredData,
  getValidationStatus,
  type ValidationResult,
  type WidgetValidationSummary,
} from "./seo-validation";
import type { ActionResult } from "./types";

// ── Types ────────────────────────────────────────────────────────────

export interface WidgetSeoData {
  widgetId: string;
  widgetName: string;
  widgetType: string;
  entityType: string;
  entityId: string | null;
  structuredDataEnabled: boolean;
  schemaType: string;
  jsonLd: JsonLdOutput;
  validation: ValidationResult;
}

export interface BulkValidationReport {
  total: number;
  valid: number;
  warnings: number;
  errors: number;
  disabled: number;
  widgets: WidgetValidationSummary[];
}

export interface ValidationAlert {
  configId: string;
  widgetName: string;
  widgetId: string;
  previousStatus: string;
  currentStatus: string;
  newErrors: number;
  timestamp: string;
}

// ── Auth Helper ──────────────────────────────────────────────────────

async function getOrgId(): Promise<ActionResult<string>> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (error || !data?.organization_id) {
    return { success: false, error: "Organization not found" };
  }

  return { success: true, data: data.organization_id };
}

// ── Helpers ──────────────────────────────────────────────────────────

function parseAddress(
  raw: unknown
): EntityData["address"] | undefined {
  const addr = raw as Record<string, string | null> | null;
  if (!addr) return undefined;
  return {
    street: addr.street ?? null,
    city: addr.city ?? null,
    state: addr.state ?? null,
    zip: addr.zip ?? null,
    country: addr.country ?? null,
  };
}

// ── Entity + Review Fetching ─────────────────────────────────────────

async function fetchEntityAndReviews(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string,
  entityType: string,
  entityId: string | null
): Promise<{ entity: EntityData; reviews: ReviewData[] }> {
  const entity: EntityData = { name: "Unknown" };

  if (entityType === "user" && entityId) {
    const { data: user } = await supabase
      .from("users")
      .select("full_name, title")
      .eq("id", entityId)
      .maybeSingle();

    if (user?.full_name) {
      entity.name = user.full_name;
      entity.title = user.title;
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .maybeSingle();

    if (org?.name) {
      entity.works_for = org.name;
    }
  } else if (entityType === "branch" && entityId) {
    const { data: branch } = await supabase
      .from("branches")
      .select("name, address, phone, website_url")
      .eq("id", entityId)
      .eq("is_active", true)
      .maybeSingle();

    if (branch) {
      entity.name = branch.name;
      entity.telephone = branch.phone;
      entity.url = branch.website_url;
      entity.address = parseAddress(branch.address);
    }
  } else {
    const { data: org } = await supabase
      .from("organizations")
      .select("name, logo_url")
      .eq("id", organizationId)
      .maybeSingle();

    if (org) {
      entity.name = org.name;
      entity.logo_url = org.logo_url;
    }
  }

  let query = supabase
    .from("reviews")
    .select("rating, customer_name, text, review_date")
    .eq("organization_id", organizationId)
    .eq("status", "approved")
    .eq("is_published", true);

  if (entityType === "user" && entityId) {
    query = query.eq("user_id", entityId);
  }

  const { data: reviewRows } = await query
    .order("review_date", { ascending: false })
    .limit(50);

  const reviews: ReviewData[] = (reviewRows ?? []).map((r) => ({
    rating: r.rating,
    customer_name: r.customer_name,
    text: r.text,
    review_date: r.review_date,
  }));

  return { entity, reviews };
}

// ── Batch Fetching ──────────────────────────────────────────────────

interface WidgetRow {
  id: string;
  widget_id: string;
  name: string;
  widget_type: string;
  entity_type: string;
  entity_id: string | null;
  enable_structured_data: boolean | null;
  structured_data_type: string | null;
  organization_id: string;
  updated_at?: string;
  status?: string;
}

/**
 * Batch-fetch entity data and reviews for multiple widgets to avoid N+1 queries.
 * Returns a map of entityId -> { entity, reviews } for each unique entity.
 */
async function batchFetchEntitiesAndReviews(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string,
  widgets: WidgetRow[]
): Promise<
  Map<string, { entity: EntityData; reviews: ReviewData[] }>
> {
  const result = new Map<string, { entity: EntityData; reviews: ReviewData[] }>();

  // Group widgets by entity to avoid duplicate fetches
  const userIds = new Set<string>();
  const branchIds = new Set<string>();
  let needsOrgData = false;

  for (const w of widgets) {
    if (!w.enable_structured_data) continue;
    if (w.entity_type === "user" && w.entity_id) userIds.add(w.entity_id);
    else if (w.entity_type === "branch" && w.entity_id) branchIds.add(w.entity_id);
    else needsOrgData = true;
  }

  // Batch fetch users
  const usersMap = new Map<string, { full_name: string | null; title: string | null }>();
  if (userIds.size > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, title")
      .in("id", Array.from(userIds));
    for (const u of users ?? []) {
      usersMap.set(u.id, { full_name: u.full_name, title: u.title });
    }
  }

  // Batch fetch branches
  const branchesMap = new Map<
    string,
    { name: string; phone: string | null; website_url: string | null; address: unknown }
  >();
  if (branchIds.size > 0) {
    const { data: branches } = await supabase
      .from("branches")
      .select("id, name, address, phone, website_url")
      .in("id", Array.from(branchIds))
      .eq("is_active", true);
    for (const b of branches ?? []) {
      branchesMap.set(b.id, {
        name: b.name,
        phone: b.phone,
        website_url: b.website_url,
        address: b.address,
      });
    }
  }

  // Fetch org data (needed for org-entity widgets and for user worksFor)
  let orgData: { name: string; logo_url: string | null } | null = null;
  if (needsOrgData || userIds.size > 0) {
    const { data: org } = await supabase
      .from("organizations")
      .select("name, logo_url")
      .eq("id", organizationId)
      .maybeSingle();
    orgData = org;
  }

  // Fetch all reviews for this org in one query
  const { data: allReviewRows } = await supabase
    .from("reviews")
    .select("rating, customer_name, text, review_date, user_id")
    .eq("organization_id", organizationId)
    .eq("status", "approved")
    .eq("is_published", true)
    .order("review_date", { ascending: false })
    .limit(500);

  const allReviews = (allReviewRows ?? []).map((r) => ({
    rating: r.rating,
    customer_name: r.customer_name,
    text: r.text,
    review_date: r.review_date,
    user_id: r.user_id,
  }));

  // Build entity + reviews for each widget
  for (const w of widgets) {
    if (!w.enable_structured_data) continue;

    const cacheKey = `${w.entity_type}:${w.entity_id ?? "org"}`;
    if (result.has(cacheKey)) continue;

    const entity: EntityData = { name: "Unknown" };
    let widgetReviews: ReviewData[];

    if (w.entity_type === "user" && w.entity_id) {
      const userData = usersMap.get(w.entity_id);
      if (userData?.full_name) {
        entity.name = userData.full_name;
        entity.title = userData.title;
      }
      if (orgData?.name) {
        entity.works_for = orgData.name;
      }
      widgetReviews = allReviews
        .filter((r) => r.user_id === w.entity_id)
        .slice(0, 50);
    } else if (w.entity_type === "branch" && w.entity_id) {
      const branchData = branchesMap.get(w.entity_id);
      if (branchData) {
        entity.name = branchData.name;
        entity.telephone = branchData.phone;
        entity.url = branchData.website_url;
        entity.address = parseAddress(branchData.address);
      }
      widgetReviews = allReviews.slice(0, 50);
    } else {
      if (orgData) {
        entity.name = orgData.name;
        entity.logo_url = orgData.logo_url;
      }
      widgetReviews = allReviews.slice(0, 50);
    }

    result.set(cacheKey, { entity, reviews: widgetReviews });
  }

  return result;
}

// ── Actions ──────────────────────────────────────────────────────────

/**
 * Get SEO data + validation for a single widget by its config UUID.
 */
export async function getWidgetSeoData(
  configId: string
): Promise<ActionResult<WidgetSeoData>> {
  try {
    const orgResult = await getOrgId();
    if (!orgResult.success) return orgResult;

    const supabase = createAdminClient();
    const { data: widget, error } = await supabase
      .from("widget_configs")
      .select(
        "id, widget_id, name, widget_type, entity_type, entity_id, enable_structured_data, structured_data_type, organization_id"
      )
      .eq("id", configId)
      .eq("organization_id", orgResult.data)
      .single();

    if (error || !widget) {
      return { success: false, error: "Widget not found" };
    }

    const schemaType =
      widget.structured_data_type ??
      resolveDefaultSchemaType(widget.entity_type);

    const { entity, reviews } = await fetchEntityAndReviews(
      supabase,
      widget.organization_id,
      widget.entity_type,
      widget.entity_id
    );

    const jsonLd = generateStructuredData(schemaType, entity, reviews);
    const validation = validateStructuredData(jsonLd);

    return {
      success: true,
      data: {
        widgetId: widget.widget_id,
        widgetName: widget.name,
        widgetType: widget.widget_type,
        entityType: widget.entity_type,
        entityId: widget.entity_id,
        structuredDataEnabled: widget.enable_structured_data ?? true,
        schemaType,
        jsonLd,
        validation,
      },
    };
  } catch (err) {
    console.error("getWidgetSeoData error:", err);
    return { success: false, error: "Failed to load SEO data" };
  }
}

/**
 * Bulk validate all active widgets for the organization.
 * Uses batched entity/review fetching to avoid N+1 queries.
 */
export async function bulkValidateWidgets(): Promise<
  ActionResult<BulkValidationReport>
> {
  try {
    const orgResult = await getOrgId();
    if (!orgResult.success) return orgResult;

    const supabase = createAdminClient();
    const { data: widgets, error } = await supabase
      .from("widget_configs")
      .select(
        "id, widget_id, name, widget_type, entity_type, entity_id, enable_structured_data, structured_data_type, organization_id, status"
      )
      .eq("organization_id", orgResult.data)
      .is("parent_widget_id", null)
      .in("status", ["active", "draft"])
      .order("name");

    if (error) {
      return { success: false, error: error.message };
    }

    const widgetList = widgets ?? [];

    // Batch fetch all entity data and reviews upfront
    const entityCache = await batchFetchEntitiesAndReviews(
      supabase,
      orgResult.data,
      widgetList
    );

    const summaries: WidgetValidationSummary[] = [];
    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    let disabledCount = 0;

    for (const widget of widgetList) {
      if (!widget.enable_structured_data) {
        disabledCount++;
        summaries.push({
          configId: widget.id,
          widgetId: widget.widget_id,
          widgetName: widget.name,
          widgetType: widget.widget_type,
          entityType: widget.entity_type,
          structuredDataEnabled: false,
          schemaType: widget.structured_data_type,
          status: "valid",
          errorCount: 0,
          warningCount: 0,
          lastValidated: new Date().toISOString(),
        });
        continue;
      }

      const schemaType =
        widget.structured_data_type ??
        resolveDefaultSchemaType(widget.entity_type);

      const cacheKey = `${widget.entity_type}:${widget.entity_id ?? "org"}`;
      const cached = entityCache.get(cacheKey);
      const entity = cached?.entity ?? { name: "Unknown" };
      const reviews = cached?.reviews ?? [];

      const jsonLd = generateStructuredData(schemaType, entity, reviews);
      const validation = validateStructuredData(jsonLd);
      const status = getValidationStatus(validation);

      if (status === "valid") validCount++;
      else if (status === "warnings") warningCount++;
      else errorCount++;

      summaries.push({
        configId: widget.id,
        widgetId: widget.widget_id,
        widgetName: widget.name,
        widgetType: widget.widget_type,
        entityType: widget.entity_type,
        structuredDataEnabled: true,
        schemaType,
        status,
        errorCount: validation.errors,
        warningCount: validation.warnings,
        lastValidated: new Date().toISOString(),
      });
    }

    return {
      success: true,
      data: {
        total: widgetList.length,
        valid: validCount,
        warnings: warningCount,
        errors: errorCount,
        disabled: disabledCount,
        widgets: summaries,
      },
    };
  } catch (err) {
    console.error("bulkValidateWidgets error:", err);
    return { success: false, error: "Failed to validate widgets" };
  }
}

/**
 * Export validation report as CSV string.
 */
export async function exportValidationCsv(): Promise<ActionResult<string>> {
  const result = await bulkValidateWidgets();
  if (!result.success) return result;

  const headers = [
    "Widget Name",
    "Widget ID",
    "Widget Type",
    "Entity Type",
    "Schema Type",
    "Structured Data Enabled",
    "Status",
    "Errors",
    "Warnings",
    "Last Validated",
  ];

  const rows = result.data.widgets.map((w) => [
    `"${w.widgetName.replace(/"/g, '""')}"`,
    w.widgetId,
    w.widgetType,
    w.entityType,
    w.schemaType ?? "",
    w.structuredDataEnabled ? "Yes" : "No",
    w.status,
    w.errorCount.toString(),
    w.warningCount.toString(),
    w.lastValidated,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  return { success: true, data: csv };
}

/** Escape HTML entities to prevent XSS in exported HTML. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Export validation report as a printable HTML document.
 * Opens in a new window for browser print-to-PDF.
 */
export async function exportValidationPdf(): Promise<ActionResult<string>> {
  const result = await bulkValidateWidgets();
  if (!result.success) return result;

  const { data: report } = result;
  const now = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const widgetRows = report.widgets
    .map(
      (w) =>
        `<tr>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(w.widgetName)}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(w.widgetType.replace(/_/g, " "))}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(w.schemaType ?? "—")}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb">${w.structuredDataEnabled ? "Yes" : "No"}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:${w.status === "errors" ? "#dc2626" : w.status === "warnings" ? "#d97706" : "#059669"}">${escapeHtml(w.status)}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb">${w.errorCount}E / ${w.warningCount}W</td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<title>SEO Validation Report - ${escapeHtml(now)}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#2f3e46;margin:40px;font-size:13px}
  h1{color:#2f3e46;font-size:22px;margin-bottom:4px}
  .subtitle{color:#6b7280;margin-bottom:24px}
  .summary{display:flex;gap:24px;margin-bottom:32px}
  .stat{padding:16px 20px;border:1px solid #e5e7eb;border-radius:8px;min-width:100px}
  .stat-label{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px}
  .stat-value{font-size:24px;font-weight:700;margin-top:4px}
  table{width:100%;border-collapse:collapse;margin-top:16px}
  th{text-align:left;padding:8px;border-bottom:2px solid #2f3e46;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280}
  @media print{body{margin:20px}}
</style>
</head>
<body>
<h1>SEO Validation Report</h1>
<p class="subtitle">Generated ${escapeHtml(now)}</p>
<div class="summary">
  <div class="stat"><div class="stat-label">Total</div><div class="stat-value">${report.total}</div></div>
  <div class="stat"><div class="stat-label">Valid</div><div class="stat-value" style="color:#059669">${report.valid}</div></div>
  <div class="stat"><div class="stat-label">Warnings</div><div class="stat-value" style="color:#d97706">${report.warnings}</div></div>
  <div class="stat"><div class="stat-label">Errors</div><div class="stat-value" style="color:#dc2626">${report.errors}</div></div>
  <div class="stat"><div class="stat-label">Disabled</div><div class="stat-value">${report.disabled}</div></div>
</div>
<table>
<thead><tr>
  <th>Widget</th><th>Type</th><th>Schema</th><th>Enabled</th><th>Status</th><th>Issues</th>
</tr></thead>
<tbody>${widgetRows}</tbody>
</table>
</body>
</html>`;

  return { success: true, data: html };
}

/**
 * Apply a quick fix to a widget's structured data configuration.
 * Supports updating the schema type on the widget_configs row.
 */
export async function applyQuickFix(
  configId: string,
  field: string,
  value: unknown
): Promise<ActionResult<WidgetSeoData>> {
  try {
    const orgResult = await getOrgId();
    if (!orgResult.success) return orgResult;

    const supabase = createAdminClient();

    // Map quick-fix fields to widget_configs columns
    const update: Record<string, unknown> = {};

    if (
      (field === "structured_data_type" || field === "@type") &&
      typeof value === "string"
    ) {
      update.structured_data_type = value;
    } else if (field === "enable_structured_data" && typeof value === "boolean") {
      update.enable_structured_data = value;
    }

    if (Object.keys(update).length > 0) {
      const { error } = await supabase
        .from("widget_configs")
        .update({ ...update, updated_at: new Date().toISOString() })
        .eq("id", configId)
        .eq("organization_id", orgResult.data);

      if (error) {
        return { success: false, error: error.message };
      }

      revalidatePath("/dashboard/widgets/seo");
    }

    // Re-fetch and re-validate after the fix
    return getWidgetSeoData(configId);
  } catch (err) {
    console.error("applyQuickFix error:", err);
    return { success: false, error: "Failed to apply fix" };
  }
}

/**
 * Check for validation alerts: recently changed widgets with errors.
 * Uses batched fetching to avoid N+1 queries.
 */
export async function getValidationAlerts(): Promise<
  ActionResult<ValidationAlert[]>
> {
  try {
    const orgResult = await getOrgId();
    if (!orgResult.success) return orgResult;

    const supabase = createAdminClient();

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: widgets, error } = await supabase
      .from("widget_configs")
      .select(
        "id, widget_id, name, widget_type, entity_type, entity_id, enable_structured_data, structured_data_type, organization_id, updated_at"
      )
      .eq("organization_id", orgResult.data)
      .eq("enable_structured_data", true)
      .is("parent_widget_id", null)
      .in("status", ["active", "draft"])
      .gte("updated_at", oneDayAgo)
      .order("updated_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const widgetList = widgets ?? [];
    if (widgetList.length === 0) {
      return { success: true, data: [] };
    }

    // Batch fetch entities and reviews
    const entityCache = await batchFetchEntitiesAndReviews(
      supabase,
      orgResult.data,
      widgetList
    );

    const alerts: ValidationAlert[] = [];

    for (const widget of widgetList) {
      const schemaType =
        widget.structured_data_type ??
        resolveDefaultSchemaType(widget.entity_type);

      const cacheKey = `${widget.entity_type}:${widget.entity_id ?? "org"}`;
      const cached = entityCache.get(cacheKey);
      const entity = cached?.entity ?? { name: "Unknown" };
      const reviews = cached?.reviews ?? [];

      const jsonLd = generateStructuredData(schemaType, entity, reviews);
      const validation = validateStructuredData(jsonLd);
      const status = getValidationStatus(validation);

      if (status === "errors") {
        alerts.push({
          configId: widget.id,
          widgetName: widget.name,
          widgetId: widget.widget_id,
          previousStatus: "unknown",
          currentStatus: status,
          newErrors: validation.errors,
          timestamp: widget.updated_at,
        });
      }
    }

    return { success: true, data: alerts };
  } catch (err) {
    console.error("getValidationAlerts error:", err);
    return { success: false, error: "Failed to check alerts" };
  }
}
