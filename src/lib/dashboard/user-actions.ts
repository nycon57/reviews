"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import type { ActionResult } from "@/lib/reviews/types";

// Types for user dashboard
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  title: string | null;
  bio: string | null;
  branch: string | null;
  region: string | null;
  nmlsId: string | null;
  linkedinUrl: string | null;
  zillowProfileUrl: string | null;
  googlePlaceId: string | null;
}

export interface DashboardMetrics {
  totalReviews: number;
  averageRating: number;
  npsScore: number;
  responseRate: number;
  // Change metrics (vs last period)
  totalReviewsChange: number;
  averageRatingChange: number;
  npsScoreChange: number;
  responseRateChange: number;
}

export interface RecentReview {
  id: string;
  customerName: string | null;
  rating: number;
  text: string | null;
  reviewDate: string;
  status: string;
  isPublished: boolean;
  source: string;
}

export interface TrendDataPoint {
  date: string;
  value: number;
}

export interface ProfileCompletionItem {
  field: string;
  label: string;
  completed: boolean;
}

// Get user context - returns user id, role, and organization_id
async function getUserContext() {
  const user = await unifiedGetUser();

  if (!user) {
    return null;
  }

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData || !userData.organization_id) {
    return null;
  }

  // The user IS the professional now (unified users table)
  return {
    userId: userData.id,
    organizationId: userData.organization_id,
    role: userData.role,
    professionalId: userData.id, // User ID is now the professional ID
  };
}

// Get user dashboard metrics
export async function getUserMetrics(
  userId?: string
): Promise<ActionResult<DashboardMetrics>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const targetUserId = userId || context.professionalId;

  // For regular users, they can only view their own metrics
  if (context.role === "user" && targetUserId !== context.professionalId) {
    return { success: false, error: "Unauthorized - Can only view own metrics" };
  }

  // If no user ID available, return empty metrics
  if (!targetUserId) {
    return {
      success: true,
      data: {
        totalReviews: 0,
        averageRating: 0,
        npsScore: 0,
        responseRate: 0,
        totalReviewsChange: 0,
        averageRatingChange: 0,
        npsScoreChange: 0,
        responseRateChange: 0,
      },
    };
  }

  // Get user data with cached metrics
  const { data: userRecord, error: userError } = await supabase
    .from("users")
    .select("total_reviews, average_rating, nps_score")
    .eq("id", targetUserId)
    .eq("organization_id", context.organizationId)
    .single();

  if (userError) {
    console.error("Error fetching user:", userError);
    return { success: false, error: "Failed to fetch user data" };
  }

  // Calculate response rate from surveys
  const { data: surveys } = await supabase
    .from("surveys")
    .select("id, status")
    .eq("user_id", targetUserId);

  const totalSurveys = surveys?.length || 0;
  const completedSurveys = surveys?.filter((s) => s.status === "completed").length || 0;
  const responseRate = totalSurveys > 0 ? Math.round((completedSurveys / totalSurveys) * 100) : 0;

  // Calculate change metrics (compare to 30 days ago)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Get reviews from last 30 days
  const { data: recentReviews } = await supabase
    .from("reviews")
    .select("rating, review_date")
    .eq("user_id", targetUserId)
    .gte("review_date", thirtyDaysAgo.toISOString());

  // Get reviews from 30-60 days ago for comparison
  const { data: previousReviews } = await supabase
    .from("reviews")
    .select("rating, review_date")
    .eq("user_id", targetUserId)
    .gte("review_date", sixtyDaysAgo.toISOString())
    .lt("review_date", thirtyDaysAgo.toISOString());

  const recentCount = recentReviews?.length || 0;
  const previousCount = previousReviews?.length || 0;
  const totalReviewsChange = previousCount > 0
    ? Math.round(((recentCount - previousCount) / previousCount) * 100)
    : recentCount > 0 ? 100 : 0;

  // Calculate NPS from recent survey responses
  const { data: surveyResponses } = await supabase
    .from("survey_responses")
    .select(`
      nps_score,
      surveys!inner (
        user_id
      )
    `)
    .not("nps_score", "is", null);

  const filteredResponses = surveyResponses?.filter(
    (r) => {
      const survey = r.surveys as unknown as { user_id: string };
      return survey.user_id === targetUserId;
    }
  ) || [];

  let npsScore = userRecord?.nps_score || 0;
  if (filteredResponses.length > 0) {
    const promoters = filteredResponses.filter((r) => (r.nps_score || 0) >= 9).length;
    const detractors = filteredResponses.filter((r) => (r.nps_score || 0) <= 6).length;
    npsScore = Math.round(((promoters - detractors) / filteredResponses.length) * 100);
  }

  return {
    success: true,
    data: {
      totalReviews: userRecord?.total_reviews || 0,
      averageRating: userRecord?.average_rating || 0,
      npsScore,
      responseRate,
      totalReviewsChange,
      averageRatingChange: 0, // Would need historical data to calculate
      npsScoreChange: 0,
      responseRateChange: 0,
    },
  };
}

// Get recent reviews for user
export async function getUserRecentReviews(
  userId?: string,
  limit: number = 5
): Promise<ActionResult<RecentReview[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const targetUserId = userId || context.professionalId;

  // For regular users, they can only view their own reviews
  if (context.role === "user" && targetUserId !== context.professionalId) {
    return { success: false, error: "Unauthorized - Can only view own reviews" };
  }

  // If no user ID, return empty list
  if (!targetUserId) {
    return { success: true, data: [] };
  }

  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id,
      customer_name,
      rating,
      text,
      review_date,
      status,
      is_published,
      source
    `)
    .eq("user_id", targetUserId)
    .eq("organization_id", context.organizationId)
    .order("review_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching reviews:", error);
    return { success: false, error: "Failed to fetch reviews" };
  }

  const reviews: RecentReview[] = (data || []).map((r) => ({
    id: r.id,
    customerName: r.customer_name,
    rating: r.rating,
    text: r.text,
    reviewDate: r.review_date,
    status: r.status || "pending",
    isPublished: r.is_published || false,
    source: r.source,
  }));

  return { success: true, data: reviews };
}

// Get rating trend data (monthly average)
export async function getRatingTrend(
  userId?: string,
  months: number = 6
): Promise<ActionResult<TrendDataPoint[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const targetUserId = userId || context.professionalId;

  // For regular users, they can only view their own data
  if (context.role === "user" && targetUserId !== context.professionalId) {
    return { success: false, error: "Unauthorized" };
  }

  // If no user ID, return empty data
  if (!targetUserId) {
    return { success: true, data: [] };
  }

  // Calculate start date
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const { data, error } = await supabase
    .from("reviews")
    .select("rating, review_date")
    .eq("user_id", targetUserId)
    .gte("review_date", startDate.toISOString())
    .order("review_date", { ascending: true });

  if (error) {
    console.error("Error fetching rating trend:", error);
    return { success: false, error: "Failed to fetch rating trend" };
  }

  // Group by month and calculate averages
  const monthlyData = new Map<string, { sum: number; count: number }>();

  for (const review of data || []) {
    const date = new Date(review.review_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { sum: 0, count: 0 });
    }

    const entry = monthlyData.get(monthKey)!;
    entry.sum += review.rating;
    entry.count += 1;
  }

  // Convert to array and fill in missing months
  const trendData: TrendDataPoint[] = [];
  const currentDate = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    const entry = monthlyData.get(monthKey);
    trendData.push({
      date: monthLabel,
      value: entry ? Number((entry.sum / entry.count).toFixed(1)) : 0,
    });
  }

  return { success: true, data: trendData };
}

// Get NPS trend data (monthly)
export async function getNPSTrend(
  userId?: string,
  months: number = 6
): Promise<ActionResult<TrendDataPoint[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const targetUserId = userId || context.professionalId;

  // For regular users, they can only view their own data
  if (context.role === "user" && targetUserId !== context.professionalId) {
    return { success: false, error: "Unauthorized" };
  }

  // If no user ID, return empty data
  if (!targetUserId) {
    return { success: true, data: [] };
  }

  // Calculate start date
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const { data, error } = await supabase
    .from("survey_responses")
    .select(`
      nps_score,
      submitted_at,
      surveys!inner (
        user_id
      )
    `)
    .not("nps_score", "is", null)
    .gte("submitted_at", startDate.toISOString());

  if (error) {
    console.error("Error fetching NPS trend:", error);
    return { success: false, error: "Failed to fetch NPS trend" };
  }

  // Filter to only this user's responses
  const filteredData = (data || []).filter((r) => {
    const survey = r.surveys as unknown as { user_id: string };
    return survey.user_id === targetUserId;
  });

  // Group by month and calculate NPS
  const monthlyData = new Map<string, { promoters: number; passives: number; detractors: number }>();

  for (const response of filteredData) {
    const date = new Date(response.submitted_at!);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { promoters: 0, passives: 0, detractors: 0 });
    }

    const entry = monthlyData.get(monthKey)!;
    const score = response.nps_score || 0;

    if (score >= 9) {
      entry.promoters += 1;
    } else if (score >= 7) {
      entry.passives += 1;
    } else {
      entry.detractors += 1;
    }
  }

  // Convert to array with NPS calculation
  const trendData: TrendDataPoint[] = [];
  const currentDate = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    const entry = monthlyData.get(monthKey);
    let nps = 0;

    if (entry) {
      const total = entry.promoters + entry.passives + entry.detractors;
      if (total > 0) {
        nps = Math.round(((entry.promoters - entry.detractors) / total) * 100);
      }
    }

    trendData.push({
      date: monthLabel,
      value: nps,
    });
  }

  return { success: true, data: trendData };
}

// Get user profile
export async function getUserProfile(
  userId?: string
): Promise<ActionResult<UserProfile | null>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const targetUserId = userId || context.professionalId;

  // For regular users, they can only view their own profile
  if (context.role === "user" && targetUserId !== context.professionalId) {
    return { success: false, error: "Unauthorized - Can only view own profile" };
  }

  // If no user ID, return null
  if (!targetUserId) {
    return { success: true, data: null };
  }

  const { data, error } = await supabase
    .from("users")
    .select(`
      id,
      full_name,
      email,
      phone,
      photo_url,
      title,
      bio,
      branch,
      region,
      nmls_id,
      linkedin_url,
      zillow_profile_url,
      google_place_id
    `)
    .eq("id", targetUserId)
    .eq("organization_id", context.organizationId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return { success: false, error: "Failed to fetch profile" };
  }

  if (!data) {
    return { success: true, data: null };
  }

  return {
    success: true,
    data: {
      id: data.id,
      fullName: data.full_name || '',
      email: data.email,
      phone: data.phone,
      photoUrl: data.photo_url,
      title: data.title,
      bio: data.bio,
      branch: data.branch,
      region: data.region,
      nmlsId: data.nmls_id,
      linkedinUrl: data.linkedin_url,
      zillowProfileUrl: data.zillow_profile_url,
      googlePlaceId: data.google_place_id,
    },
  };
}

// Get review volume trend data (monthly count)
export async function getReviewVolumeTrend(
  userId?: string,
  months: number = 6
): Promise<ActionResult<Array<{ date: string; value: number }>>> {
  try {
    const supabase = createAdminClient();
    const user = await unifiedGetUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userData?.organization_id) return { success: false, error: "No organization" };

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    let query = supabase
      .from("reviews")
      .select("created_at")
      .eq("organization_id", userData.organization_id)
      .gte("created_at", startDate.toISOString());

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };

    // Group by month
    const monthCounts: Record<string, number> = {};
    (data || []).forEach((row) => {
      if (!row.created_at) return;
      const month = row.created_at.slice(0, 7); // "YYYY-MM"
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });

    // Fill in all months including zeros
    const points: Array<{ date: string; value: number }> = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      points.push({ date: label, value: monthCounts[key] || 0 });
    }

    return { success: true, data: points };
  } catch {
    return { success: false, error: "Failed to fetch review volume" };
  }
}

// Calculate profile completion
export async function getProfileCompletion(
  userId?: string
): Promise<ActionResult<{ percentage: number; items: ProfileCompletionItem[] }>> {
  const profileResult = await getUserProfile(userId);

  if (!profileResult.success || !profileResult.data) {
    return {
      success: true,
      data: {
        percentage: 0,
        items: [],
      },
    };
  }

  const profile = profileResult.data;

  const completionItems: ProfileCompletionItem[] = [
    { field: "photoUrl", label: "Profile Photo", completed: !!profile.photoUrl },
    { field: "phone", label: "Phone Number", completed: !!profile.phone },
    { field: "title", label: "Job Title", completed: !!profile.title },
    { field: "bio", label: "Bio/Description", completed: !!profile.bio },
    { field: "branch", label: "Branch", completed: !!profile.branch },
    { field: "nmlsId", label: "NMLS ID", completed: !!profile.nmlsId },
    { field: "linkedinUrl", label: "LinkedIn URL", completed: !!profile.linkedinUrl },
    { field: "googlePlaceId", label: "Google Business Profile", completed: !!profile.googlePlaceId },
  ];

  const completedCount = completionItems.filter((item) => item.completed).length;
  const percentage = Math.round((completedCount / completionItems.length) * 100);

  return {
    success: true,
    data: {
      percentage,
      items: completionItems,
    },
  };
}
