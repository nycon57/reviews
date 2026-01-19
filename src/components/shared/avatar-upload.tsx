"use client";

/* eslint-disable no-undef */
// FileReader and Image are browser globals available in client components

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Upload, X, ZoomIn, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  fallbackInitials?: string;
  onUpload: (file: File) => Promise<{ success: boolean; url?: string; error?: string }>;
  onRemove?: () => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function AvatarUpload({
  currentAvatarUrl,
  fallbackInitials = "?",
  onUpload,
  onRemove,
  label = "Profile Photo",
  className,
  disabled = false,
}: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Sync with prop when it changes (e.g., when form loads with existing avatar)
  useEffect(() => {
    if (currentAvatarUrl !== undefined) {
      setAvatarUrl(currentAvatarUrl || null);
    }
  }, [currentAvatarUrl]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCropDialogOpen(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    disabled: disabled || isUploading,
  });

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async (): Promise<File | null> => {
    if (!imageSrc || !croppedAreaPixels) return null;

    const image = new Image();
    image.src = imageSrc;

    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Set output size (256x256 for avatar)
    const outputSize = 256;
    canvas.width = outputSize;
    canvas.height = outputSize;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      outputSize,
      outputSize
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
            resolve(file);
          } else {
            resolve(null);
          }
        },
        "image/jpeg",
        0.9
      );
    });
  };

  const handleCropConfirm = async () => {
    setIsUploading(true);
    try {
      const croppedFile = await createCroppedImage();
      if (!croppedFile) {
        console.error("Failed to create cropped image");
        return;
      }

      const result = await onUpload(croppedFile);
      if (result.success && result.url) {
        setAvatarUrl(result.url);
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
      setCropDialogOpen(false);
      setImageSrc(null);
    }
  };

  const handleCropCancel = () => {
    setCropDialogOpen(false);
    setImageSrc(null);
  };

  const handleRemove = () => {
    setAvatarUrl(null);
    onRemove?.();
  };

  const hasImage = !!avatarUrl;

  return (
    <>
      <div className={cn("space-y-2", className)}>
        {/* Label */}
        <label className="text-sm font-medium text-foreground">{label}</label>

        {hasImage ? (
          /* Photo with X button */
          <div className="relative w-24 h-24">
            <Avatar className="h-24 w-24 border-2 border-border">
              <AvatarImage src={avatarUrl} alt={label} />
              <AvatarFallback className="text-xl bg-repwell-sage-100 text-repwell-teal-300 font-semibold">
                {fallbackInitials}
              </AvatarFallback>
            </Avatar>
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 transition-colors"
                aria-label="Remove photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ) : (
          /* Drop zone */
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer transition-colors",
              "hover:border-repwell-teal-300 hover:bg-repwell-sage-100/50",
              isDragActive && "border-repwell-teal-300 bg-repwell-sage-100",
              (disabled || isUploading) && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-repwell-teal-400 animate-spin" />
              ) : (
                <Upload className="h-8 w-8 text-repwell-teal-400" />
              )}
              {isDragActive ? (
                <p className="text-sm text-repwell-teal-300 font-medium">Drop image here...</p>
              ) : (
                <>
                  <p className="text-sm text-repwell-teal-400">
                    <span className="font-medium text-repwell-teal-500">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG or WebP (max 5MB)</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crop your photo</DialogTitle>
            <DialogDescription>
              Drag to reposition and use the slider to zoom. The image will be cropped to a square.
            </DialogDescription>
          </DialogHeader>

          {/* Crop area */}
          <div className="relative h-64 w-full bg-black rounded-lg overflow-hidden">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                cropShape="round"
                showGrid={false}
              />
            )}
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-4 px-2">
            <ZoomIn className="h-4 w-4 text-repwell-teal-400 flex-shrink-0" />
            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={1}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <span className="text-sm text-repwell-teal-400 w-12 text-right">{zoom.toFixed(1)}x</span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCropCancel}
              disabled={isUploading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handleCropConfirm}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Save photo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
