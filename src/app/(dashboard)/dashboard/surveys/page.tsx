import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldWarning } from "@phosphor-icons/react/dist/ssr";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { getAccessContext, isEnterprise, isAdmin } from "@/lib/access";
import { SurveyTemplatesList } from "./survey-templates-list";

export const metadata = {
  title: "Survey Templates | RepWell",
  description: "Create and manage reusable survey templates.",
};

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
    <Suspense
      fallback={
        <Card className="border border-border shadow-soft overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <div className="h-5 w-48 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-9 w-36 rounded bg-muted animate-pulse" />
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-4 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-muted" />
                  <div className="h-3 w-2/3 rounded bg-muted" />
                </div>
                <div className="h-6 w-16 rounded bg-muted" />
              </div>
            ))}
          </CardContent>
        </Card>
      }
    >
      <SurveyTemplatesList />
    </Suspense>
  );
}
