import { cache } from "react";

import { getAvailableIndustries, searchProfessionals } from "@/lib/directory/actions";
import { parseDirectorySearchCacheKey } from "./search-params";

function shouldLogDirectoryCacheReads(): boolean {
  return process.env.REPWELL_DIRECTORY_CACHE_DEBUG === "1";
}

export const cachedSearchProfessionals = cache(async (cacheKey: string) => {
  if (shouldLogDirectoryCacheReads()) {
    console.info(`[directory-cache] searchProfessionals ${cacheKey}`);
  }

  const { filters, page, pageSize } = parseDirectorySearchCacheKey(cacheKey);
  return searchProfessionals(filters, page, pageSize);
});

export const cachedGetAvailableIndustries = cache(async () => {
  if (shouldLogDirectoryCacheReads()) {
    console.info("[directory-cache] getAvailableIndustries");
  }

  return getAvailableIndustries();
});
