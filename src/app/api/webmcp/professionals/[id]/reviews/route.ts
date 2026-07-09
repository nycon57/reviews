import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getProfessionalReviewsV2 } from "@/lib/api-v2";
import { parseWebMcpReviewsParams } from "@/lib/webmcp/params";
import {
  webMcpError,
  webMcpOptions,
  webMcpPaginated,
  withWebMcpProxy,
} from "@/lib/webmcp/server";
import { toWebMcpReviewSummary } from "@/lib/webmcp/shapes";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function handleGet(request: NextRequest, routeContext: RouteContext) {
  const { id } = await routeContext.params;
  const parsed = parseWebMcpReviewsParams(request.nextUrl.searchParams);

  if (!parsed.ok) {
    return webMcpError(request, "invalid_query", parsed.message, 400);
  }

  const result = await getProfessionalReviewsV2(id, parsed.value);
  if (!result) {
    return webMcpError(request, "not_found", "Professional not found", 404);
  }

  return webMcpPaginated(
    request,
    result.data.map(toWebMcpReviewSummary),
    {
      total: result.total,
      page: parsed.value.pagination.page,
      perPage: parsed.value.pagination.perPage,
    }
  );
}

export const GET = (request: NextRequest, routeContext: RouteContext) =>
  withWebMcpProxy(request, () => handleGet(request, routeContext));

export function OPTIONS(request: NextRequest): NextResponse {
  return webMcpOptions(request);
}
