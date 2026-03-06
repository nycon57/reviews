/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - ex_surveys tables not in generated types yet
import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Users,
  ChartBar as BarChart3,
  TrendUp as TrendingUp,
  Clock,
  Envelope as Mail,
  CheckCircle as CheckCircle2,
} from "@phosphor-icons/react/dist/ssr";
import { getEXSurveyResponses, closeEXSurvey } from "@/lib/ex-surveys/actions";
import { interpretENPS, calculateENPS } from "@/types/ex-survey.types";
import { EXSurveyLaunchButton } from "@/components/ex-surveys";
import { EXResultsChart } from "@/components/ex-surveys";

export const metadata = {
  title: "Survey Details | Employee Experience | RepWell",
  description: "View survey details and results",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getSurveyData(surveyId: string) {
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

  // Get survey
  const { data: survey, error } = await supabase
    .from("ex_surveys")
    .select(`
      *,
      ex_survey_templates (
        id,
        name,
        questions,
        branding
      )
    `)
    .eq("id", surveyId)
    .eq("organization_id", userData.organization_id)
    .single();

  if (error || !survey) {
    return null;
  }

  // Get invitation counts separately
  const { count: inviteCount } = await supabase
    .from("ex_survey_invitations")
    .select("*", { count: "exact", head: true })
    .eq("survey_id", surveyId);

  const { count: completedCount } = await supabase
    .from("ex_survey_invitations")
    .select("*", { count: "exact", head: true })
    .eq("survey_id", surveyId)
    .eq("status", "completed");

  return {
    survey,
    inviteCount: inviteCount || 0,
    completedCount: completedCount || 0,
    organizationId: userData.organization_id,
  };
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400",
  active: "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400",
  closed: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400",
  archived: "bg-muted text-muted-foreground",
};

async function SurveyResults({ surveyId }: { surveyId: string }) {
  const result = await getEXSurveyResponses(surveyId);
  const responses = result.data || [];

  if (responses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">No responses yet</p>
        <p className="text-sm text-muted-foreground">
          Results will appear here once employees start responding
        </p>
      </div>
    );
  }

  // Calculate eNPS from responses
  const enpsScores = responses
    .filter((r) => r.enpsScore !== null && r.enpsScore !== undefined)
    .map((r) => r.enpsScore as number);

  const enps = enpsScores.length > 0 ? calculateENPS(enpsScores) : null;
  const enpsInterpretation = enps !== null ? interpretENPS(enps) : null;

  // Calculate average rating
  const ratings = responses
    .filter((r) => r.overallRating !== null && r.overallRating !== undefined)
    .map((r) => r.overallRating as number);
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">eNPS Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${enpsInterpretation?.color || ""}`}>
              {enps !== null ? enps : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {enpsInterpretation?.label || "Not enough data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {avgRating !== null ? avgRating.toFixed(1) : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of 5 stars
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{responses.length}</div>
            <p className="text-xs text-muted-foreground">
              Completed surveys
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Results visualization */}
      <EXResultsChart responses={responses} />
    </div>
  );
}

export default async function EXSurveyDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getSurveyData(id);

  if (!data) {
    notFound();
  }

  const { survey, inviteCount, completedCount } = data;
  const responseRate = inviteCount > 0 ? (completedCount / inviteCount) * 100 : 0;
  const template = survey.ex_survey_templates;

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="mt-1"
            aria-label="Back to EX surveys"
          >
            <Link href="/dashboard/ex-surveys">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{survey.name}</h1>
              <Badge variant="secondary" className={statusColors[survey.status]}>
                {survey.status}
              </Badge>
              {survey.is_anonymous && (
                <Badge variant="outline">Anonymous</Badge>
              )}
            </div>
            <p className="mt-1 text-muted-foreground">
              {survey.description || `${survey.survey_type} survey`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {survey.status === "draft" && (
            <EXSurveyLaunchButton surveyId={survey.id} surveyName={survey.name} />
          )}
          {survey.status === "active" && (
            <form
              action={async () => {
                "use server";
                await closeEXSurvey(id);
              }}
            >
              <Button variant="outline" type="submit">
                Close Survey
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invitations Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inviteCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Responses</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responseRate.toFixed(1)}%</div>
            <Progress value={responseRate} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{template?.questions?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Survey timeline */}
      {(survey.start_date || survey.end_date) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Survey Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8 text-sm">
              {survey.start_date && (
                <div>
                  <span className="text-muted-foreground">Start: </span>
                  <span className="font-medium">
                    {new Date(survey.start_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {survey.end_date && (
                <div>
                  <span className="text-muted-foreground">End: </span>
                  <span className="font-medium">
                    {new Date(survey.end_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results section */}
      <Card>
        <CardHeader>
          <CardTitle>Survey Results</CardTitle>
          <CardDescription>
            Response data and insights from your survey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
                <Skeleton className="h-64 w-full" />
              </div>
            }
          >
            <SurveyResults surveyId={id} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
