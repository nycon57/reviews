"use client";

/* eslint-disable no-undef */
// FileReader and Image are browser globals available in client components

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  Image as ImageIcon,
  UploadSimple as Upload,
  Trash,
  MagnifyingGlassPlus as ZoomIn,
  SpinnerGap as Loader2,
  X,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { uploadCoverPhoto, removeCoverPhoto } from "@/lib/auth/profile-actions";
import { uploadMemberBanner } from "@/lib/organization/actions";
import { useToast } from "@/hooks/use-toast";

const COVER_WIDTH = 1200;
const COVER_HEIGHT = 400;
const ASPECT_RATIO = COVER_WIDTH / COVER_HEIGHT;

interface CoverPhotoUploadProps {
  currentBannerUrl?: string | null;
  onBannerChange?: (url: string | null) => void;
  /** When set, uploads banner for this user instead of the logged-in user */
  targetUserId?: string;
  /** When true, renders without Card wrapper for embedding inside another Card */
  embedded?: boolean;
}

export function CoverPhotoUpload({
  currentBannerUrl,
  onBannerChange,
  targetUserId,
  embedded = false,
}: CoverPhotoUploadProps) {
  const [bannerUrl, setBannerUrl] = useState<string | null>(
    currentBannerUrl || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (currentBannerUrl !== undefined) {
      setBannerUrl(currentBannerUrl || null);
    }
  }, [currentBannerUrl]);

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
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    disabled: isUploading || isRemoving,
  });

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const createCroppedImage = async (): Promise<File | null> => {
    if (!imageSrc || !croppedAreaPixels) return null;

    const image = new window.Image();
    image.src = imageSrc;

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Failed to load image for cropping"));
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = COVER_WIDTH;
    canvas.height = COVER_HEIGHT;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      COVER_WIDTH,
      COVER_HEIGHT
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], "cover.jpg", { type: "image/jpeg" }));
          } else {
            resolve(null);
          }
        },
        "image/jpeg",
        0.92
      );
    });
  };

  const handleCropConfirm = async () => {
    setIsUploading(true);
    try {
      const croppedFile = await createCroppedImage();
      if (!croppedFile) {
        toast({
          title: "Error",
          description: "Failed to process image.",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append("file", croppedFile);

      const result = targetUserId
        ? await uploadMemberBanner(targetUserId, formData)
        : await uploadCoverPhoto(formData);
      if (result.success && result.url) {
        setBannerUrl(result.url);
        onBannerChange?.(result.url);
        toast({
          title: "Cover photo updated",
          description: "Your cover photo has been saved.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to upload cover photo.",
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
      setCropDialogOpen(false);
      setImageSrc(null);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      const result = await removeCoverPhoto();
      if (result.success) {
        setBannerUrl(null);
        onBannerChange?.(null);
        toast({
          title: "Cover photo removed",
          description: "Your cover photo has been removed.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to remove cover photo.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong removing the cover photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const content = bannerUrl ? (
    <div className="space-y-4">
      {/* Preview */}
      <div className="relative w-full aspect-[3/1] rounded-lg overflow-hidden border border-border bg-muted">
        <Image
          src={bannerUrl}
          alt="Cover photo"
          fill
          className="object-cover"
        />
        {/* Overlay gradient matching public profile */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading || isRemoving}
          >
            <Upload className="h-4 w-4 mr-2" />
            Replace
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={isRemoving || isUploading}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          {isRemoving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Trash className="h-4 w-4 mr-2" />
          )}
          Remove
        </Button>
      </div>
    </div>
  ) : (
    /* Dropzone */
    <div
      {...getRootProps()}
      className={cn(
        "relative w-full aspect-[3/1] rounded-lg border-2 border-dashed transition-all cursor-pointer",
        "flex flex-col items-center justify-center gap-3",
        isDragActive
          ? "border-repwell-teal-300 bg-repwell-sage-100"
          : "border-border hover:border-repwell-teal-300 hover:bg-repwell-sage-100/30",
        (isUploading || isRemoving) && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-repwell-sage-100/20 via-transparent to-repwell-teal-400/5 rounded-lg pointer-events-none" />

      <div className="relative flex flex-col items-center gap-2">
        {isUploading ? (
          <Loader2 className="h-10 w-10 text-repwell-teal-400 animate-spin" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <Upload className="h-6 w-6 text-repwell-teal-400" />
          </div>
        )}
        {isDragActive ? (
          <p className="text-sm text-repwell-teal-300 font-medium">
            Drop your image here...
          </p>
        ) : (
          <>
            <p className="text-sm text-repwell-teal-400">
              <span className="font-medium text-repwell-teal-500">
                Click to upload
              </span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              Recommended: 1200 x 400px &middot; JPG, PNG or WebP (max
              10MB)
            </p>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {embedded ? (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Cover Photo</Label>
          {content}
        </div>
      ) : (
        <Card className="border border-border shadow-soft overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <ImageIcon className="h-5 w-5 text-repwell-teal-300" />
              </div>
              <div>
                <CardTitle className="text-lg">Cover Photo</CardTitle>
                <CardDescription>
                  This banner appears at the top of your public profile page
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {content}
          </CardContent>
        </Card>
      )}

      {/* Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop your cover photo</DialogTitle>
            <DialogDescription>
              Drag to reposition and use the slider to zoom. The image will be
              cropped to a 3:1 banner ratio.
            </DialogDescription>
          </DialogHeader>

          <div className="relative w-full aspect-[3/1] bg-black rounded-lg overflow-hidden">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={ASPECT_RATIO}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                showGrid
              />
            )}
          </div>

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
            <span className="text-sm text-repwell-teal-400 w-12 text-right">
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
                "Save cover photo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
