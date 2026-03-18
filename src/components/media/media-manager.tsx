"use client";

import { useState, useCallback, useRef, useMemo, type MutableRefObject } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadSimple,
  ImageSquare,
  Buildings,
  Users,
  MapPin,
  FolderOpen,
  MagnifyingGlass,
  Copy,
  Trash,
  X,
} from "@phosphor-icons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  uploadMediaAsset,
  deleteMediaAsset,
} from "@/lib/media/actions";
import { MEDIA_ACCEPT, MEDIA_MAX_SIZE, MEDIA_ACCEPT_STRING } from "@/lib/media/constants";
import type {
  MediaLibraryData,
  MediaAsset,
  MediaItem,
  MediaStats,
} from "@/lib/media/actions";
import { MediaGridItem } from "./media-grid-item";
import { formatDate } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UnifiedItem =
  | { kind: "upload"; asset: MediaAsset }
  | { kind: "brand" | "team" | "location"; item: MediaItem };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ---------------------------------------------------------------------------
// Asset Detail Panel
// ---------------------------------------------------------------------------

function AssetDetailPanel({
  item,
  onClose,
  onDelete,
}: {
  item: UnifiedItem;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const { toast } = useToast();
  const url = item.kind === "upload" ? item.asset.url : item.item.url;
  const label =
    item.kind === "upload" ? item.asset.filename : item.item.label;

  function copyUrl() {
    navigator.clipboard.writeText(url);
    toast({ title: "URL copied to clipboard" });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold">Asset Details</h3>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onClose}>
          <X size={14} />
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border bg-muted/30">
        <img
          src={url}
          alt={label}
          className="mx-auto max-h-48 object-contain p-2"
        />
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        <dt className="text-muted-foreground">Filename</dt>
        <dd className="truncate font-medium">{label}</dd>

        {item.kind === "upload" && (
          <>
            <dt className="text-muted-foreground">Type</dt>
            <dd>{item.asset.content_type}</dd>
            <dt className="text-muted-foreground">Size</dt>
            <dd>{formatBytes(item.asset.size_bytes)}</dd>
            <dt className="text-muted-foreground">Uploaded</dt>
            <dd>{formatDate(item.asset.created_at)}</dd>
          </>
        )}

        {item.kind !== "upload" && (
          <>
            <dt className="text-muted-foreground">Category</dt>
            <dd className="capitalize">{item.kind}</dd>
          </>
        )}
      </dl>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs"
          onClick={copyUrl}
        >
          <Copy size={12} className="mr-1.5" />
          Copy URL
        </Button>
        {onDelete && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={onDelete}
          >
            <Trash size={12} className="mr-1.5" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Media Manager (admin page client component)
// ---------------------------------------------------------------------------

interface MediaManagerProps {
  initialData: MediaLibraryData;
  initialStats: MediaStats;
}

export function MediaManager({ initialData, initialStats }: MediaManagerProps) {
  const [data, setData] = useState(initialData);
  const [stats, setStats] = useState(initialStats);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<UnifiedItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const uploadCountRef = useRef(0) as MutableRefObject<number>;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Drag & drop upload zone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: MEDIA_ACCEPT,
    maxSize: MEDIA_MAX_SIZE,
    multiple: true,
    noClick: true,
    onDrop: (accepted) => {
      for (const file of accepted) handleUpload(file);
    },
    onDropRejected: (rejections) => {
      const msg = rejections[0]?.errors[0]?.code === "file-too-large"
        ? "File too large (max 5MB)"
        : "Invalid file type";
      toast({ title: "Upload rejected", description: msg, variant: "destructive" });
    },
  });

  const handleUpload = useCallback(
    async (file: File) => {
      uploadCountRef.current += 1;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const result = await uploadMediaAsset(formData);
        const newAsset: MediaAsset = {
          id: result.assetId,
          organization_id: "",
          uploaded_by: null,
          filename: file.name,
          url: result.url,
          content_type: file.type,
          size_bytes: file.size,
          category: "upload",
          created_at: new Date().toISOString(),
        };
        setData((prev) => ({
          ...prev,
          uploads: [newAsset, ...prev.uploads],
        }));
        setStats((prev) => ({
          totalAssets: prev.totalAssets + 1,
          totalSizeBytes: prev.totalSizeBytes + file.size,
        }));
        toast({ title: "Image uploaded" });
      } catch (err) {
        toast({
          title: "Upload failed",
          description: err instanceof Error ? err.message : "Could not upload.",
          variant: "destructive",
        });
      } finally {
        uploadCountRef.current -= 1;
        if (uploadCountRef.current <= 0) {
          uploadCountRef.current = 0;
          setUploading(false);
        }
      }
    },
    [toast]
  );

  async function handleDelete(asset: MediaAsset) {
    try {
      await deleteMediaAsset(asset.id);
      setData((prev) => ({
        ...prev,
        uploads: prev.uploads.filter((a) => a.id !== asset.id),
      }));
      setStats((prev) => ({
        totalAssets: Math.max(0, prev.totalAssets - 1),
        totalSizeBytes: Math.max(0, prev.totalSizeBytes - asset.size_bytes),
      }));
      if (
        selectedItem?.kind === "upload" &&
        selectedItem.asset.id === asset.id
      ) {
        setSelectedItem(null);
      }
      toast({ title: "Asset deleted" });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Could not delete.",
        variant: "destructive",
      });
    }
  }

  // Build unified list for "All" tab (memoized to avoid recreation on every render)
  const allItems = useMemo<UnifiedItem[]>(
    () => [
      ...data.brand.map((item): UnifiedItem => ({ kind: "brand", item })),
      ...data.team.map((item): UnifiedItem => ({ kind: "team", item })),
      ...data.locations.map((item): UnifiedItem => ({ kind: "location", item })),
      ...data.uploads.map((asset): UnifiedItem => ({ kind: "upload", asset })),
    ],
    [data]
  );

  // Filtered items (memoized)
  const lowerSearch = search.toLowerCase();

  function getItemKey(item: UnifiedItem, i: number): string {
    return item.kind === "upload"
      ? item.asset.id
      : `${item.kind}-${item.item.url}-${i}`;
  }

  function isItemSelected(item: UnifiedItem): boolean {
    if (!selectedItem) return false;
    if (selectedItem.kind === "upload" && item.kind === "upload")
      return selectedItem.asset.id === item.asset.id;
    if (selectedItem.kind !== "upload" && item.kind !== "upload")
      return selectedItem.item.url === item.item.url;
    return false;
  }

  const KIND_LABELS: Record<UnifiedItem["kind"], string> = {
    upload: "Upload",
    brand: "Brand",
    team: "Team",
    location: "Location",
  };

  function renderFilteredGrid(items: UnifiedItem[]) {
    const filtered = search
      ? items.filter((item) => {
          const text =
            item.kind === "upload"
              ? item.asset.filename
              : item.item.label;
          return text.toLowerCase().includes(lowerSearch);
        })
      : items;

    if (filtered.length === 0) {
      return (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
          <ImageSquare size={32} />
          <p className="text-sm">
            {search ? "No matching images" : "No images in this category"}
          </p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {filtered.map((item, i) => {
          const url = item.kind === "upload" ? item.asset.url : item.item.url;
          const label =
            item.kind === "upload" ? item.asset.filename : item.item.label;
          return (
            <MediaGridItem
              key={getItemKey(item, i)}
              url={url}
              label={label}
              sublabel={KIND_LABELS[item.kind]}
              isSelected={isItemSelected(item)}
              onSelect={() => setSelectedItem(item)}
              onDelete={
                item.kind === "upload"
                  ? () => handleDelete(item.asset)
                  : undefined
              }
            />
          );
        })}
      </div>
    );
  }

  const totalAllCount =
    data.brand.length +
    data.team.length +
    data.locations.length +
    data.uploads.length;

  return (
    <div {...getRootProps()} className="relative">
      <input {...getInputProps()} />

      {/* Drag overlay */}
      {isDragActive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-xl border-2 border-dashed border-repwell-teal-300 bg-repwell-teal-300/5 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <UploadSimple size={32} className="text-repwell-teal-400" />
            <p className="text-sm font-medium text-repwell-teal-400">
              Drop images to upload
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Main content */}
        <div className="flex-1 space-y-4">
          {/* Search + Upload bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <MagnifyingGlass
                size={16}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search images..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <UploadSimple size={16} className="mr-1.5" />
              {uploading ? "Uploading..." : "Upload"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept={MEDIA_ACCEPT_STRING}
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                if (files) {
                  for (const file of Array.from(files)) handleUpload(file);
                }
                e.target.value = "";
              }}
            />
          </div>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all" className="gap-1.5">
                All
                <span className="text-[10px] text-muted-foreground">
                  {totalAllCount}
                </span>
              </TabsTrigger>
              <TabsTrigger value="brand" className="gap-1.5">
                <Buildings size={14} />
                Brand
                <span className="text-[10px] text-muted-foreground">
                  {data.brand.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="team" className="gap-1.5">
                <Users size={14} />
                Team
                <span className="text-[10px] text-muted-foreground">
                  {data.team.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="locations" className="gap-1.5">
                <MapPin size={14} />
                Locations
                <span className="text-[10px] text-muted-foreground">
                  {data.locations.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="uploads" className="gap-1.5">
                <FolderOpen size={14} />
                Uploads
                <span className="text-[10px] text-muted-foreground">
                  {data.uploads.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              {renderFilteredGrid(allItems)}
            </TabsContent>
            <TabsContent value="brand" className="mt-4">
              {renderFilteredGrid(
                data.brand.map((item): UnifiedItem => ({ kind: "brand", item }))
              )}
            </TabsContent>
            <TabsContent value="team" className="mt-4">
              {renderFilteredGrid(
                data.team.map((item): UnifiedItem => ({ kind: "team", item }))
              )}
            </TabsContent>
            <TabsContent value="locations" className="mt-4">
              {renderFilteredGrid(
                data.locations.map(
                  (item): UnifiedItem => ({ kind: "location", item })
                )
              )}
            </TabsContent>
            <TabsContent value="uploads" className="mt-4">
              {renderFilteredGrid(
                data.uploads.map(
                  (asset): UnifiedItem => ({ kind: "upload", asset })
                )
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Detail sidebar */}
        {selectedItem && (
          <div className="w-full lg:w-72">
            <AssetDetailPanel
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onDelete={
                selectedItem.kind === "upload"
                  ? () => handleDelete(selectedItem.asset)
                  : undefined
              }
            />
          </div>
        )}
      </div>

      {/* Stats footer */}
      <div className="mt-6 border-t pt-3 text-xs text-muted-foreground">
        {stats.totalAssets} uploaded asset{stats.totalAssets !== 1 ? "s" : ""}{" "}
        &middot; {formatBytes(stats.totalSizeBytes)} used
      </div>
    </div>
  );
}
