import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, ShieldWarning } from "@phosphor-icons/react/dist/ssr";
import { getAccessContext, isEnterprise, isAdmin } from "@/lib/access";
import { SurveyTemplatesList } from "./survey-templates-list";
import { CardSkeleton } from "@/components/shared/skeletons";

export default async function SurveysPage() {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");

  // Enterprise non-admin users cannot access surveys
  if (isEnterprise(ctx) && !isAdmin(ctx)) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <ShieldWarning className="h-8 w-8 text-destructive" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold">Access Restricted</h1>
        <p className="text-center text-muted-foreground max-w-md">
          Survey management is only available to organization administrators.
          Please contact your admin if you need access.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  // Both individual users and enterprise admins can manage templates
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Survey Templates</h1>
          <p className="text-muted-foreground">
            {isEnterprise(ctx)
              ? "Create and manage customizable survey templates"
              : "Create and manage your survey templates"}
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
