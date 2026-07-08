import { DirectorySearch } from "@/components/directory/directory-search";
import { cachedSearchProfessionals } from "@/lib/directory/cached";
import type { DirectorySearchRequest } from "@/lib/directory/search-params";
import type { IndustryType } from "@/lib/industry/types";

interface DirectorySearchContentProps {
  searchRequest: DirectorySearchRequest;
  industry?: IndustryType;
}

export async function DirectorySearchContent({
  searchRequest,
  industry,
}: DirectorySearchContentProps) {
  const searchResult = await cachedSearchProfessionals(
    searchRequest.filters,
    searchRequest.page,
    searchRequest.pageSize
  );

  const initialResults = searchResult.success ? searchResult.data?.professionals || [] : [];
  const initialCount = searchResult.success ? searchResult.data?.totalCount || 0 : 0;

  return (
    <DirectorySearch
      initialResults={initialResults}
      initialCount={initialCount}
      industryFilter={industry}
      initialCoords={searchRequest.initialCoords}
      initialPlace={searchRequest.initialPlace}
    />
  );
}
