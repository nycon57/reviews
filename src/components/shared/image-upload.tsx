"use client";

/* eslint-disable no-undef */
// FileReader and Image are browser globals available in client components

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import NextImage from "next/image";
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
import {
  UploadSimple as Upload,
  Trash,
  MagnifyingGlassPlus as ZoomIn,
  SpinnerGap as Loader2,
  X,
  User,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { extractDominantColor } from "@/lib/utils/color";

// ---------------------------------------------------------------------------
// Variant configuration
// ---------------------------------------------------------------------------

type ImageUploadVariant = "logo" | "avatar" | "banner" | "profile-photo";

interface VariantConfig {
  aspect: number;
  outputWidth: number;
  outputHeight: number;
  maxSizeMB: number;
  allowSvg: boolean;
  cropShape: "round" | "rect";
  cropDialogTitle: string;
  cropDialogDescription: string;
  saveLabel: string;
  successMessage: string;
  removeMessage: string;
  dropHint: string;
  sizeHint: string;
  previewClass: string;
  dropzoneClass: string;
  dialogWidth: string;
}

const VARIANT_CONFIG: Record<ImageUploadVariant, VariantConfig> = {
  logo: {
    aspect: 1,
    outputWidth: 512,
    outputHeight: 512,
    maxSizeMB: 5,
    allowSvg: true,
    cropShape: "rect",
    cropDialogTitle: "Crop your logo",
    cropDialogDescription:
      "Drag to reposition and use the slider to zoom. The image will be cropped to a square.",
    saveLabel: "Save logo",
    successMessage: "Logo has been saved.",
    removeMessage: "Logo has been removed.",
    dropHint: "JPG, PNG, WebP or SVG (max 5MB)",
    sizeHint: "Recommended: 512 x 512px",
    previewClass: "h-32 w-32 rounded-lg",
    dropzoneClass: "h-32",
    dialogWidth: "sm:max-w-md",
  },
  avatar: {
    aspect: 1,
    outputWidth: 256,
    outputHeight: 256,
    maxSizeMB: 5,
    allowSvg: false,
    cropShape: "round",
    cropDialogTitle: "Crop your photo",
    cropDialogDescription:
      "Drag to reposition and use the slider to zoom. The image will be cropped to a circle.",
    saveLabel: "Save photo",
    successMessage: "Photo has been saved.",
    removeMessage: "Photo has been removed.",
    dropHint: "JPG, PNG or WebP (max 5MB)",
    sizeHint: "Recommended: 256 x 256px",
    previewClass: "h-24 w-24 rounded-full",
    dropzoneClass: "h-32",
    dialogWidth: "sm:max-w-md",
  },
  "profile-photo": {
    aspect: 1,
    outputWidth: 256,
    outputHeight: 256,
    maxSizeMB: 5,
    allowSvg: false,
    cropShape: "round",
    cropDialogTitle: "Crop your profile photo",
    cropDialogDescription:
      "Drag to reposition and use the slider to zoom. The image will be cropped to a circle.",
    saveLabel: "Save photo",
    successMessage: "Profile photo has been saved.",
    removeMessage: "Profile photo has been removed.",
    dropHint: "JPG, PNG or WebP (max 5MB)",
    sizeHint: "Recommended: 256 x 256px",
    previewClass: "h-24 w-24 rounded-full",
    dropzoneClass: "h-32",
    dialogWidth: "sm:max-w-md",
  },
  banner: {
    aspect: 3,
    outputWidth: 1200,
    outputHeight: 400,
    maxSizeMB: 10,
    allowSvg: false,
    cropShape: "rect",
    cropDialogTitle: "Crop your cover photo",
    cropDialogDescription:
      "Drag to reposition and use the slider to zoom. The image will be cropped to a 3:1 banner ratio.",
    saveLabel: "Save cover photo",
    successMessage: "Cover photo has been saved.",
    removeMessage: "Cover photo has been removed.",
    dropHint: "JPG, PNG or WebP (max 10MB)",
    sizeHint: "Recommended: 1200 x 400px",
    previewClass: "w-full aspect-[3/1] rounded-lg",
    dropzoneClass: "aspect-[3/1]",
    dialogWidth: "sm:max-w-2xl",
  },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ImageUploadProps {
  variant: ImageUploadVariant;
  currentUrl?: string | null;
  /** Callback to upload the cropped/selected file. */
  onUpload: (file: File) => Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }>;
  /** Callback to remove the current image. Return void for instant local removal. */
  onRemove?: () => Promise<{ success: boolean; error?: string }> | void;
  /** Notified whenever the displayed URL changes (after upload or remove). */
  onChange?: (url: string | null) => void;
  /** Logo variant only: called with the hex color extracted from the image. */
  onColorExtracted?: (color: string) => void;
  /** Avatar/profile-photo variants: initials shown when no image. */
  fallbackInitials?: string;
  /** Optional tint color for logo/avatar preview background. */
  primaryColor?: string;
  /** Label shown above the upload area. */
  label?: string;
  className?: string;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ImageUpload({
  variant,
  currentUrl,
  onUpload,
  onRemove,
  onChange,
  onColorExtracted,
  fallbackInitials = "?",
  primaryColor,
  label,
  className,
  disabled = false,
}: ImageUploadProps) {
  const config = VARIANT_CONFIG[variant];
  const isAvatarLike = variant === "avatar" || variant === "profile-photo";

  const [imageUrl, setImageUrl] = useState<string | null>(currentUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isSvg, setIsSvg] = useState(false);
  const [pendingSvgFile, setPendingSvgFile] = useState<File | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const { toast } = useToast();

  // Sync with external prop
  useEffect(() => {
    if (currentUrl !== undefined) {
      setImageUrl(currentUrl || null);
    }
  }, [currentUrl]);

  // Extract dominant color for logo variant
  useEffect(() => {
    if (variant === "logo" && imageUrl && onColorExtracted) {
      extractDominantColor(imageUrl).then(onColorExtracted);
    }
  }, [variant, imageUrl, onColorExtracted]);

  // -----------------------------------------------------------------------
  // Upload logic
  // -----------------------------------------------------------------------

  const uploadFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const result = await onUpload(file);
        if (result.success && result.url) {
          setImageUrl(result.url);
          onChange?.(result.url);
          toast({ title: "Updated", description: config.successMessage });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to upload image.",
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, onChange, toast, config.successMessage]
  );

  // SVG files skip cropping — upload directly
  useEffect(() => {
    if (isSvg && pendingSvgFile) {
      uploadFile(pendingSvgFile);
      setIsSvg(false);
      setPendingSvgFile(null);
    }
  }, [isSvg, pendingSvgFile, uploadFile]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];

      if (config.allowSvg && file.type === "image/svg+xml") {
        setIsSvg(true);
        setPendingSvgFile(file);
        return;
      }

      setIsSvg(false);
      setPendingSvgFile(null);
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setCropDialogOpen(true);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);
    },
    [config.allowSvg]
  );

  const acceptTypes: Record<string, string[]> = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
  };
  if (config.allowSvg) {
    acceptTypes["image/svg+xml"] = [".svg"];
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptTypes,
    maxSize: config.maxSizeMB * 1024 * 1024,
    multiple: false,
    disabled: disabled || isUploading || isRemoving,
  });

  // -----------------------------------------------------------------------
  // Crop logic
  // -----------------------------------------------------------------------

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const createCroppedImage = async (): Promise<File | null> => {
    if (!imageSrc || !croppedAreaPixels) return null;

    const image = new window.Image();
    image.src = imageSrc;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Failed to load image"));
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = config.outputWidth;
    canvas.height = config.outputHeight;
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      config.outputWidth,
      config.outputHeight
    );

    const ext = variant === "banner" ? "jpeg" : "png";
    const mimeType = variant === "banner" ? "image/jpeg" : "image/png";

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], `${variant}.${ext}`, { type: mimeType }));
          } else {
            resolve(null);
          }
        },
        mimeType,
        0.92
      );
    });
  };

  const handleCropConfirm = async () => {
    const croppedFile = await createCroppedImage();
    if (!croppedFile) {
      toast({
        title: "Error",
        description: "Failed to process image.",
        variant: "destructive",
      });
      return;
    }
    await uploadFile(croppedFile);
    setCropDialogOpen(false);
    setImageSrc(null);
  };

  // -----------------------------------------------------------------------
  // Remove logic
  // -----------------------------------------------------------------------

  const handleRemove = async () => {
    if (!onRemove) {
      setImageUrl(null);
      onChange?.(null);
      return;
    }

    const result = onRemove();
    if (!result || !("then" in result)) {
      // synchronous / void remove
      setImageUrl(null);
      onChange?.(null);
      toast({ title: "Removed", description: config.removeMessage });
      return;
    }

    setIsRemoving(true);
    try {
      const res = await result;
      if (res.success) {
        setImageUrl(null);
        onChange?.(null);
        toast({ title: "Removed", description: config.removeMessage });
      } else {
        toast({
          title: "Error",
          description: res.error || "Failed to remove image.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const busy = isUploading || isRemoving;

  return (
    <>
      <div className={cn("space-y-2", className)}>
        {label && (
          <label className="text-sm font-medium text-foreground">{label}</label>
        )}

        {imageUrl ? (
          <div className="space-y-4">
            {/* Preview */}
            {isAvatarLike ? (
              <div className="relative w-24 h-24">
                <Avatar className="h-24 w-24 border-2 border-border">
                  <AvatarImage src={imageUrl} alt={label || "Photo"} />
                  <AvatarFallback className="text-xl bg-surface-soft text-repwell-teal-300 font-semibold">
                    {fallbackInitials}
                  </AvatarFallback>
                </Avatar>
                {!disabled && onRemove && (
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
            ) : variant === "banner" ? (
              <div className="relative w-full aspect-[3/1] rounded-lg overflow-hidden border border-border bg-muted">
                <NextImage
                  src={imageUrl}
                  alt="Cover photo"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            ) : (
              <div
                className={cn(
                  "relative flex items-center justify-center border border-border overflow-hidden",
                  config.previewClass
                )}
                style={
                  primaryColor
                    ? { backgroundColor: primaryColor + "10" }
                    : undefined
                }
              >
                <img
                  src={imageUrl}
                  alt={label || `${variant} preview`}
                  className="h-full w-full object-contain p-2"
                />
              </div>
            )}

            {/* Replace / Remove buttons (non-avatar variants) */}
            {!isAvatarLike && (
              <div className="flex items-center gap-3">
                <div {...getRootProps()}>
                  <input {...getInputProps()} />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Replace
                  </Button>
                </div>
                {onRemove && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemove}
                    disabled={busy}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {isRemoving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash className="h-4 w-4 mr-2" />
                    )}
                    Remove
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Dropzone */
          <div
            {...getRootProps()}
            className={cn(
              "relative flex w-full items-center justify-center rounded-lg border-2 border-dashed transition-all cursor-pointer",
              config.dropzoneClass,
              isDragActive
                ? "border-repwell-teal-300 bg-surface-soft"
                : "border-border hover:border-repwell-teal-300 hover:bg-repwell-sage-100/30 dark:hover:bg-repwell-teal-300/10",
              busy && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            <div className="absolute inset-0 bg-gradient-to-br from-repwell-sage-100/20 via-transparent to-repwell-teal-400/5 rounded-lg pointer-events-none" />

            <div className="relative flex flex-col items-center gap-2">
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-label animate-spin" />
              ) : isDragActive ? (
                <>
                  <Upload className="h-8 w-8 text-repwell-teal-300" />
                  <p className="text-sm text-repwell-teal-300 font-medium">
                    Drop your image here...
                  </p>
                </>
              ) : (
                <>
                  <User className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-heading">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {config.sizeHint} &middot; {config.dropHint}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className={config.dialogWidth}>
          <DialogHeader>
            <DialogTitle>{config.cropDialogTitle}</DialogTitle>
            <DialogDescription>
              {config.cropDialogDescription}
            </DialogDescription>
          </DialogHeader>

          <div
            className={cn(
              "relative w-full bg-black rounded-lg overflow-hidden",
              variant === "banner" ? "aspect-[3/1]" : "h-64"
            )}
          >
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={config.aspect}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                cropShape={config.cropShape}
                showGrid={config.cropShape !== "round"}
              />
            )}
          </div>

          <div className="flex items-center gap-4 px-2">
            <ZoomIn className="h-4 w-4 text-label flex-shrink-0" />
            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={1}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <span className="text-sm text-label w-12 text-right">
              {zoom.toFixed(1)}x
            </span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCropDialogOpen(false);
                setImageSrc(null);
              }}
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
                config.saveLabel
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
