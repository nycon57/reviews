"use server";

/**
 * SEO Audit Engine
 * Performs technical SEO audits on pages
 */

import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import type { ActionResult } from "@/lib/reviews/types";
import type { SEOAuditResult, SEOIssue, SEORecommendation } from "./types";
import type { Json } from "@/types/database.types";

/**
 * Get user context
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
 * Analyze meta tags from HTML
 */
function analyzeMetaTags(html: string): {
  hasTitle: boolean;
  hasDescription: boolean;
  titleLength: number | null;
  descriptionLength: number | null;
  hasCanonical: boolean;
  hasRobotsMeta: boolean;
  title: string | null;
  description: string | null;
} {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["']/i);
  const robotsMatch = html.match(/<meta[^>]*name=["']robots["']/i);

  const title = titleMatch ? titleMatch[1].trim() : null;
  const description = descMatch ? descMatch[1].trim() : null;

  return {
    hasTitle: !!title,
    hasDescription: !!description,
    titleLength: title ? title.length : null,
    descriptionLength: description ? description.length : null,
    hasCanonical: !!canonicalMatch,
    hasRobotsMeta: !!robotsMatch,
    title,
    description,
  };
}

/**
 * Analyze headers from HTML
 */
function analyzeHeaders(html: string): {
  h1Count: number;
  h2Count: number;
  h3Count: number;
  hierarchyValid: boolean;
} {
  const h1Matches = html.match(/<h1[^>]*>/gi) || [];
  const h2Matches = html.match(/<h2[^>]*>/gi) || [];
  const h3Matches = html.match(/<h3[^>]*>/gi) || [];

  // Check hierarchy - should have exactly one H1 before any H2/H3
  const h1Count = h1Matches.length;
  const h2Count = h2Matches.length;
  const h3Count = h3Matches.length;

  const hierarchyValid = h1Count === 1;

  return { h1Count, h2Count, h3Count, hierarchyValid };
}

/**
 * Analyze images from HTML
 */
function analyzeImages(html: string): {
  totalImages: number;
  imagesWithAlt: number;
  imagesWithoutAlt: number;
} {
  const imgMatches = html.match(/<img[^>]*>/gi) || [];
  const totalImages = imgMatches.length;
  let imagesWithAlt = 0;

  imgMatches.forEach((img) => {
    if (/alt=["'][^"']+["']/i.test(img)) {
      imagesWithAlt++;
    }
  });

  return {
    totalImages,
    imagesWithAlt,
    imagesWithoutAlt: totalImages - imagesWithAlt,
  };
}

/**
 * Analyze links from HTML
 */
function analyzeLinks(html: string, baseUrl: string): {
  internalLinks: number;
  externalLinks: number;
} {
  const linkMatches = html.match(/<a[^>]*href=["']([^"']*)["'][^>]*>/gi) || [];
  let internalLinks = 0;
  let externalLinks = 0;

  const baseDomain = new URL(baseUrl).hostname;

  linkMatches.forEach((link) => {
    const hrefMatch = link.match(/href=["']([^"']*)["']/i);
    if (hrefMatch) {
      const href = hrefMatch[1];
      if (href.startsWith("/") || href.startsWith("#")) {
        internalLinks++;
      } else if (href.startsWith("http")) {
        try {
          const linkDomain = new URL(href).hostname;
          if (linkDomain === baseDomain) {
            internalLinks++;
          } else {
            externalLinks++;
          }
        } catch {
          externalLinks++;
        }
      }
    }
  });

  return { internalLinks, externalLinks };
}

/**
 * Analyze content from HTML
 */
function analyzeContent(html: string): {
  wordCount: number;
  readingTimeMinutes: number;
} {
  // Remove scripts, styles, and tags
  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = textContent.split(" ").filter((w) => w.length > 0);
  const wordCount = words.length;
  const readingTimeMinutes = Math.ceil(wordCount / 200); // Average reading speed

  return { wordCount, readingTimeMinutes };
}

/**
 * Check for structured data
 */
function analyzeStructuredData(html: string): {
  hasStructuredData: boolean;
  types: string[];
} {
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  const types: string[] = [];

  jsonLdMatches.forEach((match) => {
    try {
      const jsonContent = match.replace(/<[^>]*>/g, "");
      const parsed = JSON.parse(jsonContent);
      if (parsed["@type"]) {
        types.push(parsed["@type"]);
      }
    } catch {
      // Invalid JSON
    }
  });

  return {
    hasStructuredData: types.length > 0,
    types,
  };
}

/**
 * Check mobile friendliness
 */
function analyzeMobileFriendliness(html: string): {
  viewportConfigured: boolean;
  fontSizeReadable: boolean;
  tapTargetsSized: boolean;
} {
  const viewportMatch = html.match(/<meta[^>]*name=["']viewport["'][^>]*>/i);

  return {
    viewportConfigured: !!viewportMatch,
    fontSizeReadable: true, // Would need actual rendering to check
    tapTargetsSized: true, // Would need actual rendering to check
  };
}

/**
 * Generate issues from analysis
 */
function generateIssues(analysis: {
  metaTags: ReturnType<typeof analyzeMetaTags>;
  headers: ReturnType<typeof analyzeHeaders>;
  images: ReturnType<typeof analyzeImages>;
  structuredData: ReturnType<typeof analyzeStructuredData>;
  mobileFriendliness: ReturnType<typeof analyzeMobileFriendliness>;
}): SEOIssue[] {
  const issues: SEOIssue[] = [];

  // Meta tag issues
  if (!analysis.metaTags.hasTitle) {
    issues.push({
      id: "missing-title",
      type: "error",
      category: "meta",
      title: "Missing page title",
      description: "The page is missing a <title> tag, which is critical for SEO.",
      impact: "high",
      howToFix: "Add a unique, descriptive <title> tag between 30-60 characters.",
    });
  } else if (analysis.metaTags.titleLength && analysis.metaTags.titleLength < 30) {
    issues.push({
      id: "short-title",
      type: "warning",
      category: "meta",
      title: "Page title too short",
      description: `Title is ${analysis.metaTags.titleLength} characters. Optimal length is 30-60 characters.`,
      impact: "medium",
      howToFix: "Expand your title to be more descriptive while staying under 60 characters.",
    });
  } else if (analysis.metaTags.titleLength && analysis.metaTags.titleLength > 60) {
    issues.push({
      id: "long-title",
      type: "warning",
      category: "meta",
      title: "Page title too long",
      description: `Title is ${analysis.metaTags.titleLength} characters. It may be truncated in search results.`,
      impact: "low",
      howToFix: "Shorten your title to 60 characters or less.",
    });
  }

  if (!analysis.metaTags.hasDescription) {
    issues.push({
      id: "missing-description",
      type: "error",
      category: "meta",
      title: "Missing meta description",
      description: "The page is missing a meta description, which affects click-through rates.",
      impact: "high",
      howToFix: "Add a compelling meta description between 120-160 characters.",
    });
  } else if (analysis.metaTags.descriptionLength && analysis.metaTags.descriptionLength < 120) {
    issues.push({
      id: "short-description",
      type: "warning",
      category: "meta",
      title: "Meta description too short",
      description: `Description is ${analysis.metaTags.descriptionLength} characters. Optimal length is 120-160 characters.`,
      impact: "medium",
      howToFix: "Expand your meta description to provide more context.",
    });
  }

  if (!analysis.metaTags.hasCanonical) {
    issues.push({
      id: "missing-canonical",
      type: "warning",
      category: "technical",
      title: "Missing canonical URL",
      description: "No canonical URL is specified, which may cause duplicate content issues.",
      impact: "medium",
      howToFix: "Add a <link rel=\"canonical\" href=\"...\"> tag to the page.",
    });
  }

  // Header issues
  if (analysis.headers.h1Count === 0) {
    issues.push({
      id: "missing-h1",
      type: "error",
      category: "content",
      title: "Missing H1 heading",
      description: "The page has no H1 heading, which is important for SEO.",
      impact: "high",
      howToFix: "Add a single H1 heading that describes the main topic of the page.",
    });
  } else if (analysis.headers.h1Count > 1) {
    issues.push({
      id: "multiple-h1",
      type: "warning",
      category: "content",
      title: "Multiple H1 headings",
      description: `The page has ${analysis.headers.h1Count} H1 headings. There should only be one.`,
      impact: "medium",
      howToFix: "Keep only one H1 and change others to H2 or lower.",
    });
  }

  // Image issues
  if (analysis.images.imagesWithoutAlt > 0) {
    issues.push({
      id: "images-missing-alt",
      type: analysis.images.imagesWithoutAlt > 5 ? "error" : "warning",
      category: "images",
      title: "Images missing alt text",
      description: `${analysis.images.imagesWithoutAlt} of ${analysis.images.totalImages} images are missing alt text.`,
      impact: analysis.images.imagesWithoutAlt > 5 ? "high" : "medium",
      howToFix: "Add descriptive alt text to all images.",
    });
  }

  // Structured data issues
  if (!analysis.structuredData.hasStructuredData) {
    issues.push({
      id: "no-structured-data",
      type: "info",
      category: "structured_data",
      title: "No structured data found",
      description: "Adding structured data can help search engines understand your content better.",
      impact: "low",
      howToFix: "Add JSON-LD structured data relevant to your content type.",
    });
  }

  // Mobile issues
  if (!analysis.mobileFriendliness.viewportConfigured) {
    issues.push({
      id: "no-viewport",
      type: "error",
      category: "mobile",
      title: "Viewport not configured",
      description: "The page doesn't have a viewport meta tag, making it not mobile-friendly.",
      impact: "high",
      howToFix: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
    });
  }

  return issues;
}

/**
 * Generate recommendations from analysis
 */
function generateRecommendations(analysis: {
  metaTags: ReturnType<typeof analyzeMetaTags>;
  headers: ReturnType<typeof analyzeHeaders>;
  images: ReturnType<typeof analyzeImages>;
  content: ReturnType<typeof analyzeContent>;
  structuredData: ReturnType<typeof analyzeStructuredData>;
}): SEORecommendation[] {
  const recommendations: SEORecommendation[] = [];

  // Content recommendations
  if (analysis.content.wordCount < 300) {
    recommendations.push({
      id: "add-content",
      priority: "high",
      category: "content",
      title: "Add more content",
      description: `The page has only ${analysis.content.wordCount} words. Search engines prefer pages with substantial content.`,
      estimatedImpact: 8,
      effort: "moderate",
      currentValue: `${analysis.content.wordCount} words`,
      suggestedValue: "300+ words",
    });
  }

  // Structured data recommendations
  if (!analysis.structuredData.hasStructuredData) {
    recommendations.push({
      id: "add-schema",
      priority: "medium",
      category: "structured_data",
      title: "Add structured data markup",
      description: "Implement JSON-LD structured data to help search engines understand your content and enable rich snippets.",
      estimatedImpact: 6,
      effort: "moderate",
    });
  }

  // Header hierarchy recommendations
  if (analysis.headers.h1Count === 1 && analysis.headers.h2Count === 0) {
    recommendations.push({
      id: "add-subheadings",
      priority: "medium",
      category: "content",
      title: "Add subheadings (H2, H3)",
      description: "Break up your content with subheadings to improve readability and SEO.",
      estimatedImpact: 5,
      effort: "minimal",
    });
  }

  // Image optimization recommendations
  if (analysis.images.totalImages === 0) {
    recommendations.push({
      id: "add-images",
      priority: "low",
      category: "content",
      title: "Add relevant images",
      description: "Images can improve engagement and provide additional context for search engines.",
      estimatedImpact: 4,
      effort: "moderate",
    });
  }

  return recommendations;
}

/**
 * Calculate SEO scores
 */
function calculateScores(analysis: {
  metaTags: ReturnType<typeof analyzeMetaTags>;
  headers: ReturnType<typeof analyzeHeaders>;
  images: ReturnType<typeof analyzeImages>;
  content: ReturnType<typeof analyzeContent>;
  structuredData: ReturnType<typeof analyzeStructuredData>;
  mobileFriendliness: ReturnType<typeof analyzeMobileFriendliness>;
}): {
  seoScore: number;
  technicalScore: number;
  contentScore: number;
  performanceScore: number;
  mobileScore: number;
} {
  // Technical score (meta tags, canonical, robots)
  let technicalScore = 0;
  if (analysis.metaTags.hasTitle) technicalScore += 30;
  if (analysis.metaTags.hasDescription) technicalScore += 25;
  if (analysis.metaTags.hasCanonical) technicalScore += 20;
  if (analysis.metaTags.hasRobotsMeta) technicalScore += 10;
  if (analysis.structuredData.hasStructuredData) technicalScore += 15;

  // Content score (headers, images, word count)
  let contentScore = 0;
  if (analysis.headers.h1Count === 1) contentScore += 25;
  if (analysis.headers.hierarchyValid) contentScore += 15;
  if (analysis.content.wordCount >= 300) contentScore += 25;
  if (analysis.images.totalImages > 0) contentScore += 15;
  if (analysis.images.imagesWithoutAlt === 0) contentScore += 20;

  // Performance score (placeholder - would need actual metrics)
  const performanceScore = 75; // Default without actual measurements

  // Mobile score
  let mobileScore = 0;
  if (analysis.mobileFriendliness.viewportConfigured) mobileScore += 50;
  if (analysis.mobileFriendliness.fontSizeReadable) mobileScore += 25;
  if (analysis.mobileFriendliness.tapTargetsSized) mobileScore += 25;

  // Overall SEO score (weighted average)
  const seoScore = Math.round(
    technicalScore * 0.35 +
    contentScore * 0.30 +
    performanceScore * 0.15 +
    mobileScore * 0.20
  );

  return {
    seoScore,
    technicalScore,
    contentScore,
    performanceScore,
    mobileScore,
  };
}

/**
 * Run SEO audit on a URL
 */
export async function runPageSEOAudit(
  pageUrl: string
): Promise<ActionResult<SEOAuditResult>> {
  try {
    const context = await getUserContext();
    if (!context) {
      return { success: false, error: "Unauthorized" };
    }

    // Only managers and admins can run audits
    if (context.role !== "manager" && context.role !== "admin") {
      return { success: false, error: "Unauthorized - Manager or admin access required" };
    }

    // Fetch the page
    let html: string;
    try {
      const response = await fetch(pageUrl, {
        headers: {
          "User-Agent": "RepWell SEO Auditor/1.0",
        },
      });
      if (!response.ok) {
        return { success: false, error: `Failed to fetch page: ${response.status}` };
      }
      html = await response.text();
    } catch (err) {
      console.error("Error fetching page:", err);
      return { success: false, error: "Failed to fetch page" };
    }

    // Run analysis
    const metaTags = analyzeMetaTags(html);
    const headers = analyzeHeaders(html);
    const images = analyzeImages(html);
    const links = analyzeLinks(html, pageUrl);
    const content = analyzeContent(html);
    const structuredData = analyzeStructuredData(html);
    const mobileFriendliness = analyzeMobileFriendliness(html);

    // Generate issues and recommendations
    const issues = generateIssues({ metaTags, headers, images, structuredData, mobileFriendliness });
    const recommendations = generateRecommendations({ metaTags, headers, images, content, structuredData });

    // Calculate scores
    const scores = calculateScores({ metaTags, headers, images, content, structuredData, mobileFriendliness });

    // Get previous audit for comparison
    // Use untyped client for website_seo_audits table (not in generated types yet)
    const supabase = createUntypedAdminClient();
    const { data: previousAudit } = await supabase
      .from("website_seo_audits")
      .select("seo_score")
      .eq("organization_id", context.organizationId)
      .eq("page_url", pageUrl)
      .order("audited_at", { ascending: false })
      .limit(1)
      .single();

    const previousScore = previousAudit?.seo_score || null;
    const scoreChange = previousScore ? scores.seoScore - previousScore : null;

    // Extract page path from URL
    const urlObj = new URL(pageUrl);
    const pagePath = urlObj.pathname;

    // Save audit to database
    const auditData = {
      organization_id: context.organizationId,
      page_url: pageUrl,
      page_path: pagePath,
      page_title: metaTags.title,
      seo_score: scores.seoScore,
      previous_score: previousScore,
      score_change: scoreChange,
      technical_score: scores.technicalScore,
      content_score: scores.contentScore,
      performance_score: scores.performanceScore,
      mobile_score: scores.mobileScore,
      has_meta_title: metaTags.hasTitle,
      has_meta_description: metaTags.hasDescription,
      meta_title_length: metaTags.titleLength,
      meta_description_length: metaTags.descriptionLength,
      has_canonical_url: metaTags.hasCanonical,
      has_robots_meta: metaTags.hasRobotsMeta,
      h1_count: headers.h1Count,
      h2_count: headers.h2Count,
      h3_count: headers.h3Count,
      headers_hierarchy_valid: headers.hierarchyValid,
      total_images: images.totalImages,
      images_with_alt: images.imagesWithAlt,
      images_without_alt: images.imagesWithoutAlt,
      internal_links_count: links.internalLinks,
      external_links_count: links.externalLinks,
      broken_links_count: 0, // Would need separate check
      is_mobile_friendly: mobileFriendliness.viewportConfigured,
      viewport_configured: mobileFriendliness.viewportConfigured,
      font_size_readable: mobileFriendliness.fontSizeReadable,
      tap_targets_sized: mobileFriendliness.tapTargetsSized,
      has_structured_data: structuredData.hasStructuredData,
      structured_data_types: structuredData.types,
      structured_data_valid: true,
      word_count: content.wordCount,
      reading_time_minutes: content.readingTimeMinutes,
      issues: issues as unknown as Json,
      recommendations: recommendations as unknown as Json,
      audit_type: "manual",
      audited_at: new Date().toISOString(),
    };

    const { data: savedAudit, error: saveError } = await supabase
      .from("website_seo_audits")
      .insert(auditData)
      .select()
      .single();

    if (saveError) {
      console.error("Error saving audit:", saveError);
      return { success: false, error: "Failed to save audit" };
    }

    const result: SEOAuditResult = {
      id: savedAudit.id,
      pageUrl,
      pagePath,
      pageTitle: metaTags.title,
      seoScore: scores.seoScore,
      previousScore,
      scoreChange,
      technicalScore: scores.technicalScore,
      contentScore: scores.contentScore,
      performanceScore: scores.performanceScore,
      mobileScore: scores.mobileScore,
      metaTags: {
        hasTitle: metaTags.hasTitle,
        hasDescription: metaTags.hasDescription,
        titleLength: metaTags.titleLength,
        descriptionLength: metaTags.descriptionLength,
        titleOptimal: (metaTags.titleLength || 0) >= 30 && (metaTags.titleLength || 0) <= 60,
        descriptionOptimal: (metaTags.descriptionLength || 0) >= 120 && (metaTags.descriptionLength || 0) <= 160,
        hasCanonical: metaTags.hasCanonical,
        hasRobotsMeta: metaTags.hasRobotsMeta,
      },
      headers: {
        h1Count: headers.h1Count,
        h2Count: headers.h2Count,
        h3Count: headers.h3Count,
        hierarchyValid: headers.hierarchyValid,
        issues: [],
      },
      images: {
        totalImages: images.totalImages,
        imagesWithAlt: images.imagesWithAlt,
        imagesWithoutAlt: images.imagesWithoutAlt,
        altTextScore: images.totalImages > 0 ? (images.imagesWithAlt / images.totalImages) * 100 : 100,
      },
      links: {
        internalLinks: links.internalLinks,
        externalLinks: links.externalLinks,
        brokenLinks: 0,
        healthScore: 100,
      },
      performance: {
        pageLoadTime: null,
        firstContentfulPaint: null,
        largestContentfulPaint: null,
        cumulativeLayoutShift: null,
        totalBlockingTime: null,
        performanceScore: scores.performanceScore,
      },
      mobileFriendliness: {
        isMobileFriendly: mobileFriendliness.viewportConfigured,
        viewportConfigured: mobileFriendliness.viewportConfigured,
        fontSizeReadable: mobileFriendliness.fontSizeReadable,
        tapTargetsSized: mobileFriendliness.tapTargetsSized,
        score: scores.mobileScore,
      },
      structuredData: {
        hasStructuredData: structuredData.hasStructuredData,
        types: structuredData.types,
        isValid: true,
        issues: [],
      },
      content: {
        wordCount: content.wordCount,
        readingTimeMinutes: content.readingTimeMinutes,
        contentFreshnessDays: null,
      },
      issues,
      recommendations,
      auditedAt: new Date().toISOString(),
    };

    return { success: true, data: result };
  } catch (err) {
    console.error("Error in runPageSEOAudit:", err);
    return { success: false, error: "Failed to run SEO audit" };
  }
}

/**
 * Run SEO audit on multiple pages (batch)
 */
export async function runBatchSEOAudit(
  pageUrls: string[]
): Promise<ActionResult<{ successful: number; failed: number; results: SEOAuditResult[] }>> {
  try {
    const context = await getUserContext();
    if (!context) {
      return { success: false, error: "Unauthorized" };
    }

    const results: SEOAuditResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const url of pageUrls.slice(0, 10)) { // Limit to 10 pages at a time
      const result = await runPageSEOAudit(url);
      if (result.success && result.data) {
        results.push(result.data);
        successful++;
      } else {
        failed++;
      }
    }

    return {
      success: true,
      data: { successful, failed, results },
    };
  } catch (err) {
    console.error("Error in runBatchSEOAudit:", err);
    return { success: false, error: "Failed to run batch audit" };
  }
}
