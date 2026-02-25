import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
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
    "Create Smart Links, brand-aligned graphics, and rendered animations from one unified proof model.",
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
      imageJobs: [] as Record<string, unknown>[],
      videoJobs: [] as Record<string, unknown>[],
      pendingApprovals: 0,
    };
  }

  const [itemsResult, templatesResult, linksResult, jobsResult, pendingResult] =
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
        .from("proof_items")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "pending_approval"),
    ]);

  if (linksResult.error) {
    console.error("[ShareStudio] Smart Links query failed:", linksResult.error);
    throw new Error("Failed to load Smart Links");
  }

  if (jobsResult.error) {
    console.error("[ShareStudio] Render jobs query failed:", jobsResult.error);
    throw new Error("Failed to load render jobs");
  }

  if (pendingResult.error) {
    console.error("[ShareStudio] Approval counts query failed:", pendingResult.error);
    throw new Error("Failed to load approval counts");
  }

  const jobs = (jobsResult.data || []) as Record<string, unknown>[];

  return {
    ctx,
    organizationId,
    schemaReady: true,
    items: itemsResult.items,
    totalItems: itemsResult.total,
    templates: templatesResult,
    links: (linksResult.data || []) as Record<string, unknown>[],
    imageJobs: jobs.filter((job) => job.asset_type === "image"),
    videoJobs: jobs.filter((job) => job.asset_type === "video"),
    pendingApprovals: pendingResult.count || 0,
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

  return (
    <div className="flex-1 space-y-6">
      <div className="relative overflow-hidden rounded-2xl border bg-card p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.15),transparent_55%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <Sparkle className="h-3.5 w-3.5" />
              Share Studio
            </p>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
              Turn customer proof into share-ready assets
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Build Smart Links, branded graphics, and motion-ready animations from the same proof item source.
            </p>
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
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Smart Links</CardDescription>
            <CardTitle className="text-2xl">{publishedLinks}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {data.links.length} total links connected to your proof library.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Graphics</CardDescription>
            <CardTitle className="text-2xl">{completedGraphics}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {data.imageJobs.length} image renders across reusable templates.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Animations</CardDescription>
            <CardTitle className="text-2xl">{completedAnimations}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {data.videoJobs.length} Remotion video renders in queue or completed.
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="smart-links" className="space-y-4">
        <TabsList className="grid w-full max-w-xl grid-cols-3">
          <TabsTrigger value="smart-links">Smart Links</TabsTrigger>
          <TabsTrigger value="graphics">Graphics</TabsTrigger>
          <TabsTrigger value="animations">Animations</TabsTrigger>
        </TabsList>

        <TabsContent value="smart-links" className="space-y-4">
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

        <TabsContent value="graphics" className="space-y-4">
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
                <CardTitle>Graphics Render Queue</CardTitle>
                <CardDescription>
                  Track square, story, and OG-size exports generated from approved proof items.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.imageJobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No graphics queued yet. Render a template from a proof item to start this queue.
                  </p>
                ) : (
                  data.imageJobs.map((job) => (
                    <div key={String(job.id)} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{String(job.asset_type)} render</p>
                          <p className="text-xs text-muted-foreground">
                            {String(job.id)} · {formatShortDate(job.created_at)}
                          </p>
                        </div>
                        {statusBadge(String(job.status || "queued"))}
                      </div>
                      {job.error_message ? (
                        <p className="mt-2 text-xs text-red-600">{String(job.error_message)}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="animations" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-5">
            <Card className="xl:col-span-3">
              <CardHeader>
                <CardTitle>Animation Render Queue</CardTitle>
                <CardDescription>
                  Remotion-powered MP4 generation using the same brand templates as graphics.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.videoJobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No animations queued yet. Trigger an animation render from an approved proof item.
                  </p>
                ) : (
                  data.videoJobs.map((job) => (
                    <div key={String(job.id)} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">MP4 animation</p>
                          <p className="text-xs text-muted-foreground">
                            {String(job.id)} · {formatShortDate(job.created_at)}
                          </p>
                        </div>
                        {statusBadge(String(job.status || "queued"))}
                      </div>
                      {job.error_message ? (
                        <p className="mt-2 text-xs text-red-600">{String(job.error_message)}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Coming Next</CardTitle>
                <CardDescription>
                  Planned fourth tab: captured client video reviews wrapped in branded Remotion templates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  This release keeps the creation surface focused on Smart Links, Graphics, and Animations so users
                  can learn one predictable workflow.
                </p>
                <p>
                  The next phase can layer in direct video uploads without changing template logic or brand token
                  resolution.
                </p>
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
