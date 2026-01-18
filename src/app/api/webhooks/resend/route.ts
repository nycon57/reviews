import { NextRequest, NextResponse } from "next/server";
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

    // Update email log by resend message ID and get the template info
    const { data: emailLog, error } = await supabase
      .from("email_logs")
      .update(updateData)
      .eq("resend_message_id", data.email_id)
      .select("template_name")
      .single();

    if (error) {
      console.error("Failed to update email log:", error);
      // Still continue processing
    }

    // Handle video testimonial-specific status updates
    if (emailLog?.template_name && VIDEO_TESTIMONIAL_TEMPLATES.includes(emailLog.template_name)) {
      await handleVideoTestimonialEmailEvent(supabase, type, data);
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
  eventData: ResendWebhookPayload["data"]
) {
  // Try to extract request_id from tags
  const requestId = eventData.tags?.request_id;

  if (!requestId) {
    // No request ID in tags, try to find by email
    const toEmail = eventData.to?.[0];
    if (!toEmail) return;

    // Find the most recent pending request for this email
    const { data: request } = await supabase
      .from("video_testimonial_requests")
      .select("id")
      .eq("customer_email", toEmail.toLowerCase())
      .in("status", ["pending", "sent"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!request) return;

    await updateVideoTestimonialRequest(supabase, request.id, eventType);
  } else {
    await updateVideoTestimonialRequest(supabase, requestId, eventType);
  }
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
        .update({ email_delivered_at: now })
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
        })
        .eq("id", requestId)
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
      await supabase
        .from("video_testimonial_requests")
        .update({ clicked_at: now })
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
          failure_reason: eventType === "email.bounced" ? "Email bounced" : "Email reported as spam",
        })
        .eq("id", requestId)
        .in("status", ["pending", "sent"]);

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
