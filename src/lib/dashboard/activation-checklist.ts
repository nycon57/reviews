import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@/lib/users/types";

export interface ActivationChecklistStep {
  id: "profile" | "review-request" | "review-source";
  label: string;
  href: string;
  done: boolean;
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

async function hasSentReviewRequest(user: User): Promise<boolean> {
  if (!user.organizationId) {
    return false;
  }

  const supabase = createAdminClient();
  const [surveyResult, videoResult] = await Promise.all([
    supabase
      .from("surveys")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", user.organizationId)
      .limit(1),
    supabase
      .from("video_testimonial_requests")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", user.organizationId)
      .limit(1),
  ]);

  return (surveyResult.count ?? 0) > 0 || (videoResult.count ?? 0) > 0;
}

export async function getActivationChecklistState(
  user: User,
  profilePercent: number
): Promise<ActivationChecklistStep[]> {
  const [requestSent, reviewSourceConnected] = await Promise.all([
    hasSentReviewRequest(user),
    hasConnectedReviewSource(user),
  ]);

  return [
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
      done: requestSent,
    },
    {
      id: "review-source",
      label: "Connect review sources",
      href: "/dashboard/organization?tab=integrations",
      done: reviewSourceConnected,
    },
  ];
}
