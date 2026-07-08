import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ClipboardText } from "@phosphor-icons/react/dist/ssr";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { getAccessContext } from "@/lib/access";
import { SurveyTemplatesList } from "./survey-templates-list";

export const metadata = {
  title: "Survey Templates | RepWell",
  description: "Create and manage reusable survey templates.",
};

export default async function SurveysPage() {
  if (!(await getAccessContext())) redirect("/login");
  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
          <ClipboardText className="h-6 w-6 text-repwell-teal-300" aria-hidden="true" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-heading-accent">Surveys</h1>
          <p className="text-sm leading-snug text-repwell-teal-300">
            Create and manage reusable survey templates
          </p>
        </div>
      </div>

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
    </div>
  );
}
