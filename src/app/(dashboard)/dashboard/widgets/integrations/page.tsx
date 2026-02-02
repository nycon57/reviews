import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { IntegrationsPageContent } from "@/components/widgets/integrations/integrations-page-content";

export const metadata = {
  title: "Widget Integrations | RepWell",
  description:
    "Integration guides for embedding RepWell review widgets on any platform",
};

function IntegrationsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 mt-2" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function WidgetIntegrationsPage() {
  return (
    <div className="flex-1 py-8">
      <Suspense fallback={<IntegrationsSkeleton />}>
        <IntegrationsPageContent />
      </Suspense>
    </div>
  );
}
