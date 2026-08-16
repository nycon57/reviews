import type { NextRequest } from "next/server";
import {
  apiV2Error,
  apiV2Paginated,
  handleApiV2Options,
  parseCrossReviewSearchParams,
  searchReviewsV2,
  withKeyedTier,
} from "@/lib/api-v2";

async function handleGet(request: NextRequest) {
  const parsed = parseCrossReviewSearchParams(request.nextUrl.searchParams);
  if (!parsed.ok) {
    return apiV2Error("invalid_query", parsed.message, 400);
  }

  const result = await searchReviewsV2(parsed.value);
  return apiV2Paginated(result.data, {
    total: result.total,
    page: parsed.value.pagination.page,
    perPage: parsed.value.pagination.perPage,
  });
}

export const GET = withKeyedTier(handleGet, ["reviews:read"]);

export async function OPTIONS() {
  return handleApiV2Options();
}
