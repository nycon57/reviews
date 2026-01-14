"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database.types";

type LoanOfficer = Tables<"loan_officers">;
type Organization = Tables<"organizations">;
type Branch = Tables<"branches">;

export interface PublicBranch {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: Branch["address"];
  phone: string | null;
  email: string | null;
  website_url: string | null;
  hours_of_operation: Branch["hours_of_operation"];
  manager_name: string | null;
  google_maps_url: string | null;
  photo_url: string | null;
  cover_image_url: string | null;
  region: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  total_loan_officers: number | null;
}

export interface PublicBranchLoanOfficer {
  id: string;
  full_name: string;
  title: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  nmls_id: string | null;
  average_rating: number | null;
  total_reviews: number | null;
}

export interface PublicBranchReview {
  id: string;
  customer_name: string | null;
  customer_location: string | null;
  rating: number;
  text: string | null;
  title: string | null;
  review_date: string;
  source: string;
  response_text: string | null;
  loan_officer: {
    id: string;
    full_name: string;
    photo_url: string | null;
  };
}

export interface PublicBranchProfileData {
  branch: PublicBranch;
  organization: Pick<Organization, "id" | "name" | "logo_url" | "domain"> | null;
  loanOfficers: PublicBranchLoanOfficer[];
  reviews: PublicBranchReview[];
}

export interface PublicLoanOfficer {
  id: string;
  full_name: string;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  branch: string | null;
  region: string | null;
  nmls_id: string | null;
  address: LoanOfficer["address"];
  linkedin_url: string | null;
  zillow_profile_url: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  nps_score: number | null;
}

export interface PublicReview {
  id: string;
  customer_name: string | null;
  customer_location: string | null;
  rating: number;
  text: string | null;
  title: string | null;
  review_date: string;
  source: string;
  response_text: string | null;
}

export interface PublicLOProfileData {
  loanOfficer: PublicLoanOfficer;
  organization: Pick<Organization, "id" | "name" | "logo_url" | "domain"> | null;
  reviews: PublicReview[];
}

/**
 * Get a public Loan Officer profile by ID
 */
export async function getPublicLOProfile(
  loId: string
): Promise<{ success: boolean; data?: PublicLOProfileData; error?: string }> {
  try {
    const supabase = createAdminClient();

    // Fetch the loan officer
    const { data: loanOfficer, error: loError } = await supabase
      .from("loan_officers")
      .select(
        `
        id,
        full_name,
        title,
        bio,
        photo_url,
        email,
        phone,
        branch,
        region,
        nmls_id,
        address,
        linkedin_url,
        zillow_profile_url,
        average_rating,
        total_reviews,
        nps_score,
        is_active,
        organization_id
      `
      )
      .eq("id", loId)
      .eq("is_active", true)
      .single();

    if (loError || !loanOfficer) {
      return { success: false, error: "Loan officer not found" };
    }

    // Fetch the organization
    const { data: organization } = await supabase
      .from("organizations")
      .select("id, name, logo_url, domain")
      .eq("id", loanOfficer.organization_id)
      .single();

    // Fetch published reviews
    const { data: reviews } = await supabase
      .from("reviews")
      .select(
        `
        id,
        customer_name,
        customer_location,
        rating,
        text,
        title,
        review_date,
        source,
        response_text
      `
      )
      .eq("loan_officer_id", loId)
      .eq("is_published", true)
      .eq("status", "approved")
      .order("review_date", { ascending: false })
      .limit(50);

    return {
      success: true,
      data: {
        loanOfficer: {
          id: loanOfficer.id,
          full_name: loanOfficer.full_name,
          title: loanOfficer.title,
          bio: loanOfficer.bio,
          photo_url: loanOfficer.photo_url,
          email: loanOfficer.email,
          phone: loanOfficer.phone,
          branch: loanOfficer.branch,
          region: loanOfficer.region,
          nmls_id: loanOfficer.nmls_id,
          address: loanOfficer.address,
          linkedin_url: loanOfficer.linkedin_url,
          zillow_profile_url: loanOfficer.zillow_profile_url,
          average_rating: loanOfficer.average_rating,
          total_reviews: loanOfficer.total_reviews,
          nps_score: loanOfficer.nps_score,
        },
        organization: organization || null,
        reviews: reviews || [],
      },
    };
  } catch {
    return { success: false, error: "Failed to load profile" };
  }
}

/**
 * Get a list of public Loan Officers for an organization
 */
export async function getPublicLOList(
  organizationSlug?: string
): Promise<{
  success: boolean;
  data?: { loanOfficers: PublicLoanOfficer[]; organization: Pick<Organization, "id" | "name" | "logo_url"> | null };
  error?: string;
}> {
  try {
    const supabase = createAdminClient();

    let organizationId: string | null = null;
    let organization: Pick<Organization, "id" | "name" | "logo_url"> | null = null;

    // If a slug is provided, look up the organization
    if (organizationSlug) {
      const { data: org } = await supabase
        .from("organizations")
        .select("id, name, logo_url")
        .eq("slug", organizationSlug)
        .single();

      if (org) {
        organizationId = org.id;
        organization = org;
      }
    }

    // Build the query
    let query = supabase
      .from("loan_officers")
      .select(
        `
        id,
        full_name,
        title,
        bio,
        photo_url,
        email,
        phone,
        branch,
        region,
        nmls_id,
        address,
        linkedin_url,
        zillow_profile_url,
        average_rating,
        total_reviews,
        nps_score
      `
      )
      .eq("is_active", true)
      .order("average_rating", { ascending: false, nullsFirst: false });

    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    const { data: loanOfficers, error } = await query.limit(100);

    if (error) {
      return { success: false, error: "Failed to load loan officers" };
    }

    return {
      success: true,
      data: {
        loanOfficers: loanOfficers || [],
        organization,
      },
    };
  } catch {
    return { success: false, error: "Failed to load loan officers" };
  }
}

/**
 * Get all public LO IDs for sitemap generation
 */
export async function getAllPublicLOIds(): Promise<string[]> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("loan_officers")
      .select("id")
      .eq("is_active", true);

    if (error || !data) {
      return [];
    }

    return data.map((lo) => lo.id);
  } catch {
    return [];
  }
}

/**
 * Get all organizations for sitemap generation
 */
export async function getAllOrganizationSlugs(): Promise<string[]> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase.from("organizations").select("slug");

    if (error || !data) {
      return [];
    }

    return data.map((org) => org.slug);
  } catch {
    return [];
  }
}

/**
 * Get a public Branch profile by ID
 */
export async function getPublicBranchProfile(
  branchId: string
): Promise<{ success: boolean; data?: PublicBranchProfileData; error?: string }> {
  try {
    const supabase = createAdminClient();

    // Fetch the branch
    const { data: branch, error: branchError } = await supabase
      .from("branches")
      .select(
        `
        id,
        name,
        slug,
        description,
        address,
        phone,
        email,
        website_url,
        hours_of_operation,
        manager_name,
        google_maps_url,
        photo_url,
        cover_image_url,
        region,
        average_rating,
        total_reviews,
        total_loan_officers,
        is_active,
        is_public,
        organization_id
      `
      )
      .eq("id", branchId)
      .eq("is_active", true)
      .eq("is_public", true)
      .single();

    if (branchError || !branch) {
      return { success: false, error: "Branch not found" };
    }

    // Fetch the organization
    const { data: organization } = await supabase
      .from("organizations")
      .select("id, name, logo_url, domain")
      .eq("id", branch.organization_id)
      .single();

    // Fetch loan officers at this branch
    const { data: loanOfficers } = await supabase
      .from("loan_officers")
      .select(
        `
        id,
        full_name,
        title,
        photo_url,
        email,
        phone,
        nmls_id,
        average_rating,
        total_reviews
      `
      )
      .eq("branch_id", branchId)
      .eq("is_active", true)
      .order("average_rating", { ascending: false, nullsFirst: false })
      .limit(50);

    // Get loan officer IDs for fetching reviews
    const loIds = (loanOfficers || []).map((lo) => lo.id);

    // Fetch recent reviews from all loan officers at this branch
    let reviews: PublicBranchReview[] = [];
    if (loIds.length > 0) {
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select(
          `
          id,
          customer_name,
          customer_location,
          rating,
          text,
          title,
          review_date,
          source,
          response_text,
          loan_officer_id
        `
        )
        .in("loan_officer_id", loIds)
        .eq("is_published", true)
        .eq("status", "approved")
        .order("review_date", { ascending: false })
        .limit(20);

      if (reviewsData) {
        // Map loan officer info to reviews
        const loMap = new Map(
          (loanOfficers || []).map((lo) => [
            lo.id,
            { id: lo.id, full_name: lo.full_name, photo_url: lo.photo_url },
          ])
        );

        reviews = reviewsData.map((r) => ({
          id: r.id,
          customer_name: r.customer_name,
          customer_location: r.customer_location,
          rating: r.rating,
          text: r.text,
          title: r.title,
          review_date: r.review_date,
          source: r.source,
          response_text: r.response_text,
          loan_officer: loMap.get(r.loan_officer_id) || {
            id: r.loan_officer_id,
            full_name: "Unknown",
            photo_url: null,
          },
        }));
      }
    }

    return {
      success: true,
      data: {
        branch: {
          id: branch.id,
          name: branch.name,
          slug: branch.slug,
          description: branch.description,
          address: branch.address,
          phone: branch.phone,
          email: branch.email,
          website_url: branch.website_url,
          hours_of_operation: branch.hours_of_operation,
          manager_name: branch.manager_name,
          google_maps_url: branch.google_maps_url,
          photo_url: branch.photo_url,
          cover_image_url: branch.cover_image_url,
          region: branch.region,
          average_rating: branch.average_rating,
          total_reviews: branch.total_reviews,
          total_loan_officers: branch.total_loan_officers,
        },
        organization: organization || null,
        loanOfficers: loanOfficers || [],
        reviews,
      },
    };
  } catch {
    return { success: false, error: "Failed to load branch profile" };
  }
}

/**
 * Get all public branch IDs for sitemap generation
 */
export async function getAllPublicBranchIds(): Promise<string[]> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("branches")
      .select("id")
      .eq("is_active", true)
      .eq("is_public", true);

    if (error || !data) {
      return [];
    }

    return data.map((branch) => branch.id);
  } catch {
    return [];
  }
}

// ============================================
// PUBLIC ORGANIZATION PROFILE TYPES & ACTIONS
// ============================================

export interface OrganizationAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface PublicOrganization {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  primary_color: string | null;
  description: string | null;
  mission_statement: string | null;
  website_url: string | null;
  headquarters_address: OrganizationAddress | null;
  aggregate_rating: number | null;
  total_reviews: number;
  total_branches: number;
  total_loan_officers: number;
}

export interface PublicOrgBranch {
  id: string;
  name: string;
  slug: string;
  address: Branch["address"];
  phone: string | null;
  photo_url: string | null;
  region: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  total_loan_officers: number | null;
}

export interface PublicOrgLoanOfficer {
  id: string;
  full_name: string;
  title: string | null;
  photo_url: string | null;
  branch_name: string | null;
  average_rating: number | null;
  total_reviews: number | null;
}

export interface PublicOrgTestimonial {
  id: string;
  customer_name: string | null;
  customer_location: string | null;
  rating: number;
  text: string | null;
  title: string | null;
  review_date: string;
  loan_officer: {
    id: string;
    full_name: string;
    photo_url: string | null;
  };
  branch: {
    id: string;
    name: string;
  } | null;
}

export interface PublicOrganizationProfileData {
  organization: PublicOrganization;
  branches: PublicOrgBranch[];
  featuredLoanOfficers: PublicOrgLoanOfficer[];
  testimonials: PublicOrgTestimonial[];
}

/**
 * Get a public Organization profile by slug
 */
export async function getPublicOrganizationProfile(
  slug: string
): Promise<{ success: boolean; data?: PublicOrganizationProfileData; error?: string }> {
  try {
    const supabase = createAdminClient();

    // Fetch the organization by slug
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select(
        `
        id,
        name,
        slug,
        domain,
        logo_url,
        primary_color,
        settings
      `
      )
      .eq("slug", slug)
      .single();

    if (orgError || !organization) {
      return { success: false, error: "Organization not found" };
    }

    // Parse organization settings for additional fields
    const settings = organization.settings as {
      description?: string;
      mission_statement?: string;
      website_url?: string;
      headquarters_address?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
      };
    } | null;

    // Fetch all public branches for this organization
    const { data: branches } = await supabase
      .from("branches")
      .select(
        `
        id,
        name,
        slug,
        address,
        phone,
        photo_url,
        region,
        average_rating,
        total_reviews,
        total_loan_officers
      `
      )
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .eq("is_public", true)
      .order("name", { ascending: true });

    // Fetch all active loan officers for this organization (top rated)
    const { data: loanOfficers } = await supabase
      .from("loan_officers")
      .select(
        `
        id,
        full_name,
        title,
        photo_url,
        branch,
        average_rating,
        total_reviews
      `
      )
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .not("average_rating", "is", null)
      .order("average_rating", { ascending: false, nullsFirst: false })
      .limit(12);

    // Calculate aggregate stats
    const allBranches = branches || [];
    const allLoanOfficers = loanOfficers || [];

    // Count total reviews and calculate weighted average rating
    let totalReviews = 0;
    let weightedRatingSum = 0;

    for (const branch of allBranches) {
      if (branch.total_reviews && branch.average_rating) {
        totalReviews += branch.total_reviews;
        weightedRatingSum += branch.total_reviews * Number(branch.average_rating);
      }
    }

    const aggregateRating = totalReviews > 0 ? weightedRatingSum / totalReviews : null;

    // Get total loan officers count
    const { count: totalLOCount } = await supabase
      .from("loan_officers")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .eq("is_active", true);

    // Fetch featured testimonials (top-rated reviews with text)
    const loIds = allLoanOfficers.map((lo) => lo.id);
    let testimonials: PublicOrgTestimonial[] = [];

    if (loIds.length > 0) {
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select(
          `
          id,
          customer_name,
          customer_location,
          rating,
          text,
          title,
          review_date,
          loan_officer_id
        `
        )
        .eq("organization_id", organization.id)
        .eq("is_published", true)
        .eq("status", "approved")
        .not("text", "is", null)
        .gte("rating", 4)
        .order("rating", { ascending: false })
        .order("review_date", { ascending: false })
        .limit(10);

      if (reviewsData) {
        // Map loan officer and branch info to testimonials
        const loMap = new Map(
          allLoanOfficers.map((lo) => [
            lo.id,
            { id: lo.id, full_name: lo.full_name, photo_url: lo.photo_url, branch_name: lo.branch },
          ])
        );

        // Create a branch lookup by name
        const branchByName = new Map(
          allBranches.map((b) => [b.name, { id: b.id, name: b.name }])
        );

        testimonials = reviewsData.map((r) => {
          const lo = loMap.get(r.loan_officer_id);
          const branch = lo?.branch_name ? branchByName.get(lo.branch_name) : null;
          return {
            id: r.id,
            customer_name: r.customer_name,
            customer_location: r.customer_location,
            rating: r.rating,
            text: r.text,
            title: r.title,
            review_date: r.review_date,
            loan_officer: lo
              ? { id: lo.id, full_name: lo.full_name, photo_url: lo.photo_url }
              : { id: r.loan_officer_id, full_name: "Team Member", photo_url: null },
            branch: branch || null,
          };
        });
      }
    }

    return {
      success: true,
      data: {
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          domain: organization.domain,
          logo_url: organization.logo_url,
          primary_color: organization.primary_color,
          description: settings?.description || null,
          mission_statement: settings?.mission_statement || null,
          website_url: settings?.website_url || null,
          headquarters_address: settings?.headquarters_address || null,
          aggregate_rating: aggregateRating,
          total_reviews: totalReviews,
          total_branches: allBranches.length,
          total_loan_officers: totalLOCount || 0,
        },
        branches: allBranches.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          address: b.address,
          phone: b.phone,
          photo_url: b.photo_url,
          region: b.region,
          average_rating: b.average_rating,
          total_reviews: b.total_reviews,
          total_loan_officers: b.total_loan_officers,
        })),
        featuredLoanOfficers: allLoanOfficers.map((lo) => ({
          id: lo.id,
          full_name: lo.full_name,
          title: lo.title,
          photo_url: lo.photo_url,
          branch_name: lo.branch,
          average_rating: lo.average_rating,
          total_reviews: lo.total_reviews,
        })),
        testimonials,
      },
    };
  } catch {
    return { success: false, error: "Failed to load organization profile" };
  }
}
