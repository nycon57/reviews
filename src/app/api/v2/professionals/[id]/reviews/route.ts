import type { NextRequest } from "next/server";
import {
  apiV2Error,
  apiV2Paginated,
  getProfessionalReviewsV2,
  handleApiV2Options,
  parseProfessionalReviewsParams,
  withKeyedTier,
} from "@/lib/api-v2";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function handleGet(request: NextRequest, routeContext: RouteContext) {
  const { id } = await routeContext.params;
  const parsed = parseProfessionalReviewsParams(request.nextUrl.searchParams);
  if (!parsed.ok) {
    return apiV2Error("invalid_query", parsed.message, 400);
  }

  const result = await getProfessionalReviewsV2(id, parsed.value);
  if (!result) {
    return apiV2Error("not_found", "Professional not found", 404);
  }

  return apiV2Paginated(result.data, {
    total: result.total,
    page: parsed.value.pagination.page,
    perPage: parsed.value.pagination.perPage,
  });
}

export const GET = (request: NextRequest, routeContext: RouteContext) =>
  withKeyedTier((req) => handleGet(req, routeContext), ["reviews:read"])(request);

export async function OPTIONS() {
  return handleApiV2Options();
}
