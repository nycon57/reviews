"use server";

/**
 * AI Insights Server Actions
 * Fetch and process AI-generated insights data
 */

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/reviews/types";
import type {
  SentimentTrendPoint,
  ThemeFrequency,
  KeyPhraseData,
  AIInsightsData,
  ImprovementRecommendation,
  IndustryBenchmark,
  AIInsightsSummary,
} from "./insights-types";
import type { ReviewTheme, SentimentLabel } from "./types";
import { createChatCompletion, isAIEnabled } from "./client";
import { THEME_DESCRIPTIONS } from "./types";
import { randomUUID } from "crypto";

/**
 * Get user context for analytics operations - parallelized queries
 */
async function getUserContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Parallelize independent queries
  const [userDataResult, loanOfficerResult] = await Promise.all([
    supabase
      .from("users")
      .select("id, organization_id, role")
      .eq("id", user.id)
      .single(),
    supabase
      .from("loan_officers")
      .select("id, full_name")
      .eq("user_id", user.id)
      .single(),
  ]);

  const userData = userDataResult.data;
  if (!userData) {
    return null;
  }

  return {
    userId: userData.id,
    organizationId: userData.organization_id!,
    role: userData.role,
    loanOfficerId: loanOfficerResult.data?.id || null,
    loanOfficerName: loanOfficerResult.data?.full_name || null,
  };
}

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

  const supabase = await createClient();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  let query = supabase
    .from("reviews")
    .select("id, review_date, sentiment_score, sentiment_label")
    .eq("organization_id", context.organizationId)
    .gte("review_date", startDate.toISOString())
    .order("review_date", { ascending: true });

  if (loanOfficerId) {
    query = query.eq("loan_officer_id", loanOfficerId);
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
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

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
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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

  const supabase = await createClient();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  // Get current period data
  let query = supabase
    .from("reviews")
    .select("id, themes, sentiment_label, review_date")
    .eq("organization_id", context.organizationId)
    .gte("review_date", startDate.toISOString());

  if (loanOfficerId) {
    query = query.eq("loan_officer_id", loanOfficerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching theme data:", error);
    return { success: false, error: "Failed to fetch theme data" };
  }

  // Get previous period for trend comparison
  const prevStartDate = new Date(startDate);
  prevStartDate.setMonth(prevStartDate.getMonth() - months);

  let prevQuery = supabase
    .from("reviews")
    .select("themes")
    .eq("organization_id", context.organizationId)
    .gte("review_date", prevStartDate.toISOString())
    .lt("review_date", startDate.toISOString());

  if (loanOfficerId) {
    prevQuery = prevQuery.eq("loan_officer_id", loanOfficerId);
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

  const supabase = await createClient();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3); // Last 3 months

  const recentDate = new Date();
  recentDate.setMonth(recentDate.getMonth() - 1); // Last month for "recent"

  let query = supabase
    .from("reviews")
    .select("key_phrases, sentiment_label, review_date")
    .eq("organization_id", context.organizationId)
    .gte("review_date", startDate.toISOString());

  if (loanOfficerId) {
    query = query.eq("loan_officer_id", loanOfficerId);
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

  const supabase = await createClient();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  let query = supabase
    .from("reviews")
    .select("sentiment_label")
    .eq("organization_id", context.organizationId)
    .gte("review_date", startDate.toISOString());

  if (loanOfficerId) {
    query = query.eq("loan_officer_id", loanOfficerId);
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

  const supabase = await createClient();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
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
    query = query.eq("loan_officer_id", loanOfficerId);
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
    const normalized = phrase.toLowerCase();
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

      const response = await createChatCompletion(systemPrompt, userPrompt);
      const parsed = JSON.parse(response);

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

  const supabase = await createClient();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);

  // Get negative and neutral reviews for analysis
  let query = supabase
    .from("reviews")
    .select("text, sentiment_label, themes, rating")
    .eq("organization_id", context.organizationId)
    .gte("review_date", startDate.toISOString())
    .in("sentiment_label", ["negative", "neutral"]);

  if (loanOfficerId) {
    query = query.eq("loan_officer_id", loanOfficerId);
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

  const supabase = await createClient();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);

  // Fetch current metrics
  let query = supabase
    .from("reviews")
    .select("rating, sentiment_label")
    .eq("organization_id", context.organizationId)
    .gte("review_date", startDate.toISOString());

  if (loanOfficerId) {
    query = query.eq("loan_officer_id", loanOfficerId);
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

  // Get NPS from survey responses
  let npsQuery = supabase
    .from("survey_responses")
    .select(
      `
      nps_score,
      surveys!inner (
        loan_officer_id,
        organization_id
      )
    `
    )
    .not("nps_score", "is", null)
    .gte("submitted_at", startDate.toISOString());

  const { data: npsData } = await npsQuery;

  const filteredNps = (npsData || []).filter((r) => {
    const survey = r.surveys as unknown as {
      loan_officer_id: string;
      organization_id: string;
    };
    if (loanOfficerId) {
      return survey.loan_officer_id === loanOfficerId;
    }
    return survey.organization_id === context.organizationId;
  });

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
  startDate.setMonth(startDate.getMonth() - months);
  const endDate = new Date();

  // Fetch all insights data in parallel
  const [
    sentimentTrendResult,
    themeResult,
    keyPhrasesResult,
    distributionResult,
    summaryResult,
    recommendationsResult,
    benchmarksResult,
  ] = await Promise.all([
    getSentimentTrend(loanOfficerId, months),
    getThemeFrequencies(loanOfficerId, months),
    getTopKeyPhrases(loanOfficerId, 20),
    getSentimentDistribution(loanOfficerId, months),
    generateAISummary(loanOfficerId, 1),
    getImprovementRecommendations(loanOfficerId),
    getIndustryBenchmarks(loanOfficerId),
  ]);

  return {
    success: true,
    data: {
      sentimentTrend: sentimentTrendResult.data || [],
      themeFrequencies: themeResult.data || [],
      topKeyPhrases: keyPhrasesResult.data || [],
      summary: summaryResult.data || null,
      recommendations: recommendationsResult.data || [],
      benchmarks: benchmarksResult.data || [],
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
