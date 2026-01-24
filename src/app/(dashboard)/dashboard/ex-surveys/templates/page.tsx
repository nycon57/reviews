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
  Users,
  Lightning as Zap,
  SignOut as LogOut,
  UserPlus,
  Plus,
  FileText,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import { getEXSurveyTemplates, getEXSurveys, initializeDefaultEXTemplates } from "@/lib/ex-surveys/actions";

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

const templateIcons: Record<string, React.ReactNode> = {
  engagement: <Users className="h-6 w-6" />,
  pulse: <Zap className="h-6 w-6" />,
  exit: <LogOut className="h-6 w-6" />,
  onboarding: <UserPlus className="h-6 w-6" />,
};

const templateColors: Record<string, string> = {
  engagement: "bg-blue-100 text-blue-600",
  pulse: "bg-green-100 text-green-600",
  exit: "bg-orange-100 text-orange-600",
  onboarding: "bg-purple-100 text-purple-600",
};

function TemplatesSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-64 w-full" />
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
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {templates.map((template) => (
        <Card key={template.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className={`rounded-lg p-2 ${templateColors[template.surveyType] || "bg-gray-100 text-gray-600"}`}>
                {templateIcons[template.surveyType] || <ClipboardList className="h-6 w-6" />}
              </div>
              {template.isDefault && (
                <Badge variant="secondary">Default</Badge>
              )}
            </div>
            <CardTitle className="mt-3">{template.name}</CardTitle>
            <CardDescription>{template.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="capitalize">{template.surveyType} survey</span>
                <span>{template.questions.length} questions</span>
              </div>
              <Button asChild className="w-full">
                <Link href={`/dashboard/ex-surveys/create?template=${template.id}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Use This Template
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/ex-surveys">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Survey Templates</h1>
          <p className="text-muted-foreground">
            Choose a template to create your employee experience survey
          </p>
        </div>
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
