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
import { requireAdminAccess } from "@/lib/webhooks/actions";
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

type ViewResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error?: string };

type EmptyResult = { success: true; error?: never } | { success: false; error?: string };

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

function mapResult<T, U>(result: ActionResult<T>, map: (data: T) => U): ViewResult<U> {
  if (!result.success || result.data === undefined) {
    return { success: false, error: result.error };
  }
  return { success: true, data: map(result.data) };
}

function mapEmptyResult(result: ActionResult<unknown>): EmptyResult {
  if (!result.success) {
    return { success: false, error: result.error };
  }
  return { success: true };
}

async function requireOutboundEndpointAccess(): Promise<EmptyResult> {
  const auth = await requireAdminAccess();
  if (!auth.success) {
    return { success: false, error: auth.error };
  }
  return { success: true };
}

export async function listOutboundEndpoints(): Promise<ViewResult<OutboundWebhookSubscription[]>> {
  const auth = await requireOutboundEndpointAccess();
  if (!auth.success) return auth;

  const result = await listOutboundWebhookSubscriptions();
  return mapResult(result, (rows) => rows.map(toViewSubscription));
}

export async function createOutboundEndpoint(
  input: CreateOutboundWebhookSubscriptionInput
): Promise<ViewResult<OutboundWebhookSubscription>> {
  const auth = await requireOutboundEndpointAccess();
  if (!auth.success) return auth;

  const result = await createOutboundWebhookSubscription({
    target_url: input.targetUrl,
    events: input.events,
    description: input.description,
  });
  return mapResult(result, toViewSubscription);
}

export async function toggleOutboundEndpoint(id: string, isActive: boolean): Promise<EmptyResult> {
  const auth = await requireOutboundEndpointAccess();
  if (!auth.success) return auth;

  return mapEmptyResult(await toggleOutboundWebhookSubscription(id, isActive));
}

export async function deleteOutboundEndpoint(id: string): Promise<EmptyResult> {
  const auth = await requireOutboundEndpointAccess();
  if (!auth.success) return auth;

  return mapEmptyResult(await deleteOutboundWebhookSubscription(id));
}

export async function listOutboundDeliveries(
  subscriptionId: string
): Promise<ViewResult<OutboundWebhookDelivery[]>> {
  const auth = await requireOutboundEndpointAccess();
  if (!auth.success) return auth;

  const result = await getRecentWebhookDeliveries(subscriptionId);
  return mapResult(result, (rows) => rows.map(toViewDelivery));
}
