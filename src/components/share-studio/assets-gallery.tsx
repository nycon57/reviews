"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Copy,
  DownloadSimple,
  FilmSlate,
  ImageSquare,
  LinkSimple,
  Trash,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { deleteShareStudioAsset } from "@/lib/share-studio/actions";
import type {
  ShareStudioAssetFilter,
  ShareStudioAssetRow,
  ShareStudioAssetsResult,
} from "@/lib/share-studio/hub-types";
import { absoluteUrl } from "@/lib/share-studio/url";
import { formatDate } from "@/lib/utils";

interface AssetsGalleryProps {
  initialData: ShareStudioAssetsResult;
  basePath: string;
}

const TYPE_LABELS: Record<ShareStudioAssetFilter, string> = {
  all: "All assets",
  image: "Images",
  video: "Videos",
};

function assetLabel(asset: ShareStudioAssetRow): string {
  if (asset.assetType === "video") return "Video clip";
  if (asset.assetType === "smart_link_og") return "OG image";
  return "Image";
}

function sourceLabel(asset: ShareStudioAssetRow): string {
  if (asset.source?.sourceType === "video_testimonial") return "Video";
  if (asset.source?.sourceType === "review") return "Review";
  return "Source";
}

export function AssetsGallery({ initialData, basePath }: AssetsGalleryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [assetToDelete, setAssetToDelete] = useState<ShareStudioAssetRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const pushType = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "assets");
    if (type === "all") {
      params.delete("assetType");
    } else {
      params.set("assetType", type);
    }
    params.delete("assetPage");
    router.push(`${basePath}?${params.toString()}`, { scroll: false });
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "assets");
    if (page <= 1) {
      params.delete("assetPage");
    } else {
      params.set("assetPage", String(page));
    }
    router.push(`${basePath}?${params.toString()}`, { scroll: false });
  };

  const copyShareLink = async (asset: ShareStudioAssetRow) => {
    const link = asset.source?.smartLinkUrlPath
      ? absoluteUrl(asset.source.smartLinkUrlPath)
      : asset.assetUrl;
    try {
      await navigator.clipboard.writeText(link);
      toast({ title: "Share link copied" });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy the share link.",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = () => {
    if (!assetToDelete) return;
    const assetId = assetToDelete.id;

    startTransition(async () => {
      const result = await deleteShareStudioAsset(assetId);
      if (!result.success) {
        toast({
          title: "Delete failed",
          description: result.error || "Could not delete the asset.",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Asset deleted" });
      setAssetToDelete(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-heading">Rendered assets</h2>
          <p className="text-sm text-muted-foreground">
            Completed image and video outputs across the organization.
          </p>
        </div>
        <Select value={initialData.type} onValueChange={pushType}>
          <SelectTrigger className="w-[170px]" aria-label="Filter share assets">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {initialData.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-repwell-sage-100/10 p-10 text-center">
          <ImageSquare className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
          <p className="font-medium text-heading">No rendered assets yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Completed quote cards and video clips will appear here after they render.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {initialData.items.map((asset) => (
            <div
              key={asset.id}
              className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft"
            >
              <div className="relative aspect-video bg-muted">
                {asset.assetType === "video" ? (
                  <video
                    src={asset.assetUrl}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <Image
                    loader={({ src }) => src}
                    unoptimized
                    src={asset.assetUrl}
                    alt={assetLabel(asset)}
                    fill
                    sizes="(min-width: 1536px) 25vw, (min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                )}
                <Badge className="absolute left-3 top-3 bg-background/90 text-heading backdrop-blur">
                  {asset.assetType === "video" ? (
                    <FilmSlate className="mr-1 h-3 w-3" />
                  ) : (
                    <ImageSquare className="mr-1 h-3 w-3" />
                  )}
                  {assetLabel(asset)}
                </Badge>
              </div>

              <div className="space-y-4 p-4">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="outline">{sourceLabel(asset)}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(asset.createdAt, "Unknown")}
                    </span>
                  </div>
                  <p className="truncate font-medium text-heading">
                    {asset.source?.customerName ||
                      asset.source?.title ||
                      "Untitled source"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {asset.width && asset.height
                      ? `${asset.width} x ${asset.height}`
                      : asset.mimeType || "Rendered asset"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild size="sm" variant="outline" className="gap-1.5">
                    <a href={asset.assetUrl} download>
                      <DownloadSimple className="h-3.5 w-3.5" />
                      Download
                    </a>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => void copyShareLink(asset)}
                  >
                    {asset.source?.smartLinkUrlPath ? (
                      <LinkSimple className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Copy
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="ml-auto gap-1.5"
                    onClick={() => setAssetToDelete(asset)}
                  >
                    <Trash className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing page {initialData.page} of {initialData.totalPages} ·{" "}
          {initialData.total.toLocaleString()} asset
          {initialData.total === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={initialData.page <= 1}
            onClick={() => goToPage(initialData.page - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={initialData.page >= initialData.totalPages}
            onClick={() => goToPage(initialData.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <AlertDialog open={!!assetToDelete} onOpenChange={(open) => !open && setAssetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this rendered asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the asset record and its file from Share Studio storage.
              The source review or video and Smart Link stay intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                confirmDelete();
              }}
            >
              Delete asset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
