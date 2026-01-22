import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import { checkAdminAccess } from "@/lib/auth/actions";
import { LoadingSpinner } from "@/components/shared";
import { ABTestDetailClient } from "./ab-test-detail-client";
import { getABTestWithResults } from "@/lib/email-ab-testing";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id: _id } = await params;
  return {
    title: `A/B Test Details | RepWell`,
    description: `View A/B test details and results`,
  };
}

async function ABTestDetailLoader({ id }: { id: string }) {
  const result = await getABTestWithResults(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <ABTestDetailClient test={result.data} />;
}

export default async function ABTestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const hasAccess = await checkAdminAccess();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <div className="flex-1 space-y-6">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner />
          </div>
        }
      >
        <ABTestDetailLoader id={id} />
      </Suspense>
    </div>
  );
}
