import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent, getStripe as getStripeServer } from "@/lib/stripe/server";
import {
  syncSubscription,
  syncSubscriptionItems,
  syncInvoice,
  syncPaymentMethod,
  removePaymentMethod,
  logBillingEvent,
  syncCustomer,
} from "@/lib/stripe/sync";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  startDunningSequence,
  handleInvoicePaidWebhook,
} from "@/lib/email/dunning-service";
import {
  sendSubscriptionUpgradeEmail,
  sendSubscriptionDowngradeEmail,
  sendSubscriptionCancelledEmail,
  sendSubscriptionRenewedEmail,
  sendSubscriptionRenewalReminderEmail,
  sendSubscriptionInvoiceAvailableEmail,
  sendSubscriptionPlanChangeScheduledEmail,
  mapStripePaymentMethod,
  mapStripeInvoice,
} from "@/lib/email/subscription-service";
import type Stripe from "stripe";
import type { DunningPaymentMethodInfo } from "@/lib/email/types";

// Extended Stripe types for webhook event objects
type StripeSubscriptionExtended = Stripe.Subscription & {
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  schedule?: string | null;
  latest_invoice?: string | Stripe.Invoice;
  default_payment_method?: string | Stripe.PaymentMethod | null;
};

type StripeInvoiceExtended = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null;
  billing_reason?: string | null;
  period_start?: number;
  period_end?: number;
  hosted_invoice_url?: string | null;
};

/**
 * Stripe Webhook Handler
 * Processes Stripe events and syncs data to Supabase
 */
export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(payload, signature);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  // Get organization ID for logging (if possible)
  let organizationId: string | undefined;
  try {
    const adminClient = createAdminClient();
    const eventObj = event.data.object as { customer?: string };
    if (eventObj.customer) {
      const customerId =
        typeof eventObj.customer === "string"
          ? eventObj.customer
          : eventObj.customer;
      const { data: org } = await adminClient
        .from("organizations")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();
      organizationId = org?.id;
    }
  } catch {
    // Continue without organization ID
  }

  try {
    // Process the event
    await handleStripeEvent(event);

    // Log successful event
    await logBillingEvent(event, organizationId);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);

    // Log failed event
    await logBillingEvent(
      event,
      organizationId,
      error instanceof Error ? error.message : "Unknown error"
    );

    // Return 200 to prevent Stripe from retrying (we've logged the error)
    // In production, you might want to return 500 for certain critical errors
    return NextResponse.json({ received: true, error: "Processing failed" });
  }
}

/**
 * Handle different Stripe event types
 */
async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  const stripe = getStripeServer();

  switch (event.type) {
    // Checkout completed - new subscription created
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === "subscription" && session.subscription) {
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;

        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId,
          { expand: ["items.data.price.product"] }
        );

        await syncSubscription(subscription);
        await syncSubscriptionItems(subscription);
      }
      break;
    }

    // Subscription created
    case "customer.subscription.created": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscription(subscription);
      await syncSubscriptionItems(subscription);
      break;
    }

    // Subscription updated (plan change, renewal, status change)
    case "customer.subscription.updated": {
      const subscription = event.data.object as StripeSubscriptionExtended;
      const previousAttributes = event.data.previous_attributes as Partial<Stripe.Subscription> | undefined;

      await syncSubscription(subscription);
      await syncSubscriptionItems(subscription);

      // Handle subscription lifecycle emails for plan changes
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id;

      if (customerId) {
        const adminClient = createAdminClient();
        const { data: org } = await adminClient
          .from("organizations")
          .select("id, subscription_tier")
          .eq("stripe_customer_id", customerId)
          .single();

        if (org?.id) {
          // Detect plan changes
          const previousPlanId = previousAttributes?.items?.data?.[0]?.price?.id;
          const currentPlanId = subscription.items.data[0]?.price?.id;
          const previousPlan = previousAttributes?.items?.data?.[0]?.price?.product;
          const currentPlan = subscription.items.data[0]?.price?.product;

          // Check if plan changed (different price or product)
          const planChanged = previousPlanId && currentPlanId && previousPlanId !== currentPlanId;

          if (planChanged) {
            // Fetch full price details for comparison
            const [prevPrice, currPrice] = await Promise.all([
              previousPlanId ? stripe.prices.retrieve(previousPlanId, { expand: ["product"] }) : null,
              stripe.prices.retrieve(currentPlanId, { expand: ["product"] }),
            ]);

            const prevAmount = prevPrice?.unit_amount || 0;
            const currAmount = currPrice.unit_amount || 0;
            const isUpgrade = currAmount > prevAmount;

            // Get payment method info
            const paymentMethodId = subscription.default_payment_method;
            let paymentMethod = undefined;
            if (paymentMethodId && typeof paymentMethodId === "string") {
              try {
                const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
                paymentMethod = mapStripePaymentMethod(pm);
              } catch (e) {
                console.error("Failed to fetch payment method:", e);
              }
            }

            // Map plan IDs to tier names
            const prevProduct = typeof previousPlan === "string" ? previousPlan : previousPlan?.id || "";
            const currProduct = typeof currentPlan === "string" ? currentPlan : (currentPlan as Stripe.Product)?.id || "";

            // Determine tier from product metadata or name
            const getPlanTier = (product: Stripe.Product | null): string => {
              if (!product) return "professional";
              const tier = product.metadata?.tier || product.name?.toLowerCase() || "professional";
              return tier;
            };

            const prevFullProduct = prevPrice?.product as Stripe.Product | null;
            const currFullProduct = currPrice.product as Stripe.Product | null;
            const prevTier = getPlanTier(prevFullProduct);
            const currTier = getPlanTier(currFullProduct);

            // Check if change is scheduled for end of period
            const isScheduledChange = subscription.cancel_at_period_end ||
              (subscription.schedule !== null);

            if (isScheduledChange && !isUpgrade) {
              // Scheduled downgrade - send scheduled change email
              await sendSubscriptionPlanChangeScheduledEmail({
                organizationId: org.id,
                currentPlan: prevTier,
                scheduledPlan: currTier,
                currentPrice: prevAmount,
                scheduledPrice: currAmount,
                currency: subscription.currency,
                billingCycle: currPrice.recurring?.interval === "year" ? "yearly" : "monthly",
                scheduledDate: subscription.current_period_end
                  ? new Date(subscription.current_period_end * 1000).toISOString()
                  : new Date().toISOString(),
                changeType: "downgrade",
              });
            } else if (isUpgrade) {
              // Immediate upgrade
              const latestInvoice = subscription.latest_invoice;
              let invoiceDetails = undefined;
              let proratedAmount = undefined;

              if (latestInvoice) {
                const invoiceId = typeof latestInvoice === "string" ? latestInvoice : latestInvoice.id;
                try {
                  const invoice = await stripe.invoices.retrieve(invoiceId);
                  invoiceDetails = mapStripeInvoice(invoice);
                  // Prorated amount is usually the total minus full price
                  if (invoice.total && invoice.total !== currAmount) {
                    proratedAmount = invoice.total;
                  }
                } catch (e) {
                  console.error("Failed to fetch invoice:", e);
                }
              }

              await sendSubscriptionUpgradeEmail({
                organizationId: org.id,
                previousPlan: prevTier,
                newPlan: currTier,
                previousPrice: prevAmount,
                newPrice: currAmount,
                currency: subscription.currency,
                billingCycle: currPrice.recurring?.interval === "year" ? "yearly" : "monthly",
                effectiveDate: new Date().toISOString(),
                nextBillingDate: subscription.current_period_end
                  ? new Date(subscription.current_period_end * 1000).toISOString()
                  : new Date().toISOString(),
                nextBillingAmount: currAmount,
                proratedAmount,
                invoiceDetails: invoiceDetails || undefined,
                paymentMethod,
              });
            } else {
              // Immediate downgrade
              await sendSubscriptionDowngradeEmail({
                organizationId: org.id,
                previousPlan: prevTier,
                newPlan: currTier,
                previousPrice: prevAmount,
                newPrice: currAmount,
                currency: subscription.currency,
                billingCycle: currPrice.recurring?.interval === "year" ? "yearly" : "monthly",
                effectiveDate: new Date().toISOString(),
                isEndOfPeriod: false,
                nextBillingDate: subscription.current_period_end
                  ? new Date(subscription.current_period_end * 1000).toISOString()
                  : new Date().toISOString(),
                nextBillingAmount: currAmount,
              });
            }
          }
        }
      }
      break;
    }

    // Subscription deleted (canceled)
    case "customer.subscription.deleted": {
      const subscription = event.data.object as StripeSubscriptionExtended;
      await syncSubscription(subscription);

      // Send cancellation confirmation email
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id;

      if (customerId) {
        const adminClient = createAdminClient();
        const { data: org } = await adminClient
          .from("organizations")
          .select("id, subscription_tier")
          .eq("stripe_customer_id", customerId)
          .single();

        if (org?.id) {
          // Calculate effective end date (end of current period or immediate)
          const effectiveEndDate = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : new Date().toISOString();

          await sendSubscriptionCancelledEmail({
            organizationId: org.id,
            planName: org.subscription_tier || "professional",
            effectiveEndDate,
          });
        }
      }
      break;
    }

    // Customer updated (email, payment method changes)
    case "customer.updated": {
      const customer = event.data.object as Stripe.Customer;
      await syncCustomer(customer);
      break;
    }

    // Invoice paid
    case "invoice.paid": {
      const invoice = event.data.object as StripeInvoiceExtended;
      await syncInvoice(invoice);

      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;

      if (customerId) {
        const adminClient = createAdminClient();
        const { data: org } = await adminClient
          .from("organizations")
          .select("id, subscription_tier")
          .eq("stripe_customer_id", customerId)
          .single();

        if (org?.id) {
          // Handle dunning recovery - if payment succeeded after a dunning sequence started
          const recoveryResult = await handleInvoicePaidWebhook(
            invoice.id,
            org.id
          );
          if (recoveryResult.success) {
            console.log(
              `Dunning recovery handled for invoice ${invoice.id}, org ${org.id}`
            );
          }

          // Send renewal confirmation email for subscription renewals
          const isSubscriptionRenewal = invoice.billing_reason && [
            "subscription_cycle",
            "subscription_update",
          ].includes(invoice.billing_reason);

          if (isSubscriptionRenewal && invoice.subscription) {
            try {
              // Get subscription details for next billing info
              const subscriptionId =
                typeof invoice.subscription === "string"
                  ? invoice.subscription
                  : invoice.subscription.id;

              const subscription = await stripe.subscriptions.retrieve(subscriptionId) as StripeSubscriptionExtended;
              const invoiceDetails = mapStripeInvoice(invoice);

              if (invoiceDetails) {
                // Get payment method
                let paymentMethod = undefined;
                const paymentMethodId = subscription.default_payment_method;
                if (paymentMethodId && typeof paymentMethodId === "string") {
                  try {
                    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
                    paymentMethod = mapStripePaymentMethod(pm);
                  } catch (e) {
                    console.error("Failed to fetch payment method:", e);
                  }
                }

                // Calculate next billing
                const nextBillingAmount = subscription.items.data[0]?.price?.unit_amount || 0;
                const nextBillingDate = subscription.current_period_end
                  ? new Date(subscription.current_period_end * 1000).toISOString()
                  : new Date().toISOString();

                // Get billing cycle from subscription price
                const subPrice = subscription.items.data[0]?.price;
                const billingCycle = subPrice?.recurring?.interval === "year" ? "yearly" as const : "monthly" as const;

                await sendSubscriptionRenewedEmail({
                  organizationId: org.id,
                  planName: org.subscription_tier || "professional",
                  renewedDate: new Date().toISOString(),
                  amountPaid: invoice.amount_paid || invoice.total || 0,
                  currency: invoice.currency,
                  billingCycle,
                  invoiceDetails,
                  nextBillingDate,
                  nextBillingAmount,
                  paymentMethod,
                });
              }
            } catch (e) {
              console.error("Failed to send renewal email:", e);
            }
          }
        }
      }
      break;
    }

    // Invoice payment failed
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await syncInvoice(invoice);

      // Start dunning sequence for failed subscription payments
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;

      // Only trigger dunning for subscription-related invoices
      const isSubscriptionInvoice = invoice.billing_reason && [
        "subscription",
        "subscription_create",
        "subscription_cycle",
        "subscription_threshold",
        "subscription_update",
      ].includes(invoice.billing_reason);

      if (customerId && isSubscriptionInvoice) {
        const adminClient = createAdminClient();
        const { data: org } = await adminClient
          .from("organizations")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (org?.id) {
          // Extract decline code and payment method info
          let paymentMethodInfo: DunningPaymentMethodInfo | null = null;
          let declineCode: string | null = null;

          // Get decline code from last_finalization_error if available
          if (invoice.last_finalization_error) {
            declineCode = invoice.last_finalization_error.decline_code || null;

            // Try to get charge details if available
            if (invoice.last_finalization_error.charge) {
              try {
                const charge = await stripe.charges.retrieve(
                  invoice.last_finalization_error.charge
                );

                // Get payment method details from the charge
                if (charge.payment_method_details?.card) {
                  const card = charge.payment_method_details.card;
                  paymentMethodInfo = {
                    cardBrand: card.brand || null,
                    cardLast4: card.last4 || null,
                    cardExpMonth: card.exp_month || null,
                    cardExpYear: card.exp_year || null,
                  };
                }
              } catch (chargeError) {
                console.error("Failed to retrieve charge details:", chargeError);
              }
            }
          }

          // Start the dunning sequence
          const dunningResult = await startDunningSequence({
            organizationId: org.id,
            stripeInvoiceId: invoice.id,
            invoiceAmount: invoice.amount_due,
            invoiceCurrency: invoice.currency,
            invoiceNumber: invoice.number,
            declineCode,
            paymentMethod: paymentMethodInfo,
          });

          if (dunningResult.success) {
            console.log(
              `Dunning sequence started for invoice ${invoice.id}, org ${org.id}, sequence ${dunningResult.sequenceId}`
            );
          } else {
            console.error(
              `Failed to start dunning sequence for invoice ${invoice.id}:`,
              dunningResult.error
            );
          }
        }
      }
      break;
    }

    // Invoice finalized (ready to be paid)
    case "invoice.finalized": {
      const invoice = event.data.object as StripeInvoiceExtended;
      await syncInvoice(invoice);

      // Send invoice available notification
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;

      if (customerId && invoice.subscription) {
        const adminClient = createAdminClient();
        const { data: org } = await adminClient
          .from("organizations")
          .select("id, subscription_tier")
          .eq("stripe_customer_id", customerId)
          .single();

        if (org?.id) {
          const invoiceDetails = mapStripeInvoice(invoice);

          if (invoiceDetails) {
            try {
              // Get subscription for billing period
              const subscriptionId =
                typeof invoice.subscription === "string"
                  ? invoice.subscription
                  : invoice.subscription.id;

              const subscription = await stripe.subscriptions.retrieve(subscriptionId) as StripeSubscriptionExtended;

              // Get payment method
              let paymentMethod = undefined;
              const paymentMethodId = subscription.default_payment_method;
              if (paymentMethodId && typeof paymentMethodId === "string") {
                try {
                  const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
                  paymentMethod = mapStripePaymentMethod(pm);
                } catch (e) {
                  console.error("Failed to fetch payment method:", e);
                }
              }

              // Billing period from invoice or subscription
              const billingPeriod = {
                start: invoice.period_start
                  ? new Date(invoice.period_start * 1000).toISOString()
                  : new Date().toISOString(),
                end: invoice.period_end
                  ? new Date(invoice.period_end * 1000).toISOString()
                  : new Date().toISOString(),
              };

              // Generate pay now URL if invoice is open
              const payNowUrl = invoice.status === "open" && invoice.hosted_invoice_url
                ? invoice.hosted_invoice_url
                : undefined;

              await sendSubscriptionInvoiceAvailableEmail({
                organizationId: org.id,
                planName: org.subscription_tier || "professional",
                invoiceDetails,
                billingPeriod,
                paymentMethod,
                payNowUrl,
              });
            } catch (e) {
              console.error("Failed to send invoice available email:", e);
            }
          }
        }
      }
      break;
    }

    // Upcoming invoice (reminder) - sent ~14 days before renewal
    case "invoice.upcoming": {
      const invoice = event.data.object as StripeInvoiceExtended;

      // Send renewal reminder for annual subscriptions
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;

      if (customerId && invoice.subscription) {
        const adminClient = createAdminClient();
        const { data: org } = await adminClient
          .from("organizations")
          .select("id, subscription_tier")
          .eq("stripe_customer_id", customerId)
          .single();

        if (org?.id) {
          try {
            const subscriptionId =
              typeof invoice.subscription === "string"
                ? invoice.subscription
                : invoice.subscription.id;

            const subscription = await stripe.subscriptions.retrieve(subscriptionId) as StripeSubscriptionExtended;
            const price = subscription.items.data[0]?.price;

            // Only send reminder for yearly subscriptions
            if (price?.recurring?.interval === "year") {
              // Get payment method
              let paymentMethod = undefined;
              const paymentMethodId = subscription.default_payment_method;
              if (paymentMethodId && typeof paymentMethodId === "string") {
                try {
                  const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
                  paymentMethod = mapStripePaymentMethod(pm);
                } catch (e) {
                  console.error("Failed to fetch payment method:", e);
                }
              }

              // Get usage summary from database
              const [reviewsResult, surveysResult, usersResult] = await Promise.all([
                adminClient
                  .from("reviews")
                  .select("id", { count: "exact", head: true })
                  .eq("organization_id", org.id),
                adminClient
                  .from("surveys")
                  .select("id", { count: "exact", head: true })
                  .eq("organization_id", org.id),
                adminClient
                  .from("users")
                  .select("id", { count: "exact", head: true })
                  .eq("organization_id", org.id),
              ]);

              const usageSummary = {
                reviewsCollected: reviewsResult.count || 0,
                surveysSent: surveysResult.count || 0,
                teamMembers: usersResult.count || 0,
              };

              await sendSubscriptionRenewalReminderEmail({
                organizationId: org.id,
                planName: org.subscription_tier || "professional",
                renewalDate: subscription.current_period_end
                  ? new Date(subscription.current_period_end * 1000).toISOString()
                  : new Date().toISOString(),
                renewalAmount: price?.unit_amount || 0,
                currency: subscription.currency,
                billingCycle: "yearly",
                paymentMethod,
                usageSummary,
              });
            }
          } catch (e) {
            console.error("Failed to send renewal reminder:", e);
          }
        }
      }
      break;
    }

    // Payment intent succeeded
    case "payment_intent.succeeded": {
      // Usually handled by invoice events for subscriptions
      // Could be used for one-time payments
      break;
    }

    // Payment intent failed
    case "payment_intent.payment_failed": {
      // Usually handled by invoice events for subscriptions
      break;
    }

    // Payment method attached
    case "payment_method.attached": {
      const paymentMethod = event.data.object as Stripe.PaymentMethod;
      const customerId = paymentMethod.customer as string;

      if (customerId) {
        // Check if this is the only payment method (make it default)
        const paymentMethods = await stripe.paymentMethods.list({
          customer: customerId,
          type: "card",
        });

        const isDefault = paymentMethods.data.length === 1;
        await syncPaymentMethod(paymentMethod, customerId, isDefault);
      }
      break;
    }

    // Payment method detached
    case "payment_method.detached": {
      const paymentMethod = event.data.object as Stripe.PaymentMethod;
      await removePaymentMethod(paymentMethod.id);
      break;
    }

    default:
      // Log unhandled event types for monitoring
      console.log(`Unhandled event type: ${event.type}`);
  }
}

// Note: In Next.js App Router, request.text() automatically provides raw body
// No config needed - bodyParser config was for Pages Router
