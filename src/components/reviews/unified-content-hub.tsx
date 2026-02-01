"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FilmStrip as Film,
  Chats as MessageSquare,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
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
import { ReviewQueue } from "@/components/reviews/review-queue";
import { VideoLibraryProvider, VideoTabContent } from "@/components/video-library";

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
}

type ContentTab = "reviews" | "videos";

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
}: UnifiedContentHubProps) {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") === "videos" ? "videos" : "reviews";
  const [activeTab, setActiveTab] = useState<ContentTab>(defaultTab);

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ContentTab)}
        className="space-y-4"
      >
        <TabsList variant="underline">
          <TabsTrigger value="reviews" variant="underline" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Text Reviews
            <Badge variant="secondary" className="ml-1.5 text-xs">
              {reviewStats.total}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="videos" variant="underline" className="gap-2">
            <Film className="h-4 w-4" />
            Video Testimonials
            <Badge variant="secondary" className="ml-1.5 text-xs">
              {videoStats.total}
            </Badge>
          </TabsTrigger>
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
      </Tabs>
    </div>
  );
}
