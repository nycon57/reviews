import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getOnboardingStatus } from "@/lib/onboarding/actions";
import { SmsSetupClient } from "./sms-setup-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "SMS Setup | RepWell",
  description: "Configure SMS for your organization",
};

function SmsSetupSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <Skeleton className="h-10 w-64 mx-auto" />
        <Skeleton className="h-6 w-80 mx-auto" />
      </div>
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function SmsSetupPage() {
  const status = await getOnboardingStatus();

  if (!status.success) {
    redirect("/login");
  }

  const plan = status.selectedPlan;
  const smsTiers = ["professional", "pro", "enterprise"];
  if (!plan || !smsTiers.includes(plan)) {
    redirect("/onboarding/complete");
  }

  if (status.status !== "profile_complete") {
    if (status.status === "sms_setup_complete" || status.status === "completed") {
      redirect("/onboarding/complete");
    }
    redirect("/onboarding");
  }

  return (
    <Suspense fallback={<SmsSetupSkeleton />}>
      <SmsSetupClient plan={plan} />
    </Suspense>
  );
}
