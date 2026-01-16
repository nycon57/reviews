"use client";

import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get the Stripe instance for client-side operations
 * Uses singleton pattern to avoid loading Stripe multiple times
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.warn("Stripe publishable key not found");
      return Promise.resolve(null);
    }

    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
}

/**
 * Redirect to Stripe Checkout
 * Uses URL redirect since we get the checkout URL from server
 */
export function redirectToCheckout(checkoutUrl: string): void {
  if (typeof window !== "undefined") {
    window.location.href = checkoutUrl;
  }
}

/**
 * Redirect to Stripe Checkout by session ID (legacy method)
 * Kept for backwards compatibility
 */
export async function redirectToCheckoutBySession(sessionId: string): Promise<void> {
  const stripe = await getStripe();

  if (!stripe) {
    throw new Error("Stripe not initialized");
  }

  // Use type assertion since this method still exists but may not be in types
  const stripeWithLegacy = stripe as Stripe & {
    redirectToCheckout: (options: { sessionId: string }) => Promise<{ error?: { message: string } }>;
  };

  const { error } = await stripeWithLegacy.redirectToCheckout({ sessionId });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Check if Stripe is available
 */
export function isStripeAvailable(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}
