import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getProfessionalDetailV2 } from "@/lib/api-v2";
import {
  webMcpError,
  webMcpJson,
  webMcpOptions,
  withWebMcpProxy,
} from "@/lib/webmcp/server";
import { toWebMcpProfessionalProfile } from "@/lib/webmcp/shapes";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function handleGet(request: NextRequest, routeContext: RouteContext) {
  const { id } = await routeContext.params;
  const professional = await getProfessionalDetailV2(id);

  if (!professional) {
    return webMcpError(request, "not_found", "Professional not found", 404);
  }

  return webMcpJson(request, {
    data: toWebMcpProfessionalProfile(professional),
  });
}

export const GET = (request: NextRequest, routeContext: RouteContext) =>
  withWebMcpProxy(request, () => handleGet(request, routeContext));

export function OPTIONS(request: NextRequest): NextResponse {
  return webMcpOptions(request);
}
