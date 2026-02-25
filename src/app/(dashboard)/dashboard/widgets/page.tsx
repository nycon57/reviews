import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetList } from "@/components/widgets/widget-list";
import { listWidgets } from "@/lib/widgets/actions";
import { ensureDefaultWidgets } from "@/lib/widgets/seed-defaults";
import { getAccessContext } from "@/lib/access";

export const metadata = {
  title: "Widgets | RepWell",
  description: "Manage your embeddable review widgets",
};

async function WidgetListLoader() {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");

  // Lazy backfill: ensure all 9 default widget types exist for the org
  try {
    await ensureDefaultWidgets(ctx.organizationId, ctx.userId);
  } catch (err) {
    console.error("Widget backfill check failed:", err);
  }

  const result = await listWidgets({ page: 1, pageSize: 100 });

  if (!result.success) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p className="text-sm">Could not load widgets. Please try again.</p>
      </div>
    );
  }

  return (
    <WidgetList widgets={result.data.items} total={result.data.total} />
  );
}

function WidgetListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-24 mt-2" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function WidgetsPage() {
  return (
    <div className="flex-1 py-8">
      <Suspense fallback={<WidgetListSkeleton />}>
        <WidgetListLoader />
      </Suspense>
    </div>
  );
}
