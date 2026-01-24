import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import crypto from "crypto";
import { z } from "zod";
import { verifyNotBot } from "@/lib/botid";

// Schema for test webhook request
const testWebhookSchema = z.object({
  webhookConfigId: z.string().uuid(),
  eventType: z.enum(["loan.closed", "contact.created", "survey.trigger"]),
  payload: z.record(z.unknown()).optional(),
});

interface ValidatedRequest {
  webhookConfigId: string;
  eventType: string;
  payload?: Record<string, unknown>;
  webhookConfig: {
    id: string;
    secret_key: string;
    organization_id: string;
    is_active: boolean | null;
  };
  loanOfficerEmail: string;
}

// Validate request and return common data needed by both handlers
async function validateTestRequest(
  request: NextRequest
): Promise<{ data: ValidatedRequest } | { error: NextResponse }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }

  const supabase = createAdminClient();
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (userError || !userData?.organization_id) {
    return { error: NextResponse.json({ error: "Organization not found" }, { status: 403 }) };
  }

  if (userData.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }

  const body = await request.json();
  const validated = testWebhookSchema.safeParse(body);

  if (!validated.success) {
    return {
      error: NextResponse.json(
        { error: "Invalid request", details: validated.error.errors },
        { status: 400 }
      ),
    };
  }

  const { data: webhookConfig, error: configError } = await supabase
    .from("webhook_configs")
    .select("id, secret_key, organization_id, is_active")
    .eq("id", validated.data.webhookConfigId)
    .single();

  if (configError || !webhookConfig) {
    return {
      error: NextResponse.json({ error: "Webhook configuration not found" }, { status: 404 }),
    };
  }

  if (webhookConfig.organization_id !== userData.organization_id) {
    return {
      error: NextResponse.json({ error: "Webhook not in your organization" }, { status: 403 }),
    };
  }

  const { data: loanOfficer } = await supabase
    .from("loan_officers")
    .select("email")
    .eq("organization_id", userData.organization_id)
    .eq("is_active", true)
    .limit(1)
    .single();

  return {
    data: {
      webhookConfigId: validated.data.webhookConfigId,
      eventType: validated.data.eventType,
      payload: validated.data.payload,
      webhookConfig,
      loanOfficerEmail: loanOfficer?.email || "lo@example.com",
    },
  };
}

// Generate a sample payload for each event type
function generateSamplePayload(
  eventType: string,
  loanOfficerEmail: string
): Record<string, unknown> {
  const baseData = {
    loan_officer_email: loanOfficerEmail,
    customer_name: "Test Customer",
    customer_email: "test.customer@example.com",
    customer_phone: "+1234567890",
  };

  switch (eventType) {
    case "loan.closed":
      return {
        event_type: "loan.closed",
        data: {
          ...baseData,
          transaction_id: `TEST-${Date.now()}`,
          transaction_type: "mortgage",
          transaction_date: new Date().toISOString().split("T")[0],
          metadata: {
            test: true,
            generated_at: new Date().toISOString(),
          },
        },
      };
    case "contact.created":
      return {
        event_type: "contact.created",
        data: {
          ...baseData,
          source: "test_webhook",
          metadata: {
            test: true,
            generated_at: new Date().toISOString(),
          },
        },
      };
    case "survey.trigger":
      return {
        event_type: "survey.trigger",
        data: {
          ...baseData,
          delay_hours: 0,
          metadata: {
            test: true,
            generated_at: new Date().toISOString(),
          },
        },
      };
    default:
      return {
        event_type: eventType,
        data: baseData,
      };
  }
}

// Generate webhook signature
function generateSignature(payload: string, secret: string): string {
  const hash = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `sha256=${hash}`;
}

export async function POST(request: NextRequest) {
  try {
    // Verify request is not from a bot
    const botResponse = await verifyNotBot();
    if (botResponse) return botResponse;

    const result = await validateTestRequest(request);
    if ("error" in result) {
      return result.error;
    }

    const { eventType, payload: customPayload, webhookConfig, loanOfficerEmail } = result.data;

    const payload = customPayload || generateSamplePayload(eventType, loanOfficerEmail);
    const payloadString = JSON.stringify(payload, null, 2);
    const signature = generateSignature(JSON.stringify(payload), webhookConfig.secret_key);

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";
    const webhookUrl = `${baseUrl}/api/webhooks/survey-trigger`;

    const curlCommand = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${webhookConfig.secret_key}" \\
  -H "x-webhook-signature: ${signature}" \\
  -d '${JSON.stringify(payload)}'`;

    return NextResponse.json({
      success: true,
      webhookUrl,
      payload,
      payloadString,
      signature,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": webhookConfig.secret_key,
        "x-webhook-signature": signature,
      },
      curlCommand,
      isActive: webhookConfig.is_active,
    });
  } catch (error) {
    console.error("Error generating test webhook:", error);
    return NextResponse.json(
      { error: "Failed to generate test webhook" },
      { status: 500 }
    );
  }
}

// Send a live test webhook to the endpoint
export async function PUT(request: NextRequest) {
  try {
    // Verify request is not from a bot
    const botResponse = await verifyNotBot();
    if (botResponse) return botResponse;

    const result = await validateTestRequest(request);
    if ("error" in result) {
      return result.error;
    }

    const { eventType, payload: customPayload, webhookConfig, loanOfficerEmail } = result.data;

    if (!webhookConfig.is_active) {
      return NextResponse.json(
        { error: "Webhook is disabled. Enable it before testing." },
        { status: 400 }
      );
    }

    const payload = customPayload || generateSamplePayload(eventType, loanOfficerEmail);
    const payloadString = JSON.stringify(payload);
    const signature = generateSignature(payloadString, webhookConfig.secret_key);

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";
    const webhookUrl = `${baseUrl}/api/webhooks/survey-trigger`;

    const startTime = Date.now();

    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": webhookConfig.secret_key,
          "x-webhook-signature": signature,
        },
        body: payloadString,
      });

      const responseBody = await webhookResponse.json();
      const duration = Date.now() - startTime;

      return NextResponse.json({
        success: webhookResponse.ok,
        status: webhookResponse.status,
        response: responseBody,
        duration,
        payload,
        signature,
      });
    } catch (fetchError) {
      return NextResponse.json({
        success: false,
        error: "Failed to call webhook endpoint",
        details: fetchError instanceof Error ? fetchError.message : "Unknown error",
        duration: Date.now() - startTime,
      });
    }
  } catch (error) {
    console.error("Error executing test webhook:", error);
    return NextResponse.json(
      { error: "Failed to execute test webhook" },
      { status: 500 }
    );
  }
}
