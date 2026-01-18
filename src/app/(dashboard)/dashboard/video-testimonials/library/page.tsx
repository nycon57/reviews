import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Film } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TableSkeleton } from "@/components/shared/skeletons";
import {
  getVideoTestimonialResponses,
  getLoanOfficersForVideoRequests,
} from "@/lib/video-testimonials/actions";
import { VideoLibraryDashboard } from "./library-dashboard";

export const metadata = {
  title: "Video Library | RepWell",
  description:
    "View and manage submitted video testimonials with playback and transcription",
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

async function LibraryContent({
  userRole,
}: {
  userRole: "admin" | "manager" | "loan_officer";
}) {
  const [responsesResult, loanOfficersResult] = await Promise.all([
    getVideoTestimonialResponses({ page: 1, pageSize: 24 }),
    getLoanOfficersForVideoRequests(),
  ]);

  const initialResponses = responsesResult.success
    ? responsesResult.data?.responses ?? []
    : [];
  const initialTotal = responsesResult.success
    ? responsesResult.data?.total ?? 0
    : 0;
  const initialStats = responsesResult.success
    ? responsesResult.data?.stats ?? {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        published: 0,
        averageDuration: 0,
        totalDuration: 0,
      }
    : {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        published: 0,
        averageDuration: 0,
        totalDuration: 0,
      };
  const loanOfficers = loanOfficersResult.success
    ? loanOfficersResult.data ?? []
    : [];

  return (
    <VideoLibraryDashboard
      initialResponses={initialResponses}
      initialTotal={initialTotal}
      initialStats={initialStats}
      loanOfficers={loanOfficers}
      userRole={userRole}
    />
  );
}

export default async function VideoLibraryPage() {
  const { role } = await checkAccess();

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Film className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Video Library</h1>
          <p className="text-muted-foreground">
            View and manage submitted video testimonials
          </p>
        </div>
      </div>

      {/* Dashboard content */}
      <Suspense fallback={<TableSkeleton rows={6} columns={4} />}>
        <LibraryContent userRole={role} />
      </Suspense>
    </div>
  );
}
