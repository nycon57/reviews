"use server";

/**
 * Campaign Sequencer — Inbound SMS Trigger Node
 *
 * Handles inbound SMS events that can trigger or affect campaign sequences:
 * - sms_received: Start a sequence when a user sends an SMS
 * - sms_opt_in: Start a sequence when a user opts in to SMS
 * - sms_opt_out: Exit active sequences when a user opts out
 * - sms_delivered / sms_failed: Track delivery for conditional logic
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  TriggerEvent,
  TriggerContext,
  SequenceDefinition,
  SequenceType,
  StartSequenceResult,
} from "./types";
import { handleEventTrigger } from "./triggers";
import { updateSequenceStatus } from "./executor";

// ============================================================================
// Inbound SMS Event Types
// ============================================================================

export interface InboundSmsEvent {
  /** The organization receiving the SMS */
  organizationId: string;
  /** Sender phone number (E.164) */
  fromPhone: string;
  /** Recipient phone number (E.164) */
  toPhone: string;
  /** Message body */
  body: string;
  /** Twilio message SID */
  twilioSid?: string;
  /** Matched keyword (if any) */
  keyword?: string;
}

export interface SmsConsentEvent {
  organizationId: string;
  phone: string;
  userId?: string;
  method: string;
}

export interface SmsDeliveryEvent {
  organizationId: string;
  messageId: string;
  twilioSid: string;
  status: "delivered" | "undelivered" | "failed";
  errorCode?: string;
}

// ============================================================================
// SMS Trigger Handlers
// ============================================================================

/**
 * Handle an inbound SMS message. Looks up the sender, then dispatches
 * an "sms_received" event to all registered sequences.
 */
export async function handleInboundSmsTrigger(
  event: InboundSmsEvent,
  sequenceDefinitions: Map<SequenceType, SequenceDefinition>
): Promise<Map<SequenceType, StartSequenceResult>> {
  const supabase = createAdminClient();
  const results = new Map<SequenceType, StartSequenceResult>();

  // Resolve user from phone number
  const { data: user } = await supabase
    .from("users")
    .select("id, organization_id")
    .eq("phone", event.fromPhone)
    .maybeSingle();

  if (!user) {
    // Unknown sender — can't trigger a user-scoped sequence
    return results;
  }

  const context: TriggerContext = {
    userId: user.id,
    organizationId: event.organizationId,
    event: "sms_received" as TriggerEvent,
    eventData: {
      fromPhone: event.fromPhone,
      toPhone: event.toPhone,
      body: event.body,
      keyword: event.keyword,
      twilioSid: event.twilioSid,
    },
    metadata: {
      smsBody: event.body,
      smsKeyword: event.keyword,
    },
  };

  for (const [type, definition] of sequenceDefinitions) {
    const result = await handleEventTrigger(definition, "sms_received", context);
    results.set(type, result);
  }

  return results;
}

/**
 * Handle an SMS opt-in event. Dispatches "sms_opt_in" to trigger
 * welcome or onboarding sequences.
 */
export async function handleSmsOptInTrigger(
  event: SmsConsentEvent,
  sequenceDefinitions: Map<SequenceType, SequenceDefinition>
): Promise<Map<SequenceType, StartSequenceResult>> {
  const results = new Map<SequenceType, StartSequenceResult>();

  // Resolve user if not provided
  let userId = event.userId;
  if (!userId) {
    const supabase = createAdminClient();
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("phone", event.phone)
      .maybeSingle();
    userId = user?.id;
  }

  if (!userId) return results;

  const context: TriggerContext = {
    userId,
    organizationId: event.organizationId,
    event: "sms_opt_in" as TriggerEvent,
    eventData: {
      phone: event.phone,
      method: event.method,
    },
    metadata: {
      consentMethod: event.method,
    },
  };

  for (const [type, definition] of sequenceDefinitions) {
    const result = await handleEventTrigger(definition, "sms_opt_in", context);
    results.set(type, result);
  }

  return results;
}

/**
 * Handle an SMS opt-out event. Exits all active sequences that contain
 * SMS steps for the user, since we can no longer send them SMS.
 */
export async function handleSmsOptOutTrigger(
  event: SmsConsentEvent
): Promise<{ exited: number }> {
  const supabase = createAdminClient();
  let exitedCount = 0;

  // Resolve user if not provided
  let userId = event.userId;
  if (!userId) {
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("phone", event.phone)
      .maybeSingle();
    userId = user?.id;
  }

  if (!userId) return { exited: 0 };

  // Find all active sequences for this user in this organization
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequences } = await (supabase.from as any)("email_sequences")
    .select("id, metadata")
    .eq("user_id", userId)
    .eq("organization_id", event.organizationId)
    .in("status", ["active", "paused"]);

  if (!sequences || sequences.length === 0) return { exited: 0 };

  // Exit sequences that have SMS channel steps
  for (const seq of sequences) {
    // Check if sequence metadata indicates SMS usage
    const meta = seq.metadata as Record<string, unknown> | null;
    const hasSmsSteps = meta?.hasSmsChannelSteps === true;

    if (hasSmsSteps) {
      await updateSequenceStatus(
        seq.id,
        "exited",
        "sms_consent_revoked",
        undefined
      );
      exitedCount++;
    }
  }

  return { exited: exitedCount };
}

/**
 * Handle SMS delivery status updates. Updates sequence metadata
 * so conditional branches can check delivery outcomes.
 */
export async function handleSmsDeliveryEvent(
  event: SmsDeliveryEvent
): Promise<void> {
  const supabase = createAdminClient();

  // Find the SMS message to get the flow_execution_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: message } = await (supabase.from as any)("sms_messages")
    .select("flow_execution_id, campaign_id")
    .eq("id", event.messageId)
    .maybeSingle();

  if (!message?.flow_execution_id) return;

  // Update the sequence record metadata with delivery status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequence } = await (supabase.from as any)("email_sequences")
    .select("id, metadata")
    .eq("id", message.flow_execution_id)
    .maybeSingle();

  if (!sequence) return;

  const updatedMetadata = {
    ...(sequence.metadata as Record<string, unknown>),
    [`sms_delivery_${event.messageId}`]: {
      status: event.status,
      errorCode: event.errorCode,
      updatedAt: new Date().toISOString(),
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from as any)("email_sequences")
    .update({
      metadata: updatedMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sequence.id);
}
