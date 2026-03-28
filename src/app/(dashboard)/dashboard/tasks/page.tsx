import { Suspense } from "react";
import { ClipboardText } from "@phosphor-icons/react/dist/ssr";
import { Skeleton } from "@/components/ui/skeleton";
import { checkPageAccess, hasProAccess } from "@/lib/access";
import { generateTasksForUser, getTasks } from "@/lib/tasks";
import { TaskList, TaskListSkeleton } from "@/components/tasks/task-list";

export const metadata = {
  title: "Tasks | RepWell",
  description: "Your prioritized task list",
};

async function TasksContent({
  userId,
  organizationId,
  isPro,
}: {
  userId: string;
  organizationId: string;
  isPro: boolean;
}) {
  // Generate tasks (throttled to 5min), then fetch
  await generateTasksForUser(userId, organizationId, isPro);
  const result = await getTasks("pending");

  return (
    <TaskList
      initialTasks={result.tasks}
      initialTotal={result.total}
      initialPendingCount={result.pendingCount}
    />
  );
}

export default async function TasksPage() {
  const ctx = await checkPageAccess({});
  const isPro = hasProAccess(ctx);

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
          <ClipboardText className="h-6 w-6 text-repwell-teal-300" weight="duotone" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-heading">
            Tasks
          </h1>
          <p className="text-sm leading-snug text-repwell-teal-300">
            Prioritized actions to grow your reputation
          </p>
        </div>
      </div>

      {/* Task list */}
      <Suspense fallback={<TasksPageSkeleton />}>
        <TasksContent
          userId={ctx.userId}
          organizationId={ctx.organizationId}
          isPro={isPro}
        />
      </Suspense>
    </div>
  );
}

function TasksPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 border-b border-border pb-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-12" />
      </div>
      <TaskListSkeleton />
    </div>
  );
}
