"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FilmStrip as Film,
  Chats as MessageSquare,
  PaperPlaneRight,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type {
  VideoTestimonialResponse,
  VideoLibraryStats,
} from "@/lib/video-testimonials/actions";
import type { AggregatedReview, ReviewAggregationStats } from "@/lib/reviews/types";
import type {
  UnifiedRequest,
  UnifiedRequestStats,
} from "@/lib/requests/unified-requests";
import { ReviewQueue } from "@/components/reviews/review-queue";
import { VideoLibraryProvider, VideoTabContent } from "@/components/video-library";
import { UnifiedRequestsTab } from "@/components/requests/unified-requests-tab";

// ============================================================================
// Types
// ============================================================================

interface ReviewStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

interface TeamMember {
  id: string;
  fullName: string;
  email?: string;
}

interface UnifiedContentHubProps {
  initialReviews: AggregatedReview[];
  initialReviewsTotal: number;
  reviewStats: ReviewStats;
  aggregatedStats?: ReviewAggregationStats;
  initialVideos: VideoTestimonialResponse[];
  initialVideosTotal: number;
  videoStats: VideoLibraryStats;
  teamMembers: TeamMember[];
  userRole: "admin" | "manager" | "user";
  hasAiAccess: boolean;
  initialReviewId?: string;
  // Requests tab (optional — hidden when not provided)
  initialRequests?: UnifiedRequest[];
  initialRequestsTotal?: number;
  initialRequestStats?: UnifiedRequestStats;
  canSendRequests?: boolean;
}

type ContentTab = "reviews" | "videos" | "requests";

// ============================================================================
// Main Unified Content Hub Component
// ============================================================================

export function UnifiedContentHub({
  initialReviews,
  initialReviewsTotal,
  reviewStats,
  aggregatedStats,
  initialVideos,
  initialVideosTotal,
  videoStats,
  teamMembers,
  userRole,
  hasAiAccess,
  initialReviewId,
  initialRequests,
  initialRequestsTotal,
  initialRequestStats,
  canSendRequests,
}: UnifiedContentHubProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab: ContentTab =
    tabParam === "videos"
      ? "videos"
      : tabParam === "requests" && canSendRequests
        ? "requests"
        : "reviews";
  const [activeTab, setActiveTab] = useState<ContentTab>(defaultTab);

  const showRequestsTab = canSendRequests && initialRequestStats;

  const tabs: Array<{ value: ContentTab; label: string; icon: typeof MessageSquare; count: number }> = [
    { value: "reviews", label: "Text Reviews", icon: MessageSquare, count: reviewStats.total },
    { value: "videos", label: "Video Reviews", icon: Film, count: videoStats.total },
    ...(showRequestsTab
      ? [{ value: "requests" as const, label: "Requests", icon: PaperPlaneRight, count: initialRequestStats.total }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ContentTab)}
        className="space-y-4"
      >
        <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 h-auto gap-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "relative px-4 py-3 text-sm font-medium",
                  "text-muted-foreground hover:text-repwell-teal-400 dark:hover:text-muted-foreground",
                  "data-[state=active]:text-repwell-teal-300",
                  "border-b-2 border-transparent",
                  "data-[state=active]:border-repwell-teal-300",
                  "rounded-none bg-transparent shadow-none",
                  "transition-colors duration-200",
                  "flex items-center gap-2 whitespace-nowrap"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {tab.count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="reviews" className="mt-6">
          <ReviewQueue
            initialReviews={initialReviews}
            initialTotal={initialReviewsTotal}
            teamMembers={teamMembers}
            initialStats={reviewStats}
            initialAggregatedStats={aggregatedStats}
            initialReviewId={initialReviewId}
            hasAiAccess={hasAiAccess}
          />
        </TabsContent>

        <TabsContent value="videos" className="mt-6">
          <VideoLibraryProvider
            initialVideos={initialVideos}
            initialTotal={initialVideosTotal}
            videoStats={videoStats}
            teamMembers={teamMembers}
            userRole={userRole}
          >
            <VideoTabContent />
          </VideoLibraryProvider>
        </TabsContent>

        {showRequestsTab && (
          <TabsContent value="requests" className="mt-6">
            <UnifiedRequestsTab
              initialRequests={initialRequests ?? []}
              initialTotal={initialRequestsTotal ?? 0}
              initialStats={initialRequestStats}
              teamMembers={teamMembers}
              userRole={userRole}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
