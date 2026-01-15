"use client";

import { useState, useCallback } from "react";
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
import { Camera, Upload, X, ZoomIn, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  fallbackInitials?: string;
  onUpload: (file: File) => Promise<{ success: boolean; url?: string; error?: string }>;
  className?: string;
  disabled?: boolean;
}

export function AvatarUpload({
  currentAvatarUrl,
  fallbackInitials = "?",
  onUpload,
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

  return (
    <>
      <div className={cn("flex items-center gap-4", className)}>
        {/* Avatar preview */}
        <div className="relative group">
          <Avatar className="h-20 w-20 border-2 border-brand-silver">
            <AvatarImage src={avatarUrl || undefined} alt="Profile photo" />
            <AvatarFallback className="text-lg bg-brand-frost text-brand-blue font-semibold">
              {fallbackInitials}
            </AvatarFallback>
          </Avatar>

          {/* Overlay on hover */}
          <div
            {...getRootProps()}
            className={cn(
              "absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer",
              isDragActive && "opacity-100 bg-brand-blue/50",
              (disabled || isUploading) && "cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </div>
        </div>

        {/* Upload area */}
        <div className="flex-1">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed border-brand-silver rounded-lg p-4 text-center cursor-pointer transition-colors",
              "hover:border-brand-blue hover:bg-brand-frost/50",
              isDragActive && "border-brand-blue bg-brand-frost",
              (disabled || isUploading) && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-6 w-6 text-brand-slate" />
              {isDragActive ? (
                <p className="text-sm text-brand-blue font-medium">Drop image here...</p>
              ) : (
                <>
                  <p className="text-sm text-brand-slate">
                    <span className="font-medium text-brand-navy">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-brand-slate">PNG, JPG or WebP (max 5MB)</p>
                </>
              )}
            </div>
          </div>
        </div>
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
            <ZoomIn className="h-4 w-4 text-brand-slate flex-shrink-0" />
            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={1}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <span className="text-sm text-brand-slate w-12 text-right">{zoom.toFixed(1)}x</span>
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
              variant="brand"
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
