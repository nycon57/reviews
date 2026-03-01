import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShareNetwork } from "@phosphor-icons/react/dist/ssr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAccessContext, isManagerOrAbove, isEnterprise } from "@/lib/access";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  isShareStudioSchemaReady,
  listProofItems,
  listProofTemplates,
} from "@/lib/share-studio/service";
import { SmartLinksTabContent } from "@/components/share-studio/smart-links-tab-content";

export const metadata = {
  title: "Share Studio | RepWell",
  description:
    "Operational hub for share links, render queue throughput, templates, and share analytics.",
};

function formatShortDate(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "Unknown date";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getErrorMessage(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;

  if (typeof value === "object") {
    const candidate = value as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
      error?: unknown;
    };
    return [
      candidate.message,
      candidate.details,
      candidate.hint,
      candidate.code,
      candidate.error,
    ]
      .filter((entry): entry is string => typeof entry === "string")
      .join(" ");
  }

  return String(value);
}

function statusBadge(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "approved" || normalized === "completed") {
    return <Badge className="bg-emerald-600">Ready</Badge>;
  }

  if (normalized === "pending_approval" || normalized === "queued" || normalized === "processing") {
    return <Badge className="bg-amber-600">In Progress</Badge>;
  }

  if (normalized === "rejected" || normalized === "failed" || normalized === "blocked") {
    return <Badge variant="destructive">Needs Attention</Badge>;
  }

  if (normalized === "published") {
    return <Badge>Published</Badge>;
  }

  return <Badge variant="secondary">{status}</Badge>;
}


async function getDashboardData() {
  const ctx = await getAccessContext();
  if (!ctx) {
    redirect("/login");
  }

  const supabase = createUntypedAdminClient();
  const organizationId = ctx.organizationId;
  const schemaReady = await isShareStudioSchemaReady(organizationId);

  if (!schemaReady) {
    return {
      ctx,
      organizationId,
      schemaReady: false,
      items: [] as Record<string, unknown>[],
      totalItems: 0,
      templates: [] as Record<string, unknown>[],
      links: [] as Record<string, unknown>[],
      assets: [] as Record<string, unknown>[],
      jobs: [] as Record<string, unknown>[],
      imageJobs: [] as Record<string, unknown>[],
      videoJobs: [] as Record<string, unknown>[],
      pendingApprovals: 0,
      linkEventStats: {
        views: 0,
        clicks: 0,
      },
      captionStats: {
        totalVideos: 0,
        captionReady: 0,
        captionPending: 0,
        captionFailed: 0,
      },
      wordTimestampColumnReady: false,
      captionMetricsAvailable: false,
    };
  }

  const [
    itemsResult,
    templatesResult,
    linksResult,
    jobsResult,
    assetsResult,
    pendingResult,
    captionReadyResult,
    captionTotalResult,
    captionPendingResult,
    captionFailedResult,
    linkViewEventsResult,
    linkClickEventsResult,
  ] =
    await Promise.all([
      listProofItems({ organizationId, page: 1, page_size: 30 }),
      listProofTemplates(organizationId),
      supabase
        .from("proof_links")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("proof_render_jobs")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("proof_assets")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(60),
      supabase
        .from("proof_items")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "pending_approval"),
      supabase
        .from("video_testimonial_responses")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .not("word_timestamps", "is", "null"),
      supabase
        .from("video_testimonial_responses")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      supabase
        .from("video_testimonial_responses")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("transcription_status", "pending"),
      supabase
        .from("video_testimonial_responses")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("transcription_status", "failed"),
      supabase
        .from("proof_link_events")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("event_type", "view"),
      supabase
        .from("proof_link_events")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("event_type", "click"),
    ]);

  if (linksResult.error) {
    console.error("[ShareStudio] Smart Links query failed:", linksResult.error);
    throw new Error("Failed to load Smart Links");
  }

  if (jobsResult.error) {
    console.error("[ShareStudio] Render jobs query failed:", jobsResult.error);
    throw new Error("Failed to load render jobs");
  }

  if (assetsResult.error) {
    console.error("[ShareStudio] Render assets query failed:", assetsResult.error);
    throw new Error("Failed to load rendered assets");
  }

  if (pendingResult.error) {
    console.error("[ShareStudio] Approval counts query failed:", pendingResult.error);
    throw new Error("Failed to load approval counts");
  }

  const captionReadyErrorMessage = getErrorMessage(captionReadyResult.error).toLowerCase();
  const wordTimestampColumnReady = !captionReadyResult.error;
  const isMissingWordTimestampsColumn =
    !wordTimestampColumnReady &&
    captionReadyErrorMessage.includes("word_timestamps");
  const logCaptionMetricDebug = process.env.SHARE_STUDIO_DEBUG === "true";

  if (captionReadyResult.error && !isMissingWordTimestampsColumn) {
    if (logCaptionMetricDebug) {
      console.debug(
        "[ShareStudio] Caption-ready query failed (non-fatal):",
        captionReadyResult.error
      );
    }
  }

  if (captionTotalResult.error) {
    if (logCaptionMetricDebug) {
      console.debug("[ShareStudio] Caption total query failed (non-fatal):", captionTotalResult.error);
    }
  }

  if (captionPendingResult.error) {
    if (logCaptionMetricDebug) {
      console.debug(
        "[ShareStudio] Caption pending query failed (non-fatal):",
        captionPendingResult.error
      );
    }
  }

  if (captionFailedResult.error) {
    if (logCaptionMetricDebug) {
      console.debug("[ShareStudio] Caption failed query failed (non-fatal):", captionFailedResult.error);
    }
  }

  const captionMetricsAvailable =
    (!captionReadyResult.error || isMissingWordTimestampsColumn) &&
    !captionTotalResult.error &&
    !captionPendingResult.error &&
    !captionFailedResult.error;

  const jobs = (jobsResult.data || []) as Record<string, unknown>[];
  const assets = (assetsResult.data || []) as Record<string, unknown>[];

  return {
    ctx,
    organizationId,
    schemaReady: true,
    items: itemsResult.items,
    totalItems: itemsResult.total,
    templates: templatesResult,
    links: (linksResult.data || []) as Record<string, unknown>[],
    assets,
    jobs,
    imageJobs: jobs.filter((job) => job.asset_type === "image"),
    videoJobs: jobs.filter((job) => job.asset_type === "video"),
    pendingApprovals: pendingResult.count || 0,
    linkEventStats: {
      views: linkViewEventsResult.error ? 0 : linkViewEventsResult.count || 0,
      clicks: linkClickEventsResult.error ? 0 : linkClickEventsResult.count || 0,
    },
    captionStats: {
      totalVideos: captionTotalResult.error ? 0 : captionTotalResult.count || 0,
      captionReady: isMissingWordTimestampsColumn ? 0 : captionReadyResult.count || 0,
      captionPending: captionPendingResult.error ? 0 : captionPendingResult.count || 0,
      captionFailed: captionFailedResult.error ? 0 : captionFailedResult.count || 0,
    },
    wordTimestampColumnReady: wordTimestampColumnReady && !isMissingWordTimestampsColumn,
    captionMetricsAvailable,
  };
}

export default async function ShareStudioPage() {
  const data = await getDashboardData();

  if (!data.schemaReady) {
    return (
      <div className="flex-1 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Share Studio</h1>
          <p className="text-muted-foreground">
            Smart Links, graphics, and animations from one unified proof model.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Share Studio Setup Required</CardTitle>
            <CardDescription>
              The `proof_*` tables are not available in your current database yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Run the latest Supabase migration, then refresh this page.</p>
            <div className="rounded-md border bg-muted/30 p-3 font-mono text-xs">
              npm run db:push
            </div>
            <p className="text-muted-foreground">
              Required migration: `supabase/migrations/20260216000001_share_studio_schema.sql`
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canReviewApprovals = isEnterprise(data.ctx) && isManagerOrAbove(data.ctx);
  const publishedLinks = data.links.filter((link) => Boolean(link.published)).length;
  const completedGraphics = data.imageJobs.filter((job) => String(job.status) === "completed").length;
  const completedAnimations = data.videoJobs.filter((job) => String(job.status) === "completed").length;
  const queuedJobs = data.jobs.filter((job) => {
    const status = String(job.status || "");
    return status === "queued" || status === "processing";
  });
  const itemsById = new Map(
    data.items.map((item) => [String(item.id), item] as const)
  );
  const linkCtrPercent =
    data.linkEventStats.views > 0
      ? Math.round((data.linkEventStats.clicks / data.linkEventStats.views) * 1000) / 10
      : 0;
  const captionCoveragePercent =
    data.captionStats.totalVideos > 0
      ? Math.round((data.captionStats.captionReady / data.captionStats.totalVideos) * 100)
      : 0;
  const captionProviderSummary = !data.captionMetricsAvailable
    ? "Metrics unavailable"
    : !data.wordTimestampColumnReady
      ? "Migration required"
      : process.env.DEEPGRAM_API_KEY
        ? "Deepgram primary + Gemini fallback"
        : process.env.GEMINI_API_KEY
          ? "Gemini fallback only"
          : "Not configured";

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <ShareNetwork className="h-6 w-6 text-repwell-teal-300" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-repwell-teal-500">Share Studio</h1>
            <p className="text-sm leading-snug text-repwell-teal-300">
              Operations center for queue throughput, Smart Links, templates, and analytics
            </p>
          </div>
        </div>

        {canReviewApprovals ? (
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/dashboard/approvals" className="inline-flex items-center gap-2">
              Review approvals
              {data.pendingApprovals > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-600 px-1 text-xs text-white">
                  {data.pendingApprovals}
                </span>
              ) : null}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Queue</CardDescription>
            <CardTitle className="text-2xl">{queuedJobs.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Active render jobs waiting or processing.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Live Smart Links</CardDescription>
            <CardTitle className="text-2xl">{publishedLinks}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {data.links.length} total links across all proof items.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rendered Assets</CardDescription>
            <CardTitle className="text-2xl">{data.assets.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {completedGraphics} completed images, {completedAnimations} completed videos.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Smart Link CTR</CardDescription>
            <CardTitle className="text-2xl">{linkCtrPercent}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {data.linkEventStats.clicks} clicks from {data.linkEventStats.views} tracked views.
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-5">
            <Card className="xl:col-span-3">
              <CardHeader>
                <CardTitle>Rendered Assets</CardTitle>
                <CardDescription>
                  Latest rendered outputs ready for distribution.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.assets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No assets rendered yet.</p>
                ) : (
                  data.assets.slice(0, 15).map((asset) => (
                    <div
                      key={String(asset.id)}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">{String(asset.asset_type)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatShortDate(asset.created_at)}
                        </p>
                      </div>
                      {asset.asset_url ? (
                        <Button asChild variant="outline" size="sm">
                          <Link href={String(asset.asset_url)} target="_blank">
                            Open
                          </Link>
                        </Button>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Render Queue</CardTitle>
                <CardDescription>
                  Unified queue for image/video renders and Smart Link OG jobs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.jobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No render activity yet. Queue jobs from any review detail page.
                  </p>
                ) : (
                  data.jobs.slice(0, 25).map((job) => {
                    const proofItemId = String(job.proof_item_id ?? "");
                    const sourceItem = itemsById.get(proofItemId) as Record<string, unknown> | undefined;
                    const sourceType = String(sourceItem?.source_type ?? "");
                    const sourceId =
                      typeof sourceItem?.source_id === "string"
                        ? sourceItem.source_id
                        : null;
                    const reviewHref = sourceId
                      ? sourceType === "video_testimonial"
                        ? `/dashboard/reviews/${sourceId}?type=video`
                        : `/dashboard/reviews/${sourceId}`
                      : null;
                    return (
                      <div key={String(job.id)} className="rounded-md border p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="space-y-1">
                            <p className="font-medium">{String(job.asset_type)} render</p>
                            <p className="text-xs text-muted-foreground">
                              {String(job.id)} · {formatShortDate(job.created_at)}
                            </p>
                            {reviewHref ? (
                              <Link href={reviewHref} className="text-xs text-primary hover:underline">
                                Open source review
                              </Link>
                            ) : null}
                          </div>
                          {statusBadge(String(job.status || "queued"))}
                        </div>
                        {job.error_message ? (
                          <p className="mt-2 text-xs text-red-600">{String(job.error_message)}</p>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <SmartLinksTabContent
            links={data.links.map((link) => ({
              id: String(link.id),
              slug: String(link.slug ?? ""),
              title: link.title ? String(link.title) : null,
              published: Boolean(link.published),
              created_at: String(link.created_at ?? ""),
              updated_at: link.updated_at ? String(link.updated_at) : null,
              destination_url: link.destination_url ? String(link.destination_url) : null,
            }))}
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-5">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Template Catalog</CardTitle>
                <CardDescription>
                  Brand-aware templates used by image and animation rendering.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No templates found for this organization yet.</p>
                ) : (
                  data.templates.map((template) => (
                    <div
                      key={String(template.id)}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">{String(template.name)}</p>
                        <p className="text-xs text-muted-foreground">{String(template.category)}</p>
                      </div>
                      <Badge variant={template.is_system ? "secondary" : "outline"}>
                        {template.is_system ? "System" : "Org"}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="xl:col-span-3">
              <CardHeader>
                <CardTitle>Template Utilization</CardTitle>
                <CardDescription>
                  Render output counts by media category in this workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-muted-foreground">Completed image renders</span>
                  <span className="font-medium">{completedGraphics}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-muted-foreground">Completed video renders</span>
                  <span className="font-medium">{completedAnimations}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-muted-foreground">Queued or processing</span>
                  <span className="font-medium">{queuedJobs.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-5">
            <Card className="xl:col-span-3">
              <CardHeader>
                <CardTitle>Smart Link Analytics</CardTitle>
                <CardDescription>
                  Event-level performance for shared links.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-muted-foreground">Tracked views</span>
                  <span className="font-medium">{data.linkEventStats.views}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-muted-foreground">Tracked clicks</span>
                  <span className="font-medium">{data.linkEventStats.clicks}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-muted-foreground">CTR</span>
                  <span className="font-medium">{linkCtrPercent}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Caption Pipeline</CardTitle>
                <CardDescription>
                  Word-level timestamp status for video testimonials used in animated caption rendering.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-muted-foreground">Ready with word timestamps</span>
                    <span className="font-medium">{data.captionStats.captionReady}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-muted-foreground">Coverage</span>
                    <span className="font-medium">{captionCoveragePercent}%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-muted-foreground">Pending transcription</span>
                    <span className="font-medium">{data.captionStats.captionPending}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-muted-foreground">Failed transcription</span>
                    <span className="font-medium">{data.captionStats.captionFailed}</span>
                  </div>
                </div>
                <p>
                  Provider mode: <span className="font-medium">{captionProviderSummary}</span>
                </p>
                {!data.captionMetricsAvailable ? (
                  <p className="text-xs text-amber-700">
                    Caption stats are temporarily unavailable. The rest of Share Studio remains usable.
                  </p>
                ) : null}
                {data.captionMetricsAvailable && !data.wordTimestampColumnReady ? (
                  <p className="text-xs text-amber-700">
                    Apply migration: <code>20260225000002_word_level_timestamps.sql</code>
                  </p>
                ) : null}
                {canReviewApprovals ? (
                  <Button asChild variant="ghost" className="mt-2 w-full justify-between">
                    <Link href="/dashboard/approvals">
                      Approval queue
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
