"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { SPECIALTIES, LANGUAGES, US_STATES } from "./constants";

// Types
export interface DirectoryLoanOfficer {
  id: string;
  full_name: string;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  branch: string | null;
  branch_id: string | null;
  region: string | null;
  nmls_id: string | null;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;
  linkedin_url: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  specialties?: string[];
  languages?: string[];
  organization: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
}

export interface SearchFilters {
  query?: string;
  city?: string;
  state?: string;
  zip?: string;
  minRating?: number;
  specialty?: string;
  language?: string;
  sortBy?: "rating" | "reviews" | "name";
  sortOrder?: "asc" | "desc";
}

export interface DirectorySearchResult {
  loanOfficers: DirectoryLoanOfficer[];
  totalCount: number;
  facets: {
    states: { value: string; count: number }[];
    specialties: { value: string; count: number }[];
    languages: { value: string; count: number }[];
  };
}

/**
 * Search loan officers with filters
 */
export async function searchLoanOfficers(
  filters: SearchFilters,
  page = 1,
  pageSize = 20
): Promise<{ success: boolean; data?: DirectorySearchResult; error?: string }> {
  try {
    const supabase = createAdminClient();
    const offset = (page - 1) * pageSize;

    // Build the base query for fetching loan officers
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
        branch_id,
        region,
        nmls_id,
        address,
        linkedin_url,
        average_rating,
        total_reviews,
        organization_id,
        organizations (
          id,
          name,
          logo_url
        )
      `,
        { count: "exact" }
      )
      .eq("is_active", true);

    // Apply text search filter
    if (filters.query && filters.query.trim()) {
      const searchTerm = `%${filters.query.trim().toLowerCase()}%`;
      query = query.or(`full_name.ilike.${searchTerm},bio.ilike.${searchTerm},title.ilike.${searchTerm}`);
    }

    // Apply location filters
    if (filters.state) {
      query = query.filter("address->state", "eq", filters.state);
    }

    if (filters.city) {
      query = query.filter("address->city", "ilike", `%${filters.city}%`);
    }

    if (filters.zip) {
      query = query.filter("address->zip", "eq", filters.zip);
    }

    // Apply minimum rating filter
    if (filters.minRating && filters.minRating > 0) {
      query = query.gte("average_rating", filters.minRating);
    }

    // Apply sorting
    const sortBy = filters.sortBy || "rating";
    const sortOrder = filters.sortOrder || "desc";

    if (sortBy === "rating") {
      query = query.order("average_rating", {
        ascending: sortOrder === "asc",
        nullsFirst: false,
      });
    } else if (sortBy === "reviews") {
      query = query.order("total_reviews", {
        ascending: sortOrder === "asc",
        nullsFirst: false,
      });
    } else if (sortBy === "name") {
      query = query.order("full_name", { ascending: sortOrder === "asc" });
    }

    // Secondary sort by name for consistent ordering
    if (sortBy !== "name") {
      query = query.order("full_name", { ascending: true });
    }

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error("Directory search error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return { success: false, error: "Failed to search loan officers" };
    }

    // Transform data to match our interface
    const loanOfficers: DirectoryLoanOfficer[] = (data || []).map((lo) => {
      const org = lo.organizations as { id: string; name: string; logo_url: string | null } | null;
      return {
        id: lo.id,
        full_name: lo.full_name,
        title: lo.title,
        bio: lo.bio,
        photo_url: lo.photo_url,
        email: lo.email,
        phone: lo.phone,
        branch: lo.branch,
        branch_id: lo.branch_id,
        region: lo.region,
        nmls_id: lo.nmls_id,
        address: lo.address as DirectoryLoanOfficer["address"],
        linkedin_url: lo.linkedin_url,
        average_rating: lo.average_rating,
        total_reviews: lo.total_reviews,
        organization: org,
      };
    });

    // Get facets for filtering - states
    const { data: stateData } = await supabase
      .from("loan_officers")
      .select("address")
      .eq("is_active", true);

    const stateCounts = new Map<string, number>();
    (stateData || []).forEach((lo) => {
      const addr = lo.address as { state?: string } | null;
      if (addr?.state) {
        stateCounts.set(addr.state, (stateCounts.get(addr.state) || 0) + 1);
      }
    });

    const states = Array.from(stateCounts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);

    return {
      success: true,
      data: {
        loanOfficers,
        totalCount: count || 0,
        facets: {
          states,
          // Specialties and languages would come from LO profile settings
          // For now, we'll return the predefined list
          specialties: SPECIALTIES.map((s) => ({ value: s, count: 0 })),
          languages: LANGUAGES.map((l) => ({ value: l, count: 0 })),
        },
      },
    };
  } catch (error) {
    console.error("Directory search error:", error instanceof Error ? error.message : error);
    return { success: false, error: "Failed to search loan officers" };
  }
}

/**
 * Get unique states with loan officers for the filter dropdown
 */
export async function getAvailableStates(): Promise<{ value: string; label: string }[]> {
  try {
    const supabase = createAdminClient();

    const { data } = await supabase
      .from("loan_officers")
      .select("address")
      .eq("is_active", true);

    const stateSet = new Set<string>();
    (data || []).forEach((lo) => {
      const addr = lo.address as { state?: string } | null;
      if (addr?.state) {
        stateSet.add(addr.state);
      }
    });

    return Array.from(stateSet)
      .sort()
      .map((code) => ({
        value: code,
        label: US_STATES[code] || code,
      }));
  } catch {
    return [];
  }
}
