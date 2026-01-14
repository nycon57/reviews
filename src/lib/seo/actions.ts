"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database.types";

type LoanOfficer = Tables<"loan_officers">;
type Organization = Tables<"organizations">;

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
