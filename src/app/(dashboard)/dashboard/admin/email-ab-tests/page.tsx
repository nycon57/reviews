import { Suspense } from "react";
import { redirect } from "next/navigation";
import { checkAdminAccess } from "@/lib/auth/actions";
import { StatsRowSkeleton, TableSkeleton } from "@/components/shared";
import {
  Flask as FlaskConical,
} from "@phosphor-icons/react/dist/ssr";
import { ABTestsListClient } from "./ab-tests-list-client";

export const metadata = {
  title: "Email A/B Tests | RepWell",
  description: "Create and manage email A/B tests to optimize engagement",
};

export default async function EmailABTestsPage() {
  const hasAccess = await checkAdminAccess();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
          <FlaskConical className="h-6 w-6 text-repwell-teal-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display leading-tight text-repwell-teal-500">Email A/B Tests</h1>
          <p className="text-sm leading-snug text-repwell-teal-300">
            Create and manage A/B tests to optimize email performance
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="space-y-6">
            <StatsRowSkeleton count={4} />
            <TableSkeleton rows={8} columns={6} />
          </div>
        }
      >
        <ABTestsListClient />
      </Suspense>
    </div>
  );
}
