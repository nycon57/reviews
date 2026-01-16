import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Gift, TrendingUp, Users, Target, MessageSquare, CheckCircle2 } from "lucide-react";
import {
  getRecognitions,
  getRecognitionAnalytics,
  getManagerFeedback,
  initializeDefaultBadges,
} from "@/lib/recognition/actions";
import {
  RecognitionFeed,
  RecognitionAnalyticsDashboard,
  ManagerFeedbackList,
  GiveRecognitionDialog,
  GiveFeedbackDialog,
} from "@/components/recognition";

export const metadata = {
  title: "Recognition & Feedback | RepWell",
  description: "Employee recognition and continuous feedback",
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
    .select("id, role, organization_id")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    redirect("/dashboard");
  }

  return {
    userId: userData.id,
    role: userData.role,
    isManager: userData.role === "admin" || userData.role === "manager",
  };
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

async function RecognitionStatsCards() {
  const result = await getRecognitionAnalytics("month");
  const analytics = result.data;

  if (!analytics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Recognitions This Month
          </CardTitle>
          <Gift className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.totalRecognitions}</div>
          <p className="text-xs text-muted-foreground">
            {analytics.totalPoints} points awarded
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Givers</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.uniqueGivers}</div>
          <p className="text-xs text-muted-foreground">
            employees giving recognition
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recipients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.uniqueRecipients}</div>
          <p className="text-xs text-muted-foreground">employees recognized</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Participation</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.participationRate}%</div>
          <p className="text-xs text-muted-foreground">of employees engaged</p>
        </CardContent>
      </Card>
    </div>
  );
}

async function RecognitionFeedSection() {
  const result = await getRecognitions({ limit: 10 });
  return <RecognitionFeed initialRecognitions={result.data || []} showGiveButton={false} />;
}

async function ManagerFeedbackSection({ currentUserId }: { currentUserId: string }) {
  const result = await getManagerFeedback({ limit: 10 });
  return (
    <ManagerFeedbackList
      initialFeedback={result.data || []}
      showGiveButton={false}
      currentUserId={currentUserId}
    />
  );
}

export default async function RecognitionPage() {
  const { userId, isManager } = await checkAccess();

  // Initialize default badges if needed
  await initializeDefaultBadges();

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Recognition & Feedback
            </h1>
            <p className="text-muted-foreground">
              Celebrate achievements and provide continuous feedback
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isManager && (
            <GiveFeedbackDialog />
          )}
          <GiveRecognitionDialog />
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
        <RecognitionStatsCards />
      </Suspense>

      {/* Main content with tabs */}
      <Tabs defaultValue="feed" className="space-y-4">
        <TabsList>
          <TabsTrigger value="feed" className="gap-2">
            <Gift className="h-4 w-4" />
            Recognition Feed
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          {isManager && (
            <TabsTrigger value="feedback" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Manager Feedback
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="feed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Recognition</CardTitle>
              <CardDescription>
                See what your colleagues are celebrating
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                }
              >
                <RecognitionFeedSection />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Suspense
            fallback={
              <div className="space-y-4">
                <Skeleton className="h-12 w-64" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              </div>
            }
          >
            <RecognitionAnalyticsDashboard />
          </Suspense>
        </TabsContent>

        {isManager && (
          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Continuous Feedback</CardTitle>
                <CardDescription>
                  Feedback you&apos;ve given and received as a manager
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense
                  fallback={
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))}
                    </div>
                  }
                >
                  <ManagerFeedbackSection currentUserId={userId} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Quick tips */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Building a Recognition Culture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-background p-4">
              <div className="font-medium">1. Be Specific</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Mention exactly what the person did well
              </p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="font-medium">2. Be Timely</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Recognize achievements when they happen
              </p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="font-medium">3. Be Inclusive</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Recognize contributions from all team members
              </p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="font-medium">4. Be Genuine</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Authentic recognition has the most impact
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
