import type { NextRequest } from "next/server";
import {
  apiV2Error,
  apiV2Json,
  getProfessionalDetailV2,
  handleApiV2Options,
  withKeyedTier,
} from "@/lib/api-v2";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function handleGet(routeContext: RouteContext) {
  const { id } = await routeContext.params;
  const professional = await getProfessionalDetailV2(id);

  if (!professional) {
    return apiV2Error("not_found", "Professional not found", 404);
  }

  return apiV2Json({ data: professional });
}

export const GET = (request: NextRequest, routeContext: RouteContext) =>
  withKeyedTier(() => handleGet(routeContext), ["professionals:read"])(request);

export async function OPTIONS() {
  return handleApiV2Options();
}
