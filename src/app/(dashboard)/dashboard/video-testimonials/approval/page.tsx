import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TableSkeleton } from "@/components/shared/skeletons";
import {
  getVideosPendingApproval,
  getLoanOfficersForVideoRequests,
} from "@/lib/video-testimonials/actions";
import { ApprovalDashboard } from "./approval-dashboard";

export const metadata = {
  title: "Video Approval Queue | RepWell",
  description:
    "Review and approve video testimonials before publishing",
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

  // Only managers and admins can access approval queue
  if (!["admin", "manager"].includes(userData.role)) {
    redirect("/dashboard/video-testimonials/library");
  }

  return { userId: user.id };
}

async function ApprovalContent() {
  const [responsesResult, loanOfficersResult] = await Promise.all([
    getVideosPendingApproval({ page: 1, pageSize: 24 }),
    getLoanOfficersForVideoRequests(),
  ]);

  const initialResponses = responsesResult.success
    ? responsesResult.data?.responses ?? []
    : [];
  const initialTotal = responsesResult.success
    ? responsesResult.data?.total ?? 0
    : 0;
  const initialStats = responsesResult.success
    ? responsesResult.data?.stats ?? { pending: 0, changesRequested: 0 }
    : { pending: 0, changesRequested: 0 };
  const loanOfficers = loanOfficersResult.success
    ? loanOfficersResult.data ?? []
    : [];

  return (
    <ApprovalDashboard
      initialResponses={initialResponses}
      initialTotal={initialTotal}
      initialStats={initialStats}
      loanOfficers={loanOfficers}
    />
  );
}

export default async function VideoApprovalPage() {
  await checkAccess();

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Approval Queue</h1>
          <p className="text-muted-foreground">
            Review and approve video testimonials before publishing
          </p>
        </div>
      </div>

      {/* Dashboard content */}
      <Suspense fallback={<TableSkeleton rows={6} columns={4} />}>
        <ApprovalContent />
      </Suspense>
    </div>
  );
}
