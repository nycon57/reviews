"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadSimple, ArrowsClockwise, Trash, Images } from "@phosphor-icons/react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { uploadMediaAsset } from "@/lib/media/actions";
import { MediaLibrary } from "@/components/media/media-library";
import { EMAIL_IMAGE_ACCEPT, EMAIL_IMAGE_MAX_SIZE } from "./image-constants";
import { cn } from "@/lib/utils";

interface ImageUploadInputProps {
  label: string;
  value: string | null | undefined;
  onChange: (url: string) => void;
}

export function ImageUploadInput({ label, value, onChange }: ImageUploadInputProps) {
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const { toast } = useToast();

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const result = await uploadMediaAsset(formData);
        onChange(result.url);
      } catch (err) {
        toast({
          title: "Upload failed",
          description: err instanceof Error ? err.message : "Could not upload image.",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    },
    [onChange, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: EMAIL_IMAGE_ACCEPT,
    maxSize: EMAIL_IMAGE_MAX_SIZE,
    multiple: false,
    onDrop: (accepted) => {
      if (accepted[0]) handleUpload(accepted[0]);
    },
    onDropRejected: (fileRejections) => {
      const errorCode = fileRejections[0]?.errors[0]?.code;
      const message =
        errorCode === "file-too-large"
          ? "File is too large. Maximum size is 2MB."
          : errorCode === "file-invalid-type"
          ? "Invalid file type. Allowed: PNG, JPG, GIF, SVG, WebP."
          : "File was rejected. Please try a different file.";
      toast({ title: "Upload rejected", description: message, variant: "destructive" });
    },
  });

  const hasImage = !!value;

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>

      {hasImage ? (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-md border bg-muted/30">
            <img
              src={value}
              alt="Preview"
              className="mx-auto max-h-28 object-contain p-1"
            />
          </div>

          <div className="flex gap-1.5">
            <div {...getRootProps()} className="flex-1">
              <input {...getInputProps()} />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full text-xs"
                disabled={uploading}
              >
                <ArrowsClockwise size={12} className="mr-1" />
                {uploading ? "Uploading..." : "Replace"}
              </Button>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => setLibraryOpen(true)}
            >
              <Images size={12} className="mr-1" />
              Library
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => onChange("")}
            >
              <Trash size={12} />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div
            {...getRootProps()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed px-3 py-5 text-center transition-colors",
              isDragActive
                ? "border-repwell-teal-300 bg-repwell-teal-300/5"
                : "border-muted-foreground/25 hover:border-repwell-teal-300/50"
            )}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <p className="text-xs text-muted-foreground">Uploading...</p>
            ) : (
              <>
                <UploadSimple size={20} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Drop image or <span className="text-repwell-teal-400 underline">browse</span>
                </p>
                <p className="text-[10px] text-muted-foreground/60">
                  PNG, JPG, GIF, SVG, WebP &middot; Max 2MB
                </p>
              </>
            )}
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => setLibraryOpen(true)}
          >
            <Images size={12} className="mr-1.5" />
            Browse library
          </Button>
        </div>
      )}

      <MediaLibrary
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={onChange}
      />
    </div>
  );
}
