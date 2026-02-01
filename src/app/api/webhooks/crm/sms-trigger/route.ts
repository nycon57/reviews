import { NextRequest, NextResponse } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  crmWebhookPayloadSchema,
  verifyCrmHmac,
  handleCrmTrigger,
} from "@/lib/sms/automation/trigger-handler";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/crm/sms-trigger
 *
 * Receives CRM loan-closed events and triggers automated post-closing SMS.
 * Validates HMAC-SHA256 signature via X-Webhook-Signature header.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const organizationId = request.headers.get("x-organization-id");
    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing X-Organization-Id header" },
        { status: 400 }
      );
    }

    const rawBody = await request.text();

    const supabase = createUntypedAdminClient();
    const { data: settings } = await supabase
      .from("sms_settings")
      .select("crm_webhook_secret, crm_trigger_enabled")
      .eq("organization_id", organizationId)
      .single();

    if (!settings) {
      return NextResponse.json(
        { error: "Organization SMS settings not found" },
        { status: 404 }
      );
    }

    if (!settings.crm_trigger_enabled) {
      return NextResponse.json(
        { error: "CRM SMS trigger is not enabled" },
        { status: 403 }
      );
    }

    const signature = request.headers.get("x-webhook-signature");
    if (!signature || !settings.crm_webhook_secret) {
      return NextResponse.json(
        { error: "Missing webhook signature or secret not configured" },
        { status: 401 }
      );
    }

    if (!verifyCrmHmac(settings.crm_webhook_secret, signature, rawBody)) {
      console.warn(
        `[CRM SMS Trigger] Invalid HMAC signature for org ${organizationId}`
      );
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const parsed = crmWebhookPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid payload",
          details: parsed.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const result = await handleCrmTrigger(organizationId, parsed.data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      scheduledAt: result.scheduledAt,
    });
  } catch (error) {
    console.error("[CRM SMS Trigger] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
