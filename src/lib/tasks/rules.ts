"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskCandidate } from "./types";

type AdminClient = SupabaseClient;

// ============================================================================
// All-tier rules
// ============================================================================

/** Reviews with no response >24h — one task per review (max 5) */
export async function checkUnrespondedReviews(
  supabase: AdminClient,
  userId: string,
  orgId: string
): Promise<TaskCandidate[]> {
  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, customer_name, review_date, rating")
    .eq("organization_id", orgId)
    .is("response_text", null)
    .lt("review_date", oneDayAgo.toISOString())
    .order("review_date", { ascending: true })
    .limit(5);

  if (!reviews?.length) return [];

  return reviews.map((review) => {
    const name = review.customer_name || "a customer";
    const daysAgo = Math.floor(
      (Date.now() - new Date(review.review_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      taskType: "respond_review" as const,
      source: "rule" as const,
      dedupKey: `respond_review:${review.id}`,
      priority: "high" as const,
      title: `Respond to review from ${name}`,
      description: `This ${review.rating}-star review has been waiting ${daysAgo} day${daysAgo !== 1 ? "s" : ""} for a response.`,
      actionUrl: `/dashboard/reviews/${review.id}`,
      metadata: { reviewId: review.id, rating: review.rating },
    };
  });
}

/** If unresponded >5, summary task */
export async function checkPendingResponseCount(
  supabase: AdminClient,
  _userId: string,
  orgId: string
): Promise<TaskCandidate[]> {
  const { count } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .is("response_text", null);

  if (!count || count <= 5) return [];

  return [
    {
      taskType: "pending_responses",
      source: "rule",
      dedupKey: "pending_responses",
      priority: "high",
      title: `You have ${count} reviews awaiting response`,
      description:
        "Responding to reviews shows customers you value their feedback and improves your reputation.",
      actionUrl: "/dashboard/reviews?filter=needs_response",
      metadata: { count },
    },
  ];
}

/** Missing avatar/bio/etc */
export async function checkIncompleteProfile(
  supabase: AdminClient,
  userId: string
): Promise<TaskCandidate[]> {
  const { data: user } = await supabase
    .from("users")
    .select("full_name, bio, photo_url, job_title")
    .eq("id", userId)
    .single();

  if (!user) return [];

  const missing: string[] = [];
  if (!user.photo_url) missing.push("profile photo");
  if (!user.bio) missing.push("bio");
  if (!user.job_title) missing.push("job title");

  if (missing.length === 0) return [];

  return [
    {
      taskType: "incomplete_profile",
      source: "rule",
      dedupKey: "incomplete_profile",
      priority: "medium",
      title: "Complete your profile",
      description: `Add your ${missing.join(", ")} to build trust with customers.`,
      actionUrl: "/dashboard/settings?tab=account",
    },
  ];
}

/** No surveys sent in 7 days */
export async function checkNoRecentRequests(
  supabase: AdminClient,
  userId: string,
  orgId: string
): Promise<TaskCandidate[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { count } = await supabase
    .from("surveys")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .gte("sent_at", sevenDaysAgo.toISOString());

  // Only trigger if zero requests in last 7 days
  if (count !== 0) return [];

  return [
    {
      taskType: "no_recent_requests",
      source: "rule",
      dedupKey: "no_recent_requests",
      priority: "medium",
      title: "Send review requests to keep momentum",
      description:
        "You haven't sent any review requests in the past 7 days. Consistent outreach drives steady review growth.",
      actionUrl: "/dashboard/surveys/send",
    },
  ];
}

// ============================================================================
// Pro-tier rules (extracted from getSmartActionItems patterns)
// ============================================================================

/** Week-over-week survey send rate drop >40% */
export async function checkSurveyVelocityDecline(
  supabase: AdminClient,
  _userId: string,
  orgId: string
): Promise<TaskCandidate[]> {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const [thisWeek, lastWeek] = await Promise.all([
    supabase
      .from("surveys")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .gte("sent_at", sevenDaysAgo.toISOString()),
    supabase
      .from("surveys")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .gte("sent_at", twoWeeksAgo.toISOString())
      .lt("sent_at", sevenDaysAgo.toISOString()),
  ]);

  const thisCount = thisWeek.count || 0;
  const lastCount = lastWeek.count || 0;

  if (lastCount === 0 || thisCount >= lastCount * 0.6) return [];

  const pctBelow = Math.round((1 - thisCount / lastCount) * 100);
  return [
    {
      taskType: "survey_velocity_decline",
      source: "ai",
      dedupKey: "survey_velocity_decline",
      priority: "medium",
      title: `Review requests down ${pctBelow}% from last week`,
      description: `You sent ${thisCount} this week vs ${lastCount} last week. Consistent outreach drives steady growth.`,
      actionUrl: "/dashboard/surveys/send",
      metadata: { thisCount, lastCount, pctBelow },
    },
  ];
}

/** 3+ negative reviews same theme in 7 days */
export async function checkNegativeThemeSpike(
  supabase: AdminClient,
  _userId: string,
  orgId: string
): Promise<TaskCandidate[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: negativeReviews } = await supabase
    .from("reviews")
    .select("id, themes")
    .eq("organization_id", orgId)
    .eq("sentiment_label", "negative")
    .gte("review_date", sevenDaysAgo.toISOString());

  if (!negativeReviews || negativeReviews.length < 3) return [];

  const themeCounts = new Map<string, number>();
  for (const review of negativeReviews) {
    for (const theme of (review.themes as string[]) || []) {
      themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1);
    }
  }
  const topTheme = Array.from(themeCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  if (!topTheme || topTheme[1] < 3) return [];

  return [
    {
      taskType: "negative_theme_spike",
      source: "ai",
      dedupKey: `negative_theme_spike:${topTheme[0]}`,
      priority: "medium",
      title: `"${topTheme[0]}" ratings are trending down`,
      description: `${negativeReviews.length} negative reviews in the past 7 days mention "${topTheme[0]}".`,
      actionUrl: "/dashboard/insights#recommendations",
      metadata: { theme: topTheme[0], count: topTheme[1] },
    },
  ];
}

/** 30-day avg improves >0.2 vs 60-day */
export async function checkRatingImprovement(
  supabase: AdminClient,
  _userId: string,
  orgId: string
): Promise<TaskCandidate[]> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const { data: ratingData } = await supabase
    .from("reviews")
    .select("rating, review_date")
    .eq("organization_id", orgId)
    .gte("review_date", sixtyDaysAgo.toISOString())
    .not("rating", "is", null);

  if (!ratingData || ratingData.length < 5) return [];

  const recent = ratingData.filter((r) => new Date(r.review_date) >= thirtyDaysAgo);
  const older = ratingData.filter(
    (r) =>
      new Date(r.review_date) < thirtyDaysAgo &&
      new Date(r.review_date) >= sixtyDaysAgo
  );

  const recentAvg =
    recent.length > 0
      ? recent.reduce((sum, r) => sum + r.rating!, 0) / recent.length
      : 0;
  const olderAvg =
    older.length > 0
      ? older.reduce((sum, r) => sum + r.rating!, 0) / older.length
      : 0;

  if (olderAvg === 0 || recentAvg <= olderAvg + 0.2) return [];

  const improvement = Math.round((recentAvg - olderAvg) * 10) / 10;
  return [
    {
      taskType: "rating_improvement",
      source: "ai",
      dedupKey: "rating_improvement",
      priority: "low",
      title: `Your average rating improved by ${improvement} stars`,
      description: `Your 30-day average (${Math.round(recentAvg * 10) / 10}) is up from last month (${Math.round(olderAvg * 10) / 10}). Keep it up!`,
      actionUrl: "/dashboard/reviews",
      metadata: { recentAvg, olderAvg, improvement },
    },
  ];
}
