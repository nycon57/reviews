import type { NextRequest } from "next/server";
import {
  apiV2Error,
  apiV2Paginated,
  handleApiV2Options,
  OPEN_TIER_CACHE_CONTROL,
  parseProfessionalSearchParams,
  searchProfessionalsV2,
  withOpenTier,
} from "@/lib/api-v2";

async function handleGet(request: NextRequest) {
  const parsed = parseProfessionalSearchParams(request.nextUrl.searchParams);
  if (!parsed.ok) {
    return apiV2Error("invalid_query", parsed.message, 400);
  }

  const result = await searchProfessionalsV2(parsed.value);
  return apiV2Paginated(
    result.data,
    {
      total: result.total,
      page: parsed.value.pagination.page,
      perPage: parsed.value.pagination.perPage,
    },
    { cacheControl: OPEN_TIER_CACHE_CONTROL }
  );
}

export const GET = withOpenTier(handleGet);

export async function OPTIONS() {
  return handleApiV2Options();
}
