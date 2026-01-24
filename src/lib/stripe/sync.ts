import { createUntypedAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";
import type { Json } from "@/types/database.types";

// Helper type for accessing subscription properties that may vary between API versions
type SubscriptionWithPeriods = Stripe.Subscription & {
  current_period_start?: number;
  current_period_end?: number;
  start_date?: number;
  trial_start?: number;
  trial_end?: number;
  canceled_at?: number | null;
};

// Helper type for accessing invoice properties that may vary between API versions
type InvoiceWithSubscription = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null;
  due_date?: number | null;
  period_start?: number | null;
  period_end?: number | null;
  status_transitions?: {
    paid_at?: number | null;
  } | null;
};

// Helper to convert Unix timestamp to ISO string
function unixToIso(timestamp: number | null | undefined): string | null {
  if (!timestamp) return null;
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Sync subscription data from Stripe to Supabase
 */
export async function syncSubscription(
  subscription: Stripe.Subscription
): Promise<void> {
  const adminClient = createUntypedAdminClient();
  const sub = subscription as SubscriptionWithPeriods;

  // Get organization ID from customer metadata
  const customerId = subscription.customer as string;
  const { data: org } = await adminClient
    .from("organizations")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!org) {
    console.error("Organization not found for customer:", customerId);
    return;
  }

  // Determine plan tier from price ID
  const priceId = subscription.items.data[0]?.price?.id;
  const planTier = getPlanTierFromPriceId(priceId);

  // Upsert subscription
  await adminClient.from("subscriptions").upsert(
    {
      organization_id: org.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status: subscription.status,
      plan_tier: planTier,
      billing_cycle: subscription.items.data[0]?.price?.recurring?.interval || null,
      current_period_start: unixToIso(sub.current_period_start),
      current_period_end: unixToIso(sub.current_period_end),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: unixToIso(sub.canceled_at),
      trial_start: unixToIso(sub.trial_start),
      trial_end: unixToIso(sub.trial_end),
      quantity: subscription.items.data[0]?.quantity || 1,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "stripe_subscription_id",
    }
  );

  // Also update organization subscription status directly
  await adminClient
    .from("organizations")
    .update({
      subscription_status: subscription.status,
      subscription_tier: planTier,
      updated_at: new Date().toISOString(),
    })
    .eq("id", org.id);
}

/**
 * Sync subscription items
 */
export async function syncSubscriptionItems(
  subscription: Stripe.Subscription
): Promise<void> {
  const adminClient = createUntypedAdminClient();

  // Get local subscription ID
  const { data: localSub } = await adminClient
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (!localSub) return;

  // Sync each item
  for (const item of subscription.items.data) {
    await adminClient.from("subscription_items").upsert(
      {
        subscription_id: localSub.id,
        stripe_item_id: item.id,
        stripe_price_id: item.price.id,
        product_name: item.price.product
          ? (typeof item.price.product === "string"
              ? item.price.product
              : ("name" in item.price.product ? item.price.product.name : null) || "Unknown")
          : "Unknown",
        quantity: item.quantity,
        unit_amount: item.price.unit_amount,
        currency: item.price.currency,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "stripe_item_id",
      }
    );
  }
}

/**
 * Sync invoice data from Stripe to Supabase
 */
export async function syncInvoice(invoice: Stripe.Invoice): Promise<void> {
  const adminClient = createUntypedAdminClient();
  const inv = invoice as InvoiceWithSubscription;

  // Get organization ID from customer
  const customerId = inv.customer as string;
  const { data: org } = await adminClient
    .from("organizations")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!org) {
    console.error("Organization not found for customer:", customerId);
    return;
  }

  if (!inv.id) {
    console.error("Invoice ID is missing");
    return;
  }

  const invoiceId = inv.id;

  // Get local subscription ID if exists
  let subscriptionId: string | null = null;
  if (inv.subscription) {
    const stripeSubId =
      typeof inv.subscription === "string"
        ? inv.subscription
        : inv.subscription.id;
    const { data: localSub } = await adminClient
      .from("subscriptions")
      .select("id")
      .eq("stripe_subscription_id", stripeSubId)
      .single();
    subscriptionId = localSub?.id || null;
  }

  // Upsert invoice
  await adminClient.from("invoices").upsert(
    {
      organization_id: org.id,
      subscription_id: subscriptionId,
      stripe_invoice_id: invoiceId,
      stripe_customer_id: customerId,
      number: inv.number ?? null,
      status: inv.status ?? "draft",
      amount_due: inv.amount_due ?? 0,
      amount_paid: inv.amount_paid,
      amount_remaining: inv.amount_remaining,
      currency: inv.currency,
      due_date: inv.due_date
        ? new Date(inv.due_date * 1000).toISOString()
        : null,
      paid_at:
        inv.status === "paid" && inv.status_transitions?.paid_at
          ? new Date(inv.status_transitions.paid_at * 1000).toISOString()
          : null,
      pdf_url: inv.invoice_pdf,
      hosted_invoice_url: inv.hosted_invoice_url,
      billing_reason: inv.billing_reason,
      period_start: inv.period_start
        ? new Date(inv.period_start * 1000).toISOString()
        : null,
      period_end: inv.period_end
        ? new Date(inv.period_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "stripe_invoice_id",
    }
  );
}

/**
 * Sync payment method data from Stripe to Supabase
 */
export async function syncPaymentMethod(
  paymentMethod: Stripe.PaymentMethod,
  customerId: string,
  isDefault: boolean = false
): Promise<void> {
  const adminClient = createUntypedAdminClient();

  // Get organization ID from customer
  const { data: org } = await adminClient
    .from("organizations")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!org) {
    console.error("Organization not found for customer:", customerId);
    return;
  }

  // If this is default, unset other defaults first
  if (isDefault) {
    await adminClient
      .from("payment_methods")
      .update({ is_default: false })
      .eq("organization_id", org.id);
  }

  // Upsert payment method
  await adminClient.from("payment_methods").upsert(
    {
      organization_id: org.id,
      stripe_payment_method_id: paymentMethod.id,
      type: paymentMethod.type,
      card_brand: paymentMethod.card?.brand || null,
      card_last4: paymentMethod.card?.last4 || null,
      card_exp_month: paymentMethod.card?.exp_month || null,
      card_exp_year: paymentMethod.card?.exp_year || null,
      is_default: isDefault,
      billing_details: (paymentMethod.billing_details || {}) as unknown as Json,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "stripe_payment_method_id",
    }
  );
}

/**
 * Remove payment method from Supabase
 */
export async function removePaymentMethod(
  paymentMethodId: string
): Promise<void> {
  const adminClient = createUntypedAdminClient();

  await adminClient
    .from("payment_methods")
    .delete()
    .eq("stripe_payment_method_id", paymentMethodId);
}

/**
 * Log billing event for audit trail
 */
export async function logBillingEvent(
  event: Stripe.Event,
  organizationId?: string,
  error?: string
): Promise<void> {
  const adminClient = createUntypedAdminClient();

  await adminClient.from("billing_events").insert({
    organization_id: organizationId || null,
    stripe_event_id: event.id,
    event_type: event.type,
    stripe_object_id:
      (event.data.object as { id?: string })?.id || null,
    stripe_object_type: event.data.object?.object || null,
    data: event.data.object as unknown as Json,
    processed_at: new Date().toISOString(),
    error_message: error || null,
  });
}

/**
 * Update customer data from Stripe
 */
export async function syncCustomer(customer: Stripe.Customer): Promise<void> {
  const adminClient = createUntypedAdminClient();

  // Get organization
  const { data: org } = await adminClient
    .from("organizations")
    .select("id")
    .eq("stripe_customer_id", customer.id)
    .single();

  if (!org) return;

  // Update organization with customer data
  await adminClient
    .from("organizations")
    .update({
      billing_email: customer.email || undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", org.id);

  // Update default payment method if set
  if (customer.invoice_settings?.default_payment_method) {
    const pmId =
      typeof customer.invoice_settings.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : customer.invoice_settings.default_payment_method.id;

    // Set all payment methods to non-default first
    await adminClient
      .from("payment_methods")
      .update({ is_default: false })
      .eq("organization_id", org.id);

    // Set the default one
    await adminClient
      .from("payment_methods")
      .update({ is_default: true })
      .eq("organization_id", org.id)
      .eq("stripe_payment_method_id", pmId);
  }
}

/**
 * Get plan tier from Stripe price ID
 */
function getPlanTierFromPriceId(
  priceId: string | undefined
): "basic" | "pro" | "enterprise" {
  if (!priceId) return "basic";

  // Match against environment variables
  if (
    priceId === process.env.STRIPE_BASIC_PRICE_MONTHLY ||
    priceId === process.env.STRIPE_BASIC_PRICE_YEARLY
  ) {
    return "basic";
  }

  if (
    priceId === process.env.STRIPE_PRO_PRICE_MONTHLY ||
    priceId === process.env.STRIPE_PRO_PRICE_YEARLY
  ) {
    return "pro";
  }

  if (
    priceId === process.env.STRIPE_ENTERPRISE_PRICE_MONTHLY ||
    priceId === process.env.STRIPE_ENTERPRISE_PRICE_YEARLY
  ) {
    return "enterprise";
  }

  // Default to pro for unknown prices
  return "pro";
}
