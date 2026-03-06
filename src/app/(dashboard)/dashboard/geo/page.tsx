import { Suspense } from "react";
import {
  Eye,
} from "@phosphor-icons/react/dist/ssr";
import { CardSkeleton } from "@/components/shared";
import { GeoDashboard } from "./geo-dashboard";
import { requireProTier } from "@/lib/access";

export const metadata = {
  title: "AI Visibility & GEO | RepWell",
  description: "Optimize your content for AI search engines like ChatGPT, Perplexity, and Google AI Overviews",
};

export default async function GeoPage() {
  // Check access - requires Pro tier (pro or enterprise subscription)
  await requireProTier();

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
          <Eye className="h-6 w-6 text-repwell-teal-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display leading-tight text-heading">AI Visibility & GEO</h1>
          <p className="text-sm leading-snug text-repwell-teal-300">
            Optimize your content for AI search engines like ChatGPT, Perplexity, and Google AI Overviews
          </p>
        </div>
      </div>

      {/* GEO Dashboard */}
      <Suspense
        fallback={
          <div className="space-y-6">
            {/* Stats row skeleton */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
            {/* Main content skeleton */}
            <div className="grid gap-6 lg:grid-cols-2">
              <CardSkeleton className="h-[400px]" />
              <CardSkeleton className="h-[400px]" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <CardSkeleton className="h-[400px]" />
              <CardSkeleton className="h-[400px]" />
            </div>
          </div>
        }
      >
        <GeoDashboard />
      </Suspense>
    </div>
  );
}
