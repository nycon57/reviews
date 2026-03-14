import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetList } from "@/components/widgets/widget-list";
import { listWidgets } from "@/lib/widgets/actions";
import { ensureDefaultWidgets } from "@/lib/widgets/seed-defaults";
import { getAccessContext } from "@/lib/access";
import type { WidgetConfig } from "@/lib/widgets/types";

export const metadata = {
  title: "Widget Templates | RepWell",
  description: "Customize and embed review widgets on your website",
};

/** Legacy review types consolidated into review_profile. */
const LEGACY_REVIEW_TYPES = new Set(["lo_review", "branch_review", "company_review"]);

/** Keep one widget per type (oldest, i.e. first-seeded). Collapses legacy review types into review_profile. */
function deduplicateByType(widgets: WidgetConfig[]): WidgetConfig[] {
  const seen = new Map<string, WidgetConfig>();
  // Items arrive newest-first from query; reverse so oldest wins per type
  const sorted = [...widgets].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  for (const w of sorted) {
    // Treat legacy review types as review_profile for dedup/display
    const displayType = LEGACY_REVIEW_TYPES.has(w.widget_type)
      ? "review_profile"
      : w.widget_type;
    if (!seen.has(displayType)) {
      seen.set(displayType, { ...w, widget_type: displayType } as WidgetConfig);
    }
  }
  return Array.from(seen.values());
}

async function WidgetListLoader() {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");

  // Lazy backfill: ensure default widget types exist for the org
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

  const widgets = deduplicateByType(result.data.items);

  return <WidgetList widgets={widgets} />;
}

function WidgetListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
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
