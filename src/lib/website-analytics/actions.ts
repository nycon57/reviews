"use server";

/**
 * Website Analytics Server Actions
 * Fetches and manages website analytics and SEO audit data
 */

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/reviews/types";
import type {
  WebsiteAnalyticsOverview,
  WebsiteSEOOverview,
  SEOAuditResult,
  AnalyticsPeriod,
  TrafficSourceBreakdown,
  DeviceBreakdown,
  GeographicEntry,
  PageAnalytics,
  SearchQueryData,
  DailyAnalytics,
  SEOIssue,
  SEORecommendation,
} from "./types";

/**
 * Get user context for analytics operations
 */
async function getUserContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return null;
  }

  return {
    userId: userData.id,
    organizationId: userData.organization_id,
    role: userData.role,
  };
}

/**
 * Get date range for analytics period
 */
function getDateRange(period: AnalyticsPeriod): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case "7d":
      start.setDate(end.getDate() - 7);
      break;
    case "30d":
      start.setDate(end.getDate() - 30);
      break;
    case "90d":
      start.setDate(end.getDate() - 90);
      break;
    case "12m":
      start.setMonth(end.getMonth() - 12);
      break;
  }

  return { start, end };
}

/**
 * Get website analytics overview
 */
export async function getWebsiteAnalytics(
  period: AnalyticsPeriod = "30d"
): Promise<ActionResult<WebsiteAnalyticsOverview>> {
  try {
    const context = await getUserContext();
    if (!context) {
      return { success: false, error: "Unauthorized" };
    }

    // Only managers and admins can view website analytics
    if (context.role !== "manager" && context.role !== "admin") {
      return { success: false, error: "Unauthorized - Manager or admin access required" };
    }

    const supabase = await createClient();
    const { start, end } = getDateRange(period);

    // Fetch analytics data for the period
    const { data: analyticsData, error } = await supabase
      .from("website_analytics")
      .select("*")
      .eq("organization_id", context.organizationId)
      .gte("date", start.toISOString().split("T")[0])
      .lte("date", end.toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching website analytics:", error);
      return { success: false, error: "Failed to fetch analytics" };
    }

    // Calculate aggregates
    const data = analyticsData || [];

    // Calculate totals
    const totalPageviews = data.reduce((sum, d) => sum + (d.pageviews || 0), 0);
    const totalUniqueVisitors = data.reduce((sum, d) => sum + (d.unique_visitors || 0), 0);
    const totalSessions = data.reduce((sum, d) => sum + (d.sessions || 0), 0);

    // Calculate averages
    const avgSessionDuration = data.length > 0
      ? data.reduce((sum, d) => sum + (d.avg_session_duration_seconds || 0), 0) / data.length
      : 0;
    const avgBounceRate = data.length > 0
      ? data.reduce((sum, d) => sum + (d.bounce_rate || 0), 0) / data.length
      : 0;

    // Aggregate traffic sources
    const trafficSources: TrafficSourceBreakdown = {
      organic: 0,
      direct: 0,
      referral: 0,
      social: 0,
      email: 0,
      paid: 0,
    };

    data.forEach((d) => {
      const sources = (d.traffic_sources as unknown as Record<string, number>) || {};
      Object.entries(sources).forEach(([key, value]) => {
        if (key in trafficSources) {
          trafficSources[key as keyof TrafficSourceBreakdown] += value;
        }
      });
    });

    // Aggregate device breakdown
    const deviceBreakdown: DeviceBreakdown = { desktop: 0, mobile: 0, tablet: 0 };
    data.forEach((d) => {
      const devices = (d.device_breakdown as unknown as Record<string, number>) || {};
      Object.entries(devices).forEach(([key, value]) => {
        if (key in deviceBreakdown) {
          deviceBreakdown[key as keyof DeviceBreakdown] += value;
        }
      });
    });

    // Aggregate geographic data
    const geoMap = new Map<string, number>();
    data.forEach((d) => {
      const geo = (d.geographic_data as unknown as Record<string, number>) || {};
      Object.entries(geo).forEach(([country, visitors]) => {
        geoMap.set(country, (geoMap.get(country) || 0) + visitors);
      });
    });
    const totalGeoVisitors = Array.from(geoMap.values()).reduce((a, b) => a + b, 0);
    const geographicData: GeographicEntry[] = Array.from(geoMap.entries())
      .map(([country, visitors]) => ({
        country,
        countryCode: country,
        visitors,
        percentage: totalGeoVisitors > 0 ? (visitors / totalGeoVisitors) * 100 : 0,
      }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 10);

    // Calculate top pages
    const pageMap = new Map<string, PageAnalytics>();
    data.forEach((d) => {
      const existing = pageMap.get(d.page_path) || {
        pagePath: d.page_path,
        pageTitle: d.page_title,
        pageviews: 0,
        uniqueVisitors: 0,
        sessions: 0,
        avgSessionDuration: 0,
        bounceRate: 0,
        exitRate: 0,
      };
      existing.pageviews += d.pageviews || 0;
      existing.uniqueVisitors += d.unique_visitors || 0;
      existing.sessions += d.sessions || 0;
      pageMap.set(d.page_path, existing);
    });
    const topPages = Array.from(pageMap.values())
      .sort((a, b) => b.pageviews - a.pageviews)
      .slice(0, 10);

    // Aggregate search queries
    const queryMap = new Map<string, SearchQueryData>();
    data.forEach((d) => {
      const queries = (d.search_queries as unknown as SearchQueryData[]) || [];
      queries.forEach((q) => {
        const existing = queryMap.get(q.query) || {
          query: q.query,
          impressions: 0,
          clicks: 0,
          ctr: 0,
          position: q.position || 0,
        };
        existing.impressions += q.impressions || 0;
        existing.clicks += q.clicks || 0;
        queryMap.set(q.query, existing);
      });
    });
    const topSearchQueries = Array.from(queryMap.values())
      .map((q) => ({
        ...q,
        ctr: q.impressions > 0 ? (q.clicks / q.impressions) * 100 : 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    // Calculate daily trend
    const dailyMap = new Map<string, DailyAnalytics>();
    data.forEach((d) => {
      const dateStr = d.date;
      const existing = dailyMap.get(dateStr) || {
        date: dateStr,
        pageviews: 0,
        uniqueVisitors: 0,
        sessions: 0,
        avgSessionDuration: 0,
        bounceRate: 0,
      };
      existing.pageviews += d.pageviews || 0;
      existing.uniqueVisitors += d.unique_visitors || 0;
      existing.sessions += d.sessions || 0;
      dailyMap.set(dateStr, existing);
    });
    const dailyTrend = Array.from(dailyMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate period comparison (compare to previous period)
    const previousStart = new Date(start);
    previousStart.setDate(previousStart.getDate() - (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const { data: previousData } = await supabase
      .from("website_analytics")
      .select("pageviews, unique_visitors, sessions, bounce_rate")
      .eq("organization_id", context.organizationId)
      .gte("date", previousStart.toISOString().split("T")[0])
      .lt("date", start.toISOString().split("T")[0]);

    const prevPageviews = (previousData || []).reduce((sum, d) => sum + (d.pageviews || 0), 0);
    const prevVisitors = (previousData || []).reduce((sum, d) => sum + (d.unique_visitors || 0), 0);
    const prevSessions = (previousData || []).reduce((sum, d) => sum + (d.sessions || 0), 0);
    const prevBounceRate = previousData && previousData.length > 0
      ? previousData.reduce((sum, d) => sum + (d.bounce_rate || 0), 0) / previousData.length
      : 0;

    const periodComparison = {
      pageviewsChange: prevPageviews > 0 ? ((totalPageviews - prevPageviews) / prevPageviews) * 100 : 0,
      visitorsChange: prevVisitors > 0 ? ((totalUniqueVisitors - prevVisitors) / prevVisitors) * 100 : 0,
      sessionsChange: prevSessions > 0 ? ((totalSessions - prevSessions) / prevSessions) * 100 : 0,
      bounceRateChange: avgBounceRate - prevBounceRate,
    };

    return {
      success: true,
      data: {
        totalPageviews,
        totalUniqueVisitors,
        totalSessions,
        avgSessionDuration: Math.round(avgSessionDuration),
        avgBounceRate: Math.round(avgBounceRate * 100) / 100,
        trafficSources,
        deviceBreakdown,
        geographicData,
        topPages,
        topSearchQueries,
        dailyTrend,
        periodComparison,
      },
    };
  } catch (err) {
    console.error("Error in getWebsiteAnalytics:", err);
    return { success: false, error: "Failed to fetch website analytics" };
  }
}

/**
 * Get website SEO overview
 */
export async function getWebsiteSEOOverview(): Promise<ActionResult<WebsiteSEOOverview>> {
  try {
    const context = await getUserContext();
    if (!context) {
      return { success: false, error: "Unauthorized" };
    }

    // Only managers and admins can view SEO data
    if (context.role !== "manager" && context.role !== "admin") {
      return { success: false, error: "Unauthorized - Manager or admin access required" };
    }

    const supabase = await createClient();

    // Fetch the latest audit for each page
    const { data: audits, error } = await supabase
      .from("website_seo_audits")
      .select("*")
      .eq("organization_id", context.organizationId)
      .order("audited_at", { ascending: false });

    if (error) {
      console.error("Error fetching SEO audits:", error);
      return { success: false, error: "Failed to fetch SEO audits" };
    }

    // Get unique pages (latest audit per page)
    const pageAuditMap = new Map<string, typeof audits[0]>();
    (audits || []).forEach((audit) => {
      if (!pageAuditMap.has(audit.page_url)) {
        pageAuditMap.set(audit.page_url, audit);
      }
    });

    const latestAudits = Array.from(pageAuditMap.values());

    if (latestAudits.length === 0) {
      return {
        success: true,
        data: {
          overallScore: 0,
          previousScore: null,
          scoreChange: null,
          avgTechnicalScore: 0,
          avgContentScore: 0,
          avgPerformanceScore: 0,
          avgMobileScore: 0,
          totalPagesAudited: 0,
          pagesWithErrors: 0,
          pagesWithWarnings: 0,
          pagesHealthy: 0,
          topIssues: [],
          topRecommendations: [],
          pageAudits: [],
          lastAuditedAt: null,
        },
      };
    }

    // Calculate averages
    const totalPagesAudited = latestAudits.length;
    const avgScore = latestAudits.reduce((sum, a) => sum + (a.seo_score || 0), 0) / totalPagesAudited;
    const avgTechnicalScore = latestAudits.reduce((sum, a) => sum + (a.technical_score || 0), 0) / totalPagesAudited;
    const avgContentScore = latestAudits.reduce((sum, a) => sum + (a.content_score || 0), 0) / totalPagesAudited;
    const avgPerformanceScore = latestAudits.reduce((sum, a) => sum + (a.performance_score || 0), 0) / totalPagesAudited;
    const avgMobileScore = latestAudits.reduce((sum, a) => sum + (a.mobile_score || 0), 0) / totalPagesAudited;

    // Count pages by status
    let pagesWithErrors = 0;
    let pagesWithWarnings = 0;
    let pagesHealthy = 0;

    latestAudits.forEach((audit) => {
      const issues = (audit.issues as unknown as SEOIssue[]) || [];
      const hasErrors = issues.some((i) => i.type === "error");
      const hasWarnings = issues.some((i) => i.type === "warning");

      if (hasErrors) {
        pagesWithErrors++;
      } else if (hasWarnings) {
        pagesWithWarnings++;
      } else {
        pagesHealthy++;
      }
    });

    // Aggregate all issues and recommendations
    const allIssues: SEOIssue[] = [];
    const allRecommendations: SEORecommendation[] = [];

    latestAudits.forEach((audit) => {
      const issues = (audit.issues as unknown as SEOIssue[]) || [];
      const recommendations = (audit.recommendations as unknown as SEORecommendation[]) || [];
      allIssues.push(...issues);
      allRecommendations.push(...recommendations);
    });

    // Sort and dedupe issues
    const issueMap = new Map<string, SEOIssue>();
    allIssues.forEach((issue) => {
      const key = `${issue.category}-${issue.title}`;
      if (!issueMap.has(key) || issue.type === "error") {
        issueMap.set(key, issue);
      }
    });
    const topIssues = Array.from(issueMap.values())
      .sort((a, b) => {
        const severityOrder = { error: 0, warning: 1, info: 2 };
        const impactOrder = { high: 0, medium: 1, low: 2 };
        if (severityOrder[a.type] !== severityOrder[b.type]) {
          return severityOrder[a.type] - severityOrder[b.type];
        }
        return impactOrder[a.impact] - impactOrder[b.impact];
      })
      .slice(0, 10);

    // Sort and dedupe recommendations
    const recMap = new Map<string, SEORecommendation>();
    allRecommendations.forEach((rec) => {
      const key = `${rec.category}-${rec.title}`;
      if (!recMap.has(key) || rec.priority === "high") {
        recMap.set(key, rec);
      }
    });
    const topRecommendations = Array.from(recMap.values())
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return b.estimatedImpact - a.estimatedImpact;
      })
      .slice(0, 10);

    // Map audits to result format
    const pageAudits: SEOAuditResult[] = latestAudits.map((audit) => ({
      id: audit.id,
      pageUrl: audit.page_url,
      pagePath: audit.page_path,
      pageTitle: audit.page_title,
      seoScore: audit.seo_score,
      previousScore: audit.previous_score,
      scoreChange: audit.score_change,
      technicalScore: audit.technical_score,
      contentScore: audit.content_score,
      performanceScore: audit.performance_score,
      mobileScore: audit.mobile_score,
      metaTags: {
        hasTitle: audit.has_meta_title ?? false,
        hasDescription: audit.has_meta_description ?? false,
        titleLength: audit.meta_title_length,
        descriptionLength: audit.meta_description_length,
        titleOptimal: (audit.meta_title_length || 0) >= 30 && (audit.meta_title_length || 0) <= 60,
        descriptionOptimal: (audit.meta_description_length || 0) >= 120 && (audit.meta_description_length || 0) <= 160,
        hasCanonical: audit.has_canonical_url ?? false,
        hasRobotsMeta: audit.has_robots_meta ?? false,
      },
      headers: {
        h1Count: audit.h1_count || 0,
        h2Count: audit.h2_count || 0,
        h3Count: audit.h3_count || 0,
        hierarchyValid: audit.headers_hierarchy_valid ?? true,
        issues: [],
      },
      images: {
        totalImages: audit.total_images || 0,
        imagesWithAlt: audit.images_with_alt || 0,
        imagesWithoutAlt: audit.images_without_alt || 0,
        altTextScore: (audit.total_images || 0) > 0
          ? ((audit.images_with_alt || 0) / (audit.total_images || 1)) * 100
          : 100,
      },
      links: {
        internalLinks: audit.internal_links_count || 0,
        externalLinks: audit.external_links_count || 0,
        brokenLinks: audit.broken_links_count || 0,
        healthScore: 100 - Math.min((audit.broken_links_count || 0) * 10, 100),
      },
      performance: {
        pageLoadTime: audit.page_load_time_ms,
        firstContentfulPaint: audit.first_contentful_paint_ms,
        largestContentfulPaint: audit.largest_contentful_paint_ms,
        cumulativeLayoutShift: audit.cumulative_layout_shift ?? null,
        totalBlockingTime: audit.total_blocking_time_ms,
        performanceScore: audit.performance_score,
      },
      mobileFriendliness: {
        isMobileFriendly: audit.is_mobile_friendly ?? true,
        viewportConfigured: audit.viewport_configured ?? true,
        fontSizeReadable: audit.font_size_readable ?? true,
        tapTargetsSized: audit.tap_targets_sized ?? true,
        score: audit.mobile_score,
      },
      structuredData: {
        hasStructuredData: audit.has_structured_data ?? false,
        types: audit.structured_data_types || [],
        isValid: audit.structured_data_valid ?? true,
        issues: [],
      },
      content: {
        wordCount: audit.word_count || 0,
        readingTimeMinutes: audit.reading_time_minutes || 0,
        contentFreshnessDays: audit.content_freshness_days,
      },
      issues: (audit.issues as unknown as SEOIssue[]) || [],
      recommendations: (audit.recommendations as unknown as SEORecommendation[]) || [],
      auditedAt: audit.audited_at,
    }));

    // Get the most recent audit date
    const lastAuditedAt = latestAudits.length > 0
      ? latestAudits.reduce((latest, audit) =>
          new Date(audit.audited_at) > new Date(latest.audited_at) ? audit : latest
        ).audited_at
      : null;

    return {
      success: true,
      data: {
        overallScore: Math.round(avgScore),
        previousScore: null,
        scoreChange: null,
        avgTechnicalScore: Math.round(avgTechnicalScore),
        avgContentScore: Math.round(avgContentScore),
        avgPerformanceScore: Math.round(avgPerformanceScore),
        avgMobileScore: Math.round(avgMobileScore),
        totalPagesAudited,
        pagesWithErrors,
        pagesWithWarnings,
        pagesHealthy,
        topIssues,
        topRecommendations,
        pageAudits,
        lastAuditedAt,
      },
    };
  } catch (err) {
    console.error("Error in getWebsiteSEOOverview:", err);
    return { success: false, error: "Failed to fetch SEO overview" };
  }
}

/**
 * Get SEO audit for a specific page
 */
export async function getPageSEOAudit(
  pageUrl: string
): Promise<ActionResult<SEOAuditResult | null>> {
  try {
    const context = await getUserContext();
    if (!context) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();

    const { data: audit, error } = await supabase
      .from("website_seo_audits")
      .select("*")
      .eq("organization_id", context.organizationId)
      .eq("page_url", pageUrl)
      .order("audited_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: true, data: null };
      }
      console.error("Error fetching page SEO audit:", error);
      return { success: false, error: "Failed to fetch page audit" };
    }

    return {
      success: true,
      data: {
        id: audit.id,
        pageUrl: audit.page_url,
        pagePath: audit.page_path,
        pageTitle: audit.page_title,
        seoScore: audit.seo_score,
        previousScore: audit.previous_score,
        scoreChange: audit.score_change,
        technicalScore: audit.technical_score,
        contentScore: audit.content_score,
        performanceScore: audit.performance_score,
        mobileScore: audit.mobile_score,
        metaTags: {
          hasTitle: audit.has_meta_title ?? false,
          hasDescription: audit.has_meta_description ?? false,
          titleLength: audit.meta_title_length,
          descriptionLength: audit.meta_description_length,
          titleOptimal: (audit.meta_title_length || 0) >= 30 && (audit.meta_title_length || 0) <= 60,
          descriptionOptimal: (audit.meta_description_length || 0) >= 120 && (audit.meta_description_length || 0) <= 160,
          hasCanonical: audit.has_canonical_url ?? false,
          hasRobotsMeta: audit.has_robots_meta ?? false,
        },
        headers: {
          h1Count: audit.h1_count || 0,
          h2Count: audit.h2_count || 0,
          h3Count: audit.h3_count || 0,
          hierarchyValid: audit.headers_hierarchy_valid ?? true,
          issues: [],
        },
        images: {
          totalImages: audit.total_images || 0,
          imagesWithAlt: audit.images_with_alt || 0,
          imagesWithoutAlt: audit.images_without_alt || 0,
          altTextScore: (audit.total_images || 0) > 0
            ? ((audit.images_with_alt || 0) / (audit.total_images || 1)) * 100
            : 100,
        },
        links: {
          internalLinks: audit.internal_links_count || 0,
          externalLinks: audit.external_links_count || 0,
          brokenLinks: audit.broken_links_count || 0,
          healthScore: 100 - Math.min((audit.broken_links_count || 0) * 10, 100),
        },
        performance: {
          pageLoadTime: audit.page_load_time_ms,
          firstContentfulPaint: audit.first_contentful_paint_ms,
          largestContentfulPaint: audit.largest_contentful_paint_ms,
          cumulativeLayoutShift: audit.cumulative_layout_shift ?? null,
          totalBlockingTime: audit.total_blocking_time_ms,
          performanceScore: audit.performance_score,
        },
        mobileFriendliness: {
          isMobileFriendly: audit.is_mobile_friendly ?? true,
          viewportConfigured: audit.viewport_configured ?? true,
          fontSizeReadable: audit.font_size_readable ?? true,
          tapTargetsSized: audit.tap_targets_sized ?? true,
          score: audit.mobile_score,
        },
        structuredData: {
          hasStructuredData: audit.has_structured_data ?? false,
          types: audit.structured_data_types || [],
          isValid: audit.structured_data_valid ?? true,
          issues: [],
        },
        content: {
          wordCount: audit.word_count || 0,
          readingTimeMinutes: audit.reading_time_minutes || 0,
          contentFreshnessDays: audit.content_freshness_days,
        },
        issues: (audit.issues as unknown as SEOIssue[]) || [],
        recommendations: (audit.recommendations as unknown as SEORecommendation[]) || [],
        auditedAt: audit.audited_at,
      },
    };
  } catch (err) {
    console.error("Error in getPageSEOAudit:", err);
    return { success: false, error: "Failed to fetch page audit" };
  }
}

/**
 * Record analytics data (for internal tracking)
 */
export async function recordAnalytics(data: {
  pagePath: string;
  pageTitle?: string;
  sessionId: string;
  visitorId: string;
  trafficSource?: string;
  deviceType?: string;
  country?: string;
}): Promise<ActionResult<void>> {
  try {
    const context = await getUserContext();
    if (!context) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    // Check if record exists for today + page
    const { data: existing } = await supabase
      .from("website_analytics")
      .select("id, pageviews, unique_visitors, sessions, traffic_sources, device_breakdown, geographic_data")
      .eq("organization_id", context.organizationId)
      .eq("date", today)
      .eq("page_path", data.pagePath)
      .single();

    if (existing) {
      // Update existing record
      const trafficSources = (existing.traffic_sources || {}) as unknown as Record<string, number>;
      const deviceBreakdown = (existing.device_breakdown || {}) as unknown as Record<string, number>;
      const geographicData = (existing.geographic_data || {}) as unknown as Record<string, number>;

      if (data.trafficSource) {
        trafficSources[data.trafficSource] = (trafficSources[data.trafficSource] || 0) + 1;
      }
      if (data.deviceType) {
        deviceBreakdown[data.deviceType] = (deviceBreakdown[data.deviceType] || 0) + 1;
      }
      if (data.country) {
        geographicData[data.country] = (geographicData[data.country] || 0) + 1;
      }

      await supabase
        .from("website_analytics")
        .update({
          pageviews: (existing.pageviews || 0) + 1,
          traffic_sources: trafficSources,
          device_breakdown: deviceBreakdown,
          geographic_data: geographicData,
        })
        .eq("id", existing.id);
    } else {
      // Create new record
      const trafficSources: Record<string, number> = {};
      const deviceBreakdown: Record<string, number> = {};
      const geographicData: Record<string, number> = {};

      if (data.trafficSource) {
        trafficSources[data.trafficSource] = 1;
      }
      if (data.deviceType) {
        deviceBreakdown[data.deviceType] = 1;
      }
      if (data.country) {
        geographicData[data.country] = 1;
      }

      await supabase.from("website_analytics").insert({
        organization_id: context.organizationId,
        date: today,
        page_path: data.pagePath,
        page_title: data.pageTitle,
        pageviews: 1,
        unique_visitors: 1,
        sessions: 1,
        traffic_sources: trafficSources,
        device_breakdown: deviceBreakdown,
        geographic_data: geographicData,
      });
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error("Error in recordAnalytics:", err);
    return { success: false, error: "Failed to record analytics" };
  }
}
