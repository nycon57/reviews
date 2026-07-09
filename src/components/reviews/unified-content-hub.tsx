"use client";

import {
  FilmStrip as Film,
  Chats as MessageSquare,
  Flag,
  PaperPlaneRight,
  ShareNetwork,
  AddressBook,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { UrlSyncedTabs } from "@/components/shared/url-synced-tabs";
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
import { ContactsTab } from "@/components/contacts";
import type { ContactListItem } from "@/lib/contacts/queries";

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
  // Contacts tab (optional — shown alongside Requests)
  initialContacts?: ContactListItem[];
  initialContactsTotal?: number;
  contactsEnabled?: boolean;
  // Share Studio tab (optional — hidden when not provided)
  shareStudioContent?: React.ReactNode;
  // Disputes tab (optional — admins/managers only)
  disputesContent?: React.ReactNode;
  openDisputeCount?: number;
}

type ContentTab =
  | "reviews"
  | "videos"
  | "requests"
  | "contacts"
  | "share-studio"
  | "disputes";

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
  initialContacts,
  initialContactsTotal = 0,
  contactsEnabled,
  shareStudioContent,
  disputesContent,
  openDisputeCount = 0,
}: UnifiedContentHubProps) {
  const showRequestsTab = canSendRequests && initialRequestStats;
  const showContactsTab = contactsEnabled && initialContacts;

  const tabs: Array<{ value: ContentTab; label: string; icon: typeof MessageSquare; count: number }> = [
    { value: "reviews", label: "Text Reviews", icon: MessageSquare, count: reviewStats.total },
    { value: "videos", label: "Video Reviews", icon: Film, count: videoStats.total },
    ...(showRequestsTab
      ? [{ value: "requests" as const, label: "Requests", icon: PaperPlaneRight, count: initialRequestStats.total }]
      : []),
    ...(showContactsTab
      ? [{ value: "contacts" as const, label: "Contacts", icon: AddressBook, count: initialContactsTotal }]
      : []),
    ...(shareStudioContent
      ? [{ value: "share-studio" as const, label: "Share Studio", icon: ShareNetwork, count: 0 }]
      : []),
    ...(disputesContent
      ? [{ value: "disputes" as const, label: "Disputes", icon: Flag, count: openDisputeCount }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <UrlSyncedTabs
        basePath="/dashboard/reviews"
        defaultTab="reviews"
        className="space-y-4"
        tabs={tabs.map((tab) => {
          const Icon = tab.icon;
          return {
            value: tab.value,
            label: tab.label,
            icon: <Icon className="h-4 w-4" />,
            badge:
              tab.count > 0 ? (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {tab.count}
                </Badge>
              ) : null,
          };
        })}
      >
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

        {showContactsTab && (
          <TabsContent value="contacts" className="mt-6">
            <ContactsTab
              initialContacts={initialContacts ?? []}
              initialTotal={initialContactsTotal}
              teamMembers={teamMembers}
              userRole={userRole}
            />
          </TabsContent>
        )}

        {shareStudioContent && (
          <TabsContent value="share-studio" className="mt-6">
            {shareStudioContent}
          </TabsContent>
        )}

        {disputesContent && (
          <TabsContent value="disputes" className="mt-6">
            {disputesContent}
          </TabsContent>
        )}
      </UrlSyncedTabs>
    </div>
  );
}
