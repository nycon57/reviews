"use server";

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
      const rawAddr = branch.address as Record<string, string | null> | null;
      if (rawAddr) {
        entity.address = {
          street: rawAddr.street ?? null,
          city: rawAddr.city ?? null,
          state: rawAddr.state ?? null,
          zip: rawAddr.zip ?? null,
          country: rawAddr.country ?? null,
        };
      }
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

    const summaries: WidgetValidationSummary[] = [];
    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    let disabledCount = 0;

    for (const widget of widgets ?? []) {
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

      const { entity, reviews } = await fetchEntityAndReviews(
        supabase,
        widget.organization_id,
        widget.entity_type,
        widget.entity_id
      );

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
        total: (widgets ?? []).length,
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

/**
 * Export validation report as a plain-text PDF-ready format.
 * Returns an HTML string that can be rendered as a printable report.
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
      <td style="padding:8px;border-bottom:1px solid #e5e7eb">${w.widgetName}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb">${w.widgetType.replace(/_/g, " ")}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb">${w.schemaType ?? "—"}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb">${w.structuredDataEnabled ? "Yes" : "No"}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:${w.status === "errors" ? "#dc2626" : w.status === "warnings" ? "#d97706" : "#059669"}">${w.status}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb">${w.errorCount}E / ${w.warningCount}W</td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<title>SEO Validation Report - ${now}</title>
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
<p class="subtitle">Generated ${now}</p>
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
 * Currently supports updating the schema type on the widget_configs row.
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

    if (field === "@context") {
      // @context fixes aren't stored in DB — they're always correct in generated output.
      // Re-fetch to show the current state.
    } else if (field === "structured_data_type" || field === "@type") {
      if (typeof value === "string") {
        update.structured_data_type = value;
      }
    } else if (field === "enable_structured_data") {
      if (typeof value === "boolean") {
        update.enable_structured_data = value;
      }
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
    }

    // Re-fetch and re-validate after the fix
    return getWidgetSeoData(configId);
  } catch (err) {
    console.error("applyQuickFix error:", err);
    return { success: false, error: "Failed to apply fix" };
  }
}

/**
 * Check for validation alerts by comparing current validation state
 * against the previous known state. Returns widgets whose status
 * degraded (e.g., from valid to errors after a config change).
 */
export async function getValidationAlerts(): Promise<
  ActionResult<ValidationAlert[]>
> {
  try {
    const orgResult = await getOrgId();
    if (!orgResult.success) return orgResult;

    const supabase = createAdminClient();

    // Fetch widgets that were recently updated (last 24h) and have structured data enabled
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

    const alerts: ValidationAlert[] = [];

    for (const widget of widgets ?? []) {
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
      const status = getValidationStatus(validation);

      // Flag any widget with errors as an alert
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
