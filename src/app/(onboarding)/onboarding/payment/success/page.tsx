import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PaymentSuccessClient } from "./payment-success-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Payment Successful | RepWell",
  description: "Your payment was successful",
};

interface PaymentSuccessPageProps {
  searchParams: Promise<{ session_id?: string }>;
}

function PaymentSuccessSkeleton() {
  return (
    <div className="max-w-lg mx-auto space-y-8 text-center">
      <Skeleton className="h-16 w-16 rounded-full mx-auto" />
      <Skeleton className="h-8 w-48 mx-auto" />
      <Skeleton className="h-4 w-64 mx-auto" />
      <Skeleton className="h-10 w-32 mx-auto" />
    </div>
  );
}

export default async function PaymentSuccessPage({ searchParams }: PaymentSuccessPageProps) {
  const resolvedParams = await searchParams;
  const sessionId = resolvedParams.session_id;

  if (!sessionId) {
    redirect("/onboarding/payment");
  }

  return (
    <Suspense fallback={<PaymentSuccessSkeleton />}>
      <PaymentSuccessClient sessionId={sessionId} />
    </Suspense>
  );
}
