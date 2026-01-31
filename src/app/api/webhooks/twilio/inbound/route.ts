import { NextRequest, NextResponse } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  validateTwilioSignature,
  buildWebhookUrl,
  OPT_OUT_KEYWORDS,
  OPT_IN_KEYWORDS,
  HELP_KEYWORDS,
} from "@/lib/sms/webhook-validation";

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
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params = Object.fromEntries(formData.entries()) as Record<
      string,
      string
    >;

    // Validate Twilio signature
    const signature = request.headers.get("x-twilio-signature");
    const webhookUrl = buildWebhookUrl(request);

    if (!validateTwilioSignature(signature, webhookUrl, params)) {
      console.warn("[SMS Inbound Webhook] Invalid Twilio signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }

    const from = params.From; // Sender's phone number (E.164)
    const to = params.To; // Our Twilio number (E.164)
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
      console.warn(
        "[SMS Inbound Webhook] No org found for receiving number"
      );
      return twimlResponse("");
    }

    const organizationId = phoneRecord.organization_id;
    const normalizedBody = body.trim().toLowerCase();

    // Handle STOP/opt-out keywords
    if (OPT_OUT_KEYWORDS.has(normalizedBody)) {
      const consentOk = await upsertConsent(
        supabase,
        organizationId,
        from,
        "opted_out"
      );

      await logInboundMessage(supabase, {
        organizationId,
        from,
        to,
        body,
        messageSid,
      });
      await safeIncrementDailyStat(supabase, organizationId, "opted_out");

      if (!consentOk) {
        // Consent update failed — still reply with opt-out confirmation
        // per TCPA: always honor STOP even if DB fails
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

      await logInboundMessage(supabase, {
        organizationId,
        from,
        to,
        body,
        messageSid,
      });

      if (!consentOk) {
        console.error(
          "[SMS Inbound Webhook] Consent update failed for opt-in"
        );
      }
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
    await safeIncrementDailyStat(supabase, organizationId, "replied");

    return twimlResponse("");
  } catch (error) {
    console.error("[SMS Inbound Webhook] Unexpected error:", error);
    // Return empty TwiML to prevent Twilio retry loops
    return twimlResponse("");
  }
}

// ── Consent management (upsert pattern for race safety) ─────────────

/**
 * Upsert consent record using insert-on-conflict pattern.
 * Returns true if the operation succeeded.
 */
async function upsertConsent(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  organizationId: string,
  phone: string,
  status: "opted_in" | "opted_out"
): Promise<boolean> {
  const now = new Date().toISOString();
  const timestampField = status === "opted_out" ? "opted_out_at" : "opted_in_at";

  // Try update first (most common case for returning users)
  const { data: existing, error: selectError } = await supabase
    .from("sms_consent")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("phone_number", phone)
    .maybeSingle();

  if (selectError) {
    console.error("[SMS Inbound Webhook] Consent select failed:", selectError.message);
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
      console.error("[SMS Inbound Webhook] Consent update failed:", error.message);
      return false;
    }
    return true;
  }

  // Insert new record, handle concurrent insert race
  const { error: insertError } = await supabase.from("sms_consent").insert({
    organization_id: organizationId,
    phone_number: phone,
    status,
    consent_method: "sms_keyword",
    [timestampField]: now,
  });

  if (insertError) {
    // Unique constraint violation — another request inserted first, retry as update
    if (insertError.code === "23505") {
      return upsertConsent(supabase, organizationId, phone, status);
    }
    console.error("[SMS Inbound Webhook] Consent insert failed:", insertError.message);
    return false;
  }

  return true;
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
    console.error(
      "[SMS Inbound Webhook] Failed to log message:",
      error.message
    );
  }
}

// ── Conversation tracking ─────────────────────────────────────────────

async function upsertConversation(
  supabase: ReturnType<typeof createUntypedAdminClient>,
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
  } else {
    const { error } = await supabase.from("sms_conversations").insert({
      organization_id: organizationId,
      borrower_phone: borrowerPhone,
      last_message_at: now,
      status: "active",
    });

    if (error) {
      // Handle concurrent insert — if duplicate, just update instead
      if (error.code === "23505") {
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
        error.message
      );
    }
  }
}

// ── Daily stats ───────────────────────────────────────────────────────

async function safeIncrementDailyStat(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  organizationId: string,
  column: "replied" | "opted_out"
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  // Try atomic RPC first
  const { error: rpcError } = await supabase.rpc("increment_sms_daily_stat", {
    p_organization_id: organizationId,
    p_loan_officer_id: null,
    p_date: today,
    p_column_name: column,
  });

  if (rpcError) {
    // Fallback if RPC doesn't exist
    if (rpcError.code === "42883") {
      await fallbackIncrementStat(supabase, organizationId, today, column);
      return;
    }
    console.error(
      "[SMS Inbound Webhook] Stats RPC failed:",
      rpcError.message
    );
  }
}

async function fallbackIncrementStat(
  supabase: ReturnType<typeof createUntypedAdminClient>,
  organizationId: string,
  date: string,
  column: string
): Promise<void> {
  const { data: existing, error: selectError } = await supabase
    .from("sms_daily_stats")
    .select("id, replied, opted_out")
    .eq("organization_id", organizationId)
    .is("loan_officer_id", null)
    .eq("date", date)
    .maybeSingle();

  if (selectError) {
    console.error(
      "[SMS Inbound Webhook] Stats select failed:",
      selectError.message
    );
    return;
  }

  if (existing) {
    const record = existing as unknown as Record<string, unknown>;
    const currentValue = (record[column] as number) ?? 0;
    const { error } = await supabase
      .from("sms_daily_stats")
      .update({ [column]: currentValue + 1 })
      .eq("id", existing.id);

    if (error) {
      console.error(
        "[SMS Inbound Webhook] Stats update failed:",
        error.message
      );
    }
  } else {
    const { error } = await supabase.from("sms_daily_stats").insert({
      organization_id: organizationId,
      loan_officer_id: null,
      date,
      [column]: 1,
    });

    if (error) {
      if (error.code === "23505") {
        await fallbackIncrementStat(supabase, organizationId, date, column);
        return;
      }
      console.error(
        "[SMS Inbound Webhook] Stats insert failed:",
        error.message
      );
    }
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
