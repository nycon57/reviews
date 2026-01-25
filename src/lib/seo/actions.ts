"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database.types";

type User = Tables<"users">;
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
  total_members: number | null;
}

export interface PublicBranchProfessional {
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

/** @deprecated Use PublicBranchProfessional instead */
export type PublicBranchLoanOfficer = PublicBranchProfessional;

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

export interface BusinessHours {
  monday?: { open: string; close: string } | null;
  tuesday?: { open: string; close: string } | null;
  wednesday?: { open: string; close: string } | null;
  thursday?: { open: string; close: string } | null;
  friday?: { open: string; close: string } | null;
  saturday?: { open: string; close: string } | null;
  sunday?: { open: string; close: string } | null;
}

// Minimal interface for list views
export interface PublicProfessionalListItem {
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
  address: User["address"];
  linkedin_url: string | null;
  zillow_profile_url: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  nps_score: number | null;
}

/** @deprecated Use PublicProfessionalListItem instead */
export type PublicLoanOfficerListItem = PublicProfessionalListItem;

// Full interface for profile views with customization fields
export interface PublicProfessional extends PublicProfessionalListItem {
  branch_id: string | null;
  // Profile customization fields
  banner_url: string | null;
  cta_button_text: string | null;
  cta_button_url: string | null;
  video_testimonial_url: string | null;
  video_thumbnail_url: string | null;
  accepts_public_reviews: boolean;
  referral_enabled: boolean;
  featured_review_ids: string[] | null;
}

/** @deprecated Use PublicProfessional instead */
export type PublicLoanOfficer = PublicProfessional;

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

export interface PublicProfessionalProfileData {
  professional: PublicProfessional;
  organization: Pick<Organization, "id" | "name" | "logo_url" | "domain"> | null;
  reviews: PublicReview[];
  featuredReviews: PublicReview[];
  businessHours: BusinessHours | null;
}

/** @deprecated Use PublicProfessionalProfileData instead */
export type PublicLOProfileData = PublicProfessionalProfileData;

/**
 * Get a public professional profile by user ID
 */
export async function getPublicLOProfile(
  userId: string
): Promise<{ success: boolean; data?: PublicLOProfileData; error?: string }> {
  try {
    const supabase = createAdminClient();

    // Fetch the user (professional)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        `
        id,
        full_name,
        title,
        bio,
        photo_url,
        avatar_url,
        email,
        phone,
        branch,
        branch_id,
        region,
        nmls_id,
        address,
        linkedin_url,
        zillow_profile_url,
        average_rating,
        total_reviews,
        nps_score,
        is_active,
        organization_id,
        banner_url,
        cta_button_text,
        cta_button_url,
        video_testimonial_url,
        video_thumbnail_url,
        accepts_public_reviews,
        referral_enabled,
        featured_review_ids
      `
      )
      .eq("id", userId)
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      return { success: false, error: "Professional not found" };
    }

    if (!user.organization_id) {
      return { success: false, error: "Professional not associated with an organization" };
    }

    // Use photo_url or avatar_url as fallback
    const photoUrl = user.photo_url || user.avatar_url;

    // Fetch the organization
    const { data: organization } = await supabase
      .from("organizations")
      .select("id, name, logo_url, domain")
      .eq("id", user.organization_id)
      .single();

    // Fetch published reviews (user_id references users table)
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
      .eq("user_id", userId)
      .eq("is_published", true)
      .eq("status", "approved")
      .order("review_date", { ascending: false })
      .limit(50);

    // Fetch featured reviews if IDs are specified
    let featuredReviews: PublicReview[] = [];
    const featuredIds = user.featured_review_ids as string[] | null;
    if (featuredIds && featuredIds.length > 0) {
      const { data: featured } = await supabase
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
        .in("id", featuredIds)
        .eq("is_published", true)
        .eq("status", "approved");

      if (featured) {
        // Maintain the order specified in featured_review_ids
        featuredReviews = featuredIds
          .map((id) => featured.find((r) => r.id === id))
          .filter((r): r is NonNullable<typeof r> => r !== undefined);
      }
    }

    // Fetch business hours from branch if available
    let businessHours: BusinessHours | null = null;
    if (user.branch_id) {
      const { data: branch } = await supabase
        .from("branches")
        .select("hours_of_operation")
        .eq("id", user.branch_id)
        .single();

      if (branch?.hours_of_operation) {
        businessHours = branch.hours_of_operation as BusinessHours;
      }
    }

    return {
      success: true,
      data: {
        professional: {
          id: user.id,
          full_name: user.full_name || "Unknown",
          title: user.title,
          bio: user.bio,
          photo_url: photoUrl,
          email: user.email,
          phone: user.phone,
          branch: user.branch,
          branch_id: user.branch_id,
          region: user.region,
          nmls_id: user.nmls_id,
          address: user.address,
          linkedin_url: user.linkedin_url,
          zillow_profile_url: user.zillow_profile_url,
          average_rating: user.average_rating,
          total_reviews: user.total_reviews,
          nps_score: user.nps_score,
          banner_url: user.banner_url,
          cta_button_text: user.cta_button_text,
          cta_button_url: user.cta_button_url,
          video_testimonial_url: user.video_testimonial_url,
          video_thumbnail_url: user.video_thumbnail_url,
          accepts_public_reviews: user.accepts_public_reviews ?? true,
          referral_enabled: user.referral_enabled ?? false,
          featured_review_ids: featuredIds,
        },
        organization: organization || null,
        reviews: reviews || [],
        featuredReviews,
        businessHours,
      },
    };
  } catch {
    return { success: false, error: "Failed to load profile" };
  }
}

/**
 * Get a list of public professionals for an organization
 */
export async function getPublicLOList(
  organizationSlug?: string
): Promise<{
  success: boolean;
  data?: { loanOfficers: PublicLoanOfficerListItem[]; organization: Pick<Organization, "id" | "name" | "logo_url"> | null };
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

    // Build the query - fetch users with professional roles
    let query = supabase
      .from("users")
      .select(
        `
        id,
        full_name,
        title,
        bio,
        photo_url,
        avatar_url,
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

    const { data: users, error } = await query.limit(100);

    if (error) {
      return { success: false, error: "Failed to load professionals" };
    }

    // Map users to the expected format, using photo_url or avatar_url
    const professionals = (users || []).map((user) => ({
      ...user,
      full_name: user.full_name || "Unknown",
      photo_url: user.photo_url || user.avatar_url,
    }));

    return {
      success: true,
      data: {
        loanOfficers: professionals,
        organization,
      },
    };
  } catch {
    return { success: false, error: "Failed to load professionals" };
  }
}

/**
 * Get all public professional IDs for sitemap generation
 */
export async function getAllPublicLOIds(): Promise<string[]> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("is_active", true);

    if (error || !data) {
      return [];
    }

    return data.map((u) => u.id);
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
        total_members,
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

    // Fetch professionals at this branch
    const { data: branchUsers } = await supabase
      .from("users")
      .select(
        `
        id,
        full_name,
        title,
        photo_url,
        avatar_url,
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

    // Map to expected format with photo fallback
    const professionals = (branchUsers || []).map((user) => ({
      ...user,
      full_name: user.full_name || "Unknown",
      photo_url: user.photo_url || user.avatar_url,
    }));

    // Get user IDs for fetching reviews
    const userIds = professionals.map((user) => user.id);

    // Fetch recent reviews from all professionals at this branch
    let reviews: PublicBranchReview[] = [];
    if (userIds.length > 0) {
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
          user_id
        `
        )
        .in("user_id", userIds)
        .eq("is_published", true)
        .eq("status", "approved")
        .order("review_date", { ascending: false })
        .limit(20);

      if (reviewsData) {
        // Map user info to reviews
        const userMap = new Map(
          professionals.map((user) => [
            user.id,
            { id: user.id, full_name: user.full_name || "Unknown", photo_url: user.photo_url },
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
          loan_officer: (r.user_id ? userMap.get(r.user_id) : undefined) || {
            id: r.user_id || "",
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
          total_members: branch.total_members,
        },
        organization: organization || null,
        loanOfficers: professionals || [],
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
  total_members: number;
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
  total_members: number | null;
}

export interface PublicOrgProfessional {
  id: string;
  full_name: string;
  title: string | null;
  photo_url: string | null;
  branch_name: string | null;
  average_rating: number | null;
  total_reviews: number | null;
}

/** @deprecated Use PublicOrgProfessional instead */
export type PublicOrgLoanOfficer = PublicOrgProfessional;

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
  featuredProfessionals: PublicOrgProfessional[];
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
        total_members
      `
      )
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .eq("is_public", true)
      .order("name", { ascending: true });

    // Fetch all active professionals for this organization (top rated)
    const { data: orgUsers } = await supabase
      .from("users")
      .select(
        `
        id,
        full_name,
        title,
        photo_url,
        avatar_url,
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

    // Map to expected format with photo fallback
    const professionals = (orgUsers || []).map((user) => ({
      ...user,
      photo_url: user.photo_url || user.avatar_url,
    }));

    // Calculate aggregate stats
    const allBranches = branches || [];
    const allProfessionals = professionals || [];

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

    // Get total professionals count
    const { count: totalProfessionalsCount } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .eq("is_active", true);

    // Fetch featured testimonials (top-rated reviews with text)
    const userIds = allProfessionals.map((user) => user.id);
    let testimonials: PublicOrgTestimonial[] = [];

    if (userIds.length > 0) {
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
          user_id
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
        // Map user and branch info to testimonials
        const userMap = new Map(
          allProfessionals.map((user) => [
            user.id,
            { id: user.id, full_name: user.full_name || "Unknown", photo_url: user.photo_url, branch_name: user.branch },
          ])
        );

        // Create a branch lookup by name
        const branchByName = new Map(
          allBranches.map((b) => [b.name, { id: b.id, name: b.name }])
        );

        testimonials = reviewsData.map((r) => {
          const user = r.user_id ? userMap.get(r.user_id) : undefined;
          const branch = user?.branch_name ? branchByName.get(user.branch_name) : null;
          return {
            id: r.id,
            customer_name: r.customer_name,
            customer_location: r.customer_location,
            rating: r.rating,
            text: r.text,
            title: r.title,
            review_date: r.review_date,
            loan_officer: user
              ? { id: user.id, full_name: user.full_name, photo_url: user.photo_url }
              : { id: r.user_id || "", full_name: "Team Member", photo_url: null },
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
          total_members: totalProfessionalsCount || 0,
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
          total_members: b.total_members,
        })),
        featuredProfessionals: allProfessionals.map((professional) => ({
          id: professional.id,
          full_name: professional.full_name || "Unknown",
          title: professional.title,
          photo_url: professional.photo_url,
          branch_name: professional.branch,
          average_rating: professional.average_rating,
          total_reviews: professional.total_reviews,
        })),
        testimonials,
      },
    };
  } catch {
    return { success: false, error: "Failed to load organization profile" };
  }
}
