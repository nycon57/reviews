"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/types/action-result";
import { requireAdminAccess } from "@/lib/webhooks/actions";
import { generateWebhookSecret } from "./service";
import {
  outboundWebhookSubscriptionInputSchema,
  type OutboundWebhookEventType,
} from "./types";
import {
  mapOutboundWebhookSubscriptionView,
  type OutboundWebhookSubscriptionView,
} from "./subscriptions";

export type OutboundWebhookEvent = OutboundWebhookEventType;
export type OutboundWebhookSubscription = OutboundWebhookSubscriptionView;

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

function mapDeliveryRow(row: {
  id: string;
  event_type: string;
  event_id: string;
  status: string;
  attempt_count: number;
  response_status: number | null;
  max_attempts: number;
  error_message: string | null;
  created_at: string;
  last_attempt_at: string | null;
  delivered_at: string | null;
}): OutboundWebhookDelivery {
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

export async function listOutboundEndpoints(): Promise<
  ActionResult<OutboundWebhookSubscription[]>
> {
  try {
    const auth = await requireAdminAccess();
    if (!auth.success) return { success: false, error: auth.error };

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("webhook_subscriptions")
      .select(
        "id, target_url, events, description, source, is_active, last_delivery_at, failure_count, created_at, updated_at"
      )
      .eq("organization_id", auth.organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: (data ?? []).map(mapOutboundWebhookSubscriptionView),
    };
  } catch (error) {
    console.error("[outbound-webhooks] list subscriptions failed:", error);
    return { success: false, error: "Failed to load webhook subscriptions" };
  }
}

export async function createOutboundEndpoint(
  input: CreateOutboundWebhookSubscriptionInput
): Promise<ActionResult<OutboundWebhookSubscription & { secret: string }>> {
  try {
    const auth = await requireAdminAccess();
    if (!auth.success) return { success: false, error: auth.error };

    const parsed = outboundWebhookSubscriptionInputSchema.safeParse({
      target_url: input.targetUrl,
      events: input.events,
      description: input.description,
    });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message ?? "Invalid webhook subscription",
      };
    }

    const supabase = createAdminClient();
    const secret = generateWebhookSecret();
    const { data, error } = await supabase
      .from("webhook_subscriptions")
      .insert({
        organization_id: auth.organizationId,
        target_url: parsed.data.target_url,
        events: parsed.data.events,
        description: parsed.data.description ?? null,
        secret,
        source: "dashboard",
        created_by: auth.userId,
      })
      .select(
        "id, target_url, events, description, source, is_active, last_delivery_at, failure_count, created_at, updated_at"
      )
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/organization");
    return {
      success: true,
      data: {
        ...mapOutboundWebhookSubscriptionView(data),
        secret,
      },
    };
  } catch (error) {
    console.error("[outbound-webhooks] create subscription failed:", error);
    return { success: false, error: "Failed to create webhook subscription" };
  }
}

export async function toggleOutboundEndpoint(
  subscriptionId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const auth = await requireAdminAccess();
    if (!auth.success) return { success: false, error: auth.error };

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("webhook_subscriptions")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId)
      .eq("organization_id", auth.organizationId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/organization");
    return { success: true };
  } catch (error) {
    console.error("[outbound-webhooks] toggle subscription failed:", error);
    return { success: false, error: "Failed to update webhook subscription" };
  }
}

export async function deleteOutboundEndpoint(
  subscriptionId: string
): Promise<ActionResult> {
  try {
    const auth = await requireAdminAccess();
    if (!auth.success) return { success: false, error: auth.error };

    const supabase = createAdminClient();
    // Dashboard deletes are hard deletes after an explicit confirmation; REST
    // unsubscribe only deactivates so Zapier delivery history remains intact.
    const { error } = await supabase
      .from("webhook_subscriptions")
      .delete()
      .eq("id", subscriptionId)
      .eq("organization_id", auth.organizationId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/organization");
    return { success: true };
  } catch (error) {
    console.error("[outbound-webhooks] delete subscription failed:", error);
    return { success: false, error: "Failed to delete webhook subscription" };
  }
}

export async function listOutboundDeliveries(
  subscriptionId: string
): Promise<ActionResult<OutboundWebhookDelivery[]>> {
  try {
    const auth = await requireAdminAccess();
    if (!auth.success) return { success: false, error: auth.error };

    const supabase = createAdminClient();
    const { data: subscription, error: subscriptionError } = await supabase
      .from("webhook_subscriptions")
      .select("id")
      .eq("id", subscriptionId)
      .eq("organization_id", auth.organizationId)
      .maybeSingle();

    if (subscriptionError) {
      return { success: false, error: subscriptionError.message };
    }

    if (!subscription) {
      return { success: false, error: "Webhook subscription not found" };
    }

    const { data, error } = await supabase
      .from("webhook_deliveries")
      .select(
        "id, event_type, event_id, status, attempt_count, max_attempts, response_status, error_message, created_at, last_attempt_at, delivered_at"
      )
      .eq("organization_id", auth.organizationId)
      .eq("subscription_id", subscriptionId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: (data ?? []).map(mapDeliveryRow),
    };
  } catch (error) {
    console.error("[outbound-webhooks] recent deliveries failed:", error);
    return { success: false, error: "Failed to load webhook deliveries" };
  }
}
