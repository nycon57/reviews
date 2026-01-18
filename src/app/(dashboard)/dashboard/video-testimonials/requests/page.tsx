import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Video } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TableSkeleton } from "@/components/shared/skeletons";
import {
  getVideoTestimonialRequests,
  getLoanOfficersForVideoRequests,
} from "@/lib/video-testimonials/actions";
import { VideoTestimonialRequestsDashboard } from "./requests-dashboard";

export const metadata = {
  title: "Video Testimonial Requests | RepWell",
  description:
    "Manage video testimonial requests: create, track, and resend invitations",
};

async function checkAccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    redirect("/dashboard");
  }

  return { role: userData.role as "admin" | "manager" | "loan_officer" };
}

async function RequestsContent({ userRole }: { userRole: "admin" | "manager" | "loan_officer" }) {
  const [requestsResult, loanOfficersResult] = await Promise.all([
    getVideoTestimonialRequests({ page: 1, pageSize: 25 }),
    getLoanOfficersForVideoRequests(),
  ]);

  const initialRequests = requestsResult.success
    ? requestsResult.data?.requests ?? []
    : [];
  const initialTotal = requestsResult.success
    ? requestsResult.data?.total ?? 0
    : 0;
  const loanOfficers = loanOfficersResult.success
    ? loanOfficersResult.data ?? []
    : [];

  return (
    <VideoTestimonialRequestsDashboard
      initialRequests={initialRequests}
      initialTotal={initialTotal}
      loanOfficers={loanOfficers}
      userRole={userRole}
    />
  );
}

export default async function VideoTestimonialRequestsPage() {
  const { role } = await checkAccess();

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Video className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Video Testimonial Requests
          </h1>
          <p className="text-muted-foreground">
            Create, track, and manage video testimonial requests
          </p>
        </div>
      </div>

      {/* Dashboard content */}
      <Suspense fallback={<TableSkeleton rows={8} columns={6} />}>
        <RequestsContent userRole={role} />
      </Suspense>
    </div>
  );
}
