import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  PaperPlaneRight as Send,
} from "@phosphor-icons/react/dist/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { TableSkeleton } from "@/components/shared/skeletons";
import { UnifiedRequestsHub } from "@/components/requests/unified-requests-hub";
import {
  getVideoTestimonialRequests,
  getVideoTestimonialRequestStats,
  getLoanOfficersForVideoRequests,
} from "@/lib/video-testimonials/actions";
import { unifiedGetUser } from "@/lib/auth/actions";

export const metadata = {
  title: "Requests | RepWell",
  description: "Manage all customer outreach: video testimonial requests and survey distribution",
};

type UserRole = "admin" | "manager" | "user";

const VALID_ROLES: readonly UserRole[] = ["admin", "manager", "user"] as const;

function isValidRole(role: unknown): role is UserRole {
  return typeof role === "string" && VALID_ROLES.includes(role as UserRole);
}

async function checkAccess() {
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

  // Validate role is one of the allowed values, default to user if invalid
  const role: UserRole = isValidRole(userData.role) ? userData.role : "user";

  return { role };
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const { role } = await checkAccess();

  // Fetch video testimonial requests data
  const [requestsResult, statsResult, loanOfficersResult] = await Promise.all([
    getVideoTestimonialRequests({ page: 1, pageSize: 25 }),
    getVideoTestimonialRequestStats(),
    getLoanOfficersForVideoRequests(),
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
  const loanOfficers = loanOfficersResult.success
    ? loanOfficersResult.data ?? []
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
          loanOfficers={loanOfficers}
          userRole={role}
          initialTab={params?.tab}
        />
      </Suspense>
    </div>
  );
}
