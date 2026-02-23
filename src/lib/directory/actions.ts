"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { SPECIALTIES, LANGUAGES, US_STATES } from "./constants";
import type { IndustryType } from "@/lib/industry/types";

// Types
export interface DirectoryProfessional {
  id: string;
  slug: string | null;
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
    slug: string;
    logo_url: string | null;
    industry: IndustryType | null;
  } | null;
  /** Branch info with coordinates and address for map display */
  branch_info: {
    id: string;
    name: string;
    latitude: number | null;
    longitude: number | null;
    address: {
      street?: string;
      city?: string;
      state?: string;
      postal_code?: string;
    } | null;
  } | null;
  /** Whether this professional belongs to an enterprise organization */
  is_enterprise: boolean;
  /** Distance in miles from the search center (only set for radius/fallback searches) */
  distance_miles?: number;
}

/** @deprecated Use DirectoryProfessional instead */
export type DirectoryLoanOfficer = DirectoryProfessional;

/** Geographic bounds for map-based filtering */
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
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
  /** Filter by industry type */
  industry?: IndustryType;
  /** Filter by organization ID */
  organizationId?: string;
  /** Filter by geographic bounds (for map view) */
  bounds?: MapBounds;
  /** Radius in miles for nearby search (10, 25, 50, 100) */
  radius?: number;
  /** Geocoded center latitude for radius search */
  searchLat?: number;
  /** Geocoded center longitude for radius search */
  searchLng?: number;
}

export interface DirectorySearchResult {
  professionals: DirectoryProfessional[];
  totalCount: number;
  facets: {
    states: { value: string; count: number }[];
    specialties: { value: string; count: number }[];
    languages: { value: string; count: number }[];
  };
  /** When set, the search fell back to nearby results via geocoding */
  isNearbyFallback?: boolean;
  /** Center point of a radius/fallback search for map positioning */
  searchCenter?: { lat: number; lng: number; label: string };
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

// Shared select columns for the users query
const PROFESSIONAL_SELECT = `
  id,
  slug,
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
  individual_organization_id,
  role,
  organizations (
    id,
    name,
    slug,
    logo_url,
    account_type
  ),
  branches!users_branch_id_fkey (
    id,
    name,
    latitude,
    longitude,
    address
  ),
  individual_organizations (
    id,
    name,
    slug
  )
` as const;

/** Transform a raw DB record into a DirectoryProfessional */
function transformRecord(
  record: Record<string, unknown>,
  distanceMiles?: number
): DirectoryProfessional {
  const org = record.organizations as {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    account_type: string | null;
  } | null;
  const indivOrg = record.individual_organizations as {
    id: string;
    name: string;
    slug: string;
  } | null;
  const branchData = record.branches as {
    id: string;
    name: string;
    latitude: number | null;
    longitude: number | null;
    address: {
      street?: string;
      city?: string;
      state?: string;
      postal_code?: string;
    } | null;
  } | null;

  const effectiveLatitude = branchData?.latitude ?? (record.latitude as number | null);
  const effectiveLongitude = branchData?.longitude ?? (record.longitude as number | null);

  const effectiveOrg = org
    ? { id: org.id, name: org.name, slug: org.slug, logo_url: org.logo_url, industry: null }
    : indivOrg
      ? { id: indivOrg.id, name: indivOrg.name, slug: indivOrg.slug, logo_url: null, industry: null }
      : null;

  return {
    id: record.id as string,
    slug: record.slug as string | null,
    full_name: (record.full_name as string) || "Unknown",
    title: record.title as string | null,
    bio: record.bio as string | null,
    photo_url: record.photo_url as string | null,
    email: record.email as string | null,
    phone: record.phone as string | null,
    branch: record.branch as string | null,
    branch_id: record.branch_id as string | null,
    region: record.region as string | null,
    nmls_id: record.nmls_id as string | null,
    address: record.address as DirectoryProfessional["address"],
    linkedin_url: record.linkedin_url as string | null,
    average_rating: record.average_rating as number | null,
    total_reviews: record.total_reviews as number | null,
    latitude: effectiveLatitude,
    longitude: effectiveLongitude,
    organization: effectiveOrg,
    branch_info: branchData,
    is_enterprise: org?.account_type === "enterprise",
    distance_miles: distanceMiles,
  };
}

/** Haversine distance in miles between two lat/lng points */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 3959 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Search professionals with filters.
 *
 * Uses a two-pass strategy:
 * 1. Standard ILIKE search (fast, exact matching)
 * 2. If pass 1 returns 0 results and a city was searched, fall back to:
 *    a. Fuzzy city match via pg_trgm
 *    b. Geocode city → radius search for nearest professionals
 */
export async function searchProfessionals(
  filters: SearchFilters,
  page = 1,
  pageSize = 20
): Promise<{ success: boolean; data?: DirectorySearchResult; error?: string }> {
  try {
    const supabase = createAdminClient();
    const offset = (page - 1) * pageSize;

    // ---------- PASS 1: Standard ILIKE search ----------
    let query = supabase
      .from("users")
      .select(PROFESSIONAL_SELECT, { count: "exact" })
      .eq("is_active", true);

    if (filters.organizationId) {
      query = query.eq("organization_id", filters.organizationId);
    }

    if (filters.query?.trim()) {
      const searchTerm = `%${filters.query.trim().toLowerCase()}%`;
      query = query.or(`full_name.ilike.${searchTerm},bio.ilike.${searchTerm},title.ilike.${searchTerm}`);
    }

    // Note: city and state filters are applied post-fetch because city/state may
    // live on the branch rather than the user. We check both below after transform.
    if (filters.zip) {
      query = query.filter("address->>zip", "eq", filters.zip);
    }

    if (filters.minRating && filters.minRating > 0) {
      query = query.gte("average_rating", filters.minRating);
    }

    // Apply sorting
    const sortBy = filters.sortBy || "rating";
    const sortOrder = filters.sortOrder || "desc";

    if (sortBy === "rating") {
      query = query.order("average_rating", { ascending: sortOrder === "asc", nullsFirst: false });
    } else if (sortBy === "reviews") {
      query = query.order("total_reviews", { ascending: sortOrder === "asc", nullsFirst: false });
    } else if (sortBy === "name") {
      query = query.order("full_name", { ascending: sortOrder === "asc" });
    }

    if (sortBy !== "name") {
      query = query.order("full_name", { ascending: true });
    }

    // Exclude admin role at DB level (enterprise admins should not appear in directory)
    query = query.neq("role", "admin");

    query = query.range(offset, offset + pageSize - 1);

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

    let professionals: DirectoryProfessional[] = (data || [])
      .map((r) => transformRecord(r as unknown as Record<string, unknown>));

    // Apply geographic bounds filter post-fetch using effective coordinates
    if (filters.bounds) {
      professionals = professionals.filter((p) => {
        if (p.latitude == null || p.longitude == null) return false;
        return (
          p.latitude >= filters.bounds!.south &&
          p.latitude <= filters.bounds!.north &&
          p.longitude >= filters.bounds!.west &&
          p.longitude <= filters.bounds!.east
        );
      });
    }

    // When bounds filter is applied post-fetch, DB count is inaccurate; use filtered length
    const accurateCount = filters.bounds ? professionals.length : (count || 0);

    // ---------- PASS 2: Fuzzy / Radius fallback ----------
    // Trigger when pass 1 returned 0 results AND a city was searched
    let isNearbyFallback = false;
    let searchCenter: { lat: number; lng: number; label: string } | undefined;

    if (professionals.length === 0 && filters.city && !filters.bounds) {
      // 2a. Try fuzzy city match via pg_trgm (gracefully skipped if extension not installed)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: fuzzyIds, error: fuzzyError } = await (supabase.rpc as any)("search_users_by_fuzzy_city", {
          search_city: filters.city,
          similarity_threshold: 0.3,
        }) as { data: { user_id: string; similarity_score: number }[] | null; error: unknown };

        if (!fuzzyError && fuzzyIds && fuzzyIds.length > 0) {
          const matchedIds = fuzzyIds.map((r) => r.user_id);

          let fuzzyQuery = supabase
            .from("users")
            .select(PROFESSIONAL_SELECT, { count: "exact" })
            .eq("is_active", true)
            .in("id", matchedIds);

          if (filters.organizationId) fuzzyQuery = fuzzyQuery.eq("organization_id", filters.organizationId);
          if (filters.query?.trim()) {
            const searchTerm = `%${filters.query.trim().toLowerCase()}%`;
            fuzzyQuery = fuzzyQuery.or(`full_name.ilike.${searchTerm},bio.ilike.${searchTerm},title.ilike.${searchTerm}`);
          }
          if (filters.state) fuzzyQuery = fuzzyQuery.filter("address->>state", "eq", filters.state);
          if (filters.minRating && filters.minRating > 0) fuzzyQuery = fuzzyQuery.gte("average_rating", filters.minRating);
          fuzzyQuery = fuzzyQuery.neq("role", "admin");

          if (sortBy === "rating") {
            fuzzyQuery = fuzzyQuery.order("average_rating", { ascending: sortOrder === "asc", nullsFirst: false });
          } else if (sortBy === "reviews") {
            fuzzyQuery = fuzzyQuery.order("total_reviews", { ascending: sortOrder === "asc", nullsFirst: false });
          } else if (sortBy === "name") {
            fuzzyQuery = fuzzyQuery.order("full_name", { ascending: sortOrder === "asc" });
          }
          if (sortBy !== "name") {
            fuzzyQuery = fuzzyQuery.order("full_name", { ascending: true });
          }
          fuzzyQuery = fuzzyQuery.range(offset, offset + pageSize - 1);

          const { data: fuzzyData, count: fuzzyCount } = await fuzzyQuery;

          const fuzzyProfessionals = (fuzzyData || [])
            .map((r) => transformRecord(r as unknown as Record<string, unknown>));

          if (fuzzyProfessionals.length > 0) {
            isNearbyFallback = true;
            professionals = fuzzyProfessionals;

            const facets = await buildFacets(supabase);
            return {
              success: true,
              data: {
                professionals,
                totalCount: Math.max(0, fuzzyCount || fuzzyProfessionals.length),
                facets,
                isNearbyFallback,
              },
            };
          }
        }
      } catch {
        // pg_trgm extension or RPC not available — skip fuzzy, fall through to geocoding
      }

      // 2b. Geocode city → radius search (works with or without DB RPC)
      const { geocodeAddress } = await import("./geocoding");
      const coords = await geocodeAddress(undefined, filters.city, filters.state);

      if (coords) {
        const radius = filters.radius || 50;

        // Try DB-level radius search first (fast, uses Haversine RPC)
        let radiusResults: { userId: string; distance: number }[] | null = null;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: radiusData, error: rpcError } = await (supabase.rpc as any)("search_professionals_by_radius", {
            search_lat: coords.latitude,
            search_lng: coords.longitude,
            radius_miles: radius,
          }) as { data: { user_id: string; distance_miles: number }[] | null; error: unknown };

          if (!rpcError && radiusData && radiusData.length > 0) {
            radiusResults = radiusData.map((r) => ({ userId: r.user_id, distance: r.distance_miles }));
          }
        } catch {
          // RPC not available — fall through to JS-level Haversine
        }

        // Fallback: JS-level Haversine on all professionals with coordinates
        if (!radiusResults) {
          let allQuery = supabase
            .from("users")
            .select(PROFESSIONAL_SELECT)
            .eq("is_active", true)
            .neq("role", "admin")
            .not("latitude", "is", null);

          if (filters.organizationId) allQuery = allQuery.eq("organization_id", filters.organizationId);
          if (filters.query?.trim()) {
            const searchTerm = `%${filters.query.trim().toLowerCase()}%`;
            allQuery = allQuery.or(`full_name.ilike.${searchTerm},bio.ilike.${searchTerm},title.ilike.${searchTerm}`);
          }
          if (filters.minRating && filters.minRating > 0) allQuery = allQuery.gte("average_rating", filters.minRating);

          const { data: allProfs } = await allQuery;

          if (allProfs && allProfs.length > 0) {
            radiusResults = [];
            for (const r of allProfs) {
              const rec = r as unknown as Record<string, unknown>;
              const branchData = rec.branches as { latitude: number | null; longitude: number | null } | null;
              const lat = branchData?.latitude ?? (rec.latitude as number | null);
              const lng = branchData?.longitude ?? (rec.longitude as number | null);
              if (lat == null || lng == null) continue;

              const dist = haversineDistance(coords.latitude, coords.longitude, lat, lng);
              if (dist <= radius) {
                radiusResults.push({ userId: rec.id as string, distance: dist });
              }
            }
            radiusResults.sort((a, b) => a.distance - b.distance);
          }
        }

        if (radiusResults && radiusResults.length > 0) {
          const distanceMap = new Map<string, number>();
          const radiusIds: string[] = [];
          for (const r of radiusResults) {
            radiusIds.push(r.userId);
            distanceMap.set(r.userId, r.distance);
          }

          let radiusQuery = supabase
            .from("users")
            .select(PROFESSIONAL_SELECT)
            .eq("is_active", true)
            .in("id", radiusIds);

          if (filters.organizationId) radiusQuery = radiusQuery.eq("organization_id", filters.organizationId);
          if (filters.query?.trim()) {
            const searchTerm = `%${filters.query.trim().toLowerCase()}%`;
            radiusQuery = radiusQuery.or(`full_name.ilike.${searchTerm},bio.ilike.${searchTerm},title.ilike.${searchTerm}`);
          }
          if (filters.minRating && filters.minRating > 0) radiusQuery = radiusQuery.gte("average_rating", filters.minRating);
          radiusQuery = radiusQuery.neq("role", "admin");

          const { data: radiusProfs } = await radiusQuery;

          professionals = (radiusProfs || [])
            .map((r) => {
              const id = (r as unknown as Record<string, unknown>).id as string;
              return transformRecord(r as unknown as Record<string, unknown>, distanceMap.get(id));
            })
            .sort((a, b) => (a.distance_miles ?? Infinity) - (b.distance_miles ?? Infinity))
            .slice(offset, offset + pageSize);

          isNearbyFallback = true;
          searchCenter = { lat: coords.latitude, lng: coords.longitude, label: filters.city };

          const facets = await buildFacets(supabase);
          return {
            success: true,
            data: {
              professionals,
              totalCount: professionals.length,
              facets,
              isNearbyFallback,
              searchCenter,
            },
          };
        }
      }
    }

    // ---------- Standard result path (pass 1 had results, or fallback had nothing) ----------

    const facets = await buildFacets(supabase);

    return {
      success: true,
      data: {
        professionals,
        totalCount: accurateCount,
        facets,
      },
    };
  } catch (error) {
    console.error("Directory search error:", error instanceof Error ? error.message : error);
    return { success: false, error: "Failed to search professionals" };
  }
}

/** Build standard facets (states, specialties, languages) */
async function buildFacets(supabase: ReturnType<typeof createAdminClient>) {
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
    states,
    specialties: SPECIALTIES.map((s) => ({ value: s, count: 0 })),
    languages: LANGUAGES.map((l) => ({ value: l, count: 0 })),
  };
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

/**
 * Batch geocode branches that don't have coordinates
 * This is the preferred method as branches are fewer than users
 */
export async function batchGeocodeBranches(
  limit = 10
): Promise<{ success: boolean; processed: number; error?: string }> {
  // Import geocoding at runtime to avoid circular dependencies
  const { geocodeAddressWithFallback } = await import("./geocoding");

  try {
    const supabase = createAdminClient();

    // Get branches without coordinates
    const { data: branches, error: fetchError } = await supabase
      .from("branches")
      .select("id, address")
      .eq("is_active", true)
      .is("latitude", null)
      .limit(limit);

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return { success: false, processed: 0, error: "Failed to fetch branches" };
    }

    if (!branches?.length) {
      return { success: true, processed: 0 };
    }

    let processed = 0;

    for (const branch of branches) {
      const addr = branch.address as {
        street?: string;
        city?: string;
        state?: string;
        postal_code?: string;
      } | null;

      if (!addr) continue;

      const result = await geocodeAddressWithFallback(
        addr.street,
        addr.city,
        addr.state,
        addr.postal_code
      );

      if (result) {
        const { error: updateError } = await supabase
          .from("branches")
          .update({
            latitude: result.latitude,
            longitude: result.longitude,
          })
          .eq("id", branch.id);

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
    return { success: false, processed: 0, error: "Failed to geocode branches" };
  }
}

/**
 * Get industries with professional counts for the filter
 */
export async function getAvailableIndustries(): Promise<
  { value: IndustryType; label: string; count: number }[]
> {
  try {
    const supabase = createAdminClient();

    // Get all active professionals with their organization's industry
    const { data } = await supabase
      .from("users")
      .select(
        `
        id,
        organizations!inner (
          industry
        )
      `
      )
      .eq("is_active", true);

    if (!data) return [];

    // Count by industry
    const industryCounts = new Map<IndustryType, number>();
    for (const record of data) {
      const org = record.organizations as unknown as { industry: IndustryType | null } | null;
      if (org?.industry) {
        industryCounts.set(org.industry, (industryCounts.get(org.industry) || 0) + 1);
      }
    }

    // Industry display labels
    const industryLabels: Record<IndustryType, string> = {
      mortgage: "Mortgage",
      real_estate: "Real Estate",
      insurance: "Insurance",
      financial_advisory: "Financial Advisory",
      healthcare: "Healthcare",
      home_services: "Home Services",
      legal: "Legal",
      consulting: "Consulting",
    };

    return Array.from(industryCounts.entries())
      .map(([value, count]) => ({
        value,
        label: industryLabels[value] || value,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
}
