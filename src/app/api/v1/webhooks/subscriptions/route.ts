import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiAuth, type ApiAuthContext } from "@/lib/api-keys/validate";
import {
  apiSuccess,
  apiValidationError,
  apiInternalError,
  handleOptionsRequest,
} from "@/lib/api/response";
import {
  generateWebhookSecret,
  outboundWebhookSubscriptionInputSchema,
} from "@/lib/webhooks/outbound";
import {
  mapOutboundWebhookSubscriptionRow,
  normalizeOutboundWebhookEvents,
  type OutboundWebhookSubscriptionRow,
} from "@/lib/webhooks/outbound/subscriptions";

function sourceFromUserAgent(userAgent: string | null): "api" | "zapier" {
  return userAgent?.startsWith("Zapier") ? "zapier" : "api";
}

async function handleGet(_request: NextRequest, context: ApiAuthContext) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("webhook_subscriptions")
    .select(
      "id, target_url, events, description, source, is_active, last_delivery_at, failure_count, created_at, updated_at"
    )
    .eq("organization_id", context.organizationId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[outbound-webhooks] failed to list subscriptions", error);
    return apiInternalError(context.requestId, "Failed to list webhook subscriptions");
  }

  return apiSuccess(
    ((data ?? []) as OutboundWebhookSubscriptionRow[]).map(
      mapOutboundWebhookSubscriptionRow
    ),
    context.requestId
  );
}

async function handlePost(request: NextRequest, context: ApiAuthContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiValidationError(
      [{ field: "body", message: "Invalid JSON body" }],
      context.requestId
    );
  }

  const validation = outboundWebhookSubscriptionInputSchema.safeParse(body);
  if (!validation.success) {
    return apiValidationError(
      validation.error.errors.map((entry) => ({
        field: entry.path.join(".") || "body",
        message: entry.message,
      })),
      context.requestId
    );
  }

  const secret = generateWebhookSecret();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("webhook_subscriptions")
    .insert({
      organization_id: context.organizationId,
      target_url: validation.data.target_url,
      events: validation.data.events,
      description: validation.data.description ?? null,
      secret,
      source: sourceFromUserAgent(request.headers.get("user-agent")),
      api_key_id: context.apiKeyId,
      created_by: null,
    })
    .select("id, target_url, events, created_at")
    .single();

  if (error) {
    console.error("[outbound-webhooks] failed to create subscription", error);
    return apiInternalError(context.requestId, "Failed to create webhook subscription");
  }

  return apiSuccess(
    {
      id: data.id,
      target_url: data.target_url,
      events: normalizeOutboundWebhookEvents(data.events),
      secret,
      created_at: data.created_at,
    },
    context.requestId,
    201
  );
}

export async function OPTIONS() {
  return handleOptionsRequest();
}

export const GET = withApiAuth(handleGet, ["webhooks:manage"]);
export const POST = withApiAuth(handlePost, ["webhooks:manage"]);
