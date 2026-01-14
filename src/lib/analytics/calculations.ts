"use server";

/**
 * Analytics Engine - Core Calculation Functions
 * Pure functions for calculating NPS, CSAT, response rates, and review velocity
 */

import type {
  NPSBreakdown,
  CSATMetrics,
  ResponseRateMetrics,
  ReviewVelocityMetrics,
  DateRange,
  TrendPoint,
  PeriodComparison,
} from "./types";

/**
 * Calculate NPS (Net Promoter Score)
 * NPS = (% Promoters - % Detractors) * 100
 * Promoters: 9-10, Passives: 7-8, Detractors: 0-6
 */
export function calculateNPS(scores: number[]): NPSBreakdown {
  if (scores.length === 0) {
    return {
      score: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      totalResponses: 0,
      promoterPercentage: 0,
      passivePercentage: 0,
      detractorPercentage: 0,
    };
  }

  const promoters = scores.filter((s) => s >= 9).length;
  const passives = scores.filter((s) => s >= 7 && s <= 8).length;
  const detractors = scores.filter((s) => s <= 6).length;
  const total = scores.length;

  const promoterPercentage = (promoters / total) * 100;
  const passivePercentage = (passives / total) * 100;
  const detractorPercentage = (detractors / total) * 100;

  // NPS formula: % promoters - % detractors
  const npsScore = Math.round(promoterPercentage - detractorPercentage);

  return {
    score: npsScore,
    promoters,
    passives,
    detractors,
    totalResponses: total,
    promoterPercentage: Math.round(promoterPercentage * 10) / 10,
    passivePercentage: Math.round(passivePercentage * 10) / 10,
    detractorPercentage: Math.round(detractorPercentage * 10) / 10,
  };
}

/**
 * Calculate CSAT (Customer Satisfaction Score)
 * CSAT = (Number of satisfied responses / Total responses) * 100
 * Satisfied: ratings 4-5, Neutral: rating 3, Dissatisfied: ratings 1-2
 */
export function calculateCSAT(ratings: number[]): CSATMetrics {
  if (ratings.length === 0) {
    return {
      score: 0,
      averageRating: 0,
      totalResponses: 0,
      satisfiedCount: 0,
      neutralCount: 0,
      dissatisfiedCount: 0,
      satisfiedPercentage: 0,
      neutralPercentage: 0,
      dissatisfiedPercentage: 0,
    };
  }

  const satisfiedCount = ratings.filter((r) => r >= 4).length;
  const neutralCount = ratings.filter((r) => r === 3).length;
  const dissatisfiedCount = ratings.filter((r) => r <= 2).length;
  const total = ratings.length;

  const averageRating = ratings.reduce((sum, r) => sum + r, 0) / total;
  const csatScore = (satisfiedCount / total) * 100;

  return {
    score: Math.round(csatScore),
    averageRating: Math.round(averageRating * 100) / 100,
    totalResponses: total,
    satisfiedCount,
    neutralCount,
    dissatisfiedCount,
    satisfiedPercentage: Math.round((satisfiedCount / total) * 1000) / 10,
    neutralPercentage: Math.round((neutralCount / total) * 1000) / 10,
    dissatisfiedPercentage: Math.round((dissatisfiedCount / total) * 1000) / 10,
  };
}

/**
 * Calculate Response Rate
 * Response Rate = (Completed surveys / Total sent surveys) * 100
 */
export function calculateResponseRate(
  surveys: Array<{
    status: string;
    sentAt: Date | null;
    completedAt: Date | null;
  }>
): ResponseRateMetrics {
  if (surveys.length === 0) {
    return {
      rate: 0,
      totalSent: 0,
      totalCompleted: 0,
      totalPending: 0,
      totalExpired: 0,
      averageCompletionTime: null,
    };
  }

  const totalSent = surveys.filter((s) => s.status !== "pending" || s.sentAt).length;
  const completed = surveys.filter((s) => s.status === "completed");
  const totalCompleted = completed.length;
  const totalPending = surveys.filter((s) => s.status === "pending" || s.status === "sent" || s.status === "opened").length;
  const totalExpired = surveys.filter((s) => s.status === "expired").length;

  // Calculate average completion time in hours
  let averageCompletionTime: number | null = null;
  const completionTimes: number[] = [];

  for (const survey of completed) {
    if (survey.sentAt && survey.completedAt) {
      const sentTime = new Date(survey.sentAt).getTime();
      const completedTime = new Date(survey.completedAt).getTime();
      const hoursToComplete = (completedTime - sentTime) / (1000 * 60 * 60);
      if (hoursToComplete >= 0) {
        completionTimes.push(hoursToComplete);
      }
    }
  }

  if (completionTimes.length > 0) {
    const sum = completionTimes.reduce((a, b) => a + b, 0);
    averageCompletionTime = Math.round((sum / completionTimes.length) * 10) / 10;
  }

  const rate = totalSent > 0 ? Math.round((totalCompleted / totalSent) * 100) : 0;

  return {
    rate,
    totalSent,
    totalCompleted,
    totalPending,
    totalExpired,
    averageCompletionTime,
  };
}

/**
 * Calculate Review Velocity
 * Measures the rate of review collection over time
 */
export function calculateReviewVelocity(
  reviews: Array<{ reviewDate: Date }>,
  dateRange: DateRange
): ReviewVelocityMetrics {
  if (reviews.length === 0) {
    return {
      reviewsPerDay: 0,
      reviewsPerWeek: 0,
      reviewsPerMonth: 0,
      totalReviews: 0,
      averageReviewsPerPeriod: 0,
      trend: "stable",
      changePercentage: 0,
    };
  }

  const totalReviews = reviews.length;
  const startTime = dateRange.start.getTime();
  const endTime = dateRange.end.getTime();
  const daysInRange = Math.max(1, (endTime - startTime) / (1000 * 60 * 60 * 24));

  const reviewsPerDay = Math.round((totalReviews / daysInRange) * 100) / 100;
  const reviewsPerWeek = Math.round(reviewsPerDay * 7 * 100) / 100;
  const reviewsPerMonth = Math.round(reviewsPerDay * 30 * 100) / 100;

  // Calculate trend by comparing first half vs second half of the period
  const midPoint = new Date((startTime + endTime) / 2);
  const firstHalf = reviews.filter((r) => new Date(r.reviewDate).getTime() < midPoint.getTime());
  const secondHalf = reviews.filter((r) => new Date(r.reviewDate).getTime() >= midPoint.getTime());

  let trend: "increasing" | "stable" | "decreasing" = "stable";
  let changePercentage = 0;

  if (firstHalf.length > 0) {
    changePercentage = Math.round(((secondHalf.length - firstHalf.length) / firstHalf.length) * 100);

    if (changePercentage > 10) {
      trend = "increasing";
    } else if (changePercentage < -10) {
      trend = "decreasing";
    }
  } else if (secondHalf.length > 0) {
    changePercentage = 100;
    trend = "increasing";
  }

  return {
    reviewsPerDay,
    reviewsPerWeek,
    reviewsPerMonth,
    totalReviews,
    averageReviewsPerPeriod: reviewsPerMonth,
    trend,
    changePercentage,
  };
}

/**
 * Calculate period-over-period comparison
 */
export function calculatePeriodComparison(
  currentValue: number,
  previousValue: number
): PeriodComparison {
  let change = 0;
  let trend: "up" | "down" | "stable" = "stable";

  if (previousValue > 0) {
    change = Math.round(((currentValue - previousValue) / previousValue) * 100);
  } else if (currentValue > 0) {
    change = 100;
  }

  if (change > 5) {
    trend = "up";
  } else if (change < -5) {
    trend = "down";
  }

  return {
    current: currentValue,
    previous: previousValue,
    change,
    trend,
  };
}

/**
 * Generate monthly trend data from dated values
 */
export function generateMonthlyTrend(
  data: Array<{ date: Date; value: number }>,
  months: number = 6
): TrendPoint[] {
  const now = new Date();
  const monthlyData = new Map<string, { sum: number; count: number }>();

  // Group data by month
  for (const item of data) {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { sum: 0, count: 0 });
    }

    const entry = monthlyData.get(monthKey)!;
    entry.sum += item.value;
    entry.count += 1;
  }

  // Generate trend points for the requested months
  const trendPoints: TrendPoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    const entry = monthlyData.get(monthKey);
    const value = entry ? Math.round((entry.sum / entry.count) * 100) / 100 : 0;

    trendPoints.push({
      date: monthLabel,
      value,
      label: monthKey,
    });
  }

  return trendPoints;
}

/**
 * Calculate NPS trend over time (monthly)
 */
export function calculateNPSTrend(
  responses: Array<{ date: Date; npsScore: number }>,
  months: number = 6
): TrendPoint[] {
  const now = new Date();
  const monthlyData = new Map<string, number[]>();

  // Group NPS scores by month
  for (const response of responses) {
    const date = new Date(response.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, []);
    }

    monthlyData.get(monthKey)!.push(response.npsScore);
  }

  // Generate trend points
  const trendPoints: TrendPoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    const scores = monthlyData.get(monthKey) || [];
    const nps = calculateNPS(scores);

    trendPoints.push({
      date: monthLabel,
      value: nps.score,
      label: monthKey,
    });
  }

  return trendPoints;
}

/**
 * Calculate CSAT trend over time (monthly)
 */
export function calculateCSATTrend(
  responses: Array<{ date: Date; rating: number }>,
  months: number = 6
): TrendPoint[] {
  const now = new Date();
  const monthlyData = new Map<string, number[]>();

  // Group ratings by month
  for (const response of responses) {
    const date = new Date(response.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, []);
    }

    monthlyData.get(monthKey)!.push(response.rating);
  }

  // Generate trend points
  const trendPoints: TrendPoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    const ratings = monthlyData.get(monthKey) || [];
    const csat = calculateCSAT(ratings);

    trendPoints.push({
      date: monthLabel,
      value: csat.score,
      label: monthKey,
    });
  }

  return trendPoints;
}

/**
 * Calculate reputation score based on multiple factors
 * Score is 0-100, weighted average of:
 * - NPS (30%)
 * - CSAT (25%)
 * - Response Rate (15%)
 * - Review Volume (15%)
 * - Average Rating (15%)
 */
export function calculateReputationScore(
  nps: NPSBreakdown,
  csat: CSATMetrics,
  responseRate: ResponseRateMetrics,
  totalReviews: number,
  averageRating: number,
  benchmarks: {
    targetReviews: number;
    targetRating: number;
  } = { targetReviews: 50, targetRating: 4.5 }
): number {
  // Normalize NPS from -100...100 to 0...100
  const npsNormalized = (nps.score + 100) / 2;

  // CSAT is already 0-100
  const csatNormalized = csat.score;

  // Response rate is already 0-100
  const responseRateNormalized = responseRate.rate;

  // Normalize review volume (cap at target, max 100)
  const volumeNormalized = Math.min((totalReviews / benchmarks.targetReviews) * 100, 100);

  // Normalize average rating (1-5 to 0-100)
  const ratingNormalized = ((averageRating - 1) / 4) * 100;

  // Weighted average
  const score =
    npsNormalized * 0.3 +
    csatNormalized * 0.25 +
    responseRateNormalized * 0.15 +
    volumeNormalized * 0.15 +
    ratingNormalized * 0.15;

  return Math.round(score);
}

/**
 * Determine performance status based on metrics
 */
export function determinePerformanceStatus(
  averageRating: number,
  totalReviews: number,
  npsScore: number,
  responseRate: number
): "excellent" | "good" | "needs_attention" | "at_risk" {
  // Excellent: High rating, sufficient reviews, strong NPS
  if (averageRating >= 4.5 && totalReviews >= 10 && npsScore >= 50 && responseRate >= 40) {
    return "excellent";
  }

  // At risk: Low rating or very negative NPS
  if (averageRating < 3.5 || npsScore < 0) {
    return "at_risk";
  }

  // Needs attention: Below average metrics
  if (averageRating < 4.0 || npsScore < 30 || totalReviews < 5 || responseRate < 20) {
    return "needs_attention";
  }

  return "good";
}
