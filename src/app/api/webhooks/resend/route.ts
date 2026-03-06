import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { Webhook } from "svix";
import { z } from "zod";
import { emailConfig } from "@/lib/email/client";

// Zod schema for Resend webhook payload validation
const resendWebhookDataSchema = z.object({
  email_id: z.string(),
  from: z.string().optional(),
  to: z.array(z.string()).optional(),
  subject: z.string().optional(),
  broadcast_id: z.string().optional(),
  template_id: z.string().optional(),
  tags: z.record(z.string()).optional(),
  click: z.object({
    ipAddress: z.string(),
    link: z.string(),
    timestamp: z.string(),
    userAgent: z.string(),
  }).optional(),
});

const resendWebhookSchema = z.object({
  type: z.enum([
    "email.sent",
    "email.delivered",
    "email.opened",
    "email.clicked",
    "email.bounced",
    "email.complained",
  ]),
  created_at: z.string().optional(),
  data: resendWebhookDataSchema,
});

type ResendWebhookPayload = z.infer<typeof resendWebhookSchema>;

// Video testimonial template names
const VIDEO_TESTIMONIAL_TEMPLATES = [
  "video_testimonial_invitation",
  "video_testimonial_reminder_3day",
  "video_testimonial_reminder_7day",
];

// Welcome sequence template names
const WELCOME_SEQUENCE_TEMPLATES = [
  "welcome_1_access",
  "welcome_2_profile",
  "welcome_3_first_action",
  "welcome_4_social_proof",
  "welcome_5_metrics",
];

/**
 * Verify Resend webhook signature using Svix
 * Resend uses Svix for webhook signatures
 */
async function verifyWebhookSignature(
  request: NextRequest,
  body: string
): Promise<boolean> {
  const webhookSecret = emailConfig.webhookSecret;

  // In development without secret, allow unverified webhooks
  if (!webhookSecret) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Warning: Webhook signature verification skipped - no RESEND_WEBHOOK_SECRET configured");
      return true;
    }
    console.error("RESEND_WEBHOOK_SECRET not configured");
    return false;
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("Missing Svix headers for webhook verification");
    return false;
  }

  try {
    const wh = new Webhook(webhookSecret);
    wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
    return true;
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return false;
  }
}

// Resend webhook handler for email tracking events
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();

    // Verify webhook signature (CRITICAL: Prevents spoofed webhook attacks)
    const isValid = await verifyWebhookSignature(request, body);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    // Parse and validate with Zod
    const parseResult = resendWebhookSchema.safeParse(JSON.parse(body));
    if (!parseResult.success) {
      console.error("Invalid webhook payload:", parseResult.error.errors);
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    const payload = parseResult.data;
    const providerEventId =
      request.headers.get("svix-id") ||
      `${payload.type}:${payload.data.email_id}:${payload.created_at || "unknown"}`;

    const { type, data } = payload;
    const supabase = createAdminClient();

    // Map webhook event types to our status
    const statusMap: Record<string, string> = {
      "email.sent": "sent",
      "email.delivered": "delivered",
      "email.opened": "opened",
      "email.clicked": "clicked",
      "email.bounced": "bounced",
      "email.complained": "bounced",
    };

    const newStatus = statusMap[type];
    if (!newStatus) {
      // Unknown event type, acknowledge but don't process
      return NextResponse.json({ received: true });
    }

    // Build update data based on event type
    const updateData: Record<string, string> = {
      status: newStatus,
      provider_event_id: providerEventId,
      provider_event_type: type,
    };

    switch (type) {
      case "email.delivered":
        updateData.delivered_at = new Date().toISOString();
        break;
      case "email.opened":
        updateData.opened_at = new Date().toISOString();
        break;
      case "email.clicked":
        updateData.clicked_at = new Date().toISOString();
        break;
    }

    // Atomic deduplication: update only if this provider_event_id hasn't been
    // processed yet. Replaces SELECT-then-update to eliminate TOCTOU race.
    // Requires UNIQUE constraint on email_logs.provider_event_id.
    // Escape providerEventId for PostgREST filter (wrap in double quotes, escape \ and ")
    const providerEventIdEscaped = providerEventId
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"');
    const { data: emailLog, error } = await supabase
      .from("email_logs")
      .update(updateData)
      .eq("resend_message_id", data.email_id)
      .or(`provider_event_id.is.null,provider_event_id.neq."${providerEventIdEscaped}"`)
      .select("template_name, request_id, to_email")
      .maybeSingle();

    if (error) {
      console.error("Failed to update email log:", error);
      // Still continue processing
    }

    // No row returned and no error means this event was already processed
    if (!emailLog && !error) {
      return NextResponse.json({ received: true, deduplicated: true });
    }

    // Handle video testimonial-specific status updates
    if (emailLog?.template_name && VIDEO_TESTIMONIAL_TEMPLATES.includes(emailLog.template_name)) {
      await handleVideoTestimonialEmailEvent(supabase, type, data, {
        requestIdFromLog: emailLog.request_id,
        recipientEmailFromLog: emailLog.to_email,
        providerEventId,
      });
    }

    // Handle welcome sequence-specific status updates
    if (emailLog?.template_name && WELCOME_SEQUENCE_TEMPLATES.includes(emailLog.template_name)) {
      await handleWelcomeSequenceEmailEvent(supabase, type, data);
    }

    // For bounced/complained emails, we might want to add to unsubscribe list
    if (type === "email.bounced" || type === "email.complained") {
      const toEmail = data.to?.[0];
      if (toEmail) {
        // Add to unsubscribe list (ignore if already exists)
        await supabase.from("email_unsubscribes").upsert(
          {
            email: toEmail.toLowerCase(),
            reason: type === "email.bounced" ? "bounced" : "complained",
          },
          {
            onConflict: "email,organization_id",
            ignoreDuplicates: true,
          }
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Return 200 to prevent retries on parse errors
    return NextResponse.json({ error: "Processing error" }, { status: 200 });
  }
}

/**
 * Handle video testimonial email events
 * Updates the video_testimonial_requests table based on email events
 */
async function handleVideoTestimonialEmailEvent(
  supabase: ReturnType<typeof createAdminClient>,
  eventType: string,
  eventData: ResendWebhookPayload["data"],
  options: {
    requestIdFromLog?: string | null;
    recipientEmailFromLog?: string | null;
    providerEventId: string;
  }
) {
  // Try to extract request_id from tags
  const taggedRequestId = eventData.tags?.request_id;
  const requestId = taggedRequestId || options.requestIdFromLog || null;

  if (requestId) {
    await updateVideoTestimonialRequest(supabase, requestId, eventType);
    return;
  }

  // Strict fallback: only attribute by email if exactly one eligible request exists.
  const toEmail = eventData.to?.[0] || options.recipientEmailFromLog;
  if (!toEmail) {
    console.error("Video webhook missing request_id and recipient email", {
      providerEventId: options.providerEventId,
      eventType,
    });
    return;
  }

  const { data: candidates, error: candidateError } = await supabase
    .from("video_testimonial_requests")
    .select("id")
    .eq("customer_email", toEmail.toLowerCase())
    .in("status", ["pending", "queued", "sent", "opened", "recording"])
    .order("created_at", { ascending: false })
    .limit(2);

  if (candidateError || !candidates) {
    console.error("Failed to resolve webhook request candidate:", {
      providerEventId: options.providerEventId,
      eventType,
      error: candidateError,
    });
    return;
  }

  if (candidates.length !== 1) {
    const emailHash = createHash("sha256").update(toEmail.toLowerCase()).digest("hex").slice(0, 12);
    console.error("Ambiguous webhook attribution. Event quarantined.", {
      providerEventId: options.providerEventId,
      eventType,
      candidateCount: candidates.length,
      recipientEmailHash: emailHash,
    });
    return;
  }

  await updateVideoTestimonialRequest(supabase, candidates[0].id, eventType);
}

/**
 * Update video testimonial request based on email event
 */
async function updateVideoTestimonialRequest(
  supabase: ReturnType<typeof createAdminClient>,
  requestId: string,
  eventType: string
) {
  const now = new Date().toISOString();

  switch (eventType) {
    case "email.delivered":
      // Update delivered timestamp
      await supabase
        .from("video_testimonial_requests")
        .update({
          email_delivered_at: now,
          last_transition_at: now,
          last_transition_source: "webhook",
          last_transition_reason: "Email delivered",
        })
        .eq("id", requestId)
        .is("email_delivered_at", null);
      break;

    case "email.opened":
      // Update opened timestamp and status
      await supabase
        .from("video_testimonial_requests")
        .update({
          opened_at: now,
          status: "opened",
          last_transition_at: now,
          last_transition_source: "webhook",
          last_transition_reason: "Email opened",
        })
        .eq("id", requestId)
        .in("status", ["pending", "queued", "sent"])
        .is("opened_at", null);

      // Cancel pending reminder queue items since customer opened the email
      await supabase
        .from("video_testimonial_queue")
        .update({
          status: "cancelled",
          error_message: "Customer opened the email",
          processed_at: now,
        })
        .eq("request_id", requestId)
        .eq("status", "pending")
        .in("type", ["reminder_3day", "reminder_7day"]);
      break;

    case "email.clicked":
      // Update clicked timestamp
      // Note: clicked_at column exists in DB, types may need regeneration
      await supabase
        .from("video_testimonial_requests")
        .update({
          clicked_at: now,
          last_transition_at: now,
          last_transition_source: "webhook",
          last_transition_reason: "Email link clicked",
        } as Record<string, unknown>)
        .eq("id", requestId)
        .is("clicked_at", null);
      break;

    case "email.bounced":
    case "email.complained":
      // Mark request as failed due to bounced email
      await supabase
        .from("video_testimonial_requests")
        .update({
          status: "failed",
          last_transition_at: now,
          last_transition_source: "webhook",
          last_transition_reason: eventType === "email.bounced" ? "Email bounced" : "Email reported as spam",
        } as Record<string, unknown>)
        .eq("id", requestId)
        .in("status", ["pending", "queued", "sent"]);

      // Cancel all pending queue items for this request
      await supabase
        .from("video_testimonial_queue")
        .update({
          status: "cancelled",
          error_message: eventType === "email.bounced" ? "Email bounced" : "Email reported as spam",
          processed_at: now,
        })
        .eq("request_id", requestId)
        .eq("status", "pending");
      break;
  }
}

// HEAD request for webhook verification
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

// GET request returns method not allowed
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

/**
 * Handle welcome sequence email events
 * Tracks engagement metrics on email_sequences table
 */
async function handleWelcomeSequenceEmailEvent(
  supabase: ReturnType<typeof createAdminClient>,
  eventType: string,
  eventData: ResendWebhookPayload["data"]
) {
  // Try to extract sequence_id from tags
  const sequenceId = eventData.tags?.sequence_id;
  const sequenceStep = eventData.tags?.sequence_step;
  // ab_variant is included in tags for analytics but not used in this handler
  const _abVariant = eventData.tags?.ab_variant;

  if (!sequenceId) {
    // No sequence ID in tags, cannot update
    return;
  }

  // Note: email_sequences table added in migration 20240101000043
  // Types will be updated after running npm run db:types
  // Using type assertions until types are regenerated

  type StepData = {
    step: number;
    email_id: string;
    sent_at: string;
    template?: string;
    variant?: string;
    delivered_at?: string;
    opened_at?: string;
    clicked_at?: string;
  };

  // Get current sequence data
  const { data: sequence, error: fetchError } = await (supabase as ReturnType<typeof createAdminClient>)
    .from("email_sequences" as "users")
    .select("steps_completed")
    .eq("id", sequenceId)
    .single() as { data: { steps_completed: StepData[] } | null; error: Error | null };

  if (fetchError || !sequence) {
    console.error("Failed to fetch sequence for tracking:", fetchError);
    return;
  }

  // Parse existing steps
  const stepsCompleted = (sequence.steps_completed || []) as StepData[];

  const stepNum = parseInt(sequenceStep || "0", 10);
  const stepIndex = stepsCompleted.findIndex((s) => s.step === stepNum);

  if (stepIndex === -1) {
    // Step not found in completed list
    return;
  }

  const now = new Date().toISOString();

  switch (eventType) {
    case "email.delivered":
      if (!stepsCompleted[stepIndex].delivered_at) {
        stepsCompleted[stepIndex].delivered_at = now;
      }
      break;

    case "email.opened":
      if (!stepsCompleted[stepIndex].opened_at) {
        stepsCompleted[stepIndex].opened_at = now;
      }
      break;

    case "email.clicked":
      if (!stepsCompleted[stepIndex].clicked_at) {
        stepsCompleted[stepIndex].clicked_at = now;
      }
      break;

    case "email.bounced":
    case "email.complained":
      // Mark sequence as cancelled due to email delivery failure
      await (supabase as ReturnType<typeof createAdminClient>)
        .from("email_sequences" as "users")
        .update({
          status: "cancelled",
          exit_reason: eventType === "email.bounced" ? "email_bounced" : "email_complained",
          exited_at: now,
          steps_completed: stepsCompleted,
        } as Record<string, unknown>)
        .eq("id", sequenceId)
        .eq("status", "active");
      return;
  }

  // Update the sequence with engagement data
  const { error: updateError } = await (supabase as ReturnType<typeof createAdminClient>)
    .from("email_sequences" as "users")
    .update({
      steps_completed: stepsCompleted,
    } as Record<string, unknown>)
    .eq("id", sequenceId);

  if (updateError) {
    console.error("Failed to update sequence engagement:", updateError);
  }
}
