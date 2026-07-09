import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCompanyDetailV2 } from "@/lib/api-v2";
import {
  webMcpError,
  webMcpJson,
  webMcpOptions,
  withWebMcpProxy,
} from "@/lib/webmcp/server";
import { toWebMcpCompanyProfile } from "@/lib/webmcp/shapes";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function handleGet(request: NextRequest, routeContext: RouteContext) {
  const { id } = await routeContext.params;
  const company = await getCompanyDetailV2(id);

  if (!company) {
    return webMcpError(request, "not_found", "Company not found", 404);
  }

  return webMcpJson(request, {
    data: toWebMcpCompanyProfile(company),
  });
}

export const GET = (request: NextRequest, routeContext: RouteContext) =>
  withWebMcpProxy(request, () => handleGet(request, routeContext));

export function OPTIONS(request: NextRequest): NextResponse {
  return webMcpOptions(request);
}
