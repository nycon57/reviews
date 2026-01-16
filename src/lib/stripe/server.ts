import Stripe from "stripe";

// Singleton Stripe instance for server-side operations
let stripeInstance: Stripe | null = null;

/**
 * Get the server-side Stripe instance
 * Uses singleton pattern for efficiency
 */
export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error(
        "STRIPE_SECRET_KEY is not defined in environment variables"
      );
    }

    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
      appInfo: {
        name: "ReviewHub",
        version: "1.0.0",
      },
    });
  }

  return stripeInstance;
}

/**
 * Construct Stripe event from webhook payload
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not defined");
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );
}

// Export Stripe types for convenience
export type { Stripe };
