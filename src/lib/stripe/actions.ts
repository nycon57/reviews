"use server";

import { revalidatePath } from "next/cache";
import { createClient, createUntypedServerClient } from "@/lib/supabase/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "./server";
import {
  createCheckoutSessionSchema,
  createPortalSessionSchema,
  updateSubscriptionSchema,
  getPricingTier,
  type CreateCheckoutSessionInput,
  type CreatePortalSessionInput,
  type UpdateSubscriptionInput,
  type SubscriptionData,
  type InvoiceData,
  type PaymentMethodData,
  type BillingOverview,
  type SubscriptionStatus,
  type SubscriptionTier,
  type BillingCycle,
  PRICING_TIERS,
} from "./types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Get or create a Stripe customer for the organization
 */
export async function getOrCreateStripeCustomer(): Promise<{
  success: boolean;
  customerId?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get user's organization
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("organization_id, role, full_name, email")
    .eq("id", user.id)
    .single();

  if (userError || !userData?.organization_id) {
    return { success: false, error: "Organization not found" };
  }

  // Only admins can manage billing
  if (userData.role !== "admin") {
    return { success: false, error: "Only admins can manage billing" };
  }

  // Get organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, stripe_customer_id, billing_email")
    .eq("id", userData.organization_id)
    .single();

  if (orgError || !org) {
    return { success: false, error: "Organization not found" };
  }

  // If customer already exists, return it
  if (org.stripe_customer_id) {
    return { success: true, customerId: org.stripe_customer_id };
  }

  // Create Stripe customer
  const stripe = getStripe();

  try {
    const customer = await stripe.customers.create({
      name: org.name,
      email: org.billing_email || userData.email,
      metadata: {
        organization_id: org.id,
        created_by: user.id,
      },
    });

    // Update organization with Stripe customer ID
    const adminClient = createUntypedAdminClient();
    await adminClient
      .from("organizations")
      .update({ stripe_customer_id: customer.id })
      .eq("id", org.id);

    return { success: true, customerId: customer.id };
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    return { success: false, error: "Failed to create customer" };
  }
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  input: CreateCheckoutSessionInput
): Promise<{ success: boolean; sessionId?: string; url?: string; error?: string }> {
  const validated = createCheckoutSessionSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.message };
  }

  const { priceId, billingCycle, successUrl, cancelUrl } = validated.data;

  // Get or create Stripe customer
  const customerResult = await getOrCreateStripeCustomer();
  if (!customerResult.success || !customerResult.customerId) {
    return { success: false, error: customerResult.error };
  }

  const stripe = getStripe();

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerResult.customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14, // 14-day free trial
        metadata: {
          billing_cycle: billingCycle,
        },
      },
      success_url: successUrl || `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${APP_URL}/checkout/cancel`,
      billing_address_collection: "required",
      allow_promotion_codes: true,
    });

    return { success: true, sessionId: session.id, url: session.url || undefined };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return { success: false, error: "Failed to create checkout session" };
  }
}

/**
 * Create a Stripe Customer Portal session
 */
export async function createPortalSession(
  input?: CreatePortalSessionInput
): Promise<{ success: boolean; url?: string; error?: string }> {
  const validated = createPortalSessionSchema.safeParse(input || {});
  if (!validated.success) {
    return { success: false, error: validated.error.message };
  }

  const { returnUrl } = validated.data;

  // Get or create Stripe customer
  const customerResult = await getOrCreateStripeCustomer();
  if (!customerResult.success || !customerResult.customerId) {
    return { success: false, error: customerResult.error };
  }

  const stripe = getStripe();

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerResult.customerId,
      return_url: returnUrl || `${APP_URL}/dashboard/settings/billing`,
    });

    return { success: true, url: session.url };
  } catch (error) {
    console.error("Error creating portal session:", error);
    return { success: false, error: "Failed to create portal session" };
  }
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelImmediately: boolean = false
): Promise<{ success: boolean; error?: string }> {
  // Use untyped client for subscriptions table (not in generated types)
  const supabase = await createUntypedServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user has access to this subscription
  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select(
      `
      id,
      stripe_subscription_id,
      organization_id,
      organizations!inner(id)
    `
    )
    .eq("id", subscriptionId)
    .single();

  if (subError || !subscription) {
    return { success: false, error: "Subscription not found" };
  }

  const stripe = getStripe();

  try {
    if (cancelImmediately) {
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
    } else {
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }

    revalidatePath("/dashboard/settings/billing");
    return { success: true };
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return { success: false, error: "Failed to cancel subscription" };
  }
}

/**
 * Resume a subscription that was set to cancel
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  // Use untyped client for subscriptions table (not in generated types)
  const supabase = await createUntypedServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user has access to this subscription
  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("id, stripe_subscription_id")
    .eq("id", subscriptionId)
    .single();

  if (subError || !subscription) {
    return { success: false, error: "Subscription not found" };
  }

  const stripe = getStripe();

  try {
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    revalidatePath("/dashboard/settings/billing");
    return { success: true };
  } catch (error) {
    console.error("Error resuming subscription:", error);
    return { success: false, error: "Failed to resume subscription" };
  }
}

/**
 * Update subscription (change plan, quantity)
 */
export async function updateSubscription(
  input: UpdateSubscriptionInput
): Promise<{ success: boolean; error?: string }> {
  const validated = updateSubscriptionSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.message };
  }

  const { subscriptionId, priceId, quantity, cancelAtPeriodEnd } = validated.data;

  // Use untyped client for subscriptions table (not in generated types)
  const supabase = await createUntypedServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user has access to this subscription
  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("id, stripe_subscription_id")
    .eq("id", subscriptionId)
    .single();

  if (subError || !subscription) {
    return { success: false, error: "Subscription not found" };
  }

  const stripe = getStripe();

  try {
    const updateParams: Record<string, unknown> = {};

    if (priceId) {
      // Get current subscription to find the item ID
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
      );

      const itemId = stripeSubscription.items.data[0]?.id;
      if (itemId) {
        updateParams.items = [
          {
            id: itemId,
            price: priceId,
          },
        ];
        updateParams.proration_behavior = "create_prorations";
      }
    }

    if (quantity !== undefined) {
      // Similar logic for quantity update
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
      );

      const itemId = stripeSubscription.items.data[0]?.id;
      if (itemId) {
        updateParams.items = [
          {
            id: itemId,
            quantity,
          },
        ];
      }
    }

    if (cancelAtPeriodEnd !== undefined) {
      updateParams.cancel_at_period_end = cancelAtPeriodEnd;
    }

    await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      updateParams as Parameters<typeof stripe.subscriptions.update>[1]
    );

    revalidatePath("/dashboard/settings/billing");
    return { success: true };
  } catch (error) {
    console.error("Error updating subscription:", error);
    return { success: false, error: "Failed to update subscription" };
  }
}

/**
 * Get billing overview for the current organization
 */
export async function getBillingOverview(): Promise<{
  success: boolean;
  data?: BillingOverview;
  error?: string;
}> {
  // Use untyped client for subscriptions table (not in generated types)
  const supabase = await createUntypedServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get user's organization
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (userError || !userData?.organization_id) {
    return { success: false, error: "Organization not found" };
  }

  const orgId = userData.organization_id;

  // Get subscription
  const { data: subscriptionData } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Get recent invoices
  const { data: invoicesData } = await supabase
    .from("invoices")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(10);

  // Get payment methods
  const { data: paymentMethodsData } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("organization_id", orgId)
    .order("is_default", { ascending: false });

  // Get organization for tier info
  const { data: orgData } = await supabase
    .from("organizations")
    .select("subscription_tier")
    .eq("id", orgId)
    .single();

  // Get usage stats
  const { data: usageData } = await supabase.rpc("get_organization_stats", {
    p_organization_id: orgId,
  });

  // Map subscription data
  const subscription: SubscriptionData | null = subscriptionData
    ? {
        id: subscriptionData.id,
        stripeSubscriptionId: subscriptionData.stripe_subscription_id,
        status: subscriptionData.status as SubscriptionStatus,
        planTier: subscriptionData.plan_tier as SubscriptionTier,
        billingCycle: subscriptionData.billing_cycle as BillingCycle | null,
        currentPeriodStart: subscriptionData.current_period_start
          ? new Date(subscriptionData.current_period_start)
          : null,
        currentPeriodEnd: subscriptionData.current_period_end
          ? new Date(subscriptionData.current_period_end)
          : null,
        cancelAtPeriodEnd: subscriptionData.cancel_at_period_end ?? false,
        trialEnd: subscriptionData.trial_end
          ? new Date(subscriptionData.trial_end)
          : null,
        quantity: subscriptionData.quantity ?? 1,
      }
    : null;

  // Map invoices
  const invoices: InvoiceData[] = (invoicesData || []).map((inv) => ({
    id: inv.id,
    stripeInvoiceId: inv.stripe_invoice_id,
    number: inv.number,
    status: inv.status,
    amountDue: inv.amount_due,
    amountPaid: inv.amount_paid ?? 0,
    currency: inv.currency ?? "usd",
    dueDate: inv.due_date ? new Date(inv.due_date) : null,
    paidAt: inv.paid_at ? new Date(inv.paid_at) : null,
    pdfUrl: inv.pdf_url,
    hostedInvoiceUrl: inv.hosted_invoice_url,
    periodStart: inv.period_start ? new Date(inv.period_start) : null,
    periodEnd: inv.period_end ? new Date(inv.period_end) : null,
    createdAt: new Date(inv.created_at ?? Date.now()),
  }));

  // Map payment methods
  const paymentMethods: PaymentMethodData[] = (paymentMethodsData || []).map(
    (pm) => ({
      id: pm.id,
      stripePaymentMethodId: pm.stripe_payment_method_id,
      type: pm.type,
      cardBrand: pm.card_brand,
      cardLast4: pm.card_last4,
      cardExpMonth: pm.card_exp_month,
      cardExpYear: pm.card_exp_year,
      isDefault: pm.is_default ?? false,
    })
  );

  // Get current tier
  const tierName = (orgData?.subscription_tier || "free") as SubscriptionTier;
  const tier = getPricingTier(tierName);

  // Get usage
  const usage = {
    currentUsers: usageData?.total_users || 0,
    currentLoanOfficers: usageData?.total_loan_officers || 0,
    surveysThisMonth: usageData?.total_surveys || 0,
    apiCallsToday: 0, // Would need separate tracking
  };

  return {
    success: true,
    data: {
      subscription,
      invoices,
      paymentMethods,
      tier,
      usage,
    },
  };
}

/**
 * Get available pricing tiers
 */
export async function getPricingTiers(): Promise<{
  success: boolean;
  data?: typeof PRICING_TIERS;
  error?: string;
}> {
  return { success: true, data: PRICING_TIERS };
}

/**
 * Get pricing tiers with Stripe price IDs for checkout
 * Returns pricing info including the actual Stripe price IDs
 */
export async function getPricingForCheckout(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
    stripePriceIdMonthly: string | null;
    stripePriceIdYearly: string | null;
    popular?: boolean;
    cta: string;
  }>;
  error?: string;
}> {
  // Return pricing with price IDs from env
  const pricingData = PRICING_TIERS.map((tier) => ({
    id: tier.id,
    name: tier.name,
    monthlyPrice: tier.monthlyPrice,
    yearlyPrice: tier.yearlyPrice,
    stripePriceIdMonthly:
      tier.id === "starter"
        ? process.env.STRIPE_STARTER_PRICE_MONTHLY || null
        : tier.id === "professional"
        ? process.env.STRIPE_PROFESSIONAL_PRICE_MONTHLY || null
        : null,
    stripePriceIdYearly:
      tier.id === "starter"
        ? process.env.STRIPE_STARTER_PRICE_YEARLY || null
        : tier.id === "professional"
        ? process.env.STRIPE_PROFESSIONAL_PRICE_YEARLY || null
        : null,
    popular: tier.popular,
    cta: tier.cta,
  }));

  return { success: true, data: pricingData };
}

/**
 * Check subscription status for access control
 */
export async function checkSubscriptionAccess(): Promise<{
  hasAccess: boolean;
  status?: string;
  tier?: string;
  message?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { hasAccess: false, message: "Not authenticated" };
  }

  // Get user's organization
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (userError || !userData?.organization_id) {
    return { hasAccess: false, message: "Organization not found" };
  }

  // Get organization subscription status
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("subscription_status, subscription_tier, trial_ends_at")
    .eq("id", userData.organization_id)
    .single();

  if (orgError || !org) {
    return { hasAccess: false, message: "Organization not found" };
  }

  const status = org.subscription_status || "free";
  const tier = org.subscription_tier || "free";

  // Free tier always has access
  if (tier === "free") {
    return { hasAccess: true, status, tier };
  }

  // Active subscriptions have access
  if (status === "active" || status === "trialing") {
    return { hasAccess: true, status, tier };
  }

  // Past due has limited access (grace period)
  if (status === "past_due") {
    return {
      hasAccess: true,
      status,
      tier,
      message: "Payment overdue. Please update your payment method.",
    };
  }

  // Other statuses don't have access
  return {
    hasAccess: false,
    status,
    tier,
    message: "Subscription inactive. Please renew your subscription.",
  };
}
