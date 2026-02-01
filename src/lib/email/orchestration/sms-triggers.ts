"use server";

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

// Event Types

export interface InboundSmsEvent {
  organizationId: string;
  /** Sender phone number (E.164) */
  fromPhone: string;
  /** Recipient phone number (E.164) */
  toPhone: string;
  body: string;
  twilioSid?: string;
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

// Helpers

/** Resolve a user ID from a phone number. Returns undefined if no user found. */
async function resolveUserIdByPhone(phone: string): Promise<string | undefined> {
  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();
  return user?.id;
}

/** Dispatch a trigger event to all sequence definitions and collect results. */
async function dispatchToDefinitions(
  event: TriggerEvent,
  context: TriggerContext,
  definitions: Map<SequenceType, SequenceDefinition>
): Promise<Map<SequenceType, StartSequenceResult>> {
  const results = new Map<SequenceType, StartSequenceResult>();

  for (const [type, definition] of definitions) {
    const result = await handleEventTrigger(definition, event, context);
    results.set(type, result);
  }

  return results;
}

// SMS Trigger Handlers

/** Handle an inbound SMS message by dispatching "sms_received" to all registered sequences. */
export async function handleInboundSmsTrigger(
  event: InboundSmsEvent,
  sequenceDefinitions: Map<SequenceType, SequenceDefinition>
): Promise<Map<SequenceType, StartSequenceResult>> {
  const supabase = createAdminClient();

  const { data: user } = await supabase
    .from("users")
    .select("id, organization_id")
    .eq("phone", event.fromPhone)
    .maybeSingle();

  if (!user) {
    return new Map();
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

  return dispatchToDefinitions("sms_received", context, sequenceDefinitions);
}

/** Handle an SMS opt-in event by dispatching "sms_opt_in" to trigger welcome/onboarding sequences. */
export async function handleSmsOptInTrigger(
  event: SmsConsentEvent,
  sequenceDefinitions: Map<SequenceType, SequenceDefinition>
): Promise<Map<SequenceType, StartSequenceResult>> {
  const userId = event.userId ?? (await resolveUserIdByPhone(event.phone));
  if (!userId) return new Map();

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

  return dispatchToDefinitions("sms_opt_in", context, sequenceDefinitions);
}

/** Exit all active sequences with SMS steps when a user opts out of SMS. */
export async function handleSmsOptOutTrigger(
  event: SmsConsentEvent
): Promise<{ exited: number }> {
  const supabase = createAdminClient();

  const userId = event.userId ?? (await resolveUserIdByPhone(event.phone));
  if (!userId) return { exited: 0 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sequences } = await (supabase.from as any)("email_sequences")
    .select("id, metadata")
    .eq("user_id", userId)
    .eq("organization_id", event.organizationId)
    .in("status", ["active", "paused"]);

  if (!sequences || sequences.length === 0) return { exited: 0 };

  let exitedCount = 0;

  for (const seq of sequences) {
    const meta = seq.metadata as Record<string, unknown> | null;
    if (meta?.hasSmsChannelSteps === true) {
      await updateSequenceStatus(seq.id, "exited", "sms_consent_revoked");
      exitedCount++;
    }
  }

  return { exited: exitedCount };
}

/** Update sequence metadata with SMS delivery status for conditional branch evaluation. */
export async function handleSmsDeliveryEvent(
  event: SmsDeliveryEvent
): Promise<void> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: message } = await (supabase.from as any)("sms_messages")
    .select("flow_execution_id, campaign_id")
    .eq("id", event.messageId)
    .maybeSingle();

  if (!message?.flow_execution_id) return;

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
