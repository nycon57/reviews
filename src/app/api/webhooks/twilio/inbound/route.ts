import { NextRequest, NextResponse } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import type { UntypedSupabaseClient } from "@/lib/supabase/admin";
import {
  validateTwilioSignature,
  buildWebhookUrl,
} from "@/lib/sms/webhook-validation";
import { KeywordHandler } from "@/lib/sms/keyword-handler";
import { incrementDailyStat } from "@/lib/sms/daily-stats";

export const dynamic = "force-dynamic";

/**
 * Twilio Inbound SMS Webhook
 *
 * Receives incoming SMS messages from Twilio. Handles:
 * 1. STOP/UNSUBSCRIBE keywords -> update consent to opted_out
 * 2. START/YES keywords -> update consent to opted_in
 * 3. HELP keyword -> reply with configurable help text
 * 4. YES keyword -> confirm double opt-in if pending
 * 5. Regular messages -> log to sms_messages, update/create conversation
 *
 * Returns TwiML responses for keyword-triggered auto-replies.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const params = Object.fromEntries(formData.entries()) as Record<
      string,
      string
    >;

    const signature = request.headers.get("x-twilio-signature");
    const webhookUrl = buildWebhookUrl(request);

    if (!validateTwilioSignature(signature, webhookUrl, params)) {
      console.warn("[SMS Inbound Webhook] Invalid Twilio signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }

    const from = params.From;
    const to = params.To;
    const body = params.Body ?? "";
    const messageSid = params.MessageSid;

    if (!from || !to) {
      return NextResponse.json(
        { error: "Missing From or To number" },
        { status: 400 }
      );
    }

    const supabase = createUntypedAdminClient();

    const { data: phoneRecord } = await supabase
      .from("sms_phone_numbers")
      .select("organization_id")
      .eq("phone_number", to)
      .eq("status", "active")
      .maybeSingle();

    if (!phoneRecord) {
      console.warn(
        `[SMS Inbound Webhook] No org found for receiving number: ${to}`
      );
      return twimlResponse("");
    }

    const organizationId = phoneRecord.organization_id;

    // Log every inbound message regardless of keyword type
    await logInboundMessage(supabase, {
      organizationId,
      from,
      to,
      body,
      messageSid,
    });

    // Process keywords via the KeywordHandler
    const keywordHandler = new KeywordHandler(supabase);
    const result = await keywordHandler.processKeyword(
      organizationId,
      from,
      body
    );

    if (result.type !== "none") {
      // Track opt-out events in daily stats
      if (result.type === "opt_out") {
        await incrementDailyStat(supabase, organizationId, null, todayDate(), "opted_out");
      }

      return twimlResponse(result.response);
    }

    // Regular inbound message -- update conversation and stats
    await upsertConversation(supabase, organizationId, from);
    await incrementDailyStat(supabase, organizationId, null, todayDate(), "replied");

    return twimlResponse("");
  } catch (error) {
    console.error("[SMS Inbound Webhook] Unexpected error:", error);
    return twimlResponse("");
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Message logging ─────────────────────────────────────────────────────

interface InboundMessageParams {
  organizationId: string;
  from: string;
  to: string;
  body: string;
  messageSid?: string;
}

async function logInboundMessage(
  supabase: UntypedSupabaseClient,
  params: InboundMessageParams
): Promise<void> {
  const { error } = await supabase.from("sms_messages").insert({
    organization_id: params.organizationId,
    direction: "inbound",
    from_number: params.from,
    to_number: params.to,
    body: params.body,
    twilio_sid: params.messageSid ?? null,
    status: "received",
    segments: 1,
    sent_at: new Date().toISOString(),
  });

  if (error) {
    console.error(
      "[SMS Inbound Webhook] Failed to log message:",
      error.message
    );
  }
}

// ── Conversation tracking ───────────────────────────────────────────────

async function upsertConversation(
  supabase: UntypedSupabaseClient,
  organizationId: string,
  borrowerPhone: string
): Promise<void> {
  const now = new Date().toISOString();

  const { data: existing, error: selectError } = await supabase
    .from("sms_conversations")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("borrower_phone", borrowerPhone)
    .maybeSingle();

  if (selectError) {
    console.error(
      "[SMS Inbound Webhook] Conversation select failed:",
      selectError.message
    );
    return;
  }

  if (existing) {
    const { error } = await supabase
      .from("sms_conversations")
      .update({ last_message_at: now, status: "active" })
      .eq("id", existing.id);

    if (error) {
      console.error(
        "[SMS Inbound Webhook] Conversation update failed:",
        error.message
      );
    }
    return;
  }

  const { error: insertError } = await supabase
    .from("sms_conversations")
    .insert({
      organization_id: organizationId,
      borrower_phone: borrowerPhone,
      last_message_at: now,
      status: "active",
    });

  if (!insertError) return;

  // 23505 = concurrent insert race -- retry as update
  if (insertError.code === "23505") {
    const { error: retryError } = await supabase
      .from("sms_conversations")
      .update({ last_message_at: now, status: "active" })
      .eq("organization_id", organizationId)
      .eq("borrower_phone", borrowerPhone);

    if (retryError) {
      console.error(
        "[SMS Inbound Webhook] Conversation retry update failed:",
        retryError.message
      );
    }
    return;
  }

  console.error(
    "[SMS Inbound Webhook] Conversation insert failed:",
    insertError.message
  );
}

// ── TwiML response ──────────────────────────────────────────────────────

function twimlResponse(message: string): NextResponse {
  const xml = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response/>`;

  return new NextResponse(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
