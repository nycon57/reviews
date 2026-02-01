import { Suspense } from "react";
import {
  Sparkle as Sparkles,
} from "@phosphor-icons/react/dist/ssr";
import { ChartSkeleton, CardSkeleton } from "@/components/shared";
import {
  SentimentTrendChart,
  ThemeCloud,
  AISummaryCard,
  KeyPhrasesCard,
  RecommendationsCard,
  BenchmarksCard,
  SentimentDistribution,
  ExportInsightsButton,
} from "@/components/insights";
import { getAIInsightsData } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { requireProTier, type AccessContext } from "@/lib/access";

export const metadata = {
  title: "AI Insights | RepWell",
  description: "AI-powered insights and analytics for your reviews",
};

// Server component to fetch current user's ID for filtering
async function getCurrentUserId(ctx: AccessContext): Promise<string | undefined> {
  // If not a regular user, return undefined (get org-wide data)
  if (ctx.role !== "user") {
    return undefined;
  }

  const supabase = await createClient();
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("id", ctx.userId)
    .single();

  return userData?.id;
}

// Server component for sentiment distribution
async function SentimentDistributionSection({ userId }: { userId?: string }) {
  const result = await getAIInsightsData(userId, 6);

  if (!result.success || !result.data) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load sentiment distribution.
      </div>
    );
  }

  return (
    <SentimentDistribution
      positive={result.data.sentimentDistribution.positive}
      neutral={result.data.sentimentDistribution.neutral}
      negative={result.data.sentimentDistribution.negative}
      total={result.data.sentimentDistribution.total}
    />
  );
}

// Server component for sentiment trend
async function SentimentTrendSection({ userId }: { userId?: string }) {
  const result = await getAIInsightsData(userId, 6);

  if (!result.success || !result.data) {
    return null;
  }

  return <SentimentTrendChart data={result.data.sentimentTrend} />;
}

// Server component for theme cloud
async function ThemeCloudSection({ userId }: { userId?: string }) {
  const result = await getAIInsightsData(userId, 6);

  if (!result.success || !result.data) {
    return null;
  }

  return <ThemeCloud data={result.data.themeFrequencies} />;
}

// Server component for key phrases
async function KeyPhrasesSection({ userId }: { userId?: string }) {
  const result = await getAIInsightsData(userId, 6);

  if (!result.success || !result.data) {
    return null;
  }

  return <KeyPhrasesCard data={result.data.topKeyPhrases} />;
}

// Server component for AI summary
async function AISummarySection({ userId }: { userId?: string }) {
  const result = await getAIInsightsData(userId, 6);

  if (!result.success || !result.data) {
    return null;
  }

  return <AISummaryCard summary={result.data.summary} />;
}

// Server component for recommendations
async function RecommendationsSection({ userId }: { userId?: string }) {
  const result = await getAIInsightsData(userId, 6);

  if (!result.success || !result.data) {
    return null;
  }

  return <RecommendationsCard data={result.data.recommendations} />;
}

// Server component for benchmarks
async function BenchmarksSection({ userId }: { userId?: string }) {
  const result = await getAIInsightsData(userId, 6);

  if (!result.success || !result.data) {
    return null;
  }

  return <BenchmarksCard data={result.data.benchmarks} />;
}

// Server component for export button
async function ExportSection({ userId }: { userId?: string }) {
  const result = await getAIInsightsData(userId, 6);

  if (!result.success || !result.data) {
    return null;
  }

  return <ExportInsightsButton data={result.data} />;
}

export default async function AIInsightsPage() {
  // Check access - requires Pro tier (pro or enterprise subscription)
  const ctx = await requireProTier();
  const userId = await getCurrentUserId(ctx);

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
          </div>
          <p className="text-muted-foreground">
            AI-powered analysis of your customer feedback and performance trends
          </p>
        </div>
        <Suspense fallback={<div className="h-10 w-32 animate-pulse rounded-md bg-muted" />}>
          <ExportSection userId={userId} />
        </Suspense>
      </div>

      {/* Summary and distribution row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<CardSkeleton className="h-[350px]" />}>
          <AISummarySection userId={userId} />
        </Suspense>
        <Suspense fallback={<CardSkeleton className="h-[350px]" />}>
          <SentimentDistributionSection userId={userId} />
        </Suspense>
      </div>

      {/* Sentiment trend chart */}
      <Suspense fallback={<ChartSkeleton />}>
        <SentimentTrendSection userId={userId} />
      </Suspense>

      {/* Theme and key phrases row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<CardSkeleton className="h-[400px]" />}>
          <ThemeCloudSection userId={userId} />
        </Suspense>
        <Suspense fallback={<CardSkeleton className="h-[400px]" />}>
          <KeyPhrasesSection userId={userId} />
        </Suspense>
      </div>

      {/* Industry benchmarks */}
      <Suspense fallback={<CardSkeleton className="h-[500px]" />}>
        <BenchmarksSection userId={userId} />
      </Suspense>

      {/* Improvement recommendations */}
      <Suspense fallback={<CardSkeleton className="h-[400px]" />}>
        <RecommendationsSection userId={userId} />
      </Suspense>
    </div>
  );
}
