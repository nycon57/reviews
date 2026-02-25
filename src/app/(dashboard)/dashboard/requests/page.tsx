import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  PaperPlaneRight as Send,
} from "@phosphor-icons/react/dist/ssr";
import { TableSkeleton } from "@/components/shared/skeletons";
import { UnifiedRequestsHub } from "@/components/requests/unified-requests-hub";
import {
  getVideoTestimonialRequests,
  getVideoTestimonialRequestStats,
  getUsersForVideoRequests,
} from "@/lib/video-testimonials/actions";
import { getAccessContext } from "@/lib/access";

export const metadata = {
  title: "Requests | RepWell",
  description: "Manage all customer outreach: video testimonial requests and survey distribution",
};

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");
  const role = ctx.role;

  // Fetch video testimonial requests data
  const [requestsResult, statsResult, usersResult] = await Promise.all([
    getVideoTestimonialRequests({ page: 1, pageSize: 25 }),
    getVideoTestimonialRequestStats(),
    getUsersForVideoRequests(),
  ]);

  const initialVideoRequests = requestsResult.success
    ? requestsResult.data?.requests ?? []
    : [];
  const initialVideoTotal = requestsResult.success
    ? requestsResult.data?.total ?? 0
    : 0;
  const initialVideoStats = statsResult.success && statsResult.data
    ? statsResult.data
    : { total: 0, pending: 0, sent: 0, completed: 0, expired: 0 };
  const users = usersResult.success
    ? usersResult.data ?? []
    : [];

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Send className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
          <p className="text-muted-foreground">
            Manage video testimonial requests and survey distribution
          </p>
        </div>
      </div>

      {/* Unified Requests Hub */}
      <Suspense fallback={<TableSkeleton rows={8} columns={6} />}>
        <UnifiedRequestsHub
          initialVideoRequests={initialVideoRequests}
          initialVideoTotal={initialVideoTotal}
          initialVideoStats={initialVideoStats}
          teamMembers={users}
          userRole={role}
          initialTab={params?.tab}
        />
      </Suspense>
    </div>
  );
}
