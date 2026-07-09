import { getProfileCompletionSummary } from "@/lib/gamification/profile-completion-actions";
import { getUnifiedRequestStats } from "@/lib/requests/unified-requests";
import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@/lib/users/types";

export interface ActivationChecklistStep {
  id: "profile" | "review-request" | "review-source";
  label: string;
  href: string;
  done: boolean;
}

export interface ActivationChecklistState {
  completionPercent: number;
  isComplete: boolean;
  steps: ActivationChecklistStep[];
}

async function hasConnectedReviewSource(user: User): Promise<boolean> {
  if (user.googlePlaceId || user.googleBusinessId || user.zillowProfileUrl) {
    return true;
  }

  if (!user.organizationId) {
    return false;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("google_connections")
    .select("id")
    .eq("organization_id", user.organizationId)
    .eq("is_active", true)
    .limit(1);

  if (error) {
    return false;
  }

  return (data?.length ?? 0) > 0;
}

export async function getActivationChecklistState(
  user: User
): Promise<ActivationChecklistState> {
  const [profileResult, requestStats, reviewSourceConnected] = await Promise.all([
    getProfileCompletionSummary(user.id),
    getUnifiedRequestStats(),
    hasConnectedReviewSource(user),
  ]);

  const profilePercent =
    profileResult.success && profileResult.data ? profileResult.data.percentage : 0;

  const steps: ActivationChecklistStep[] = [
    {
      id: "profile",
      label: "Complete your profile",
      href: "/dashboard/settings",
      done: profilePercent >= 100,
    },
    {
      id: "review-request",
      label: "Send your first review request",
      href: "/dashboard/reviews?tab=requests",
      done: requestStats.total > 0,
    },
    {
      id: "review-source",
      label: "Connect review sources",
      href: "/dashboard/organization?tab=integrations",
      done: reviewSourceConnected,
    },
  ];

  const completedSteps = steps.filter((step) => step.done).length;

  return {
    completionPercent: Math.round((completedSteps / steps.length) * 100),
    isComplete: completedSteps === steps.length,
    steps,
  };
}
