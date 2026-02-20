import { NextRequest } from "next/server";
import { withApiAuth, type ApiAuthContext } from "@/lib/api-keys/validate";
import {
  apiSuccess,
  apiNotFound,
  apiInternalError,
  handleOptionsRequest,
} from "@/lib/api/response";
import { publishProofItem } from "@/lib/share-studio/service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function handlePost(
  _request: NextRequest,
  context: ApiAuthContext,
  routeContext: RouteParams
) {
  const { id } = await routeContext.params;

  try {
    const item = await publishProofItem(context.organizationId, id, null);
    return apiSuccess(item, context.requestId);
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return apiNotFound("Share Studio item", context.requestId);
    }

    return apiInternalError(
      context.requestId,
      error instanceof Error ? error.message : "Failed to publish Share Studio item"
    );
  }
}

export async function OPTIONS() {
  return handleOptionsRequest();
}

export const POST = (request: NextRequest, routeContext: RouteParams) =>
  withApiAuth((req, ctx) => handlePost(req, ctx, routeContext), ["share-studio:publish"])(
    request
  );
