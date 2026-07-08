import { NextRequest, NextResponse } from "next/server";
import { withApiAuth, type ApiAuthContext } from "@/lib/api-keys/validate";
import {
  apiInternalError,
  apiNotFound,
  handleOptionsRequest,
} from "@/lib/api/response";
import { deactivateOutboundWebhookSubscription } from "@/lib/webhooks/outbound";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function handleDelete(
  _request: NextRequest,
  context: ApiAuthContext,
  routeContext: RouteParams
) {
  const { id } = await routeContext.params;
  // REST DELETE is Zapier unsubscribe semantics: deactivate only so delivery
  // history stays attached. Dashboard delete hard-deletes after confirmation.
  const result = await deactivateOutboundWebhookSubscription({
    subscriptionId: id,
    organizationId: context.organizationId,
  });

  if (!result.success) {
    console.error("[outbound-webhooks] failed to delete subscription", result.error);
    return apiInternalError(context.requestId, "Failed to delete webhook subscription");
  }

  if (!result.found) {
    return apiNotFound("Webhook subscription", context.requestId);
  }

  return new NextResponse(null, {
    status: 204,
    headers: { "X-Request-ID": context.requestId },
  });
}

export async function OPTIONS() {
  return handleOptionsRequest();
}

export const DELETE = (request: NextRequest, routeContext: RouteParams) =>
  withApiAuth(
    (req, ctx) => handleDelete(req, ctx, routeContext),
    ["webhooks:manage"]
  )(request);
