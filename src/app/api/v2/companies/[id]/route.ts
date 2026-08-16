import type { NextRequest } from "next/server";
import {
  apiV2Error,
  apiV2Json,
  getCompanyDetailV2,
  handleApiV2Options,
  withKeyedTier,
} from "@/lib/api-v2";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function handleGet(routeContext: RouteContext) {
  const { id } = await routeContext.params;
  const company = await getCompanyDetailV2(id);

  if (!company) {
    return apiV2Error("not_found", "Company not found", 404);
  }

  return apiV2Json({ data: company });
}

export const GET = (request: NextRequest, routeContext: RouteContext) =>
  withKeyedTier(() => handleGet(routeContext), ["organization:read"])(request);

export async function OPTIONS() {
  return handleApiV2Options();
}
