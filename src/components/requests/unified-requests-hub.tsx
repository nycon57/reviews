"use client";

import { useSearchParams, useRouter } from "next/navigation";
import {
  VideoCamera as Video,
  Envelope as Mail,
} from "@phosphor-icons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { VideoTestimonialRequestsDashboard, type RequestStats } from "./video-requests-dashboard";
import { DistributionDashboard } from "@/components/distribution";
import type { VideoTestimonialRequest } from "@/lib/video-testimonials/actions";

// ============================================================================
// Types
// ============================================================================

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
}

interface UnifiedRequestsHubProps {
  initialVideoRequests: VideoTestimonialRequest[];
  initialVideoTotal: number;
  initialVideoStats: RequestStats;
  teamMembers: TeamMember[];
  userRole: "admin" | "manager" | "user";
  initialTab?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function UnifiedRequestsHub({
  initialVideoRequests,
  initialVideoTotal,
  initialVideoStats,
  teamMembers,
  userRole,
  initialTab,
}: UnifiedRequestsHubProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultTab = initialTab || searchParams.get("tab") || "video";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`/dashboard/requests?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Tabbed Content */}
      <Tabs
        defaultValue={defaultTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList variant="underline">
          <TabsTrigger value="video" variant="underline" className="gap-2">
            <Video className="h-4 w-4" />
            Video Testimonials
            <Badge variant="secondary" className="ml-1.5 text-xs">
              {initialVideoTotal}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="surveys" variant="underline" className="gap-2">
            <Mail className="h-4 w-4" />
            Survey Distribution
          </TabsTrigger>
        </TabsList>

        <TabsContent value="video" className="mt-6">
          <VideoTestimonialRequestsDashboard
            initialRequests={initialVideoRequests}
            initialTotal={initialVideoTotal}
            initialStats={initialVideoStats}
            teamMembers={teamMembers}
            userRole={userRole}
          />
        </TabsContent>

        <TabsContent value="surveys" className="mt-6">
          <DistributionDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
