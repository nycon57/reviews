import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ClipboardText,
  ClockClockwise,
} from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireEnterpriseManager } from "@/lib/access";
import { unifiedGetUser } from "@/lib/auth/actions";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { SUPPORT_EMAIL } from "@/lib/brand";
import { EmptyState } from "@/components/shared/empty-state";
import {
  applyProofApprovalAction,
  isShareStudioSchemaReady,
  listProofItems,
} from "@/lib/share-studio/service";

export const metadata = {
  title: "Approvals | RepWell",
  description: "Review and approve material Share Studio edits before publish.",
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

function extractDiffText(payload: Record<string, unknown>): string {
  if (typeof payload.quote === "string" && payload.quote.trim().length > 0) {
    return payload.quote.trim();
  }
  if (typeof payload.summary === "string" && payload.summary.trim().length > 0) {
    return payload.summary.trim();
  }
  if (typeof payload.title === "string" && payload.title.trim().length > 0) {
    return payload.title.trim();
  }
  return "-";
}

function classificationBadge(classification: unknown) {
  const normalized = String(classification || "material").toLowerCase();

  if (normalized === "minor") {
    return <Badge variant="secondary">Minor</Badge>;
  }

  if (normalized === "blocked") {
    return <Badge variant="destructive">Blocked</Badge>;
  }

  return <Badge className="bg-amber-600">Material</Badge>;
}

async function getApprovalData() {
  const ctx = await requireEnterpriseManager();
  const organizationId = ctx.organizationId;
  const schemaReady = await isShareStudioSchemaReady(organizationId);

  if (!schemaReady) {
    return {
      schemaReady: false,
      pending: [] as Record<string, unknown>[],
      latestEditByItem: new Map<string, Record<string, unknown>>(),
      pendingCount: 0,
      materialCount: 0,
      oldestPendingDate: null as string | null,
    };
  }

  const supabase = createUntypedAdminClient();
  const pendingResult = await listProofItems({
    organizationId,
    status: "pending_approval",
    page: 1,
    page_size: 100,
  });

  const pendingIds = pendingResult.items.map((entry) => String(entry.id));

  const editsResult = pendingIds.length
    ? await supabase
        .from("proof_item_edits")
        .select("*")
        .eq("organization_id", organizationId)
        .in("proof_item_id", pendingIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (editsResult.error) {
    throw new Error(editsResult.error.message || "Failed to load approval diffs");
  }

  const latestEditByItem = new Map<string, Record<string, unknown>>();
  for (const edit of (editsResult.data || []) as Record<string, unknown>[]) {
    const proofItemId = String(edit.proof_item_id);
    if (!latestEditByItem.has(proofItemId)) {
      latestEditByItem.set(proofItemId, edit);
    }
  }

  const materialCount = pendingResult.items.reduce((count, item) => {
    const latestEdit = latestEditByItem.get(String(item.id));
    return String(latestEdit?.classification || "material") === "material" ? count + 1 : count;
  }, 0);

  const oldestTimestamp = pendingResult.items.reduce<number | null>((oldest, item) => {
    const candidate = new Date(String(item.updated_at || item.created_at || "")).getTime();
    if (Number.isNaN(candidate)) return oldest;
    if (oldest === null) return candidate;
    return Math.min(oldest, candidate);
  }, null);

  return {
    schemaReady: true,
    pending: pendingResult.items,
    latestEditByItem,
    pendingCount: pendingResult.total,
    materialCount,
    oldestPendingDate: oldestTimestamp ? new Date(oldestTimestamp).toISOString() : null,
  };
}

async function approvalAction(formData: FormData) {
  "use server";

  const user = await unifiedGetUser();
  if (!user) {
    redirect("/login");
  }

  const itemId = String(formData.get("item_id") || "");
  const action = String(formData.get("action") || "");
  const reason = String(formData.get("reason") || "");

  if (!itemId) {
    return;
  }

  if (!["approve", "reject", "request_changes"].includes(action)) {
    return;
  }

  const supabase = createUntypedAdminClient();
  const { data: profile, error } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (error || !profile?.organization_id) {
    redirect("/login");
  }

  if (!["admin", "manager"].includes(String(profile.role))) {
    return;
  }

  await applyProofApprovalAction({
    organizationId: String(profile.organization_id),
    itemId,
    actedBy: user.id,
    action: action as "approve" | "reject" | "request_changes",
    reason: reason || undefined,
  });

  revalidatePath("/dashboard/approvals");
  revalidatePath("/dashboard");
}

export default async function ApprovalsPage() {
  const data = await getApprovalData();

  if (!data.schemaReady) {
    return (
      <div className="flex-1 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Approvals</h1>
          <p className="text-muted-foreground">Share Studio approval queue for material edits.</p>
        </div>

        <Card>
          <CardContent className="p-0">
            <EmptyState
              iconName="ClipboardText"
              title="This feature isn't available yet"
              description="Approval workflows are not enabled for this workspace. Contact support and we'll help you get set up."
              actions={[
                {
                  label: "Contact support",
                  href: `mailto:${SUPPORT_EMAIL}`,
                  iconName: "Envelope",
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <ClipboardText className="h-6 w-6 text-repwell-teal-300" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-heading">Approvals</h1>
            <p className="text-sm leading-snug text-repwell-teal-300">
              Review material edits before Share Studio content can be published.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Items</CardDescription>
            <CardTitle className="text-2xl">{data.pendingCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Items currently blocked from publish.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Material Edits</CardDescription>
            <CardTitle className="text-2xl">{data.materialCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Edits requiring manager/admin review.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Oldest Pending</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <ClockClockwise className="h-5 w-5 text-muted-foreground" />
              {data.oldestPendingDate ? formatShortDate(data.oldestPendingDate) : "None"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Use this to keep turnaround times tight.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approval Queue</CardTitle>
          <CardDescription>
            Side-by-side content diff with classification reason and approval actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.pending.length === 0 ? (
            <EmptyState
              iconName="ClipboardText"
              title="No items awaiting approval"
              description="All pending edits are resolved. New material edits will appear here."
              compact
            />
          ) : (
            data.pending.map((item) => {
              const latestEdit = data.latestEditByItem.get(String(item.id));
              const original = (latestEdit?.original_content as Record<string, unknown> | undefined) || {};
              const edited = (latestEdit?.edited_content as Record<string, unknown> | undefined) || {};

              return (
                <div key={String(item.id)} className="rounded-xl border p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{String(item.title || "Untitled proof item")}</p>
                      <p className="text-xs text-muted-foreground">
                        Updated {formatShortDate(item.updated_at || item.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {classificationBadge(latestEdit?.classification)}
                      <Badge className="bg-amber-600">Pending Approval</Badge>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-md border p-3">
                      <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Original</p>
                      <p className="text-sm">{extractDiffText(original)}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Edited</p>
                      <p className="text-sm">{extractDiffText(edited)}</p>
                    </div>
                  </div>

                  {latestEdit?.classification_reason ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Reason: {String(latestEdit.classification_reason)}
                    </p>
                  ) : null}

                  <form action={approvalAction} className="mt-4 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="item_id" value={String(item.id)} />
                    <Input
                      type="text"
                      name="reason"
                      placeholder="Optional reason"
                      className="h-9 w-60"
                    />
                    <Button type="submit" name="action" value="approve" size="sm">
                      Approve
                    </Button>
                    <Button type="submit" name="action" value="reject" size="sm" variant="destructive">
                      Reject
                    </Button>
                    <Button type="submit" name="action" value="request_changes" size="sm" variant="outline">
                      Request Changes
                    </Button>
                  </form>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
