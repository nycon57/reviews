"use client";

import { useSearchParams, useRouter } from "next/navigation";
import {
  VideoCamera as Video,
  Envelope as Mail,
} from "@phosphor-icons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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

  const tabs = [
    { value: "video", label: "Video Testimonials", icon: Video, badge: initialVideoTotal },
    { value: "surveys", label: "Survey Distribution", icon: Mail },
  ] as const;

  return (
    <div className="space-y-6">
      <Tabs
        defaultValue={defaultTab}
        onValueChange={handleTabChange}
        className="w-full"
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
                {"badge" in tab && tab.badge != null && tab.badge > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-xs">
                    {tab.badge}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="video" className="m-0">
            <VideoTestimonialRequestsDashboard
              initialRequests={initialVideoRequests}
              initialTotal={initialVideoTotal}
              initialStats={initialVideoStats}
              teamMembers={teamMembers}
              userRole={userRole}
            />
          </TabsContent>

          <TabsContent value="surveys" className="m-0">
            <DistributionDashboard />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
