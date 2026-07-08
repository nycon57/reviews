"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { unifiedGetUser } from "@/lib/auth/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  OUTBOUND_WEBHOOK_EVENTS,
  generateWebhookSecret,
  isOutboundWebhookEventType,
  type OutboundWebhookEventType,
} from "@/lib/webhooks/outbound";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface OutboundWebhookSubscription {
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

export interface OutboundWebhookDeliverySummary {
  id: string;
  event_type: string;
  event_id: string;
  status: string;
  attempt_count: number;
  response_status: number | null;
  error_message: string | null;
  created_at: string;
  last_attempt_at: string | null;
  delivered_at: string | null;
}

const subscriptionInputSchema = z.object({
  target_url: z.string().url().refine((value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "Webhook target URL must use HTTPS"),
  events: z.array(z.enum(OUTBOUND_WEBHOOK_EVENTS)).default([]),
  description: z.string().max(500).optional(),
});

async function requireAdminAccess(): Promise<
  | { success: true; organizationId: string; userId: string }
  | { success: false; error: string }
> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (error || !data?.organization_id) {
    return { success: false, error: "Organization not found" };
  }

  if (data.role !== "admin") {
    return { success: false, error: "Admin access required" };
  }

  return {
    success: true,
    organizationId: data.organization_id,
    userId: data.id,
  };
}

function normalizeEvents(events: string[]): OutboundWebhookEventType[] {
  return events.filter(isOutboundWebhookEventType);
}

function mapSubscriptionRow(row: {
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
}): OutboundWebhookSubscription {
  return {
    id: row.id,
    target_url: row.target_url,
    events: normalizeEvents(row.events),
    description: row.description,
    source: row.source,
    is_active: row.is_active,
    last_delivery_at: row.last_delivery_at,
    failure_count: row.failure_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listOutboundWebhookSubscriptions(): Promise<
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
      data: (data ?? []).map(mapSubscriptionRow),
    };
  } catch (error) {
    console.error("[outbound-webhooks] list subscriptions failed:", error);
    return { success: false, error: "Failed to load webhook subscriptions" };
  }
}

export async function createOutboundWebhookSubscription(input: {
  target_url: string;
  events?: OutboundWebhookEventType[];
  description?: string;
}): Promise<ActionResult<OutboundWebhookSubscription & { secret: string }>> {
  try {
    const auth = await requireAdminAccess();
    if (!auth.success) return { success: false, error: auth.error };

    const parsed = subscriptionInputSchema.safeParse(input);
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
        ...mapSubscriptionRow(data),
        secret,
      },
    };
  } catch (error) {
    console.error("[outbound-webhooks] create subscription failed:", error);
    return { success: false, error: "Failed to create webhook subscription" };
  }
}

export async function toggleOutboundWebhookSubscription(
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

export async function deleteOutboundWebhookSubscription(
  subscriptionId: string
): Promise<ActionResult> {
  try {
    const auth = await requireAdminAccess();
    if (!auth.success) return { success: false, error: auth.error };

    const supabase = createAdminClient();
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

export async function getRecentWebhookDeliveries(
  subscriptionId: string
): Promise<ActionResult<OutboundWebhookDeliverySummary[]>> {
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
        "id, event_type, event_id, status, attempt_count, response_status, error_message, created_at, last_attempt_at, delivered_at"
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
      data: data ?? [],
    };
  } catch (error) {
    console.error("[outbound-webhooks] recent deliveries failed:", error);
    return { success: false, error: "Failed to load webhook deliveries" };
  }
}
