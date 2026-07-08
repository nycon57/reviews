import type { NextRequest } from "next/server";
import {
  apiV2Error,
  apiV2Paginated,
  handleApiV2Options,
  listCompaniesV2,
  parseCompanyListParams,
  withKeyedTier,
} from "@/lib/api-v2";

async function handleGet(request: NextRequest) {
  const parsed = parseCompanyListParams(request.nextUrl.searchParams);
  if (!parsed.ok) {
    return apiV2Error("invalid_query", parsed.message, 400);
  }

  const result = await listCompaniesV2(parsed.value);
  return apiV2Paginated(result.data, {
    total: result.total,
    page: parsed.value.pagination.page,
    perPage: parsed.value.pagination.perPage,
  });
}

export const GET = withKeyedTier(handleGet, ["organization:read"]);

export async function OPTIONS() {
  return handleApiV2Options();
}
