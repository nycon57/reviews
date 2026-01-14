import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ResendWebhookPayload } from "@/lib/email/types";

// Resend webhook handler for email tracking events
export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as ResendWebhookPayload;

    // Validate webhook payload
    if (!payload.type || !payload.data?.email_id) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

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

    // Update email log by resend message ID
    const { error } = await supabase
      .from("email_logs")
      .update(updateData)
      .eq("resend_message_id", data.email_id);

    if (error) {
      console.error("Failed to update email log:", error);
      // Still return success to avoid Resend retries
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

// HEAD request for webhook verification
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

// GET request returns method not allowed
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
