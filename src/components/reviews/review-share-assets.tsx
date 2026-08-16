"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowSquareOut,
  Clock,
  Copy,
  DownloadSimple,
  Eye,
  LinkSimple,
  Package,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  getShareAssetsForReviewSource,
  getShareAssetsForVideoSource,
} from "@/lib/share-studio/actions";
import { toast } from "@/hooks/use-toast";

type ShareSourceType = "review" | "video_testimonial";

type ShareAssetsPayload = {
  item: Record<string, unknown> | null;
  links: Record<string, unknown>[];
  assets: Record<string, unknown>[];
  jobs: Record<string, unknown>[];
} | null;

interface ReviewShareAssetsProps {
  sourceType: ShareSourceType;
  sourceId: string;
  refreshToken?: number;
  className?: string;
}

function formatDate(value: unknown): string {
  if (typeof value !== "string") return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusBadge(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "completed" || normalized === "published") {
    return <Badge className="bg-emerald-600">Completed</Badge>;
  }
  if (normalized === "processing" || normalized === "queued") {
    return <Badge className="bg-amber-600">In Queue</Badge>;
  }
  if (normalized === "failed" || normalized === "canceled") {
    return <Badge variant="destructive">Failed</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
}

function getAssetLabel(value: unknown): string {
  if (typeof value !== "string") return "Asset";
  if (value === "smart_link_og") return "Smart Link OG";
  if (value === "video") return "Video";
  if (value === "image") return "Image";
  return value;
}

export function ReviewShareAssets({
  sourceType,
  sourceId,
  refreshToken,
  className,
}: ReviewShareAssetsProps) {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<ShareAssetsPayload>(null);
  const [previewAsset, setPreviewAsset] = useState<{ url: string; label: string } | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAssets = useCallback(async () => {
    const data =
      sourceType === "review"
        ? await getShareAssetsForReviewSource(sourceId)
        : await getShareAssetsForVideoSource(sourceId);
    return data;
  }, [sourceId, sourceType]);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      setLoading(true);
      const data = await fetchAssets();
      if (isCancelled) return;
      setPayload(data);
      setLoading(false);
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, [fetchAssets, refreshToken]);

  // Poll every 5s while there are pending jobs
  useEffect(() => {
    const hasPending = (payload?.jobs ?? []).some((job) => {
      const status = String(job.status ?? "");
      return status === "queued" || status === "processing";
    });

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    if (!hasPending) return;

    pollingRef.current = setInterval(() => {
      void fetchAssets().then((data) => {
        if (data) setPayload(data);
      });
    }, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [payload, fetchAssets]);

  const activeLink = useMemo(() => {
    const links = payload?.links ?? [];
    return links.find((link) => !link.archived_at) ?? links[0] ?? null;
  }, [payload]);

  const smartLinkUrl = useMemo(() => {
    if (!activeLink?.slug || typeof window === "undefined") return null;
    return `${window.location.origin}/s/${String(activeLink.slug)}`;
  }, [activeLink]);

  const pendingJobs = useMemo(() => {
    const jobs = payload?.jobs ?? [];
    return jobs
      .filter((job) => {
        const status = String(job.status ?? "");
        return status !== "completed";
      })
      .sort((a, b) =>
        String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
      );
  }, [payload]);

  const recentAssets = useMemo(() => {
    const assets = payload?.assets ?? [];
    return assets
      .slice()
      .sort((a, b) =>
        String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
      )
      .slice(0, 6);
  }, [payload]);

  const copySmartLink = async () => {
    if (!smartLinkUrl) return;
    try {
      await navigator.clipboard.writeText(smartLinkUrl);
      toast({ title: "Smart Link copied" });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy the Smart Link.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={cn("border border-border shadow-soft overflow-hidden", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="rounded-xl bg-repwell-teal-300/10 p-1.5">
            <Package className="h-4 w-4 text-repwell-teal-300" weight="duotone" />
          </div>
          Share Assets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {loading ? (
          <div className="space-y-2">
            <div className="h-10 animate-pulse rounded-md bg-muted" />
            <div className="h-20 animate-pulse rounded-md bg-muted" />
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <LinkSimple className="h-4 w-4 text-repwell-teal-300" weight="duotone" />
                  Smart Link
                </div>
                {activeLink ? (
                  statusBadge(activeLink.published ? "published" : "draft")
                ) : (
                  <Badge variant="secondary">Not created</Badge>
                )}
              </div>
              {smartLinkUrl ? (
                <div className="flex flex-wrap items-center gap-2">
                  <code className="max-w-full truncate rounded bg-muted px-2 py-1 text-xs">
                    {smartLinkUrl}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => void copySmartLink()}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() =>
                      window.open(smartLinkUrl, "_blank", "noopener,noreferrer")
                    }
                  >
                    <ArrowSquareOut className="h-3.5 w-3.5" />
                    Open
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Create a Smart Link above to activate share assets.
                </p>
              )}
            </div>

            {pendingJobs.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Queue
                </p>
                {pendingJobs.slice(0, 4).map((job) => (
                  <div
                    key={String(job.id)}
                    className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {getAssetLabel(job.asset_type)} render
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <Clock className="mr-1 inline h-3 w-3" />
                        {formatDate(job.created_at)}
                      </p>
                    </div>
                    {statusBadge(String(job.status || "queued"))}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Recent Assets
              </p>
              {recentAssets.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No rendered assets yet.
                </p>
              ) : (
                recentAssets.map((asset) => {
                  const assetUrl = asset.asset_url
                    ? String(asset.asset_url)
                    : null;
                  const label = getAssetLabel(asset.asset_type);
                  return (
                    <div
                      key={String(asset.id)}
                      className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(asset.created_at)}
                        </p>
                      </div>
                      {assetUrl ? (
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => setPreviewAsset({ url: assetUrl, label })}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            asChild
                          >
                            <a
                              href={assetUrl}
                              download
                              aria-label={`Download ${label} asset from ${formatDate(asset.created_at)}`}
                            >
                              <DownloadSimple className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="secondary">Unavailable</Badge>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </CardContent>

      {/* Asset preview modal */}
      <Dialog open={!!previewAsset} onOpenChange={(open) => !open && setPreviewAsset(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewAsset?.label ?? "Asset"} Preview</DialogTitle>
          </DialogHeader>
          {previewAsset?.url && (
            <div className="flex flex-col items-center gap-4">
              {previewAsset.url.endsWith(".mp4") ? (
                <video
                  src={previewAsset.url}
                  controls
                  className="max-h-[70vh] w-full rounded-lg"
                />
              ) : (
                <img
                  src={previewAsset.url}
                  alt={previewAsset.label}
                  className="max-h-[70vh] w-full rounded-lg object-contain"
                />
              )}
              <Button asChild variant="outline" className="gap-1.5">
                <a href={previewAsset.url} download aria-label={`Download ${previewAsset.label} asset`}>
                  <DownloadSimple className="h-4 w-4" />
                  Download
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
