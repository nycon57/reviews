import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Target,
  ArrowLeft,
  Clock,
  CheckCircle2,
  CircleDot,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { getActionPlans } from "@/lib/ex-surveys/actions";
import { ActionPlanDialog } from "./action-plan-dialog";

export const metadata = {
  title: "Action Plans | Employee Experience",
  description: "Manage improvement initiatives from survey insights",
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

  return { role: userData.role, organizationId: userData.organization_id };
}

function ActionPlansSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  planned: {
    icon: <CircleDot className="h-4 w-4" />,
    color: "bg-gray-100 text-gray-800",
  },
  in_progress: {
    icon: <Clock className="h-4 w-4" />,
    color: "bg-yellow-100 text-yellow-800",
  },
  completed: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "bg-green-100 text-green-800",
  },
  cancelled: {
    icon: <XCircle className="h-4 w-4" />,
    color: "bg-red-100 text-red-800",
  },
};

async function ActionPlansContent() {
  const result = await getActionPlans();
  const plans = result.data || [];

  const plannedPlans = plans.filter((p) => p.status === "planned");
  const inProgressPlans = plans.filter((p) => p.status === "in_progress");
  const completedPlans = plans.filter((p) => p.status === "completed");
  const cancelledPlans = plans.filter((p) => p.status === "cancelled");

  const renderPlanList = (planList: typeof plans, emptyMessage: string) => {
    if (planList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Target className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {planList.map((plan) => (
          <Card key={plan.id} className="transition-colors hover:bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{plan.title}</span>
                    <Badge variant="secondary" className={priorityColors[plan.priority]}>
                      {plan.priority}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={`flex items-center gap-1 ${statusConfig[plan.status].color}`}
                    >
                      {statusConfig[plan.status].icon}
                      <span className="capitalize">{plan.status.replace("_", " ")}</span>
                    </Badge>
                  </div>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {plan.description}
                    </p>
                  )}
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
                <div className="flex gap-2">
                  <ActionPlanDialog mode="edit" plan={plan} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Tabs defaultValue="active" className="space-y-4">
      <TabsList>
        <TabsTrigger value="active" className="gap-2">
          <AlertCircle className="h-4 w-4" />
          Active ({plannedPlans.length + inProgressPlans.length})
        </TabsTrigger>
        <TabsTrigger value="planned" className="gap-2">
          <CircleDot className="h-4 w-4" />
          Planned ({plannedPlans.length})
        </TabsTrigger>
        <TabsTrigger value="in_progress" className="gap-2">
          <Clock className="h-4 w-4" />
          In Progress ({inProgressPlans.length})
        </TabsTrigger>
        <TabsTrigger value="completed" className="gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Completed ({completedPlans.length})
        </TabsTrigger>
        <TabsTrigger value="cancelled" className="gap-2">
          <XCircle className="h-4 w-4" />
          Cancelled ({cancelledPlans.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active">
        {renderPlanList(
          [...inProgressPlans, ...plannedPlans],
          "No active action plans. Create one to start improving."
        )}
      </TabsContent>

      <TabsContent value="planned">
        {renderPlanList(plannedPlans, "No planned action plans yet.")}
      </TabsContent>

      <TabsContent value="in_progress">
        {renderPlanList(inProgressPlans, "No action plans in progress.")}
      </TabsContent>

      <TabsContent value="completed">
        {renderPlanList(completedPlans, "No completed action plans yet.")}
      </TabsContent>

      <TabsContent value="cancelled">
        {renderPlanList(cancelledPlans, "No cancelled action plans.")}
      </TabsContent>
    </Tabs>
  );
}

export default async function ActionPlansPage() {
  await checkAccess();

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/ex-surveys">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Action Plans</h1>
            <p className="text-muted-foreground">
              Track improvements and initiatives from survey insights
            </p>
          </div>
        </div>
        <ActionPlanDialog mode="create" />
      </div>

      {/* Stats summary */}
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        }
      >
        <ActionPlanStats />
      </Suspense>

      {/* Action plans list */}
      <Card>
        <CardHeader>
          <CardTitle>All Action Plans</CardTitle>
          <CardDescription>
            Manage and track improvement initiatives from employee feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<ActionPlansSkeleton />}>
            <ActionPlansContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

async function ActionPlanStats() {
  const result = await getActionPlans();
  const plans = result.data || [];

  const stats = {
    total: plans.length,
    active: plans.filter((p) => p.status === "planned" || p.status === "in_progress").length,
    completed: plans.filter((p) => p.status === "completed").length,
    overdue: plans.filter((p) => {
      if (p.status === "completed" || p.status === "cancelled" || !p.targetDate) return false;
      return new Date(p.targetDate) < new Date();
    }).length,
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.active}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
        </CardContent>
      </Card>
    </div>
  );
}
