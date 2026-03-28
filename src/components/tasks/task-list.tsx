"use client";

import { useState, useTransition } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle } from "@phosphor-icons/react";
import type { UserTask, TaskFilter } from "@/lib/tasks";
import { getTasks } from "@/lib/tasks";
import { TaskCard } from "./task-card";

interface TaskListProps {
  initialTasks: UserTask[];
  initialTotal: number;
  initialPendingCount: number;
}

export function TaskList({
  initialTasks,
  initialTotal,
  initialPendingCount,
}: TaskListProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [total, setTotal] = useState(initialTotal);
  const [pendingCount, setPendingCount] = useState(initialPendingCount);
  const [activeFilter, setActiveFilter] = useState<TaskFilter>("pending");
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (filter: string) => {
    const taskFilter = filter as TaskFilter;
    setActiveFilter(taskFilter);
    startTransition(async () => {
      const result = await getTasks(taskFilter);
      setTasks(result.tasks);
      setTotal(result.total);
      setPendingCount(result.pendingCount);
    });
  };

  return (
    <Tabs value={activeFilter} onValueChange={handleFilterChange}>
      <div className="flex items-center justify-between">
        <TabsList variant="underline">
          <TabsTrigger value="pending" className="relative px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-repwell-teal-300 data-[state=active]:font-semibold rounded-none bg-transparent shadow-none border-b-2 border-transparent data-[state=active]:border-repwell-teal-300">
            Pending
            {pendingCount > 0 && (
              <span className="ml-1.5 rounded-full bg-repwell-teal-300/10 px-1.5 py-0.5 text-[10px] font-semibold text-repwell-teal-300">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="relative px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-repwell-teal-300 data-[state=active]:font-semibold rounded-none bg-transparent shadow-none border-b-2 border-transparent data-[state=active]:border-repwell-teal-300">
            Completed
          </TabsTrigger>
          <TabsTrigger value="all" className="relative px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-repwell-teal-300 data-[state=active]:font-semibold rounded-none bg-transparent shadow-none border-b-2 border-transparent data-[state=active]:border-repwell-teal-300">
            All
          </TabsTrigger>
        </TabsList>
        <span className="text-xs text-muted-foreground">
          {total} task{total !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="mt-4">
        {isPending ? (
          <TaskListSkeleton />
        ) : (
          <TabsContent value={activeFilter} className="m-0 space-y-2">
            {tasks.length === 0 ? (
              <EmptyTaskState filter={activeFilter} />
            ) : (
              tasks.map((task) => <TaskCard key={task.id} task={task} />)
            )}
          </TabsContent>
        )}
      </div>
    </Tabs>
  );
}

function EmptyTaskState({ filter }: { filter: TaskFilter }) {
  if (filter === "pending") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100/50 dark:bg-green-950/30">
          <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" weight="duotone" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-heading">
          You&apos;re all caught up!
        </h3>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          No pending tasks right now. We&apos;ll add new ones as they come up.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm text-muted-foreground">No tasks to show.</p>
    </div>
  );
}

export function TaskListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-border p-3">
          <div className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-14 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
