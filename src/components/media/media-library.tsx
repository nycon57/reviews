"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  UploadSimple,
  ImageSquare,
  Buildings,
  Users,
  MapPin,
  FolderOpen,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  getMediaLibraryData,
  uploadMediaAsset,
  deleteMediaAsset,
} from "@/lib/media/actions";
import { MEDIA_ACCEPT_STRING } from "@/lib/media/constants";
import type { MediaLibraryData, MediaAsset, MediaItem } from "@/lib/media/actions";
import { MediaGridItem } from "./media-grid-item";

// ---------------------------------------------------------------------------
// Shared grid components
// ---------------------------------------------------------------------------

function MediaGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid max-h-96 grid-cols-3 gap-2 overflow-y-auto pr-1">
      {children}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: React.ElementType;
  message: string;
}) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
      <Icon size={32} />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MediaLibrary — Picker Dialog
// ---------------------------------------------------------------------------

interface MediaLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}

export function MediaLibrary({ open, onOpenChange, onSelect }: MediaLibraryProps) {
  const [data, setData] = useState<MediaLibraryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState("uploads");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMediaLibraryData();
      setData(result);
    } catch {
      setData({ brand: [], team: [], locations: [], uploads: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data when dialog opens
  useEffect(() => {
    if (open) loadData();
  }, [open, loadData]);

  function handleSelect(url: string) {
    onSelect(url);
    onOpenChange(false);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadMediaAsset(formData);
      handleSelect(result.url);
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Could not upload image.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(asset: MediaAsset) {
    try {
      await deleteMediaAsset(asset.id);
      setData((prev) =>
        prev
          ? { ...prev, uploads: prev.uploads.filter((a) => a.id !== asset.id) }
          : prev
      );
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Could not delete.",
        variant: "destructive",
      });
    }
  }

  function renderMediaItems(items: MediaItem[], emptyMsg: string, emptyIcon: React.ElementType) {
    if (items.length === 0)
      return <EmptyState icon={emptyIcon} message={emptyMsg} />;
    return (
      <MediaGrid>
        {items.map((item, i) => (
          <MediaGridItem
            key={`${item.url}-${i}`}
            url={item.url}
            label={item.label}
            sublabel={item.type}
            onSelect={() => handleSelect(item.url)}
          />
        ))}
      </MediaGrid>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full">
              <TabsTrigger value="uploads" className="flex-1 gap-1.5">
                <FolderOpen size={14} />
                Uploads
              </TabsTrigger>
              <TabsTrigger value="brand" className="flex-1 gap-1.5">
                <Buildings size={14} />
                Brand
              </TabsTrigger>
              <TabsTrigger value="team" className="flex-1 gap-1.5">
                <Users size={14} />
                Team
              </TabsTrigger>
              <TabsTrigger value="locations" className="flex-1 gap-1.5">
                <MapPin size={14} />
                Locations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="uploads" className="mt-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {data?.uploads.length ?? 0} image
                  {(data?.uploads.length ?? 0) !== 1 ? "s" : ""}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <UploadSimple size={14} className="mr-1.5" />
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={MEDIA_ACCEPT_STRING}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                    e.target.value = "";
                  }}
                />
              </div>
              {!data?.uploads.length ? (
                <EmptyState
                  icon={ImageSquare}
                  message="No images uploaded yet"
                />
              ) : (
                <MediaGrid>
                  {data.uploads.map((asset) => (
                    <MediaGridItem
                      key={asset.id}
                      url={asset.url}
                      label={asset.filename}
                      sublabel="Upload"
                      onSelect={() => handleSelect(asset.url)}
                      onDelete={() => handleDelete(asset)}
                    />
                  ))}
                </MediaGrid>
              )}
            </TabsContent>

            <TabsContent value="brand" className="mt-3">
              {renderMediaItems(
                data?.brand ?? [],
                "No brand images found. Add a logo or banner in Organization settings.",
                Buildings
              )}
            </TabsContent>

            <TabsContent value="team" className="mt-3">
              {renderMediaItems(
                data?.team ?? [],
                "No team photos found. Team members can add photos in their profiles.",
                Users
              )}
            </TabsContent>

            <TabsContent value="locations" className="mt-3">
              {renderMediaItems(
                data?.locations ?? [],
                "No location images found. Add photos in branch settings.",
                MapPin
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
