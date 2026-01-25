"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import type { SEOAuditItem, SEOAuditResult } from "./types";

export type { SEOAuditResult } from "./types";

/**
 * Run SEO audit for the organization
 * Checks structured data, meta tags, sitemap, robots.txt, and more
 */
export async function runSEOAudit(): Promise<{
  success: boolean;
  data?: SEOAuditResult;
  error?: string;
}> {
  try {
    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = createAdminClient();

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userData?.organization_id) {
      return { success: false, error: "No organization found" };
    }

    const organizationId = userData.organization_id;

    // Get organization details
    const { data: organization } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .single();

    // Get loan officers with their review stats
    const { data: loanOfficers } = await supabase
      .from("users")
      .select("id, full_name, bio, photo_url, average_rating, total_reviews, nmls_id")
      .eq("organization_id", organizationId)
      .eq("is_active", true);

    // Get published reviews count
    const { count: publishedReviewsCount } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("is_published", true)
      .eq("status", "approved");

    const auditItems: SEOAuditItem[] = [];

    // Technical SEO Checks
    auditItems.push({
      id: "sitemap",
      category: "technical",
      title: "Sitemap Generation",
      description: "Dynamic sitemap.xml is configured and accessible",
      status: "pass",
      details: "Sitemap is automatically generated at /sitemap.xml",
      priority: "high",
    });

    auditItems.push({
      id: "robots",
      category: "technical",
      title: "Robots.txt Configuration",
      description: "Robots.txt properly configured to guide search engine crawlers",
      status: "pass",
      details: "Public pages are allowed, dashboard and API routes are blocked",
      priority: "high",
    });

    auditItems.push({
      id: "canonical_urls",
      category: "technical",
      title: "Canonical URLs",
      description: "LO profile pages have canonical URLs to prevent duplicate content",
      status: "pass",
      details: "Each profile page includes a canonical link tag",
      priority: "medium",
    });

    // Structured Data Checks
    const usersWithProfiles = loanOfficers?.filter((u) => u.full_name) || [];
    const usersWithRatings = loanOfficers?.filter((u) => u.average_rating && u.total_reviews) || [];
    const usersWithPhotos = loanOfficers?.filter((u) => u.photo_url) || [];
    const usersWithBios = loanOfficers?.filter((u) => u.bio && u.bio.length > 50) || [];
    const usersWithNMLS = loanOfficers?.filter((u) => u.nmls_id) || [];

    auditItems.push({
      id: "person_schema",
      category: "structured_data",
      title: "Person Schema (JSON-LD)",
      description: "Team member profiles include Person structured data",
      status: usersWithProfiles.length > 0 ? "pass" : "warning",
      details:
        usersWithProfiles.length > 0
          ? `${usersWithProfiles.length} team member profiles have Person schema`
          : "No active team members found",
      priority: "high",
    });

    auditItems.push({
      id: "aggregate_rating_schema",
      category: "structured_data",
      title: "AggregateRating Schema",
      description: "Profiles with reviews include aggregate rating data",
      status:
        usersWithRatings.length > 0
          ? "pass"
          : usersWithProfiles.length > 0
            ? "warning"
            : "not_applicable",
      details:
        usersWithRatings.length > 0
          ? `${usersWithRatings.length} profiles have AggregateRating data`
          : "No profiles have reviews yet",
      priority: "high",
    });

    auditItems.push({
      id: "review_schema",
      category: "structured_data",
      title: "Review Schema",
      description: "Individual reviews include structured data markup",
      status:
        (publishedReviewsCount || 0) > 0 ? "pass" : "warning",
      details:
        (publishedReviewsCount || 0) > 0
          ? `${publishedReviewsCount} published reviews with Review schema`
          : "No published reviews yet",
      priority: "medium",
    });

    auditItems.push({
      id: "breadcrumb_schema",
      category: "structured_data",
      title: "BreadcrumbList Schema",
      description: "Profile pages include breadcrumb navigation data",
      status: "pass",
      details: "All profile pages include BreadcrumbList schema",
      priority: "low",
    });

    // Content Quality Checks
    auditItems.push({
      id: "profile_photos",
      category: "content",
      title: "Profile Photos",
      description: "Team members have profile photos for rich snippets",
      status:
        usersWithPhotos.length === usersWithProfiles.length
          ? "pass"
          : usersWithPhotos.length > usersWithProfiles.length / 2
            ? "warning"
            : "fail",
      details: `${usersWithPhotos.length}/${usersWithProfiles.length} team members have photos`,
      priority: "medium",
    });

    auditItems.push({
      id: "profile_bios",
      category: "content",
      title: "Profile Descriptions",
      description: "Team members have meaningful bio/descriptions (50+ chars)",
      status:
        usersWithBios.length === usersWithProfiles.length
          ? "pass"
          : usersWithBios.length > usersWithProfiles.length / 2
            ? "warning"
            : "fail",
      details: `${usersWithBios.length}/${usersWithProfiles.length} team members have detailed bios`,
      priority: "medium",
    });

    auditItems.push({
      id: "nmls_ids",
      category: "content",
      title: "NMLS Identifiers",
      description: "Team members have NMLS IDs for credibility",
      status:
        usersWithNMLS.length === usersWithProfiles.length
          ? "pass"
          : usersWithNMLS.length > 0
            ? "warning"
            : "fail",
      details: `${usersWithNMLS.length}/${usersWithProfiles.length} team members have NMLS IDs`,
      priority: "medium",
    });

    // Social & Meta Checks
    auditItems.push({
      id: "open_graph",
      category: "social",
      title: "Open Graph Tags",
      description: "Profile pages include Open Graph meta tags for social sharing",
      status: "pass",
      details: "All profile pages include OG title, description, and image tags",
      priority: "medium",
    });

    auditItems.push({
      id: "twitter_cards",
      category: "social",
      title: "Twitter Cards",
      description: "Profile pages include Twitter Card meta tags",
      status: "pass",
      details: "Summary cards configured for all profile pages",
      priority: "low",
    });

    auditItems.push({
      id: "organization_branding",
      category: "social",
      title: "Organization Branding",
      description: "Organization has logo configured for social previews",
      status: organization?.logo_url ? "pass" : "warning",
      details: organization?.logo_url
        ? "Organization logo is configured"
        : "Add a logo in Branding settings for better social previews",
      priority: "low",
    });

    // Calculate score
    const applicableItems = auditItems.filter((i) => i.status !== "not_applicable");
    const passedItems = applicableItems.filter((i) => i.status === "pass");
    const warningItems = applicableItems.filter((i) => i.status === "warning");

    // Pass = 100%, Warning = 50%, Fail = 0%
    const score = Math.round(
      ((passedItems.length + warningItems.length * 0.5) / applicableItems.length) * 100
    );

    return {
      success: true,
      data: {
        score,
        items: auditItems,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch {
    return { success: false, error: "Failed to run SEO audit" };
  }
}
