import { isOutboundWebhookEventType } from "./service";
import type { OutboundWebhookEventType } from "./types";

export interface OutboundWebhookSubscriptionRow {
  id: string;
  target_url: string;
  events: string[];
  description: string | null;
  source: string;
  is_active: boolean;
  last_delivery_at: string | null;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

export interface OutboundWebhookSubscriptionApi {
  id: string;
  target_url: string;
  events: OutboundWebhookEventType[];
  description: string | null;
  source: string;
  is_active: boolean;
  last_delivery_at: string | null;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

export interface OutboundWebhookSubscriptionView {
  id: string;
  targetUrl: string;
  events: OutboundWebhookEventType[];
  description: string | null;
  source: string;
  isActive: boolean;
  failureCount: number;
  lastDeliveryAt: string | null;
  createdAt: string;
  updatedAt: string;
  secret?: string;
}

export function normalizeOutboundWebhookEvents(
  events: string[]
): OutboundWebhookEventType[] {
  return events.filter(isOutboundWebhookEventType);
}

export function mapOutboundWebhookSubscriptionRow(
  row: OutboundWebhookSubscriptionRow
): OutboundWebhookSubscriptionApi {
  return {
    id: row.id,
    target_url: row.target_url,
    events: normalizeOutboundWebhookEvents(row.events),
    description: row.description,
    source: row.source,
    is_active: row.is_active,
    last_delivery_at: row.last_delivery_at,
    failure_count: row.failure_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapOutboundWebhookSubscriptionView(
  row: OutboundWebhookSubscriptionRow & { secret?: string }
): OutboundWebhookSubscriptionView {
  const subscription = mapOutboundWebhookSubscriptionRow(row);

  const view: OutboundWebhookSubscriptionView = {
    id: subscription.id,
    targetUrl: subscription.target_url,
    events: subscription.events,
    description: subscription.description,
    source: subscription.source,
    isActive: subscription.is_active,
    failureCount: subscription.failure_count,
    lastDeliveryAt: subscription.last_delivery_at,
    createdAt: subscription.created_at,
    updatedAt: subscription.updated_at,
  };

  // The secret is only ever returned on creation and rotation.
  if (row.secret) {
    view.secret = row.secret;
  }

  return view;
}
