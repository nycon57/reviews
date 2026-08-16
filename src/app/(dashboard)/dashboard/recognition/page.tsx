import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Medal as Award,
  Gift,
  TrendUp as TrendingUp,
  Chats as MessageSquare,
} from "@phosphor-icons/react/dist/ssr";
import {
  getRecognitionBadges,
  getRecognitions,
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
import { requireEnterprise, isManagerOrAbove } from "@/lib/access";

export const metadata = {
  title: "Recognition & Feedback | RepWell",
  description: "Employee recognition and continuous feedback",
};

function ReadOnlyRecognitionFeed({
  initialRecognitions,
}: {
  initialRecognitions: Awaited<ReturnType<typeof getRecognitions>>["data"] | undefined;
}) {
  return <RecognitionFeed initialRecognitions={initialRecognitions || []} showGiveButton={false} />;
}

function ReadOnlyManagerFeedbackList({
  initialFeedback,
  currentUserId,
}: {
  initialFeedback: Awaited<ReturnType<typeof getManagerFeedback>>["data"] | undefined;
  currentUserId: string;
}) {
  return (
    <ManagerFeedbackList
      initialFeedback={initialFeedback || []}
      showGiveButton={false}
      currentUserId={currentUserId}
    />
  );
}

async function RecognitionFeedSection() {
  let result: Awaited<ReturnType<typeof getRecognitions>>;
  try {
    result = await getRecognitions({ limit: 10 });
  } catch (err) {
    console.error("Failed to load recognitions:", err);
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-muted-foreground">Failed to load recognition feed. Please try refreshing the page.</p>
      </div>
    );
  }
  return <ReadOnlyRecognitionFeed initialRecognitions={result.data} />;
}

async function ManagerFeedbackSection({ currentUserId }: { currentUserId: string }) {
  let result: Awaited<ReturnType<typeof getManagerFeedback>>;
  try {
    result = await getManagerFeedback({ limit: 10 });
  } catch (err) {
    console.error("Failed to load manager feedback:", err);
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-muted-foreground">Failed to load manager feedback. Please try refreshing the page.</p>
      </div>
    );
  }
  return <ReadOnlyManagerFeedbackList initialFeedback={result.data} currentUserId={currentUserId} />;
}

async function ensureRecognitionBadges() {
  let result = await getRecognitionBadges();

  if (result.success && (result.data?.length ?? 0) === 0) {
    await initializeDefaultBadges({ skipExistingCheck: true });
    result = await getRecognitionBadges();
  }

  return result;
}

export default async function RecognitionPage() {
  // Check access - requires enterprise account (all enterprise users can view)
  const ctx = await requireEnterprise();
  const userId = ctx.userId;
  const isManager = isManagerOrAbove(ctx);

  await ensureRecognitionBadges();

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <Award className="h-6 w-6 text-repwell-teal-300" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-heading">
              Recognition & Feedback
            </h1>
            <p className="text-sm leading-snug text-repwell-teal-300">
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
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
