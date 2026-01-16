import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getOnboardingStatus } from "@/lib/onboarding/actions";
import { CompletionClient } from "./completion-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Welcome to RepWell!",
  description: "Your account setup is complete",
};

function CompletionSkeleton() {
  return (
    <div className="max-w-lg mx-auto text-center space-y-8">
      <Skeleton className="h-24 w-24 rounded-full mx-auto" />
      <Skeleton className="h-10 w-64 mx-auto" />
      <Skeleton className="h-6 w-80 mx-auto" />
      <Skeleton className="h-12 w-40 mx-auto" />
    </div>
  );
}

export default async function CompletionPage() {
  const status = await getOnboardingStatus();

  // If not authenticated or no org, redirect
  if (!status.success) {
    redirect("/login");
  }

  // If not at profile_complete or completed status, redirect back
  if (status.status !== "profile_complete" && status.status !== "completed") {
    redirect("/onboarding");
  }

  return (
    <Suspense fallback={<CompletionSkeleton />}>
      <CompletionClient isAlreadyCompleted={status.status === "completed"} />
    </Suspense>
  );
}
