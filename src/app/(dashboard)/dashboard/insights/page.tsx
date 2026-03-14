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
  SentimentDistribution,
  ExportInsightsButton,
} from "@/components/insights";
import {
  getAIInsightsData,
  type AIInsightsData,
} from "@/lib/ai";
import { requireProTier } from "@/lib/access";

export const metadata = {
  title: "AI Insights | RepWell",
  description: "AI-powered insights and analytics for your reviews",
};

// ---- Synchronous section components that receive pre-fetched data ----

function SentimentDistributionSection({ data }: { data: AIInsightsData }) {
  return (
    <SentimentDistribution
      positive={data.sentimentDistribution.positive}
      neutral={data.sentimentDistribution.neutral}
      negative={data.sentimentDistribution.negative}
      total={data.sentimentDistribution.total}
    />
  );
}

function SentimentTrendSection({ data }: { data: AIInsightsData }) {
  return <SentimentTrendChart data={data.sentimentTrend} />;
}

function ThemeCloudSection({ data }: { data: AIInsightsData }) {
  return <ThemeCloud data={data.themeFrequencies} />;
}

function KeyPhrasesSection({ data }: { data: AIInsightsData }) {
  return <KeyPhrasesCard data={data.topKeyPhrases} />;
}

function AISummarySection({ data }: { data: AIInsightsData }) {
  return <AISummaryCard summary={data.summary} />;
}

function RecommendationsSection({ data }: { data: AIInsightsData }) {
  return <RecommendationsCard data={data.recommendations} />;
}

function ExportSection({ data }: { data: AIInsightsData }) {
  return <ExportInsightsButton data={data} />;
}

// ---- Top-level async wrapper that fetches once and renders sections ----

async function InsightsSections({ userId }: { userId?: string }) {
  const result = await getAIInsightsData(userId, 6);

  if (!result.success || !result.data) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load AI insights data.
      </div>
    );
  }

  const data = result.data;

  return (
    <>
      {/* Export button */}
      <div className="flex justify-end">
        <ExportSection data={data} />
      </div>

      {/* Summary and distribution row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AISummarySection data={data} />
        <SentimentDistributionSection data={data} />
      </div>

      {/* Sentiment trend chart */}
      <SentimentTrendSection data={data} />

      {/* Theme and key phrases row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ThemeCloudSection data={data} />
        <KeyPhrasesSection data={data} />
      </div>

      {/* Improvement recommendations */}
      <div id="recommendations">
        <RecommendationsSection data={data} />
      </div>
    </>
  );
}

export default async function AIInsightsPage() {
  // Check access - requires Pro tier (pro or enterprise subscription)
  const ctx = await requireProTier();
  // Regular users see their own data; managers/admins see org-wide data for insights
  const userId = ctx.role === "user" ? ctx.userId : undefined;

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
          <Sparkles className="h-6 w-6 text-repwell-teal-300" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-heading">AI Insights</h1>
          <p className="text-sm leading-snug text-repwell-teal-300">
            AI-powered analysis of your customer feedback and performance trends
          </p>
        </div>
      </div>

      {/* All sections that share getAIInsightsData — fetched once */}
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="flex justify-end">
              <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <CardSkeleton className="h-[350px]" />
              <CardSkeleton className="h-[350px]" />
            </div>
            <ChartSkeleton />
            <div className="grid gap-6 lg:grid-cols-2">
              <CardSkeleton className="h-[400px]" />
              <CardSkeleton className="h-[400px]" />
            </div>
            <CardSkeleton className="h-[400px]" />
          </div>
        }
      >
        <InsightsSections userId={userId} />
      </Suspense>
    </div>
  );
}
