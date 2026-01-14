import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Plus,
  FileText,
  TrendingUp,
  Target,
  ClipboardList,
  ArrowRight,
  CheckCircle2,
  Clock,
  BarChart3,
} from "lucide-react";
import { getEXSurveys, getEXMetrics, getActionPlans, getEXTrends, initializeDefaultEXTemplates } from "@/lib/ex-surveys/actions";
import { interpretENPS } from "@/types/ex-survey.types";
import { EXMultiMetricChart } from "@/components/ex-surveys";

export const metadata = {
  title: "Employee Experience | ReviewHub",
  description: "Employee engagement surveys and culture measurement",
};

async function checkAccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
  const [surveysResult, metricsResult, plansResult] = await Promise.all([
    getEXSurveys(),
    getEXMetrics(),
    getActionPlans(),
  ]);

  const surveys = surveysResult.data || [];
  const metrics = metricsResult.data;
  const plans = plansResult.data || [];

  const activeSurveys = surveys.filter((s) => s.status === "active").length;
  const totalResponses = surveys.reduce((sum, s) => sum + s.totalResponses, 0);
  const avgResponseRate = surveys.length > 0
    ? surveys.reduce((sum, s) => sum + s.responseRate, 0) / surveys.length
    : 0;
  const activePlans = plans.filter((p) => p.status === "planned" || p.status === "in_progress").length;

  const enpsInterpretation = metrics?.enpsScore !== undefined ? interpretENPS(metrics.enpsScore) : null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Action Plans</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activePlans}</div>
          <p className="text-xs text-muted-foreground">
            {plans.filter((p) => p.status === "completed").length} completed
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
    draft: "bg-gray-100 text-gray-800",
    scheduled: "bg-blue-100 text-blue-800",
    active: "bg-green-100 text-green-800",
    closed: "bg-yellow-100 text-yellow-800",
    archived: "bg-gray-100 text-gray-600",
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

async function ActionPlansList() {
  const result = await getActionPlans();
  const plans = result.data?.filter((p) => p.status !== "completed" && p.status !== "cancelled").slice(0, 5) || [];

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Target className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-sm text-muted-foreground">No active action plans</p>
        <p className="text-xs text-muted-foreground">
          Create action plans from survey insights
        </p>
      </div>
    );
  }

  const priorityColors: Record<string, string> = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-4">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className="flex items-start justify-between rounded-lg border p-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{plan.title}</span>
              <Badge variant="secondary" className={priorityColors[plan.priority]}>
                {plan.priority}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="capitalize">{plan.theme}</span>
              {plan.targetDate && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Due {new Date(plan.targetDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          {plan.status === "in_progress" && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              In Progress
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}

export default async function EXSurveysPage() {
  await checkAccess();

  // Initialize default templates if needed
  await initializeDefaultEXTemplates();

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Employee Experience</h1>
            <p className="text-muted-foreground">
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
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
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Surveys */}
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

        {/* Action Plans */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Action Plans</CardTitle>
              <CardDescription>Improvements in progress</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/ex-surveys/action-plans">
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
              <ActionPlansList />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Quick tips */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Getting Started with Employee Experience
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-background p-4">
              <div className="font-medium">1. Choose a Template</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Start with engagement, pulse, or exit surveys
              </p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="font-medium">2. Target Your Audience</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Select departments or roles to survey
              </p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="font-medium">3. Launch & Collect</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Send invitations and track responses
              </p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="font-medium">4. Act on Insights</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Create action plans from feedback
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
