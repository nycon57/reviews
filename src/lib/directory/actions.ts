"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { SPECIALTIES, LANGUAGES } from "./constants";
import type { IndustryType } from "@/lib/industry/types";
import { applyPublicProfessionalFilters } from "@/lib/users/public-visibility";
import { sanitizePublicAddress } from "./public-sanitizers";

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
  /** Whether this professional has a Pro-tier subscription (enterprise OR professional plan) */
  is_pro: boolean;
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
  sortBy?: "rating" | "reviews" | "name" | "distance";
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
  /** Center point of a radius search for map positioning */
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
  branch,
  branch_id,
  nmls_id,
  address,
  linkedin_url,
  average_rating,
  total_reviews,
  latitude,
  longitude,
  organization_id,
  role,
  organizations!inner (
    id,
    name,
    slug,
    logo_url,
    account_type,
    subscription_tier
  ),
  branches!users_branch_id_fkey (
    id,
    name,
    latitude,
    longitude,
    address
  )
` as const;

/** Base query for professionals eligible to appear in the public directory. */
function publicProfessionalsQuery(supabase: ReturnType<typeof createAdminClient>) {
  return applyPublicProfessionalFilters(supabase.from("users").select(PROFESSIONAL_SELECT));
}

/** Row shape PROFESSIONAL_SELECT returns, derived so it tracks the select string. */
type ProfessionalRow = NonNullable<
  Awaited<ReturnType<typeof publicProfessionalsQuery>>["data"]
>[number];

/**
 * Enterprise admins are org account managers — hide from directory.
 * Individual admins ARE the professionals themselves — keep them.
 */
function isEnterpriseAdmin(record: ProfessionalRow): boolean {
  if (record.role !== "admin") return false;
  return record.organizations?.account_type === "enterprise";
}

async function requireDirectoryMaintenanceAccess(): Promise<boolean> {
  const { isPlatformAdmin } = await import("@/lib/auth/actions");
  return isPlatformAdmin();
}

/** Transform a raw DB record into a DirectoryProfessional */
function transformRecord(
  record: ProfessionalRow,
  distanceMiles?: number
): DirectoryProfessional {
  const org = record.organizations;
  const branchData = record.branches;

  const branchInfo: DirectoryProfessional["branch_info"] = branchData
    ? {
        ...branchData,
        // SAFETY: `branches.address` is a jsonb column, so the generated type is
        // `Json`. Consumers read only the optional street/city/state/postal_code
        // strings the branch editor writes, and tolerate any of them missing.
        address: branchData.address as NonNullable<
          DirectoryProfessional["branch_info"]
        >["address"],
      }
    : null;

  const effectiveLatitude = branchData?.latitude ?? record.latitude;
  const effectiveLongitude = branchData?.longitude ?? record.longitude;

  const effectiveOrg = org
    ? { id: org.id, name: org.name, slug: org.slug, logo_url: org.logo_url, industry: null }
    : null;

  // SAFETY: `users.address` is a jsonb column, so the generated type is `Json`.
  // sanitizePublicAddress reads only optional city/state and returns null when
  // neither is present, so a differently shaped payload degrades to null.
  const safeAddress = sanitizePublicAddress(record.address as DirectoryProfessional["address"]);

  return {
    id: record.id,
    slug: record.slug,
    full_name: record.full_name || "Unknown",
    title: record.title,
    bio: record.bio,
    photo_url: record.photo_url,
    email: null,
    phone: null,
    branch: record.branch,
    branch_id: record.branch_id,
    nmls_id: record.nmls_id,
    address: safeAddress,
    linkedin_url: record.linkedin_url,
    average_rating: record.average_rating,
    total_reviews: record.total_reviews,
    latitude: effectiveLatitude,
    longitude: effectiveLongitude,
    organization: effectiveOrg,
    branch_info: branchInfo,
    is_enterprise: org?.account_type === "enterprise",
    is_pro:
      org?.account_type === "enterprise" ||
      ["professional", "pro"].includes(org?.subscription_tier ?? ""),
    distance_miles: distanceMiles,
  };
}

/**
 * Search professionals with filters.
 *
 * When searchLat/searchLng are provided (from Google Places Autocomplete),
 * uses the `search_professionals_by_radius` RPC for fast geo search.
 * Otherwise falls back to standard ILIKE search on name/bio/title.
 */
export async function searchProfessionals(
  filters: SearchFilters,
  page = 1,
  pageSize = 20
): Promise<{ success: boolean; data?: DirectorySearchResult; error?: string }> {
  try {
    const supabase = createAdminClient();
    const offset = (page - 1) * pageSize;

    // ---------- RADIUS SEARCH (Google Places Autocomplete path) ----------
    if (filters.searchLat != null && filters.searchLng != null) {
      const radius = filters.radius || 50;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: radiusData, error: rpcError } = (await (supabase.rpc as any)(
        "search_professionals_by_radius",
        {
          search_lat: filters.searchLat,
          search_lng: filters.searchLng,
          radius_miles: radius,
        }
      )) as { data: { user_id: string; distance_miles: number }[] | null; error: unknown };

      if (rpcError) {
        console.error("Radius search RPC error:", rpcError);
        return { success: false, error: "Failed to search by location" };
      }

      if (radiusData && radiusData.length > 0) {
        const distanceMap = new Map<string, number>();
        const radiusIds: string[] = [];
        for (const r of radiusData) {
          radiusIds.push(r.user_id);
          distanceMap.set(r.user_id, r.distance_miles);
        }

        let radiusQuery = publicProfessionalsQuery(supabase).in("id", radiusIds);

        if (filters.organizationId)
          radiusQuery = radiusQuery.eq("organization_id", filters.organizationId);
        // Industry filtering handled at the page level via industryFilter prop
        if (filters.query?.trim()) {
          const searchTerm = `%${filters.query.trim().toLowerCase()}%`;
          radiusQuery = radiusQuery.or(
            `full_name.ilike.${searchTerm},bio.ilike.${searchTerm},title.ilike.${searchTerm}`
          );
        }
        if (filters.minRating && filters.minRating > 0)
          radiusQuery = radiusQuery.gte("average_rating", filters.minRating);

        const { data: radiusProfs } = await radiusQuery;

        const professionals = (radiusProfs || [])
          .filter((r) => !isEnterpriseAdmin(r))
          .map((r) => transformRecord(r, distanceMap.get(r.id)))
          .sort((a, b) => {
            const sort = filters.sortBy || "distance";
            if (sort === "rating") return (b.average_rating ?? 0) - (a.average_rating ?? 0);
            if (sort === "reviews") return (b.total_reviews ?? 0) - (a.total_reviews ?? 0);
            if (sort === "name") return a.full_name.localeCompare(b.full_name);
            return (a.distance_miles ?? Infinity) - (b.distance_miles ?? Infinity);
          });

        const totalCount = professionals.length;
        const paged = professionals.slice(offset, offset + pageSize);

        const facets = await buildFacets(supabase);
        return {
          success: true,
          data: {
            professionals: paged,
            totalCount,
            facets,
            searchCenter: {
              lat: filters.searchLat,
              lng: filters.searchLng,
              label: filters.city || "Selected location",
            },
          },
        };
      }

      // Radius search returned 0 results
      const facets = await buildFacets(supabase);
      return {
        success: true,
        data: {
          professionals: [],
          totalCount: 0,
          facets,
          searchCenter: {
            lat: filters.searchLat,
            lng: filters.searchLng,
            label: filters.city || "Selected location",
          },
        },
      };
    }

    // ---------- STANDARD ILIKE SEARCH (name/bio/title) ----------
    let query = applyPublicProfessionalFilters(
      supabase.from("users").select(PROFESSIONAL_SELECT, { count: "exact" })
    );

    if (filters.organizationId) {
      query = query.eq("organization_id", filters.organizationId);
    }

    if (filters.query?.trim()) {
      const searchTerm = `%${filters.query.trim().toLowerCase()}%`;
      query = query.or(
        `full_name.ilike.${searchTerm},bio.ilike.${searchTerm},title.ilike.${searchTerm}`
      );
    }

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
      .filter((r) => !isEnterpriseAdmin(r))
      .map((r) => transformRecord(r));

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

    const accurateCount = filters.bounds ? professionals.length : count || 0;

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
  const { data: stateData } = await applyPublicProfessionalFilters(
    supabase.from("users").select("address, organizations!inner(account_type)")
  );

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
export async function searchLoanOfficers(filters: SearchFilters, page = 1, pageSize = 20) {
  return searchProfessionals(filters, page, pageSize);
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
    if (!(await requireDirectoryMaintenanceAccess())) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = createAdminClient();

    const { error } = await supabase.from("users").update({ latitude, longitude }).eq("id", id);

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
export async function updateLoanOfficerCoordinates(
  id: string,
  latitude: number,
  longitude: number
) {
  return updateUserCoordinates(id, latitude, longitude);
}

/**
 * Batch geocode users that don't have coordinates
 * This is intended for initial data migration
 */
export async function batchGeocodeUsers(
  limit = 10
): Promise<{ success: boolean; processed: number; error?: string }> {
  if (!(await requireDirectoryMaintenanceAccess())) {
    return { success: false, processed: 0, error: "Unauthorized" };
  }

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

      const result = await geocodeAddressWithFallback(addr.street, addr.city, addr.state, addr.zip);

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
export async function batchGeocodeLoanOfficers(limit = 10) {
  return batchGeocodeUsers(limit);
}

/**
 * Batch geocode branches that don't have coordinates
 * This is the preferred method as branches are fewer than users
 */
export async function batchGeocodeBranches(
  limit = 10
): Promise<{ success: boolean; processed: number; error?: string }> {
  if (!(await requireDirectoryMaintenanceAccess())) {
    return { success: false, processed: 0, error: "Unauthorized" };
  }

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
    const { data } = await applyPublicProfessionalFilters(
      supabase.from("users").select(
        `
          id,
          organizations!inner (
            industry
          )
        `
      )
    );

    if (!data) return [];

    // Count by industry
    const industryCounts = new Map<IndustryType, number>();
    for (const record of data) {
      const value = record.organizations?.industry;
      if (value) {
        // SAFETY: `organizations.industry` is text in the generated types, but the
        // `organizations_industry_check` constraint (migration 20240101000032)
        // restricts stored values to exactly the IndustryType union.
        const industry = value as IndustryType;
        industryCounts.set(industry, (industryCounts.get(industry) || 0) + 1);
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
