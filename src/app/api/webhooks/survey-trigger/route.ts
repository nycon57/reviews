import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import crypto from "crypto";
import type { Json } from "@/types/database.types";
import { verifyNotBot, hasApiKey } from "@/lib/botid";

// Webhook payload schemas
const loanClosedPayloadSchema = z.object({
  event_type: z.literal("loan.closed"),
  data: z.object({
    transaction_id: z.string().min(1),
    loan_officer_email: z.string().email(),
    customer_name: z.string().min(1),
    customer_email: z.string().email(),
    customer_phone: z.string().optional(),
    transaction_type: z.string().optional().default("mortgage"),
    transaction_date: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

const contactCreatedPayloadSchema = z.object({
  event_type: z.literal("contact.created"),
  data: z.object({
    loan_officer_email: z.string().email(),
    customer_name: z.string().min(1),
    customer_email: z.string().email(),
    customer_phone: z.string().optional(),
    source: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

const manualTriggerPayloadSchema = z.object({
  event_type: z.literal("survey.trigger"),
  data: z.object({
    loan_officer_email: z.string().email().optional(),
    loan_officer_id: z.string().uuid().optional(),
    customer_name: z.string().min(1),
    customer_email: z.string().email(),
    customer_phone: z.string().optional(),
    template_id: z.string().uuid().optional(),
    transaction_id: z.string().optional(),
    transaction_type: z.string().optional(),
    transaction_date: z.string().optional(),
    delay_hours: z.number().min(0).max(168).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

const webhookPayloadSchema = z.discriminatedUnion("event_type", [
  loanClosedPayloadSchema,
  contactCreatedPayloadSchema,
  manualTriggerPayloadSchema,
]);

type WebhookPayload = z.infer<typeof webhookPayloadSchema>;

// Verify webhook signature using HMAC
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // Use timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(`sha256=${expectedSignature}`)
    );
  } catch {
    return false;
  }
}

// Log webhook request
async function logWebhook(params: {
  organizationId: string | null;
  webhookConfigId: string | null;
  eventType: string;
  payload: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  status: "received" | "processed" | "failed" | "ignored";
  errorMessage?: string;
  surveyId?: string;
  processingTimeMs?: number;
}): Promise<string | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("webhook_logs")
    .insert({
      organization_id: params.organizationId,
      webhook_config_id: params.webhookConfigId,
      event_type: params.eventType,
      payload: params.payload as Json,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      status: params.status,
      error_message: params.errorMessage,
      survey_id: params.surveyId,
      processing_time_ms: params.processingTimeMs,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to log webhook:", error);
    return null;
  }

  return data.id;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Dual-mode auth: if no API key (browser request), require BotID verification
  // If API key present (server-to-server), skip BotID and use existing auth
  if (!hasApiKey(request)) {
    const botResponse = await verifyNotBot();
    if (botResponse) return botResponse;
  }

  const supabase = createAdminClient();

  // Get request metadata
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    null;
  const userAgent = request.headers.get("user-agent");
  const signature = request.headers.get("x-webhook-signature");
  const apiKey = request.headers.get("x-api-key");

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { error: "Failed to read request body" },
      { status: 400 }
    );
  }

  // Parse JSON
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    await logWebhook({
      organizationId: null,
      webhookConfigId: null,
      eventType: "unknown",
      payload: { raw: rawBody.slice(0, 1000) },
      ipAddress,
      userAgent,
      status: "failed",
      errorMessage: "Invalid JSON payload",
    });

    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  // Get event type for logging
  const eventType =
    typeof payload === "object" && payload && "event_type" in payload
      ? String((payload as { event_type: unknown }).event_type)
      : "unknown";

  // Validate webhook configuration using API key
  if (!apiKey) {
    await logWebhook({
      organizationId: null,
      webhookConfigId: null,
      eventType,
      payload,
      ipAddress,
      userAgent,
      status: "failed",
      errorMessage: "Missing API key",
    });

    return NextResponse.json(
      { error: "Missing x-api-key header" },
      { status: 401 }
    );
  }

  // Look up webhook config by API key (using secret_key as identifier)
  const { data: webhookConfig, error: configError } = await supabase
    .from("webhook_configs")
    .select(
      `
      id,
      organization_id,
      secret_key,
      is_active,
      allowed_ips,
      default_template_id,
      settings
    `
    )
    .eq("secret_key", apiKey)
    .single();

  if (configError || !webhookConfig) {
    await logWebhook({
      organizationId: null,
      webhookConfigId: null,
      eventType,
      payload,
      ipAddress,
      userAgent,
      status: "failed",
      errorMessage: "Invalid API key",
    });

    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  if (!webhookConfig.is_active) {
    await logWebhook({
      organizationId: webhookConfig.organization_id,
      webhookConfigId: webhookConfig.id,
      eventType,
      payload,
      ipAddress,
      userAgent,
      status: "ignored",
      errorMessage: "Webhook is disabled",
    });

    return NextResponse.json(
      { error: "Webhook is disabled" },
      { status: 403 }
    );
  }

  // Check IP allowlist if configured
  if (
    webhookConfig.allowed_ips &&
    webhookConfig.allowed_ips.length > 0 &&
    ipAddress
  ) {
    if (!webhookConfig.allowed_ips.includes(ipAddress)) {
      await logWebhook({
        organizationId: webhookConfig.organization_id,
        webhookConfigId: webhookConfig.id,
        eventType,
        payload,
        ipAddress,
        userAgent,
        status: "failed",
        errorMessage: "IP address not allowed",
      });

      return NextResponse.json(
        { error: "IP address not allowed" },
        { status: 403 }
      );
    }
  }

  // Verify signature if provided (optional but recommended)
  if (signature) {
    const isValid = verifyWebhookSignature(
      rawBody,
      signature,
      webhookConfig.secret_key
    );

    if (!isValid) {
      await logWebhook({
        organizationId: webhookConfig.organization_id,
        webhookConfigId: webhookConfig.id,
        eventType,
        payload,
        ipAddress,
        userAgent,
        status: "failed",
        errorMessage: "Invalid webhook signature",
      });

      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }
  }

  // Validate payload schema
  const validatedPayload = webhookPayloadSchema.safeParse(payload);
  if (!validatedPayload.success) {
    await logWebhook({
      organizationId: webhookConfig.organization_id,
      webhookConfigId: webhookConfig.id,
      eventType,
      payload,
      ipAddress,
      userAgent,
      status: "failed",
      errorMessage: `Validation error: ${validatedPayload.error.errors[0]?.message}`,
    });

    return NextResponse.json(
      {
        error: "Invalid payload",
        details: validatedPayload.error.errors,
      },
      { status: 400 }
    );
  }

  // Process the webhook based on event type
  try {
    const result = await processWebhook(
      validatedPayload.data,
      webhookConfig,
      supabase
    );

    const processingTime = Date.now() - startTime;

    // Update webhook config stats using raw SQL for atomic increment
    const { error: rpcError } = await supabase.rpc("increment_webhook_trigger_count", {
      config_id: webhookConfig.id,
    });

    // Fallback if RPC doesn't exist - just update last_triggered_at
    if (rpcError) {
      await supabase
        .from("webhook_configs")
        .update({ last_triggered_at: new Date().toISOString() })
        .eq("id", webhookConfig.id);
    }

    await logWebhook({
      organizationId: webhookConfig.organization_id,
      webhookConfigId: webhookConfig.id,
      eventType: validatedPayload.data.event_type,
      payload,
      ipAddress,
      userAgent,
      status: "processed",
      surveyId: result.surveyId,
      processingTimeMs: processingTime,
    });

    return NextResponse.json({
      success: true,
      survey_id: result.surveyId,
      message: result.message,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logWebhook({
      organizationId: webhookConfig.organization_id,
      webhookConfigId: webhookConfig.id,
      eventType: validatedPayload.data.event_type,
      payload,
      ipAddress,
      userAgent,
      status: "failed",
      errorMessage,
      processingTimeMs: Date.now() - startTime,
    });

    console.error("Webhook processing error:", error);

    return NextResponse.json(
      { error: "Failed to process webhook", details: errorMessage },
      { status: 500 }
    );
  }
}

interface WebhookConfig {
  id: string;
  organization_id: string;
  default_template_id: string | null;
  settings: Json | null;
}

async function processWebhook(
  payload: WebhookPayload,
  webhookConfig: WebhookConfig,
  supabase: ReturnType<typeof createAdminClient>
): Promise<{ surveyId: string; message: string }> {
  const organizationId = webhookConfig.organization_id;

  // Extract common data based on event type
  let loanOfficerEmail: string | undefined;
  let loanOfficerId: string | undefined;
  let customerName: string;
  let customerEmail: string;
  let customerPhone: string | undefined;
  let templateId: string | undefined = webhookConfig.default_template_id || undefined;
  let transactionId: string | undefined;
  let transactionType: string | undefined;
  let transactionDate: string | undefined;
  let delayHours = 0;
  let sourceMetadata: Record<string, unknown> | undefined;

  switch (payload.event_type) {
    case "loan.closed": {
      loanOfficerEmail = payload.data.loan_officer_email;
      customerName = payload.data.customer_name;
      customerEmail = payload.data.customer_email;
      customerPhone = payload.data.customer_phone;
      transactionId = payload.data.transaction_id;
      transactionType = payload.data.transaction_type;
      transactionDate = payload.data.transaction_date;
      sourceMetadata = payload.data.metadata;
      // Default delay for loan closures (e.g., send survey 24 hours after)
      const settings = webhookConfig.settings as Record<string, unknown> | null;
      delayHours = (settings?.loan_closed_delay_hours as number) || 24;
      break;
    }

    case "contact.created":
      loanOfficerEmail = payload.data.loan_officer_email;
      customerName = payload.data.customer_name;
      customerEmail = payload.data.customer_email;
      customerPhone = payload.data.customer_phone;
      sourceMetadata = {
        ...payload.data.metadata,
        contact_source: payload.data.source,
      };
      break;

    case "survey.trigger":
      loanOfficerEmail = payload.data.loan_officer_email;
      loanOfficerId = payload.data.loan_officer_id;
      customerName = payload.data.customer_name;
      customerEmail = payload.data.customer_email;
      customerPhone = payload.data.customer_phone;
      templateId = payload.data.template_id || templateId;
      transactionId = payload.data.transaction_id;
      transactionType = payload.data.transaction_type;
      transactionDate = payload.data.transaction_date;
      delayHours = payload.data.delay_hours ?? 0;
      sourceMetadata = payload.data.metadata;
      break;
  }

  // Find the loan officer
  if (!loanOfficerId && loanOfficerEmail) {
    const { data: loanOfficer, error: loError } = await supabase
      .from("loan_officers")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("email", loanOfficerEmail)
      .eq("is_active", true)
      .single();

    if (loError || !loanOfficer) {
      throw new Error(
        `Loan officer not found for email: ${loanOfficerEmail}`
      );
    }

    loanOfficerId = loanOfficer.id;
  }

  if (!loanOfficerId) {
    throw new Error("Loan officer ID or email is required");
  }

  // Get default template if not specified
  if (!templateId) {
    const { data: defaultTemplate, error: templateError } = await supabase
      .from("survey_templates")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("is_default", true)
      .eq("is_active", true)
      .single();

    if (templateError || !defaultTemplate) {
      // Fall back to any active template
      const { data: anyTemplate, error: anyError } = await supabase
        .from("survey_templates")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (anyError || !anyTemplate) {
        throw new Error("No active survey template found");
      }

      templateId = anyTemplate.id;
    } else {
      templateId = defaultTemplate.id;
    }
  }

  // Check if survey already exists for this customer/transaction
  let existingCheck = supabase
    .from("surveys")
    .select("id, status")
    .eq("organization_id", organizationId)
    .eq("loan_officer_id", loanOfficerId)
    .eq("customer_email", customerEmail)
    .neq("status", "expired");

  if (transactionId) {
    existingCheck = existingCheck.eq("transaction_id", transactionId);
  }

  const { data: existingSurvey } = await existingCheck.limit(1).single();

  if (existingSurvey) {
    return {
      surveyId: existingSurvey.id,
      message: `Survey already exists with status: ${existingSurvey.status}`,
    };
  }

  // Calculate scheduled time
  const scheduledAt = new Date();
  if (delayHours > 0) {
    scheduledAt.setHours(scheduledAt.getHours() + delayHours);
  }

  // Calculate expiration (default 14 days from scheduled send)
  const expiresAt = new Date(scheduledAt);
  expiresAt.setDate(expiresAt.getDate() + 14);

  // Create the survey
  const { data: survey, error: surveyError } = await supabase
    .from("surveys")
    .insert({
      organization_id: organizationId,
      template_id: templateId,
      loan_officer_id: loanOfficerId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      transaction_id: transactionId,
      transaction_type: transactionType,
      transaction_date: transactionDate,
      status: "pending",
      expires_at: expiresAt.toISOString(),
      source: "webhook",
      source_metadata: {
        event_type: payload.event_type,
        webhook_config_id: webhookConfig.id,
        ...sourceMetadata,
      },
    })
    .select("id")
    .single();

  if (surveyError) {
    throw new Error(`Failed to create survey: ${surveyError.message}`);
  }

  // Add to distribution queue
  await supabase.from("survey_distribution_queue").insert({
    organization_id: organizationId,
    survey_id: survey.id,
    type: "initial",
    scheduled_at: scheduledAt.toISOString(),
    priority: 1,
  });

  return {
    surveyId: survey.id,
    message:
      delayHours > 0
        ? `Survey scheduled for ${scheduledAt.toISOString()}`
        : "Survey queued for immediate delivery",
  };
}
