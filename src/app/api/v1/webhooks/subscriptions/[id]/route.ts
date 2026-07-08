import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiAuth, type ApiAuthContext } from "@/lib/api-keys/validate";
import {
  apiInternalError,
  apiNotFound,
  handleOptionsRequest,
} from "@/lib/api/response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function handleDelete(
  _request: NextRequest,
  context: ApiAuthContext,
  routeContext: RouteParams
) {
  const { id } = await routeContext.params;
  const supabase = createAdminClient();

  const { data: subscription, error: findError } = await supabase
    .from("webhook_subscriptions")
    .select("id")
    .eq("id", id)
    .eq("organization_id", context.organizationId)
    .eq("is_active", true)
    .maybeSingle();

  if (findError) {
    console.error("[outbound-webhooks] failed to find subscription", findError);
    return apiInternalError(context.requestId, "Failed to delete webhook subscription");
  }

  if (!subscription) {
    return apiNotFound("Webhook subscription", context.requestId);
  }

  const { error } = await supabase
    .from("webhook_subscriptions")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", context.organizationId);

  if (error) {
    console.error("[outbound-webhooks] failed to delete subscription", error);
    return apiInternalError(context.requestId, "Failed to delete webhook subscription");
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
