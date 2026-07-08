import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Plus,
  FileText,
  TrendUp as TrendingUp,
  ClipboardText as ClipboardList,
  ArrowRight,
  ChartBar as BarChart3,
} from "@phosphor-icons/react/dist/ssr";
import {
  getEXSurveyTemplates,
  getEXSurveys,
  getEXMetrics,
  getEXTrends,
  initializeDefaultEXTemplates,
} from "@/lib/ex-surveys/actions";
import { interpretENPS } from "@/types/ex-survey.types";
import { EXMultiMetricChart } from "@/components/ex-surveys";
import { requireEnterpriseManager } from "@/lib/access";

export const metadata = {
  title: "Employee Experience | RepWell",
  description: "Employee engagement surveys and culture measurement",
};

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
        <Skeleton className="mt-1 h-3 w-32" />
      </CardContent>
    </Card>
  );
}

async function EXStatsCards() {
  const [surveysResult, metricsResult] = await Promise.all([
    getEXSurveys(),
    getEXMetrics(),
  ]);

  const surveys = surveysResult.data || [];
  const metrics = metricsResult.data;

  const activeSurveys = surveys.filter((s) => s.status === "active").length;
  const totalResponses = surveys.reduce((sum, s) => sum + s.totalResponses, 0);
  const avgResponseRate = surveys.length > 0
    ? surveys.reduce((sum, s) => sum + s.responseRate, 0) / surveys.length
    : 0;

  const enpsInterpretation = metrics?.enpsScore !== undefined ? interpretENPS(metrics.enpsScore) : null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">eNPS Score</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${enpsInterpretation?.color || ""}`}>
            {metrics?.enpsScore !== undefined ? metrics.enpsScore : "—"}
          </div>
          <p className="text-xs text-muted-foreground">
            {enpsInterpretation?.label || "No data yet"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgResponseRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {totalResponses} total responses
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Surveys</CardTitle>
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeSurveys}</div>
          <p className="text-xs text-muted-foreground">
            {surveys.length} total surveys
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

async function RecentSurveysList() {
  const result = await getEXSurveys();
  const surveys = result.data?.slice(0, 5) || [];

  if (surveys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-sm text-muted-foreground">No surveys yet</p>
        <Button asChild className="mt-4" size="sm">
          <Link href="/dashboard/ex-surveys/templates">
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Survey
          </Link>
        </Button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400",
    active: "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400",
    closed: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400",
    archived: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-4">
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

async function TrendChartSection() {
  const result = await getEXTrends(12);
  const trendData = result.data || [];

  if (trendData.length < 2) {
    return null; // Don't show chart if not enough data points
  }

  return <EXMultiMetricChart data={trendData} />;
}

async function ensureEXSurveyTemplates() {
  let result = await getEXSurveyTemplates();

  if (result.success && (result.data?.length ?? 0) === 0) {
    await initializeDefaultEXTemplates({ skipExistingCheck: true });
    result = await getEXSurveyTemplates();
  }

  return result;
}

export default async function EXSurveysPage() {
  // Check access - requires enterprise account + manager/admin role
  await requireEnterpriseManager();

  await ensureEXSurveyTemplates();

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <Users className="h-6 w-6 text-repwell-teal-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-display leading-tight text-heading">Employee Experience</h1>
            <p className="text-sm leading-snug text-repwell-teal-300">
              Measure engagement, collect feedback, and drive improvements
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/ex-surveys/templates">
              <FileText className="mr-2 h-4 w-4" />
              Templates
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/ex-surveys/templates">
              <Plus className="mr-2 h-4 w-4" />
              New Survey
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <EXStatsCards />
      </Suspense>

      {/* Trend chart */}
      <Suspense fallback={<Skeleton className="h-[350px] w-full" />}>
        <TrendChartSection />
      </Suspense>

      {/* Main content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Surveys</CardTitle>
            <CardDescription>Your employee experience surveys</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/ex-surveys/templates">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            }
          >
            <RecentSurveysList />
          </Suspense>
        </CardContent>
      </Card>

    </div>
  );
}
