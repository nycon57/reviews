"use client";

/* eslint-disable no-undef */
// Image is a browser global available in client components

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, ImageIcon, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LogoUploadProps {
  currentLogoUrl?: string | null;
  onUpload: (file: File) => Promise<{ success: boolean; url?: string; error?: string }>;
  onColorExtracted?: (color: string) => void;
  className?: string;
  disabled?: boolean;
}

// Extract dominant color from an image using canvas
async function extractDominantColor(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve("#52796f"); // Default to repwell-teal-300
        return;
      }

      // Scale down for faster processing
      const scale = Math.min(1, 100 / Math.max(img.width, img.height));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Count colors, excluding very light (white/near-white) and very dark (black/near-black) pixels
      const colorCounts: Record<string, number> = {};

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        // Skip transparent pixels
        if (a < 128) continue;

        // Calculate perceived brightness
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        // Skip very light or very dark colors
        if (brightness > 240 || brightness < 15) continue;

        // Skip near-grayscale colors
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        if (maxC - minC < 30) continue;

        // Quantize colors to reduce noise (round to nearest 16)
        const qr = Math.round(r / 16) * 16;
        const qg = Math.round(g / 16) * 16;
        const qb = Math.round(b / 16) * 16;

        const key = `${qr},${qg},${qb}`;
        colorCounts[key] = (colorCounts[key] || 0) + 1;
      }

      // Find the most common color
      let maxCount = 0;
      let dominantColor = "82,121,111"; // Default repwell-teal-300 in RGB

      for (const [color, count] of Object.entries(colorCounts)) {
        if (count > maxCount) {
          maxCount = count;
          dominantColor = color;
        }
      }

      const [r, g, b] = dominantColor.split(",").map(Number);
      const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

      resolve(hex);
    };

    img.onerror = () => {
      resolve("#52796f"); // Default on error
    };

    img.src = imageUrl;
  });
}

export function LogoUpload({
  currentLogoUrl,
  onUpload,
  onColorExtracted,
  className,
  disabled = false,
}: LogoUploadProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedColor, setExtractedColor] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract color when logo URL changes
  useEffect(() => {
    if (logoUrl && onColorExtracted) {
      setIsExtracting(true);
      extractDominantColor(logoUrl)
        .then((color) => {
          setExtractedColor(color);
          onColorExtracted(color);
        })
        .finally(() => setIsExtracting(false));
    }
  }, [logoUrl, onColorExtracted]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setError(null);
      setIsUploading(true);

      try {
        // Create preview URL for immediate feedback
        const previewUrl = URL.createObjectURL(file);
        setLogoUrl(previewUrl);

        // Extract color from preview
        if (onColorExtracted) {
          setIsExtracting(true);
          const color = await extractDominantColor(previewUrl);
          setExtractedColor(color);
          onColorExtracted(color);
          setIsExtracting(false);
        }

        // Upload to server
        const result = await onUpload(file);

        if (result.success && result.url) {
          // Replace preview with actual URL
          URL.revokeObjectURL(previewUrl);
          setLogoUrl(result.url);
        } else {
          setError(result.error || "Upload failed");
          setLogoUrl(null);
          URL.revokeObjectURL(previewUrl);
        }
      } catch (err) {
        console.error("Upload error:", err);
        setError("An unexpected error occurred");
        setLogoUrl(null);
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, onColorExtracted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/svg+xml": [".svg"],
      "image/webp": [".webp"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    disabled: disabled || isUploading,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (logoUrl && logoUrl.startsWith("blob:")) {
      URL.revokeObjectURL(logoUrl);
    }
    setLogoUrl(null);
    setExtractedColor(null);
    setError(null);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload zone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
          "hover:border-repwell-teal-300 hover:bg-repwell-sage-100/30",
          isDragActive && "border-repwell-teal-300 bg-repwell-sage-100/50",
          (disabled || isUploading) && "opacity-50 cursor-not-allowed",
          error && "border-red-300 bg-red-50/50",
          logoUrl && !error && "border-repwell-sage-200 bg-repwell-sage-100/20"
        )}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {logoUrl && !error ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-4"
            >
              {/* Logo preview */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-lg bg-white border border-border flex items-center justify-center overflow-hidden shadow-sm">
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="max-w-full max-h-full object-contain p-2"
                  />
                </div>
                {/* Remove button */}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white shadow-sm"
                  onClick={handleRemove}
                  disabled={isUploading}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Info */}
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-repwell-teal-500">
                  Logo uploaded
                </p>
                <p className="text-xs text-repwell-teal-400 mt-1">
                  Click or drag to replace
                </p>
                {isUploading && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-repwell-teal-300">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>

              {/* Extracted color indicator */}
              {extractedColor && (
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 h-8 rounded-lg border border-border shadow-sm"
                    style={{ backgroundColor: extractedColor }}
                  />
                  {isExtracting ? (
                    <Loader2 className="h-3 w-3 animate-spin text-repwell-teal-300" />
                  ) : (
                    <span className="text-xs text-repwell-teal-400 flex items-center gap-1">
                      <Palette className="h-3 w-3" />
                      Auto
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-4"
            >
              <div className="w-14 h-14 rounded-xl bg-repwell-sage-100/50 flex items-center justify-center">
                {isUploading ? (
                  <Loader2 className="h-6 w-6 text-repwell-teal-300 animate-spin" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-repwell-teal-300" />
                )}
              </div>

              {isDragActive ? (
                <p className="text-sm font-medium text-repwell-teal-300">
                  Drop your logo here...
                </p>
              ) : (
                <>
                  <div className="space-y-1">
                    <p className="text-sm text-repwell-teal-400">
                      <span className="font-medium text-repwell-teal-500">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                    </p>
                    <p className="text-xs text-repwell-teal-400">
                      PNG, JPG, SVG, or WebP (max 5MB)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-repwell-sage-200">
                    <Palette className="h-3 w-3" />
                    Brand color will be auto-detected
                  </div>
                </>
              )}

              {error && (
                <p className="text-sm text-red-500 mt-2">{error}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
