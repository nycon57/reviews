import { Suspense } from "react";
import type { Metadata } from "next";
import { CheckoutSuccessClient } from "./checkout-success-client";

export const metadata: Metadata = {
  title: "Payment Successful | ReviewHub",
  description: "Your payment was successful. Welcome to ReviewHub!",
};

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<CheckoutSuccessLoading />}>
      <CheckoutSuccessClient />
    </Suspense>
  );
}

function CheckoutSuccessLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="mt-4 text-muted-foreground">Verifying payment...</p>
      </div>
    </div>
  );
}
