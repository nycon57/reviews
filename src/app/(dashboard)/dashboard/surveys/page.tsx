import { Suspense } from "react";
import { unifiedGetUser } from "@/lib/auth/actions";
import { redirect } from "next/navigation";
import { SurveyTemplatesList } from "./survey-templates-list";
import { CardSkeleton } from "@/components/shared/skeletons";

export default async function SurveysPage() {
  const user = await unifiedGetUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Survey Templates</h1>
        <p className="text-muted-foreground">
          Create and manage customizable survey templates
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        }
      >
        <SurveyTemplatesList />
      </Suspense>
    </div>
  );
}
