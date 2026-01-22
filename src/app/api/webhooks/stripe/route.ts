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
import type Stripe from "stripe";
import type { DunningPaymentMethodInfo } from "@/lib/email/types";

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
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscription(subscription);
      await syncSubscriptionItems(subscription);
      break;
    }

    // Subscription deleted (canceled)
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscription(subscription);
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
      const invoice = event.data.object as Stripe.Invoice;
      await syncInvoice(invoice);

      // Handle dunning recovery - if payment succeeded after a dunning sequence started
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;

      if (customerId) {
        const adminClient = createAdminClient();
        const { data: org } = await adminClient
          .from("organizations")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (org?.id) {
          const recoveryResult = await handleInvoicePaidWebhook(
            invoice.id,
            org.id
          );
          if (recoveryResult.success) {
            console.log(
              `Dunning recovery handled for invoice ${invoice.id}, org ${org.id}`
            );
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
      const invoice = event.data.object as Stripe.Invoice;
      await syncInvoice(invoice);
      break;
    }

    // Upcoming invoice (reminder)
    case "invoice.upcoming": {
      // Could send reminder email
      // const invoice = event.data.object as Stripe.Invoice;
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
