import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";
import { z } from "zod";

// Schema for test webhook request
const testWebhookSchema = z.object({
  webhookConfigId: z.string().uuid(),
  eventType: z.enum(["loan.closed", "contact.created", "survey.trigger"]),
  payload: z.record(z.unknown()).optional(),
});

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
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user's organization and role
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 403 }
      );
    }

    // Only admins can test webhooks
    if (userData.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = testWebhookSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.errors },
        { status: 400 }
      );
    }

    // Get webhook config
    const { data: webhookConfig, error: configError } = await supabase
      .from("webhook_configs")
      .select("id, secret_key, organization_id, is_active")
      .eq("id", validated.data.webhookConfigId)
      .single();

    if (configError || !webhookConfig) {
      return NextResponse.json(
        { error: "Webhook configuration not found" },
        { status: 404 }
      );
    }

    if (webhookConfig.organization_id !== userData.organization_id) {
      return NextResponse.json(
        { error: "Webhook not in your organization" },
        { status: 403 }
      );
    }

    // Get a loan officer email for sample payload
    const { data: loanOfficer } = await supabase
      .from("loan_officers")
      .select("email")
      .eq("organization_id", userData.organization_id)
      .eq("is_active", true)
      .limit(1)
      .single();

    const loanOfficerEmail = loanOfficer?.email || "lo@example.com";

    // Generate or use provided payload
    const payload =
      validated.data.payload ||
      generateSamplePayload(validated.data.eventType, loanOfficerEmail);

    const payloadString = JSON.stringify(payload, null, 2);
    const signature = generateSignature(
      JSON.stringify(payload),
      webhookConfig.secret_key
    );

    // Generate curl command for testing
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
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user's organization and role
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 403 }
      );
    }

    // Only admins can test webhooks
    if (userData.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = testWebhookSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.errors },
        { status: 400 }
      );
    }

    // Get webhook config
    const { data: webhookConfig, error: configError } = await supabase
      .from("webhook_configs")
      .select("id, secret_key, organization_id, is_active")
      .eq("id", validated.data.webhookConfigId)
      .single();

    if (configError || !webhookConfig) {
      return NextResponse.json(
        { error: "Webhook configuration not found" },
        { status: 404 }
      );
    }

    if (webhookConfig.organization_id !== userData.organization_id) {
      return NextResponse.json(
        { error: "Webhook not in your organization" },
        { status: 403 }
      );
    }

    if (!webhookConfig.is_active) {
      return NextResponse.json(
        { error: "Webhook is disabled. Enable it before testing." },
        { status: 400 }
      );
    }

    // Get a loan officer email for sample payload
    const { data: loanOfficer } = await supabase
      .from("loan_officers")
      .select("email")
      .eq("organization_id", userData.organization_id)
      .eq("is_active", true)
      .limit(1)
      .single();

    const loanOfficerEmail = loanOfficer?.email || "lo@example.com";

    // Generate or use provided payload
    const payload =
      validated.data.payload ||
      generateSamplePayload(validated.data.eventType, loanOfficerEmail);

    const payloadString = JSON.stringify(payload);
    const signature = generateSignature(payloadString, webhookConfig.secret_key);

    // Make the actual webhook call
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";
    const webhookUrl = `${baseUrl}/api/webhooks/survey-trigger`;

    const startTime = Date.now();
    let webhookResponse;
    let responseBody;
    let responseStatus;

    try {
      webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": webhookConfig.secret_key,
          "x-webhook-signature": signature,
        },
        body: payloadString,
      });

      responseStatus = webhookResponse.status;
      responseBody = await webhookResponse.json();
    } catch (fetchError) {
      return NextResponse.json({
        success: false,
        error: "Failed to call webhook endpoint",
        details: fetchError instanceof Error ? fetchError.message : "Unknown error",
        duration: Date.now() - startTime,
      });
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: webhookResponse.ok,
      status: responseStatus,
      response: responseBody,
      duration,
      payload,
      signature,
    });
  } catch (error) {
    console.error("Error executing test webhook:", error);
    return NextResponse.json(
      { error: "Failed to execute test webhook" },
      { status: 500 }
    );
  }
}
