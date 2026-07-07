import dynamic from "next/dynamic";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Star } from "@phosphor-icons/react/dist/ssr";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getReviewStats,
  getUsersForFilter,
} from "@/lib/reviews/actions";
import {
  getAggregatedReviews,
  getReviewAggregationStats,
} from "@/lib/reviews/aggregation-actions";
import {
  getVideoTestimonialResponses,
  getUsersForVideoRequests,
  type VideoLibraryStats,
} from "@/lib/video-testimonials/actions";
import { getCurrentOrganization } from "@/lib/organization/actions";
import { TIER_FEATURES } from "@/lib/organization/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { getUnifiedRequests, getUnifiedRequestStats } from "@/lib/requests/unified-requests";
import { getContacts } from "@/lib/contacts/queries";
import { getReviewFlags, getReviewFlagStats } from "@/lib/reviews/flag-actions";
import { DisputeQueue } from "@/components/reviews/dispute-queue";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { getAccessContext } from "@/lib/access";
import { ShareStudioCards } from "@/components/dashboard/share-studio-cards";

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
  description: "View and manage all customer reviews, video testimonials, and requests",
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

  // Get user role and access context for permissions
  const [userRole, accessCtx] = await Promise.all([
    getUserRole(),
    getAccessContext(),
  ]);

  const canSendRequests = hasPermission(accessCtx, PERMISSIONS.SEND_SURVEY);
  const canManageDisputes = userRole === "admin" || userRole === "manager";

  // Fetch all data in parallel
  const [
    reviewsResult,
    reviewStatsResult,
    aggregatedStatsResult,
    reviewUsersResult,
    videosResult,
    videoUsersResult,
    orgResult,
    requestsResult,
    requestStatsResult,
    contactsResult,
    openFlagsResult,
    resolvedFlagsResult,
    flagStatsResult,
    accountTypeRow,
  ] = await Promise.all([
    getAggregatedReviews({ page: 1, limit: 20 }),
    getReviewStats(),
    getReviewAggregationStats(),
    getUsersForFilter(),
    getVideoTestimonialResponses({ page: 1, pageSize: 24 }),
    getUsersForVideoRequests(),
    getCurrentOrganization(),
    canSendRequests ? getUnifiedRequests({ page: 1, pageSize: 25 }) : null,
    canSendRequests ? getUnifiedRequestStats() : null,
    canSendRequests ? getContacts({ page: 1, pageSize: 25 }) : null,
    canManageDisputes ? getReviewFlags({ status: "pending" }) : null,
    canManageDisputes ? getReviewFlags({ status: "resolved" }) : null,
    canManageDisputes ? getReviewFlagStats() : null,
    canManageDisputes && accessCtx
      ? createAdminClient()
          .from("organizations")
          .select("account_type")
          .eq("id", accessCtx.organizationId)
          .single()
      : null,
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
  const reviewUsers = reviewUsersResult.success
    ? reviewUsersResult.data ?? []
    : [];
  const videoUsers = videoUsersResult.success
    ? videoUsersResult.data ?? []
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
  const subscriptionTier = orgResult.organization?.subscription_tier ?? "basic";
  const hasAiAccess = TIER_FEATURES[subscriptionTier]?.ai_insights ?? false;

  // Process disputes data (admins/managers only)
  const openFlags = openFlagsResult?.success ? openFlagsResult.data?.flags ?? [] : [];
  const resolvedFlags = resolvedFlagsResult?.success
    ? resolvedFlagsResult.data?.flags ?? []
    : [];
  const openDisputeCount = flagStatsResult?.success
    ? flagStatsResult.data?.open ?? 0
    : openFlags.length;
  const accountType =
    accountTypeRow?.data?.account_type === "enterprise" ? "enterprise" : "individual";

  // Process requests data
  const initialRequests = requestsResult?.requests ?? [];
  const initialRequestsTotal = requestsResult?.total ?? 0;
  const initialRequestStats = requestStatsResult ?? undefined;

  // Process contacts data (same acquisition permission as requests)
  const initialContacts = contactsResult?.contacts ?? [];
  const initialContactsTotal = contactsResult?.total ?? 0;

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
          <Star className="h-6 w-6 text-repwell-teal-300" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-heading">Reviews</h1>
          <p className="text-sm leading-snug text-repwell-teal-300">
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
          initialRequests={initialRequests}
          initialRequestsTotal={initialRequestsTotal}
          initialRequestStats={initialRequestStats}
          canSendRequests={canSendRequests}
          initialContacts={initialContacts}
          initialContactsTotal={initialContactsTotal}
          contactsEnabled={canSendRequests}
          shareStudioContent={
            accessCtx ? (
              <Suspense fallback={<Skeleton className="h-[200px]" />}>
                <ShareStudioCards organizationId={accessCtx.organizationId} />
              </Suspense>
            ) : undefined
          }
          openDisputeCount={openDisputeCount}
          disputesContent={
            canManageDisputes ? (
              <DisputeQueue
                initialOpenFlags={openFlags}
                initialResolvedFlags={resolvedFlags}
                accountType={accountType}
              />
            ) : undefined
          }
        />
      </Suspense>
    </div>
  );
}
