"use client";

import { useEffect, useState, useTransition } from "react";
import {
  GeoStatsCards,
  VisibilityScoreCard,
  PlatformBreakdown,
  OptimizationSuggestions,
  FAQGenerator,
  SchemaRecommendations,
  RecentMentions,
} from "@/components/geo";
import {
  getGEODashboardSummary,
  calculateVisibilityScore,
  generateAIOptimizedFAQs,
  generateSchemaRecommendations,
} from "@/lib/geo";
import type {
  GEODashboardSummary,
  AIVisibilityScore,
  OptimizationSuggestion,
  AIOptimizedFAQ,
  SchemaRecommendation,
} from "@/lib/geo/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Lightbulb, Code2, HelpCircle, RefreshCw } from "lucide-react";

export function GeoDashboard() {
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState<GEODashboardSummary | null>(null);
  const [visibilityScore, setVisibilityScore] = useState<AIVisibilityScore | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [faqs, setFaqs] = useState<AIOptimizedFAQ[]>([]);
  const [schemaRecs, setSchemaRecs] = useState<SchemaRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  // Load dashboard data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const summaryResult = await getGEODashboardSummary();
        if (summaryResult.success && summaryResult.data) {
          setSummary(summaryResult.data);

          // Set suggestions from summary
          setSuggestions(summaryResult.data.topRecommendations);
        }
      } catch (error) {
        console.error('Error loading GEO dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Calculate visibility score for a specific entity
  const _handleCalculateScore = async (entityId: string) => {
    setSelectedEntityId(entityId);
    startTransition(async () => {
      const result = await calculateVisibilityScore('loan_officer', entityId);
      if (result.success && result.data) {
        setVisibilityScore(result.data);
      }
    });
  };

  // Generate FAQs
  const handleGenerateFAQs = async () => {
    if (!selectedEntityId) return;
    startTransition(async () => {
      const result = await generateAIOptimizedFAQs('loan_officer', selectedEntityId);
      if (result.success && result.data) {
        setFaqs(result.data);
      }
    });
  };

  // Generate schema recommendations
  const _handleGenerateSchema = async () => {
    if (!selectedEntityId) return;
    startTransition(async () => {
      const result = await generateSchemaRecommendations('loan_officer', selectedEntityId);
      if (result.success && result.data) {
        setSchemaRecs(result.data);
      }
    });
  };

  // Refresh all data
  const handleRefresh = () => {
    startTransition(async () => {
      setIsLoading(true);
      try {
        const summaryResult = await getGEODashboardSummary();
        if (summaryResult.success && summaryResult.data) {
          setSummary(summaryResult.data);
          setSuggestions(summaryResult.data.topRecommendations);
        }
      } finally {
        setIsLoading(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <GeoStatsCards summary={summary} isLoading={isLoading} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <Eye className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="optimize" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Optimize
            </TabsTrigger>
            <TabsTrigger value="faqs" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              FAQs
            </TabsTrigger>
            <TabsTrigger value="schema" className="gap-2">
              <Code2 className="h-4 w-4" />
              Schema
            </TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending || isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Visibility Score Card */}
            <VisibilityScoreCard
              score={visibilityScore || (summary ? {
                id: 'summary',
                entityType: 'organization',
                entityId: 'org',
                organizationId: 'org',
                overallScore: summary.overallScore,
                previousScore: null,
                scoreChange: summary.scoreChange,
                breakdown: {
                  contentCompleteness: 70,
                  structuredData: summary.schemaCompliance,
                  entityClarity: 65,
                  citationPotential: 60,
                  topicalAuthority: 55,
                  freshness: 75,
                },
                platformScores: summary.platformVisibility,
                calculatedAt: new Date().toISOString(),
                nextCalculationAt: null,
              } : null)}
              isLoading={isLoading}
            />

            {/* Platform Breakdown */}
            <PlatformBreakdown
              platformScores={summary?.platformVisibility || null}
              isLoading={isLoading}
            />
          </div>

          {/* Recent Mentions */}
          <RecentMentions
            mentions={summary?.recentMentions || []}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Optimize Tab */}
        <TabsContent value="optimize" className="space-y-6">
          <OptimizationSuggestions
            suggestions={suggestions}
            isLoading={isLoading}
            onImplement={(id) => console.log('Implement:', id)}
            onDismiss={(id) => console.log('Dismiss:', id)}
          />

          {/* Optimization Tips Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">GEO Best Practices</CardTitle>
              <CardDescription>
                Tips for improving your visibility in AI search engines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Complete Your Profile</h4>
                  <p className="text-sm text-muted-foreground">
                    Fill out all profile fields including bio, specialties, NMLS ID, and photo.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Gather Reviews</h4>
                  <p className="text-sm text-muted-foreground">
                    More reviews increase credibility and citation likelihood in AI responses.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Add FAQs</h4>
                  <p className="text-sm text-muted-foreground">
                    Clear Q&A content is highly citeable when AI answers user questions.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Implement Schema</h4>
                  <p className="text-sm text-muted-foreground">
                    Structured data helps AI understand and cite your content accurately.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Stay Current</h4>
                  <p className="text-sm text-muted-foreground">
                    Regular updates signal relevance and maintain freshness scores.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Be Specific</h4>
                  <p className="text-sm text-muted-foreground">
                    Detailed, specific content is more likely to be cited than generic text.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="space-y-6">
          <FAQGenerator
            faqs={faqs}
            isLoading={isPending}
            onGenerate={handleGenerateFAQs}
          />

          {/* FAQ Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">FAQ Optimization Guidelines</CardTitle>
              <CardDescription>
                Write FAQs that AI search engines love to cite
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium text-green-700">Do</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">+</span>
                      Use natural, conversational questions
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">+</span>
                      Answer the question in the first sentence
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">+</span>
                      Include specific numbers and details
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">+</span>
                      Keep answers between 50-150 words
                    </li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-red-700">Don&apos;t</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">-</span>
                      Use jargon or industry acronyms
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">-</span>
                      Write overly promotional content
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">-</span>
                      Leave questions vague or ambiguous
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">-</span>
                      Duplicate existing FAQs
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schema Tab */}
        <TabsContent value="schema" className="space-y-6">
          <SchemaRecommendations
            recommendations={schemaRecs}
            isLoading={isPending}
          />

          {/* Schema Types Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Schema Types for AI Visibility</CardTitle>
              <CardDescription>
                Structured data types that improve AI search performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Person</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Defines you as an identifiable entity with professional credentials.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">LocalBusiness</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enables local search visibility and geographic citations.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">FAQPage</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Marks FAQ content for rich snippets and AI citations.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">AggregateRating</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Displays star ratings in search results and AI responses.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Review</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Structures individual reviews for citation and display.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Organization</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Establishes your company as a recognized entity.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
