import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getNextRetryTime } from "@/lib/webhooks/retry";
import type { Database, Json } from "@/types/database.types";
import {
  OUTBOUND_WEBHOOK_EVENTS,
  type OutboundWebhookData,
  type OutboundWebhookEnvelope,
  type OutboundWebhookEventType,
} from "./types";

type SupabaseAdminClient = ReturnType<typeof createAdminClient>;
type WebhookSubscription =
  Database["public"]["Tables"]["webhook_subscriptions"]["Row"];
type WebhookDelivery = Database["public"]["Tables"]["webhook_deliveries"]["Row"];

interface DeliveryWithSubscription extends WebhookDelivery {
  webhook_subscriptions:
    | Pick<WebhookSubscription, "id" | "target_url" | "secret" | "is_active">
    | Pick<WebhookSubscription, "id" | "target_url" | "secret" | "is_active">[]
    | null;
}

export interface EmitWebhookEventResult {
  success: boolean;
  eventId: string;
  enqueued: number;
  error?: string;
}

export interface ProcessWebhookDeliveryQueueResult {
  processed: number;
  delivered: number;
  retried: number;
  dead: number;
  failed: number;
  errors: string[];
}

interface ServiceOptions {
  supabase?: SupabaseAdminClient;
  now?: () => Date;
  eventId?: () => string;
  fetch?: typeof fetch;
}

const DELIVERY_TIMEOUT_MS = 10_000;
const DELIVERY_CHUNK_SIZE = 8;
const ERROR_BODY_LIMIT_BYTES = 2048;

export function isOutboundWebhookEventType(
  eventType: string
): eventType is OutboundWebhookEventType {
  return OUTBOUND_WEBHOOK_EVENTS.includes(eventType as OutboundWebhookEventType);
}

export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(32).toString("hex")}`;
}

export function buildWebhookEnvelope<T extends OutboundWebhookEventType>(params: {
  id: string;
  type: T;
  createdAt: string;
  organizationId: string;
  data: OutboundWebhookData<T>;
}): OutboundWebhookEnvelope<T> {
  return {
    id: params.id,
    type: params.type,
    created_at: params.createdAt,
    organization_id: params.organizationId,
    data: params.data,
  };
}

export function signWebhookPayload(rawBody: string, secret: string): string {
  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return `sha256=${digest}`;
}

function subscriptionMatchesEvent(
  subscription: Pick<WebhookSubscription, "events">,
  type: OutboundWebhookEventType
): boolean {
  return subscription.events.length === 0 || subscription.events.includes(type);
}

function asSubscription(
  delivery: DeliveryWithSubscription
): Pick<WebhookSubscription, "id" | "target_url" | "secret" | "is_active"> | null {
  const subscription = delivery.webhook_subscriptions;
  if (Array.isArray(subscription)) {
    return subscription[0] ?? null;
  }
  return subscription;
}

function clampBatchSize(batchSize: number): number {
  return Math.min(Math.max(Math.floor(batchSize), 1), 100);
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "Unknown error";
}

function truncateError(message: string): string {
  return message.length > 500 ? `${message.slice(0, 497)}...` : message;
}

export async function emitWebhookEvent<T extends OutboundWebhookEventType>(
  params: {
    organizationId: string;
    type: T;
    data: OutboundWebhookData<T>;
  },
  options: ServiceOptions = {}
): Promise<EmitWebhookEventResult> {
  const eventId = options.eventId?.() ?? crypto.randomUUID();

  try {
    const supabase = options.supabase ?? createAdminClient();
    const createdAt = (options.now?.() ?? new Date()).toISOString();
    const envelope = buildWebhookEnvelope({
      id: eventId,
      type: params.type,
      createdAt,
      organizationId: params.organizationId,
      data: params.data,
    });

    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("webhook_subscriptions")
      .select("id, events")
      .eq("organization_id", params.organizationId)
      .eq("is_active", true);

    if (subscriptionsError) {
      console.error("[outbound-webhooks] Failed to load subscriptions:", subscriptionsError);
      return {
        success: false,
        eventId,
        enqueued: 0,
        error: subscriptionsError.message,
      };
    }

    const matchingSubscriptions = (subscriptions ?? []).filter((subscription) =>
      subscriptionMatchesEvent(subscription, params.type)
    );

    if (matchingSubscriptions.length === 0) {
      return { success: true, eventId, enqueued: 0 };
    }

    const rows: Database["public"]["Tables"]["webhook_deliveries"]["Insert"][] =
      matchingSubscriptions.map((subscription) => ({
        organization_id: params.organizationId,
        subscription_id: subscription.id,
        event_type: params.type,
        event_id: eventId,
        payload: envelope as unknown as Json,
        status: "pending",
        scheduled_at: createdAt,
      }));

    const { error: insertError } = await supabase
      .from("webhook_deliveries")
      .insert(rows);

    if (insertError) {
      console.error("[outbound-webhooks] Failed to enqueue deliveries:", insertError);
      return {
        success: false,
        eventId,
        enqueued: 0,
        error: insertError.message,
      };
    }

    return {
      success: true,
      eventId,
      enqueued: rows.length,
    };
  } catch (error) {
    const message = errorMessage(error);
    console.error("[outbound-webhooks] Event enqueue failed:", error);
    return { success: false, eventId, enqueued: 0, error: message };
  }
}

export async function hasActiveSubscriptions(
  organizationId: string,
  eventTypes: OutboundWebhookEventType[],
  options: Pick<ServiceOptions, "supabase"> = {}
): Promise<boolean> {
  try {
    const supabase = options.supabase ?? createAdminClient();
    const arrayLiteral = `{${eventTypes.map((type) => `"${type}"`).join(",")}}`;
    const { data, error } = await supabase
      .from("webhook_subscriptions")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .or(`events.eq.{},events.ov.${arrayLiteral}`)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[outbound-webhooks] Failed to check subscriptions:", error);
      return true;
    }

    return data != null;
  } catch (error) {
    console.error("[outbound-webhooks] Subscription check failed:", error);
    return true;
  }
}

async function getDueDeliveries(
  supabase: SupabaseAdminClient,
  batchSize: number,
  now: string
): Promise<DeliveryWithSubscription[]> {
  const { data, error } = await supabase
    .from("webhook_deliveries")
    .select(
      `
      *,
      webhook_subscriptions!inner (
        id,
        target_url,
        secret,
        is_active
      )
    `
    )
    .in("status", ["pending", "failed"])
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(batchSize);

  if (error) {
    console.error("[outbound-webhooks] Failed to fetch due deliveries:", error);
    return [];
  }

  return (data ?? []) as unknown as DeliveryWithSubscription[];
}

async function resetStuckDeliveries(
  supabase: SupabaseAdminClient,
  cutoff: string,
  now: string
): Promise<void> {
  const { error } = await supabase
    .from("webhook_deliveries")
    .update({
      status: "failed",
      scheduled_at: now,
      error_message: "Delivery worker timed out before completion",
    })
    .eq("status", "delivering")
    .lt("last_attempt_at", cutoff);

  if (error) {
    console.error("[outbound-webhooks] Failed to reset stuck deliveries:", error);
  }
}

async function claimDelivery(
  supabase: SupabaseAdminClient,
  delivery: DeliveryWithSubscription,
  now: string
): Promise<WebhookDelivery | null> {
  const nextAttempt = delivery.attempt_count + 1;
  const { data, error } = await supabase
    .from("webhook_deliveries")
    .update({
      status: "delivering",
      attempt_count: nextAttempt,
      last_attempt_at: now,
      error_message: null,
    })
    .eq("id", delivery.id)
    .in("status", ["pending", "failed"])
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[outbound-webhooks] Failed to claim delivery:", error);
    return null;
  }

  return data;
}

async function markDelivered(
  supabase: SupabaseAdminClient,
  delivery: WebhookDelivery,
  responseStatus: number,
  now: string
): Promise<void> {
  const { error: deliveryError } = await supabase
    .from("webhook_deliveries")
    .update({
      status: "delivered",
      delivered_at: now,
      response_status: responseStatus,
      error_message: null,
    })
    .eq("id", delivery.id);

  if (deliveryError) {
    throw new Error(`Failed to mark delivery delivered: ${deliveryError.message}`);
  }

  const { error: subscriptionError } = await supabase
    .from("webhook_subscriptions")
    .update({ last_delivery_at: now })
    .eq("id", delivery.subscription_id);

  if (subscriptionError) {
    throw new Error(
      `Failed to update subscription delivery timestamp: ${subscriptionError.message}`
    );
  }
}

async function incrementSubscriptionFailureCount(
  supabase: SupabaseAdminClient,
  subscriptionId: string
): Promise<void> {
  const { data, error: readError } = await supabase
    .from("webhook_subscriptions")
    .select("failure_count")
    .eq("id", subscriptionId)
    .maybeSingle();

  if (readError) {
    throw new Error(`Failed to read subscription failure count: ${readError.message}`);
  }

  const current = data?.failure_count ?? 0;
  const { error: updateError } = await supabase
    .from("webhook_subscriptions")
    .update({ failure_count: current + 1 })
    .eq("id", subscriptionId);

  if (updateError) {
    throw new Error(`Failed to update subscription failure count: ${updateError.message}`);
  }
}

async function markFailedOrDead(
  supabase: SupabaseAdminClient,
  delivery: WebhookDelivery,
  params: {
    responseStatus: number | null;
    errorMessage: string;
    now: string;
  }
): Promise<"retried" | "dead"> {
  const hasAttemptsLeft = delivery.attempt_count < delivery.max_attempts;
  const status = hasAttemptsLeft ? "failed" : "dead";
  const nextRetry = hasAttemptsLeft
    ? getNextRetryTime(delivery.attempt_count).toISOString()
    : params.now;

  const { error } = await supabase
    .from("webhook_deliveries")
    .update({
      status,
      scheduled_at: nextRetry,
      response_status: params.responseStatus,
      error_message: truncateError(params.errorMessage),
    })
    .eq("id", delivery.id);

  if (error) {
    throw new Error(`Failed to mark delivery ${status}: ${error.message}`);
  }

  if (status === "dead") {
    await incrementSubscriptionFailureCount(supabase, delivery.subscription_id);
    return "dead";
  }

  return "retried";
}

async function postDelivery(
  delivery: WebhookDelivery,
  subscription: Pick<WebhookSubscription, "target_url" | "secret">,
  fetchImpl: typeof fetch
): Promise<Response> {
  const rawBody = JSON.stringify(delivery.payload);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

  try {
    return await fetchImpl(subscription.target_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RepWell-Event": delivery.event_type,
        "X-RepWell-Delivery": delivery.id,
        "X-RepWell-Signature": signWebhookPayload(rawBody, subscription.secret),
      },
      body: rawBody,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function responseErrorMessage(response: Response): Promise<string> {
  let responseText = "";
  try {
    responseText = await readResponseBodyPrefix(response, ERROR_BODY_LIMIT_BYTES);
  } catch {
    responseText = "";
  }

  return responseText
    ? `HTTP ${response.status}: ${responseText.slice(0, 300)}`
    : `HTTP ${response.status}`;
}

async function readResponseBodyPrefix(
  response: Response,
  maxBytes: number
): Promise<string> {
  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let bytesRead = 0;

  while (bytesRead < maxBytes) {
    const { done, value } = await reader.read();
    if (done || !value) break;

    const remaining = maxBytes - bytesRead;
    const chunk = value.byteLength > remaining ? value.slice(0, remaining) : value;
    bytesRead += chunk.byteLength;
    chunks.push(decoder.decode(chunk, { stream: bytesRead < maxBytes }));

    if (value.byteLength > remaining) break;
  }

  try {
    await reader.cancel();
  } catch {
    // Best effort: the error body prefix is all we need.
  }

  chunks.push(decoder.decode());
  return chunks.join("");
}

function emptyQueueResult(): ProcessWebhookDeliveryQueueResult {
  return {
    processed: 0,
    delivered: 0,
    retried: 0,
    dead: 0,
    failed: 0,
    errors: [],
  };
}

function mergeQueueResult(
  target: ProcessWebhookDeliveryQueueResult,
  source: ProcessWebhookDeliveryQueueResult
): void {
  target.processed += source.processed;
  target.delivered += source.delivered;
  target.retried += source.retried;
  target.dead += source.dead;
  target.failed += source.failed;
  target.errors.push(...source.errors);
}

async function processDelivery(
  supabase: SupabaseAdminClient,
  pendingDelivery: DeliveryWithSubscription,
  now: string,
  fetchImpl: typeof fetch
): Promise<ProcessWebhookDeliveryQueueResult> {
  const result = emptyQueueResult();
  const subscription = asSubscription(pendingDelivery);
  if (!subscription?.is_active) {
    result.failed++;
    result.errors.push(`${pendingDelivery.id}: subscription inactive or missing`);
    return result;
  }

  const claimed = await claimDelivery(supabase, pendingDelivery, now);
  if (!claimed) {
    return result;
  }

  result.processed++;

  try {
    const response = await postDelivery(claimed, subscription, fetchImpl);
    if (response.ok) {
      await markDelivered(supabase, claimed, response.status, now);
      result.delivered++;
      return result;
    }

    const message = await responseErrorMessage(response);
    const state = await markFailedOrDead(supabase, claimed, {
      responseStatus: response.status,
      errorMessage: message,
      now,
    });
    if (state === "dead") result.dead++;
    else result.retried++;
  } catch (error) {
    const message = errorMessage(error);
    try {
      const state = await markFailedOrDead(supabase, claimed, {
        responseStatus: null,
        errorMessage: message,
        now,
      });
      if (state === "dead") result.dead++;
      else result.retried++;
    } catch (markError) {
      result.failed++;
      result.errors.push(`${claimed.id}: ${errorMessage(markError)}`);
    }
  }

  return result;
}

export async function processWebhookDeliveryQueue(
  batchSize: number = 50,
  options: ServiceOptions = {}
): Promise<ProcessWebhookDeliveryQueueResult> {
  const supabase = options.supabase ?? createAdminClient();
  const nowDate = options.now?.() ?? new Date();
  const now = nowDate.toISOString();
  const fetchImpl = options.fetch ?? fetch;
  const stuckCutoff = new Date(nowDate.getTime() - 15 * 60 * 1000).toISOString();
  await resetStuckDeliveries(supabase, stuckCutoff, now);
  const deliveries = await getDueDeliveries(supabase, clampBatchSize(batchSize), now);
  const result = emptyQueueResult();

  for (let index = 0; index < deliveries.length; index += DELIVERY_CHUNK_SIZE) {
    const chunk = deliveries.slice(index, index + DELIVERY_CHUNK_SIZE);
    const settled = await Promise.allSettled(
      chunk.map((delivery) => processDelivery(supabase, delivery, now, fetchImpl))
    );

    for (const item of settled) {
      if (item.status === "fulfilled") {
        mergeQueueResult(result, item.value);
      } else {
        result.failed++;
        result.errors.push(errorMessage(item.reason));
      }
    }
  }

  return result;
}

export async function deactivateOutboundWebhookSubscription(
  params: {
    subscriptionId: string;
    organizationId: string;
  },
  options: Pick<ServiceOptions, "supabase" | "now"> = {}
): Promise<{ success: true; found: boolean } | { success: false; error: string }> {
  const supabase = options.supabase ?? createAdminClient();
  const now = (options.now?.() ?? new Date()).toISOString();
  const { data, error } = await supabase
    .from("webhook_subscriptions")
    .update({
      is_active: false,
      updated_at: now,
    })
    .eq("id", params.subscriptionId)
    .eq("organization_id", params.organizationId)
    .eq("is_active", true)
    .select("id")
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, found: data != null };
}
