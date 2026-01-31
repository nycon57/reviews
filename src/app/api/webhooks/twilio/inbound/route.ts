import { NextRequest, NextResponse } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  validateTwilioSignature,
  buildWebhookUrl,
  OPT_OUT_KEYWORDS,
  OPT_IN_KEYWORDS,
  HELP_KEYWORDS,
} from "@/lib/sms/webhook-validation";

/**
 * Twilio Inbound SMS Webhook
 *
 * Receives incoming SMS messages from Twilio. Handles:
 * 1. STOP/UNSUBSCRIBE keywords → update consent to opted_out
 * 2. START/YES keywords → update consent to opted_in
 * 3. HELP keyword → reply with help text
 * 4. Regular messages → log to sms_messages, update/create conversation
 *
 * Returns TwiML responses for keyword-triggered auto-replies.
 *
 * @see https://www.twilio.com/docs/messaging/guides/how-to-receive-and-reply
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const params = Object.fromEntries(formData.entries()) as Record<string, string>;

  // Validate Twilio signature
  const signature = request.headers.get("x-twilio-signature");
  const webhookUrl = buildWebhookUrl(request);

  if (!validateTwilioSignature(signature, webhookUrl, params)) {
    console.warn("[SMS Inbound Webhook] Invalid Twilio signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const from = params.From; // Sender's phone number (E.164)
  const to = params.To;     // Our Twilio number (E.164)
  const body = params.Body ?? "";
  const messageSid = params.MessageSid;

  if (!from || !to) {
    return NextResponse.json(
      { error: "Missing From or To number" },
      { status: 400 }
    );
  }

  const supabase = createUntypedAdminClient();

  // Resolve which organization owns the receiving number
  const { data: phoneRecord } = await supabase
    .from("sms_phone_numbers")
    .select("organization_id")
    .eq("phone_number", to)
    .eq("status", "active")
    .maybeSingle();

  if (!phoneRecord) {
    console.warn(`[SMS Inbound Webhook] No org found for number: ${to}`);
    // Return 200 to prevent Twilio retries
    return twimlResponse("");
  }

  const organizationId = phoneRecord.organization_id;
  const normalizedBody = body.trim().toLowerCase();

  // Handle STOP/opt-out keywords
  if (OPT_OUT_KEYWORDS.has(normalizedBody)) {
    await handleOptOut(supabase, organizationId, from);
    await logInboundMessage(supabase, {
      organizationId,
      from,
      to,
      body,
      messageSid,
    });
    await incrementDailyStat(supabase, organizationId, "opted_out");
    return twimlResponse(
      "You have been unsubscribed. Reply START to resubscribe."
    );
  }

  // Handle START/opt-in keywords
  if (OPT_IN_KEYWORDS.has(normalizedBody)) {
    await handleOptIn(supabase, organizationId, from);
    await logInboundMessage(supabase, {
      organizationId,
      from,
      to,
      body,
      messageSid,
    });
    return twimlResponse(
      "You have been resubscribed. Reply STOP to unsubscribe."
    );
  }

  // Handle HELP keyword
  if (HELP_KEYWORDS.has(normalizedBody)) {
    await logInboundMessage(supabase, {
      organizationId,
      from,
      to,
      body,
      messageSid,
    });
    return twimlResponse(
      "Reply STOP to unsubscribe or START to resubscribe. For support, visit our website."
    );
  }

  // Regular inbound message — log and update conversation
  await logInboundMessage(supabase, {
    organizationId,
    from,
    to,
    body,
    messageSid,
  });

  await upsertConversation(supabase, organizationId, from);
  await incrementDailyStat(supabase, organizationId, "replied");

  // Return empty TwiML (no auto-reply for regular messages)
  return twimlResponse("");
}

// ── Keyword handlers ──────────────────────────────────────────────────

async function handleOptOut(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  organizationId: string,
  phone: string
): Promise<void> {
  const { data: existing } = await supabase
    .from("sms_consent")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("phone_number", phone)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("sms_consent")
      .update({
        status: "opted_out",
        opted_out_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("sms_consent").insert({
      organization_id: organizationId,
      phone_number: phone,
      status: "opted_out",
      consent_method: "sms_keyword",
      opted_out_at: new Date().toISOString(),
    });
  }
}

async function handleOptIn(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  organizationId: string,
  phone: string
): Promise<void> {
  const { data: existing } = await supabase
    .from("sms_consent")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("phone_number", phone)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("sms_consent")
      .update({
        status: "opted_in",
        consent_method: "sms_keyword",
        opted_in_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("sms_consent").insert({
      organization_id: organizationId,
      phone_number: phone,
      status: "opted_in",
      consent_method: "sms_keyword",
      opted_in_at: new Date().toISOString(),
    });
  }
}

// ── Message logging ───────────────────────────────────────────────────

interface InboundMessageParams {
  organizationId: string;
  from: string;
  to: string;
  body: string;
  messageSid?: string;
}

async function logInboundMessage(
  supabase: ReturnType<typeof createUntypedAdminClient>,
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
    console.error("[SMS Inbound Webhook] Failed to log message:", error.message);
  }
}

// ── Conversation tracking ─────────────────────────────────────────────

async function upsertConversation(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  organizationId: string,
  borrowerPhone: string
): Promise<void> {
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("sms_conversations")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("borrower_phone", borrowerPhone)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("sms_conversations")
      .update({ last_message_at: now, status: "active" })
      .eq("id", existing.id);
  } else {
    await supabase.from("sms_conversations").insert({
      organization_id: organizationId,
      borrower_phone: borrowerPhone,
      last_message_at: now,
      status: "active",
    });
  }
}

// ── Daily stats ───────────────────────────────────────────────────────

async function incrementDailyStat(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  organizationId: string,
  column: "replied" | "opted_out"
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("sms_daily_stats")
    .select("id, replied, opted_out")
    .eq("organization_id", organizationId)
    .is("loan_officer_id", null)
    .eq("date", today)
    .maybeSingle();

  if (existing) {
    const currentValue = (existing as Record<string, unknown>)[column] as number;
    await supabase
      .from("sms_daily_stats")
      .update({ [column]: currentValue + 1 })
      .eq("id", existing.id);
  } else {
    await supabase.from("sms_daily_stats").insert({
      organization_id: organizationId,
      loan_officer_id: null,
      date: today,
      [column]: 1,
    });
  }
}

// ── TwiML response helper ─────────────────────────────────────────────

/**
 * Return a TwiML XML response. Twilio expects XML content-type.
 * If message is empty, returns an empty <Response/> (no auto-reply).
 */
function twimlResponse(message: string): NextResponse {
  const xml = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response/>`;

  return new NextResponse(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

/** Escape special XML characters to prevent injection */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
