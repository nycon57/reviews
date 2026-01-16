import { redirect } from "next/navigation";
import { getOnboardingRedirect } from "@/lib/onboarding/actions";

export default async function OnboardingPage() {
  const result = await getOnboardingRedirect();

  if (result.success && result.redirectTo) {
    redirect(result.redirectTo);
  }

  // Fallback to plan selection
  redirect("/onboarding/plan");
}
