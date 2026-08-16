import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { isAIEnabled } from "./client";
import { analyzeReviewSentiment, analyzeReviewSentimentFallback } from "./sentiment";
import {
  AI_CONFIG,
  type SentimentAnalysisResult,
  type BatchAnalysisResult,
  type AnalysisProgress,
} from "./types";

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Analyze a newly created review (for internal use, no auth required)
 * This is called after review creation in survey submissions and Google sync
 * Runs asynchronously and doesn't block the main flow
 */
export async function analyzeNewReview(
  reviewId: string,
  reviewText: string | null,
  rating: number
): Promise<void> {
  // Skip if no text to analyze
  if (!reviewText || reviewText.trim().length === 0) {
    return;
  }

  try {
    let analysis: SentimentAnalysisResult;

    if (isAIEnabled()) {
      analysis = await analyzeReviewSentiment(reviewText);
    } else {
      analysis = analyzeReviewSentimentFallback(reviewText, rating);
    }

    // Use admin client to update (this runs without user context)
    const adminClient = createAdminClient();

    await adminClient
      .from("reviews")
      .update({
        sentiment_score: analysis.sentimentScore,
        sentiment_label: analysis.sentimentLabel,
        key_phrases: analysis.keyPhrases,
        themes: analysis.themes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId);
  } catch (error) {
    // Log error but don't throw - sentiment analysis shouldn't block review creation
    console.error(`Failed to analyze review ${reviewId}:`, error);
  }
}

// Get auth context helper
async function getAuthContext() {
  const user = await unifiedGetUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  // Get user with organization
  const { data: dbUser, error: userError } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (userError || !dbUser?.organization_id) {
    return { error: "User not found or no organization" };
  }

  return {
    userId: dbUser.id,
    organizationId: dbUser.organization_id,
    role: dbUser.role,
    supabase,
  };
}

// Analyze a single review
export async function analyzeReview(
  reviewId: string
): Promise<ActionResult<SentimentAnalysisResult>> {
  const context = await getAuthContext();
  if ("error" in context) {
    return { success: false, error: context.error };
  }

  const { supabase, organizationId } = context;

  try {
    // Fetch the review
    const { data: review, error: fetchError } = await supabase
      .from("reviews")
      .select("id, text, rating, sentiment_score")
      .eq("id", reviewId)
      .eq("organization_id", organizationId)
      .single();

    if (fetchError || !review) {
      return { success: false, error: "Review not found" };
    }

    if (!review.text) {
      return { success: false, error: "Review has no text to analyze" };
    }

    // Check if already analyzed
    if (review.sentiment_score !== null) {
      return { success: false, error: "Review already analyzed" };
    }

    // Analyze sentiment
    let analysis: SentimentAnalysisResult;

    if (isAIEnabled()) {
      analysis = await analyzeReviewSentiment(review.text);
    } else {
      analysis = analyzeReviewSentimentFallback(review.text, review.rating);
    }

    // Update the review
    const { error: updateError } = await supabase
      .from("reviews")
      .update({
        sentiment_score: analysis.sentimentScore,
        sentiment_label: analysis.sentimentLabel,
        key_phrases: analysis.keyPhrases,
        themes: analysis.themes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .eq("organization_id", organizationId);

    if (updateError) {
      console.error("Failed to update review:", updateError);
      return { success: false, error: "Failed to save analysis results" };
    }

    return { success: true, data: analysis };
  } catch (error) {
    console.error("Review analysis failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Analysis failed",
    };
  }
}

// Analyze a single review by text (for new reviews before saving)
export async function analyzeReviewText(
  text: string,
  rating?: number
): Promise<ActionResult<SentimentAnalysisResult>> {
  const context = await getAuthContext();
  if ("error" in context) {
    return { success: false, error: context.error };
  }

  try {
    if (!text || text.trim().length === 0) {
      return { success: false, error: "No text provided" };
    }

    let analysis: SentimentAnalysisResult;

    if (isAIEnabled()) {
      analysis = await analyzeReviewSentiment(text);
    } else {
      analysis = analyzeReviewSentimentFallback(text, rating);
    }

    return { success: true, data: analysis };
  } catch (error) {
    console.error("Text analysis failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Analysis failed",
    };
  }
}

// Get reviews that need analysis
export async function getUnanalyzedReviews(
  limit: number = 100
): Promise<ActionResult<{ id: string; text: string; rating: number }[]>> {
  const context = await getAuthContext();
  if ("error" in context) {
    return { success: false, error: context.error };
  }

  const { supabase, organizationId } = context;

  try {
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("id, text, rating")
      .eq("organization_id", organizationId)
      .is("sentiment_score", null)
      .not("text", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to fetch unanalyzed reviews:", error);
      return { success: false, error: "Failed to fetch reviews" };
    }

    // Filter to ensure we only return reviews with non-null text
    const validReviews = (reviews || []).filter(
      (r): r is { id: string; text: string; rating: number } => r.text !== null
    );

    return { success: true, data: validReviews };
  } catch (error) {
    console.error("Failed to get unanalyzed reviews:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch reviews",
    };
  }
}

// Batch analyze reviews
export async function batchAnalyzeReviews(
  reviewIds: string[]
): Promise<ActionResult<BatchAnalysisResult[]>> {
  const context = await getAuthContext();
  if ("error" in context) {
    return { success: false, error: context.error };
  }

  const { supabase, organizationId } = context;

  if (!reviewIds || reviewIds.length === 0) {
    return { success: false, error: "No review IDs provided" };
  }

  // Limit batch size
  const idsToProcess = reviewIds.slice(0, AI_CONFIG.batchSize);
  const results: BatchAnalysisResult[] = [];

  try {
    // Fetch reviews
    const { data: reviews, error: fetchError } = await supabase
      .from("reviews")
      .select("id, text, rating")
      .eq("organization_id", organizationId)
      .in("id", idsToProcess);

    if (fetchError || !reviews) {
      return { success: false, error: "Failed to fetch reviews" };
    }

    // Process each review
    for (const review of reviews) {
      if (!review.text) {
        results.push({
          reviewId: review.id,
          analysis: null,
          error: "No text to analyze",
        });
        continue;
      }

      try {
        let analysis: SentimentAnalysisResult;

        if (isAIEnabled()) {
          analysis = await analyzeReviewSentiment(review.text);
        } else {
          analysis = analyzeReviewSentimentFallback(review.text, review.rating);
        }

        // Update the review
        const { error: updateError } = await supabase
          .from("reviews")
          .update({
            sentiment_score: analysis.sentimentScore,
            sentiment_label: analysis.sentimentLabel,
            key_phrases: analysis.keyPhrases,
            themes: analysis.themes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", review.id)
          .eq("organization_id", organizationId);

        if (updateError) {
          results.push({
            reviewId: review.id,
            analysis: null,
            error: "Failed to save analysis",
          });
        } else {
          results.push({
            reviewId: review.id,
            analysis,
          });
        }
      } catch (error) {
        results.push({
          reviewId: review.id,
          analysis: null,
          error: error instanceof Error ? error.message : "Analysis failed",
        });
      }

      // Small delay between API calls to avoid rate limiting
      if (isAIEnabled()) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return { success: true, data: results };
  } catch (error) {
    console.error("Batch analysis failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Batch analysis failed",
    };
  }
}

// Get analysis statistics
export async function getAnalysisStats(): Promise<
  ActionResult<{
    total: number;
    analyzed: number;
    unanalyzed: number;
    byLabel: Record<string, number>;
  }>
> {
  const context = await getAuthContext();
  if ("error" in context) {
    return { success: false, error: context.error };
  }

  const { supabase, organizationId } = context;

  try {
    // Get total count
    const { count: totalCount, error: totalError } = await supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .not("text", "is", null);

    if (totalError) {
      return { success: false, error: "Failed to fetch stats" };
    }

    // Get analyzed count
    const { count: analyzedCount, error: analyzedError } = await supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .not("sentiment_score", "is", null);

    if (analyzedError) {
      return { success: false, error: "Failed to fetch stats" };
    }

    // Get breakdown by label
    const { data: labelData, error: labelError } = await supabase
      .from("reviews")
      .select("sentiment_label")
      .eq("organization_id", organizationId)
      .not("sentiment_label", "is", null);

    if (labelError) {
      return { success: false, error: "Failed to fetch stats" };
    }

    const byLabel: Record<string, number> = {
      positive: 0,
      neutral: 0,
      negative: 0,
    };

    for (const row of labelData || []) {
      const label = row.sentiment_label as string;
      if (label in byLabel) {
        byLabel[label]++;
      }
    }

    return {
      success: true,
      data: {
        total: totalCount || 0,
        analyzed: analyzedCount || 0,
        unanalyzed: (totalCount || 0) - (analyzedCount || 0),
        byLabel,
      },
    };
  } catch (error) {
    console.error("Failed to get analysis stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch stats",
    };
  }
}

// Analyze all unanalyzed reviews (batch processing)
export async function analyzeAllUnanalyzedReviews(): Promise<ActionResult<AnalysisProgress>> {
  const context = await getAuthContext();
  if ("error" in context) {
    return { success: false, error: context.error };
  }

  const { supabase, organizationId } = context;

  try {
    // Get all unanalyzed reviews
    const { data: reviews, error: fetchError } = await supabase
      .from("reviews")
      .select("id, text, rating")
      .eq("organization_id", organizationId)
      .is("sentiment_score", null)
      .not("text", "is", null)
      .order("created_at", { ascending: false })
      .limit(100); // Process max 100 at a time

    if (fetchError) {
      return { success: false, error: "Failed to fetch reviews" };
    }

    if (!reviews || reviews.length === 0) {
      return {
        success: true,
        data: {
          total: 0,
          processed: 0,
          successful: 0,
          failed: 0,
          inProgress: false,
        },
      };
    }

    const progress: AnalysisProgress = {
      total: reviews.length,
      processed: 0,
      successful: 0,
      failed: 0,
      inProgress: true,
    };

    // Process in batches
    for (let i = 0; i < reviews.length; i += AI_CONFIG.batchSize) {
      const batch = reviews.slice(i, i + AI_CONFIG.batchSize);
      const batchResult = await batchAnalyzeReviews(batch.map((r) => r.id));

      if (batchResult.success && batchResult.data) {
        for (const result of batchResult.data) {
          progress.processed++;
          if (result.analysis) {
            progress.successful++;
          } else {
            progress.failed++;
          }
        }
      }
    }

    progress.inProgress = false;

    return { success: true, data: progress };
  } catch (error) {
    console.error("Bulk analysis failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Bulk analysis failed",
    };
  }
}

// Check if AI features are available
export async function checkAIStatus(): Promise<ActionResult<{ enabled: boolean; model: string }>> {
  return {
    success: true,
    data: {
      enabled: isAIEnabled(),
      model: AI_CONFIG.model,
    },
  };
}
