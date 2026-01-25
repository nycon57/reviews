/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - ex_surveys tables not in generated types yet
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ClipboardText as ClipboardList,
  Plus,
  FileText,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import { getEXSurveyTemplates, getEXSurveys, initializeDefaultEXTemplates } from "@/lib/ex-surveys/actions";
import { TemplatesListClient } from "./templates-list-client";

export const metadata = {
  title: "Survey Templates | Employee Experience | RepWell",
  description: "Choose a template to create your employee experience survey",
};

async function checkAccess() {
  const user = await unifiedGetUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    redirect("/dashboard");
  }

  if (userData.role !== "admin" && userData.role !== "manager") {
    redirect("/dashboard");
  }

  return { role: userData.role };
}

function TemplatesSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-80 w-full" />
      ))}
    </div>
  );
}

async function TemplatesList() {
  const result = await getEXSurveyTemplates();
  const templates = result.data || [];

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">No templates available</p>
        <Button asChild className="mt-4 bg-repwell-teal-300 hover:bg-repwell-teal-400">
          <Link href="/dashboard/ex-surveys/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Custom Template
          </Link>
        </Button>
      </div>
    );
  }

  // Pass templates to client component for interactive features
  return <TemplatesListClient templates={templates} />;
}

function SurveysSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

async function ExistingSurveysList() {
  const result = await getEXSurveys();
  const surveys = result.data || [];

  if (surveys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ClipboardList className="h-10 w-10 text-muted-foreground/50" />
        <p className="mt-3 text-sm text-muted-foreground">
          No surveys created yet. Choose a template above to get started.
        </p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    scheduled: "bg-blue-100 text-blue-800",
    active: "bg-green-100 text-green-800",
    closed: "bg-yellow-100 text-yellow-800",
    archived: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-3">
      {surveys.map((survey) => (
        <Link
          key={survey.id}
          href={`/dashboard/ex-surveys/${survey.id}`}
          className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{survey.name}</span>
              <Badge variant="secondary" className={statusColors[survey.status]}>
                {survey.status}
              </Badge>
              {survey.isAnonymous && (
                <Badge variant="outline" className="text-xs">
                  Anonymous
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="capitalize">{survey.surveyType}</span>
              <span>{survey.totalResponses} / {survey.totalInvites} responses</span>
              {survey.responseRate > 0 && (
                <span>{survey.responseRate.toFixed(1)}% rate</span>
              )}
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      ))}
    </div>
  );
}

export default async function EXSurveyTemplatesPage() {
  await checkAccess();

  // Initialize default templates if needed
  await initializeDefaultEXTemplates();

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/ex-surveys">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-repwell-teal-500">
              Survey Templates
            </h1>
            <p className="font-sans text-repwell-teal-400">
              Choose a template to create your employee experience survey
            </p>
          </div>
        </div>
        <Button asChild className="bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white">
          <Link href="/dashboard/ex-surveys/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Custom Template
          </Link>
        </Button>
      </div>

      {/* Templates */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Available Templates</h2>
        <Suspense fallback={<TemplatesSkeleton />}>
          <TemplatesList />
        </Suspense>
      </div>

      {/* Existing Surveys */}
      <Card>
        <CardHeader>
          <CardTitle>Your Surveys</CardTitle>
          <CardDescription>
            Manage your existing employee experience surveys
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<SurveysSkeleton />}>
            <ExistingSurveysList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
