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
 * This is the preferred method per Stripe best practices
 */
export function redirectToCheckout(checkoutUrl: string): void {
  if (typeof window !== "undefined") {
    window.location.href = checkoutUrl;
  }
}

/**
 * Check if Stripe is available
 */
export function isStripeAvailable(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}
