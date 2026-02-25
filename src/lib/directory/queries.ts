import { cache } from "react";
import { cacheLife } from "next/cache";
import { cacheTag } from "next/cache";
import {
  searchProfessionals,
  getAvailableIndustries,
  type SearchFilters,
} from "./actions";

/**
 * Request-level dedup for searchProfessionals via React.cache().
 * Both the parent (structured data) and child (search UI) components
 * call this — only one DB query executes per request.
 */
export const deduplicatedSearch = cache(searchProfessionals);

/**
 * Cross-request cached wrapper for available industries.
 * Industries rarely change — cache for hours.
 */
export async function getCachedAvailableIndustries() {
  "use cache";
  cacheLife("hours");
  cacheTag("directory-industries");
  return getAvailableIndustries();
}

// Re-export types for convenience
export type { SearchFilters };
