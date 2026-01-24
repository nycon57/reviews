"use server";

/**
 * Report Generation Engine
 * Generates comprehensive report data using the analytics engine
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import {
  getNPSMetrics,
  getCSATMetrics,
  getResponseRateMetrics,
  getReviewVelocityMetrics,
  getLoanOfficerAnalytics,
  getOrganizationAnalytics,
  getNPSTrendData,
  getCSATTrendData,
  getReviewVelocityTrendData,
} from "@/lib/analytics/engine";
import type { DateRange } from "@/lib/analytics/types";
import type { ActionResult } from "@/lib/reviews/types";
import type { Json } from "@/types/database.types";
import type {
  ReportDateRange,
  ReportFilters,
  ReportTemplate,
  ReportTemplateType,
  ReportTemplateConfig,
  GeneratedReport,
  ExecutiveSummary,
  TeamComparisonRow,
} from "./types";
import { format, subDays } from "date-fns";

/**
 * Get user context for report operations
 */
async function getUserContext() {
  const user = await unifiedGetUser();
  if (!user) {
    return null;
  }

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData) {
    return null;
  }

  return {
    userId: userData.id,
    organizationId: userData.organization_id!,
    role: userData.role,
  };
}

/**
 * Get a report template by ID
 */
export async function getReportTemplate(
  templateId: string
): Promise<ActionResult<ReportTemplate>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("report_templates")
    .select("*")
    .eq("id", templateId)
    .eq("organization_id", context.organizationId)
    .single();

  if (error) {
    console.error("Error fetching template:", error);
    return { success: false, error: "Template not found" };
  }

  return {
    success: true,
    data: {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      description: data.description,
      templateType: data.template_type as ReportTemplateType,
      config: data.config as unknown as ReportTemplateConfig,
      isDefault: data.is_default ?? false,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at!),
      updatedAt: new Date(data.updated_at!),
    },
  };
}

/**
 * Get all report templates for the organization
 */
export async function getReportTemplates(): Promise<ActionResult<ReportTemplate[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("report_templates")
    .select("*")
    .eq("organization_id", context.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching templates:", error);
    return { success: false, error: "Failed to fetch templates" };
  }

  const templates = (data || []).map((d) => ({
    id: d.id,
    organizationId: d.organization_id,
    name: d.name,
    description: d.description,
    templateType: d.template_type as ReportTemplateType,
    config: d.config as unknown as ReportTemplateConfig,
    isDefault: d.is_default ?? false,
    createdBy: d.created_by,
    createdAt: new Date(d.created_at!),
    updatedAt: new Date(d.updated_at!),
  }));

  return { success: true, data: templates };
}

/**
 * Generate executive summary data
 */
async function generateExecutiveSummary(
  dateRange: DateRange,
  filters?: ReportFilters
): Promise<ExecutiveSummary> {
  const [nps, csat, responseRate, velocity] = await Promise.all([
    getNPSMetrics(filters?.loanOfficerIds?.[0], dateRange),
    getCSATMetrics(filters?.loanOfficerIds?.[0], dateRange),
    getResponseRateMetrics(filters?.loanOfficerIds?.[0], dateRange),
    getReviewVelocityMetrics(filters?.loanOfficerIds?.[0], dateRange),
  ]);

  const periodLabel = `${format(dateRange.start, "MMM d, yyyy")} - ${format(dateRange.end, "MMM d, yyyy")}`;

  // Calculate previous period for comparison
  const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
  const previousRange: DateRange = {
    start: subDays(dateRange.start, daysDiff),
    end: subDays(dateRange.end, daysDiff),
  };

  const [prevNps, prevCsat] = await Promise.all([
    getNPSMetrics(filters?.loanOfficerIds?.[0], previousRange),
    getCSATMetrics(filters?.loanOfficerIds?.[0], previousRange),
  ]);

  return {
    periodLabel,
    totalReviews: velocity.data?.totalReviews || 0,
    averageRating: csat.data?.averageRating || 0,
    npsScore: nps.data?.score || 0,
    csatScore: csat.data?.score || 0,
    responseRate: responseRate.data?.rate || 0,
    reviewVelocity: velocity.data?.reviewsPerMonth || 0,
    comparisonPeriod: {
      totalReviews: 0, // Would need previous period data
      averageRating: prevCsat.data?.averageRating || 0,
      npsScore: prevNps.data?.score || 0,
      csatScore: prevCsat.data?.score || 0,
      reviewsChange: 0,
      ratingChange: (csat.data?.averageRating || 0) - (prevCsat.data?.averageRating || 0),
      npsChange: (nps.data?.score || 0) - (prevNps.data?.score || 0),
      csatChange: (csat.data?.score || 0) - (prevCsat.data?.score || 0),
    },
  };
}

/**
 * Generate team comparison data
 */
async function generateTeamComparison(
  dateRange: DateRange,
  organizationId: string
): Promise<TeamComparisonRow[]> {
  const supabase = createAdminClient();

  // Get all active loan officers
  const { data: loanOfficers } = await supabase
    .from("loan_officers")
    .select(`
      id,
      full_name,
      photo_url,
      branch,
      average_rating,
      total_reviews,
      nps_score,
      reputation_score
    `)
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("reputation_score", { ascending: false });

  if (!loanOfficers || loanOfficers.length === 0) {
    return [];
  }

  const comparisonData: TeamComparisonRow[] = [];

  for (let i = 0; i < loanOfficers.length; i++) {
    const lo = loanOfficers[i];
    const analyticsResult = await getLoanOfficerAnalytics(lo.id, "monthly");
    const analytics = analyticsResult.data;

    comparisonData.push({
      loanOfficerId: lo.id,
      name: lo.full_name,
      photoUrl: lo.photo_url,
      branch: lo.branch,
      totalReviews: lo.total_reviews || 0,
      averageRating: lo.average_rating || 0,
      npsScore: analytics?.nps?.score || lo.nps_score || 0,
      csatScore: analytics?.csat?.score || 0,
      responseRate: analytics?.responseRate?.rate || 0,
      reputationScore: lo.reputation_score || 0,
      performanceStatus: analytics?.performanceStatus || "good",
      rank: i + 1,
    });
  }

  return comparisonData;
}

/**
 * Generate a complete report
 */
export async function generateReport(
  templateId: string,
  dateRange: ReportDateRange,
  filters?: ReportFilters
): Promise<ActionResult<GeneratedReport>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  // Get template
  const templateResult = await getReportTemplate(templateId);
  if (!templateResult.success || !templateResult.data) {
    return { success: false, error: "Template not found" };
  }

  const template = templateResult.data;
  const config = template.config;

  const analyticsDateRange: DateRange = {
    start: dateRange.start,
    end: dateRange.end,
  };

  // Generate executive summary
  const executiveSummary = await generateExecutiveSummary(analyticsDateRange, filters);

  // Build report data based on configured sections
  const reportData: GeneratedReport = {
    templateId: template.id,
    templateName: template.name,
    templateType: template.templateType,
    dateRange,
    filters: filters || {},
    generatedAt: new Date(),
    executiveSummary,
  };

  // Add sections based on config
  if (config.sections.includes("nps_breakdown")) {
    const npsResult = await getNPSMetrics(filters?.loanOfficerIds?.[0], analyticsDateRange);
    if (npsResult.success) {
      reportData.npsBreakdown = npsResult.data;
    }
  }

  if (config.sections.includes("csat_analysis")) {
    const csatResult = await getCSATMetrics(filters?.loanOfficerIds?.[0], analyticsDateRange);
    if (csatResult.success) {
      reportData.csatMetrics = csatResult.data;
    }
  }

  if (config.sections.includes("response_rates")) {
    const responseResult = await getResponseRateMetrics(filters?.loanOfficerIds?.[0], analyticsDateRange);
    if (responseResult.success) {
      reportData.responseRateMetrics = responseResult.data;
    }
  }

  if (config.sections.includes("review_velocity")) {
    const velocityResult = await getReviewVelocityMetrics(filters?.loanOfficerIds?.[0], analyticsDateRange);
    if (velocityResult.success) {
      reportData.reviewVelocityMetrics = velocityResult.data;
    }
  }

  if (config.sections.includes("team_comparison")) {
    const teamComparison = await generateTeamComparison(analyticsDateRange, context.organizationId);
    reportData.teamComparison = teamComparison;
  }

  if (config.sections.includes("top_performers") || config.sections.includes("needs_attention")) {
    const orgResult = await getOrganizationAnalytics("monthly");
    if (orgResult.success && orgResult.data) {
      if (config.sections.includes("top_performers") && orgResult.data.topPerformers) {
        const topPerformerData = [];
        for (const loId of orgResult.data.topPerformers.slice(0, 5)) {
          const loResult = await getLoanOfficerAnalytics(loId, "monthly");
          if (loResult.success && loResult.data) {
            topPerformerData.push(loResult.data);
          }
        }
        reportData.topPerformers = topPerformerData;
      }

      if (config.sections.includes("needs_attention") && orgResult.data.needsAttention) {
        const needsAttentionData = [];
        for (const loId of orgResult.data.needsAttention.slice(0, 5)) {
          const loResult = await getLoanOfficerAnalytics(loId, "monthly");
          if (loResult.success && loResult.data) {
            needsAttentionData.push(loResult.data);
          }
        }
        reportData.needsAttention = needsAttentionData;
      }
    }
  }

  // Add trends if configured
  if (config.showTrends) {
    const [npsTrend, csatTrend, reviewsTrend] = await Promise.all([
      getNPSTrendData(filters?.loanOfficerIds?.[0], 6),
      getCSATTrendData(filters?.loanOfficerIds?.[0], 6),
      getReviewVelocityTrendData(filters?.loanOfficerIds?.[0], 6),
    ]);

    reportData.trends = {
      nps: npsTrend.data?.map(p => ({ date: p.date, value: p.value })) || [],
      csat: csatTrend.data?.map(p => ({ date: p.date, value: p.value })) || [],
      reviews: reviewsTrend.data?.map(p => ({ date: p.date, value: p.value })) || [],
    };
  }

  return { success: true, data: reportData };
}

/**
 * Create a new report template
 */
export async function createReportTemplate(
  name: string,
  description: string | undefined,
  templateType: "monthly_performance" | "team_summary" | "custom",
  config: unknown
): Promise<ActionResult<ReportTemplate>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  if (context.role !== "manager" && context.role !== "admin") {
    return { success: false, error: "Only managers and admins can create templates" };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("report_templates")
    .insert({
      organization_id: context.organizationId,
      name,
      description,
      template_type: templateType,
      config: config as Json,
      is_default: false,
      created_by: context.userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating template:", error);
    return { success: false, error: "Failed to create template" };
  }

  return {
    success: true,
    data: {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      description: data.description,
      templateType: data.template_type as ReportTemplateType,
      config: data.config as unknown as ReportTemplateConfig,
      isDefault: data.is_default ?? false,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at!),
      updatedAt: new Date(data.updated_at!),
    },
  };
}

/**
 * Initialize default templates for an organization
 */
export async function initializeDefaultTemplates(): Promise<ActionResult<void>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();

  // Check if templates already exist
  const { data: existing } = await supabase
    .from("report_templates")
    .select("id")
    .eq("organization_id", context.organizationId)
    .eq("is_default", true)
    .limit(1);

  if (existing && existing.length > 0) {
    return { success: true, data: undefined };
  }

  // Import default templates
  const { DEFAULT_TEMPLATES } = await import("./templates");

  // Insert default templates
  const { error } = await supabase.from("report_templates").insert(
    DEFAULT_TEMPLATES.map((t) => ({
      organization_id: context.organizationId,
      name: t.name,
      description: t.description,
      template_type: t.templateType,
      config: t.config as unknown as Json,
      is_default: t.isDefault,
      created_by: context.userId,
    }))
  );

  if (error) {
    console.error("Error creating default templates:", error);
    return { success: false, error: "Failed to create default templates" };
  }

  return { success: true, data: undefined };
}
