"use server";

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getStripe as getStripeServer } from "@/lib/stripe/server";
import { SMS_CREDIT_TIERS, CREDIT_PACKS } from "./constants";
import type { SubscriptionTier } from "@/lib/organization/types";

/**
 * Allocate SMS credits for a new subscription.
 * Called from Stripe webhook on customer.subscription.created
 */
export async function allocateCreditsForSubscription(
  organizationId: string,
  tier: SubscriptionTier,
  periodStart: Date,
  periodEnd: Date
): Promise<void> {
  const supabase = createUntypedAdminClient();
  const tierConfig = SMS_CREDIT_TIERS[tier];

  if (tierConfig.includedCredits === 0) return; // free/starter get no SMS credits

  const { error } = await supabase.from("sms_credits").upsert(
    {
      organization_id: organizationId,
      period_start: periodStart.toISOString().slice(0, 10),
      period_end: periodEnd.toISOString().slice(0, 10),
      included_credits: tierConfig.includedCredits,
      used_credits: 0,
      overage_credits: 0,
      overage_rate_cents: tierConfig.overageRateCents,
    },
    { onConflict: "organization_id,period_start" }
  );

  if (error) {
    throw new Error(`[SMS Credits] Failed to allocate credits for org ${organizationId}: ${error.message}`);
  }
}

/**
 * Adjust credits when plan changes mid-period (pro-rata).
 * Called from Stripe webhook on customer.subscription.updated
 */
export async function adjustCreditsForPlanChange(
  organizationId: string,
  newTier: SubscriptionTier,
  periodStart: Date,
  periodEnd: Date
): Promise<void> {
  const supabase = createUntypedAdminClient();
  const newTierConfig = SMS_CREDIT_TIERS[newTier];
  const today = new Date().toISOString().slice(0, 10);

  // Find current period credits
  const { data: currentCredits } = await supabase
    .from("sms_credits")
    .select("*")
    .eq("organization_id", organizationId)
    .lte("period_start", today)
    .gte("period_end", today)
    .single();

  if (!currentCredits) {
    // No existing period — just allocate fresh
    await allocateCreditsForSubscription(
      organizationId,
      newTier,
      periodStart,
      periodEnd
    );
    return;
  }

  // Pro-rata: calculate remaining proportion of the period
  const periodTotalDays = Math.ceil(
    (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const periodRemainingDays = Math.ceil(
    (periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const proportion =
    periodTotalDays > 0 ? periodRemainingDays / periodTotalDays : 1;

  // New included = pro-rated new tier credits (at least what's already been used)
  const proratedCredits = Math.max(
    Math.ceil(newTierConfig.includedCredits * proportion),
    currentCredits.used_credits
  );

  const { error } = await supabase
    .from("sms_credits")
    .update({
      included_credits: proratedCredits,
      overage_credits: 0,
      overage_rate_cents: newTierConfig.overageRateCents,
      period_end: periodEnd.toISOString().slice(0, 10),
    })
    .eq("id", currentCredits.id);

  if (error) {
    console.error(`[SMS Credits] Failed to adjust credits for org ${organizationId}:`, error.message);
  }
}

/**
 * Reset credits for a new billing period (renewal).
 * Called from Stripe webhook on invoice.paid for subscription_cycle
 */
export async function resetCreditsForRenewal(
  organizationId: string,
  tier: SubscriptionTier,
  newPeriodStart: Date,
  newPeriodEnd: Date
): Promise<void> {
  await allocateCreditsForSubscription(
    organizationId,
    tier,
    newPeriodStart,
    newPeriodEnd
  );
}

/**
 * Zero out remaining credits on subscription cancellation.
 * Called from Stripe webhook on customer.subscription.deleted
 */
export async function disableCreditsOnCancellation(
  organizationId: string
): Promise<void> {
  const supabase = createUntypedAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  await supabase
    .from("sms_credits")
    .update({
      included_credits: 0,
      overage_credits: 0,
    })
    .eq("organization_id", organizationId)
    .lte("period_start", today)
    .gte("period_end", today);
}

/**
 * Bill overage charges at period end.
 * Creates a Stripe invoice item for the overage amount.
 */
export async function billOverageCharges(
  organizationId: string,
  periodStart: string,
  periodEnd: string
): Promise<{ billed: boolean; amountCents?: number }> {
  const supabase = createUntypedAdminClient();

  // Run both lookups in parallel
  const [creditsResult, orgResult] = await Promise.all([
    supabase
      .from("sms_credits")
      .select("overage_credits, overage_rate_cents")
      .eq("organization_id", organizationId)
      .eq("period_start", periodStart)
      .eq("period_end", periodEnd)
      .single(),
    supabase
      .from("organizations")
      .select("stripe_customer_id")
      .eq("id", organizationId)
      .single(),
  ]);

  const credits = creditsResult.data;
  if (!credits || credits.overage_credits <= 0) {
    return { billed: false };
  }

  const overageAmountCents =
    credits.overage_credits * credits.overage_rate_cents;
  if (overageAmountCents <= 0) {
    return { billed: false };
  }

  const org = orgResult.data;
  if (!org?.stripe_customer_id) {
    console.error(`[SMS Billing] No Stripe customer for org ${organizationId}`);
    return { billed: false };
  }

  try {
    const stripe = getStripeServer();
    await stripe.invoiceItems.create({
      customer: org.stripe_customer_id,
      amount: overageAmountCents,
      currency: "usd",
      description: `SMS overage: ${credits.overage_credits} segments × $${(credits.overage_rate_cents / 100).toFixed(2)}/segment (${periodStart} – ${periodEnd})`,
    });
    return { billed: true, amountCents: overageAmountCents };
  } catch (error) {
    console.error("[SMS Billing] Failed to create overage invoice item:", error);
    return { billed: false };
  }
}

/**
 * Purchase a credit pack via Stripe PaymentIntent (charge card on file).
 */
export async function purchaseCreditPackWithStripe(
  organizationId: string,
  packId: string
): Promise<{ success: boolean; error?: string; newBalance?: number; requiresAction?: boolean; paymentIntentId?: string; clientSecret?: string }> {
  const pack = CREDIT_PACKS.find((p) => p.id === packId);
  if (!pack) {
    return { success: false, error: "Invalid credit pack" };
  }

  const supabase = createUntypedAdminClient();

  // Get Stripe customer
  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_customer_id")
    .eq("id", organizationId)
    .single();

  if (!org?.stripe_customer_id) {
    return { success: false, error: "No payment method on file" };
  }

  try {
    const stripe = getStripeServer();

    // Get default payment method
    const customer = await stripe.customers.retrieve(org.stripe_customer_id);
    if (customer.deleted) {
      return { success: false, error: "Customer account not found" };
    }

    const defaultPm = customer.invoice_settings?.default_payment_method;
    if (!defaultPm) {
      return {
        success: false,
        error: "No default payment method. Please add a card first.",
      };
    }

    // Charge immediately
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pack.priceCents,
      currency: "usd",
      customer: org.stripe_customer_id,
      payment_method: typeof defaultPm === "string" ? defaultPm : defaultPm.id,
      off_session: true,
      confirm: true,
      setup_future_usage: "off_session",
      description: `SMS Credit Pack: ${pack.label}`,
      metadata: {
        organization_id: organizationId,
        pack_id: packId,
        credits: String(pack.credits),
      },
    });

    // Handle SCA / 3D Secure authentication required
    if (paymentIntent.status === "requires_action" || paymentIntent.status === "requires_confirmation") {
      return {
        success: false,
        error: "Payment requires authentication",
        requiresAction: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret ?? undefined,
      } as { success: false; error: string; requiresAction?: boolean; paymentIntentId?: string; clientSecret?: string };
    }

    if (paymentIntent.status !== "succeeded") {
      return { success: false, error: "Payment was not successful" };
    }

    // Add credits to current period
    const { CreditService } = await import("./credit-service");
    const creditService = new CreditService(organizationId);
    const result = await creditService.purchaseCreditPack(packId);

    return { success: true, newBalance: result.newIncluded };
  } catch (error) {
    console.error("[SMS Billing] Credit pack purchase failed:", error);
    const message = error instanceof Error ? error.message : "Payment failed";
    return { success: false, error: message };
  }
}
