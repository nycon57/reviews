"use server";

/**
 * Thin adapter between the outbound-endpoints UI (camelCase view models)
 * and the webhook lib's server actions (snake_case row shapes).
 */

import {
  listOutboundWebhookSubscriptions,
  createOutboundWebhookSubscription,
  toggleOutboundWebhookSubscription,
  deleteOutboundWebhookSubscription,
  getRecentWebhookDeliveries,
  type OutboundWebhookSubscription as LibSubscription,
  type OutboundWebhookDeliverySummary as LibDelivery,
  type ActionResult,
} from "@/lib/webhooks/outbound/actions";
import type { OutboundWebhookEventType } from "@/lib/webhooks/outbound";

export type OutboundWebhookEvent = OutboundWebhookEventType;

export interface OutboundWebhookSubscription {
  id: string;
  targetUrl: string;
  events: OutboundWebhookEvent[];
  description: string | null;
  source: string;
  isActive: boolean;
  failureCount: number;
  lastDeliveryAt: string | null;
  createdAt: string;
  secret?: string;
}

export interface OutboundWebhookDelivery {
  id: string;
  eventId: string;
  eventType: OutboundWebhookEvent;
  status: string;
  responseStatus: number | null;
  attemptCount: number;
  maxAttempts: number;
  errorMessage: string | null;
  createdAt: string;
  lastAttemptAt: string | null;
  deliveredAt: string | null;
}

export interface CreateOutboundWebhookSubscriptionInput {
  targetUrl: string;
  events: OutboundWebhookEvent[];
  description?: string;
}

function toViewSubscription(
  row: LibSubscription & { secret?: string }
): OutboundWebhookSubscription {
  return {
    id: row.id,
    targetUrl: row.target_url,
    events: row.events,
    description: row.description,
    source: row.source,
    isActive: row.is_active,
    failureCount: row.failure_count,
    lastDeliveryAt: row.last_delivery_at,
    createdAt: row.created_at,
    ...(row.secret ? { secret: row.secret } : {}),
  };
}

function toViewDelivery(row: LibDelivery): OutboundWebhookDelivery {
  return {
    id: row.id,
    eventId: row.event_id,
    eventType: row.event_type as OutboundWebhookEvent,
    status: row.status,
    responseStatus: row.response_status,
    attemptCount: row.attempt_count,
    maxAttempts: row.max_attempts,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    lastAttemptAt: row.last_attempt_at,
    deliveredAt: row.delivered_at,
  };
}

function mapResult<T, U>(
  result: ActionResult<T>,
  map: (data: T) => U
): { success: boolean; data?: U; error?: string } {
  if (!result.success || result.data === undefined) {
    return { success: result.success, error: result.error };
  }
  return { success: true, data: map(result.data) };
}

export async function listOutboundEndpoints() {
  const result = await listOutboundWebhookSubscriptions();
  return mapResult(result, (rows) => rows.map(toViewSubscription));
}

export async function createOutboundEndpoint(
  input: CreateOutboundWebhookSubscriptionInput
) {
  const result = await createOutboundWebhookSubscription({
    target_url: input.targetUrl,
    events: input.events,
    description: input.description,
  });
  return mapResult(result, toViewSubscription);
}

export async function toggleOutboundEndpoint(id: string, isActive: boolean) {
  return toggleOutboundWebhookSubscription(id, isActive);
}

export async function deleteOutboundEndpoint(id: string) {
  return deleteOutboundWebhookSubscription(id);
}

export async function listOutboundDeliveries(subscriptionId: string) {
  const result = await getRecentWebhookDeliveries(subscriptionId);
  return mapResult(result, (rows) => rows.map(toViewDelivery));
}
