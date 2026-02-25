"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FilmStrip as Film,
  Chats as MessageSquare,
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
        <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 h-auto gap-0">
          {[
            { value: "reviews" as const, label: "Text Reviews", icon: MessageSquare, count: reviewStats.total },
            { value: "videos" as const, label: "Video Testimonials", icon: Film, count: videoStats.total },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "relative px-4 py-3 text-sm font-medium",
                  "text-muted-foreground hover:text-repwell-teal-400",
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
      </Tabs>
    </div>
  );
}
