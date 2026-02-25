import { Suspense } from "react";
import type { Metadata } from "next";
import { CreateEXSurveyPageClient } from "./create-ex-survey-page-client";

export const metadata: Metadata = {
  title: "Create EX Survey | RepWell",
  description: "Set up and launch a new employee experience survey.",
};

export default function CreateEXSurveyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <CreateEXSurveyPageClient />
    </Suspense>
  );
}
