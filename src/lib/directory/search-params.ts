import type { IndustryType } from "@/lib/industry/types";
import type { SearchFilters } from "./actions";

export const DIRECTORY_PAGE_SIZE = 20;

export interface DirectorySearchParams {
  q?: string | string[];
  lat?: string | string[];
  lng?: string | string[];
  place?: string | string[];
  rating?: string | string[];
  sort?: string | string[];
  page?: string | string[];
  radius?: string | string[];
}

export interface DirectorySearchRequest {
  filters: SearchFilters;
  page: number;
  pageSize: number;
  hasCoords: boolean;
  initialCoords: { lat: number; lng: number } | null;
  initialPlace: string;
  cacheKey: string;
}

export interface DirectorySearchCachePayload {
  filters: SearchFilters;
  page: number;
  pageSize: number;
}

const DIRECTORY_SORTS = new Set<NonNullable<SearchFilters["sortBy"]>>([
  "rating",
  "reviews",
  "name",
  "distance",
]);

function getFirstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseFloatParam(value: string | string[] | undefined): number | undefined {
  const raw = getFirstParam(value);
  if (!raw) return undefined;

  const parsed = Number.parseFloat(raw);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseIntParam(value: string | string[] | undefined, fallback: number): number {
  const raw = getFirstParam(value);
  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseSortParam(
  value: string | string[] | undefined
): NonNullable<SearchFilters["sortBy"]> {
  const raw = getFirstParam(value);
  return raw && DIRECTORY_SORTS.has(raw as NonNullable<SearchFilters["sortBy"]>)
    ? (raw as NonNullable<SearchFilters["sortBy"]>)
    : "rating";
}

export function createDirectorySearchCacheKey(payload: DirectorySearchCachePayload): string {
  return JSON.stringify(payload);
}

export function parseDirectorySearchCacheKey(cacheKey: string): DirectorySearchCachePayload {
  return JSON.parse(cacheKey) as DirectorySearchCachePayload;
}

export function buildDirectorySearchRequest(
  params: DirectorySearchParams,
  industry?: IndustryType
): DirectorySearchRequest {
  const searchLat = parseFloatParam(params.lat);
  const searchLng = parseFloatParam(params.lng);
  const hasCoords =
    searchLat != null && searchLng != null && !Number.isNaN(searchLat) && !Number.isNaN(searchLng);

  const filters: SearchFilters = {
    query: getFirstParam(params.q) || undefined,
    city: getFirstParam(params.place) || undefined,
    searchLat: hasCoords ? searchLat : undefined,
    searchLng: hasCoords ? searchLng : undefined,
    radius: parseIntParam(params.radius, 50),
    minRating: parseFloatParam(params.rating),
    sortBy: parseSortParam(params.sort),
    sortOrder: "desc",
    ...(industry ? { industry } : {}),
  };

  const page = parseIntParam(params.page, 1);
  const pageSize = DIRECTORY_PAGE_SIZE;

  return {
    filters,
    page,
    pageSize,
    hasCoords,
    initialCoords: hasCoords ? { lat: searchLat!, lng: searchLng! } : null,
    initialPlace: getFirstParam(params.place) || "",
    cacheKey: createDirectorySearchCacheKey({ filters, page, pageSize }),
  };
}
