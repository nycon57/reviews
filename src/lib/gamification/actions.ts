"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/reviews/types";
import type {
  Badge,
  UserBadge,
  BadgeProgress,
  EnhancedLeaderboardEntry,
  LeaderboardFilters,
  ReputationBreakdown,
  ImprovementTip,
  ReputationHistoryEntry,
  GamificationStats,
  LeaderboardPeriod,
} from "./types";

// Helper to access gamification tables that may not be in generated types yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromTable(supabase: Awaited<ReturnType<typeof createClient>>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

// Database row types for gamification tables (until types are regenerated)
interface BadgeRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string | null;
  criteria: object;
  is_system: boolean;
  is_active: boolean;
  display_order: number;
}

interface UserBadgeRow {
  id: string;
  loan_officer_id: string;
  badge_id: string;
  earned_at: string | null;
  progress: object | null;
  badges?: BadgeRow;
}

interface LeaderboardSnapshotRow {
  loan_officer_id: string;
  rank: number;
}

interface ReputationHistoryRow {
  id: string;
  previous_score: number;
  new_score: number;
  change_amount: number;
  change_reason: string | null;
  breakdown: object | null;
  recorded_at: string;
}

// Get user context
async function getUserContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData) return null;

  // Get associated loan officer if exists
  const { data: loData } = await supabase
    .from("loan_officers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return {
    userId: userData.id,
    organizationId: userData.organization_id!,
    role: userData.role,
    loanOfficerId: loData?.id || null,
  };
}

/**
 * Get all available badges for the organization
 */
export async function getAvailableBadges(): Promise<ActionResult<Badge[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  const { data, error } = await fromTable(supabase, "badges")
    .select("*")
    .or(`is_system.eq.true,organization_id.eq.${context.organizationId}`)
    .eq("is_active", true)
    .order("display_order");

  if (error) {
    console.error("Error fetching badges:", error);
    return { success: false, error: "Failed to fetch badges" };
  }

  const badges: Badge[] = ((data || []) as BadgeRow[]).map((b) => ({
    id: b.id,
    slug: b.slug,
    name: b.name,
    description: b.description,
    icon: b.icon,
    category: b.category as Badge["category"],
    tier: b.tier as Badge["tier"],
    criteria: b.criteria as Badge["criteria"],
    isSystem: b.is_system ?? false,
    isActive: b.is_active ?? true,
    displayOrder: b.display_order ?? 0,
  }));

  return { success: true, data: badges };
}

/**
 * Get badges earned by a specific loan officer
 */
export async function getUserBadges(
  loanOfficerId?: string
): Promise<ActionResult<UserBadge[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const targetLoId = loanOfficerId || context.loanOfficerId;
  if (!targetLoId) {
    return { success: false, error: "No loan officer specified" };
  }

  const supabase = await createClient();

  const { data, error } = await fromTable(supabase, "user_badges")
    .select(
      `
      id,
      earned_at,
      progress,
      badges (
        id,
        slug,
        name,
        description,
        icon,
        category,
        tier,
        criteria,
        is_system,
        is_active,
        display_order
      )
    `
    )
    .eq("loan_officer_id", targetLoId)
    .not("earned_at", "is", null)
    .order("earned_at", { ascending: false });

  if (error) {
    console.error("Error fetching user badges:", error);
    return { success: false, error: "Failed to fetch user badges" };
  }

  const userBadges: UserBadge[] = ((data || []) as UserBadgeRow[])
    .filter((ub) => ub.badges)
    .map((ub) => {
      const b = ub.badges as BadgeRow;
      return {
        id: ub.id,
        badge: {
          id: b.id,
          slug: b.slug,
          name: b.name,
          description: b.description,
          icon: b.icon,
          category: b.category as Badge["category"],
          tier: b.tier as Badge["tier"],
          criteria: b.criteria as Badge["criteria"],
          isSystem: b.is_system,
          isActive: b.is_active,
          displayOrder: b.display_order,
        },
        earnedAt: ub.earned_at ? new Date(ub.earned_at) : null,
        progress: ub.progress as UserBadge["progress"],
      };
    });

  return { success: true, data: userBadges };
}

/**
 * Get badge progress for a loan officer
 */
export async function getBadgeProgress(
  loanOfficerId?: string
): Promise<ActionResult<BadgeProgress[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const targetLoId = loanOfficerId || context.loanOfficerId;
  if (!targetLoId) {
    return { success: false, error: "No loan officer specified" };
  }

  const supabase = await createClient();

  // Get loan officer stats
  const { data: loData } = await supabase
    .from("loan_officers")
    .select(
      "total_reviews, average_rating, nps_score, reputation_score, organization_id"
    )
    .eq("id", targetLoId)
    .single();

  if (!loData) {
    return { success: false, error: "Loan officer not found" };
  }

  // Get survey stats for response rate
  const { data: surveys } = await supabase
    .from("surveys")
    .select("status")
    .eq("loan_officer_id", targetLoId);

  const totalSent =
    surveys?.filter((s) =>
      s.status && ["sent", "opened", "completed", "expired"].includes(s.status)
    ).length || 0;
  const completed =
    surveys?.filter((s) => s.status === "completed").length || 0;
  const responseRate = totalSent > 0 ? Math.round((completed / totalSent) * 100) : 0;

  // Get current rank
  const { data: higherRanked } = await supabase
    .from("loan_officers")
    .select("id")
    .eq("organization_id", loData.organization_id)
    .eq("is_active", true)
    .gt("reputation_score", loData.reputation_score || 0);

  const currentRank = (higherRanked?.length || 0) + 1;

  // Get all badges
  const badgesResult = await getAvailableBadges();
  if (!badgesResult.success || !badgesResult.data) {
    return { success: false, error: "Failed to fetch badges" };
  }

  // Get earned badges
  const { data: earnedBadges } = await fromTable(supabase, "user_badges")
    .select("badge_id, earned_at")
    .eq("loan_officer_id", targetLoId)
    .not("earned_at", "is", null);

  const earnedMap = new Map(
    ((earnedBadges || []) as Array<{ badge_id: string; earned_at: string }>).map(
      (eb) => [eb.badge_id, new Date(eb.earned_at)]
    )
  );

  // Calculate progress for each badge
  const progress: BadgeProgress[] = badgesResult.data.map((badge) => {
    let currentValue = 0;
    let targetValue = 1;

    switch (badge.criteria.type) {
      case "review_count":
        currentValue = loData.total_reviews || 0;
        targetValue = badge.criteria.threshold || 1;
        break;
      case "rating_threshold":
        currentValue = loData.average_rating || 0;
        targetValue = badge.criteria.rating || 5;
        break;
      case "nps_threshold":
        currentValue = loData.nps_score || 0;
        targetValue = badge.criteria.threshold || 60;
        break;
      case "response_rate":
        currentValue = responseRate;
        targetValue = badge.criteria.threshold || 80;
        break;
      case "leaderboard_rank":
        currentValue = badge.criteria.rank
          ? Math.max(0, badge.criteria.rank - currentRank + 1)
          : 0;
        targetValue = badge.criteria.rank || 10;
        break;
      default:
        currentValue = 0;
        targetValue = 1;
    }

    const isEarned = earnedMap.has(badge.id);
    const percentComplete = isEarned
      ? 100
      : Math.min(100, Math.round((currentValue / targetValue) * 100));

    return {
      badge,
      currentValue,
      targetValue,
      percentComplete,
      isEarned,
      earnedAt: earnedMap.get(badge.id) || null,
    };
  });

  // Sort: earned first, then by percent complete descending
  progress.sort((a, b) => {
    if (a.isEarned && !b.isEarned) return -1;
    if (!a.isEarned && b.isEarned) return 1;
    return b.percentComplete - a.percentComplete;
  });

  return { success: true, data: progress };
}

/**
 * Get enhanced leaderboard with filters and history
 */
export async function getEnhancedLeaderboard(
  filters: LeaderboardFilters
): Promise<ActionResult<EnhancedLeaderboardEntry[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  // Check if user is manager or admin for full access
  if (context.role !== "manager" && context.role !== "admin") {
    return { success: false, error: "Manager access required" };
  }

  const supabase = await createClient();
  const limit = filters.limit || 10;

  // Build query with optional filters
  let query = supabase
    .from("loan_officers")
    .select(
      `
      id,
      full_name,
      photo_url,
      branch,
      region,
      total_reviews,
      average_rating,
      nps_score,
      reputation_score
    `
    )
    .eq("organization_id", context.organizationId)
    .eq("is_active", true)
    .order("reputation_score", { ascending: false })
    .limit(limit);

  if (filters.branch && filters.branch !== "all") {
    query = query.eq("branch", filters.branch);
  }

  if (filters.region && filters.region !== "all") {
    query = query.eq("region", filters.region);
  }

  const { data: loanOfficers, error } = await query;

  if (error) {
    console.error("Error fetching leaderboard:", error);
    return { success: false, error: "Failed to fetch leaderboard" };
  }

  // Get previous period rankings for comparison
  const previousPeriodKey = getPreviousPeriodKey(filters.period);
  const { data: previousRankings } = await fromTable(supabase, "leaderboard_snapshots")
    .select("loan_officer_id, rank")
    .eq("organization_id", context.organizationId)
    .eq("period_type", filters.period)
    .eq("period_key", previousPeriodKey);

  const previousRankMap = new Map(
    ((previousRankings || []) as LeaderboardSnapshotRow[]).map(
      (pr) => [pr.loan_officer_id, pr.rank]
    )
  );

  // Get badges for all loan officers
  const loIds = (loanOfficers || []).map((lo) => lo.id);
  const { data: allBadges } = await fromTable(supabase, "user_badges")
    .select(
      `
      loan_officer_id,
      earned_at,
      progress,
      badges (
        id,
        slug,
        name,
        description,
        icon,
        category,
        tier,
        criteria,
        is_system,
        is_active,
        display_order
      )
    `
    )
    .in("loan_officer_id", loIds)
    .not("earned_at", "is", null);

  // Group badges by loan officer
  const badgesByLo = new Map<string, UserBadge[]>();
  for (const ub of (allBadges || []) as UserBadgeRow[]) {
    if (!ub.badges) continue;
    const list = badgesByLo.get(ub.loan_officer_id) || [];
    const b = ub.badges;
    list.push({
      id: ub.loan_officer_id,
      badge: {
        id: b.id,
        slug: b.slug,
        name: b.name,
        description: b.description,
        icon: b.icon,
        category: b.category as Badge["category"],
        tier: b.tier as Badge["tier"],
        criteria: b.criteria as Badge["criteria"],
        isSystem: b.is_system,
        isActive: b.is_active,
        displayOrder: b.display_order,
      },
      earnedAt: ub.earned_at ? new Date(ub.earned_at) : null,
      progress: ub.progress as UserBadge["progress"],
    });
    badgesByLo.set(ub.loan_officer_id, list);
  }

  // Build enhanced leaderboard entries
  const entries: EnhancedLeaderboardEntry[] = (loanOfficers || []).map(
    (lo, index) => {
      const rank = index + 1;
      const previousRank = previousRankMap.get(lo.id) || null;
      const rankChange = previousRank ? previousRank - rank : 0;

      return {
        rank,
        previousRank,
        rankChange,
        id: lo.id,
        fullName: lo.full_name,
        photoUrl: lo.photo_url,
        branch: lo.branch,
        region: lo.region,
        totalReviews: lo.total_reviews || 0,
        averageRating: lo.average_rating || 0,
        npsScore: lo.nps_score || 0,
        reputationScore: lo.reputation_score || 0,
        badges: badgesByLo.get(lo.id) || [],
        streak: 0, // Would need historical data to calculate
      };
    }
  );

  return { success: true, data: entries };
}

/**
 * Get reputation score breakdown
 */
export async function getReputationBreakdown(
  loanOfficerId?: string
): Promise<ActionResult<ReputationBreakdown>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const targetLoId = loanOfficerId || context.loanOfficerId;
  if (!targetLoId) {
    return { success: false, error: "No loan officer specified" };
  }

  const supabase = await createClient();

  // Get loan officer stats
  const { data: loData, error: loError } = await supabase
    .from("loan_officers")
    .select("total_reviews, average_rating, nps_score, reputation_score")
    .eq("id", targetLoId)
    .single();

  if (loError || !loData) {
    return { success: false, error: "Loan officer not found" };
  }

  // Get survey stats for CSAT and response rate
  const { data: responses } = await supabase
    .from("survey_responses")
    .select(
      `
      overall_rating,
      surveys!inner (
        loan_officer_id,
        status
      )
    `
    )
    .not("overall_rating", "is", null);

  const loResponses = (responses || []).filter((r) => {
    const survey = r.surveys as unknown as {
      loan_officer_id: string;
      status: string;
    };
    return survey.loan_officer_id === targetLoId;
  });

  const satisfiedCount = loResponses.filter(
    (r) => (r.overall_rating || 0) >= 4
  ).length;
  const csatScore =
    loResponses.length > 0
      ? Math.round((satisfiedCount / loResponses.length) * 100)
      : 0;

  // Get survey stats for response rate
  const { data: surveys } = await supabase
    .from("surveys")
    .select("status")
    .eq("loan_officer_id", targetLoId);

  const totalSent =
    surveys?.filter((s) =>
      s.status && ["sent", "opened", "completed", "expired"].includes(s.status)
    ).length || 0;
  const completed =
    surveys?.filter((s) => s.status === "completed").length || 0;
  const responseRate = totalSent > 0 ? Math.round((completed / totalSent) * 100) : 0;

  // Calculate breakdown with weights
  const npsScore = loData.nps_score || 0;
  const npsNormalized = (npsScore + 100) / 2;
  const volumeNormalized = Math.min((loData.total_reviews || 0) * 2, 100);
  const ratingNormalized = ((loData.average_rating || 0) - 1) * 25;

  const breakdown: ReputationBreakdown = {
    totalScore: loData.reputation_score || 0,
    components: {
      nps: {
        score: npsScore,
        weight: 0.3,
        normalized: npsNormalized,
        contribution: Math.round(npsNormalized * 0.3),
      },
      csat: {
        score: csatScore,
        weight: 0.25,
        contribution: Math.round(csatScore * 0.25),
      },
      responseRate: {
        score: responseRate,
        weight: 0.15,
        contribution: Math.round(responseRate * 0.15),
      },
      reviewVolume: {
        count: loData.total_reviews || 0,
        weight: 0.15,
        normalized: volumeNormalized,
        contribution: Math.round(volumeNormalized * 0.15),
      },
      averageRating: {
        rating: loData.average_rating || 0,
        weight: 0.15,
        normalized: ratingNormalized,
        contribution: Math.round(ratingNormalized * 0.15),
      },
    },
  };

  return { success: true, data: breakdown };
}

/**
 * Get improvement tips based on weakest areas
 */
export async function getImprovementTips(
  loanOfficerId?: string
): Promise<ActionResult<ImprovementTip[]>> {
  const breakdownResult = await getReputationBreakdown(loanOfficerId);
  if (!breakdownResult.success || !breakdownResult.data) {
    return { success: false, error: breakdownResult.error || "Failed to get reputation breakdown" };
  }

  const breakdown = breakdownResult.data;
  const tips: ImprovementTip[] = [];

  // NPS improvement tip
  if (breakdown.components.nps.score < 50) {
    tips.push({
      area: "nps",
      title: "Boost Your NPS Score",
      description:
        "Focus on delivering exceptional experiences that turn customers into promoters. Follow up personally with satisfied customers to encourage high ratings.",
      impact: breakdown.components.nps.score < 0 ? "high" : "medium",
      currentValue: breakdown.components.nps.score,
      targetValue: 50,
      potentialGain: Math.round((50 - breakdown.components.nps.score) * 0.15),
    });
  }

  // CSAT improvement tip
  if (breakdown.components.csat.score < 85) {
    tips.push({
      area: "csat",
      title: "Improve Customer Satisfaction",
      description:
        "Address customer concerns promptly and exceed expectations in communication. Small touches like thank you notes can make a big difference.",
      impact: breakdown.components.csat.score < 70 ? "high" : "medium",
      currentValue: breakdown.components.csat.score,
      targetValue: 85,
      potentialGain: Math.round((85 - breakdown.components.csat.score) * 0.25),
    });
  }

  // Response rate tip
  if (breakdown.components.responseRate.score < 50) {
    tips.push({
      area: "response_rate",
      title: "Increase Survey Response Rate",
      description:
        "Send survey requests promptly after closing and personalize your ask. Consider a brief phone call to encourage participation.",
      impact: breakdown.components.responseRate.score < 30 ? "high" : "medium",
      currentValue: breakdown.components.responseRate.score,
      targetValue: 50,
      potentialGain: Math.round(
        (50 - breakdown.components.responseRate.score) * 0.15
      ),
    });
  }

  // Review volume tip
  if (breakdown.components.reviewVolume.count < 25) {
    tips.push({
      area: "review_volume",
      title: "Build Your Review Portfolio",
      description:
        "Consistently request reviews from every satisfied customer. More reviews build credibility and improve your reputation score.",
      impact: breakdown.components.reviewVolume.count < 10 ? "high" : "low",
      currentValue: breakdown.components.reviewVolume.count,
      targetValue: 50,
      potentialGain: Math.round(
        (100 - breakdown.components.reviewVolume.normalized) * 0.15
      ),
    });
  }

  // Rating tip
  if (breakdown.components.averageRating.rating < 4.5) {
    tips.push({
      area: "rating",
      title: "Raise Your Average Rating",
      description:
        "Go above and beyond for each client. Proactively address potential issues before they affect the customer experience.",
      impact: breakdown.components.averageRating.rating < 4.0 ? "high" : "low",
      currentValue: breakdown.components.averageRating.rating,
      targetValue: 4.5,
      potentialGain: Math.round(
        (4.5 - breakdown.components.averageRating.rating) * 25 * 0.15
      ),
    });
  }

  // Sort by potential impact
  tips.sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return impactOrder[a.impact] - impactOrder[b.impact];
  });

  return { success: true, data: tips };
}

/**
 * Get reputation history for trend analysis
 */
export async function getReputationHistory(
  loanOfficerId?: string,
  limit: number = 30
): Promise<ActionResult<ReputationHistoryEntry[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const targetLoId = loanOfficerId || context.loanOfficerId;
  if (!targetLoId) {
    return { success: false, error: "No loan officer specified" };
  }

  const supabase = await createClient();

  const { data, error } = await fromTable(supabase, "reputation_history")
    .select("*")
    .eq("loan_officer_id", targetLoId)
    .order("recorded_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching reputation history:", error);
    return { success: false, error: "Failed to fetch reputation history" };
  }

  const history: ReputationHistoryEntry[] = ((data || []) as ReputationHistoryRow[]).map((h) => ({
    id: h.id,
    previousScore: h.previous_score,
    newScore: h.new_score,
    changeAmount: h.change_amount,
    changeReason: h.change_reason,
    breakdown: h.breakdown as ReputationBreakdown["components"] | null,
    recordedAt: new Date(h.recorded_at),
  }));

  return { success: true, data: history };
}

/**
 * Get gamification stats summary
 */
export async function getGamificationStats(
  loanOfficerId?: string
): Promise<ActionResult<GamificationStats>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const targetLoId = loanOfficerId || context.loanOfficerId;
  if (!targetLoId) {
    return { success: false, error: "No loan officer specified" };
  }

  const supabase = await createClient();

  // Get loan officer data
  const { data: loData } = await supabase
    .from("loan_officers")
    .select("reputation_score, organization_id")
    .eq("id", targetLoId)
    .single();

  if (!loData) {
    return { success: false, error: "Loan officer not found" };
  }

  // Get total badges count
  const { count: totalBadges } = await fromTable(supabase, "badges")
    .select("*", { count: "exact", head: true })
    .or(`is_system.eq.true,organization_id.eq.${loData.organization_id}`)
    .eq("is_active", true);

  // Get earned badges count
  const { count: earnedBadges } = await fromTable(supabase, "user_badges")
    .select("*", { count: "exact", head: true })
    .eq("loan_officer_id", targetLoId)
    .not("earned_at", "is", null);

  // Get current rank
  const { data: higherRanked } = await supabase
    .from("loan_officers")
    .select("id")
    .eq("organization_id", loData.organization_id)
    .eq("is_active", true)
    .gt("reputation_score", loData.reputation_score || 0);

  const currentRank = (higherRanked?.length || 0) + 1;

  // Get previous rank from latest snapshot
  const previousPeriodKey = getPreviousPeriodKey("monthly");

  const { data: previousSnapshot } = await fromTable(supabase, "leaderboard_snapshots")
    .select("rank")
    .eq("loan_officer_id", targetLoId)
    .eq("period_type", "monthly")
    .eq("period_key", previousPeriodKey)
    .single();

  const previousRank = previousSnapshot?.rank || null;
  const rankChange = previousRank ? previousRank - currentRank : 0;

  // Get reputation trend
  const { data: recentHistory } = await fromTable(supabase, "reputation_history")
    .select("change_amount")
    .eq("loan_officer_id", targetLoId)
    .order("recorded_at", { ascending: false })
    .limit(5);

  let reputationTrend: "up" | "down" | "stable" = "stable";
  if (recentHistory && recentHistory.length > 0) {
    const totalChange = (recentHistory as Array<{ change_amount: number }>).reduce(
      (sum: number, h) => sum + h.change_amount,
      0
    );
    if (totalChange > 2) reputationTrend = "up";
    else if (totalChange < -2) reputationTrend = "down";
  }

  // Get next badge progress
  const progressResult = await getBadgeProgress(targetLoId);
  let nextBadgeProgress: BadgeProgress | null = null;
  if (progressResult.success && progressResult.data) {
    const unearned = progressResult.data.filter(
      (p) => !p.isEarned && p.percentComplete > 0
    );
    if (unearned.length > 0) {
      nextBadgeProgress = unearned[0];
    }
  }

  return {
    success: true,
    data: {
      totalBadges: totalBadges || 0,
      earnedBadges: earnedBadges || 0,
      currentRank,
      previousRank,
      rankChange,
      reputationScore: loData.reputation_score || 0,
      reputationTrend,
      nextBadgeProgress,
    },
  };
}

/**
 * Save leaderboard snapshot for a period
 */
export async function saveLeaderboardSnapshot(
  period: LeaderboardPeriod
): Promise<ActionResult<void>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  if (context.role !== "admin" && context.role !== "manager") {
    return { success: false, error: "Admin or manager access required" };
  }

  const supabase = await createClient();
  const periodKey = getCurrentPeriodKey(period);
  const snapshotDate = new Date().toISOString().split("T")[0];

  // Get all loan officers ranked
  const { data: loanOfficers, error: loError } = await supabase
    .from("loan_officers")
    .select("id, total_reviews, average_rating, nps_score, reputation_score")
    .eq("organization_id", context.organizationId)
    .eq("is_active", true)
    .order("reputation_score", { ascending: false });

  if (loError) {
    return { success: false, error: "Failed to fetch loan officers" };
  }

  // Prepare snapshot records
  const snapshots = (loanOfficers || []).map((lo, index) => ({
    organization_id: context.organizationId,
    loan_officer_id: lo.id,
    period_type: period,
    period_key: periodKey,
    rank: index + 1,
    reputation_score: lo.reputation_score || 0,
    total_reviews: lo.total_reviews || 0,
    average_rating: lo.average_rating || 0,
    nps_score: lo.nps_score,
    snapshot_date: snapshotDate,
  }));

  // Upsert snapshots
  const { error } = await fromTable(supabase, "leaderboard_snapshots").upsert(
    snapshots,
    {
      onConflict: "organization_id,loan_officer_id,period_type,period_key",
    }
  );

  if (error) {
    console.error("Error saving leaderboard snapshots:", error);
    return { success: false, error: "Failed to save leaderboard snapshots" };
  }

  return { success: true };
}

// Helper functions
function getCurrentPeriodKey(period: LeaderboardPeriod): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const quarter = Math.ceil(month / 3);

  switch (period) {
    case "monthly":
      return `${year}-${String(month).padStart(2, "0")}`;
    case "quarterly":
      return `${year}-Q${quarter}`;
    case "yearly":
      return `${year}`;
    case "all_time":
      return "all_time";
  }
}

function getPreviousPeriodKey(period: LeaderboardPeriod): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const quarter = Math.ceil(month / 3);

  switch (period) {
    case "monthly": {
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      return `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
    }
    case "quarterly": {
      const prevQuarter = quarter === 1 ? 4 : quarter - 1;
      const prevYear = quarter === 1 ? year - 1 : year;
      return `${prevYear}-Q${prevQuarter}`;
    }
    case "yearly":
      return `${year - 1}`;
    case "all_time":
      return "all_time";
  }
}

/**
 * Check and award badges for a loan officer
 * This calls the database function that evaluates badge criteria and awards badges
 */
export async function checkAndAwardBadges(
  loanOfficerId?: string
): Promise<ActionResult<{ awarded: string[] }>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const targetLoId = loanOfficerId || context.loanOfficerId;
  if (!targetLoId) {
    return { success: false, error: "No loan officer specified" };
  }

  const supabase = await createClient();

  // Call the database function to check and award badges
  const { data, error } = await supabase.rpc("check_badges_for_loan_officer", {
    p_loan_officer_id: targetLoId,
  });

  if (error) {
    console.error("Error checking badges:", error);
    return { success: false, error: "Failed to check badges" };
  }

  // Extract newly awarded badges
  const awarded = ((data || []) as Array<{ badge_name: string; newly_earned: boolean }>)
    .filter((b) => b.newly_earned)
    .map((b) => b.badge_name);

  return { success: true, data: { awarded } };
}
