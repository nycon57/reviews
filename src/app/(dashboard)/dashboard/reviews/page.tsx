import dynamic from "next/dynamic";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getReviewStats,
  getLoanOfficersForFilter,
} from "@/lib/reviews/actions";
import {
  getAggregatedReviews,
  getReviewAggregationStats,
} from "@/lib/reviews/aggregation-actions";
import {
  getVideoTestimonialResponses,
  getLoanOfficersForVideoRequests,
  type VideoLibraryStats,
} from "@/lib/video-testimonials/actions";
import { getCurrentOrganization } from "@/lib/organization/actions";
import { TIER_FEATURES } from "@/lib/organization/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";

// Dynamic import for heavy UnifiedContentHub component
const UnifiedContentHub = dynamic(
  () => import("@/components/reviews/unified-content-hub").then((mod) => mod.UnifiedContentHub),
  {
    loading: () => (
      <div className="space-y-6">
        {/* Stats skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        {/* Tabs skeleton */}
        <Skeleton className="h-10 w-80" />
        {/* Filter skeleton */}
        <Skeleton className="h-12" />
        {/* Content skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    ),
  }
);

export const metadata = {
  title: "Reviews | RepWell",
  description: "View and manage all customer reviews and video testimonials",
};

const DEFAULT_VIDEO_STATS: VideoLibraryStats = {
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  published: 0,
  averageDuration: 0,
  totalDuration: 0,
};

const ALLOWED_ROLES = new Set(["admin", "manager", "user"] as const);
type UserRole = "admin" | "manager" | "user";

function isValidRole(role: unknown): role is UserRole {
  return typeof role === "string" && ALLOWED_ROLES.has(role as UserRole);
}

async function getUserRole(): Promise<UserRole> {
  const user = await unifiedGetUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = createAdminClient();

  const { data: userData } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    redirect("/dashboard");
  }

  if (!isValidRole(userData.role)) {
    throw new Error(`Invalid user role: ${userData.role}`);
  }

  return userData.role;
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const initialReviewId = params?.id;

  // Get user role for permissions
  const userRole = await getUserRole();

  // Fetch all data in parallel
  const [
    reviewsResult,
    reviewStatsResult,
    aggregatedStatsResult,
    reviewLoanOfficersResult,
    videosResult,
    videoLoanOfficersResult,
    orgResult,
  ] = await Promise.all([
    getAggregatedReviews({ page: 1, limit: 20 }),
    getReviewStats(),
    getReviewAggregationStats(),
    getLoanOfficersForFilter(),
    getVideoTestimonialResponses({ page: 1, pageSize: 24 }),
    getLoanOfficersForVideoRequests(),
    getCurrentOrganization(),
  ]);

  // Process text reviews data
  const initialReviews = reviewsResult.success ? reviewsResult.data?.reviews ?? [] : [];
  const initialReviewsTotal = reviewsResult.success ? reviewsResult.data?.total ?? 0 : 0;
  const reviewStats = reviewStatsResult.success
    ? reviewStatsResult.data ?? { pending: 0, approved: 0, rejected: 0, total: 0 }
    : { pending: 0, approved: 0, rejected: 0, total: 0 };
  const aggregatedStats = aggregatedStatsResult.success
    ? aggregatedStatsResult.data ?? undefined
    : undefined;

  // Process video testimonials data
  const initialVideos = videosResult.success
    ? videosResult.data?.responses ?? []
    : [];
  const initialVideosTotal = videosResult.success
    ? videosResult.data?.total ?? 0
    : 0;
  const videoStats = videosResult.success
    ? videosResult.data?.stats ?? DEFAULT_VIDEO_STATS
    : DEFAULT_VIDEO_STATS;

  // Merge users from both sources (dedupe by id)
  const reviewUsers = reviewLoanOfficersResult.success
    ? reviewLoanOfficersResult.data ?? []
    : [];
  const videoUsers = videoLoanOfficersResult.success
    ? videoLoanOfficersResult.data ?? []
    : [];

  const userMap = new Map<string, { id: string; fullName: string; email?: string }>();
  // Add review users (no email)
  reviewUsers.forEach((user) => {
    if (!userMap.has(user.id)) {
      userMap.set(user.id, {
        id: user.id,
        fullName: user.fullName,
      });
    }
  });
  // Add video users (with email) - override if exists
  videoUsers.forEach((user) => {
    userMap.set(user.id, {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
    });
  });
  const teamMembers = Array.from(userMap.values());

  // Determine AI access based on subscription tier
  const subscriptionTier = orgResult.organization?.subscription_tier ?? "free";
  const hasAiAccess = TIER_FEATURES[subscriptionTier]?.ai_insights ?? false;

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
          <p className="text-muted-foreground">
            Manage customer reviews and video testimonials
          </p>
        </div>
      </div>

      {/* Unified Content Hub */}
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-12" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        }
      >
        <UnifiedContentHub
          initialReviews={initialReviews}
          initialReviewsTotal={initialReviewsTotal}
          reviewStats={reviewStats}
          aggregatedStats={aggregatedStats}
          initialVideos={initialVideos}
          initialVideosTotal={initialVideosTotal}
          videoStats={videoStats}
          teamMembers={teamMembers}
          userRole={userRole}
          hasAiAccess={hasAiAccess}
          initialReviewId={initialReviewId}
        />
      </Suspense>
    </div>
  );
}
