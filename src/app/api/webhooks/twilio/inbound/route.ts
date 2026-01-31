import { NextRequest, NextResponse } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import type { UntypedSupabaseClient } from "@/lib/supabase/admin";
import {
  validateTwilioSignature,
  buildWebhookUrl,
  OPT_OUT_KEYWORDS,
  OPT_IN_KEYWORDS,
  HELP_KEYWORDS,
} from "@/lib/sms/webhook-validation";
import { incrementDailyStat } from "@/lib/sms/daily-stats";

export const dynamic = "force-dynamic";

/**
 * Twilio Inbound SMS Webhook
 *
 * Receives incoming SMS messages from Twilio. Handles:
 * 1. STOP/UNSUBSCRIBE keywords -> update consent to opted_out
 * 2. START/YES keywords -> update consent to opted_in
 * 3. HELP keyword -> reply with help text
 * 4. Regular messages -> log to sms_messages, update/create conversation
 *
 * Returns TwiML responses for keyword-triggered auto-replies.
 *
 * @see https://www.twilio.com/docs/messaging/guides/how-to-receive-and-reply
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
    const normalizedBody = body.trim().toLowerCase();

    // Log every inbound message regardless of keyword type
    await logInboundMessage(supabase, {
      organizationId,
      from,
      to,
      body,
      messageSid,
    });

    // Handle STOP/opt-out keywords
    if (OPT_OUT_KEYWORDS.has(normalizedBody)) {
      const consentOk = await upsertConsent(
        supabase,
        organizationId,
        from,
        "opted_out"
      );
      await incrementDailyStat(supabase, organizationId, null, todayDate(), "opted_out");

      if (!consentOk) {
        // Per TCPA: always honor STOP even if DB fails
        console.error(
          "[SMS Inbound Webhook] Consent update failed for opt-out, still sending confirmation"
        );
      }
      return twimlResponse(
        "You have been unsubscribed. Reply START to resubscribe."
      );
    }

    // Handle START/opt-in keywords
    if (OPT_IN_KEYWORDS.has(normalizedBody)) {
      const consentOk = await upsertConsent(
        supabase,
        organizationId,
        from,
        "opted_in"
      );

      if (!consentOk) {
        console.error(
          "[SMS Inbound Webhook] Consent update failed for opt-in, still sending confirmation"
        );
      }
      return twimlResponse(
        "You have been resubscribed. Reply STOP to unsubscribe."
      );
    }

    // Handle HELP keyword
    if (HELP_KEYWORDS.has(normalizedBody)) {
      return twimlResponse(
        "Reply STOP to unsubscribe or START to resubscribe. For support, contact your loan officer directly."
      );
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

// ── Consent management ──────────────────────────────────────────────────

/**
 * Upsert consent record. Returns true on success.
 * Uses select-then-insert with retry on unique constraint race.
 */
async function upsertConsent(
  supabase: UntypedSupabaseClient,
  organizationId: string,
  phone: string,
  status: "opted_in" | "opted_out"
): Promise<boolean> {
  const now = new Date().toISOString();
  const timestampField =
    status === "opted_out" ? "opted_out_at" : "opted_in_at";

  const { data: existing, error: selectError } = await supabase
    .from("sms_consent")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("phone_number", phone)
    .maybeSingle();

  if (selectError) {
    console.error(
      "[SMS Inbound Webhook] Consent select failed:",
      selectError.message
    );
    return false;
  }

  if (existing) {
    const { error } = await supabase
      .from("sms_consent")
      .update({
        status,
        consent_method: "sms_keyword",
        [timestampField]: now,
      })
      .eq("id", existing.id);

    if (error) {
      console.error(
        "[SMS Inbound Webhook] Consent update failed:",
        error.message
      );
      return false;
    }
    return true;
  }

  const { error: insertError } = await supabase.from("sms_consent").insert({
    organization_id: organizationId,
    phone_number: phone,
    status,
    consent_method: "sms_keyword",
    [timestampField]: now,
  });

  if (!insertError) return true;

  // 23505 = unique constraint violation -- retry as update
  if (insertError.code === "23505") {
    return upsertConsent(supabase, organizationId, phone, status);
  }

  console.error(
    "[SMS Inbound Webhook] Consent insert failed:",
    insertError.message
  );
  return false;
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
