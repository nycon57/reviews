import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isShareStudioSchemaReady } from "@/lib/share-studio/service";
import { getShareStudioCardsForOrganization } from "@/lib/share-studio/hub-service";
import type { ShareStudioCardsData } from "@/lib/share-studio/hub-types";

/* ------------------------------------------------------------------ */
/*  Data fetching                                                      */
/* ------------------------------------------------------------------ */

async function getShareStudioData(organizationId: string) {
  const schemaReady = await isShareStudioSchemaReady(organizationId);
  if (!schemaReady) return null;

  return getShareStudioCardsForOrganization(organizationId);
}

/* ------------------------------------------------------------------ */
/*  Components                                                         */
/* ------------------------------------------------------------------ */

function jobStatusBadge(status: string) {
  const s = String(status).toLowerCase();
  if (s === "queued") return <Badge className="bg-amber-600 text-xs">Queued</Badge>;
  if (s === "processing") return <Badge className="bg-blue-600 text-xs">Processing</Badge>;
  return <Badge variant="secondary" className="text-xs">{status}</Badge>;
}

export async function ShareStudioCards({
  organizationId,
  data: preloadedData,
}: {
  organizationId?: string;
  data?: ShareStudioCardsData | null;
}) {
  const data =
    preloadedData ??
    (organizationId ? await getShareStudioData(organizationId) : null);
  if (!data) return null;

  const { activeJobs, views, clicks, publishedLinks, totalLinks, periodLabel } = data;
  const ctr = views > 0 ? Math.round((clicks / views) * 1000) / 10 : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Render Queue — only show if jobs exist */}
      {activeJobs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Render Queue</CardTitle>
            <CardDescription>
              {activeJobs.length} active render {activeJobs.length === 1 ? "job" : "jobs"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeJobs.map((job) => {
              const proofItemId = job.proofItemId ?? "";
              return (
                <div
                  key={String(job.id)}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium capitalize">
                      {job.assetType} render
                    </p>
                    {proofItemId && (
                      <Link
                        href={`/dashboard/reviews/${proofItemId}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View source review
                      </Link>
                    )}
                  </div>
                  {jobStatusBadge(job.status || "queued")}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Smart Link Performance — always show */}
      <Card className={activeJobs.length === 0 ? "lg:col-span-2 max-w-lg" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Smart Link Performance</CardTitle>
          <CardDescription>
            Aggregate engagement across published smart links · {periodLabel}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border px-4 py-3 text-center">
              <p className="text-2xl font-semibold tabular-nums">{views.toLocaleString()}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Total Views</p>
            </div>
            <div className="rounded-md border px-4 py-3 text-center">
              <p className="text-2xl font-semibold tabular-nums">{clicks.toLocaleString()}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Total Clicks</p>
            </div>
            <div className="rounded-md border px-4 py-3 text-center">
              <p className="text-2xl font-semibold tabular-nums">{ctr}%</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Click-through Rate</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">Published links</span>
            <span className="font-medium tabular-nums">{publishedLinks}</span>
          </div>
          <div className="flex items-center justify-between rounded-md border px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">Total links</span>
            <span className="font-medium tabular-nums">{totalLinks}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
