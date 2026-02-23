import { Suspense } from "react";
import { unifiedGetUser } from "@/lib/auth/actions";
import { redirect } from "next/navigation";
import { FileText } from "@phosphor-icons/react/dist/ssr";
import { SurveyTemplatesList } from "./survey-templates-list";
import { CardSkeleton } from "@/components/shared/skeletons";

export default async function SurveysPage() {
  const user = await unifiedGetUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Survey Templates</h1>
          <p className="text-muted-foreground">
            Create and manage customizable survey templates
          </p>
        </div>
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
