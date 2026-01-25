"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { SPECIALTIES, LANGUAGES, US_STATES } from "./constants";

// Types
export interface DirectoryProfessional {
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
  latitude: number | null;
  longitude: number | null;
  specialties?: string[];
  languages?: string[];
  organization: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
}

/** @deprecated Use DirectoryProfessional instead */
export type DirectoryLoanOfficer = DirectoryProfessional;

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
  professionals: DirectoryProfessional[];
  totalCount: number;
  facets: {
    states: { value: string; count: number }[];
    specialties: { value: string; count: number }[];
    languages: { value: string; count: number }[];
  };
}

/** @deprecated Use DirectorySearchResult.professionals instead */
export interface LegacyDirectorySearchResult {
  loanOfficers: DirectoryProfessional[];
  totalCount: number;
  facets: {
    states: { value: string; count: number }[];
    specialties: { value: string; count: number }[];
    languages: { value: string; count: number }[];
  };
}

/**
 * Search professionals with filters
 */
export async function searchProfessionals(
  filters: SearchFilters,
  page = 1,
  pageSize = 20
): Promise<{ success: boolean; data?: DirectorySearchResult; error?: string }> {
  try {
    const supabase = createAdminClient();
    const offset = (page - 1) * pageSize;

    // Build the base query for fetching professionals
    let query = supabase
      .from("users")
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
        latitude,
        longitude,
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
      return { success: false, error: "Failed to search professionals" };
    }

    // Transform data to match our interface
    const professionals: DirectoryProfessional[] = (data || []).map((record) => {
      const org = record.organizations as { id: string; name: string; logo_url: string | null } | null;
      return {
        id: record.id,
        full_name: record.full_name || 'Unknown',
        title: record.title,
        bio: record.bio,
        photo_url: record.photo_url,
        email: record.email,
        phone: record.phone,
        branch: record.branch,
        branch_id: record.branch_id,
        region: record.region,
        nmls_id: record.nmls_id,
        address: record.address as DirectoryProfessional["address"],
        linkedin_url: record.linkedin_url,
        average_rating: record.average_rating,
        total_reviews: record.total_reviews,
        latitude: record.latitude,
        longitude: record.longitude,
        organization: org,
      };
    });

    // Get facets for filtering - states
    const { data: stateData } = await supabase
      .from("users")
      .select("address")
      .eq("is_active", true);

    const stateCounts = new Map<string, number>();
    (stateData || []).forEach((record) => {
      const addr = record.address as { state?: string } | null;
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
        professionals,
        totalCount: count || 0,
        facets: {
          states,
          // Specialties and languages would come from user profile settings
          // For now, we'll return the predefined list
          specialties: SPECIALTIES.map((s) => ({ value: s, count: 0 })),
          languages: LANGUAGES.map((l) => ({ value: l, count: 0 })),
        },
      },
    };
  } catch (error) {
    console.error("Directory search error:", error instanceof Error ? error.message : error);
    return { success: false, error: "Failed to search professionals" };
  }
}

/** @deprecated Use searchProfessionals instead */
export const searchLoanOfficers = searchProfessionals;

/**
 * Get unique states with professionals for the filter dropdown
 */
export async function getAvailableStates(): Promise<{ value: string; label: string }[]> {
  try {
    const supabase = createAdminClient();

    const { data } = await supabase
      .from("users")
      .select("address")
      .eq("is_active", true);

    const stateSet = new Set<string>();
    (data || []).forEach((record) => {
      const addr = record.address as { state?: string } | null;
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

/**
 * Update a professional's coordinates
 */
export async function updateUserCoordinates(
  id: string,
  latitude: number,
  longitude: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("users")
      .update({ latitude, longitude })
      .eq("id", id);

    if (error) {
      console.error("Update coordinates error:", error);
      return { success: false, error: "Failed to update coordinates" };
    }

    return { success: true };
  } catch (error) {
    console.error("Update coordinates error:", error instanceof Error ? error.message : error);
    return { success: false, error: "Failed to update coordinates" };
  }
}

/** @deprecated Use updateUserCoordinates instead */
export const updateLoanOfficerCoordinates = updateUserCoordinates;

/**
 * Batch geocode users that don't have coordinates
 * This is intended for initial data migration
 */
export async function batchGeocodeUsers(
  limit = 10
): Promise<{ success: boolean; processed: number; error?: string }> {
  // Import geocoding at runtime to avoid circular dependencies
  const { geocodeAddressWithFallback } = await import("./geocoding");

  try {
    const supabase = createAdminClient();

    // Get users without coordinates
    const { data: users, error: fetchError } = await supabase
      .from("users")
      .select("id, address")
      .eq("is_active", true)
      .is("latitude", null)
      .limit(limit);

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return { success: false, processed: 0, error: "Failed to fetch users" };
    }

    if (!users?.length) {
      return { success: true, processed: 0 };
    }

    let processed = 0;

    for (const user of users) {
      const addr = user.address as {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
      } | null;

      if (!addr) continue;

      const result = await geocodeAddressWithFallback(
        addr.street,
        addr.city,
        addr.state,
        addr.zip
      );

      if (result) {
        const { error: updateError } = await supabase
          .from("users")
          .update({
            latitude: result.latitude,
            longitude: result.longitude,
          })
          .eq("id", user.id);

        if (!updateError) {
          processed++;
        }
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return { success: true, processed };
  } catch (error) {
    console.error("Batch geocode error:", error instanceof Error ? error.message : error);
    return { success: false, processed: 0, error: "Failed to geocode users" };
  }
}

/** @deprecated Use batchGeocodeUsers instead */
export const batchGeocodeLoanOfficers = batchGeocodeUsers;
