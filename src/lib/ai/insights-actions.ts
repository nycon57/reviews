"use server";

/**
 * AI Insights Server Actions
 * Fetch and process AI-generated insights data
 */

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import type { ActionResult } from "@/lib/reviews/types";
import type {
  SentimentTrendPoint,
  ThemeFrequency,
  KeyPhraseData,
  AIInsightsData,
  ImprovementRecommendation,
  IndustryBenchmark,
  AIInsightsSummary,
  SmartActionItem,
  LOPerformanceScorecard,
  TeamActivityMonitor,
  LOActivityStatus,
  ActivityAlert,
  ChannelMetrics,
} from "./insights-types";
import type { ReviewTheme, SentimentLabel } from "./types";
import { createChatCompletion, isAIEnabled } from "./client";
import { THEME_DESCRIPTIONS } from "./types";
import { randomUUID } from "crypto";

/** Safely subtract months without day-of-month overflow (e.g. Mar 31 - 1 month) */
function subtractMonths(date: Date, months: number): void {
  date.setDate(1);
  date.setMonth(date.getMonth() - months);
}

/**
 * Get user context for analytics operations.
 * Wrapped with cache() to deduplicate within a single RSC request.
 */
const getUserContext = cache(async function getUserContextInner() {
  const user = await unifiedGetUser();

  if (!user) {
    return null;
  }

  const supabase = createAdminClient();

  const { data: userData } = await supabase
    .from("users")
    .select(
      "id, organization_id, role, full_name, organizations(subscription_tier, account_type)"
    )
    .eq("id", user.id)
    .single();

  if (!userData || !userData.organization_id) {
    return null;
  }

  // Enforce Pro tier at action level (defense-in-depth)
  const org = userData.organizations as {
    subscription_tier?: string;
    account_type?: string;
  } | null;
  const subscriptionTier = org?.subscription_tier || "basic";
  if (subscriptionTier !== "pro" && subscriptionTier !== "enterprise") {
    return null;
  }

  return {
    userId: userData.id,
    organizationId: userData.organization_id,
    role: userData.role,
    accountType: (org?.account_type || "individual") as string,
    loanOfficerId: userData.id,
    loanOfficerName: userData.full_name || null,
  };
});

/**
 * Get sentiment trend data over time
 */
export async function getSentimentTrend(
  loanOfficerId?: string,
  months: number = 6
): Promise<ActionResult<SentimentTrendPoint[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const startDate = new Date();
  subtractMonths(startDate, months);

  let query = supabase
    .from("reviews")
    .select("id, review_date, sentiment_score, sentiment_label")
    .eq("organization_id", context.organizationId)
    .gte("review_date", startDate.toISOString())
    .order("review_date", { ascending: true });

  if (loanOfficerId) {
    query = query.eq("user_id", loanOfficerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching sentiment trend:", error);
    return { success: false, error: "Failed to fetch sentiment data" };
  }

  // Group by month
  const monthlyData = new Map<
    string,
    { positive: number; neutral: number; negative: number; scores: number[] }
  >();

  for (const review of data || []) {
    const date = new Date(review.review_date);
    const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        positive: 0,
        neutral: 0,
        negative: 0,
        scores: [],
      });
    }

    const entry = monthlyData.get(monthKey)!;
    const label = review.sentiment_label || "neutral";
    entry[label as "positive" | "neutral" | "negative"]++;
    if (review.sentiment_score !== null) {
      entry.scores.push(review.sentiment_score);
    }
  }

  // Generate trend points for each month
  const trendPoints: SentimentTrendPoint[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(1);
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const monthLabel = date.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });

    const entry = monthlyData.get(monthKey) || {
      positive: 0,
      neutral: 0,
      negative: 0,
      scores: [],
    };
    const total = entry.positive + entry.neutral + entry.negative;
    const avgScore =
      entry.scores.length > 0
        ? entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length
        : 0;

    trendPoints.push({
      date: monthLabel,
      positiveCount: entry.positive,
      neutralCount: entry.neutral,
      negativeCount: entry.negative,
      averageScore: Math.round(avgScore * 100) / 100,
      totalReviews: total,
    });
  }

  return { success: true, data: trendPoints };
}

/**
 * Get theme frequency analysis
 */
export async function getThemeFrequencies(
  loanOfficerId?: string,
  months: number = 6
): Promise<ActionResult<ThemeFrequency[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const startDate = new Date();
  subtractMonths(startDate, months);

  // Get current period data
  let query = supabase
    .from("reviews")
    .select("id, themes, sentiment_label, review_date")
    .eq("organization_id", context.organizationId)
    .gte("review_date", startDate.toISOString());

  if (loanOfficerId) {
    query = query.eq("user_id", loanOfficerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching theme data:", error);
    return { success: false, error: "Failed to fetch theme data" };
  }

  // Get previous period for trend comparison
  const prevStartDate = new Date(startDate);
  subtractMonths(prevStartDate, months);

  let prevQuery = supabase
    .from("reviews")
    .select("themes")
    .eq("organization_id", context.organizationId)
    .gte("review_date", prevStartDate.toISOString())
    .lt("review_date", startDate.toISOString());

  if (loanOfficerId) {
    prevQuery = prevQuery.eq("user_id", loanOfficerId);
  }

  const { data: prevData } = await prevQuery;

  // Count themes and sentiment breakdown
  const themeCounts = new Map<
    string,
    { count: number; positive: number; neutral: number; negative: number }
  >();
  const prevThemeCounts = new Map<string, number>();

  // Current period counts
  for (const review of data || []) {
    const themes = (review.themes as string[]) || [];
    const sentiment = (review.sentiment_label as SentimentLabel) || "neutral";

    for (const theme of themes) {
      if (!themeCounts.has(theme)) {
        themeCounts.set(theme, {
          count: 0,
          positive: 0,
          neutral: 0,
          negative: 0,
        });
      }
      const entry = themeCounts.get(theme)!;
      entry.count++;
      entry[sentiment]++;
    }
  }

  // Previous period counts
  for (const review of prevData || []) {
    const themes = (review.themes as string[]) || [];
    for (const theme of themes) {
      prevThemeCounts.set(theme, (prevThemeCounts.get(theme) || 0) + 1);
    }
  }

  const totalReviews = data?.length || 0;
  const allThemes: ReviewTheme[] = [
    "communication",
    "process",
    "service",
    "responsiveness",
    "professionalism",
    "knowledge",
    "rates",
    "closing",
    "documentation",
    "timeliness",
  ];

  const frequencies: ThemeFrequency[] = allThemes
    .map((theme) => {
      const entry = themeCounts.get(theme) || {
        count: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
      };
      const prevCount = prevThemeCounts.get(theme) || 0;

      // Determine trend
      let trend: "increasing" | "stable" | "decreasing" = "stable";
      if (entry.count > prevCount * 1.1) trend = "increasing";
      else if (entry.count < prevCount * 0.9) trend = "decreasing";

      return {
        theme,
        count: entry.count,
        percentage:
          totalReviews > 0 ? Math.round((entry.count / totalReviews) * 100) : 0,
        sentimentBreakdown: {
          positive: entry.positive,
          neutral: entry.neutral,
          negative: entry.negative,
        },
        trend,
      };
    })
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count);

  return { success: true, data: frequencies };
}

/**
 * Get top key phrases from reviews
 */
export async function getTopKeyPhrases(
  loanOfficerId?: string,
  limit: number = 20
): Promise<ActionResult<KeyPhraseData[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const startDate = new Date();
  subtractMonths(startDate, 3); // Last 3 months

  const recentDate = new Date();
  subtractMonths(recentDate, 1); // Last month for "recent"

  let query = supabase
    .from("reviews")
    .select("key_phrases, sentiment_label, review_date")
    .eq("organization_id", context.organizationId)
    .gte("review_date", startDate.toISOString());

  if (loanOfficerId) {
    query = query.eq("user_id", loanOfficerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching key phrases:", error);
    return { success: false, error: "Failed to fetch key phrases" };
  }

  // Count phrases and track sentiment
  const phraseCounts = new Map<
    string,
    { count: number; recentCount: number; sentiments: SentimentLabel[] }
  >();

  for (const review of data || []) {
    const phrases = (review.key_phrases as string[]) || [];
    const sentiment = (review.sentiment_label as SentimentLabel) || "neutral";
    const reviewDate = new Date(review.review_date);
    const isRecent = reviewDate >= recentDate;

    for (const phrase of phrases) {
      const normalizedPhrase = phrase.toLowerCase().trim();
      if (!phraseCounts.has(normalizedPhrase)) {
        phraseCounts.set(normalizedPhrase, {
          count: 0,
          recentCount: 0,
          sentiments: [],
        });
      }
      const entry = phraseCounts.get(normalizedPhrase)!;
      entry.count++;
      entry.sentiments.push(sentiment);
      if (isRecent) entry.recentCount++;
    }
  }

  // Convert to array and sort
  const phraseData: KeyPhraseData[] = Array.from(phraseCounts.entries())
    .map(([phrase, entry]) => {
      // Determine dominant sentiment
      const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
      for (const s of entry.sentiments) {
        sentimentCounts[s]++;
      }
      const dominantSentiment = (
        Object.entries(sentimentCounts) as [SentimentLabel, number][]
      ).reduce((a, b) => (b[1] > a[1] ? b : a))[0];

      return {
        phrase,
        count: entry.count,
        sentiment: dominantSentiment,
        recentOccurrences: entry.recentCount,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return { success: true, data: phraseData };
}

/**
 * Get sentiment distribution
 */
export async function getSentimentDistribution(
  loanOfficerId?: string,
  months: number = 6
): Promise<
  ActionResult<{
    positive: number;
    neutral: number;
    negative: number;
    total: number;
  }>
> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const startDate = new Date();
  subtractMonths(startDate, months);

  let query = supabase
    .from("reviews")
    .select("sentiment_label")
    .eq("organization_id", context.organizationId)
    .gte("review_date", startDate.toISOString());

  if (loanOfficerId) {
    query = query.eq("user_id", loanOfficerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching sentiment distribution:", error);
    return { success: false, error: "Failed to fetch sentiment data" };
  }

  const distribution = { positive: 0, neutral: 0, negative: 0, total: 0 };

  for (const review of data || []) {
    const label = (review.sentiment_label as SentimentLabel) || "neutral";
    distribution[label]++;
    distribution.total++;
  }

  return { success: true, data: distribution };
}

/**
 * Generate AI summary for loan officer or organization
 */
export async function generateAISummary(
  loanOfficerId?: string,
  months: number = 1
): Promise<ActionResult<AIInsightsSummary>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const startDate = new Date();
  subtractMonths(startDate, months);
  const endDate = new Date();

  // Get recent reviews with sentiment data
  let query = supabase
    .from("reviews")
    .select(
      "text, rating, sentiment_label, sentiment_score, themes, key_phrases, review_date"
    )
    .eq("organization_id", context.organizationId)
    .gte("review_date", startDate.toISOString())
    .order("review_date", { ascending: false })
    .limit(50);

  if (loanOfficerId) {
    query = query.eq("user_id", loanOfficerId);
  }

  const { data: reviews, error } = await query;

  if (error) {
    console.error("Error fetching reviews for summary:", error);
    return { success: false, error: "Failed to fetch review data" };
  }

  if (!reviews || reviews.length === 0) {
    return {
      success: true,
      data: {
        id: randomUUID(),
        loanOfficerId: loanOfficerId || null,
        organizationId: context.organizationId,
        periodStart: startDate,
        periodEnd: endDate,
        summary:
          "No reviews available for this period. Collect more customer feedback to generate insights.",
        highlights: [],
        areasOfImprovement: [],
        generatedAt: new Date(),
      },
    };
  }

  // Analyze sentiment distribution
  const sentiments = { positive: 0, neutral: 0, negative: 0 };
  const allThemes: string[] = [];
  const allKeyPhrases: string[] = [];
  const ratings: number[] = [];

  for (const review of reviews) {
    const label = (review.sentiment_label as SentimentLabel) || "neutral";
    sentiments[label]++;
    if (review.themes) allThemes.push(...(review.themes as string[]));
    if (review.key_phrases)
      allKeyPhrases.push(...(review.key_phrases as string[]));
    if (review.rating) ratings.push(review.rating);
  }

  const avgRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) /
        10
      : 0;
  const total = reviews.length;
  const positiveRate = Math.round((sentiments.positive / total) * 100);
  const negativeRate = Math.round((sentiments.negative / total) * 100);

  // Count theme frequencies
  const themeCounts = new Map<string, number>();
  for (const theme of allThemes) {
    themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1);
  }
  const topThemes = Array.from(themeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme]) => theme);

  // Count key phrase frequencies
  const phraseCounts = new Map<string, number>();
  for (const phrase of allKeyPhrases) {
    const normalized = phrase.toLowerCase().trim();
    phraseCounts.set(normalized, (phraseCounts.get(normalized) || 0) + 1);
  }
  const topPhrases = Array.from(phraseCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase]) => phrase);

  // Generate AI summary if enabled
  if (isAIEnabled()) {
    try {
      const systemPrompt = `You are an expert business analyst summarizing customer feedback for a mortgage professional.
Generate a concise, actionable monthly summary that includes:
1. A 2-3 sentence overview of performance
2. 3-4 key highlights (positive aspects)
3. 2-3 areas for improvement with specific suggestions

The tone should be professional, constructive, and data-driven.
Respond with JSON:
{
  "summary": "Overview text",
  "highlights": ["highlight 1", "highlight 2", "highlight 3"],
  "areasOfImprovement": ["improvement 1", "improvement 2"]
}`;

      const reviewSamples = reviews
        .slice(0, 15)
        .map(
          (r) =>
            `Rating: ${r.rating}/5, Sentiment: ${r.sentiment_label}, Text: "${r.text?.slice(0, 200) || "No text"}"`
        )
        .join("\n");

      const userPrompt = `Analyze these customer reviews from the past month:

Total Reviews: ${total}
Average Rating: ${avgRating}/5
Positive Reviews: ${positiveRate}%
Negative Reviews: ${negativeRate}%
Most Common Themes: ${topThemes.join(", ") || "None detected"}
Common Phrases: ${topPhrases.slice(0, 5).join(", ") || "None detected"}

Sample Reviews:
${reviewSamples}

Generate a monthly performance summary.`;

      // Returns true for transient errors (network / 5xx) that warrant a retry.
      // 4xx client errors should not be retried.
      const isTransientError = (err: unknown): boolean => {
        if (err instanceof Error) {
          const msg = err.message.toLowerCase();
          return (
            msg.includes("network") ||
            msg.includes("econnreset") ||
            msg.includes("etimedout") ||
            msg.includes("fetch failed") ||
            msg.includes("500") ||
            msg.includes("502") ||
            msg.includes("503") ||
            msg.includes("504")
          );
        }
        return false;
      };

      const attemptAICall = async (): Promise<string> => {
        try {
          return await createChatCompletion(systemPrompt, userPrompt);
        } catch (callErr) {
          if (isTransientError(callErr)) {
            // Single retry after 1 second delay for transient failures
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return await createChatCompletion(systemPrompt, userPrompt);
          }
          throw callErr;
        }
      };

      const response = await attemptAICall();

      let parsed: {
        summary?: string;
        highlights?: unknown;
        areasOfImprovement?: unknown;
      };
      try {
        parsed = JSON.parse(response);
      } catch {
        console.error("AI summary JSON parse failed, using fallback");
        return {
          success: true,
          data: {
            id: randomUUID(),
            loanOfficerId: loanOfficerId || null,
            organizationId: context.organizationId,
            periodStart: startDate,
            periodEnd: endDate,
            summary: "Unable to generate AI insights at this time.",
            highlights: [],
            areasOfImprovement: [],
            generatedAt: new Date(),
          },
        };
      }

      return {
        success: true,
        data: {
          id: randomUUID(),
          loanOfficerId: loanOfficerId || null,
          organizationId: context.organizationId,
          periodStart: startDate,
          periodEnd: endDate,
          summary: parsed.summary || "Summary generation in progress.",
          highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
          areasOfImprovement: Array.isArray(parsed.areasOfImprovement)
            ? parsed.areasOfImprovement
            : [],
          generatedAt: new Date(),
        },
      };
    } catch (err) {
      console.error("AI summary generation failed:", err);
      // Fall through to static summary
    }
  }

  // Generate static summary if AI is not available
  const highlights: string[] = [];
  const improvements: string[] = [];

  if (positiveRate >= 70)
    highlights.push(`${positiveRate}% of reviews were positive`);
  if (avgRating >= 4.5)
    highlights.push(`Maintained an excellent ${avgRating}/5 average rating`);
  if (topThemes.includes("service"))
    highlights.push("Customer service was frequently praised");
  if (topThemes.includes("professionalism"))
    highlights.push("Professional conduct noted by customers");
  if (topThemes.includes("communication"))
    highlights.push("Strong communication skills recognized");

  if (negativeRate > 10)
    improvements.push(`Address the ${negativeRate}% negative feedback`);
  if (topThemes.includes("timeliness") && negativeRate > 5)
    improvements.push("Consider improving response times");
  if (topThemes.includes("documentation") && negativeRate > 5)
    improvements.push("Streamline documentation process");

  if (highlights.length === 0)
    highlights.push("Continue maintaining quality service");
  if (improvements.length === 0)
    improvements.push("Gather more customer feedback for insights");

  return {
    success: true,
    data: {
      id: randomUUID(),
      loanOfficerId: loanOfficerId || null,
      organizationId: context.organizationId,
      periodStart: startDate,
      periodEnd: endDate,
      summary: `Over the past month, ${total} customer reviews were collected with an average rating of ${avgRating}/5. ${positiveRate}% of feedback was positive${topThemes.length > 0 ? `, with ${topThemes[0]} being the most discussed topic` : ""}.`,
      highlights: highlights.slice(0, 4),
      areasOfImprovement: improvements.slice(0, 3),
      generatedAt: new Date(),
    },
  };
}

/**
 * Generate improvement recommendations based on feedback
 */
export async function getImprovementRecommendations(
  loanOfficerId?: string
): Promise<ActionResult<ImprovementRecommendation[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const startDate = new Date();
  subtractMonths(startDate, 3);

  // Get negative and neutral reviews for analysis
  let query = supabase
    .from("reviews")
    .select("text, sentiment_label, themes, rating")
    .eq("organization_id", context.organizationId)
    .gte("review_date", startDate.toISOString())
    .in("sentiment_label", ["negative", "neutral"]);

  if (loanOfficerId) {
    query = query.eq("user_id", loanOfficerId);
  }

  const { data: negativeReviews, error } = await query;

  if (error) {
    console.error("Error fetching reviews for recommendations:", error);
    return { success: false, error: "Failed to fetch review data" };
  }

  // Count negative themes
  const negativeThemes = new Map<string, number>();
  for (const review of negativeReviews || []) {
    const themes = (review.themes as string[]) || [];
    for (const theme of themes) {
      negativeThemes.set(theme, (negativeThemes.get(theme) || 0) + 1);
    }
  }

  // Generate recommendations based on theme frequencies
  const recommendations: ImprovementRecommendation[] = [];
  const themeRecommendations: Record<
    ReviewTheme,
    {
      title: string;
      description: string;
      actionItems: string[];
      potentialImpact: string;
    }
  > = {
    communication: {
      title: "Enhance Communication Clarity",
      description:
        "Customer feedback suggests communication could be improved. Clear, proactive communication builds trust and reduces anxiety.",
      actionItems: [
        "Send weekly status updates during loan processing",
        "Use simple language to explain loan terms",
        "Set expectations upfront about timelines and requirements",
        "Follow up after key milestones",
      ],
      potentialImpact: "Can improve satisfaction scores by 15-20%",
    },
    process: {
      title: "Streamline the Loan Process",
      description:
        "Reviews indicate the loan process may feel complex or unclear to customers.",
      actionItems: [
        "Create a visual timeline of the loan journey",
        "Provide clear checklists for required documents",
        "Offer regular progress updates",
        "Simplify paperwork where possible",
      ],
      potentialImpact: "Can reduce processing time complaints by 25%",
    },
    service: {
      title: "Elevate Customer Service Quality",
      description:
        "General service experience has room for improvement based on feedback.",
      actionItems: [
        "Respond to inquiries within 4 business hours",
        "Personalize interactions by remembering customer details",
        "Go above and beyond on small requests",
        "Follow up after closing to ensure satisfaction",
      ],
      potentialImpact: "Can boost referral likelihood by 30%",
    },
    responsiveness: {
      title: "Improve Response Times",
      description:
        "Customers have noted delays in getting responses to their questions and concerns.",
      actionItems: [
        "Set up automated acknowledgment emails",
        "Establish response time targets (e.g., 24 hours)",
        "Use a ticketing system to track inquiries",
        "Prioritize urgent requests from closing customers",
      ],
      potentialImpact: "Can significantly improve NPS scores",
    },
    professionalism: {
      title: "Maintain Professional Standards",
      description:
        "Feedback indicates some interactions may not have met professional expectations.",
      actionItems: [
        "Review communication templates for tone",
        "Ensure all team members follow dress code standards",
        "Document conversations and commitments",
        "Handle complaints with empathy and resolution",
      ],
      potentialImpact: "Builds long-term trust and referrals",
    },
    knowledge: {
      title: "Deepen Product Knowledge",
      description:
        "Some customers felt questions were not answered with sufficient expertise.",
      actionItems: [
        "Attend regular training on new loan products",
        "Stay updated on current market rates",
        "Prepare FAQ resources for common questions",
        "Consult with specialists when needed",
      ],
      potentialImpact: "Increases customer confidence in recommendations",
    },
    rates: {
      title: "Improve Rate Communication",
      description:
        "Rate-related feedback suggests better transparency or competitiveness may be needed.",
      actionItems: [
        "Clearly explain how rates are determined",
        "Provide rate comparison information",
        "Proactively communicate rate locks and changes",
        "Offer rate monitoring for optimal timing",
      ],
      potentialImpact: "Reduces rate-related complaints by 40%",
    },
    closing: {
      title: "Optimize the Closing Experience",
      description:
        "The closing process has been mentioned in negative feedback.",
      actionItems: [
        "Send detailed closing day instructions",
        "Confirm all documents are ready in advance",
        "Be available during closing for questions",
        "Follow up within 48 hours after closing",
      ],
      potentialImpact: "Ends the transaction on a positive note",
    },
    documentation: {
      title: "Simplify Documentation Requirements",
      description:
        "Paperwork and documentation processes have caused friction.",
      actionItems: [
        "Use digital document signing",
        "Create clear document checklists",
        "Explain why each document is needed",
        "Minimize redundant requests",
      ],
      potentialImpact: "Can reduce customer frustration significantly",
    },
    timeliness: {
      title: "Meet Deadlines Consistently",
      description: "Feedback indicates timeline expectations were not always met.",
      actionItems: [
        "Build buffer time into estimates",
        "Communicate proactively about delays",
        "Track and report on processing times",
        "Identify and remove bottlenecks",
      ],
      potentialImpact: "Builds reliability and trust",
    },
  };

  // Sort themes by frequency and generate recommendations
  const sortedThemes = Array.from(negativeThemes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  for (const [theme, count] of sortedThemes) {
    const rec = themeRecommendations[theme as ReviewTheme];
    if (rec) {
      recommendations.push({
        id: randomUUID(),
        category: theme as ReviewTheme,
        priority: count >= 5 ? "high" : count >= 3 ? "medium" : "low",
        title: rec.title,
        description: rec.description,
        actionItems: rec.actionItems,
        basedOn: `${count} reviews mentioning ${THEME_DESCRIPTIONS[theme as ReviewTheme]?.toLowerCase() || theme}`,
        potentialImpact: rec.potentialImpact,
      });
    }
  }

  // Add general recommendation if few negative themes
  if (recommendations.length < 2) {
    recommendations.push({
      id: randomUUID(),
      category: "general",
      priority: "low",
      title: "Continue Collecting Feedback",
      description:
        "Your performance is strong! Continue gathering customer feedback to maintain excellence and identify any emerging trends.",
      actionItems: [
        "Send surveys after every transaction",
        "Ask satisfied customers for referrals",
        "Monitor review trends monthly",
        "Celebrate positive feedback with your team",
      ],
      basedOn: "Overall positive feedback pattern",
      potentialImpact: "Maintains high performance standards",
    });
  }

  return { success: true, data: recommendations };
}

/**
 * Get industry benchmark comparisons
 */
export async function getIndustryBenchmarks(
  loanOfficerId?: string
): Promise<ActionResult<IndustryBenchmark[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const startDate = new Date();
  subtractMonths(startDate, 3);

  // Fetch current metrics
  let query = supabase
    .from("reviews")
    .select("rating, sentiment_label")
    .eq("organization_id", context.organizationId)
    .gte("review_date", startDate.toISOString());

  if (loanOfficerId) {
    query = query.eq("user_id", loanOfficerId);
  }

  const { data: reviews, error } = await query;

  if (error) {
    console.error("Error fetching benchmark data:", error);
    return { success: false, error: "Failed to fetch data" };
  }

  // Calculate current metrics
  const ratings = (reviews || [])
    .filter((r) => r.rating !== null)
    .map((r) => r.rating!);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

  const sentiments = { positive: 0, neutral: 0, negative: 0 };
  for (const review of reviews || []) {
    const label = (review.sentiment_label as SentimentLabel) || "neutral";
    sentiments[label]++;
  }
  const total = reviews?.length || 0;
  const positiveRate = total > 0 ? (sentiments.positive / total) * 100 : 0;

  // Get NPS from survey responses (org-filtered at DB level)
  let npsQuery = supabase
    .from("survey_responses")
    .select(
      `
      nps_score,
      surveys!inner (
        user_id,
        organization_id
      )
    `
    )
    .not("nps_score", "is", null)
    .eq("surveys.organization_id", context.organizationId)
    .gte("submitted_at", startDate.toISOString());

  if (loanOfficerId) {
    npsQuery = npsQuery.eq("surveys.user_id", loanOfficerId);
  }

  const { data: npsData } = await npsQuery;

  const filteredNps = npsData || [];

  const npsScores = filteredNps.map((r) => r.nps_score!);
  let nps = 0;
  if (npsScores.length > 0) {
    const promoters = npsScores.filter((s) => s >= 9).length;
    const detractors = npsScores.filter((s) => s <= 6).length;
    nps = Math.round(
      ((promoters - detractors) / npsScores.length) * 100
    );
  }

  // Industry benchmarks (mortgage industry averages)
  const benchmarks: IndustryBenchmark[] = [
    {
      metric: "Average Rating",
      yourValue: Math.round(avgRating * 10) / 10,
      industryAverage: 4.2,
      topPerformers: 4.8,
      percentile: calculatePercentile(avgRating, 4.2, 4.8),
      trend:
        avgRating >= 4.8
          ? "above"
          : avgRating >= 4.2
            ? "at"
            : "below",
    },
    {
      metric: "NPS Score",
      yourValue: nps,
      industryAverage: 35,
      topPerformers: 70,
      percentile: calculatePercentile(nps, 35, 70),
      trend: nps >= 70 ? "above" : nps >= 35 ? "at" : "below",
    },
    {
      metric: "Positive Sentiment %",
      yourValue: Math.round(positiveRate),
      industryAverage: 65,
      topPerformers: 85,
      percentile: calculatePercentile(positiveRate, 65, 85),
      trend:
        positiveRate >= 85
          ? "above"
          : positiveRate >= 65
            ? "at"
            : "below",
    },
    {
      metric: "Review Volume (3mo)",
      yourValue: total,
      industryAverage: 15,
      topPerformers: 50,
      percentile: calculatePercentile(total, 15, 50),
      trend: total >= 50 ? "above" : total >= 15 ? "at" : "below",
    },
  ];

  return { success: true, data: benchmarks };
}

function calculatePercentile(
  value: number,
  average: number,
  top: number
): number {
  if (value >= top) return 95;
  if (value <= 0) return 5;

  // Linear interpolation between benchmarks
  const midpoint = average + (top - average) / 2;

  if (value >= midpoint) {
    return Math.round(75 + ((value - midpoint) / (top - midpoint)) * 20);
  } else if (value >= average) {
    return Math.round(50 + ((value - average) / (midpoint - average)) * 25);
  } else {
    return Math.round((value / average) * 50);
  }
}

/**
 * Get comprehensive AI insights data
 */
export async function getAIInsightsData(
  loanOfficerId?: string,
  months: number = 6
): Promise<ActionResult<AIInsightsData>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const startDate = new Date();
  subtractMonths(startDate, months);
  const endDate = new Date();

  // Fetch all insights data in parallel
  const [
    sentimentTrendResult,
    themeResult,
    keyPhrasesResult,
    distributionResult,
    summaryResult,
    recommendationsResult,
  ] = await Promise.all([
    getSentimentTrend(loanOfficerId, months),
    getThemeFrequencies(loanOfficerId, months),
    getTopKeyPhrases(loanOfficerId, 20),
    getSentimentDistribution(loanOfficerId, months),
    generateAISummary(loanOfficerId, 1),
    getImprovementRecommendations(loanOfficerId),
  ]);

  return {
    success: true,
    data: {
      sentimentTrend: sentimentTrendResult.data || [],
      themeFrequencies: themeResult.data || [],
      topKeyPhrases: keyPhrasesResult.data || [],
      summary: summaryResult.data || null,
      recommendations: recommendationsResult.data || [],
      sentimentDistribution: distributionResult.data || {
        positive: 0,
        neutral: 0,
        negative: 0,
        total: 0,
      },
      periodStart: startDate,
      periodEnd: endDate,
    },
  };
}

// ============================================================================
// Smart Action Items
// ============================================================================

/**
 * Get prioritized action items for a loan officer
 */
export async function getSmartActionItems(
  loanOfficerId?: string
): Promise<ActionResult<SmartActionItem[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const actions: SmartActionItem[] = [];
  const targetLO = loanOfficerId || context.loanOfficerId;

  const now = new Date();
  const oneDayAgo = new Date(now);
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Run independent queries in parallel
  const [unrespondedResult, weeklyReviewsResult, prevWeeklyResult, negativeResult, ratingResult] =
    await Promise.all([
      // 1. Unresponded reviews > 24h (LO-filtered if applicable)
      (() => {
        let q = supabase
          .from("reviews")
          .select("id, customer_name, review_date, rating")
          .eq("organization_id", context.organizationId)
          .is("response_text", null)
          .lt("review_date", oneDayAgo.toISOString())
          .order("review_date", { ascending: true })
          .limit(10);
        if (targetLO) q = q.eq("user_id", targetLO);
        return q;
      })(),

      // 2. Reviews received this week (for velocity check)
      (() => {
        let q = supabase
          .from("surveys")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", context.organizationId)
          .gte("sent_at", sevenDaysAgo.toISOString());
        if (targetLO) q = q.eq("user_id", targetLO);
        return q;
      })(),

      // 3. Reviews received previous week (for comparison)
      (() => {
        const twoWeeksAgo = new Date(now);
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        let q = supabase
          .from("surveys")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", context.organizationId)
          .gte("sent_at", twoWeeksAgo.toISOString())
          .lt("sent_at", sevenDaysAgo.toISOString());
        if (targetLO) q = q.eq("user_id", targetLO);
        return q;
      })(),

      // 4. Negative reviews last 7 days
      (() => {
        let q = supabase
          .from("reviews")
          .select("id, themes")
          .eq("organization_id", context.organizationId)
          .eq("sentiment_label", "negative")
          .gte("review_date", sevenDaysAgo.toISOString());
        if (targetLO) q = q.eq("user_id", targetLO);
        return q;
      })(),

      // 5. Rating improvement check (30 vs 60 day avg)
      (() => {
        let q = supabase
          .from("reviews")
          .select("rating, review_date")
          .eq("organization_id", context.organizationId)
          .gte("review_date", sixtyDaysAgo.toISOString())
          .not("rating", "is", null);
        if (targetLO) q = q.eq("user_id", targetLO);
        return q;
      })(),
    ]);

  const unrespondedReviews = unrespondedResult.data || [];

  // HIGH PRIORITY: Individual unresponded reviews (show up to 3)
  for (const review of unrespondedReviews.slice(0, 3)) {
    const name = review.customer_name || "a customer";
    const daysAgo = Math.floor(
      (now.getTime() - new Date(review.review_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    actions.push({
      id: `respond-${review.id}`,
      priority: "high",
      actionType: "respond_review",
      title: `Respond to review from ${name}`,
      description: `This ${review.rating}-star review has been waiting ${daysAgo} day${daysAgo !== 1 ? "s" : ""} for a response. Timely responses boost your reputation.`,
      actionUrl: `/dashboard/reviews?highlight=${review.id}`,
      dismissible: false,
    });
  }

  // HIGH PRIORITY: Pending response count (if more than shown individually)
  if (unrespondedReviews.length > 3) {
    actions.push({
      id: "pending-responses",
      priority: "high",
      actionType: "pending_responses",
      title: `You have ${unrespondedReviews.length} reviews awaiting response`,
      description:
        "Responding to reviews shows customers you value their feedback and improves your overall reputation score.",
      actionUrl: "/dashboard/reviews?filter=needs_response",
      dismissible: false,
    });
  }

  // MEDIUM PRIORITY: Survey send rate declining
  const thisWeekSurveys = weeklyReviewsResult.count || 0;
  const lastWeekSurveys = prevWeeklyResult.count || 0;
  if (lastWeekSurveys > 0 && thisWeekSurveys < lastWeekSurveys * 0.6) {
    const pctBelow = Math.round((1 - thisWeekSurveys / lastWeekSurveys) * 100);
    actions.push({
      id: "send-requests",
      priority: "medium",
      actionType: "send_requests",
      title: `Send review requests — you're ${pctBelow}% below last week`,
      description: `You sent ${thisWeekSurveys} review requests this week vs ${lastWeekSurveys} last week. Consistent outreach drives steady review growth.`,
      actionUrl: "/dashboard/surveys/send",
      dismissible: true,
    });
  }

  // MEDIUM PRIORITY: Negative theme spike
  const negativeReviews = negativeResult.data || [];
  if (negativeReviews.length >= 3) {
    // Find most common negative theme
    const themeCounts = new Map<string, number>();
    for (const review of negativeReviews) {
      for (const theme of (review.themes as string[]) || []) {
        themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1);
      }
    }
    const topTheme = Array.from(themeCounts.entries()).sort((a, b) => b[1] - a[1])[0];
    if (topTheme) {
      actions.push({
        id: "theme-alert",
        priority: "medium",
        actionType: "theme_alert",
        title: `Your "${topTheme[0]}" ratings are trending down`,
        description: `${negativeReviews.length} negative reviews in the past 7 days mention ${topTheme[0]}. Review the recommendations section for specific improvement tips.`,
        actionUrl: "/dashboard/insights#recommendations",
        dismissible: true,
      });
    }
  }

  // LOW PRIORITY: Response time improvement
  const ratingData = ratingResult.data || [];
  if (ratingData.length >= 5) {
    const recent = ratingData.filter(
      (r) => new Date(r.review_date) >= thirtyDaysAgo
    );
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

    if (olderAvg > 0 && recentAvg > olderAvg + 0.2) {
      const improvement = Math.round((recentAvg - olderAvg) * 10) / 10;
      actions.push({
        id: "improvement-celebration",
        priority: "low",
        actionType: "improvement",
        title: `Your average rating improved by ${improvement} stars`,
        description: `Your 30-day average (${Math.round(recentAvg * 10) / 10}) is up from last month (${Math.round(olderAvg * 10) / 10}). Keep up the great work!`,
        dismissible: true,
      });
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return { success: true, data: actions };
}

// ============================================================================
// LO Performance Scorecard
// ============================================================================

/**
 * Get performance scorecard for a specific loan officer
 */
export async function getLOPerformanceScorecard(
  loanOfficerId: string
): Promise<ActionResult<LOPerformanceScorecard>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const prevMonthStart = new Date(now);
  prevMonthStart.setDate(prevMonthStart.getDate() - 60);

  // Parallelize all queries
  const [
    loUserResult,
    reviewsResult,
    orgResponseResult,
    surveysResult,
    npsResult,
    cachedBriefResult,
  ] = await Promise.all([
    // LO name (org-scoped to prevent cross-org access)
    supabase
      .from("users")
      .select("full_name")
      .eq("id", loanOfficerId)
      .eq("organization_id", context.organizationId)
      .single(),

    // All reviews for last 90 days
    supabase
      .from("reviews")
      .select(
        "id, rating, review_date, response_text, response_at, sentiment_score, sentiment_label, themes"
      )
      .eq("organization_id", context.organizationId)
      .eq("user_id", loanOfficerId)
      .gte("review_date", ninetyDaysAgo.toISOString())
      .order("review_date", { ascending: false }),

    // Org-wide response rate for comparison
    supabase
      .from("reviews")
      .select("id, response_text")
      .eq("organization_id", context.organizationId)
      .gte("review_date", thirtyDaysAgo.toISOString()),

    // Surveys for completion rate + conversion
    supabase
      .from("surveys")
      .select("id, status, created_at")
      .eq("organization_id", context.organizationId)
      .eq("user_id", loanOfficerId)
      .gte("created_at", ninetyDaysAgo.toISOString()),

    // NPS data (org-filtered at DB level)
    supabase
      .from("survey_responses")
      .select("nps_score, submitted_at, surveys!inner(user_id, organization_id)")
      .not("nps_score", "is", null)
      .eq("surveys.organization_id", context.organizationId)
      .eq("surveys.user_id", loanOfficerId)
      .gte("submitted_at", ninetyDaysAgo.toISOString()),

    // Cached coaching brief
    supabase
      .from("metrics_snapshots")
      .select("metrics, computed_at")
      .eq("organization_id", context.organizationId)
      .eq("user_id", loanOfficerId)
      .eq("period_type", "daily")
      .order("computed_at", { ascending: false })
      .limit(1),
  ]);

  // If LO not found in this org, deny access
  if (!loUserResult.data) {
    return { success: false, error: "Forbidden" };
  }

  const loName = loUserResult.data.full_name || "Unknown";
  const reviews = reviewsResult.data || [];
  const orgReviews = orgResponseResult.data || [];
  const surveys = surveysResult.data || [];

  // Review velocity: this month vs last month
  const thisMonthReviews = reviews.filter(
    (r) => new Date(r.review_date) >= thirtyDaysAgo
  );
  const lastMonthReviews = reviews.filter(
    (r) =>
      new Date(r.review_date) >= sixtyDaysAgo &&
      new Date(r.review_date) < thirtyDaysAgo
  );

  const currentVelocity = thisMonthReviews.length;
  const previousVelocity = lastMonthReviews.length;
  const velocityDirection =
    currentVelocity > previousVelocity
      ? "up"
      : currentVelocity < previousVelocity
        ? "down"
        : ("stable" as const);

  // Rating averages by period
  const ratingsForPeriod = (startDate: Date, endDate?: Date) => {
    const filtered = reviews.filter((r) => {
      const d = new Date(r.review_date);
      return d >= startDate && (endDate ? d < endDate : true) && r.rating != null;
    });
    if (filtered.length === 0) return 0;
    return (
      Math.round(
        (filtered.reduce((sum, r) => sum + r.rating!, 0) / filtered.length) * 10
      ) / 10
    );
  };

  const allRatings = reviews.filter((r) => r.rating != null);
  const currentRating =
    allRatings.length > 0
      ? Math.round(
          (allRatings.reduce((sum, r) => sum + r.rating!, 0) / allRatings.length) *
            10
        ) / 10
      : 0;

  // Response rate
  const respondedCount = thisMonthReviews.filter(
    (r) => r.response_text != null
  ).length;
  const loResponseRate =
    thisMonthReviews.length > 0
      ? Math.round((respondedCount / thisMonthReviews.length) * 100)
      : 0;

  const orgResponded = orgReviews.filter((r) => r.response_text != null).length;
  const orgResponseRate =
    orgReviews.length > 0
      ? Math.round((orgResponded / orgReviews.length) * 100)
      : 0;

  // Average response time (hours)
  const responseTimes = reviews
    .filter((r) => r.response_at && r.review_date)
    .map((r) => {
      const diff =
        new Date(r.response_at!).getTime() - new Date(r.review_date).getTime();
      return diff / (1000 * 60 * 60); // hours
    })
    .filter((h) => h > 0 && h < 720); // filter outliers > 30 days

  const avgResponseTime =
    responseTimes.length > 0
      ? Math.round(
          responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        )
      : 0;

  // Sentiment trajectory
  const recentSentiments = thisMonthReviews
    .filter((r) => r.sentiment_score != null)
    .map((r) => r.sentiment_score!);
  const olderSentiments = lastMonthReviews
    .filter((r) => r.sentiment_score != null)
    .map((r) => r.sentiment_score!);

  const recentAvgSentiment =
    recentSentiments.length > 0
      ? recentSentiments.reduce((a, b) => a + b, 0) / recentSentiments.length
      : 0;
  const olderAvgSentiment =
    olderSentiments.length > 0
      ? olderSentiments.reduce((a, b) => a + b, 0) / olderSentiments.length
      : 0;

  const sentimentTrajectory =
    recentAvgSentiment > olderAvgSentiment + 0.05
      ? "improving"
      : recentAvgSentiment < olderAvgSentiment - 0.05
        ? "declining"
        : ("stable" as const);

  // Survey completion rate
  const completedSurveys = surveys.filter(
    (s) => s.status === "completed"
  ).length;
  const sentSurveys = surveys.filter((s) =>
    ["sent", "opened", "completed", "expired"].includes(s.status || "")
  ).length;
  const surveyCompletionRate =
    sentSurveys > 0 ? Math.round((completedSurveys / sentSurveys) * 100) : 0;

  // Request-to-review conversion (aligned 30-day window)
  const surveysLast30d = surveys.filter(
    (s) =>
      s.status !== "draft" &&
      new Date(s.created_at!) >= thirtyDaysAgo
  ).length;
  const conversionRate =
    surveysLast30d > 0
      ? Math.round((thisMonthReviews.length / surveysLast30d) * 100)
      : 0;

  // Top themes
  const positiveThemes = new Map<string, number>();
  const negativeThemes = new Map<string, number>();
  for (const review of reviews) {
    const themes = (review.themes as string[]) || [];
    for (const theme of themes) {
      if (review.sentiment_label === "positive") {
        positiveThemes.set(theme, (positiveThemes.get(theme) || 0) + 1);
      } else if (review.sentiment_label === "negative") {
        negativeThemes.set(theme, (negativeThemes.get(theme) || 0) + 1);
      }
    }
  }

  const topPositive = Array.from(positiveThemes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);
  const riskThemes = Array.from(negativeThemes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);

  // NPS trend (already org+LO filtered at DB level)
  const loNps = npsResult.data || [];

  const calculateNPS = (scores: number[]) => {
    if (scores.length === 0) return 0;
    const promoters = scores.filter((s) => s >= 9).length;
    const detractors = scores.filter((s) => s <= 6).length;
    return Math.round(((promoters - detractors) / scores.length) * 100);
  };

  const recentNpsScores = loNps
    .filter((r) => new Date(r.submitted_at!) >= thirtyDaysAgo)
    .map((r) => r.nps_score!);
  const olderNpsScores = loNps
    .filter(
      (r) =>
        new Date(r.submitted_at!) >= sixtyDaysAgo &&
        new Date(r.submitted_at!) < thirtyDaysAgo
    )
    .map((r) => r.nps_score!);

  const currentNPS = calculateNPS(recentNpsScores);
  const previousNPS = calculateNPS(olderNpsScores);

  // Check for cached coaching brief
  const cachedBrief = cachedBriefResult.data?.[0];
  let coachingBrief: string | undefined;
  if (cachedBrief?.metrics) {
    const metrics = cachedBrief.metrics as Record<string, unknown>;
    if (
      metrics.coachingBrief &&
      cachedBrief.computed_at &&
      new Date(cachedBrief.computed_at).getTime() > now.getTime() - 24 * 60 * 60 * 1000
    ) {
      coachingBrief = metrics.coachingBrief as string;
    }
  }

  return {
    success: true,
    data: {
      loanOfficerId,
      loanOfficerName: loName,
      reviewVelocity: {
        current: currentVelocity,
        previous: previousVelocity,
        direction: velocityDirection,
      },
      avgRating: {
        current: currentRating,
        days30: ratingsForPeriod(thirtyDaysAgo),
        days60: ratingsForPeriod(sixtyDaysAgo, thirtyDaysAgo),
        days90: ratingsForPeriod(ninetyDaysAgo, sixtyDaysAgo),
      },
      responseRate: { rate: loResponseRate, orgAverage: orgResponseRate },
      avgResponseTimeHours: avgResponseTime,
      sentimentTrajectory,
      surveyCompletionRate,
      requestToReviewConversion: conversionRate,
      topPositiveThemes: topPositive,
      riskThemes,
      npsTrend: {
        current: currentNPS,
        previous: previousNPS,
        direction:
          currentNPS > previousNPS
            ? "up"
            : currentNPS < previousNPS
              ? "down"
              : "stable",
      },
      coachingBrief,
      generatedAt: now,
    },
  };
}

// ============================================================================
// Manager Activity Monitor
// ============================================================================

/**
 * Get team activity monitor data (managers/admins only)
 */
export async function getTeamActivityMonitor(): Promise<
  ActionResult<TeamActivityMonitor>
> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  // Only enterprise managers and admins can view team activity
  if (
    context.accountType !== "enterprise" ||
    (context.role !== "admin" && context.role !== "manager")
  ) {
    return { success: false, error: "Forbidden" };
  }

  const supabase = createAdminClient();
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

  // Get all LOs in the org
  const { data: loUsers } = await supabase
    .from("users")
    .select("id, full_name")
    .eq("organization_id", context.organizationId)
    .eq("is_active", true);

  if (!loUsers || loUsers.length === 0) {
    return {
      success: true,
      data: {
        teamMembers: [],
        orgMetrics: {
          avgResponseTimeHours: 0,
          avgRequestsPerWeek: 0,
          activeCount: 0,
          slowingCount: 0,
          inactiveCount: 0,
        },
      },
    };
  }

  // Fetch all org data in parallel
  const [reviewsResult, surveysThisWeekResult, surveysPrevWeekResult] =
    await Promise.all([
      supabase
        .from("reviews")
        .select(
          "id, user_id, rating, review_date, response_text, response_at, sentiment_label"
        )
        .eq("organization_id", context.organizationId)
        .gte("review_date", sixtyDaysAgo.toISOString()),

      supabase
        .from("surveys")
        .select("id, user_id")
        .eq("organization_id", context.organizationId)
        .gte("sent_at", sevenDaysAgo.toISOString()),

      supabase
        .from("surveys")
        .select("id, user_id")
        .eq("organization_id", context.organizationId)
        .gte("sent_at", fourteenDaysAgo.toISOString())
        .lt("sent_at", sevenDaysAgo.toISOString()),
    ]);

  const allReviews = reviewsResult.data || [];
  const surveysThisWeek = surveysThisWeekResult.data || [];
  const surveysPrevWeek = surveysPrevWeekResult.data || [];

  // Compute org averages
  const orgSurveysPerWeek = surveysThisWeek.length;
  const orgResponseTimes: number[] = [];
  for (const r of allReviews) {
    if (r.response_at && r.review_date) {
      const diff =
        (new Date(r.response_at).getTime() -
          new Date(r.review_date).getTime()) /
        (1000 * 60 * 60);
      if (diff > 0 && diff < 720) orgResponseTimes.push(diff);
    }
  }
  const orgAvgResponseTime =
    orgResponseTimes.length > 0
      ? Math.round(
          orgResponseTimes.reduce((a, b) => a + b, 0) /
            orgResponseTimes.length
        )
      : 0;

  const avgRequestsPerLO =
    loUsers.length > 0
      ? Math.round(orgSurveysPerWeek / loUsers.length)
      : 0;

  // Build per-LO activity status
  const teamMembers: LOActivityStatus[] = [];

  for (const lo of loUsers) {
    const loReviews = allReviews.filter((r) => r.user_id === lo.id);
    const loSurveysThisWeek = surveysThisWeek.filter(
      (s) => s.user_id === lo.id
    ).length;
    const loSurveysPrevWeek = surveysPrevWeek.filter(
      (s) => s.user_id === lo.id
    ).length;

    // Unresponded reviews > 48h
    const unresponded = loReviews.filter(
      (r) =>
        !r.response_text && new Date(r.review_date) < twoDaysAgo
    ).length;

    // Response times
    const loResponseTimes: number[] = [];
    const recentResponseTimes: number[] = [];
    const olderResponseTimes: number[] = [];

    for (const r of loReviews) {
      if (r.response_at && r.review_date) {
        const diff =
          (new Date(r.response_at).getTime() -
            new Date(r.review_date).getTime()) /
          (1000 * 60 * 60);
        if (diff > 0 && diff < 720) {
          loResponseTimes.push(diff);
          if (new Date(r.review_date) >= thirtyDaysAgo) {
            recentResponseTimes.push(diff);
          } else {
            olderResponseTimes.push(diff);
          }
        }
      }
    }

    const avgResponseTime =
      loResponseTimes.length > 0
        ? Math.round(
            loResponseTimes.reduce((a, b) => a + b, 0) /
              loResponseTimes.length
          )
        : 0;

    const recentAvgRT =
      recentResponseTimes.length > 0
        ? recentResponseTimes.reduce((a, b) => a + b, 0) /
          recentResponseTimes.length
        : 0;
    const olderAvgRT =
      olderResponseTimes.length > 0
        ? olderResponseTimes.reduce((a, b) => a + b, 0) /
          olderResponseTimes.length
        : 0;

    const responseTimeTrend =
      olderAvgRT > 0 && recentAvgRT > olderAvgRT * 1.2
        ? "worsening"
        : olderAvgRT > 0 && recentAvgRT < olderAvgRT * 0.8
          ? "improving"
          : ("stable" as const);

    // Negative reviews last 7 days
    const negativeRecent = loReviews.filter(
      (r) =>
        r.sentiment_label === "negative" &&
        new Date(r.review_date) >= sevenDaysAgo
    ).length;

    // Rating trend (30 vs 60 day)
    const reviews30 = loReviews.filter(
      (r) => new Date(r.review_date) >= thirtyDaysAgo && r.rating != null
    );
    const reviews60 = loReviews.filter(
      (r) =>
        new Date(r.review_date) >= sixtyDaysAgo &&
        new Date(r.review_date) < thirtyDaysAgo &&
        r.rating != null
    );

    const avg30 =
      reviews30.length > 0
        ? Math.round(
            (reviews30.reduce((s, r) => s + r.rating!, 0) / reviews30.length) *
              10
          ) / 10
        : 0;
    const avg60 =
      reviews60.length > 0
        ? Math.round(
            (reviews60.reduce((s, r) => s + r.rating!, 0) / reviews60.length) *
              10
          ) / 10
        : 0;

    // Determine activity status
    const recentActivity =
      loReviews.filter((r) => new Date(r.review_date) >= sevenDaysAgo).length +
      loSurveysThisWeek;
    const prevActivity =
      loReviews.filter(
        (r) =>
          new Date(r.review_date) >= fourteenDaysAgo &&
          new Date(r.review_date) < sevenDaysAgo
      ).length + loSurveysPrevWeek;

    let activityStatus: "active" | "slowing" | "inactive" = "active";
    if (recentActivity === 0 && prevActivity === 0) {
      activityStatus = "inactive";
    } else if (
      prevActivity > 0 &&
      recentActivity < prevActivity * 0.6
    ) {
      activityStatus = "slowing";
    }

    // Generate alerts
    const alerts: ActivityAlert[] = [];
    if (unresponded >= 2) {
      alerts.push({
        type: "unresponded_reviews",
        message: `${unresponded} reviews waiting 48+ hours for response`,
        severity: unresponded >= 5 ? "critical" : "warning",
      });
    }
    if (avgRequestsPerLO > 0 && loSurveysThisWeek < avgRequestsPerLO * 0.5) {
      alerts.push({
        type: "low_request_rate",
        message: `Sent ${loSurveysThisWeek} requests vs org avg of ${avgRequestsPerLO}`,
        severity: "warning",
      });
    }
    if (responseTimeTrend === "worsening") {
      alerts.push({
        type: "response_time_increase",
        message: "Response time trending up vs previous period",
        severity: "warning",
      });
    }
    if (negativeRecent >= 3) {
      alerts.push({
        type: "negative_spike",
        message: `${negativeRecent} negative reviews in the past 7 days`,
        severity: "critical",
      });
    }
    if (avg60 > 0 && avg30 < avg60 - 0.3) {
      alerts.push({
        type: "rating_decline",
        message: `Rating dropped from ${avg60} to ${avg30} (30-day avg)`,
        severity: "warning",
      });
    }

    teamMembers.push({
      userId: lo.id,
      userName: lo.full_name || "Unknown",
      activityStatus,
      unrespondedReviewCount: unresponded,
      reviewRequestsThisWeek: loSurveysThisWeek,
      orgAvgRequestsPerWeek: avgRequestsPerLO,
      avgResponseTimeHours: avgResponseTime,
      responseTimeTrend,
      negativeReviewsLast7Days: negativeRecent,
      ratingTrend: { avg30Day: avg30, avg60Day: avg60 },
      alerts,
    });
  }

  // Sort: critical alerts first, then slowing, then inactive, then active
  teamMembers.sort((a, b) => {
    const aHasCritical = a.alerts.some((al) => al.severity === "critical");
    const bHasCritical = b.alerts.some((al) => al.severity === "critical");
    if (aHasCritical !== bHasCritical) return aHasCritical ? -1 : 1;

    const statusOrder = { inactive: 0, slowing: 1, active: 2 };
    return statusOrder[a.activityStatus] - statusOrder[b.activityStatus];
  });

  return {
    success: true,
    data: {
      teamMembers,
      orgMetrics: {
        avgResponseTimeHours: orgAvgResponseTime,
        avgRequestsPerWeek: avgRequestsPerLO,
        activeCount: teamMembers.filter((m) => m.activityStatus === "active")
          .length,
        slowingCount: teamMembers.filter(
          (m) => m.activityStatus === "slowing"
        ).length,
        inactiveCount: teamMembers.filter(
          (m) => m.activityStatus === "inactive"
        ).length,
      },
    },
  };
}

// ============================================================================
// Channel Effectiveness
// ============================================================================

/**
 * Get review effectiveness metrics grouped by source channel
 */
export async function getChannelEffectiveness(
  loanOfficerId?: string
): Promise<ActionResult<ChannelMetrics[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const startDate = new Date();
  subtractMonths(startDate, 6);

  let query = supabase
    .from("reviews")
    .select("source, rating, sentiment_label")
    .eq("organization_id", context.organizationId)
    .gte("review_date", startDate.toISOString());

  if (loanOfficerId) {
    query = query.eq("user_id", loanOfficerId);
  }

  const { data: reviews, error } = await query;

  if (error) {
    console.error("Error fetching channel data:", error);
    return { success: false, error: "Failed to fetch channel data" };
  }

  // Group by source channel
  const channelMap = new Map<
    string,
    {
      ratings: number[];
      positive: number;
      neutral: number;
      negative: number;
    }
  >();

  for (const review of reviews || []) {
    const source = review.source || "unknown";
    if (!channelMap.has(source)) {
      channelMap.set(source, {
        ratings: [],
        positive: 0,
        neutral: 0,
        negative: 0,
      });
    }
    const entry = channelMap.get(source)!;
    if (review.rating != null) entry.ratings.push(review.rating);
    const sentiment = (review.sentiment_label as SentimentLabel) || "neutral";
    entry[sentiment]++;
  }

  const channels: ChannelMetrics[] = Array.from(channelMap.entries())
    .map(([channel, data]) => ({
      channel,
      reviewCount: data.positive + data.neutral + data.negative,
      avgRating:
        data.ratings.length > 0
          ? Math.round(
              (data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length) *
                10
            ) / 10
          : 0,
      sentimentDistribution: {
        positive: data.positive,
        neutral: data.neutral,
        negative: data.negative,
      },
    }))
    .sort((a, b) => b.reviewCount - a.reviewCount);

  return { success: true, data: channels };
}
