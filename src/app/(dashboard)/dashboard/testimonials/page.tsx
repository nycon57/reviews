import { Suspense } from "react";
import {
  Quotes as Quote,
} from "@phosphor-icons/react/dist/ssr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardSkeleton } from "@/components/shared";
import { TestimonialGenerator } from "@/components/testimonials/testimonial-generator";
import { TestimonialGallery } from "@/components/testimonials/testimonial-gallery";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { redirect } from "next/navigation";
import type { TestimonialStats, TestimonialFormat, TestimonialStatus } from "@/lib/ai/testimonial-types";
import type { SentimentLabel, ReviewTheme } from "@/lib/ai/types";

export const metadata = {
  title: "Testimonials | RepWell",
  description: "Generate and manage marketing-ready testimonials from your reviews",
};

// Get best review candidates for testimonial generation
async function getTestimonialCandidates() {
  const user = await unifiedGetUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = createAdminClient();

  // Get high-rated, approved reviews that don't have testimonials yet
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select(`
      id,
      text,
      rating,
      customer_name,
      source,
      review_date,
      sentiment_score,
      sentiment_label,
      themes,
      key_phrases,
      user_id
    `)
    .gte("rating", 4)
    .not("text", "is", null)
    .eq("status", "approved")
    .order("rating", { ascending: false })
    .order("sentiment_score", { ascending: false, nullsFirst: false })
    .limit(50);

  if (error) {
    console.error("Error fetching review candidates:", error);
    return [];
  }

  // Fetch user names for reviews
  const userIds = [...new Set((reviews || []).map((r) => r.user_id).filter((id): id is string => !!id))];
  const userMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", userIds);
    for (const u of users || []) {
      userMap.set(u.id, u.full_name || "Professional");
    }
  }

  // Check which reviews already have testimonials
  const reviewIds = reviews?.map((r) => r.id) || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingTestimonials } = await (supabase as any)
    .from("testimonials")
    .select("review_id")
    .in("review_id", reviewIds);

  const existingReviewIds = new Set(
    existingTestimonials?.map((t: { review_id: string }) => t.review_id) || []
  );

  // Filter and transform
  return (reviews || [])
    .filter((r) => !existingReviewIds.has(r.id))
    .map((r) => ({
      id: r.id,
      text: r.text,
      rating: r.rating,
      customerName: r.customer_name,
      loanOfficerName: r.user_id ? userMap.get(r.user_id) || "Professional" : "Professional",
      source: r.source,
      reviewDate: r.review_date,
      sentimentScore: r.sentiment_score,
      sentimentLabel: r.sentiment_label as SentimentLabel | null,
      themes: (r.themes || []) as ReviewTheme[],
      keyPhrases: r.key_phrases || [],
    }));
}

// Get existing testimonials
async function getTestimonials() {
  const user = await unifiedGetUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: testimonials, error, count } = await (supabase as any)
    .from("testimonials")
    .select(
      `
      *,
      review:reviews (
        id,
        rating,
        text,
        customer_name,
        source,
        review_date
      )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    console.error("Error fetching testimonials:", error);
    return { testimonials: [], total: 0 };
  }

  // Fetch user data for user_ids
  const userIds: string[] = [];
  for (const t of testimonials || []) {
    const testimonialUserId = (t as { user_id?: string }).user_id;
    if (testimonialUserId && !userIds.includes(testimonialUserId)) {
      userIds.push(testimonialUserId);
    }
  }
  const userMap = new Map<string, { id: string; full_name: string | null; photo_url: string | null }>();
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, photo_url")
      .in("id", userIds);
    for (const u of users || []) {
      userMap.set(u.id, u);
    }
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    testimonials: (testimonials || []).map((t: any) => {
      const user = t.user_id ? userMap.get(t.user_id) : null;
      return {
        id: t.id,
        organizationId: t.organization_id,
        reviewId: t.review_id,
        loanOfficerId: t.user_id,
        format: t.format as TestimonialFormat,
        content: t.content,
        originalQuote: t.original_quote,
        keyHighlights: t.key_highlights || [],
        aiGenerated: t.ai_generated ?? true,
        generationPrompt: t.generation_prompt,
        status: t.status as TestimonialStatus,
        approvedAt: t.approved_at,
        approvedBy: t.approved_by,
        rejectionReason: t.rejection_reason,
        publishedAt: t.published_at,
        publishedPlatforms: t.published_platforms || [],
        lastExportedAt: t.last_exported_at,
        exportCount: t.export_count || 0,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        review: t.review
          ? {
              id: t.review.id,
              rating: t.review.rating,
              text: t.review.text,
              customerName: t.review.customer_name,
              source: t.review.source,
              reviewDate: t.review.review_date,
            }
          : undefined,
        loanOfficer: user
          ? {
              id: user.id,
              fullName: user.full_name || "Professional",
              photoUrl: user.photo_url,
            }
          : undefined,
      };
    }),
    total: count || 0,
  };
}

// Get testimonial stats
async function getTestimonialStats(): Promise<TestimonialStats> {
  const user = await unifiedGetUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = createAdminClient();

  const { data } = await supabase
    .from("testimonials")
    .select("status, format, export_count");

  const stats: TestimonialStats = {
    total: data?.length || 0,
    byStatus: { draft: 0, approved: 0, rejected: 0, published: 0 },
    byFormat: { short: 0, medium: 0, long: 0, social: 0, headline: 0 },
    totalExports: 0,
    approvalRate: 0,
    averageGenerationTime: 0,
  };

  for (const t of data || []) {
    if (t.status in stats.byStatus) {
      stats.byStatus[t.status as keyof typeof stats.byStatus]++;
    }
    if (t.format in stats.byFormat) {
      stats.byFormat[t.format as keyof typeof stats.byFormat]++;
    }
    stats.totalExports += t.export_count || 0;
  }

  const approvedCount = stats.byStatus.approved + stats.byStatus.published;
  const reviewedCount = approvedCount + stats.byStatus.rejected;
  stats.approvalRate = reviewedCount > 0 ? approvedCount / reviewedCount : 0;

  return stats;
}

// Server component for candidates
async function CandidatesSection() {
  const candidates = await getTestimonialCandidates();
  return <TestimonialGenerator candidates={candidates} />;
}

// Server component for gallery
async function GallerySection() {
  const [{ testimonials, total }, stats] = await Promise.all([
    getTestimonials(),
    getTestimonialStats(),
  ]);

  return (
    <TestimonialGallery
      initialTestimonials={testimonials}
      initialTotal={total}
      initialStats={stats}
    />
  );
}

export default async function TestimonialsPage() {
  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Quote className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Testimonials</h1>
          </div>
          <p className="text-muted-foreground">
            Generate and manage marketing-ready testimonials from your best reviews
          </p>
        </div>
      </div>

      {/* Tabs for Generate vs Manage */}
      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="generate">Generate New</TabsTrigger>
          <TabsTrigger value="manage">Manage Testimonials</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <Suspense fallback={<CardSkeleton className="h-[600px]" />}>
            <CandidatesSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="manage">
          <Suspense fallback={<CardSkeleton className="h-[600px]" />}>
            <GallerySection />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
