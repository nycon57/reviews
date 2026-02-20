import { NextRequest } from "next/server";
import { withApiAuth, type ApiAuthContext } from "@/lib/api-keys/validate";
import {
  apiSuccess,
  apiNotFound,
  apiInternalError,
  handleOptionsRequest,
} from "@/lib/api/response";
import { getRenderJob } from "@/lib/share-studio/service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function handleGet(
  _request: NextRequest,
  context: ApiAuthContext,
  routeContext: RouteParams
) {
  const { id } = await routeContext.params;

  try {
    const job = await getRenderJob(context.organizationId, id);

    if (!job) {
      return apiNotFound("Render job", context.requestId);
    }

    return apiSuccess(job, context.requestId);
  } catch (error) {
    console.error("[share-studio] failed to fetch render job", error);
    return apiInternalError(context.requestId, "Failed to fetch render job");
  }
}

export async function OPTIONS() {
  return handleOptionsRequest();
}

export const GET = (request: NextRequest, routeContext: RouteParams) =>
  withApiAuth((req, ctx) => handleGet(req, ctx, routeContext), ["share-studio:read"])(request);
