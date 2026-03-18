import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getOnboardingStatus } from "@/lib/onboarding/actions";
import { PaymentClient } from "./payment-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Payment | RepWell",
  description: "Set up your payment method",
};

function PaymentSkeleton() {
  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div className="text-center space-y-4">
        <Skeleton className="h-10 w-48 mx-auto" />
        <Skeleton className="h-6 w-80 mx-auto" />
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}

export default async function PaymentPage() {
  const status = await getOnboardingStatus();

  // If not authenticated or no org, redirect
  if (!status.success) {
    redirect("/login");
  }

  // If free plan, skip to profile
  if (status.selectedPlan === "free") {
    redirect("/onboarding/profile");
  }

  // If not yet at plan_selected status, go back to plan
  if (status.status === "pending") {
    redirect("/onboarding/plan");
  }

  // If already past payment, go to next step
  if (status.status === "payment_complete" || status.status === "profile_complete" || status.status === "completed") {
    redirect("/onboarding/profile");
  }

  return (
    <Suspense fallback={<PaymentSkeleton />}>
      <PaymentClient
        selectedPlan={status.selectedPlan || "basic"}
        billingCycle={status.selectedBillingCycle || "month"}
      />
    </Suspense>
  );
}
