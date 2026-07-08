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
  getUserAnalytics,
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

const ANALYTICS_CHUNK_SIZE = 5;

export interface GenerateReportForOrgParams {
  organizationId: string;
  templateId: string;
  dateRange: ReportDateRange;
  filters?: ReportFilters;
}

type ReportingUserContext = {
  userId: string;
  organizationId: string;
  role: string | null;
};

async function mapInChunks<T, R>(
  items: T[],
  chunkSize: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map((item, chunkIndex) => mapper(item, i + chunkIndex))
    );
    results.push(...chunkResults);
  }

  return results;
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Get user context for report operations
 */
async function getUserContext(): Promise<ReportingUserContext | null> {
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

function getManageReportsError(context: ReportingUserContext): string | null {
  if (context.role !== "manager" && context.role !== "admin") {
    return "Only managers and admins can generate reports";
  }

  return null;
}

async function getReportTemplateForOrg(
  organizationId: string,
  templateId: string
): Promise<ActionResult<ReportTemplate>> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("report_templates")
    .select("*")
    .eq("id", templateId)
    .eq("organization_id", organizationId)
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
 * Get a report template by ID
 */
export async function getReportTemplate(
  templateId: string
): Promise<ActionResult<ReportTemplate>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  return getReportTemplateForOrg(context.organizationId, templateId);
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
  filters: ReportFilters | undefined,
  organizationId: string
): Promise<ExecutiveSummary> {
  const analyticsContext = { organizationId };

  const [nps, csat, responseRate, velocity] = await Promise.all([
    getNPSMetrics(filters?.userIds?.[0], dateRange, analyticsContext),
    getCSATMetrics(filters?.userIds?.[0], dateRange, analyticsContext),
    getResponseRateMetrics(filters?.userIds?.[0], dateRange, analyticsContext),
    getReviewVelocityMetrics(filters?.userIds?.[0], dateRange, analyticsContext),
  ]);

  const periodLabel = `${format(dateRange.start, "MMM d, yyyy")} - ${format(dateRange.end, "MMM d, yyyy")}`;

  // Calculate previous period for comparison
  const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
  const previousRange: DateRange = {
    start: subDays(dateRange.start, daysDiff),
    end: subDays(dateRange.end, daysDiff),
  };

  const [prevNps, prevCsat, prevVelocity] = await Promise.all([
    getNPSMetrics(filters?.userIds?.[0], previousRange, analyticsContext),
    getCSATMetrics(filters?.userIds?.[0], previousRange, analyticsContext),
    getReviewVelocityMetrics(filters?.userIds?.[0], previousRange, analyticsContext),
  ]);

  const currentReviews = velocity.data?.totalReviews || 0;
  const previousReviews = prevVelocity.data?.totalReviews || 0;

  return {
    periodLabel,
    totalReviews: currentReviews,
    averageRating: csat.data?.averageRating || 0,
    npsScore: nps.data?.score || 0,
    csatScore: csat.data?.score || 0,
    responseRate: responseRate.data?.rate || 0,
    reviewVelocity: velocity.data?.reviewsPerMonth || 0,
    comparisonPeriod: {
      totalReviews: previousReviews,
      averageRating: prevCsat.data?.averageRating || 0,
      npsScore: prevNps.data?.score || 0,
      csatScore: prevCsat.data?.score || 0,
      reviewsChange: currentReviews - previousReviews,
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
  organizationId: string
): Promise<TeamComparisonRow[]> {
  const supabase = createAdminClient();
  const analyticsContext = { organizationId };

  // Get all active users
  const { data: users } = await supabase
    .from("users")
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

  if (!users || users.length === 0) {
    return [];
  }

  return mapInChunks(users, ANALYTICS_CHUNK_SIZE, async (user, index) => {
    const analyticsResult = await getUserAnalytics(user.id, "monthly", analyticsContext);
    const analytics = analyticsResult.data;

    return {
      userId: user.id,
      name: user.full_name || "Unknown",
      photoUrl: user.photo_url,
      branch: user.branch,
      totalReviews: user.total_reviews || 0,
      averageRating: user.average_rating || 0,
      npsScore: analytics?.nps?.score || user.nps_score || 0,
      csatScore: analytics?.csat?.score || 0,
      responseRate: analytics?.responseRate?.rate || 0,
      reputationScore: user.reputation_score || 0,
      performanceStatus: analytics?.performanceStatus || "good",
      rank: index + 1,
    };
  });
}

/**
 * Generate a complete report for a trusted organization context.
 */
export async function generateReportForOrg({
  organizationId,
  templateId,
  dateRange,
  filters,
}: GenerateReportForOrgParams
): Promise<ActionResult<GeneratedReport>> {
  // Get template
  const templateResult = await getReportTemplateForOrg(organizationId, templateId);
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
  const executiveSummary = await generateExecutiveSummary(
    analyticsDateRange,
    filters,
    organizationId
  );

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

  const analyticsContext = { organizationId };

  // Add sections based on config
  if (config.sections.includes("nps_breakdown")) {
    const npsResult = await getNPSMetrics(filters?.userIds?.[0], analyticsDateRange, analyticsContext);
    if (npsResult.success) {
      reportData.npsBreakdown = npsResult.data;
    }
  }

  if (config.sections.includes("csat_analysis")) {
    const csatResult = await getCSATMetrics(filters?.userIds?.[0], analyticsDateRange, analyticsContext);
    if (csatResult.success) {
      reportData.csatMetrics = csatResult.data;
    }
  }

  if (config.sections.includes("response_rates")) {
    const responseResult = await getResponseRateMetrics(
      filters?.userIds?.[0],
      analyticsDateRange,
      analyticsContext
    );
    if (responseResult.success) {
      reportData.responseRateMetrics = responseResult.data;
    }
  }

  if (config.sections.includes("review_velocity")) {
    const velocityResult = await getReviewVelocityMetrics(
      filters?.userIds?.[0],
      analyticsDateRange,
      analyticsContext
    );
    if (velocityResult.success) {
      reportData.reviewVelocityMetrics = velocityResult.data;
    }
  }

  if (config.sections.includes("team_comparison")) {
    const teamComparison = await generateTeamComparison(organizationId);
    reportData.teamComparison = teamComparison;
  }

  if (config.sections.includes("top_performers") || config.sections.includes("needs_attention")) {
    const orgResult = await getOrganizationAnalytics("monthly", analyticsContext);
    if (orgResult.success && orgResult.data) {
      if (config.sections.includes("top_performers") && orgResult.data.topPerformers) {
        const topPerformerData = await mapInChunks(
          orgResult.data.topPerformers.slice(0, 5),
          ANALYTICS_CHUNK_SIZE,
          async (userId) => {
            const userResult = await getUserAnalytics(userId, "monthly", analyticsContext);
            if (userResult.success && userResult.data) {
              return userResult.data;
            }
            return null;
          }
        );
        reportData.topPerformers = topPerformerData.filter(isPresent);
      }

      if (config.sections.includes("needs_attention") && orgResult.data.needsAttention) {
        const needsAttentionData = await mapInChunks(
          orgResult.data.needsAttention.slice(0, 5),
          ANALYTICS_CHUNK_SIZE,
          async (userId) => {
            const userResult = await getUserAnalytics(userId, "monthly", analyticsContext);
            if (userResult.success && userResult.data) {
              return userResult.data;
            }
            return null;
          }
        );
        reportData.needsAttention = needsAttentionData.filter(isPresent);
      }
    }
  }

  // Add trends if configured
  if (config.showTrends) {
    const [npsTrend, csatTrend, reviewsTrend] = await Promise.all([
      getNPSTrendData(filters?.userIds?.[0], 6, analyticsContext),
      getCSATTrendData(filters?.userIds?.[0], 6, analyticsContext),
      getReviewVelocityTrendData(filters?.userIds?.[0], 6, analyticsContext),
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
 * Generate a complete report for the signed-in manager/admin.
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

  const roleError = getManageReportsError(context);
  if (roleError) return { success: false, error: roleError };

  return generateReportForOrg({
    organizationId: context.organizationId,
    templateId,
    dateRange,
    filters,
  });
}

/**
 * Initialize default templates for an organization
 */
export async function initializeDefaultTemplates(options?: {
  skipExistingCheck?: boolean;
}): Promise<ActionResult<void>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();

  if (!options?.skipExistingCheck) {
    const { data: existing } = await supabase
      .from("report_templates")
      .select("id")
      .eq("organization_id", context.organizationId)
      .eq("is_default", true)
      .limit(1);

    if (existing && existing.length > 0) {
      return { success: true, data: undefined };
    }
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
